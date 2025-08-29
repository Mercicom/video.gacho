import { 
  VideoAnalysisRequest, 
  VideoAnalysisResult, 
  QueueStatus, 
  RateLimitInfo, 
  VideoAnalysisApiResponse,
  DEFAULT_RATE_LIMIT_PER_MINUTE 
} from '@/types/video-analysis';

export type QueueProgressCallback = (status: QueueStatus) => void;
export type RateLimitUpdateCallback = (info: RateLimitInfo) => void;
export type ResultCallback = (result: VideoAnalysisResult) => void;

interface QueueItem {
  request: VideoAnalysisRequest;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: Date;
}

interface QueueState {
  items: QueueItem[];
  isProcessing: boolean;
  isPaused: boolean;
  rateLimitInfo: RateLimitInfo;
  statistics: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    startTime?: Date;
  };
}

const STORAGE_KEY = 'video-analysis-queue';
const MAX_RETRIES = 3;
const RETRY_BACKOFF_BASE = 2000; // 2 seconds base delay
const PROCESSING_DELAY = 6000; // 6 seconds between requests (10/minute)

export class VideoAnalysisQueue {
  private state: QueueState;
  private processingTimer: NodeJS.Timeout | null = null;
  private rateLimitTimer: NodeJS.Timeout | null = null;
  
  // Callbacks
  private progressCallback?: QueueProgressCallback;
  private rateLimitCallback?: RateLimitUpdateCallback;
  private resultCallback?: ResultCallback;
  
  constructor() {
    this.state = this.initializeState();
    this.loadFromStorage();
  }

  private initializeState(): QueueState {
    return {
      items: [],
      isProcessing: false,
      isPaused: false,
      rateLimitInfo: {
        remaining: DEFAULT_RATE_LIMIT_PER_MINUTE,
        resetTime: Date.now() + 60000,
        requestsInLastMinute: 0,
        maxRequestsPerMinute: DEFAULT_RATE_LIMIT_PER_MINUTE,
      },
      statistics: {
        totalProcessed: 0,
        successCount: 0,
        errorCount: 0,
      },
    };
  }

  // Event subscription methods
  onProgress(callback: QueueProgressCallback): void {
    this.progressCallback = callback;
  }

  onRateLimitUpdate(callback: RateLimitUpdateCallback): void {
    this.rateLimitCallback = callback;
  }

  onResult(callback: ResultCallback): void {
    this.resultCallback = callback;
  }

  // Queue management
  addToQueue(request: VideoAnalysisRequest): void {
    const queueItem: QueueItem = {
      request,
      retryCount: 0,
      maxRetries: MAX_RETRIES,
    };

    this.state.items.push(queueItem);
    this.saveToStorage();
    this.notifyProgress();
  }

  addMultipleToQueue(requests: VideoAnalysisRequest[]): void {
    const queueItems: QueueItem[] = requests.map(request => ({
      request,
      retryCount: 0,
      maxRetries: MAX_RETRIES,
    }));

    this.state.items.push(...queueItems);
    this.saveToStorage();
    this.notifyProgress();
  }

  startProcessing(): void {
    if (this.state.isProcessing) return;
    
    this.state.isProcessing = true;
    this.state.isPaused = false;
    this.state.statistics.startTime = new Date();
    
    this.saveToStorage();
    this.notifyProgress();
    
    this.processNext();
  }

  pauseProcessing(): void {
    this.state.isPaused = true;
    this.clearTimers();
    this.saveToStorage();
    this.notifyProgress();
  }

  resumeProcessing(): void {
    if (!this.state.isProcessing) return;
    
    this.state.isPaused = false;
    this.saveToStorage();
    this.notifyProgress();
    
    this.processNext();
  }

  stopProcessing(): void {
    this.state.isProcessing = false;
    this.state.isPaused = false;
    this.clearTimers();
    this.saveToStorage();
    this.notifyProgress();
  }

  clearQueue(): void {
    this.stopProcessing();
    this.state.items = [];
    this.resetStatistics();
    this.saveToStorage();
    this.notifyProgress();
  }

