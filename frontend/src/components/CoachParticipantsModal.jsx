import React from 'react';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBirthdayCake, FaCalendarAlt, FaTrophy, FaGraduationCap, FaIdCard } from 'react-icons/fa';

const CoachParticipantsModal = ({ isOpen, onClose, eventData, participants, loading }) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Not specified';
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return `${age} years`;
    } catch (error) {
      return 'Not specified';
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      REGISTERED: 'bg-green-100 text-green-800 border-green-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[status] || statusStyles.PENDING}`}>
        {status || 'PENDING'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Event Participants</h3>
              {eventData && (
                <p className="text-sm text-gray-600 mt-1">
                  {eventData.name} • {formatDate(eventData.startDate)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
          
          {eventData && (
            <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
              <span>Total Participants: <strong>{participants.length}</strong></span>
              {eventData.maxParticipants && (
                <span>Max Capacity: <strong>{eventData.maxParticipants}</strong></span>
              )}
              <span>
                Registration Progress: 
                <strong className="ml-1">
                  {eventData.maxParticipants 
                    ? `${Math.round((participants.length / eventData.maxParticipants) * 100)}%`
                    : 'Unlimited'
                  }
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Loading participants...</span>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12">
              <FaUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Participants Yet</h3>
              <p className="text-gray-600">
                No students have registered for this event yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {participants.map((registration, index) => {
                const student = registration.student;
                return (
                  <div key={registration.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    {/* Header with student name and status */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student'}
                        </h4>
                        <p className="text-sm text-gray-600">Registration #{index + 1}</p>
                        {student.user?.uniqueId && (
                          <div className="flex items-center text-xs text-blue-600 font-medium mt-1">
                            <FaIdCard className="w-3 h-3 mr-1" />
                            <span>UID: {student.user.uniqueId}</span>
                          </div>
                        )}
                      </div>
                      {getStatusBadge(registration.status)}
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-3 mb-4">
                      {student.user?.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FaEnvelope className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="break-all">{student.user.email}</span>
                        </div>
                      )}
                      
                      {student.user?.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FaPhone className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{student.user.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Sports & Academic Information */}
                    <div className="space-y-2 mb-4">
                      {student.sport && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-700 mr-2">Sport:</span>
                          <span className="text-green-600 font-medium">{student.sport}</span>
                        </div>
                      )}
                      
                      {student.level && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-700 mr-2">Level:</span>
                          <span className="text-blue-600">{student.level}</span>
                        </div>
                      )}
                      
                      {student.institute && (
                        <div className="flex items-center text-sm">
                          <FaGraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-600">{student.institute}</span>
                        </div>
                      )}
                    </div>

                    {/* Personal Information */}
                    <div className="space-y-2 mb-4">
                      {student.dateOfBirth && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FaBirthdayCake className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Age: {calculateAge(student.dateOfBirth)}</span>
                        </div>
                      )}
                      
                      {student.fatherName && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FaUser className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Father: {student.fatherName}</span>
                        </div>
                      )}
                    </div>

                    {/* Address Information */}
                    {(student.address || student.city || student.state) && (
                      <div className="mb-4">
                        <div className="flex items-start text-sm text-gray-600">
                          <FaMapMarkerAlt className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            {student.address && <div>{student.address}</div>}
                            <div>
                              {[student.city, student.state, student.pincode].filter(Boolean).join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Achievements */}
                    {student.achievements && (
                      <div className="mb-4">
                        <div className="flex items-start text-sm">
                          <FaTrophy className="w-4 h-4 mr-2 text-yellow-500 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-medium text-gray-700">Achievements:</span>
                            <p className="text-gray-600 mt-1 text-xs">{student.achievements}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    {student.bio && (
                      <div className="mb-4">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Bio:</span>
                          <p className="text-gray-600 mt-1 text-xs">{student.bio}</p>
                        </div>
                      </div>
                    )}

                    {/* Registration Date */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center text-xs text-gray-500">
                        <FaCalendarAlt className="w-3 h-3 mr-2" />
                        <span>Registered on {formatDate(registration.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {participants.length > 0 && (
                <span>
                  Showing {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachParticipantsModal;