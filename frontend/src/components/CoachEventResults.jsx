import { useState, useEffect } from 'react';
import { getCoachEventResultFiles, getEventResultFilesByEventId, downloadEventResultFile } from '../api';
import Spinner from './Spinner';
import { FaDownload, FaCalendar, FaFileExcel, FaFilePdf, FaFileCsv, FaSearch, FaFilter, FaEye } from 'react-icons/fa';

const CoachEventResults = ({ eventId = null }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    dateRange: ''
  });
  const [filteredFiles, setFilteredFiles] = useState([]);

  useEffect(() => {
    loadEventResultFiles();
  }, [eventId]);

  useEffect(() => {
    filterFiles();
  }, [files, filters]);

  const loadEventResultFiles = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (eventId) {
        // Get files for specific event
        response = await getEventResultFilesByEventId(eventId);
      } else {
        // Get all files for coach
        response = await getCoachEventResultFiles();
      }

      if (response.success) {
        setFiles(response.data.files || []);
      } else {
        setError(response.message || 'Failed to load files');
      }
    } catch (error) {
      console.error('❌ [CoachEventResults] Error loading files:', error);
      setError(error.message || 'Failed to load event result files');
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = [...files];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(file => 
        file.originalName.toLowerCase().includes(searchLower) ||
        file.event?.name.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      let dateThreshold;
      
      switch (filters.dateRange) {
        case 'today':
          dateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateThreshold = null;
      }
      
      if (dateThreshold) {
        filtered = filtered.filter(file => new Date(file.uploadedAt) >= dateThreshold);
      }
    }

    setFilteredFiles(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      dateRange: ''
    });
  };

  const downloadFile = async (file) => {
    try {
      const response = await downloadEventResultFile(file.id, false); // false for coach
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { 
        type: file.isExcel ? 
          (file.originalName.endsWith('.xlsx') ? 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
            'application/vnd.ms-excel') 
          : file.mimeType 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`📥 Downloaded: ${file.originalName}`);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download file. Please try again.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getFileIcon = (file) => {
    if (file.isExcel || file.originalName.toLowerCase().endsWith('.xlsx') || file.originalName.toLowerCase().endsWith('.xls')) {
      return <FaFileExcel className="text-green-600" />;
    } else if (file.originalName.toLowerCase().endsWith('.pdf')) {
      return <FaFilePdf className="text-red-600" />;
    } else if (file.originalName.toLowerCase().endsWith('.csv')) {
      return <FaFileCsv className="text-blue-600" />;
    }
    return <FaEye className="text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner />
        <span className="ml-2">Loading event result files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Files</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadEventResultFiles}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {eventId ? 'Event Result Files' : 'My Uploaded Results'}
          </h2>
          <p className="text-gray-600 mt-1">
            {eventId 
              ? 'Manage result files for this event' 
              : 'View and download all your uploaded result files'
            }
          </p>
        </div>
        <button
          onClick={loadEventResultFiles}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by filename or event name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-400" />
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All dates</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
          </div>

          {(filters.search || filters.dateRange) && (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredFiles.length} of {files.length} files
        {filteredFiles.length !== files.length && ' (filtered)'}
      </div>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaFileExcel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Files Found</h3>
          <p className="text-gray-600 mb-4">
            {files.length === 0 
              ? 'You haven\'t uploaded any result files yet.' 
              : 'No files match your current filters.'
            }
          </p>
          {files.length === 0 && !eventId && (
            <p className="text-sm text-gray-500">
              Upload Excel files through the event management section.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  {!eventId && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {getFileIcon(file)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {file.originalName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {file.mimeType}
                          </div>
                        </div>
                      </div>
                    </td>
                    {!eventId && file.event && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {file.event.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {file.event.sport} • {file.event.location}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <FaCalendar className="mr-2 text-gray-400" />
                        {formatDate(file.uploadedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => downloadFile(file)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        title="Download file"
                      >
                        <FaDownload />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachEventResults;