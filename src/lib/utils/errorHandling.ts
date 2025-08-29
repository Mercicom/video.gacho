import { VideoAnalysisError } from '@/types/video-analysis';

// Error types and categories
export enum ErrorType {
  UPLOAD = 'upload',
  API = 'api',
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PROCESSING = 'processing',
  EXPORT = 'export',
  STORAGE = 'storage',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Custom error classes
export class VideoAnalyzerError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    retryable: boolean = false,
    details?: any
  ) {
    super(message);
    this.name = 'VideoAnalyzerError';
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.retryable = retryable;
    this.details = details;
    this.timestamp = new Date();
  }
}

// Specific error classes
export class UploadError extends VideoAnalyzerError {
  constructor(message: string, code: string, details?: any) {
    super(message, ErrorType.UPLOAD, code, ErrorSeverity.MEDIUM, false, details);
    this.name = 'UploadError';
  }
}

export class APIError extends VideoAnalyzerError {
  constructor(message: string, code: string, retryable: boolean = true, details?: any) {
    super(message, ErrorType.API, code, ErrorSeverity.HIGH, retryable, details);
    this.name = 'APIError';
  }
}

export class RateLimitError extends VideoAnalyzerError {
  constructor(message: string, resetTime: number) {
    super(
      message,
      ErrorType.RATE_LIMIT,
      'RATE_LIMIT_EXCEEDED',
      ErrorSeverity.MEDIUM,
      true,
      { resetTime }
    );
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends VideoAnalyzerError {
  constructor(message: string, code: string = 'NETWORK_ERROR') {
    super(message, ErrorType.NETWORK, code, ErrorSeverity.HIGH, true);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends VideoAnalyzerError {
  constructor(message: string, field: string, value?: any) {
    super(
      message,
      ErrorType.VALIDATION,
      'VALIDATION_FAILED',
      ErrorSeverity.LOW,
      false,
      { field, value }
    );
    this.name = 'ValidationError';
  }
}

export class ProcessingError extends VideoAnalyzerError {
  constructor(message: string, code: string, retryable: boolean = true, details?: any) {
    super(message, ErrorType.PROCESSING, code, ErrorSeverity.HIGH, retryable, details);
    this.name = 'ProcessingError';
  }
}

// Error detection and classification
export function classifyError(error: unknown): VideoAnalyzerError {
  if (error instanceof VideoAnalyzerError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return new NetworkError(error.message);
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429')) {
      const resetTime = Date.now() + 60000; // Default 1 minute
      return new RateLimitError(error.message, resetTime);
    }

    // API errors
    if (message.includes('api') || message.includes('server') || message.includes('500')) {
      return new APIError(error.message, 'API_ERROR');
    }

    // Upload errors
    if (message.includes('upload') || message.includes('file') || message.includes('size')) {
      return new UploadError(error.message, 'UPLOAD_ERROR');
    }

    // Validation errors
    if (message.includes('invalid') || message.includes('validation') || message.includes('format')) {
      return new ValidationError(error.message, 'unknown');
    }

    // Processing errors
    if (message.includes('processing') || message.includes('analysis') || message.includes('gemini')) {
      return new ProcessingError(error.message, 'PROCESSING_ERROR');
    }

    // Default to generic API error
    return new APIError(error.message, 'UNKNOWN_ERROR');
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new VideoAnalyzerError(
      error,
      ErrorType.API,
      'STRING_ERROR',
      ErrorSeverity.MEDIUM,
      false
    );
  }

  // Handle unknown errors
  return new VideoAnalyzerError(
    'An unknown error occurred',
    ErrorType.API,
    'UNKNOWN_ERROR',
    ErrorSeverity.HIGH,
    false,
    error
  );
}

// Error message generation
export function getErrorMessage(error: VideoAnalyzerError): string {
  const baseMessage = error.message;

  switch (error.type) {
    case ErrorType.UPLOAD:
      return `Upload failed: ${baseMessage}`;
    
    case ErrorType.API:
      return `API error: ${baseMessage}`;
    
    case ErrorType.RATE_LIMIT:
      const resetTime = error.details?.resetTime;
      const waitTime = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;
      return `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`;
    
    case ErrorType.NETWORK:
      return `Network error: ${baseMessage}. Please check your internet connection.`;
    
    case ErrorType.VALIDATION:
      return `Validation error: ${baseMessage}`;
    
    case ErrorType.PROCESSING:
      return `Processing error: ${baseMessage}`;
    
    case ErrorType.EXPORT:
      return `Export failed: ${baseMessage}`;
    
    case ErrorType.STORAGE:
      return `Storage error: ${baseMessage}`;
    
    default:
      return baseMessage;
  }
}

// User-friendly error messages
export function getUserFriendlyMessage(error: VideoAnalyzerError): {
  title: string;
  message: string;
  action?: string;
} {
  switch (error.type) {
    case ErrorType.UPLOAD:
      return {
        title: 'Upload Failed',
        message: 'There was a problem uploading your video file.',
        action: 'Please check the file size and format, then try again.',
      };

    case ErrorType.RATE_LIMIT:
      const waitTime = error.details?.resetTime 
        ? Math.ceil((error.details.resetTime - Date.now()) / 1000) 
        : 60;
      return {
        title: 'Rate Limit Reached',
        message: 'You\'ve reached the maximum number of requests per minute.',
        action: `Please wait ${waitTime} seconds before analyzing more videos.`,
      };

    case ErrorType.NETWORK:
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to our servers.',
        action: 'Please check your internet connection and try again.',
      };

    case ErrorType.API:
      if (error.code === 'QUOTA_EXCEEDED') {
        return {
          title: 'Service Limit Reached',
          message: 'The AI analysis service has reached its usage limit.',
          action: 'Please try again later or contact support.',
        };
      }
      
      if (error.code === 'CONTENT_BLOCKED') {
        return {
          title: 'Content Not Supported',
          message: 'This video content cannot be analyzed.',
          action: 'Please try with a different video.',
        };
      }
      
      return {
        title: 'Analysis Failed',
        message: 'There was a problem analyzing your video.',
        action: error.retryable ? 'Please try again.' : 'Please contact support if this continues.',
      };

    case ErrorType.VALIDATION:
      return {
        title: 'Invalid Input',
        message: error.message,
        action: 'Please correct the issue and try again.',
      };

    case ErrorType.PROCESSING:
      return {
        title: 'Processing Error',
        message: 'There was a problem processing your video.',
        action: error.retryable ? 'This is usually temporary. Please try again.' : 'Please contact support.',
      };

    default:
      return {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred.',
        action: 'Please try again or contact support if the problem continues.',
      };
  }
}

// Error recovery strategies
export interface RecoveryStrategy {
  canRecover: boolean;
  autoRetry: boolean;
  retryDelay: number; // milliseconds
  maxRetries: number;
  userAction?: string;
}

export function getRecoveryStrategy(error: VideoAnalyzerError): RecoveryStrategy {
  const baseStrategy: RecoveryStrategy = {
    canRecover: error.retryable,
    autoRetry: false,
    retryDelay: 1000,
    maxRetries: 0,
  };

  switch (error.type) {
    case ErrorType.NETWORK:
      return {
        ...baseStrategy,
        canRecover: true,
        autoRetry: true,
        retryDelay: 2000,
        maxRetries: 3,
        userAction: 'Check your internet connection',
      };

    case ErrorType.RATE_LIMIT:
      const waitTime = error.details?.resetTime 
        ? error.details.resetTime - Date.now() 
        : 60000;
      return {
        ...baseStrategy,
        canRecover: true,
        autoRetry: true,
        retryDelay: Math.max(waitTime, 1000),
        maxRetries: 1,
        userAction: 'Wait for rate limit to reset',
      };

    case ErrorType.API:
      if (error.code === 'TEMPORARY_ERROR') {
        return {
          ...baseStrategy,
          canRecover: true,
          autoRetry: true,
          retryDelay: 5000,
          maxRetries: 2,
        };
      }
      break;

    case ErrorType.PROCESSING:
      return {
        ...baseStrategy,
        canRecover: error.retryable,
        autoRetry: error.retryable,
        retryDelay: 3000,
        maxRetries: error.retryable ? 2 : 0,
      };

    case ErrorType.UPLOAD:
      return {
        ...baseStrategy,
        canRecover: false, // User needs to fix the file
        userAction: 'Check file size and format',
      };

    case ErrorType.VALIDATION:
      return {
        ...baseStrategy,
        canRecover: false, // User needs to fix the input
        userAction: 'Correct the validation errors',
      };
  }

  return baseStrategy;
}

// Error logging and reporting
export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: VideoAnalyzerError;
  context: {
    userAgent: string;
    url: string;
    userId?: string;
    sessionId?: string;
  };
  stackTrace?: string;
}

export function createErrorReport(error: VideoAnalyzerError, context?: Partial<ErrorReport['context']>): ErrorReport {
  return {
    id: generateErrorId(),
    timestamp: new Date(),
    error,
    context: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context,
    },
    stackTrace: error.stack,
  };
}

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Error storage for debugging
const ERROR_STORAGE_KEY = 'video-analyzer-errors';
const MAX_STORED_ERRORS = 50;

