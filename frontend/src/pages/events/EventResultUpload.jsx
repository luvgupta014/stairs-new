import React, { useState, useEffect } from 'react';
import { uploadEventResults, getEventResultFiles, deleteEventResultFile, downloadIndividualEventResultFile, downloadSampleResultSheet } from '../../api';
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
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import BackButton from '../../components/BackButton';

const EventResultUpload = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [eventData, setEventData] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadEventFiles();
  }, [eventId]);

  const loadEventFiles = async () => {
    try {
      setLoading(true);
      const response = await getEventResultFiles(eventId);
      
      if (response.success) {
        setEventData(response.data.event);
        setFiles(response.data.files || []);
      }
    } catch (error) {
      console.error('Failed to load event files:', error);
      showMessage('error', 'Failed to load event files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const newFiles = Array.from(event.target.files);
    const excelFiles = newFiles.filter(file => {
      const extension = file.name.toLowerCase();
      return extension.endsWith('.xlsx') || extension.endsWith('.xls') || extension.endsWith('.csv');
    });

    if (excelFiles.length !== newFiles.length) {
      showMessage('warning', 'Only Excel files (.xlsx, .xls) and CSV files are allowed');
    }

    setSelectedFiles(prev => [...prev, ...excelFiles]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      showMessage('error', 'Please select at least one file to upload');
      return;
    }

    try {
      setUploading(true);
      
      const uploadFormData = new FormData();
      selectedFiles.forEach(file => {
        uploadFormData.append('files', file);
      });
      
      if (description) {
        uploadFormData.append('description', description);
      }

      const response = await uploadEventResults(eventId, uploadFormData);
      
      if (response.success) {
        showMessage('success', `Successfully uploaded ${response.data.uploadedFiles.length} file(s)`);
        setSelectedFiles([]);
        setDescription('');
        loadEventFiles(); // Reload the file list
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
      const response = await deleteEventResultFile(eventId, fileId);
      
      if (response.success) {
        showMessage('success', 'File deleted successfully');
        loadEventFiles();
      }
    } catch (error) {
      console.error('Delete failed:', error);
      showMessage('error', error.message || 'Failed to delete file');
    }
  };

  const handleDownload = async (fileId, originalName) => {
    try {
      const response = await downloadIndividualEventResultFile(eventId, fileId);
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`📥 Downloaded: ${originalName}`);
      showMessage('success', `Downloaded ${originalName}`);
    } catch (error) {
      console.error('Download failed:', error);
      showMessage('error', error.message || 'Failed to download file');
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-4">
                <BackButton 
                  to="/dashboard/coach" 
                  label="Back to Dashboard" 
                  variant="minimal"
                  className="text-white hover:text-green-200"
                />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">Event Result Files</h1>
                <p className="text-green-100 text-lg">
                  {eventData ? `Upload and manage result files for: ${eventData.name}` : 'Upload and manage your event result files'}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-white">
              <FaFileExcel className="text-2xl" />
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaUpload className="mr-2 text-green-600" />
              Upload Event Result Files
            </h2>
            <button
              type="button"
              onClick={async () => {
                try {
                  await downloadSampleResultSheet(eventId, false);
                  showMessage('success', 'Sample sheet downloaded successfully');
                } catch (error) {
                  showMessage('error', 'Failed to download sample sheet: ' + (error.message || 'Unknown error'));
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <FaFileExcel className="mr-2" />
              Download Sample Sheet
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">📋 File Format Requirements</h4>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li><strong>Required columns:</strong> studentId, score</li>
              <li><strong>Optional columns:</strong> name, remarks</li>
              <li><strong>File types:</strong> Excel (.xlsx, .xls) or CSV</li>
              <li><strong>Note:</strong> Download the sample sheet above to see the exact format with example data</li>
            </ul>
          </div>
          
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for these result files"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel/CSV Files (Maximum 10 files, 10MB each)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaFileExcel className="mr-2" />
                  Choose Result Files
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Drag and drop files here or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Accepted formats: .xlsx, .xls, .csv
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
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

        {/* Files List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaFileExcel className="mr-2 text-green-600" />
              Uploaded Result Files ({files.length})
            </h2>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12">
              <FaFileExcel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Result Files Yet</h3>
              <p className="text-gray-600">
                Upload your first result file to get started.
              </p>
            </div>
          ) : (
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
                          {file.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {file.description}
                            </p>
                          )}
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Size: {formatFileSize(file.size)}</span>
                            <span>Uploaded: {formatDate(file.uploadedAt)}</span>
                            {file.coach?.name && (
                              <span>By: {file.coach.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(file.id, file.originalName)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors inline-flex items-center"
                      >
                        <FaDownload className="mr-1" />
                        Download
                      </button>
                      
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
          )}
        </div>
      </div>
    </div>
  );
};

export default EventResultUpload;