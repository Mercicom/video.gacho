import React, { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, Video, AlertCircle, FileVideo, Play } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { VideoUploadProps, UploadedVideo, SUPPORTED_VIDEO_FORMATS, MAX_VIDEO_SIZE_BYTES } from "@/types/video-analysis";

export default function VideoUpload({
  onVideosChange,
  maxFiles = 10,
  maxSizePerFile = 100, // MB
  acceptedFormats = SUPPORTED_VIDEO_FORMATS,
  disabled = false,
}: VideoUploadProps) {
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [previews, setPreviews] = useState<{[key: string]: string}>({});

  const validateFile = (file: File): string[] => {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > maxSizePerFile * 1024 * 1024) {
      errors.push(`${file.name}: File size exceeds ${maxSizePerFile}MB limit`);
    }
    
    // Check file type
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!acceptedFormats.includes(fileExtension)) {
      errors.push(`${file.name}: Unsupported format. Supported: ${acceptedFormats.join(', ')}`);
    }
    
    return errors;
  };

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = 1; // Seek to 1 second for thumbnail
      });
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnail);
        }
      });
      
      video.addEventListener('error', () => {
        reject(new Error('Failed to generate thumbnail'));
      });
      
      video.src = URL.createObjectURL(file);
      video.muted = true;
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;
    
    const newErrors: string[] = [];
    const newVideos: UploadedVideo[] = [];
    
    // Check total file limit
    if (videos.length + acceptedFiles.length > maxFiles) {
      newErrors.push(`Cannot upload more than ${maxFiles} videos at once`);
      setErrors(newErrors);
      return;
    }
    
    for (const file of acceptedFiles) {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        const uploadedVideo: UploadedVideo = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          filename: file.name,
          size: file.size,
          uploadedAt: new Date(),
          status: 'uploaded',
        };
        
        newVideos.push(uploadedVideo);
        
        // Generate thumbnail
        try {
          const thumbnail = await generateVideoThumbnail(file);
          setPreviews(prev => ({ ...prev, [uploadedVideo.id]: thumbnail }));
        } catch (error) {
          console.warn(`Failed to generate thumbnail for ${file.name}:`, error);
        }
      } else {
        newErrors.push(...fileErrors);
      }
    }
    
    const updatedVideos = [...videos, ...newVideos];
    setVideos(updatedVideos);
    setErrors(newErrors);
    onVideosChange(updatedVideos);
  }, [videos, maxFiles, maxSizePerFile, acceptedFormats, disabled, onVideosChange]);

  const removeVideo = (videoId: string) => {
    const updatedVideos = videos.filter(v => v.id !== videoId);
    setVideos(updatedVideos);
    
    // Clean up preview
    setPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[videoId];
      return newPreviews;
    });
    
    // Clear error if it was related to this video
    const videoToRemove = videos.find(v => v.id === videoId);
    if (videoToRemove) {
      setErrors(prev => prev.filter(error => !error.includes(videoToRemove.filename)));
    }
    
    onVideosChange(updatedVideos);
  };

  const clearAll = () => {
    setVideos([]);
    setPreviews({});
    setErrors([]);
    onVideosChange([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': acceptedFormats,
    },
    maxFiles,
    maxSize: maxSizePerFile * 1024 * 1024,
    disabled,
    multiple: true,
  });

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragActive && !isDragReject ? 'border-blue-400 bg-blue-50' : ''}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-gray-50'}
          ${!isDragActive && !isDragReject ? 'border-gray-300' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          {isDragActive ? (
            <>
              <Upload className="w-12 h-12 text-blue-500" />
              <p className="text-lg font-medium text-blue-600">
                {isDragReject ? "Some files are not supported" : "Drop videos here"}
              </p>
            </>
          ) : (
            <>
              <FileVideo className="w-12 h-12 text-gray-400" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  {disabled ? "Upload disabled" : "Drop videos here or click to browse"}
                </p>
                <p className="text-sm text-gray-500">
                  Supports: {acceptedFormats.join(', ')} • Max {maxSizePerFile}MB each • Up to {maxFiles} videos
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="font-medium text-red-800">Upload Errors</p>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploaded Videos */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Uploaded Videos ({videos.length}/{maxFiles})
            </h3>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                {/* Video Preview/Thumbnail */}
                <div className="aspect-video bg-gray-100 relative">
                  {previews[video.id] ? (
                    <div className="relative w-full h-full">
                      <img
                        src={previews[video.id]}
                        alt={`${video.filename} thumbnail`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <Play className="w-8 h-8 text-white opacity-75" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeVideo(video.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    title="Remove video"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {/* Video Info */}
                <div className="p-3 space-y-2">
                  <p className="font-medium text-sm text-gray-900 truncate" title={video.filename}>
                    {video.filename}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatFileSize(video.size)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      video.status === 'uploaded' ? 'bg-green-100 text-green-700' :
                      video.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      video.status === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {video.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 