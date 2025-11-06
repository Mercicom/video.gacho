# Google Sheets Export Setup Guide

This guide will help you set up Google Sheets export functionality for the Video Analyzer.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Video Analyzer")
5. Click "Create"

### 2. Enable Google Sheets API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in required fields (App name, User support email, Developer contact)
   - Click "Save and Continue"
   - Skip adding scopes (click "Save and Continue")
   - Add test users if needed (your email)
   - Click "Save and Continue"
4. Now create the OAuth client ID:
   - Application type: "Web application"
   - Name: "Video Analyzer Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - Your production URL (e.g., `https://yourdomain.com`)
   - You can leave "Authorized redirect URIs" empty
   - Click "Create"
5. Copy the **Client ID** (it looks like `xxxxx-xxxxx.apps.googleusercontent.com`)

### 4. Configure Your Application

Create a `.env.local` file in your project root with the following:

```bash
# Google Sheets Export OAuth Client ID
NEXT_PUBLIC_GOOGLE_SHEETS_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

Replace `your_client_id_here.apps.googleusercontent.com` with the Client ID you copied.

### 5. Restart Development Server

If you're running the development server, restart it:

```bash
npm run dev
```

## How It Works

### User Flow

1. User analyzes videos and gets results
2. User clicks "Export to Google Sheets" button
3. If not authenticated, a Google sign-in popup appears
4. User grants permission to create spreadsheets
5. A new spreadsheet is created with the analysis data
6. The spreadsheet opens automatically in a new tab

### Authentication Details

- **Scope requested**: `https://www.googleapis.com/auth/spreadsheets`
- **Token storage**: Session storage (cleared when browser closes)
- **No system-wide login**: Users only authenticate when exporting
- **Privacy**: Each user uses their own Google account and quota

### Data Format

The exported spreadsheet contains:
- **Filename**: Original video filename
- **Status**: Analysis status (completed, error, etc.)
- **Visual Hook**: Compelling visual elements
- **Text Hook**: Engaging text/caption suggestions
- **Voice Hook**: Verbal hooks and taglines
- **Video Script**: Complete transcript
- **Pain Point**: Problem-solving analysis
- **Processing Time**: Time taken for analysis (ms)
- **Timestamps**: Created and completed timestamps

### Features

- ✅ Header row is frozen for easy scrolling
- ✅ Columns auto-resize for readability
- ✅ Professional formatting with color-coded headers
- ✅ Text wrapping enabled for long content
- ✅ Same data format as CSV export

## Troubleshooting

### "Google Sheets Client ID not configured"

**Problem**: The environment variable is not set or incorrect.

**Solution**:
1. Check that `.env.local` exists in your project root
2. Verify the variable name: `NEXT_PUBLIC_GOOGLE_SHEETS_CLIENT_ID`
3. Ensure the Client ID is correct (ends with `.apps.googleusercontent.com`)
4. Restart your development server

### "Authentication failed"

**Problem**: OAuth consent screen not configured or user denied permission.

**Solution**:
1. Go back to Google Cloud Console
2. Configure OAuth consent screen properly
3. Add your email as a test user if app is in testing mode
4. Try authenticating again

### "Failed to create spreadsheet"

**Problem**: Google Sheets API not enabled or quota exceeded.

**Solution**:
1. Verify Google Sheets API is enabled in Google Cloud Console
2. Check your API quotas in "APIs & Services" > "Quotas"
3. If exceeded, wait for quota to reset or request increase

### "Popup blocked"

**Problem**: Browser is blocking the OAuth popup.

**Solution**:
1. Allow popups for your domain in browser settings
2. Click the export button again
3. The OAuth popup should appear

### Production Deployment

When deploying to production:

1. Add your production URL to "Authorized JavaScript origins" in Google Cloud Console
2. Set the `NEXT_PUBLIC_GOOGLE_SHEETS_CLIENT_ID` environment variable in your hosting platform (Vercel, Netlify, etc.)
3. If your app is in "Testing" mode in OAuth consent screen:
   - Only test users can use Google Sheets export
   - To allow all users, publish your app (requires verification for sensitive scopes)
   - Since we only use `spreadsheets` scope, verification is simpler

## API Quotas

Google Sheets API has the following quotas (as of 2024):

- **Read requests**: 300 per minute per project
- **Write requests**: 300 per minute per project
- **Per user quota**: 60 requests per minute per user

Our implementation:
- Uses 1 write request to create spreadsheet
- Minimal quota usage
- Each user has their own quota

## Security Considerations

- ✅ Only requests `spreadsheets` scope (minimal permissions)
- ✅ Token stored in sessionStorage (cleared on browser close)
- ✅ No server-side token storage
- ✅ Each user authenticates individually
- ✅ Client ID is public (safe to expose)
- ⚠️ Users grant permission to create/edit their own spreadsheets

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Verify your Google Cloud Console setup
3. Check browser console for detailed error messages
4. Create an issue on GitHub with error details

## Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google API Quotas](https://console.cloud.google.com/apis/api/sheets.googleapis.com/quotas)