  removeFromQueue(requestId: string): void {
    this.state.items = this.state.items.filter(item => item.request.id !== requestId);
    this.saveToStorage();
    this.notifyProgress();
  }

  retryFailedItem(requestId: string): void {
    const item = this.state.items.find(item => item.request.id === requestId);
    if (item) {
      item.retryCount = 0;
      item.lastAttempt = undefined;
      
      if (!this.state.isProcessing) {
        this.startProcessing();
      }
    }
  }

  // Queue status
  getQueueStatus(): QueueStatus {
    const totalInQueue = this.state.items.length;
    const position = this.state.isProcessing ? Math.max(1, totalInQueue) : 0;
    const estimatedWaitTime = totalInQueue * (PROCESSING_DELAY / 1000);

    return {
      position,
      estimatedWaitTime,
      isProcessing: this.state.isProcessing,
      isPaused: this.state.isPaused,
      totalInQueue,
      completedCount: this.state.statistics.successCount,
      errorCount: this.state.statistics.errorCount,
    };
  }

  getRateLimitInfo(): RateLimitInfo {
    return { ...this.state.rateLimitInfo };
  }

  getStatistics() {
    return { ...this.state.statistics };
  }

  // Private processing methods
  private async processNext(): Promise<void> {
    if (!this.state.isProcessing || this.state.isPaused || this.state.items.length === 0) {
      if (this.state.items.length === 0 && this.state.isProcessing) {
        // Queue is empty, stop processing
        this.stopProcessing();
      }
      return;
    }

    // Check rate limit
    if (this.state.rateLimitInfo.remaining <= 0) {
      const waitTime = this.state.rateLimitInfo.resetTime - Date.now();
      if (waitTime > 0) {
        this.rateLimitTimer = setTimeout(() => this.processNext(), waitTime);
        return;
      } else {
        // Reset rate limit
        this.state.rateLimitInfo.remaining = this.state.rateLimitInfo.maxRequestsPerMinute;
        this.state.rateLimitInfo.resetTime = Date.now() + 60000;
        this.state.rateLimitInfo.requestsInLastMinute = 0;
        this.notifyRateLimit();
      }
    }

    const item = this.state.items.shift();
    if (!item) return;

    item.lastAttempt = new Date();
    
    try {
      const result = await this.processVideoAnalysis(item.request);
      
      // Success
      this.state.statistics.successCount++;
      this.state.statistics.totalProcessed++;
      
      // Update rate limit
      this.state.rateLimitInfo.remaining = Math.max(0, this.state.rateLimitInfo.remaining - 1);
      this.state.rateLimitInfo.requestsInLastMinute++;
      
      this.saveToStorage();
      this.notifyProgress();
      this.notifyRateLimit();
      this.notifyResult(result);
      
    } catch (error) {
      // Handle error
      await this.handleProcessingError(item, error);
    }

    // Schedule next item
    this.processingTimer = setTimeout(() => this.processNext(), PROCESSING_DELAY);
  }

  private async processVideoAnalysis(request: VideoAnalysisRequest): Promise<VideoAnalysisResult> {
    const formData = new FormData();
    formData.append('video', request.videoFile);
    formData.append('options', JSON.stringify(request.analysisOptions));

    const response = await fetch('/api/gemini/analyze-video', {
      method: 'POST',
      body: formData,
    });

    const apiResponse: VideoAnalysisApiResponse = await response.json();

    // Update rate limit info from API response
    if (apiResponse.rateLimitInfo) {
      this.state.rateLimitInfo = apiResponse.rateLimitInfo;
      this.notifyRateLimit();
    }

    if (!apiResponse.success || !apiResponse.data) {
      throw new Error(apiResponse.error?.message || 'Analysis failed');
    }

    // Convert API response to VideoAnalysisResult
    const result: VideoAnalysisResult = {
      id: request.id,
      filename: request.filename,
      status: 'completed',
      visualHook: apiResponse.data.visualHook,
      textHook: apiResponse.data.textHook,
      voiceHook: apiResponse.data.voiceHook,
      videoScript: apiResponse.data.videoScript,
      painPoint: apiResponse.data.painPoint,
      processingTime: apiResponse.data.processingTime,
      createdAt: request.createdAt,
      completedAt: new Date(),
    };

    return result;
  }