export function storeError(error: VideoAnalyzerError): void {
  try {
    const stored = localStorage.getItem(ERROR_STORAGE_KEY);
    const errors: ErrorReport[] = stored ? JSON.parse(stored) : [];
    
    const report = createErrorReport(error);
    errors.unshift(report);
    
    // Keep only recent errors
    if (errors.length > MAX_STORED_ERRORS) {
      errors.splice(MAX_STORED_ERRORS);
    }
    
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
  } catch (storageError) {
    console.warn('Failed to store error:', storageError);
  }
}

export function getStoredErrors(): ErrorReport[] {
  try {
    const stored = localStorage.getItem(ERROR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to retrieve stored errors:', error);
    return [];
  }
}

export function clearStoredErrors(): void {
  try {
    localStorage.removeItem(ERROR_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear stored errors:', error);
  }
}

// Error handling utilities
export function handleError(error: unknown): VideoAnalyzerError {
  const classifiedError = classifyError(error);
  storeError(classifiedError);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('VideoAnalyzer Error:', classifiedError);
  }
  
  return classifiedError;
}

export function isRetryableError(error: VideoAnalyzerError): boolean {
  return error.retryable;
}

export function shouldShowToUser(error: VideoAnalyzerError): boolean {
  // Don't show critical internal errors to users
  return error.severity !== ErrorSeverity.CRITICAL;
}

// Error boundaries and React integration
export function getErrorBoundaryFallback(error: VideoAnalyzerError) {
  const friendly = getUserFriendlyMessage(error);
  
  return {
    title: friendly.title,
    message: friendly.message,
    action: friendly.action,
    canRetry: error.retryable,
    errorId: error.code,
  };
}

// Network error detection
export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError ||
    (error instanceof Error && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.name === 'NetworkError'
    ));
}

