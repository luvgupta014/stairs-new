import React from 'react';
import { FaTimes, FaUsers, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaMedal, FaGraduationCap, FaSchool } from 'react-icons/fa';

const ParticipantsModal = ({ 
  isOpen, 
  onClose, 
  eventData,
  participants,
  loading = false
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (participant) => {
    const status = participant.status || 'REGISTERED';
    const statusColors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'REGISTERED': 'bg-green-100 text-green-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getLevelColor = (level) => {
    const colors = {
      'BEGINNER': 'bg-green-100 text-green-800',
      'INTERMEDIATE': 'bg-blue-100 text-blue-800',
      'ADVANCED': 'bg-purple-100 text-purple-800',
      'PROFESSIONAL': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaUsers className="text-blue-500 w-6 h-6 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Participants</h3>
                <p className="text-sm text-gray-600">{eventData?.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Event Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Sport:</span>
              <span className="ml-2 text-gray-900">{eventData?.sport}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Date:</span>
              <span className="ml-2 text-gray-900">{formatDate(eventData?.startDate)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Max Participants:</span>
              <span className="ml-2 text-gray-900">{eventData?.maxParticipants || 'Unlimited'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Current Registrations:</span>
              <span className="ml-2 text-gray-900 font-semibold">{participants?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(90vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading participants...</span>
            </div>
          ) : participants && participants.length > 0 ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">
                  Registered Participants ({participants.length})
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // Export functionality can be implemented here
                      console.log('Export participants:', participants);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Export List
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {participants.map((participant, index) => (
                  <div key={participant.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <FaUser className="text-blue-600 w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {participant.student?.name || 
                             `${participant.student?.firstName || ''} ${participant.student?.lastName || ''}`.trim() || 
                             'Student'}
                          </h5>
                          <p className="text-sm text-gray-600">
                            Registered on {formatDate(participant.registeredAt || participant.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(participant)}
                        {participant.student?.level && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(participant.student.level)}`}>
                            {participant.student.level}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {/* Contact Information */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <FaEnvelope className="text-gray-400 w-4 h-4 mr-2" />
                          <span className="text-gray-900">{participant.student?.user?.email || participant.student?.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center">
                          <FaPhone className="text-gray-400 w-4 h-4 mr-2" />
                          <span className="text-gray-900">{participant.student?.user?.phone || participant.student?.phone || 'No phone'}</span>
                        </div>
                      </div>

                      {/* Sports Information */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <FaMedal className="text-gray-400 w-4 h-4 mr-2" />
                          <span className="text-gray-700">Sport:</span>
                          <span className="ml-2 text-gray-900">{participant.student?.sport || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center">
                          <FaGraduationCap className="text-gray-400 w-4 h-4 mr-2" />
                          <span className="text-gray-700">Level:</span>
                          <span className="ml-2 text-gray-900">{participant.student?.level || 'Not specified'}</span>
                        </div>
                      </div>

                      {/* Academic Information */}
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <FaSchool className="text-gray-400 w-4 h-4 mr-2" />
                          <span className="text-gray-700">Institute:</span>
                          <span className="ml-2 text-gray-900">{participant.student?.institute || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center">
                          <FaCalendarAlt className="text-gray-400 w-4 h-4 mr-2" />
                          <span className="text-gray-700">Age:</span>
                          <span className="ml-2 text-gray-900">
                            {participant.student?.dateOfBirth ? 
                              Math.floor((new Date() - new Date(participant.student.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) + ' years'
                              : 'Not specified'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    {participant.student?.bio && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Bio:</span> {participant.student.bio}
                        </p>
                      </div>
                    )}

                    {participant.student?.achievements && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Achievements:</span> {participant.student.achievements}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FaUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Participants Yet</h4>
              <p className="text-gray-600">
                No one has registered for this event yet. Participants will appear here once they register.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {participants && participants.length > 0 && (
              <>
                Total: {participants.length} participant{participants.length !== 1 ? 's' : ''}
                {eventData?.maxParticipants && (
                  <span className="ml-2">
                    ({Math.round((participants.length / eventData.maxParticipants) * 100)}% capacity)
                  </span>
                )}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsModal;