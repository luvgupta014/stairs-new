import { useState } from 'react';
import { FaExclamationTriangle, FaCreditCard, FaUpload, FaUserPlus } from 'react-icons/fa';

const BulkUploadWithManual = () => {
  const [activeTab, setActiveTab] = useState('bulk'); // 'bulk' or 'manual'
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  
  // Manual form state
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    sport: '',
    level: '',
    dateOfBirth: '',
    fatherName: '',
    aadhaar: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    district: '',
    pincode: '',
    sport2: '',
    sport3: '',
    school: '',
    club: '',
    coachName: '',
    coachMobile: '',
    achievements: ''
  });

  const handleManualInputChange = (e) => {
    const { name, value } = e.target;
    setManualForm(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!manualForm.name || !manualForm.email || !manualForm.phone || !manualForm.sport) {
      setError('Please fill in all required fields: Name, Email, Phone, and Sport');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful response
      const mockResult = {
        success: true,
        data: {
          results: [{
            row: 1,
            name: manualForm.name,
            email: manualForm.email,
            phone: manualForm.phone,
            sport: manualForm.sport,
            status: 'success',
            studentId: 'STU' + Date.now(),
            isNewUser: true,
            tempPassword: 'Temp' + Math.random().toString(36).slice(-8)
          }],
          errors: []
        }
      };
      
      setSuccess(true);
      setUploadResults(mockResult.data);
      
      // Reset form
      setManualForm({
        name: '', email: '', phone: '', sport: '', level: '',
        dateOfBirth: '', fatherName: '', aadhaar: '', gender: '',
        address: '', city: '', state: '', district: '', pincode: '',
        sport2: '', sport3: '', school: '', club: '',
        coachName: '', coachMobile: '', achievements: ''
      });
    } catch (error) {
      setError('Failed to add student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
    setSuccess(false);
  };

  const handleBulkUpload = async () => {
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

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Mock successful response
      const mockResult = {
        success: true,
        data: {
          results: [
            {
              row: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '+1234567890',
              sport: 'Football',
              status: 'success',
              studentId: 'STU001',
              isNewUser: true,
              tempPassword: 'TempPass123'
            },
            {
              row: 2,
              name: 'Jane Smith',
              email: 'jane@example.com',
              phone: '+1234567891',
              sport: 'Basketball',
              status: 'success',
              studentId: 'STU002',
              isNewUser: false
            }
          ],
          errors: []
        }
      };
      
      setSuccess(true);
      setUploadResults(mockResult.data);
    } catch (error) {
      setError('Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Header-only template (no sample rows)
    const csvContent = `Name,Email,Phone,Sport,Level,Date of Birth,Father Name,Aadhaar,Gender,Address,City,State,District,Pincode,Sport 2,Sport 3,School,Club,Coach Name,Coach Mobile,Achievements\n`;

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

    let csvContent = 'Student Upload Report\n';
    csvContent += `Generated on: ${new Date().toLocaleString()}\n`;
    csvContent += `Total Records: ${(uploadResults.results?.length || 0) + (uploadResults.errors?.length || 0)}\n\n`;

    if (uploadResults.results && uploadResults.results.length > 0) {
      csvContent += 'SUCCESSFUL RECORDS\n';
      csvContent += 'Name,Email,Phone,Sport,Student ID,New User,Temporary Password\n';
      
      uploadResults.results.forEach(result => {
        csvContent += `"${result.name}","${result.email}","${result.phone}","${result.sport}","${result.studentId}","${result.isNewUser ? 'Yes' : 'No'}","${result.tempPassword || 'N/A'}"\n`;
      });
    }

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {activeTab === 'manual' ? 'Student Added Successfully!' : 'Upload Completed Successfully!'}
            </h2>
            <p className="text-gray-600">
              Your student data has been processed and uploaded to the system.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResults.results?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResults.errors?.length || 0}
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

          {newUsers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                New Students Created ({newUsers.length})
              </h3>
              <p className="text-blue-800 mb-4">
                Please share these temporary passwords with the students:
              </p>
              <div className="max-h-60 overflow-y-auto">
                <table className="min-w-full bg-white rounded">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 uppercase">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 uppercase">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-blue-900 uppercase">Password</th>
                    </tr>
                  </thead>
                  <tbody>
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

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setSuccess(false);
                setUploadResults(null);
                setFile(null);
              }}
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Add Another Student
            </button>
            <button 
              onClick={downloadReport}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Download Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Students</h1>
          <p className="text-gray-600">
            Add students individually or upload multiple students at once using CSV/Excel files.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center px-6 py-3 font-medium transition-colors ${
              activeTab === 'manual'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaUserPlus className="mr-2" />
            Add Student
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center px-6 py-3 font-medium transition-colors ${
              activeTab === 'bulk'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaUpload className="mr-2" />
            Bulk Upload
          </button>
        </div>

        {/* Manual Add Form */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit}>
            <div className="space-y-6">
              {/* Required Fields Section */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4">
                  Required Information *
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={manualForm.name}
                      onChange={handleManualInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={manualForm.email}
                      onChange={handleManualInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={manualForm.phone}
                      onChange={handleManualInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Sport *
                    </label>
                    <input
                      type="text"
                      name="sport"
                      value={manualForm.sport}
                      onChange={handleManualInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Football, Basketball, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Information (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Level
                    </label>
                    <select
                      name="level"
                      value={manualForm.level}
                      onChange={handleManualInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Professional">Professional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={manualForm.dateOfBirth}
                      onChange={handleManualInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={manualForm.fatherName}
                      onChange={handleManualInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Father's Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      name="aadhaar"
                      value={manualForm.aadhaar}
                      onChange={handleManualInputChange}
                      maxLength="12"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="123456789012"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={manualForm.gender}
                      onChange={handleManualInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={manualForm.city}
                      onChange={handleManualInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={manualForm.state}
                      onChange={handleManualInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={manualForm.pincode}
                      onChange={handleManualInputChange}
                      maxLength="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="110001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secondary Sport
                    </label>
                    <input
                      type="text"
                      name="sport2"
                      value={manualForm.sport2}
                      onChange={handleManualInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Optional second sport"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School
                    </label>
                    <input
                      type="text"
                      name="school"
                      value={manualForm.school}
                      onChange={handleManualInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="School Name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={manualForm.address}
                      onChange={handleManualInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Full Address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Achievements
                    </label>
                    <textarea
                      name="achievements"
                      value={manualForm.achievements}
                      onChange={handleManualInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="List any notable achievements..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setManualForm({
                    name: '', email: '', phone: '', sport: '', level: '',
                    dateOfBirth: '', fatherName: '', aadhaar: '', gender: '',
                    address: '', city: '', state: '', district: '', pincode: '',
                    sport2: '', sport3: '', school: '', club: '',
                    coachName: '', coachMobile: '', achievements: ''
                  })}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaUserPlus className="mr-2" />
                      Add Student
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Bulk Upload Tab */}
        {activeTab === 'bulk' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Upload Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Download the CSV template using the button below</li>
                <li>Fill in your student data following the template format</li>
                <li>Save the file as CSV or Excel format</li>
                <li>Upload the file using the upload area</li>
              </ol>
            </div>

            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Step 1: Download Template</h3>
                <p className="text-gray-600">Get the CSV template with required columns</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Download Template
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Upload Your File</h3>
              
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
                  className="inline-flex items-center px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 cursor-pointer"
                >
                  {file ? 'Change File' : 'Select File'}
                </label>
              </div>
            </div>

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

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleBulkUpload}
                disabled={!file || loading}
                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaUpload className="mr-2" />
                    Upload Students
                  </>
                )}
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mt-8">
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadWithManual;