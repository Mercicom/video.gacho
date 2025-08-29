# Video Analyzer Feature Request

## Overview
Build a comprehensive video analysis feature that allows users to upload videos in bulk and analyze them using Google Gemini API to extract marketing insights and content hooks.

## Feature Requirements

### 1. Homepage Integration
- **Location**: Update `/src/app/page.tsx`
- **Action**: Add a new "Video Analyzer" card to the existing grid layout
- **Behavior**: Click redirects to `/video-analyzer` page
- **Design**: Follow the existing card pattern with:
  - Title: "Video Analyzer" 
  - Description: "Analyze videos in bulk to extract visual hooks, text hooks, voice hooks, scripts, and pain points using AI-powered insights."
  - Hover effects matching existing cards

### 2. Video Analyzer Page
- **Route**: `/src/app/video-analyzer/page.tsx`
- **Layout**: Clean, focused interface for video analysis workflow

#### Page Components:
1. **Header Section**
   - Page title: "Video Analyzer"
   - Subtitle explaining the feature
   - Progress indicator showing current step

2. **Video Upload Section**
   - Bulk video upload component (extend from existing `ImageUpload.tsx` pattern)
   - Support for multiple video files (.mp4, .mov, .avi, .mkv)
   - Drag and drop functionality
   - File size validation (max 100MB per video)
   - Visual previews of uploaded videos
   - Remove individual videos option

3. **Analysis Section**
   - Start Analysis button (disabled until videos uploaded)
   - Real-time progress tracking for each video
   - Rate limiting indicator (shows remaining requests/minute)
   - Pause/Resume functionality for analysis queue

4. **Results Section**
   - Responsive table displaying analysis results
   - Export functionality (CSV/JSON)
   - Individual video result details view

### 3. Components to Create

#### `/src/components/VideoUpload.tsx`
```typescript
interface VideoUploadProps {
  onVideosChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
}
```
- Multi-file video upload with drag & drop
- Video thumbnails/previews
- Progress indicators for each upload
- File validation and error handling
- Remove individual videos functionality

#### `/src/components/VideoAnalysisTable.tsx`
```typescript
interface AnalysisResult {
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
}
```
- Sortable and filterable table
- Status indicators with loading states
- Expandable rows for detailed view
- Export functionality
- Retry failed analyses

#### `/src/components/RateLimitManager.tsx`
- Visual indicator of API rate limits
- Queue management display
- Estimated completion time
- Pause/resume controls

### 4. API Integration

#### `/src/app/api/gemini/analyze-video/route.ts`
- **Dependencies**: Add `@google/generative-ai` to package.json
- **Rate Limiting**: Implement 10 requests per minute limit using queue system
- **Functionality**:
  - Accept video file upload
  - Convert video to appropriate format for Gemini API
  - Process with Gemini Vision API
  - Return structured analysis results

#### Environment Variables
Add to `.env.local`:
```
GOOGLE_API_KEY=your_gemini_api_key
```

#### API Request/Response Format
```typescript
// Request
{
  videoFile: File,
  analysisOptions?: {
    includeVisualHook: boolean;
    includeTextHook: boolean;
    includeVoiceHook: boolean;
    includeVideoScript: boolean;
    includePainPoint: boolean;
  }
}

// Response
{
  success: boolean;
  data?: {
    visualHook: string;
    textHook: string;
    voiceHook: string;
    videoScript: string;
    painPoint: string;
  };
  error?: string;
  rateLimitInfo: {
    remaining: number;
    resetTime: number;
  }
}
```

### 5. Analysis Prompts for Gemini API

#### System Prompt
```
You are an expert video marketing analyst. Analyze the provided video and extract the following marketing insights:

1. **Visual Hook**: Identify the most compelling visual element that grabs attention in the first 3 seconds
2. **Text Hook**: Extract or suggest the most engaging text/caption that would accompany this video
3. **Voice Hook**: Analyze the audio/speech and identify the most compelling verbal hook or tagline
4. **Video Script**: Provide a complete transcript or script of the spoken content
5. **Pain Point/Problem Solving Angle**: Identify what problem this video addresses and how it positions the solution

For each analysis point, provide specific, actionable insights that could be used for marketing purposes.
```

