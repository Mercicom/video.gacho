import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { VideoAnalysisApiResponse, AnalysisOptions } from '@/types/video-analysis';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Enhanced rate limiting storage with better tracking
interface RateLimitData {
  count: number;
  resetTime: number;
  requests: Array<{ timestamp: number; id: string }>;
  lastCleanup: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

// Rate limiting configuration
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10');
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_VIDEO_SIZE_BYTES = parseInt(process.env.MAX_VIDEO_SIZE_MB || '100') * 1024 * 1024;
const CLEANUP_INTERVAL_MS = 300000; // 5 minutes

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of Array.from(rateLimitStore.entries())) {
    if (now > data.resetTime + CLEANUP_INTERVAL_MS) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

// Analysis prompts
const ANALYSIS_PROMPT = `
Analyze the provided video and extract marketing insights:

1. **Visual Hook**: Identify the most compelling visual element that grabs attention in the first 3 seconds. Focus on colors, movement, composition, and visual storytelling elements.

2. **Text Hook**: Extract or suggest the most engaging text/caption that would accompany this video. This should be a short, attention-grabbing phrase or question.

3. **Voice Hook**: Analyze the audio/speech and identify the most compelling verbal hook, tagline, or opening line that creates curiosity and engagement.

4. **Video Script**: Provide a COMPLETE and DETAILED transcript of ALL spoken content in the video. Include every word spoken, with precise timestamps in [MM:SS] format. Do not summarize or truncate - capture the entire verbal content from start to finish. If no speech is detected, indicate "No spoken content detected".

5. **Pain Point**: Identify what problem this video addresses and how it positions the solution. What frustration or desire does it tap into?

Keep each field concise but informative (max 200 words per field).
`;

// Define the structured output schema  
const OUTPUT_SCHEMA = {
  type: SchemaType.OBJECT as const,
  properties: {
    visualHook: {
      type: SchemaType.STRING as const,
      description: "Description of the most compelling visual element that grabs attention"
    },
    textHook: {
      type: SchemaType.STRING as const, 
      description: "Suggested engaging text or caption for the video"
    },
    voiceHook: {
      type: SchemaType.STRING as const,
      description: "Compelling verbal hook, tagline, or opening line"
    },
    videoScript: {
      type: SchemaType.STRING as const,
      description: "Complete transcript of all spoken content with timestamps"
    },
    painPoint: {
      type: SchemaType.STRING as const,
      description: "Problem this video addresses and solution positioning"
    }
  },
  required: ["visualHook", "textHook", "voiceHook", "videoScript", "painPoint"]
};

// Enhanced rate limit checker with sliding window
function checkRateLimit(ip: string, requestId?: string): { 
  allowed: boolean; 
  remaining: number; 
  resetTime: number; 
  requestsInLastMinute: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = ip;
  let limitData = rateLimitStore.get(key);

  // Initialize if doesn't exist
  if (!limitData) {
    limitData = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
      requests: [],
      lastCleanup: now
    };
    rateLimitStore.set(key, limitData);
  }

  // Clean up old requests (sliding window approach)
  const oneMinuteAgo = now - RATE_LIMIT_WINDOW_MS;
  limitData.requests = limitData.requests.filter(req => req.timestamp > oneMinuteAgo);
  
  // Update count based on cleaned requests
  limitData.count = limitData.requests.length;

  // Reset window if needed
  if (now > limitData.resetTime) {
    limitData.resetTime = now + RATE_LIMIT_WINDOW_MS;
  }

  // Check if rate limit exceeded
  if (limitData.count >= RATE_LIMIT_PER_MINUTE) {
    const oldestRequest = limitData.requests[0];
    const retryAfter = oldestRequest ? Math.ceil((oldestRequest.timestamp + RATE_LIMIT_WINDOW_MS - now) / 1000) : 60;
    
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: limitData.resetTime,
      requestsInLastMinute: limitData.count,
      retryAfter
    };
  }

  // Add current request
  const currentRequestId = requestId || `req_${now}_${Math.random().toString(36).substr(2, 9)}`;
  limitData.requests.push({ timestamp: now, id: currentRequestId });
  limitData.count = limitData.requests.length;

  return { 
    allowed: true, 
    remaining: RATE_LIMIT_PER_MINUTE - limitData.count, 
    resetTime: limitData.resetTime,
    requestsInLastMinute: limitData.count
  };
}

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString('base64');
}

// Helper function to get video format
function getVideoMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: { [key: string]: string } = {
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'webm': 'video/webm',
    'm4v': 'video/mp4',
  };
  return mimeTypes[ext || 'mp4'] || 'video/mp4';
}

// Helper function to validate analysis options
function validateAnalysisOptions(options: any): AnalysisOptions {
  return {
    includeVisualHook: options?.includeVisualHook ?? true,
    includeTextHook: options?.includeTextHook ?? true,
    includeVoiceHook: options?.includeVoiceHook ?? true,
    includeVideoScript: options?.includeVideoScript ?? true,
    includePainPoint: options?.includePainPoint ?? true,
  };
}

// Helper function to filter analysis results based on options
function filterAnalysisResults(results: any, options: AnalysisOptions) {
  const filtered: any = {};
  
  if (options.includeVisualHook) filtered.visualHook = results.visualHook;
  if (options.includeTextHook) filtered.textHook = results.textHook;
  if (options.includeVoiceHook) filtered.voiceHook = results.voiceHook;
  if (options.includeVideoScript) filtered.videoScript = results.videoScript;
  if (options.includePainPoint) filtered.painPoint = results.painPoint;
  
  return filtered;
}

export async function POST(request: NextRequest): Promise<NextResponse<VideoAnalysisApiResponse>> {
  const startTime = Date.now();
  
  try {
    // Check if API key is configured
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Gemini API key is not configured',
          code: 'MISSING_API_KEY',
        },
        rateLimitInfo: {
          remaining: RATE_LIMIT_PER_MINUTE,
          resetTime: Date.now() + 60000,
          requestsInLastMinute: 0,
          maxRequestsPerMinute: RATE_LIMIT_PER_MINUTE,
        },
      }, { status: 500 });
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 
              'unknown';

    // Check rate limit with enhanced tracking
    const requestId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const rateLimitCheck = checkRateLimit(ip, requestId);
    const rateLimitInfo = {
      remaining: rateLimitCheck.remaining,
      resetTime: rateLimitCheck.resetTime,
      requestsInLastMinute: rateLimitCheck.requestsInLastMinute,
      maxRequestsPerMinute: RATE_LIMIT_PER_MINUTE,
    };

    if (!rateLimitCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: {
          message: `Rate limit exceeded. Please wait ${rateLimitCheck.retryAfter || 60} seconds before making another request.`,
          code: 'RATE_LIMIT_EXCEEDED',
          details: { 
            resetTime: rateLimitCheck.resetTime,
            retryAfter: rateLimitCheck.retryAfter,
            requestsInLastMinute: rateLimitCheck.requestsInLastMinute
          },
        },
        rateLimitInfo,
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitCheck.retryAfter || 60),
          'X-RateLimit-Limit': String(RATE_LIMIT_PER_MINUTE),
          'X-RateLimit-Remaining': String(rateLimitCheck.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimitCheck.resetTime / 1000))
        }
      });
    }

    // Parse form data
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const optionsString = formData.get('options') as string;

    // Validate video file
    if (!videoFile) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'No video file provided',
          code: 'MISSING_VIDEO_FILE',
        },
        rateLimitInfo,
      }, { status: 400 });
    }

    // Check file size
    if (videoFile.size > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json({
        success: false,
        error: {
          message: `Video file too large. Maximum size is ${MAX_VIDEO_SIZE_BYTES / 1024 / 1024}MB`,
          code: 'FILE_TOO_LARGE',
          details: { maxSize: MAX_VIDEO_SIZE_BYTES, actualSize: videoFile.size },
        },
        rateLimitInfo,
      }, { status: 400 });
    }

    // Parse and validate analysis options
    let analysisOptions: AnalysisOptions;
    try {
      const parsedOptions = optionsString ? JSON.parse(optionsString) : {};
      analysisOptions = validateAnalysisOptions(parsedOptions);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid analysis options format',
          code: 'INVALID_OPTIONS',
        },
        rateLimitInfo,
      }, { status: 400 });
    }

    // Convert video to base64 for Gemini API
    const videoBase64 = await fileToBase64(videoFile);
    const mimeType = getVideoMimeType(videoFile.name);

    // Initialize Gemini model with structured output configuration
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: OUTPUT_SCHEMA,
      },
    });

    // Prepare the request
    const videoPart = {
      inlineData: {
        data: videoBase64,
        mimeType: mimeType,
      },
    };

    try {
      // Generate content using Gemini with structured output
      const result = await model.generateContent([ANALYSIS_PROMPT, videoPart]);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response (structured output guarantees valid JSON)
      let analysisResults;
      try {
        analysisResults = JSON.parse(text);
      } catch (parseError) {
        console.error('Structured output JSON parsing failed:', parseError);
        console.log('Raw response text:', text);
        
        // If structured output fails, return error
        throw new Error('Failed to parse structured output response');
      }

      // Filter results based on analysis options
      const filteredResults = filterAnalysisResults(analysisResults, analysisOptions);

      const processingTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        data: {
          id: requestId,
          ...filteredResults,
          processingTime,
        },
        rateLimitInfo,
      }, { 
        status: 200,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_PER_MINUTE),
          'X-RateLimit-Remaining': String(rateLimitInfo.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimitInfo.resetTime / 1000))
        }
      });

    } catch (geminiError) {
      console.error('Gemini API Error:', geminiError);
      
      // Handle specific Gemini API errors
      let errorMessage = 'Failed to analyze video';
      let errorCode = 'ANALYSIS_FAILED';
      
      if (geminiError instanceof Error) {
        if (geminiError.message.includes('quota')) {
          errorMessage = 'API quota exceeded. Please try again later.';
          errorCode = 'QUOTA_EXCEEDED';
        } else if (geminiError.message.includes('safety')) {
          errorMessage = 'Video content was blocked by safety filters.';
          errorCode = 'CONTENT_BLOCKED';
        } else if (geminiError.message.includes('unsupported')) {
          errorMessage = 'Video format not supported for analysis.';
          errorCode = 'UNSUPPORTED_FORMAT';
        }
      }

      return NextResponse.json({
        success: false,
        error: {
          message: errorMessage,
          code: errorCode,
          details: geminiError instanceof Error ? geminiError.message : String(geminiError),
        },
        rateLimitInfo,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API Route Error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : String(error),
      },
      rateLimitInfo: {
        remaining: RATE_LIMIT_PER_MINUTE,
        resetTime: Date.now() + 60000,
        requestsInLastMinute: 0,
        maxRequestsPerMinute: RATE_LIMIT_PER_MINUTE,
      },
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: {
      message: 'Method not allowed. Use POST to analyze videos.',
      code: 'METHOD_NOT_ALLOWED',
    },
    rateLimitInfo: {
      remaining: RATE_LIMIT_PER_MINUTE,
      resetTime: Date.now() + 60000,
      requestsInLastMinute: 0,
      maxRequestsPerMinute: RATE_LIMIT_PER_MINUTE,
    },
  }, { status: 405 });
} 