  private async handleProcessingError(item: QueueItem, error: unknown): Promise<void> {
    item.retryCount++;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRetryable = this.isRetryableError(errorMessage);
    
    if (isRetryable && item.retryCount < item.maxRetries) {
      // Retry with exponential backoff
      const backoffDelay = RETRY_BACKOFF_BASE * Math.pow(2, item.retryCount - 1);
      
      setTimeout(() => {
        this.state.items.unshift(item); // Add back to front of queue
        this.saveToStorage();
        this.notifyProgress();
      }, backoffDelay);
      
    } else {
      // Permanent failure
      this.state.statistics.errorCount++;
      this.state.statistics.totalProcessed++;
      
      const errorResult: VideoAnalysisResult = {
        id: item.request.id,
        filename: item.request.filename,
        status: 'error',
        error: errorMessage,
        createdAt: item.request.createdAt,
        completedAt: new Date(),
      };
      
      this.notifyResult(errorResult);
    }
    
    this.saveToStorage();
    this.notifyProgress();
  }

  private isRetryableError(errorMessage: string): boolean {
    const retryableErrors = [
      'network',
      'timeout',
      'rate limit',
      'temporary',
      'service unavailable',
      'internal server error',
    ];
    
    const lowerMessage = errorMessage.toLowerCase();
    return retryableErrors.some(error => lowerMessage.includes(error));
  }

  private clearTimers(): void {
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = null;
    }
    
    if (this.rateLimitTimer) {
      clearTimeout(this.rateLimitTimer);
      this.rateLimitTimer = null;
    }
  }

  private resetStatistics(): void {
    this.state.statistics = {
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
    };
  }

  // Notification methods
  private notifyProgress(): void {
    if (this.progressCallback) {
      this.progressCallback(this.getQueueStatus());
    }
  }

  private notifyRateLimit(): void {
    if (this.rateLimitCallback) {
      this.rateLimitCallback(this.getRateLimitInfo());
    }
  }

  private notifyResult(result: VideoAnalysisResult): void {
    if (this.resultCallback) {
      this.resultCallback(result);
    }
  }

  // Persistence methods
  private saveToStorage(): void {
    try {
      const serializedState = {
        ...this.state,
        items: this.state.items.map(item => ({
          ...item,
          // Convert File objects to basic info (can't serialize Files)
          request: {
            ...item.request,
            videoFile: {
              name: item.request.videoFile.name,
              size: item.request.videoFile.size,
              type: item.request.videoFile.type,
              // Note: File content is lost in persistence
            } as any,
          },
        })),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedState));
    } catch (error) {
      console.warn('Failed to save queue state to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        
        // Note: We can't restore File objects from localStorage
        // This is mainly for restoring queue metadata and statistics
        if (parsedState.rateLimitInfo) {
          this.state.rateLimitInfo = parsedState.rateLimitInfo;
        }
        
        if (parsedState.statistics) {
          this.state.statistics = parsedState.statistics;
        }
        
        // Don't restore items since File objects can't be serialized
        // The UI will need to handle queue restoration differently
      }
    } catch (error) {
      console.warn('Failed to load queue state from localStorage:', error);
    }
  }

  // Cleanup method
  destroy(): void {
    this.clearTimers();
    this.progressCallback = undefined;
    this.rateLimitCallback = undefined;
    this.resultCallback = undefined;
  }
}

// Singleton instance
let queueInstance: VideoAnalysisQueue | null = null;

export function getVideoAnalysisQueue(): VideoAnalysisQueue {
  if (!queueInstance) {
    queueInstance = new VideoAnalysisQueue();
  }
  return queueInstance;
}

export function destroyVideoAnalysisQueue(): void {
  if (queueInstance) {
    queueInstance.destroy();
    queueInstance = null;
  }
} 