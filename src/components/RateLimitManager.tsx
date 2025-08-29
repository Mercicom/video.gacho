import React from "react";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  BarChart3,
  Zap
} from "lucide-react";
import { RateLimitManagerProps } from "@/types/video-analysis";

export default function RateLimitManager({
  queueStatus,
  rateLimitInfo,
  onPause,
  onResume,
  onStop,
}: RateLimitManagerProps) {
  
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimeShort = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const getQueueProgress = (): number => {
    const { totalInQueue, completedCount } = queueStatus;
    if (totalInQueue === 0) return 0;
    return (completedCount / totalInQueue) * 100;
  };

  const getRateLimitProgress = (): number => {
    return (rateLimitInfo.remaining / rateLimitInfo.maxRequestsPerMinute) * 100;
  };

  const getStatusColor = (): string => {
    if (queueStatus.isProcessing && !queueStatus.isPaused) {
      return "text-blue-600 bg-blue-50";
    } else if (queueStatus.isPaused) {
      return "text-yellow-600 bg-yellow-50";
    } else if (queueStatus.totalInQueue === 0) {
      return "text-gray-600 bg-gray-50";
    } else {
      return "text-green-600 bg-green-50";
    }
  };

  const getStatusText = (): string => {
    if (queueStatus.isProcessing && !queueStatus.isPaused) {
      return "Processing";
    } else if (queueStatus.isPaused) {
      return "Paused";
    } else if (queueStatus.totalInQueue === 0) {
      return "Ready";
    } else {
      return "Waiting";
    }
  };

  const getStatusIcon = () => {
    if (queueStatus.isProcessing && !queueStatus.isPaused) {
      return <Clock className="w-4 h-4 animate-spin" />;
    } else if (queueStatus.isPaused) {
      return <Pause className="w-4 h-4" />;
    } else if (queueStatus.totalInQueue === 0) {
      return <CheckCircle2 className="w-4 h-4" />;
    } else {
      return <Timer className="w-4 h-4" />;
    }
  };

  const isRateLimitLow = rateLimitInfo.remaining <= 2;
  const isRateLimitEmpty = rateLimitInfo.remaining === 0;
  
  // Enhanced progress calculations for large batches
  const progressPercentage = queueStatus.totalInQueue > 0 
    ? (queueStatus.completedCount / queueStatus.totalInQueue) * 100 
    : 0;
  
  const getDetailedETA = (): string => {
    if (queueStatus.position <= 0 || !queueStatus.isProcessing) return 'N/A';
    
    const avgTimePerVideo = 60 / rateLimitInfo.maxRequestsPerMinute; // seconds
    const remainingVideos = queueStatus.position;
    const etaSeconds = remainingVideos * avgTimePerVideo;
    
    if (etaSeconds < 3600) {
      return `${Math.ceil(etaSeconds / 60)}m`;
    } else {
      const hours = Math.floor(etaSeconds / 3600);
      const minutes = Math.ceil((etaSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };
  
  const getProcessingRate = (): string => {
    if (!queueStatus.isProcessing) return '0';
    return `${rateLimitInfo.maxRequestsPerMinute}/min`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Analysis Queue</h3>
            <p className="text-sm text-gray-500">AI-powered video analysis with rate limiting</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </div>

      {/* Enhanced Queue Statistics for Large Batches */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total in Queue */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{queueStatus.totalInQueue}</div>
          <div className="text-sm text-gray-500 font-medium">Total Videos</div>
        </div>

        {/* Completed */}
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{queueStatus.completedCount}</div>
          <div className="text-sm text-green-600 font-medium">Completed</div>
          <div className="text-xs text-green-500 mt-1">{progressPercentage.toFixed(1)}%</div>
        </div>

        {/* Remaining */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {queueStatus.position > 0 ? queueStatus.position : '0'}
          </div>
          <div className="text-sm text-blue-600 font-medium">Remaining</div>
          <div className="text-xs text-blue-500 mt-1">ETA: {getDetailedETA()}</div>
        </div>

        {/* Errors */}
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{queueStatus.errorCount}</div>
          <div className="text-sm text-red-600 font-medium">Errors</div>
          <div className="text-xs text-red-500 mt-1">
            {queueStatus.totalInQueue > 0 ? ((queueStatus.errorCount / queueStatus.totalInQueue) * 100).toFixed(1) : '0'}% fail rate
          </div>
        </div>

        {/* Processing Rate */}
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{getProcessingRate()}</div>
          <div className="text-sm text-purple-600 font-medium">Rate</div>
          <div className="text-xs text-purple-500 mt-1">videos/min</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {/* Enhanced Queue Progress for Large Batches */}
        {queueStatus.totalInQueue > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">
                {queueStatus.completedCount} / {queueStatus.totalInQueue} ({progressPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
              {queueStatus.errorCount > 0 && (
                <div 
                  className="absolute top-0 right-0 bg-red-500 h-3 rounded-r-full"
                  style={{ width: `${(queueStatus.errorCount / queueStatus.totalInQueue) * 100}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Started</span>
              <span>{progressPercentage > 50 ? 'More than halfway' : progressPercentage > 25 ? 'Making progress' : 'Just started'}</span>
              <span>Complete</span>
            </div>
          </div>
        )}

        {/* Rate Limit Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isRateLimitEmpty ? 'text-red-500' : isRateLimitLow ? 'text-yellow-500' : 'text-green-500'}`} />
              API Rate Limit
            </span>
            <span className={`text-sm ${isRateLimitEmpty ? 'text-red-600' : isRateLimitLow ? 'text-yellow-600' : 'text-gray-500'}`}>
              {rateLimitInfo.remaining} / {rateLimitInfo.maxRequestsPerMinute} remaining
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isRateLimitEmpty ? 'bg-red-500' : 
                isRateLimitLow ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${getRateLimitProgress()}%` }}
            />
          </div>
          {isRateLimitEmpty && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Rate limit reached. Processing will resume in {formatTimeShort((rateLimitInfo.resetTime - Date.now()) / 1000)}
            </p>
          )}
        </div>
      </div>

      {/* Time Estimates */}
      {queueStatus.estimatedWaitTime > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Estimated Completion Time</p>
              <p className="text-sm text-blue-700">
                Approximately {formatTime(queueStatus.estimatedWaitTime)} remaining
              </p>
              {queueStatus.position > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  You are #{queueStatus.position} in queue
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rate Limit Warning */}
      {isRateLimitLow && !isRateLimitEmpty && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Rate Limit Warning</p>
              <p className="text-sm text-yellow-700">
                Only {rateLimitInfo.remaining} requests remaining this minute. Processing may slow down.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {queueStatus.errorCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Analysis Errors</p>
              <p className="text-sm text-red-700">
                {queueStatus.errorCount} video{queueStatus.errorCount > 1 ? 's' : ''} failed to analyze. 
                Check the results table for details and retry if needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center gap-3 pt-2 border-t">
        {queueStatus.isProcessing && !queueStatus.isPaused ? (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Pause className="w-4 h-4" />
            Pause Queue
          </button>
        ) : (
          <button
            onClick={onResume}
            disabled={queueStatus.totalInQueue === 0 || isRateLimitEmpty}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" />
            {queueStatus.isPaused ? 'Resume Queue' : 'Start Queue'}
          </button>
        )}

        <button
          onClick={onStop}
          disabled={!queueStatus.isProcessing && !queueStatus.isPaused}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Square className="w-4 h-4" />
          Stop Queue
        </button>

        {/* Rate Limit Reset Info */}
        <div className="ml-auto text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            Resets in {formatTimeShort((rateLimitInfo.resetTime - Date.now()) / 1000)}
          </div>
        </div>
      </div>

      {/* Processing Info */}
      {queueStatus.isProcessing && !queueStatus.isPaused && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>
              Processing videos at maximum rate (1 every {60 / rateLimitInfo.maxRequestsPerMinute} seconds)
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 