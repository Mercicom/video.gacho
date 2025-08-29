# Video Analyzer Implementation Plan

## Overview
This implementation plan details the step-by-step process to build the comprehensive Video Analyzer feature as specified in `feature_request.md`. The feature will integrate with the existing Next.js application structure and patterns.

## Current Codebase Analysis

### Existing Structure
- **Framework**: Next.js 14 with TypeScript and App Router
- **Styling**: Tailwind CSS with custom utility classes
- **Icons**: Lucide React
- **Dependencies**: Firebase, AI SDKs (Anthropic, OpenAI, Deepgram, Replicate)
- **Layout Pattern**: Grid-based homepage with feature cards
- **Component Patterns**: File upload components with drag & drop, preview functionality

### Existing Patterns to Follow
- File upload: Based on `ImageUpload.tsx` component structure
- API routes: Edge runtime with proper error handling
- Homepage integration: Grid card layout with hover effects

## Phase 1: Foundation Setup (Core Infrastructure)

### Step 1.1: Dependencies Installation
**Files to modify**: `package.json`
```bash
npm install @google/generative-ai react-dropzone @types/file-saver file-saver
```

**Dependencies to add**:
- `@google/generative-ai`: "^0.17.1" - Gemini API integration
- `react-dropzone`: "^14.2.3" - Enhanced drag & drop functionality
- `file-saver`: "^2.0.5" - CSV/JSON export functionality
- `@types/file-saver`: "^2.0.5" - TypeScript definitions

### Step 1.2: Environment Configuration
**Files to modify**: 
- `.env.local` (create/update)
- `.env.example` (create)

**Environment variables to add**:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
MAX_VIDEOS_PER_BATCH=10
MAX_VIDEO_SIZE_MB=100
RATE_LIMIT_PER_MINUTE=10
```

### Step 1.3: Next.js Configuration Update
**Files to modify**: `next.config.mjs`

**Updates needed**:
- Add server components external packages for Gemini AI
- Update API body parser size limit to 100MB
- Add video domain patterns if needed

### Step 1.4: Type Definitions
**Files to create**: `src/types/video-analysis.ts`

**Content**: Define all TypeScript interfaces for the feature
- `VideoAnalysisRequest`
- `VideoAnalysisResult` 
- `VideoAnalysisSession`
- `AnalysisOptions`
- `RateLimitInfo`
- `UploadedVideo`

## Phase 2: Homepage Integration

### Step 2.1: Update Homepage
**Files to modify**: `src/app/page.tsx`

**Changes**:
1. Add fifth card to the grid layout
2. Implement Video Analyzer card with:
   - Title: "Video Analyzer"
   - Description: "Analyze videos in bulk to extract visual hooks, text hooks, voice hooks, scripts, and pain points using AI-powered insights."
   - Hover effects matching existing cards
   - Link to `/video-analyzer` route

**Technical approach**:
- Update grid to `lg:grid-cols-5` or maintain 4 and reorganize
- Add proper routing with Next.js Link component
- Match existing card styling exactly

## Phase 3: Core Components Development

### Step 3.1: VideoUpload Component
**Files to create**: `src/components/VideoUpload.tsx`

**Functionality**:
- Multi-file video upload with drag & drop using react-dropzone
- Video preview/thumbnail generation
- File validation (type, size)
- Progress indicators
- Individual file removal
- Error handling and user feedback

**Key features**:
- Support for `.mp4`, `.mov`, `.avi`, `.mkv` formats
- 100MB per file size limit
- Visual feedback during upload process
- Accessibility support

### Step 3.2: VideoAnalysisTable Component
**Files to create**: `src/components/VideoAnalysisTable.tsx`

**Functionality**:
- Responsive data table with sortable columns
- Status indicators (pending, processing, completed, error)
- Expandable rows for detailed analysis view
- Export functionality (CSV, JSON)
- Retry mechanism for failed analyses
- Real-time progress updates

**Table columns**:
- Filename
- Status with visual indicators
- Visual Hook
- Text Hook  
- Voice Hook
- Video Script (truncated with expand)
- Pain Point
- Processing Time
- Actions (retry, expand, delete)

### Step 3.3: RateLimitManager Component
**Files to create**: `src/components/RateLimitManager.tsx`

**Functionality**:
- Visual rate limit indicator
- Queue position display
- Estimated completion time
- Pause/resume controls
- Progress visualization
- Rate limit warnings

## Phase 4: Video Analyzer Page

### Step 4.1: Main Page Structure
**Files to create**: `src/app/video-analyzer/page.tsx`

**Layout sections**:
1. **Header Section**
   - Page title and subtitle
   - Progress indicator
   - Instructions/help text

2. **Upload Section**  
   - VideoUpload component integration
   - Upload statistics
   - File management controls

3. **Analysis Section**
   - Analysis configuration options
   - Start/pause/stop controls  
   - RateLimitManager integration
   - Batch processing controls

4. **Results Section**
   - VideoAnalysisTable integration
   - Export functionality
   - Filter and search capabilities

### Step 4.2: State Management
**Files to create**: `src/app/video-analyzer/hooks/useVideoAnalysis.ts`

**State management**:
- Upload state management
- Analysis progress tracking
- Results data management
- Error state handling
- localStorage persistence for session recovery

## Phase 5: API Integration

### Step 5.1: Gemini API Route
**Files to create**: `src/app/api/gemini/analyze-video/route.ts`

**Functionality**:
- Video file processing and upload handling
- Gemini API integration for video analysis
- Structured response formatting
- Rate limiting enforcement
- Error handling and retry logic

**Analysis prompts**:
- Visual Hook extraction
- Text Hook generation
- Voice Hook identification  
- Video Script transcription
- Pain Point analysis

### Step 5.2: Rate Limiting System
**Files to create**: `src/lib/utils/rateLimitQueue.ts`

**Queue system features**:
- FIFO processing queue
- 10 requests per minute limit (configurable)
- Automatic retry with exponential backoff
- localStorage persistence
- Queue status management
- Progress callbacks

**Architecture**:
```typescript
class VideoAnalysisQueue {
  private queue: VideoAnalysisRequest[]
  private processing: boolean
  private requestsInLastMinute: number
  private lastResetTime: number
  
