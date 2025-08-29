import { 
  VideoValidationResult, 
  VideoMetadata, 
  SUPPORTED_VIDEO_FORMATS, 
  MAX_VIDEO_SIZE_BYTES 
} from '@/types/video-analysis';

// Video validation functions
export function validateVideoFile(file: File): VideoValidationResult {
  const errors: string[] = [];

  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      errors: ['No file provided'],
    };
  }

  // Check file size
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    const maxSizeMB = MAX_VIDEO_SIZE_BYTES / (1024 * 1024);
    const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    errors.push(`File too large: ${actualSizeMB}MB (max ${maxSizeMB}MB)`);
  }

  // Check file type
  const fileExtension = getFileExtension(file.name);
  if (!SUPPORTED_VIDEO_FORMATS.includes(fileExtension)) {
    errors.push(`Unsupported format: ${fileExtension}. Supported formats: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`);
  }

  // Check MIME type
  if (!file.type.startsWith('video/')) {
    errors.push(`Invalid MIME type: ${file.type}. Expected video/*`);
  }

  // If no errors, try to extract metadata
  let metadata: VideoMetadata | undefined;
  if (errors.length === 0) {
    try {
      // Note: Metadata extraction happens asynchronously
      // This function returns synchronous validation only
      metadata = undefined; // Will be populated by extractVideoMetadata
    } catch (error) {
      errors.push(`Failed to process video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    metadata,
  };
}

// Extract video metadata
export function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let thumbnailGenerated = false;

    video.addEventListener('loadedmetadata', () => {
      const metadata: VideoMetadata = {
        duration: video.duration,
        dimensions: {
          width: video.videoWidth,
          height: video.videoHeight,
        },
        fileSize: file.size,
        format: getFileExtension(file.name),
        thumbnail: '', // Will be set when thumbnail is generated
      };

      // Generate thumbnail at 1 second mark
      video.currentTime = Math.min(1, video.duration * 0.1); // 10% into video or 1 second
    });

    video.addEventListener('seeked', () => {
      if (!thumbnailGenerated && ctx) {
        thumbnailGenerated = true;
        
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          
          const metadata: VideoMetadata = {
            duration: video.duration,
            dimensions: {
              width: video.videoWidth,
              height: video.videoHeight,
            },
            fileSize: file.size,
            format: getFileExtension(file.name),
            thumbnail,
          };
          
          resolve(metadata);
        } catch (error) {
          reject(new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      }
    });

    video.addEventListener('error', (event) => {
      const error = video.error;
      let errorMessage = 'Failed to load video';
      
      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = 'Video loading was aborted';
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading video';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Video decoding error';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video format not supported';
            break;
          default:
            errorMessage = 'Unknown video loading error';
        }
      }
      
      reject(new Error(errorMessage));
    });

    // Set video source
    try {
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.load();
    } catch (error) {
      reject(new Error(`Failed to create video object URL: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

// Generate video thumbnail
export function generateVideoThumbnail(file: File, timeSeconds: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas 2D context not supported'));
      return;
    }

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Seek to specified time (or 10% of duration, whichever is smaller)
      const seekTime = Math.min(timeSeconds, video.duration * 0.1);
      video.currentTime = seekTime;
    });

    video.addEventListener('seeked', () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        
        // Clean up
        URL.revokeObjectURL(video.src);
        
        resolve(thumbnail);
      } catch (error) {
        URL.revokeObjectURL(video.src);
        reject(new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });

    video.addEventListener('error', (event) => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video for thumbnail generation'));
    });

    // Set video source
    try {
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.preload = 'metadata';
    } catch (error) {
      reject(new Error(`Failed to create video object URL: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

// File utility functions
export function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}

export function getVideoMimeType(filename: string): string {
  const ext = getFileExtension(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.m4v': 'video/mp4',
  };
  return mimeTypes[ext] || 'video/mp4';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatVideoDimensions(width: number, height: number): string {
  return `${width} × ${height}`;
}

// Video processing utilities
export function calculateVideoAspectRatio(width: number, height: number): number {
  return width / height;
}

export function getVideoQualityLabel(width: number, height: number): string {
  if (width >= 3840 && height >= 2160) return '4K UHD';
  if (width >= 2560 && height >= 1440) return '2K QHD';
  if (width >= 1920 && height >= 1080) return '1080p HD';
  if (width >= 1280 && height >= 720) return '720p HD';
  if (width >= 854 && height >= 480) return '480p SD';
  return 'Low Quality';
}

export function isVideoPortrait(width: number, height: number): boolean {
  return height > width;
}

export function isVideoLandscape(width: number, height: number): boolean {
  return width > height;
}

export function isVideoSquare(width: number, height: number, tolerance: number = 0.1): boolean {
  const aspectRatio = calculateVideoAspectRatio(width, height);
  return Math.abs(aspectRatio - 1) <= tolerance;
}

// Batch validation
export function validateMultipleVideoFiles(files: File[]): {
  validFiles: File[];
  invalidFiles: Array<{ file: File; errors: string[] }>;
  summary: {
    totalFiles: number;
    validCount: number;
    invalidCount: number;
    totalSize: number;
  };
} {
  const validFiles: File[] = [];
  const invalidFiles: Array<{ file: File; errors: string[] }> = [];
  let totalSize = 0;

  files.forEach(file => {
    totalSize += file.size;
    const validation = validateVideoFile(file);
    
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({
        file,
        errors: validation.errors,
      });
    }
  });

  return {
    validFiles,
    invalidFiles,
    summary: {
      totalFiles: files.length,
      validCount: validFiles.length,
      invalidCount: invalidFiles.length,
      totalSize,
    },
  };
}

// Create video preview element
export function createVideoPreview(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.addEventListener('loadedmetadata', () => {
      resolve(video);
    });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video preview'));
    });

    try {
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.preload = 'metadata';
    } catch (error) {
      reject(new Error(`Failed to create video preview: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

// Clean up video object URLs
export function cleanupVideoURL(url: string): void {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Failed to revoke object URL:', error);
    }
  }
}

// Video format conversion helpers
export function isWebCompatibleFormat(filename: string): boolean {
  const webFormats = ['.mp4', '.webm', '.m4v'];
  const extension = getFileExtension(filename);
  return webFormats.includes(extension);
}

export function getSuggestedWebFormat(filename: string): string {
  // For most cases, MP4 is the most compatible
  return filename.replace(/\.[^/.]+$/, '.mp4');
}

// Performance optimization helpers
export function shouldCompressVideo(file: File, maxSizeMB: number = 50): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size > maxBytes;
}

