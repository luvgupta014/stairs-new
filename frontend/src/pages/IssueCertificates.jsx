import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById, getEligibleStudents, issueCertificates, getEventCertificates } from '../api';
import Spinner from '../components/Spinner';

const IssueCertificates = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [issuedCertificates, setIssuedCertificates] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('issue');
  const [certificateType, setCertificateType] = useState('participation'); // 'participation' or 'winning'

  useEffect(() => {
    loadEvent();
    loadIssuedCertificates();
    loadEligibleStudentsDirectly();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventResponse = await getEventById(eventId);
      if (eventResponse.success) {
        setEvent(eventResponse.data);
      } else {
        throw new Error(eventResponse.message || 'Failed to load event');
      }
    } catch (err) {
      console.error('Error loading event:', err);
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const loadIssuedCertificates = async () => {
    try {
      setLoadingHistory(true);
      const response = await getEventCertificates(eventId);
      
      if (response.success) {
        setIssuedCertificates(response.data?.certificates || []);
      } else {
        setIssuedCertificates([]);
      }
    } catch (err) {
      console.error('Error loading issued certificates:', err);
      setIssuedCertificates([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadEligibleStudentsDirectly = async () => {
    try {
      setLoadingStudents(true);
      setError(null);

      const response = await getEligibleStudents(eventId, null);
      
      if (response.success) {
        setEligibleStudents(response.data.eligibleStudents || []);
        
        if (response.data.eligibleStudents.length === 0) {
          setError('No eligible students found. All certificates may have been issued already.');
        }
      } else {
        throw new Error(response.message || 'Failed to load eligible students');
      }
    } catch (err) {
      console.error('Error loading eligible students:', err);
      setError(err.message || 'Failed to load eligible students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        setError(null);
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === eligibleStudents.length) {
      setSelectedStudents([]);
    } else {
      const studentsToSelect = eligibleStudents.map(s => s.id);
      setSelectedStudents(studentsToSelect);
      setError(null);
    }
  };

  const handleIssueCertificates = async (type) => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    const typeLabel = type === 'participation' ? 'Participation' : 'Winning';
    const confirmMsg = `Are you sure you want to issue ${typeLabel} certificates to ${selectedStudents.length} student(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setIssuing(true);
      setError(null);

      const response = await issueCertificates({
        eventId,
        orderId: null,
        selectedStudents,
        certificateType: type
      });

      if (response.success) {
        setSuccess(`Successfully issued ${response.data.issued} ${typeLabel.toLowerCase()} certificate(s)!`);
        setSelectedStudents([]);
        
        setTimeout(() => {
          loadEligibleStudentsDirectly();
          loadIssuedCertificates();
          setSuccess(null);
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to issue certificates');
      }
    } catch (err) {
      console.error('Error issuing certificates:', err);
      setError(err.message || 'Failed to issue certificates');
    } finally {
      setIssuing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                to="/dashboard/coach"
                className="text-teal-600 hover:text-teal-700 font-medium mb-2 inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">E-Certificates Management</h1>
              {event && (
                <p className="text-gray-600 mt-1">
                  Event: <span className="font-semibold">{event.name}</span> • {event.sport}
                </p>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('issue')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'issue'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🎓 Issue Certificates
                </button>
                <button
                  onClick={() => {
                    setActiveTab('history');
                    loadIssuedCertificates();
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'history'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📜 Certificate History ({issuedCertificates.length})
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Issue Tab Content */}
        {activeTab === 'issue' && (
          <div className="grid grid-cols-1 gap-6">
            {/* Eligible Students Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Select Students for Certificates
              </h2>

              {loadingStudents ? (
                <div className="text-center py-12">
                  <Spinner />
                  <p className="text-gray-600 mt-4">Loading eligible students...</p>
                </div>
              ) : eligibleStudents.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <p className="text-gray-600 mb-2">No eligible students</p>
                  <p className="text-sm text-gray-500">All certificates have been issued for this event</p>
                </div>
              ) : (
                <>
                  {/* Select All Checkbox */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === eligibleStudents.length && eligibleStudents.length > 0}
                        onChange={handleSelectAll}
                        className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="ml-3 font-medium text-gray-900">
                        Select All ({eligibleStudents.length} students)
                      </span>
                    </label>
                    <div className="text-sm text-gray-600">
                      Selected: <span className="font-semibold text-teal-600">{selectedStudents.length}</span> / {eligibleStudents.length}
                    </div>
                  </div>

                  {/* Students List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {eligibleStudents.map((student) => (
                      <label
                        key={student.id}
                        className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedStudents.includes(student.id)
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-200 hover:border-teal-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                          className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">
                                UID: <span className="font-mono font-semibold">{student.uniqueId || student.studentId}</span>
                              </p>
                              {student.sport && (
                                <p className="text-xs text-gray-500 mt-1">Sport: {student.sport}</p>
                              )}
                            </div>
                            {selectedStudents.includes(student.id) && (
                              <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Issue Buttons */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Participation Certificate Button */}
                      <button
                        onClick={() => handleIssueCertificates('participation')}
                        disabled={selectedStudents.length === 0 || issuing}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        {issuing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Issuing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            Issue Participation ({selectedStudents.length})
                          </>
                        )}
                      </button>

                      {/* Winning Certificate Button */}
                      <button
                        onClick={() => handleIssueCertificates('winning')}
                        disabled={selectedStudents.length === 0 || issuing}
                        className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        {issuing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Issuing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            Issue Winning ({selectedStudents.length})
                          </>
                        )}
                      </button>
                    </div>
                    
                    {selectedStudents.length > 0 && (
                      <p className="text-center text-sm text-gray-600 mt-3">
                        Certificates will be issued to selected students and they will be notified via email
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Issued Certificates History
              </h2>
              <button
                onClick={loadIssuedCertificates}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
                <p className="ml-3 text-gray-600">Loading certificates...</p>
              </div>
            ) : issuedCertificates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Certificate ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Athlete Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sport
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {issuedCertificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {cert.uid}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                              {cert.participantName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {cert.participantName}
                              </div>
                              <div className="text-xs text-gray-500 font-mono mt-1">
                                UID: {cert.studentUniqueId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cert.sportName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            cert.certificateType === 'winning' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {cert.certificateType === 'winning' ? '🏆 Winning' : '🎓 Participation'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(cert.issueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <a
                            href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${cert.certificateUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </a>
                          <a
                            href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${cert.certificateUrl}`}
                            download
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-5xl">📜</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Issued Yet</h3>
                <p className="text-gray-600 mb-6">
                  Issue certificates to students to see them here.
                </p>
                <button
                  onClick={() => setActiveTab('issue')}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Issue Certificates
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueCertificates;