import { useState, useEffect } from 'react';
import { getAllEventResultFilesForAdmin, downloadEventResultFile } from '../api';
import Spinner from './Spinner';
import { FaDownload, FaCalendar, FaUser, FaFileExcel, FaSearch, FaFilter } from 'react-icons/fa';

const AdminEventResults = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    sport: '',
    coachName: '',
    dateRange: ''
  });
  const [filteredFiles, setFilteredFiles] = useState([]);

  useEffect(() => {
    loadEventResultFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [files, filters]);

  const loadEventResultFiles = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 [AdminEventResults] Loading event result files...');
      const response = await getAllEventResultFilesForAdmin();
      console.log('📄 [AdminEventResults] API Response:', response);
      
      if (response.success) {
        const filesData = response.data?.files || [];
        console.log('✅ [AdminEventResults] Files loaded:', filesData.length);
        setFiles(filesData);
      } else {
        console.error('❌ [AdminEventResults] API returned error:', response.message);
        throw new Error(response.message || 'Failed to load event result files');
      }
    } catch (error) {
      console.error('❌ [AdminEventResults] Error loading event result files:', error);
      setError(error.message || 'Failed to load files. Please check your admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = [...files];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(file => 
        file.originalName.toLowerCase().includes(searchTerm) ||
        file.event?.name?.toLowerCase().includes(searchTerm) ||
        file.coach?.name?.toLowerCase().includes(searchTerm)
      );
    }

    // Sport filter
    if (filters.sport) {
      filtered = filtered.filter(file => 
        file.event?.sport === filters.sport
      );
    }

    // Coach name filter
    if (filters.coachName) {
      const coachTerm = filters.coachName.toLowerCase();
      filtered = filtered.filter(file => 
        file.coach?.name?.toLowerCase().includes(coachTerm)
      );
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(file => {
        const uploadDate = new Date(file.uploadedAt);
        
        switch (filters.dateRange) {
          case 'today':
            return uploadDate >= startOfToday;
          case 'week': {
            const weekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
            return uploadDate >= weekAgo;
          }
          case 'month': {
            const monthAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
            return uploadDate >= monthAgo;
          }
          default:
            return true;
        }
      });
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
      sport: '',
      coachName: '',
      dateRange: ''
    });
  };

  const downloadFile = async (file) => {
    try {
      const response = await downloadEventResultFile(file.id, true); // true for admin
      
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

  const getUniqueValues = (key) => {
    const values = files.map(file => {
      if (key === 'sport') return file.event?.sport;
      if (key === 'coachName') return file.coach?.name;
      return null;
    }).filter(Boolean);
    return [...new Set(values)].sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFileExcel className="text-red-600 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Files</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadEventResultFiles}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Result Files</h1>
          <p className="text-gray-600">Manage and download all event result files uploaded by coaches</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Files</p>
                <p className="text-3xl font-bold text-gray-900">{files.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaFileExcel className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Events</p>
                <p className="text-3xl font-bold text-gray-900">
                  {[...new Set(files.map(f => f.eventId))].length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaCalendar className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Coaches</p>
                <p className="text-3xl font-bold text-gray-900">
                  {[...new Set(files.map(f => f.coachId))].length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaUser className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Size</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatFileSize(files.reduce((sum, file) => sum + (file.size || 0), 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaDownload className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaFilter className="mr-2" />
              Filters
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaSearch className="inline mr-1" />
                Search
              </label>
              <input
                type="text"
                placeholder="Search files, events, coaches..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
              <select
                value={filters.sport}
                onChange={(e) => handleFilterChange('sport', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sports</option>
                {getUniqueValues('sport').map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coach</label>
              <input
                type="text"
                placeholder="Filter by coach name..."
                value={filters.coachName}
                onChange={(e) => handleFilterChange('coachName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          {Object.values(filters).some(filter => filter) && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredFiles.length} of {files.length} files
            </div>
          )}
        </div>

        {/* Files Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Result Files</h3>
          </div>

          {error && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <p className="text-sm text-red-600">Error: {error}</p>
              <button
                onClick={loadEventResultFiles}
                className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {filteredFiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coach
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
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <FaFileExcel className="text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {file.originalName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(file.size)} • {file.mimetype || file.mimeType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{file.event?.name || 'Unknown Event'}</div>
                        <div className="text-sm text-gray-500">{file.event?.sport || 'Unknown Sport'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{file.coach?.name || 'Unknown Coach'}</div>
                        {file.coach?.user?.uniqueId && (
                          <div className="text-xs text-blue-600 font-mono font-medium">
                            UID: {file.coach.user.uniqueId}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">{file.coach?.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => downloadFile(file)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                        >
                          <FaDownload className="mr-2" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFileExcel className="text-gray-400 text-3xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {Object.values(filters).some(filter => filter) ? 'No Files Match Filters' : 'No Result Files'}
              </h3>
              <p className="text-gray-600">
                {Object.values(filters).some(filter => filter) 
                  ? 'Try adjusting your filters to find more files.' 
                  : 'Event result files uploaded by coaches will appear here.'}
              </p>
              {Object.values(filters).some(filter => filter) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={loadEventResultFiles}
            disabled={loading}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 inline-flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Files
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEventResults;