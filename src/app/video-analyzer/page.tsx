"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { 
  Play, 
  Upload as UploadIcon, 
  BarChart3, 
  Settings,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key
} from "lucide-react";
import VideoUpload from "@/components/VideoUpload";
import VideoAnalysisTable from "@/components/VideoAnalysisTable";
import RateLimitManager from "@/components/RateLimitManager";
import ApiKeySettings, { getStoredApiKey, hasStoredApiKey } from "@/components/ApiKeySettings";
import { 
  UploadedVideo, 
  VideoAnalysisResult, 
  QueueStatus, 
  RateLimitInfo,
  AnalysisOptions,
  DEFAULT_RATE_LIMIT_PER_MINUTE,
  DEFAULT_MAX_VIDEOS_PER_BATCH
} from "@/types/video-analysis";

// Persistent storage keys
const STORAGE_KEYS = {
  ANALYSIS_RESULTS: 'video-analysis-results',
  QUEUE_STATUS: 'video-analysis-queue-status',
  RATE_LIMIT_INFO: 'video-analysis-rate-limit',
  PROCESSING_STATS: 'video-analysis-stats',
  ANALYSIS_OPTIONS: 'video-analysis-options',
  SESSION_ID: 'video-analysis-session-id'
};

type AnalysisStep = 'upload' | 'configure' | 'analyze' | 'results';

