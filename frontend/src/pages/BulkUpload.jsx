import { useState } from 'react';
import { bulkUploadStudents } from '../api';
import Spinner from '../components/Spinner';
import { useNavigate } from 'react-router-dom';

const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await bulkUploadStudents(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);
      setUploadResults(result.data);
    } catch (error) {
      setError(error.message || 'Upload failed');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV content
    const csvContent = `Name,Email,Phone,Sport,Level,Date of Birth,Institution,Emergency Contact
John Doe,john.doe@email.com,+1234567890,Football,Intermediate,2005-01-15,State University,+1234567891
Jane Smith,jane.smith@email.com,+1234567892,Basketball,Advanced,2004-03-22,State University,+1234567893
Mike Johnson,mike.johnson@email.com,+1234567894,Tennis,Beginner,2006-07-10,State University,+1234567895`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (success && uploadResults) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Completed Successfully!</h2>
            <p className="text-gray-600">
              Your student data has been processed and uploaded to the system.
            </p>
          </div>

          {/* Upload Results */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResults.results ? uploadResults.results.length : '0'}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResults.errors ? uploadResults.errors.length : '0'}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  0
                </div>
                <div className="text-sm text-gray-600">Duplicates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {uploadResults.results && uploadResults.errors ? 
                    uploadResults.results.length + uploadResults.errors.length : '0'}
                </div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Upload Another File
            </button>
            <button
              onClick={() => navigate('/dashboard/coach')}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Back to Dashboard
            </button>
            <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500">
              Download Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Student Upload</h1>
          <p className="text-gray-600">
            Upload student data in bulk using CSV or Excel files. Download the template to get started.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Upload Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Download the CSV template using the button below</li>
            <li>Fill in your student data following the template format</li>
            <li>Save the file as CSV or Excel format</li>
            <li>Upload the file using the upload area</li>
            <li>Review and confirm the data before processing</li>
          </ol>
        </div>

        {/* Template Download */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Step 1: Download Template</h3>
            <p className="text-gray-600">Get the CSV template with required columns</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Download Template
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Upload Your File</h3>
          
          {/* Drag and Drop Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-orange-600 text-2xl">📁</span>
            </div>
            
            {file ? (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Selected File: {file.name}
                </p>
                <p className="text-gray-600 mb-4">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-gray-600 mb-4">
                  Supports CSV, XLSX files up to 10MB
                </p>
              </div>
            )}
            
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              {file ? 'Change File' : 'Select File'}
            </label>
          </div>
        </div>

        {/* Upload Progress */}
        {loading && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
              <span className="text-sm text-gray-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Supported Columns Info */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Columns</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Name', 'Email', 'Phone', 'Sport',
              'Level', 'Date of Birth', 'Institution', 'Emergency Contact'
            ].map((column) => (
              <div key={column} className="bg-white rounded px-3 py-2 text-sm font-medium text-gray-700">
                {column}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            * Name, Email, and Sport are required fields. Other fields are optional but recommended.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => navigate('/dashboard/coach')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <Spinner size="sm" color="white" />
                <span className="ml-2">Processing...</span>
              </>
            ) : (
              'Upload Students'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;