### 6. Rate Limiting Implementation

#### Queue System
- **Location**: `/src/lib/utils/rateLimitQueue.ts`
- **Functionality**:
  - FIFO queue for video analysis requests
  - 10 requests per minute limit
  - Automatic retry logic for failed requests
  - Persistence across page refreshes (localStorage)

#### Rate Limit Strategy
```typescript
class VideoAnalysisQueue {
  private queue: VideoAnalysisRequest[] = [];
  private processing: boolean = false;
  private requestsInLastMinute: number = 0;
  private lastResetTime: number = Date.now();

  async processQueue(): Promise<void> {
    // Process one video every 6 seconds (10 per minute)
    // Handle retries and error cases
    // Update UI with progress
  }
}
```

### 7. Data Management

#### State Management
- Use React useState for component-level state
- Consider useReducer for complex analysis state
- localStorage for persistence of analysis results

#### Data Structure
```typescript
interface VideoAnalysisSession {
  id: string;
  createdAt: Date;
  videos: UploadedVideo[];
  results: AnalysisResult[];
  status: 'uploading' | 'analyzing' | 'completed' | 'paused';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
}
```

### 8. Error Handling

#### Error Types
- File upload errors (size, format, network)
- API rate limit exceeded
- Gemini API errors (quota, invalid content)
- Network connectivity issues

#### Error UI
- Toast notifications for immediate feedback
- Error states in table rows
- Retry mechanisms with exponential backoff
- Clear error messages with suggested actions

### 9. Performance Considerations

#### File Handling
- Client-side video compression before upload
- Chunked upload for large files
- Progress indicators for uploads

#### Memory Management
- Cleanup video previews after analysis
- Efficient handling of large result datasets
- Lazy loading for result table

### 10. Security & Validation

#### File Validation
- Virus scanning (if applicable)
- File type validation (video formats only)
- Size limits enforcement
- Malicious file detection

#### API Security
- Rate limiting per user/IP
- Input sanitization
- API key protection
- CORS configuration

### 11. Testing Requirements

#### Unit Tests
- Video upload component functionality
- Rate limiting queue logic
- API response parsing
- Error handling scenarios

#### Integration Tests
- End-to-end video analysis workflow
- Rate limiting behavior
- Error recovery mechanisms

### 12. Documentation

#### User Guide
- How to use the video analyzer
- Supported video formats and sizes
- Understanding analysis results
- Troubleshooting common issues

#### Developer Documentation
- API endpoints documentation
- Component props and usage
- Queue system architecture
- Deployment requirements

## Implementation Priority

### Phase 1 (Core Functionality)
1. Create video analyzer page structure
2. Implement basic video upload component
3. Set up Gemini API integration
4. Basic analysis results display

### Phase 2 (Enhanced Features)
1. Rate limiting implementation
2. Queue management system
3. Enhanced UI/UX improvements
4. Error handling and recovery

### Phase 3 (Polish & Optimization)
1. Performance optimizations
2. Advanced table features (sort, filter, export)
3. Comprehensive testing
4. Documentation completion

## Dependencies to Add

```json
{
  "@google/generative-ai": "^0.17.1",
  "react-dropzone": "^14.2.3",
  "react-table": "^7.8.0",
  "file-saver": "^2.0.5"
}
```

## Configuration Files to Update

### `next.config.mjs`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@google/generative-ai']
  },
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  }
};

export default nextConfig;
```

### `.env.local` (example)
```
GOOGLE_API_KEY=your_gemini_api_key_here
MAX_VIDEOS_PER_BATCH=10
MAX_VIDEO_SIZE_MB=100
RATE_LIMIT_PER_MINUTE=10
```

## Success Criteria

1. Users can successfully upload multiple videos simultaneously
2. Videos are processed one by one with proper rate limiting
3. All five analysis fields are accurately extracted
4. Results are displayed in an organized, searchable table
5. System handles errors gracefully with retry mechanisms
6. Performance remains smooth even with large video files
7. Rate limiting prevents API quota issues

## Notes

- Ensure proper video format support across different browsers
- Consider implementing video preview/thumbnail generation
- Plan for potential Gemini API response variations
- Design for scalability if usage grows significantly
- Consider adding user authentication for usage tracking 