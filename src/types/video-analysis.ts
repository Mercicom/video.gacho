// Video Analysis Type Definitions

export interface VideoAnalysisRequest {
  id: string;
  videoFile: File;
  filename: string;
  analysisOptions?: AnalysisOptions;
  createdAt: Date;
}

export interface VideoAnalysisResult {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  visualHook?: string;
  textHook?: string;
  voiceHook?: string;
  videoScript?: string;
  painPoint?: string;
  processingTime?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface VideoAnalysisSession {
  id: string;
  createdAt: Date;
  videos: UploadedVideo[];
  results: VideoAnalysisResult[];
  status: 'uploading' | 'analyzing' | 'completed' | 'paused';
  progress: {
    total: number;
    completed: number;
    failed: number;
    processing: number;
  };
}

export interface AnalysisOptions {
  includeVisualHook: boolean;
  includeTextHook: boolean;
  includeVoiceHook: boolean;
  includeVideoScript: boolean;
  includePainPoint: boolean;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  requestsInLastMinute: number;
  maxRequestsPerMinute: number;
}

export interface UploadedVideo {
  id: string;
  file: File;
  filename: string;
  size: number;
  duration?: number;
  thumbnail?: string;
  uploadedAt: Date;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
}

export interface QueueStatus {
  position: number;
  estimatedWaitTime: number;
  isProcessing: boolean;
  isPaused: boolean;
  totalInQueue: number;
  completedCount: number;
  errorCount: number;
}

export interface VideoAnalysisApiResponse {
  success: boolean;
  data?: {
    id: string;
    visualHook: string;
    textHook: string;
    voiceHook: string;
    videoScript: string;
    painPoint: string;
    processingTime: number;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  rateLimitInfo: RateLimitInfo;
}

export interface VideoUploadProps {
  onVideosChange: (files: UploadedVideo[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  acceptedFormats?: string[];
  disabled?: boolean;
}

export interface VideoAnalysisTableProps {
  results: VideoAnalysisResult[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (format: 'csv' | 'json', results: VideoAnalysisResult[]) => void;
  onRetryAllFailed?: () => void;
  onDeleteSelected?: (selectedIds: string[]) => void;
  onRetrySelected?: (selectedIds: string[]) => void;
  loading?: boolean;
}

export interface RateLimitManagerProps {
  queueStatus: QueueStatus;
  rateLimitInfo: RateLimitInfo;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

// Error types
export interface VideoAnalysisError {
  type: 'upload' | 'api' | 'rate_limit' | 'network' | 'validation';
  message: string;
  code?: string;
  retryable: boolean;
  details?: any;
}

// Storage interface for persisting data
export interface StoredAnalysisSession {
  sessionId: string;
  results: VideoAnalysisResult[];
  queueState: {
    queue: VideoAnalysisRequest[];
    rateLimitInfo: RateLimitInfo;
    lastProcessedAt: number;
  };
  savedAt: Date;
}

// Export configuration
export interface ExportConfig {
  format: 'csv' | 'json';
  includeFields: {
    filename: boolean;
    visualHook: boolean;
    textHook: boolean;
    voiceHook: boolean;
    videoScript: boolean;
    painPoint: boolean;
    processingTime: boolean;
    status: boolean;
    timestamps: boolean;
  };
  filterByStatus?: ('pending' | 'processing' | 'completed' | 'error')[];
}

// Video utilities types
export interface VideoMetadata {
  duration: number;
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number;
  format: string;
  thumbnail: string;
}

export interface VideoValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: VideoMetadata;
}

// Constants
export const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
export const DEFAULT_RATE_LIMIT_PER_MINUTE = 10;
export const DEFAULT_MAX_VIDEOS_PER_BATCH = 500; // Increased to support hundreds of videos 