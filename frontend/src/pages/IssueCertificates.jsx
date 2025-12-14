import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById, getEligibleStudents, issueCertificates, issueWinnerCertificates, getEventCertificates, getEventPaymentStatus } from '../api';
import Spinner from '../components/Spinner';

const IssueCertificates = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedWinners, setSelectedWinners] = useState([]); // [{studentId, position, positionText}]
  const [issuedCertificates, setIssuedCertificates] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('participant'); // 'participant', 'winner', or 'history'
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadEvent();
    loadPaymentStatus();
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

  const loadPaymentStatus = async () => {
    try {
      const response = await getEventPaymentStatus(eventId);
      if (response.success) {
        setPaymentStatus(response.data);
      }
    } catch (err) {
      console.error('Error loading payment status:', err);
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
  
      if (!response.success) {
        setError(response.message || "Payment is pending for the student.");
        setEligibleStudents([]);
        return;
      }
  
      const students = response?.data?.eligibleStudents || [];
      setEligibleStudents(students);
  
      if (students.length === 0) {
        setError(response.message || "No eligible students found. Payment may be pending.");
      }
    } catch (err) {
      console.error("Error loading eligible students:", err);
      setError(err.message || "Failed to load eligible students");
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

  const handleWinnerPositionChange = (studentId, position, positionText) => {
    setSelectedWinners(prev => {
      const existing = prev.find(w => w.studentId === studentId);
      if (existing) {
        return prev.map(w => 
          w.studentId === studentId 
            ? { ...w, position: parseInt(position), positionText: positionText || getPositionText(parseInt(position)) }
            : w
        );
      } else {
        return [...prev, { 
          studentId, 
          position: parseInt(position), 
          positionText: positionText || getPositionText(parseInt(position)) 
        }];
      }
    });
  };

  const handleWinnerToggle = (studentId) => {
    setSelectedWinners(prev => {
      if (prev.find(w => w.studentId === studentId)) {
        return prev.filter(w => w.studentId !== studentId);
      } else {
        return [...prev, { 
          studentId, 
          position: 1, 
          positionText: 'Winner' 
        }];
      }
    });
  };

  const getPositionText = (position) => {
    if (position === 1) return 'Winner';
    if (position === 2) return 'Runner-Up';
    if (position === 3) return 'Second Runner-Up';
    return `Position ${position}`;
  };

  const handleIssueCertificates = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    const confirmMsg = `Are you sure you want to issue participant certificates to ${selectedStudents.length} student(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setIssuing(true);
      setError(null);

      const response = await issueCertificates({
        eventId,
        orderId: null,
        selectedStudents
      });

      if (response.success) {
        setSuccess(`Successfully issued ${response.data.issued} participant certificate(s)!`);
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
      if (err.paymentPending) {
        setShowPaymentModal(true);
      } else {
        setError(err.message || 'Failed to issue certificates');
      }
    } finally {
      setIssuing(false);
    }
  };

  const handleIssueWinnerCertificates = async () => {
    if (selectedWinners.length === 0) {
      setError('Please select at least one winner with position');
      return;
    }

    const confirmMsg = `Are you sure you want to issue winner certificates to ${selectedWinners.length} student(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setIssuing(true);
      setError(null);

      const response = await issueWinnerCertificates({
        eventId,
        selectedStudentsWithPositions: selectedWinners
      });

      if (response.success) {
        setSuccess(`Successfully issued ${response.data.issued} winner certificate(s)!`);
        setSelectedWinners([]);
        
        setTimeout(() => {
          loadEligibleStudentsDirectly();
          loadIssuedCertificates();
          setSuccess(null);
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to issue winner certificates');
      }
    } catch (err) {
      console.error('Error issuing winner certificates:', err);
      if (err.paymentPending) {
        setShowPaymentModal(true);
      } else {
        setError(err.message || 'Failed to issue winner certificates');
      }
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
                to="/dashboard/admin"
                className="text-teal-600 hover:text-teal-700 font-medium mb-2 inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Certificate Management</h1>
              {event && (
                <p className="text-gray-600 mt-1">
                  Event: <span className="font-semibold">{event.name}</span> • {event.sport}
                </p>
              )}
              {/* Payment Status Badge */}
              {paymentStatus && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    paymentStatus.paymentCompleted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {paymentStatus.paymentCompleted ? (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Payment Completed
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Payment Pending
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('participant')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'participant'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🎓 Participant Certificates
                </button>
                <button
                  onClick={() => setActiveTab('winner')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'winner'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🏆 Winner Certificates
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

        {/* Payment Pending Modal - Enhanced with better error handling */}
        {showPaymentModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPaymentModal(false);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Pending</h3>
                  <p className="text-sm text-gray-600">Certificate issuance requires payment completion</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700 text-sm mb-2">
                  <strong>Why can't I issue certificates?</strong>
                </p>
                <p className="text-gray-600 text-sm">
                  {paymentStatus?.paymentMode === 'STUDENT_EVENT_FEE'
                    ? 'Students must complete the participation fee payment for this event before certificates can be issued. Only APPROVED (paid) participants are eligible.'
                    : 'The coach/coordinator must complete payment for this event before certificates can be issued. This ensures all financial obligations are met before certificate generation.'}
                </p>
              </div>
              <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>What to do:</strong>
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Check the payment status in the event details</li>
                  <li>Contact the coach to complete payment if needed</li>
                  <li>Once payment is confirmed, you can issue certificates</li>
                </ul>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    navigate(`/admin/events?openEventId=${eventId}`);
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  View Event Details
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Participant Certificates Tab */}
        {activeTab === 'participant' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Issue Participant Certificates
            </h2>

            {/* NEW: Inline Payment Pending Warning */}
            {paymentStatus && !paymentStatus.paymentCompleted && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                    <p className="text-red-700 font-medium flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        **Payment Pending:** Certificates cannot be issued until the event payment is complete.
                    </p>
                </div>
            )}
            
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

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleIssueCertificates}
                    disabled={selectedStudents.length === 0 || issuing || (paymentStatus && !paymentStatus.paymentCompleted)}
                    className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {issuing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Issuing Certificates...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Issue {selectedStudents.length} Participant Certificate{selectedStudents.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                  
                  {selectedStudents.length > 0 && (
                    <p className="text-center text-sm text-gray-600 mt-3">
                      Certificates will be issued to selected students and they will be notified via email
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Winner Certificates Tab */}
        {activeTab === 'winner' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Issue Winner Certificates
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Select winners and assign their positions (1st, 2nd, 3rd, etc.)
            </p>
            
            {/* NEW: Inline Payment Pending Warning */}
            {paymentStatus && !paymentStatus.paymentCompleted && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                    <p className="text-red-700 font-medium flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        **Payment Pending:** Certificates cannot be issued until the event payment is complete.
                    </p>
                </div>
            )}


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
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {eligibleStudents.map((student) => {
                    const winnerData = selectedWinners.find(w => w.studentId === student.id);
                    const isSelected = !!winnerData;
                    
                    return (
                      <div
                        key={student.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 hover:border-yellow-300'
                        }`}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleWinnerToggle(student.id)}
                            className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 mt-1"
                          />
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-600">
                                  UID: <span className="font-mono font-semibold">{student.uniqueId || student.studentId}</span>
                                </p>
                              </div>
                              {isSelected && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                  {winnerData.positionText || `Position ${winnerData.position}`}
                                </span>
                              )}
                            </div>
                            
                            {isSelected && (
                              <div className="mt-3 p-3 bg-white rounded border border-yellow-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Position
                                </label>
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="number"
                                    min="1"
                                    value={winnerData.position}
                                    onChange={(e) => handleWinnerPositionChange(
                                      student.id, 
                                      e.target.value, 
                                      getPositionText(parseInt(e.target.value))
                                    )}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="e.g., Winner, Runner-Up"
                                    value={winnerData.positionText}
                                    onChange={(e) => handleWinnerPositionChange(
                                      student.id, 
                                      winnerData.position, 
                                      e.target.value
                                    )}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Position text will appear on the certificate (e.g., "Winner", "Runner-Up")
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleIssueWinnerCertificates}
                    disabled={selectedWinners.length === 0 || issuing}
                    className="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {issuing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Issuing Winner Certificates...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M6 3v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Issue {selectedWinners.length} Winner Certificate{selectedWinners.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                  
                  {selectedWinners.length > 0 && (
                    <p className="text-center text-sm text-gray-600 mt-3">
                      Winner certificates will be issued with position badges and students will be notified
                    </p>
                  )}
                </div>
              </>
            )}
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
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sport
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
                    {issuedCertificates.map((cert) => {
                      const isWinner = cert.uniqueId?.includes('WINNER');
                      return (
                        <tr key={cert.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {cert.uniqueId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                                isWinner 
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                                  : 'bg-gradient-to-r from-teal-500 to-blue-500'
                              }`}>
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isWinner ? (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                🏆 Winner
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold">
                                🎓 Participant
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cert.sportName}
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
                      );
                    })}
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
                  onClick={() => setActiveTab('participant')}
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