export default function VideoAnalyzerPage() {
  // API Key state
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyChecked, setApiKeyChecked] = useState(false);

  // Core state
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('upload');
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [analysisResults, setAnalysisResults] = useState<VideoAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analysis configuration
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    includeVisualHook: true,
    includeTextHook: true,
    includeVoiceHook: true,
    includeVideoScript: true,
    includePainPoint: true,
  });

  // Queue and rate limiting state
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    position: 0,
    estimatedWaitTime: 0,
    isProcessing: false,
    isPaused: false,
    totalInQueue: 0,
    completedCount: 0,
    errorCount: 0,
  });

  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>({
    remaining: DEFAULT_RATE_LIMIT_PER_MINUTE,
    resetTime: Date.now() + 60000,
    requestsInLastMinute: 0,
    maxRequestsPerMinute: DEFAULT_RATE_LIMIT_PER_MINUTE,
  });

  // Enhanced processing queue for large batches
  const processingQueue = useRef<string[]>([]);
  const processingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [batchSize, setBatchSize] = useState(50); // Process in batches for better UI responsiveness
  const [processingStartTime, setProcessingStartTime] = useState<Date | null>(null);
  const [processingStats, setProcessingStats] = useState({
    avgProcessingTime: 0,
    successRate: 0,
    totalElapsedTime: 0,
  });
  
  const [sessionId, setSessionId] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // Mark as client-side to prevent hydration mismatches
    setIsClient(true);
    
    // Get or create session ID for persistence (client-only)
    try {
      const existing = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
      if (existing) {
        setSessionId(existing);
        return;
      }
      const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, newId);
      setSessionId(newId);
    } catch (err) {
      // ignore storage errors in non-browser environments
      console.warn('Storage not available:', err);
    }
  }, []);

  // Check for API key on page load
  useEffect(() => {
    if (isClient && !apiKeyChecked) {
      const storedKey = getStoredApiKey();
      if (storedKey) {
        setApiKey(storedKey);
      } else {
        // Show modal if no API key found
        setShowApiKeyModal(true);
      }
      setApiKeyChecked(true);
    }
  }, [isClient, apiKeyChecked]);

  // Handler for saving API key
  const handleApiKeySave = useCallback((key: string) => {
    setApiKey(key);
    setShowApiKeyModal(false);
  }, []);

  // Persistent storage helpers
  const saveToStorage = useCallback(() => {
    if (!isClient) return; // Don't save during SSR
    try {
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_RESULTS, JSON.stringify(analysisResults));
      localStorage.setItem(STORAGE_KEYS.QUEUE_STATUS, JSON.stringify(queueStatus));
      localStorage.setItem(STORAGE_KEYS.RATE_LIMIT_INFO, JSON.stringify(rateLimitInfo));
      localStorage.setItem(STORAGE_KEYS.PROCESSING_STATS, JSON.stringify(processingStats));
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_OPTIONS, JSON.stringify(analysisOptions));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, [isClient, analysisResults, queueStatus, rateLimitInfo, processingStats, analysisOptions]);

  const loadFromStorage = useCallback(() => {
    if (!isClient) return; // Don't load during SSR
    try {
      const savedResults = localStorage.getItem(STORAGE_KEYS.ANALYSIS_RESULTS);
      const savedQueueStatus = localStorage.getItem(STORAGE_KEYS.QUEUE_STATUS);
      const savedRateLimit = localStorage.getItem(STORAGE_KEYS.RATE_LIMIT_INFO);
      const savedStats = localStorage.getItem(STORAGE_KEYS.PROCESSING_STATS);
      const savedOptions = localStorage.getItem(STORAGE_KEYS.ANALYSIS_OPTIONS);

      if (savedResults) {
        const results = JSON.parse(savedResults);
        setAnalysisResults(results);
        if (results.length > 0) {
          setCurrentStep('results');
        }
      }

      if (savedQueueStatus) {
        const status = JSON.parse(savedQueueStatus);
        // Don't restore processing state to avoid confusion
        setQueueStatus({
          ...status,
          isProcessing: false,
          isPaused: false,
        });
      }

      if (savedRateLimit) {
        const rateLimit = JSON.parse(savedRateLimit);
        // Only restore if not expired
        if (rateLimit.resetTime > Date.now()) {
          setRateLimitInfo(rateLimit);
        }
      }

      if (savedStats) {
        setProcessingStats(JSON.parse(savedStats));
      }

      if (savedOptions) {
        setAnalysisOptions(JSON.parse(savedOptions));
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }, [isClient]);

  const clearStorage = useCallback(() => {
    if (!isClient) return; // Don't clear during SSR
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, [isClient]);

  // Load from storage on component mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Save to storage when state changes
  useEffect(() => {
    if (analysisResults.length > 0) {
      saveToStorage();
    }
  }, [analysisResults, queueStatus, rateLimitInfo, processingStats, analysisOptions, saveToStorage]);

  // Handle video upload changes
  const handleVideosChange = useCallback((videos: UploadedVideo[]) => {
    setUploadedVideos(videos);
    
    // Auto-advance to configure step if videos are uploaded
    if (videos.length > 0 && currentStep === 'upload') {
      setCurrentStep('configure');
    } else if (videos.length === 0) {
      setCurrentStep('upload');
    }
  }, [currentStep]);

  // Enhanced start analysis process for large batches
  const startAnalysis = useCallback(async () => {
    if (uploadedVideos.length === 0) return;

    // Check for API key
    if (!apiKey) {
      alert('Please configure your Google Gemini API key first. Click the settings icon to add your key.');
      setShowApiKeyModal(true);
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep('analyze');
    setProcessingStartTime(new Date());

    // Initialize queue
    const videoIds = uploadedVideos.map(v => v.id);
    processingQueue.current = [...videoIds];
    
    // Calculate more accurate estimated wait time
    const estimatedTimePerVideo = 60 / rateLimitInfo.maxRequestsPerMinute; // seconds per video
    const totalEstimatedTime = videoIds.length * estimatedTimePerVideo;
    
    setQueueStatus({
      position: videoIds.length,
      estimatedWaitTime: totalEstimatedTime,
      isProcessing: true,
      isPaused: false,
      totalInQueue: videoIds.length,
      completedCount: 0,
      errorCount: 0,
    });

    // Initialize analysis results with batching for large lists
    const initialResults: VideoAnalysisResult[] = uploadedVideos.map(video => ({
      id: video.id,
      filename: video.filename,
      status: 'pending',
      createdAt: new Date(),
    }));
    setAnalysisResults(initialResults);

    // Start processing
    processNextVideo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedVideos, rateLimitInfo.maxRequestsPerMinute, apiKey]);

  // Enhanced process videos with better queue management for large batches
  const processNextVideo = useCallback(async () => {
    if (processingQueue.current.length === 0) {
      // Analysis complete
      setQueueStatus(prev => ({
        ...prev,
        isProcessing: false,
        position: 0,
        estimatedWaitTime: 0,
      }));
      setCurrentStep('results');
      setIsAnalyzing(false);
      return;
    }

    // Check rate limit with better handling
    if (rateLimitInfo.remaining <= 0) {
      const waitTime = rateLimitInfo.resetTime - Date.now();
      if (waitTime > 0) {
        console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s before next request.`);
        processingTimeout.current = setTimeout(processNextVideo, waitTime);
        return;
      } else {
        // Reset rate limit
        setRateLimitInfo(prev => ({
          ...prev,
          remaining: prev.maxRequestsPerMinute,
          resetTime: Date.now() + 60000,
          requestsInLastMinute: 0,
        }));
      }
    }

    const videoId = processingQueue.current.shift()!;
    const video = uploadedVideos.find(v => v.id === videoId);
    
    if (!video) {
      // Video not found, continue with next
      setTimeout(processNextVideo, 100);
      return;
    }

    // Update status to processing
    setAnalysisResults(prev => 
      prev.map(result => 
        result.id === videoId 
          ? { ...result, status: 'processing' as const }
          : result
      )
    );

    // Update queue status with better time estimation
    const remainingVideos = processingQueue.current.length;
    const estimatedTimePerVideo = 60 / rateLimitInfo.maxRequestsPerMinute;
    const dynamicEstimatedTime = remainingVideos * estimatedTimePerVideo;
    
    setQueueStatus(prev => ({
      ...prev,
      position: remainingVideos,
      estimatedWaitTime: dynamicEstimatedTime,
    }));

    try {
      // Make API call with timeout handling
      const startTime = Date.now();
      const formData = new FormData();
      formData.append('video', video.file);
      formData.append('options', JSON.stringify(analysisOptions));
      formData.append('apiKey', apiKey); // Pass user's API key

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const response = await fetch('/api/gemini/analyze-video', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const apiResult = await response.json();
      const processingTime = Date.now() - startTime;

      if (!response.ok || !apiResult.success) {
        // Handle rate limit errors specifically
        if (response.status === 429) {
          const retryAfter = apiResult.error?.details?.retryAfter || 60;
          console.log(`Rate limited. Retrying after ${retryAfter} seconds.`);
          
          // Put video back in queue and wait
          processingQueue.current.unshift(videoId);
          processingTimeout.current = setTimeout(processNextVideo, retryAfter * 1000);
          return;
        }
        
        throw new Error(apiResult.error?.message || 'Analysis failed');
      }

      // Process successful result
      const result: VideoAnalysisResult = {
        id: videoId,
        filename: video.filename,
        status: 'completed',
        visualHook: apiResult.data?.visualHook,
        textHook: apiResult.data?.textHook,
        voiceHook: apiResult.data?.voiceHook,
        videoScript: apiResult.data?.videoScript,
        painPoint: apiResult.data?.painPoint,
        processingTime: apiResult.data?.processingTime || processingTime,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      // Update with real results
      setAnalysisResults(prev => 
        prev.map(resultItem => 
          resultItem.id === videoId ? result : resultItem
        )
      );

      setQueueStatus(prev => ({
        ...prev,
        completedCount: prev.completedCount + 1,
      }));

      // Update processing statistics
      setProcessingStats(prev => {
        const newCompletedCount = queueStatus.completedCount + 1;
        const newAvgTime = ((prev.avgProcessingTime * (newCompletedCount - 1)) + processingTime) / newCompletedCount;
        const successRate = newCompletedCount / (newCompletedCount + queueStatus.errorCount);
        const totalElapsed = processingStartTime ? Date.now() - processingStartTime.getTime() : 0;
        
        return {
          avgProcessingTime: newAvgTime,
          successRate,
          totalElapsedTime: totalElapsed,
        };
      });

      // Update rate limit with real API response data
      if (apiResult.rateLimitInfo) {
        setRateLimitInfo(apiResult.rateLimitInfo);
      } else {
        setRateLimitInfo(prev => ({
          ...prev,
          remaining: Math.max(0, prev.remaining - 1),
          requestsInLastMinute: prev.requestsInLastMinute + 1,
        }));
      }

    } catch (error) {
      let errorMessage = 'Analysis failed';
      let shouldRetry = false;

      if (error instanceof Error) {
        errorMessage = error.message;
        // Check if error is retryable
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - video may be too large or complex';
          shouldRetry = true;
        } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          shouldRetry = true;
        }
      }

      // Handle retryable errors (put back in queue with retry count)
      if (shouldRetry && !(video as any).retryCount) {
        (video as any).retryCount = 1;
        processingQueue.current.push(videoId);
        console.log(`Retrying video ${video.filename} due to ${errorMessage}`);
      } else {
        // Handle permanent error
        setAnalysisResults(prev => 
          prev.map(result => 
            result.id === videoId 
              ? { 
                  ...result, 
                  status: 'error' as const,
                  error: errorMessage,
                  completedAt: new Date(),
                }
              : result
          )
        );

        setQueueStatus(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1,
        }));
      }
    }

    // Dynamic delay based on current rate limit
    const delay = rateLimitInfo.remaining > 0 
      ? Math.max(1000, 60000 / rateLimitInfo.maxRequestsPerMinute) // Minimum 1 second delay
      : 60000; // Wait full minute if no requests remaining
    
    processingTimeout.current = setTimeout(processNextVideo, delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedVideos, analysisOptions, rateLimitInfo, apiKey]);

  // Queue control handlers
  const pauseProcessing = useCallback(() => {
    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current);
      processingTimeout.current = null;
    }
    setQueueStatus(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeProcessing = useCallback(() => {
    setQueueStatus(prev => ({ ...prev, isPaused: false }));
    processNextVideo();
  }, [processNextVideo]);

  const stopProcessing = useCallback(() => {
    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current);
      processingTimeout.current = null;
    }
    processingQueue.current = [];
    setQueueStatus(prev => ({
      ...prev,
      isProcessing: false,
      isPaused: false,
      position: 0,
      estimatedWaitTime: 0,
    }));
    setIsAnalyzing(false);
  }, []);

  const handleClearSession = useCallback(() => {
    if (window.confirm('This will clear all analysis results and reset the session. Are you sure?')) {
      clearStorage();
      setAnalysisResults([]);
      setUploadedVideos([]);
      setCurrentStep('upload');
      setIsAnalyzing(false);
      stopProcessing();
      setProcessingStats({
        avgProcessingTime: 0,
        successRate: 0,
        totalElapsedTime: 0,
      });
    }
  }, [clearStorage, stopProcessing]);

  // Result handlers
  const handleRetry = useCallback((resultId: string) => {
    const result = analysisResults.find(r => r.id === resultId);
    if (result && result.status === 'error') {
      processingQueue.current.push(resultId);
      setAnalysisResults(prev => 
        prev.map(r => r.id === resultId ? { ...r, status: 'pending' as const, error: undefined } : r)
      );
      
      if (!queueStatus.isProcessing) {
        setQueueStatus(prev => ({
          ...prev,
          isProcessing: true,
          totalInQueue: prev.totalInQueue + 1,
          errorCount: Math.max(0, prev.errorCount - 1),
        }));
        processNextVideo();
      }
    }
  }, [analysisResults, queueStatus.isProcessing, processNextVideo]);

  const handleDelete = useCallback((resultId: string) => {
    setAnalysisResults(prev => prev.filter(r => r.id !== resultId));
  }, []);

  // Batch operations for large datasets
  const handleRetryAllFailed = useCallback(() => {
    const failedResults = analysisResults.filter(r => r.status === 'error');
    if (failedResults.length === 0) return;

    failedResults.forEach(result => {
      processingQueue.current.push(result.id);
      setAnalysisResults(prev => 
        prev.map(r => r.id === result.id ? { ...r, status: 'pending' as const, error: undefined } : r)
      );
    });

    setQueueStatus(prev => ({
      ...prev,
      isProcessing: true,
      totalInQueue: prev.totalInQueue + failedResults.length,
      errorCount: Math.max(0, prev.errorCount - failedResults.length),
    }));

    if (!isAnalyzing) {
      setIsAnalyzing(true);
      processNextVideo();
    }
  }, [analysisResults, isAnalyzing, processNextVideo]);

  const handleDeleteSelected = useCallback((selectedIds: string[]) => {
    setAnalysisResults(prev => prev.filter(r => !selectedIds.includes(r.id)));
  }, []);

  const handleRetrySelected = useCallback((selectedIds: string[]) => {
    const selectedResults = analysisResults.filter(r => selectedIds.includes(r.id) && r.status === 'error');
    if (selectedResults.length === 0) return;

    selectedResults.forEach(result => {
      processingQueue.current.push(result.id);
      setAnalysisResults(prev => 
        prev.map(r => r.id === result.id ? { ...r, status: 'pending' as const, error: undefined } : r)
      );
    });

    setQueueStatus(prev => ({
      ...prev,
      isProcessing: true,
      totalInQueue: prev.totalInQueue + selectedResults.length,
      errorCount: Math.max(0, prev.errorCount - selectedResults.length),
    }));

    if (!isAnalyzing) {
      setIsAnalyzing(true);
      processNextVideo();
    }
  }, [analysisResults, isAnalyzing, processNextVideo]);

  const handleExport = useCallback((format: 'csv' | 'json', results: VideoAnalysisResult[]) => {
    try {
      if (format === 'csv') {
        import('@/lib/utils/exportUtils').then(({ exportToCSV }) => {
          exportToCSV(results);
        });
      } else {
        import('@/lib/utils/exportUtils').then(({ exportToJSON }) => {
          exportToJSON(results);
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, []);

  // Get step indicator
  const getStepStatus = (step: AnalysisStep) => {
    const stepOrder: AnalysisStep[] = ['upload', 'configure', 'analyze', 'results'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: AnalysisStep) => {
    const status = getStepStatus(step);
    const iconClass = `w-5 h-5 ${
      status === 'completed' ? 'text-green-600' : 
      status === 'current' ? 'text-blue-600' : 
      'text-gray-400'
    }`;

    switch (step) {
      case 'upload': return <UploadIcon className={iconClass} />;
      case 'configure': return <Settings className={iconClass} />;
      case 'analyze': return <BarChart3 className={iconClass} />;
      case 'results': return <CheckCircle2 className={iconClass} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Video Analyzer</h1>
              <p className="mt-2 text-lg text-gray-600">
                Analyze videos in bulk to extract visual hooks, text hooks, voice hooks, scripts, and pain points using AI-powered insights.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* API Key Status */}
              {apiKey ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">API Key Configured</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700 font-medium">API Key Required</span>
                </div>
              )}
              {/* Settings Button */}
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Configure API Key"
              >
                <Key className="w-4 h-4" />
                <span className="text-sm font-medium">API Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between bg-white rounded-lg p-6 shadow-sm">
            {(['upload', 'configure', 'analyze', 'results'] as AnalysisStep[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center gap-3 ${
                  getStepStatus(step) === 'current' ? 'text-blue-600' : 
                  getStepStatus(step) === 'completed' ? 'text-green-600' : 
                  'text-gray-400'
                }`}>
                  <div className={`p-2 rounded-full ${
                    getStepStatus(step) === 'current' ? 'bg-blue-100' : 
                    getStepStatus(step) === 'completed' ? 'bg-green-100' : 
                    'bg-gray-100'
                  }`}>
                    {getStepIcon(step)}
                  </div>
                  <span className="font-medium capitalize">{step}</span>
                </div>
                {index < 3 && (
                  <div className={`ml-4 w-8 h-0.5 ${
                    getStepStatus(step) === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Upload & Configure */}
          <div className="xl:col-span-2 space-y-8">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UploadIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Upload Videos</h2>
                  <p className="text-sm text-gray-500">
                    Upload up to {DEFAULT_MAX_VIDEOS_PER_BATCH} videos for analysis
                  </p>
                </div>
              </div>
              
              <VideoUpload
                onVideosChange={handleVideosChange}
                maxFiles={DEFAULT_MAX_VIDEOS_PER_BATCH}
                maxSizePerFile={100}
                disabled={isAnalyzing}
              />
            </div>

            {/* Configuration Section */}
            {uploadedVideos.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Analysis Configuration</h2>
                    <p className="text-sm text-gray-500">
                      Choose which insights to extract from your videos
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(analysisOptions).map(([key, enabled]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => 
                          setAnalysisOptions(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))
                        }
                        disabled={isAnalyzing}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/include /i, '')}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={startAnalysis}
                    disabled={isAnalyzing || uploadedVideos.length === 0 || !Object.values(analysisOptions).some(Boolean)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    {isAnalyzing ? 'Analyzing...' : `Analyze ${uploadedVideos.length} Video${uploadedVideos.length > 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            )}

            {/* Results Section */}
            {analysisResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
                    <p className="text-sm text-gray-500">
                      Review and export your video analysis insights
                    </p>
                  </div>
                </div>

                <VideoAnalysisTable
                  results={analysisResults}
                  onRetry={handleRetry}
                  onDelete={handleDelete}
                  onExport={handleExport}
                  onRetryAllFailed={handleRetryAllFailed}
                  onDeleteSelected={handleDeleteSelected}
                  onRetrySelected={handleRetrySelected}
                  loading={isAnalyzing}
                />
              </div>
            )}
          </div>

          {/* Right Column - Queue Management */}
          <div className="space-y-8">
            {/* Info Panel */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">How it works</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Upload multiple video files (up to {DEFAULT_MAX_VIDEOS_PER_BATCH})</li>
                    <li>• Choose analysis options</li>
                    <li>• AI analyzes videos with rate limiting</li>
                    <li>• Export results as CSV or JSON</li>
                    <li>• Progress is automatically saved</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Session Management */}
            {analysisResults.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900 mb-1">Session Active</p>
                      <p className="text-amber-700 text-xs">
                        Session ID: {sessionId.slice(-8)}
                      </p>
                      <p className="text-amber-700 text-xs">
                        {analysisResults.length} results saved locally
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearSession}
                    className="text-xs text-amber-700 hover:text-amber-900 underline"
                  >
                    Clear Session
                  </button>
                </div>
              </div>
            )}

            {/* Rate Limit Manager */}
            {(isAnalyzing || analysisResults.length > 0) && (
              <RateLimitManager
                queueStatus={queueStatus}
                rateLimitInfo={rateLimitInfo}
                onPause={pauseProcessing}
                onResume={resumeProcessing}
                onStop={stopProcessing}
              />
            )}
          </div>
        </div>
      </div>

      {/* API Key Settings Modal */}
      <ApiKeySettings
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySave}
        currentKey={apiKey}
      />
    </div>
  );
} 