  // Core methods
  addToQueue(request: VideoAnalysisRequest): void
  processQueue(): Promise<void>
  pauseProcessing(): void
  resumeProcessing(): void
  getQueueStatus(): QueueStatus
}
```

## Phase 6: Advanced Features

### Step 6.1: File Handling Utilities
**Files to create**: `src/lib/utils/videoUtils.ts`

**Utilities**:
- Video file validation
- Thumbnail generation
- File size formatting
- Video duration calculation
- Format conversion helpers

### Step 6.2: Export Functionality
**Files to create**: `src/lib/utils/exportUtils.ts`

**Export features**:
- CSV export with customizable columns
- JSON export with full data
- Filtered data export
- Progress indicators for large exports

### Step 6.3: Error Handling System
**Files to create**: `src/lib/utils/errorHandling.ts`

**Error types and handling**:
- File upload errors
- API rate limit errors
- Gemini API errors
- Network connectivity issues
- Recovery mechanisms

## Phase 7: UI/UX Enhancements

### Step 7.1: Loading States and Animations
**Enhancements**:
- Loading skeletons for table rows
- Progress animations
- Smooth state transitions
- Success/error animations

### Step 7.2: Responsive Design
**Responsive features**:
- Mobile-optimized upload interface
- Responsive table with horizontal scrolling
- Touch-friendly controls
- Progressive enhancement

### Step 7.3: Accessibility
**Accessibility features**:
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- High contrast mode support
- Focus management

## Phase 8: Data Persistence

### Step 8.1: Browser Storage
**Files to create**: `src/lib/utils/storage.ts`

**Storage features**:
- Session persistence in localStorage
- Analysis results caching
- Queue state recovery
- Settings persistence

### Step 8.2: Session Management
**Session features**:
- Auto-save analysis sessions
- Session recovery on page refresh
- Multiple session support
- Session cleanup

## Phase 9: Performance Optimizations

### Step 9.1: Video Processing Optimizations
**Optimizations**:
- Client-side video compression
- Chunked uploads for large files
- Background processing
- Memory management for previews

### Step 9.2: UI Performance
**Optimizations**:
- Virtual scrolling for large result sets
- Debounced search and filters
- Lazy loading of components
- Memoization of expensive calculations

## Phase 10: Testing Strategy

### Step 10.1: Unit Tests
**Files to create**: `__tests__/` directory structure

**Test coverage**:
- Component rendering and interaction
- API route functionality
- Rate limiting logic
- File validation utilities
- Error handling scenarios

### Step 10.2: Integration Tests
**Integration test areas**:
- End-to-end analysis workflow
- File upload process
- API integration
- Rate limiting behavior
- Error recovery

### Step 10.3: Performance Tests
**Performance testing**:
- Large file handling
- Concurrent request processing
- Memory usage optimization
- Network error simulation

## Implementation Timeline

### Week 1: Foundation
- Steps 1.1-1.4: Dependencies and configuration
- Steps 2.1: Homepage integration
- Initial project structure setup

### Week 2: Core Components
- Steps 3.1-3.3: VideoUpload, VideoAnalysisTable, RateLimitManager
- Basic component functionality and styling

### Week 3: Main Page and API
- Steps 4.1-4.2: Video analyzer page and state management
- Steps 5.1-5.2: Gemini API integration and rate limiting

### Week 4: Advanced Features
- Steps 6.1-6.3: File handling, export, and error handling
- Initial testing and bug fixes

### Week 5: UI/UX and Performance
- Steps 7.1-7.3: UI enhancements and accessibility
- Steps 9.1-9.2: Performance optimizations

### Week 6: Testing and Polish
- Steps 8.1-8.2: Data persistence
- Steps 10.1-10.3: Comprehensive testing
- Documentation and final polish

## Success Criteria Checklist

- [ ] Users can upload multiple videos simultaneously
- [ ] Videos process with proper rate limiting (10/minute)
- [ ] All five analysis fields are extracted accurately
- [ ] Results display in organized, searchable table
- [ ] Graceful error handling with retry mechanisms
- [ ] Smooth performance with large video files
- [ ] Rate limiting prevents API quota issues
- [ ] Export functionality works correctly
- [ ] Mobile responsive design
- [ ] Accessibility standards met

## Risk Mitigation

### Technical Risks
1. **Gemini API limitations**: Implement robust error handling and fallback mechanisms
2. **Large file processing**: Use chunked uploads and client-side compression
3. **Rate limiting complexity**: Thorough testing of queue system with various scenarios
4. **Browser compatibility**: Test across major browsers and devices

### Performance Risks
1. **Memory usage**: Implement proper cleanup and garbage collection
2. **Network issues**: Add retry logic and offline capability
3. **Concurrent processing**: Test with multiple users and high load scenarios

## Post-Implementation Considerations

### Monitoring
- API usage tracking
- Error rate monitoring  
- Performance metrics
- User engagement analytics

### Scalability
- Database integration for result persistence
- User authentication for usage tracking
- CDN integration for video storage
- Horizontal scaling for API processing

### Feature Enhancements
- Batch analysis templates
- Custom analysis prompts
- Integration with other AI services
- Advanced filtering and search
- Team collaboration features

## Dependencies Summary

### Required Dependencies
```json
{
  "@google/generative-ai": "^0.17.1",
  "react-dropzone": "^14.2.3", 
  "file-saver": "^2.0.5",
  "@types/file-saver": "^2.0.5"
}
```

### Environment Variables
```env
GOOGLE_API_KEY=required
MAX_VIDEOS_PER_BATCH=10
MAX_VIDEO_SIZE_MB=100
RATE_LIMIT_PER_MINUTE=10
```

This comprehensive implementation plan provides a structured approach to building the Video Analyzer feature while maintaining consistency with the existing codebase patterns and ensuring high quality, maintainable code. 