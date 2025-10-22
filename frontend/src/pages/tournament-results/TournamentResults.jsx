import React, { useState, useEffect } from 'react';
import { uploadTournamentResults, getTournamentResults, deleteTournamentResult } from '../../api';
import { 
  FaUpload, 
  FaFileExcel, 
  FaTimes, 
  FaDownload, 
  FaTrash, 
  FaEye, 
  FaCalendarAlt, 
  FaTrophy,
  FaFilter,
  FaSearch
} from 'react-icons/fa';
import Spinner from '../../components/Spinner';

const TournamentResults = () => {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    tournament_name: '',
    tournament_date: '',
    description: ''
  });
  const [filters, setFilters] = useState({
    search: '',
    tournament_name: '',
    date_from: '',
    date_to: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadTournamentResults();
  }, [pagination.page, filters]);

  const loadTournamentResults = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await getTournamentResults(params);
      
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
      showMessage('error', 'Failed to load tournament results');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const newFiles = Array.from(event.target.files);
    const excelFiles = newFiles.filter(file => {
      const extension = file.name.toLowerCase();
      return extension.endsWith('.xlsx') || extension.endsWith('.xls');
    });

    if (excelFiles.length !== newFiles.length) {
      showMessage('warning', 'Only Excel files (.xlsx, .xls) are allowed');
    }

    setSelectedFiles(prev => [...prev, ...excelFiles]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      tournament_name: '',
      date_from: '',
      date_to: ''
    });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      showMessage('error', 'Please select at least one Excel file to upload');
      return;
    }

    try {
      setUploading(true);
      
      const uploadFormData = new FormData();
      selectedFiles.forEach(file => {
        uploadFormData.append('tournamentFiles', file);
      });
      
      // Add form data
      uploadFormData.append('tournament_name', formData.tournament_name);
      uploadFormData.append('tournament_date', formData.tournament_date);
      uploadFormData.append('description', formData.description);

      const response = await uploadTournamentResults(uploadFormData);
      
      if (response.success) {
        showMessage('success', `Successfully uploaded ${response.data.totalFiles} file(s)`);
        setSelectedFiles([]);
        setFormData({ tournament_name: '', tournament_date: '', description: '' });
        loadTournamentResults(); // Reload the list
      }
    } catch (error) {
      console.error('Upload failed:', error);
      showMessage('error', error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      const response = await deleteTournamentResult(fileId);
      
      if (response.success) {
        showMessage('success', 'File deleted successfully');
        loadTournamentResults();
      }
    } catch (error) {
      console.error('Delete failed:', error);
      showMessage('error', error.message || 'Failed to delete file');
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
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">Tournament Results</h1>
              <p className="text-blue-100 text-lg">Upload and manage your tournament result files</p>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-white">
              <FaTrophy className="text-2xl" />
              <span className="text-lg font-medium">Results Management</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-yellow-50 border border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center">
              <span className="flex-1">{message.text}</span>
              <button 
                onClick={() => setMessage({ type: '', text: '' })}
                className="ml-2 text-current opacity-70 hover:opacity-100"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FaUpload className="mr-2 text-blue-600" />
            Upload Tournament Results
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Name
                </label>
                <input
                  type="text"
                  name="tournament_name"
                  value={formData.tournament_name}
                  onChange={handleInputChange}
                  placeholder="Enter tournament name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Date
                </label>
                <input
                  type="date"
                  name="tournament_date"
                  value={formData.tournament_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel Files (Maximum 10 files, 10MB each)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaFileExcel className="mr-2" />
                  Choose Excel Files
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Drag and drop files here or click to browse
                </p>
              </div>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Selected Files ({selectedFiles.length})
                </h3>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center">
                        <FaFileExcel className="text-green-600 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || selectedFiles.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="mr-2" />
                    Upload Files
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FaFilter className="mr-2 text-blue-600" />
            Filter Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search files..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tournament</label>
              <input
                type="text"
                name="tournament_name"
                value={filters.tournament_name}
                onChange={handleFilterChange}
                placeholder="Tournament name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                name="date_from"
                value={filters.date_from}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              Uploaded Tournament Results ({pagination.total})
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
                  : 'Upload your first tournament result file to get started.'}
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
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {file.originalName}
                            </h3>
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
                                  {formatDate(file.tournamentDate)}
                                </span>
                              )}
                              <span>Size: {formatFileSize(file.fileSize)}</span>
                              <span>Uploaded: {formatDate(file.uploadDate)}</span>
                            </div>
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
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors inline-flex items-center"
                        >
                          <FaDownload className="mr-1" />
                          Download
                        </a>
                        
                        <button
                          onClick={() => handleDelete(file.id, file.originalName)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors inline-flex items-center"
                        >
                          <FaTrash className="mr-1" />
                          Delete
                        </button>
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

export default TournamentResults;