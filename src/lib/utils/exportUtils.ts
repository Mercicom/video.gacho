import { saveAs } from 'file-saver';
import { VideoAnalysisResult, ExportConfig } from '@/types/video-analysis';

// Default export configuration
const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'csv',
  includeFields: {
    filename: true,
    visualHook: true,
    textHook: true,
    voiceHook: true,
    videoScript: true,
    painPoint: true,
    processingTime: true,
    status: true,
    timestamps: true,
  },
};

// Export functions
export function exportToCSV(
  results: VideoAnalysisResult[], 
  config: Partial<ExportConfig> = {}
): void {
  const exportConfig = { ...DEFAULT_EXPORT_CONFIG, ...config, format: 'csv' as const };
  const filteredResults = filterResults(results, exportConfig);
  
  if (filteredResults.length === 0) {
    throw new Error('No data to export');
  }

  const csvContent = generateCSVContent(filteredResults, exportConfig);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = generateFilename('csv');
  
  saveAs(blob, filename);
}

export function exportToJSON(
  results: VideoAnalysisResult[], 
  config: Partial<ExportConfig> = {}
): void {
  const exportConfig = { ...DEFAULT_EXPORT_CONFIG, ...config, format: 'json' as const };
  const filteredResults = filterResults(results, exportConfig);
  
  if (filteredResults.length === 0) {
    throw new Error('No data to export');
  }

  const exportData = prepareJSONData(filteredResults, exportConfig);
  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const filename = generateFilename('json');
  
  saveAs(blob, filename);
}

// Generate CSV content
function generateCSVContent(results: VideoAnalysisResult[], config: ExportConfig): string {
  const headers = getCSVHeaders(config);
  const rows = results.map(result => generateCSVRow(result, config));
  
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ];
  
  return csvLines.join('\n');
}

// Get CSV headers based on configuration
function getCSVHeaders(config: ExportConfig): string[] {
  const headers: string[] = [];
  
  if (config.includeFields.filename) headers.push('Filename');
  if (config.includeFields.status) headers.push('Status');
  if (config.includeFields.visualHook) headers.push('Visual Hook');
  if (config.includeFields.textHook) headers.push('Text Hook');
  if (config.includeFields.voiceHook) headers.push('Voice Hook');
  if (config.includeFields.videoScript) headers.push('Video Script');
  if (config.includeFields.painPoint) headers.push('Pain Point');
  if (config.includeFields.processingTime) headers.push('Processing Time (ms)');
  if (config.includeFields.timestamps) {
    headers.push('Created At');
    headers.push('Completed At');
  }
  
  return headers;
}

// Generate CSV row for a single result
function generateCSVRow(result: VideoAnalysisResult, config: ExportConfig): string[] {
  const row: string[] = [];
  
  if (config.includeFields.filename) {
    row.push(escapeCSVField(result.filename));
  }
  
  if (config.includeFields.status) {
    row.push(escapeCSVField(result.status));
  }
  
  if (config.includeFields.visualHook) {
    row.push(escapeCSVField(result.visualHook || ''));
  }
  
  if (config.includeFields.textHook) {
    row.push(escapeCSVField(result.textHook || ''));
  }
  
  if (config.includeFields.voiceHook) {
    row.push(escapeCSVField(result.voiceHook || ''));
  }
  
  if (config.includeFields.videoScript) {
    row.push(escapeCSVField(result.videoScript || ''));
  }
  
  if (config.includeFields.painPoint) {
    row.push(escapeCSVField(result.painPoint || ''));
  }
  
  if (config.includeFields.processingTime) {
    row.push(result.processingTime?.toString() || '');
  }
  
  if (config.includeFields.timestamps) {
    row.push(escapeCSVField(formatTimestamp(result.createdAt)));
    row.push(escapeCSVField(result.completedAt ? formatTimestamp(result.completedAt) : ''));
  }
  
  return row;
}

// Escape CSV field (handle commas, quotes, newlines)
function escapeCSVField(field: string): string {
  if (!field) return '""';
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return field;
}

// Prepare JSON export data
function prepareJSONData(results: VideoAnalysisResult[], config: ExportConfig) {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalResults: results.length,
      exportConfig: config,
      version: '1.0',
    },
    results: results.map(result => prepareJSONResult(result, config)),
  };
  
  return exportData;
}

// Prepare single result for JSON export
function prepareJSONResult(result: VideoAnalysisResult, config: ExportConfig) {
  const exportResult: any = {};
  
  if (config.includeFields.filename) {
    exportResult.filename = result.filename;
  }
  
  if (config.includeFields.status) {
    exportResult.status = result.status;
  }
  
  if (config.includeFields.visualHook && result.visualHook) {
    exportResult.visualHook = result.visualHook;
  }
  
  if (config.includeFields.textHook && result.textHook) {
    exportResult.textHook = result.textHook;
  }
  
  if (config.includeFields.voiceHook && result.voiceHook) {
    exportResult.voiceHook = result.voiceHook;
  }
  
  if (config.includeFields.videoScript && result.videoScript) {
    exportResult.videoScript = result.videoScript;
  }
  
  if (config.includeFields.painPoint && result.painPoint) {
    exportResult.painPoint = result.painPoint;
  }
  
  if (config.includeFields.processingTime && result.processingTime) {
    exportResult.processingTime = result.processingTime;
  }
  
  if (config.includeFields.timestamps) {
    exportResult.timestamps = {
      createdAt: result.createdAt,
      completedAt: result.completedAt || null,
    };
  }
  
  // Include error if present
  if (result.error) {
    exportResult.error = result.error;
  }
  
  return exportResult;
}

// Filter results based on configuration
function filterResults(results: VideoAnalysisResult[], config: ExportConfig): VideoAnalysisResult[] {
  let filtered = [...results];
  
  // Filter by status if specified
  if (config.filterByStatus && config.filterByStatus.length > 0) {
    filtered = filtered.filter(result => config.filterByStatus!.includes(result.status));
  }
  
  return filtered;
}

// Generate filename with timestamp
function generateFilename(extension: string): string {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
  return `video-analysis-export-${timestamp}-${time}.${extension}`;
}

// Format timestamp for display
function formatTimestamp(date: Date): string {
  if (!date) return '';
  return new Date(date).toISOString();
}

// Export statistics and summary
export function generateExportSummary(results: VideoAnalysisResult[]): {
  totalVideos: number;
  completedCount: number;
  errorCount: number;
  pendingCount: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  exportDate: string;
} {
  const completed = results.filter(r => r.status === 'completed');
  const errors = results.filter(r => r.status === 'error');
  const pending = results.filter(r => r.status === 'pending' || r.status === 'processing');
  
  const totalProcessingTime = completed.reduce((sum, r) => sum + (r.processingTime || 0), 0);
  const averageProcessingTime = completed.length > 0 ? totalProcessingTime / completed.length : 0;
  
  return {
    totalVideos: results.length,
    completedCount: completed.length,
    errorCount: errors.length,
    pendingCount: pending.length,
    totalProcessingTime,
    averageProcessingTime,
    exportDate: new Date().toISOString(),
  };
}

// Export with custom fields
export function exportWithCustomFields(
  results: VideoAnalysisResult[],
  format: 'csv' | 'json',
  customFields: string[]
): void {
  const config: ExportConfig = {
    format,
    includeFields: {
      filename: customFields.includes('filename'),
      visualHook: customFields.includes('visualHook'),
      textHook: customFields.includes('textHook'),
      voiceHook: customFields.includes('voiceHook'),
      videoScript: customFields.includes('videoScript'),
      painPoint: customFields.includes('painPoint'),
      processingTime: customFields.includes('processingTime'),
      status: customFields.includes('status'),
      timestamps: customFields.includes('timestamps'),
    },
  };
  
  if (format === 'csv') {
    exportToCSV(results, config);
  } else {
    exportToJSON(results, config);
  }
}

// Export completed results only
export function exportCompletedResults(
  results: VideoAnalysisResult[],
  format: 'csv' | 'json'
): void {
  const config: ExportConfig = {
    ...DEFAULT_EXPORT_CONFIG,
    format,
    filterByStatus: ['completed'],
  };
  
  if (format === 'csv') {
    exportToCSV(results, config);
  } else {
    exportToJSON(results, config);
  }
}

// Export with summary report
export function exportWithSummary(
  results: VideoAnalysisResult[],
  format: 'csv' | 'json'
): void {
  const summary = generateExportSummary(results);
  
  if (format === 'json') {
    const exportData = {
      summary,
      ...prepareJSONData(results, { ...DEFAULT_EXPORT_CONFIG, format }),
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const filename = generateFilename('json');
    
    saveAs(blob, filename);
  } else {
    // For CSV, create separate summary and data files
    exportToCSV(results);
    
    // Also export summary as separate CSV
    const summaryCSV = generateSummaryCSV(summary);
    const summaryBlob = new Blob([summaryCSV], { type: 'text/csv;charset=utf-8;' });
    const summaryFilename = generateFilename('summary.csv');
    
    setTimeout(() => {
      saveAs(summaryBlob, summaryFilename);
    }, 100); // Small delay to avoid browser blocking multiple downloads
  }
}

// Generate summary CSV
function generateSummaryCSV(summary: ReturnType<typeof generateExportSummary>): string {
  const lines = [
    'Metric,Value',
    `Total Videos,${summary.totalVideos}`,
    `Completed,${summary.completedCount}`,
    `Errors,${summary.errorCount}`,
    `Pending,${summary.pendingCount}`,
    `Total Processing Time (ms),${summary.totalProcessingTime}`,
    `Average Processing Time (ms),${Math.round(summary.averageProcessingTime)}`,
    `Export Date,${summary.exportDate}`,
  ];
  
  return lines.join('\n');
}

// Batch export utilities
export function exportBatch(
  resultsBatch: VideoAnalysisResult[][],
  format: 'csv' | 'json',
  batchNames: string[]
): void {
  resultsBatch.forEach((results, index) => {
    const batchName = batchNames[index] || `batch-${index + 1}`;
    const config: ExportConfig = {
      ...DEFAULT_EXPORT_CONFIG,
      format,
    };
    
    if (format === 'csv') {
      const csvContent = generateCSVContent(results, config);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `${batchName}-${generateFilename('csv')}`;
      
      // Small delay between downloads to avoid browser issues
      setTimeout(() => {
        saveAs(blob, filename);
      }, index * 100);
    } else {
      const exportData = prepareJSONData(results, config);
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const filename = `${batchName}-${generateFilename('json')}`;
      
      setTimeout(() => {
        saveAs(blob, filename);
      }, index * 100);
    }
  });
}

// Validation functions
export function validateExportData(results: VideoAnalysisResult[]): {
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
  
  const resultsWithoutAnalysis = completedResults.filter(r => 
    !r.visualHook && !r.textHook && !r.voiceHook && !r.videoScript && !r.painPoint
  );
  if (resultsWithoutAnalysis.length > 0) {
    warnings.push(`${resultsWithoutAnalysis.length} completed results have no analysis data`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Utility function to get field names for UI
export function getAvailableExportFields(): Array<{
  key: keyof ExportConfig['includeFields'];
  label: string;
  description: string;
}> {
  return [
    { key: 'filename', label: 'Filename', description: 'Original video filename' },
    { key: 'status', label: 'Status', description: 'Analysis status (completed, error, etc.)' },
    { key: 'visualHook', label: 'Visual Hook', description: 'Compelling visual elements analysis' },
    { key: 'textHook', label: 'Text Hook', description: 'Engaging text/caption suggestions' },
    { key: 'voiceHook', label: 'Voice Hook', description: 'Verbal hook and tagline analysis' },
    { key: 'videoScript', label: 'Video Script', description: 'Complete transcript with timestamps' },
    { key: 'painPoint', label: 'Pain Point', description: 'Problem-solving angle analysis' },
    { key: 'processingTime', label: 'Processing Time', description: 'Time taken for analysis (ms)' },
    { key: 'timestamps', label: 'Timestamps', description: 'Created and completed timestamps' },
  ];
}

// Progress callback for large exports
export type ExportProgressCallback = (progress: {
  completed: number;
  total: number;
  stage: 'preparing' | 'generating' | 'downloading';
}) => void;

// Large dataset export with progress
export async function exportLargeDataset(
  results: VideoAnalysisResult[],
  format: 'csv' | 'json',
  config: Partial<ExportConfig> = {},
  onProgress?: ExportProgressCallback
): Promise<void> {
  const exportConfig = { ...DEFAULT_EXPORT_CONFIG, ...config, format };
  const filteredResults = filterResults(results, exportConfig);
  
  if (onProgress) {
    onProgress({ completed: 0, total: filteredResults.length, stage: 'preparing' });
  }
  
  // Process in chunks for large datasets
  const chunkSize = 1000;
  const chunks: VideoAnalysisResult[][] = [];
  
  for (let i = 0; i < filteredResults.length; i += chunkSize) {
    chunks.push(filteredResults.slice(i, i + chunkSize));
  }
  
  if (onProgress) {
    onProgress({ completed: 0, total: chunks.length, stage: 'generating' });
  }
  
  let allContent = '';
  
  if (format === 'csv') {
    // Add headers once
    const headers = getCSVHeaders(exportConfig);
    allContent = headers.join(',') + '\n';
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const rows = chunk.map(result => generateCSVRow(result, exportConfig));
      allContent += rows.map(row => row.join(',')).join('\n');
      
      if (i < chunks.length - 1) {
        allContent += '\n';
      }
      
      if (onProgress) {
        onProgress({ completed: i + 1, total: chunks.length, stage: 'generating' });
      }
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  } else {
    // For JSON, combine all chunks into one structure
    const exportData = prepareJSONData(filteredResults, exportConfig);
    allContent = JSON.stringify(exportData, null, 2);
  }
  
  if (onProgress) {
    onProgress({ completed: 1, total: 1, stage: 'downloading' });
  }
  
  const blob = new Blob([allContent], { 
    type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;' 
  });
  const filename = generateFilename(format);
  
  saveAs(blob, filename);
}

// Error handling for exports
export class ExportError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ExportError';
  }
}

export function handleExportError(error: unknown): string {
  if (error instanceof ExportError) {
    return `Export failed: ${error.message} (${error.code})`;
  }
  
  if (error instanceof Error) {
    return `Export failed: ${error.message}`;
  }
  
  return 'Export failed: Unknown error occurred';
} 