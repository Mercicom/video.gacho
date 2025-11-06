# 🎬 Video Analyzer

**Analyze videos with AI to extract marketing insights**

Extract from any video:
- 🎯 **Visual Hook** - Most compelling visual element in first 3 seconds
- 📝 **Text Hook** - Attention-grabbing text/caption suggestions  
- 🗣️ **Voice Hook** - Engaging verbal hooks and taglines
- 📜 **Full Script** - Complete transcript with timestamps
- 😤 **Pain Point** - Problems addressed and solutions positioned

**Built for non-developers** - Just get a free API key from Google and analyze videos instantly!

## 🌐 Live Demo

**Try it now:** https://video-gacho.netlify.app *(URL will be updated after deployment)*

## 🚀 Two Ways to Use

### Option A: Use the Live Website (Easiest!)

1. **Visit the website** (link above)
2. **Get your free API key**:
   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key (starts with `AIza...`)
3. **Enter your API key** in the settings panel
4. **Start analyzing** videos!

Your API key is stored only in your browser and never sent to our servers.

### Option B: Run Locally (For Developers)

#### Step 1: Get Your Copy
1. **Clone this repository**:
   ```bash
   git clone https://github.com/Mercicom/video.gacho.git
   cd video.gacho
   ```

#### Step 2: Install Dependencies
```bash
npm install        # Install dependencies (takes 1-2 minutes)
```

#### Step 3: Run Development Server
```bash
npm run dev        # Start the server
```

#### Step 4: Use It! 
- Open: http://localhost:3000/video-analyzer
- Click "API Settings" to enter your Google Gemini API key
- Upload video files (MP4, WebM, etc.)
- Click "Analyze" and wait for results
- Export as CSV, JSON, or Google Sheets

**That's it! 🎉 No environment variables or complex setup required.**

## How It Works

**User-Provided API Keys**: This application uses a unique approach where each user provides their own Google Gemini API key through the browser interface. This means:

- ✅ **Free for everyone** - Each user uses their own free Google API quota
- ✅ **No server costs** - No shared API keys or server-side API expenses
- ✅ **Secure** - API keys are stored only in your browser, never on our servers
- ✅ **Private** - Each user has their own API quota and usage limits
- ✅ **Unlimited users** - Support infinite users without additional costs

## Optional Environment Variables

For deployment or local development, you can set these optional limits (defaults shown):
- `RATE_LIMIT_PER_MINUTE=10`
- `MAX_VIDEO_SIZE_MB=100`
- `MAX_VIDEOS_PER_BATCH=500`

**Note:** No `GOOGLE_API_KEY` environment variable is needed. Users enter their own keys via the UI.

### Google Sheets Export (Optional)

To enable direct export to Google Sheets:

1. Set up OAuth 2.0 credentials in Google Cloud Console
2. Add this environment variable:
   ```
   NEXT_PUBLIC_GOOGLE_SHEETS_CLIENT_ID=your_client_id.apps.googleusercontent.com
   ```

See [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) for detailed setup instructions.

## 🔧 Troubleshooting

### Common Issues

**"API key not configured"** or **"API Key Required"**
- Click the "API Settings" button in the top right
- Enter your Google Gemini API key (get it from https://aistudio.google.com/app/apikey)
- Make sure you copied the full key (starts with `AIza...`)
- Click "Save API Key"

**"Invalid API key format"**
- Google Gemini API keys always start with `AIza`
- Make sure you copied the entire key without spaces
- Get a new key if yours is invalid: https://aistudio.google.com/app/apikey

**"Rate limit exceeded"** 
- The tool automatically waits and retries (this is normal!)
- Reduce batch size if analyzing many videos
- Free Gemini API: 15 requests per minute per user
- Each user has their own quota

**"File too large"**
- Default limit: 100MB per video
- Try compressing your video or use smaller files
- To increase: edit `.env.local` and add `MAX_VIDEO_SIZE_MB=200`

**"npm command not found"**
- Install Node.js from https://nodejs.org first
- Restart your terminal after installation

**Videos not uploading**
- Supported formats: MP4, WebM, MOV, AVI
- Make sure file isn't corrupted
- Try a different video file

### Need Help?
- Check that Node.js is installed: `node --version` 
- Check that dependencies are installed: `ls node_modules` should show folders
- Still stuck? Create an issue on GitHub

## ✨ Features

### Core Video Analysis
- **Smart Hook Detection** - AI identifies the most engaging visual, text, and voice elements
- **Complete Transcription** - Full word-by-word transcript with precise timestamps  
- **Pain Point Analysis** - Understands what problems the video addresses
- **Batch Processing** - Analyze multiple videos at once
- **Export Results** - Download as CSV, JSON, or directly to Google Sheets

### Built for Non-Technical Users
- **Simple Setup** - Just run 3 commands and enter your API key
- **No Coding Required** - Clean web interface, no configuration files to edit
- **Automatic Rate Limiting** - Handles API limits automatically 
- **Progress Tracking** - See real-time analysis progress
- **Error Recovery** - Automatically retries failed analyses

### Optional Features (Additional API Keys Required)
If you add other API keys, you can also access:
- **AI Chat** - Talk to different AI models (OpenAI, Anthropic)
- **Voice Recording** - Record and transcribe voice notes (Deepgram)
- **Image Generation** - Create images from text (Replicate)
- **User Authentication** - Save your work (Firebase)

*But remember: Only Google Gemini API key is required for video analysis!*

## 📋 Requirements

- **Node.js 18+** (free from nodejs.org)
- **Google Gemini API Key** (free from Google AI Studio)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **Video files** in common formats (MP4, WebM, MOV, etc.)

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: TailwindCSS  
- **AI**: Google Gemini Vision API
- **Optional**: OpenAI, Anthropic, Deepgram, Replicate APIs
