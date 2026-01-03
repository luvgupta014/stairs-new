import React from 'react';
import { Link } from 'react-router-dom';
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

  const isOnlineLike = (() => {
    const fmt = (eventData?.eventFormat || '').toString().toUpperCase();
    return fmt === 'ONLINE' || fmt === 'HYBRID';
  })();

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
                      // Export participants to CSV
                      const headers = [
                        'Name',
                        'UID',
                        'Status',
                        'Selected Category',
                        'Account Email',
                        'Account Phone',
                        ...(isOnlineLike ? ['Alias', 'Tournament Email', 'Tournament Phone', 'PlayStation ID', 'EA ID', 'Instagram Handle'] : []),
                        'Registered Date'
                      ];
                      const rows = participants.map(p => [
                        p.student?.name || 'N/A',
                        p.student?.user?.uniqueId || 'N/A',
                        p.status || 'N/A',
                        p.selectedCategory || 'Not specified',
                        p.student?.user?.email || p.student?.email || 'N/A',
                        p.student?.user?.phone || p.student?.phone || 'N/A',
                        ...(isOnlineLike ? [
                          p.student?.alias || '',
                          p.registrationContact?.email || '',
                          p.registrationContact?.phone || '',
                          p.registrationContact?.playstationId || p.student?.playstationId || '',
                          p.registrationContact?.eaId || p.student?.eaId || '',
                          p.registrationContact?.instagramHandle || p.student?.instagramHandle || ''
                        ] : []),
                        p.registeredAt || p.createdAt ? new Date(p.registeredAt || p.createdAt).toLocaleDateString() : 'N/A'
                      ]);

                      const csvContent = [
                        headers.join(','),
                        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                      ].join('\n');

                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      const url = URL.createObjectURL(blob);
                      link.setAttribute('href', url);
                      link.setAttribute('download', `event_participants_${eventData?.name?.replace(/[^a-z0-9]/gi, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
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
                          {participant.student?.user?.uniqueId && (
                            <p className="text-xs text-blue-600 font-mono font-medium mt-1">
                              UID: {participant.student.user.uniqueId}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(participant)}
                        {participant.student?.level && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(participant.student.level)}`}>
                            {participant.student.level}
                          </span>
                        )}
                      {participant.student?.user?.uniqueId ? (
                        <Link
                          to={`/admin/users/${participant.student.user.uniqueId}`}
                          className="px-3 py-1 rounded-md bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
                          title="Open full student profile"
                        >
                          View Profile
                        </Link>
                      ) : null}
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

                      {/* Online/Hybrid details */}
                      {isOnlineLike ? (
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <FaMedal className="text-gray-400 w-4 h-4 mr-2" />
                            <span className="text-gray-700">Alias:</span>
                            <span className="ml-2 text-gray-900">{participant.student?.alias || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center">
                            <FaEnvelope className="text-gray-400 w-4 h-4 mr-2" />
                            <span className="text-gray-700">Tournament Email:</span>
                            <span className="ml-2 text-gray-900">{participant.registrationContact?.email || 'Not provided'}</span>
                          </div>
                          <div className="flex items-center">
                            <FaPhone className="text-gray-400 w-4 h-4 mr-2" />
                            <span className="text-gray-700">Tournament Phone:</span>
                            <span className="ml-2 text-gray-900">{participant.registrationContact?.phone || 'Not provided'}</span>
                          </div>
                          <div className="text-xs text-gray-700">
                            <span className="font-semibold">PSN:</span> <span className="font-mono">{participant.registrationContact?.playstationId || participant.student?.playstationId || '—'}</span>
                            <span className="mx-2">•</span>
                            <span className="font-semibold">EA:</span> <span className="font-mono">{participant.registrationContact?.eaId || participant.student?.eaId || '—'}</span>
                            <span className="mx-2">•</span>
                            <span className="font-semibold">IG:</span> <span className="font-mono">{participant.registrationContact?.instagramHandle || participant.student?.instagramHandle || '—'}</span>
                          </div>
                        </div>
                      ) : null}

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

                    {/* Selected Category */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-start">
                        <FaMedal className="text-blue-500 w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Selected Category:</p>
                          {participant.selectedCategory && participant.selectedCategory.trim() ? (
                            <div className="mt-1">
                              <p className="text-sm text-gray-900 font-semibold bg-blue-50 border border-blue-200 rounded-md px-3 py-2 inline-block">
                                {participant.selectedCategory}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic mt-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 inline-block">
                              Not specified
                            </p>
                          )}
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