// Validation helpers
export function createValidationError(field: string, message: string, value?: any): ValidationError {
  return new ValidationError(`${field}: ${message}`, field, value);
}

// Error aggregation for batch operations
export function aggregateErrors(errors: VideoAnalyzerError[]): {
  byType: Record<ErrorType, number>;
  byCode: Record<string, number>;
  retryableCount: number;
  criticalCount: number;
  mostCommon: ErrorType;
} {
  const byType: Record<ErrorType, number> = {} as Record<ErrorType, number>;
  const byCode: Record<string, number> = {};
  let retryableCount = 0;
  let criticalCount = 0;

  errors.forEach(error => {
    byType[error.type] = (byType[error.type] || 0) + 1;
    byCode[error.code] = (byCode[error.code] || 0) + 1;
    
    if (error.retryable) retryableCount++;
    if (error.severity === ErrorSeverity.CRITICAL) criticalCount++;
  });

  const mostCommon = Object.entries(byType)
    .sort(([,a], [,b]) => b - a)[0]?.[0] as ErrorType;

  return {
    byType,
    byCode,
    retryableCount,
    criticalCount,
    mostCommon,
  };
}

// Constants
export const ERROR_CONSTANTS = {
  DEFAULT_RETRY_DELAY: 1000,
  MAX_RETRY_ATTEMPTS: 3,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  CRITICAL_ERROR_THRESHOLD: 5,
  ERROR_STORAGE_KEY,
  MAX_STORED_ERRORS,
} as const; 