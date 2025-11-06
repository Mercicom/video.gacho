/**
 * Google Sheets Export Utility
 * 
 * Creates and populates Google Spreadsheets with video analysis results
 * Uses Google Sheets API v4
 */

import { VideoAnalysisResult, ExportConfig } from '@/types/video-analysis';
import { getAccessToken } from './googleSheetsAuth';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface CreateSpreadsheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
  success: boolean;
  error?: string;
}

/**
 * Create a new Google Spreadsheet with video analysis data
 */
export async function createSpreadsheet(
  results: VideoAnalysisResult[],
  config?: Partial<ExportConfig>
): Promise<CreateSpreadsheetResponse> {
  try {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      throw new Error('Not authenticated. Please sign in with Google first.');
    }
    
    if (results.length === 0) {
      throw new Error('No data to export');
    }
    
    // Generate spreadsheet title with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const title = `Video Analysis Export - ${timestamp}`;
    
    // Prepare headers and data rows
    const { headers, rows } = prepareSpreadsheetData(results, config);
    
    // Create spreadsheet with initial data
    const spreadsheetData = {
      properties: {
        title: title,
      },
      sheets: [
        {
          properties: {
            title: 'Analysis Results',
            gridProperties: {
              rowCount: rows.length + 1, // +1 for header
              columnCount: headers.length,
              frozenRowCount: 1, // Freeze header row
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                // Header row
                {
                  values: headers.map(header => ({
                    userEnteredValue: { stringValue: header },
                    userEnteredFormat: {
                      backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                      textFormat: {
                        foregroundColor: { red: 1, green: 1, blue: 1 },
                        bold: true,
                        fontSize: 11,
                      },
                      horizontalAlignment: 'CENTER',
                    },
                  })),
                },
                // Data rows
                ...rows.map(row => ({
                  values: row.map(cell => ({
                    userEnteredValue: { stringValue: cell },
                    userEnteredFormat: {
                      wrapStrategy: 'WRAP',
                      verticalAlignment: 'TOP',
                    },
                  })),
                })),
              ],
            },
          ],
        },
      ],
    };
    
    // Create the spreadsheet
    const response = await fetch(SHEETS_API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(spreadsheetData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to create spreadsheet: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Auto-resize columns for better readability
    try {
      await autoResizeColumns(result.spreadsheetId, accessToken, headers.length);
    } catch (error) {
      console.warn('Failed to auto-resize columns:', error);
      // Non-critical error, continue
    }
    
    return {
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
      success: true,
    };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    return {
      spreadsheetId: '',
      spreadsheetUrl: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Prepare spreadsheet data from video analysis results
 * Same format as CSV export
 */
function prepareSpreadsheetData(
  results: VideoAnalysisResult[],
  config?: Partial<ExportConfig>
): { headers: string[]; rows: string[][] } {
  // Default configuration - include all fields (same as CSV)
  const includeFields = {
    filename: true,
    status: true,
    visualHook: true,
    textHook: true,
    voiceHook: true,
    videoScript: true,
    painPoint: true,
    processingTime: true,
    timestamps: true,
    ...config?.includeFields,
  };
  
  // Build headers
  const headers: string[] = [];
  if (includeFields.filename) headers.push('Filename');
  if (includeFields.status) headers.push('Status');
  if (includeFields.visualHook) headers.push('Visual Hook');
  if (includeFields.textHook) headers.push('Text Hook');
  if (includeFields.voiceHook) headers.push('Voice Hook');
  if (includeFields.videoScript) headers.push('Video Script');
  if (includeFields.painPoint) headers.push('Pain Point');
  if (includeFields.processingTime) headers.push('Processing Time (ms)');
  if (includeFields.timestamps) {
    headers.push('Created At');
    headers.push('Completed At');
  }
  
  // Build data rows
  const rows: string[][] = results.map(result => {
    const row: string[] = [];
    
    if (includeFields.filename) {
      row.push(result.filename || '');
    }
    
    if (includeFields.status) {
      row.push(result.status || '');
    }
    
    if (includeFields.visualHook) {
      row.push(result.visualHook || '');
    }
    
    if (includeFields.textHook) {
      row.push(result.textHook || '');
    }
    
    if (includeFields.voiceHook) {
      row.push(result.voiceHook || '');
    }
    
    if (includeFields.videoScript) {
      row.push(result.videoScript || '');
    }
    
    if (includeFields.painPoint) {
      row.push(result.painPoint || '');
    }
    
    if (includeFields.processingTime) {
      row.push(result.processingTime?.toString() || '');
    }
    
    if (includeFields.timestamps) {
      row.push(formatTimestamp(result.createdAt));
      row.push(result.completedAt ? formatTimestamp(result.completedAt) : '');
    }
    
    return row;
  });
  
  return { headers, rows };
}

/**
 * Format timestamp for display in spreadsheet
 */
function formatTimestamp(date: Date): string {
  if (!date) return '';
  return new Date(date).toISOString();
}

/**
 * Auto-resize columns in the spreadsheet
 */
async function autoResizeColumns(
  spreadsheetId: string,
  accessToken: string,
  columnCount: number
): Promise<void> {
  const requests = [];
  
  // Auto-resize all columns
  for (let i = 0; i < columnCount; i++) {
    requests.push({
      autoResizeDimensions: {
        dimensions: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: i,
          endIndex: i + 1,
        },
      },
    });
  }
  
  const response = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to auto-resize columns');
  }
}

/**
 * Append data to an existing spreadsheet (for future enhancement)
 */
export async function appendToSpreadsheet(
  spreadsheetId: string,
  results: VideoAnalysisResult[],
  config?: Partial<ExportConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    
    const { rows } = prepareSpreadsheetData(results, config);
    
    // Convert rows to values array
    const values = rows;
    
    // Append data
    const response = await fetch(
      `${SHEETS_API_BASE}/${spreadsheetId}/values/Analysis Results!A:Z:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to append data');
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get spreadsheet info (for future enhancement)
 */
export async function getSpreadsheetInfo(spreadsheetId: string): Promise<any> {
  try {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(
      `${SHEETS_API_BASE}/${spreadsheetId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to get spreadsheet info');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting spreadsheet info:', error);
    return null;
  }
}

/**
 * Validate spreadsheet data before export
 */
export function validateSpreadsheetData(results: VideoAnalysisResult[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!Array.isArray(results)) {
    errors.push('Results must be an array');
    return { isValid: false, errors, warnings };
  }
  
  if (results.length === 0) {
    warnings.push('No results to export');
  }
  
  // Check for required fields
  results.forEach((result, index) => {
    if (!result.id) {
      errors.push(`Result at index ${index} missing required field: id`);
    }
    if (!result.filename) {
      errors.push(`Result at index ${index} missing required field: filename`);
    }
    if (!result.status) {
      errors.push(`Result at index ${index} missing required field: status`);
    }
  });
  
  // Check for data quality
  const completedResults = results.filter(r => r.status === 'completed');
  if (completedResults.length === 0) {
    warnings.push('No completed analysis results found');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Handle Google Sheets API errors
 */
export class GoogleSheetsError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'GoogleSheetsError';
  }
}

/**
 * Format error message for display
 */
export function formatSheetsError(error: unknown): string {
  if (error instanceof GoogleSheetsError) {
    return `Google Sheets Error: ${error.message}`;
  }
  
  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('quota')) {
      return 'Google Sheets quota exceeded. Please try again later.';
    }
    if (error.message.includes('permission')) {
      return 'Permission denied. Please sign in again with Google.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your internet connection.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

