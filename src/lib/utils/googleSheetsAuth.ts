/**
 * Google Sheets OAuth Authentication
 * 
 * Handles OAuth 2.0 flow for Google Sheets API access
 * Only requests spreadsheets scope - no full system authentication required
 */

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_CLIENT_ID || '';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_STORAGE_KEY = 'google_sheets_access_token';
const TOKEN_EXPIRY_KEY = 'google_sheets_token_expiry';

export interface GoogleAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Initialize Google Identity Services
 * Should be called once when the app loads
 */
export function initializeGoogleAuth(): void {
  if (typeof window === 'undefined') return;
  
  // Load Google Identity Services script
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

/**
 * Check if user is currently authenticated with Google Sheets
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) return false;
  
  // Check if token is expired
  const expiryTime = parseInt(expiry, 10);
  const now = Date.now();
  
  return now < expiryTime;
}

/**
 * Get current access token
 */
export function getAccessToken(): string | null {
  if (!isAuthenticated()) return null;
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Store access token in session storage
 */
function storeToken(token: string, expiresIn: number): void {
  const expiryTime = Date.now() + (expiresIn * 1000);
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Clear stored authentication
 */
export function clearAuth(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Sign in with Google using OAuth 2.0
 * Opens popup for user consent
 * 
 * @returns Promise that resolves with access token
 */
export function signInWithGoogle(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window object not available'));
      return;
    }
    
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Sheets Client ID not configured. Please add NEXT_PUBLIC_GOOGLE_SHEETS_CLIENT_ID to your environment variables.'));
      return;
    }
    
    // Check if already authenticated
    if (isAuthenticated()) {
      const token = getAccessToken();
      if (token) {
        resolve(token);
        return;
      }
    }
    
    // Initialize the tokenClient
    try {
      // @ts-ignore - Google Identity Services global
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: (response: any) => {
          if (response.error) {
            console.error('OAuth error:', response.error);
            reject(new Error(`Authentication failed: ${response.error}`));
            return;
          }
          
          if (response.access_token) {
            // Store token
            storeToken(response.access_token, response.expires_in || 3600);
            resolve(response.access_token);
          } else {
            reject(new Error('No access token received'));
          }
        },
      });
      
      // Request access token
      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Failed to initialize OAuth client:', error);
      reject(new Error('Failed to initialize Google authentication. Please make sure Google Identity Services is loaded.'));
    }
  });
}

/**
 * Sign out and clear stored credentials
 */
export function signOut(): void {
  clearAuth();
  
  // Revoke token with Google if possible
  const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (token && typeof window !== 'undefined') {
    // @ts-ignore - Google Identity Services global
    if (window.google?.accounts?.oauth2) {
      try {
        // @ts-ignore
        google.accounts.oauth2.revoke(token, () => {
          console.log('Token revoked successfully');
        });
      } catch (error) {
        console.warn('Failed to revoke token:', error);
      }
    }
  }
}

/**
 * Get user info (if needed for display)
 * Note: This requires additional scope (profile) which we're not requesting
 * This is a placeholder for future enhancement
 */
export async function getUserInfo(accessToken: string): Promise<any> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

/**
 * Validate that Google Identity Services is loaded
 */
export function isGoogleAuthLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  // @ts-ignore
  return typeof window.google !== 'undefined' && typeof window.google.accounts !== 'undefined';
}

/**
 * Wait for Google Identity Services to load
 * Useful for ensuring the library is ready before attempting auth
 */
export function waitForGoogleAuth(timeout: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isGoogleAuthLoaded()) {
      resolve();
      return;
    }
    
    let elapsed = 0;
    const interval = 100;
    
    const checkInterval = setInterval(() => {
      if (isGoogleAuthLoaded()) {
        clearInterval(checkInterval);
        resolve();
      } else if (elapsed >= timeout) {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for Google Identity Services to load'));
      }
      elapsed += interval;
    }, interval);
  });
}