export function calculateCompressionRatio(originalSize: number, targetSizeMB: number = 50): number {
  const targetBytes = targetSizeMB * 1024 * 1024;
  return Math.min(1, targetBytes / originalSize);
}

// Error handling helpers
export function getVideoErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Unknown video processing error';
}

export function isVideoLoadError(error: unknown): boolean {
  return error instanceof Error && (
    error.message.includes('load') ||
    error.message.includes('decode') ||
    error.message.includes('format') ||
    error.message.includes('supported')
  );
}

// Constants and utilities for common video operations
export const VIDEO_CONSTANTS = {
  COMMON_ASPECT_RATIOS: {
    LANDSCAPE: 16 / 9,
    PORTRAIT: 9 / 16,
    SQUARE: 1,
    TRADITIONAL_TV: 4 / 3,
    CINEMA: 21 / 9,
  },
  QUALITY_THRESHOLDS: {
    UHD_4K: { width: 3840, height: 2160 },
    QHD_2K: { width: 2560, height: 1440 },
    FHD_1080P: { width: 1920, height: 1080 },
    HD_720P: { width: 1280, height: 720 },
    SD_480P: { width: 854, height: 480 },
  },
  MAX_THUMBNAIL_SIZE: { width: 320, height: 240 },
  DEFAULT_SEEK_TIME: 1, // seconds
  THUMBNAIL_QUALITY: 0.7,
} as const; 