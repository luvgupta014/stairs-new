import { useState } from 'react';
import { bulkUploadStudents } from '../api';
import Spinner from '../components/Spinner';
import BackButton from '../components/BackButton';
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

  const handleTestUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/coach/students/test-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });
      
      const result = await response.json();
      console.log('Test result:', result);
      
      if (result.success) {
        alert(`Test successful! Found ${result.data.totalRows} data rows. Check console for details.`);
      } else {
        setError(result.message || 'Test failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      setError('Test failed. Check console for details.');
    }
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
    // Create a comprehensive CSV template with all supported fields
    const csvContent = `Name,Email,Phone,Sport,Level,Date of Birth,Father Name,Aadhaar,Gender,Address,City,State,District,Pincode,Sport 2,Sport 3,School,Club,Coach Name,Coach Mobile,Achievements
John Doe,john.doe@email.com,+1234567890,Football,Intermediate,2005-01-15,Robert Doe,123456789012,Male,123 Main St,New York,NY,Manhattan,10001,Basketball,,State High School,City Football Club,Mike Johnson,+1234567895,Regional Champion 2023
Jane Smith,jane.smith@email.com,+1234567892,Basketball,Advanced,2004-03-22,David Smith,123456789013,Female,456 Oak Ave,Los Angeles,CA,Los Angeles,90001,Tennis,Swimming,Metro High School,Sports Academy,Sarah Wilson,+1234567896,State Level Player
Mike Johnson,mike.johnson@email.com,+1234567894,Tennis,Beginner,2006-07-10,Tom Johnson,123456789014,Male,789 Pine St,Chicago,IL,Cook,60601,,,Central High School,,John Coach,+1234567897,`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadReport = () => {
    if (!uploadResults) return;

    // Create detailed CSV report
    let csvContent = '';
    
    // Header
    csvContent += 'Student Upload Report\n';
    csvContent += `Generated on: ${new Date().toLocaleString()}\n`;
    csvContent += `Total Records: ${(uploadResults.results?.length || 0) + (uploadResults.errors?.length || 0)}\n`;
    csvContent += `Successful: ${uploadResults.results?.length || 0}\n`;
    csvContent += `Failed: ${uploadResults.errors?.length || 0}\n\n`;

    // Successful records
    if (uploadResults.results && uploadResults.results.length > 0) {
      csvContent += 'SUCCESSFUL RECORDS\n';
      csvContent += 'Row,Name,Email,Phone,Sport,Status,Student ID,New User,Temporary Password\n';
      
      uploadResults.results.forEach(result => {
        csvContent += `${result.row || ''},`;
        csvContent += `"${result.name || ''}",`;
        csvContent += `"${result.email || ''}",`;
        csvContent += `"${result.phone || ''}",`;
        csvContent += `"${result.sport || ''}",`;
        csvContent += `"${result.status || ''}",`;
        csvContent += `"${result.studentId || ''}",`;
        csvContent += `"${result.isNewUser ? 'Yes' : 'No'}",`;
        csvContent += `"${result.tempPassword || 'N/A'}"\n`;
      });
      csvContent += '\n';
    }

    // Failed records
    if (uploadResults.errors && uploadResults.errors.length > 0) {
      csvContent += 'FAILED RECORDS\n';
      csvContent += 'Row,Name,Email,Error\n';
      
      uploadResults.errors.forEach(error => {
        csvContent += `${error.row || ''},`;
        csvContent += `"${error.name || ''}",`;
        csvContent += `"${error.email || ''}",`;
        csvContent += `"${error.error || ''}"\n`;
      });
    }

    // Download the report
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_upload_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (success && uploadResults) {
    const newUsers = uploadResults.results?.filter(r => r.isNewUser) || [];
    const existingUsers = uploadResults.results?.filter(r => !r.isNewUser) || [];
    
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
                <div className="text-2xl font-bold text-blue-600">
                  {newUsers.length}
                </div>
                <div className="text-sm text-gray-600">New Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {existingUsers.length}
                </div>
                <div className="text-sm text-gray-600">Existing Students</div>
              </div>
            </div>
          </div>

          {/* New Students with Passwords */}
          {newUsers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                New Students Created ({newUsers.length})
              </h3>
              <p className="text-blue-800 mb-4">
                The following students were created with temporary passwords. Please share these credentials with them:
              </p>
              <div className="max-h-60 overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Password</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {newUsers.map((user, index) => (
                      <tr key={index} className="border-b border-blue-200">
                        <td className="px-3 py-2 text-sm text-gray-900">{user.name}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{user.email}</td>
                        <td className="px-3 py-2 text-sm font-mono bg-gray-100 rounded">
                          {user.tempPassword}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Details */}
          {uploadResults.errors && uploadResults.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4">
                Failed Records ({uploadResults.errors.length})
              </h3>
              <div className="max-h-40 overflow-y-auto">
                {uploadResults.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-800 mb-2">
                    Row {error.row}: {error.name} - {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}

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
            <button 
              onClick={downloadReport}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Download Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <BackButton to="/dashboard/coach" label="Back to Dashboard" />
      </div>
      
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
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Supported Columns</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              'Name*', 'Email*', 'Phone*', 'Sport*',
              'Level', 'Date of Birth', 'Father Name', 'Aadhaar',
              'Gender', 'Address', 'City', 'State',
              'District', 'Pincode', 'Sport 2', 'Sport 3',
              'School', 'Club', 'Coach Name', 'Coach Mobile',
              'Achievements'
            ].map((column) => (
              <div 
                key={column} 
                className={`rounded px-2 py-1 text-xs font-medium ${
                  column.includes('*') 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {column}
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-sm text-red-600">
              * Required fields: Name, Email, Phone, Sport
            </p>
            <p className="text-sm text-gray-600">
              All other fields are optional and can enhance the student profile.
            </p>
            <p className="text-sm text-gray-500">
              New students will be created with temporary passwords that coaches can see in the upload results.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => navigate('/dashboard/coach')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            {/*file && (
              <button
                onClick={handleTestUpload}
                disabled={loading}
                className="px-6 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Test File
              </button>
            )*/}
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
    </div>
  );
};

export default BulkUpload;