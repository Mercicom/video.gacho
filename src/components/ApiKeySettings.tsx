'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

interface ApiKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentKey?: string;
}

const API_KEY_STORAGE_KEY = 'gemini-api-key';

export default function ApiKeySettings({ isOpen, onClose, onSave, currentKey }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && currentKey) {
      setApiKey(currentKey);
    }
  }, [isOpen, currentKey]);

  const validateApiKey = (key: string): boolean => {
    // Google Gemini API keys start with "AIza"
    if (!key) {
      setError('API key is required');
      return false;
    }
    
    if (!key.startsWith('AIza')) {
      setError('Invalid API key format. Google Gemini API keys start with "AIza"');
      return false;
    }
    
    if (key.length < 39) {
      setError('API key appears to be incomplete');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSave = () => {
    if (validateApiKey(apiKey)) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      onSave(apiKey);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to remove your API key? You will need to enter it again to analyze videos.')) {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      setApiKey('');
      onSave('');
      onClose();
    }
  };

  const maskApiKey = (key: string): string => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '••••••••••••••••••••••••••••' + key.substring(key.length - 4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">API Key Configuration</h2>
              <p className="text-sm text-gray-500">Enter your Google Gemini API key to analyze videos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Why do I need an API key?</h3>
            <p className="text-sm text-blue-800 mb-3">
              This application uses Google&apos;s Gemini AI to analyze videos. To use it, you need your own free API key from Google.
              Each user provides their own key, which means:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Completely free to use (Google provides 15 requests per minute for free)</li>
              <li>Your API key is stored only in your browser (never on our servers)</li>
              <li>You have full control over your usage and data</li>
              <li>No sharing of API quotas with other users</li>
            </ul>
          </div>

          {/* Get API Key */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">How to get a free API key:</h3>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside mb-4">
              <li>Visit Google AI Studio (link below)</li>
              <li>Sign in with your Google account</li>
              <li>Click &quot;Get API Key&quot; or &quot;Create API Key&quot;</li>
              <li>Copy the key (starts with &quot;AIza...&quot;)</li>
              <li>Paste it in the field below</li>
            </ol>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Get Free API Key from Google
            </a>
          </div>

          {/* API Key Input */}
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError('');
                  setSuccess(false);
                }}
                placeholder="AIza..."
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {error && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>API key saved successfully!</span>
              </div>
            )}

            {currentKey && !showKey && (
              <p className="mt-2 text-sm text-gray-500">
                Current key: {maskApiKey(currentKey)}
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Your API key is secure
            </h3>
            <p className="text-sm text-green-800">
              Your API key is stored only in your browser&apos;s local storage and is never sent to our servers.
              It&apos;s only used to communicate directly with Google&apos;s Gemini API.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={!apiKey || success}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {success ? 'Saved!' : 'Save API Key'}
            </button>
            {currentKey && (
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Clear Key
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get API key from localStorage
export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

// Helper function to check if API key exists
export function hasStoredApiKey(): boolean {
  if (typeof window === 'undefined') return false;
  const key = localStorage.getItem(API_KEY_STORAGE_KEY);
  return !!key && key.startsWith('AIza');
}

