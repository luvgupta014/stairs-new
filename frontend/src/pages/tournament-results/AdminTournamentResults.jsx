import React, { useState, useEffect } from 'react';
import { getAllTournamentResultsForAdmin } from '../../api';
import { 
  FaFileExcel, 
  FaDownload, 
  FaEye, 
  FaCalendarAlt, 
  FaTrophy,
  FaFilter,
  FaSearch,
  FaUser
} from 'react-icons/fa';
import Spinner from '../../components/Spinner';

const AdminTournamentResults = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    coach_name: '',
    tournament_name: '',
    date_from: '',
    date_to: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadTournamentResults();
  }, [pagination.page, filters]);

  const loadTournamentResults = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await getAllTournamentResultsForAdmin(params);
      
      if (response.success) {
        setFiles(response.data.files || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('Failed to load tournament results:', error);
      setError(error.message || 'Failed to load tournament results');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      coach_name: '',
      tournament_name: '',
      date_from: '',
      date_to: ''
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Tournament Results</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadTournamentResults}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">Tournament Results Management</h1>
              <p className="text-purple-100 text-lg">View and download all coach tournament result files</p>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-white">
              <FaTrophy className="text-2xl" />
              <span className="text-lg font-medium">Admin Panel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FaFilter className="mr-2 text-purple-600" />
            Filter Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coach Name</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="coach_name"
                  value={filters.coach_name}
                  onChange={handleFilterChange}
                  placeholder="Search by coach..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tournament</label>
              <div className="relative">
                <FaTrophy className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="tournament_name"
                  value={filters.tournament_name}
                  onChange={handleFilterChange}
                  placeholder="Tournament name..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                name="date_from"
                value={filters.date_from}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                <input
                  type="date"
                  name="date_to"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={clearFilters}
                className="ml-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaFileExcel className="mr-2 text-green-600" />
              All Tournament Results ({pagination.total})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <FaFileExcel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Files Found</h3>
              <p className="text-gray-600">
                {Object.values(filters).some(filter => filter) 
                  ? 'No files match your current filters.' 
                  : 'No tournament result files have been uploaded yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {files.map((file) => (
                  <div key={file.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <FaFileExcel className="text-green-600 mr-3 text-lg" />
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {file.originalName}
                            </h3>
                            
                            {/* Coach Information */}
                            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center font-medium text-blue-600">
                                <FaUser className="mr-1" />
                                {file.coach?.name || 'Unknown Coach'}
                              </span>
                              {file.coach?.specialization && (
                                <span>• {file.coach.specialization}</span>
                              )}
                            </div>
                            
                            {/* Tournament Information */}
                            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                              {file.tournamentName && (
                                <span className="flex items-center">
                                  <FaTrophy className="mr-1" />
                                  {file.tournamentName}
                                </span>
                              )}
                              {file.tournamentDate && (
                                <span className="flex items-center">
                                  <FaCalendarAlt className="mr-1" />
                                  Tournament: {formatDate(file.tournamentDate)}
                                </span>
                              )}
                              <span>Size: {formatFileSize(file.fileSize)}</span>
                              <span>Uploaded: {formatDate(file.uploadDate)}</span>
                            </div>
                            
                            {/* Description */}
                            {file.description && (
                              <p className="mt-1 text-xs text-gray-600">{file.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <a
                          href={file.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors inline-flex items-center"
                        >
                          <FaDownload className="mr-1" />
                          Download
                        </a>
                        
                        <a
                          href={file.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors inline-flex items-center"
                        >
                          <FaEye className="mr-1" />
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total files)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTournamentResults;