import React, { useState, useMemo } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  Download, 
  RefreshCw, 
  Trash2, 
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff
} from "lucide-react";
import { VideoAnalysisResult, VideoAnalysisTableProps } from "@/types/video-analysis";
import ClientOnly from "./ClientOnly";

type SortField = 'filename' | 'status' | 'processingTime' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'error';

export default function VideoAnalysisTable({
  results,
  onRetry,
  onDelete,
  onExport,
  onRetryAllFailed,
  onDeleteSelected,
  onRetrySelected,
  loading = false,
}: VideoAnalysisTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // Pagination for large datasets
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // Start with 50 items per page

  // Filter and sort results with pagination
  const { filteredResults, paginatedResults, totalPages, totalFilteredCount } = useMemo(() => {
    let filtered = results.filter(result => {
      // Status filter
      if (statusFilter !== 'all' && result.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm && !result.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle date sorting
      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // Handle number sorting
      if (sortField === 'processingTime') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }
      
      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    
    return {
      filteredResults: filtered,
      paginatedResults: paginated,
      totalPages,
      totalFilteredCount: filtered.length
    };
  }, [results, sortField, sortDirection, statusFilter, searchTerm, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const selectAll = () => {
    // Select all on current page or all visible results
    const currentPageIds = paginatedResults.map(r => r.id);
    const allCurrentPageSelected = currentPageIds.every(id => selectedRows.has(id));
    
    if (allCurrentPageSelected) {
      // Deselect all on current page
      const newSelected = new Set(selectedRows);
      currentPageIds.forEach(id => newSelected.delete(id));
      setSelectedRows(newSelected);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedRows);
      currentPageIds.forEach(id => newSelected.add(id));
      setSelectedRows(newSelected);
    }
  };

  const selectAllFiltered = () => {
    if (selectedRows.size === totalFilteredCount) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredResults.map(r => r.id)));
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    const dataToExport = selectedRows.size > 0 
      ? results.filter(r => selectedRows.has(r.id))
      : filteredResults;
    onExport(format, dataToExport);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'pending':
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-500" />
      : <ArrowDown className="w-4 h-4 text-blue-500" />;
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (!text) return 'No data';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const formatProcessingTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${(time / 1000).toFixed(2)}s`;
  };

  const formatDate = (date: Date) => {
    return (
      <ClientOnly fallback={<span className="text-gray-400">Loading...</span>}>
        {new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(date))}
      </ClientOnly>
    );
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <p className="text-gray-500">No video analyses yet</p>
          <p className="text-sm text-gray-400">Upload videos and start analyzing to see results here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Batch operations for selected items */}
          {selectedRows.size > 0 && (
            <>
              {onRetrySelected && filteredResults.some(r => selectedRows.has(r.id) && r.status === 'error') && (
                <button
                  onClick={() => onRetrySelected(Array.from(selectedRows))}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors shadow-sm font-medium"
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Selected ({Array.from(selectedRows).filter(id => filteredResults.find(r => r.id === id && r.status === 'error')).length})
                </button>
              )}
              {onDeleteSelected && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${selectedRows.size} selected results?`)) {
                      onDeleteSelected(Array.from(selectedRows));
                      setSelectedRows(new Set());
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedRows.size})
                </button>
              )}
            </>
          )}
          
          {/* Global batch operations */}
          {onRetryAllFailed && filteredResults.some(r => r.status === 'error') && (
            <button
              onClick={onRetryAllFailed}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm font-medium"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
              Retry All Failed ({filteredResults.filter(r => r.status === 'error').length})
            </button>
          )}
          
          {/* Export buttons */}
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            disabled={loading}
          >
            <Download className="w-4 h-4" />
            Export CSV {selectedRows.size > 0 ? `(${selectedRows.size})` : ''}
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
            disabled={loading}
          >
            <Download className="w-4 h-4" />
            Export JSON {selectedRows.size > 0 ? `(${selectedRows.size})` : ''}
          </button>
        </div>
      </div>

      {/* Results count, pagination info, and selection info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>
            Showing {Math.min(itemsPerPage, totalFilteredCount)} of {totalFilteredCount} filtered results 
            ({results.length} total)
          </span>
          {totalFilteredCount > itemsPerPage && (
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-xs">Items per page:</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2">
              <span>{selectedRows.size} selected</span>
              {selectedRows.size < totalFilteredCount && (
                <button
                  onClick={selectAllFiltered}
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  Select all {totalFilteredCount}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginatedResults.length > 0 && paginatedResults.every(r => selectedRows.has(r.id))}
                    onChange={selectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                </th>
                <th className="w-48 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('filename')}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Filename
                    {getSortIcon('filename')}
                  </button>
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Status
                    {getSortIcon('status')}
                  </button>
                </th>
                <th className="w-72 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Visual Hook
                </th>
                <th className="w-72 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Text Hook
                </th>
                <th className="w-72 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Voice Hook
                </th>
                <th className="w-20 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('processingTime')}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Time
                    {getSortIcon('processingTime')}
                  </button>
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedResults.map((result) => (
                <React.Fragment key={result.id}>
                  <tr className={`hover:bg-gray-50 ${selectedRows.has(result.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(result.id)}
                        onChange={() => toggleRowSelection(result.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRowExpansion(result.id)}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                          {expandedRows.has(result.id) ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                        </button>
                        <span className="text-sm font-semibold text-gray-800 truncate" title={result.filename}>
                          {result.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className={getStatusBadge(result.status)}>
                          {result.status}
                        </span>
                      </div>
                    </td>
                                                              <td className="px-4 py-4 text-sm text-gray-800">
                        <div className="max-w-xs leading-relaxed whitespace-normal break-words" title={result.visualHook || ''}>
                          {result.visualHook || <span className="text-gray-500 italic">No data</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-800">
                        <div className="max-w-xs leading-relaxed whitespace-normal break-words" title={result.textHook || ''}>
                          {result.textHook || <span className="text-gray-500 italic">No data</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-800">
                        <div className="max-w-xs leading-relaxed whitespace-normal break-words" title={result.voiceHook || ''}>
                          {result.voiceHook || <span className="text-gray-500 italic">No data</span>}
                        </div>
                      </td>
                     <td className="px-4 py-4 text-sm text-gray-500 text-center">
                       {formatProcessingTime(result.processingTime)}
                     </td>
                     <td className="px-4 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {result.status === 'error' && (
                          <button
                            onClick={() => onRetry(result.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Retry analysis"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(result.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete result"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded row content */}
                  {expandedRows.has(result.id) && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 bg-gray-50">
                        <div className="space-y-6">
                          {/* Full analysis details */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {result.visualHook && (
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="font-semibold text-gray-900 mb-3 text-base">🎯 Visual Hook</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">{result.visualHook}</p>
                              </div>
                            )}
                            {result.textHook && (
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="font-semibold text-gray-900 mb-3 text-base">📝 Text Hook</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">{result.textHook}</p>
                              </div>
                            )}
                            {result.voiceHook && (
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="font-semibold text-gray-900 mb-3 text-base">🗣️ Voice Hook</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">{result.voiceHook}</p>
                              </div>
                            )}
                            {result.painPoint && (
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="font-semibold text-gray-900 mb-3 text-base">💡 Pain Point</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">{result.painPoint}</p>
                              </div>
                            )}
                          </div>
                          
                          {result.videoScript && (
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <h4 className="font-semibold text-gray-900 mb-3 text-base">📄 Video Script</h4>
                              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">
                                {result.videoScript}
                              </div>
                            </div>
                          )}
                          
                          {result.error && (
                            <div>
                              <h4 className="font-medium text-red-900 mb-2">Error Details</h4>
                              <div className="bg-red-50 p-3 rounded border border-red-200 text-sm text-red-700">
                                {result.error}
                              </div>
                            </div>
                          )}
                          
                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                            <span>Created: {formatDate(result.createdAt)}</span>
                            {result.completedAt && (
                              <span>Completed: {formatDate(result.completedAt)}</span>
                            )}
                            {result.processingTime && (
                              <span>Processing time: {formatProcessingTime(result.processingTime)}</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalFilteredCount === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No results match your filters</p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
              }}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
          
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalFilteredCount)} of {totalFilteredCount}
          </div>
        </div>
      )}
    </div>
  );
} 