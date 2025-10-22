import React from 'react';
import { FaTimes, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaClock, FaUser, FaEnvelope, FaPhone, FaBuilding } from 'react-icons/fa';

const DetailModal = ({ 
  isOpen, 
  onClose, 
  type, // 'event' or 'user'
  data,
  title 
}) => {
  if (!isOpen || !data) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const renderEventDetails = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
          <p className="text-gray-900 font-semibold">{data.name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
          <p className="text-gray-900">{data.sport}</p>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        {getStatusBadge(data.status)}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{data.description}</p>
      </div>

      {/* Venue Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="flex items-center text-sm font-medium text-blue-900 mb-3">
          <FaMapMarkerAlt className="mr-2" />
          Venue Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Venue Name</label>
            <p className="text-sm text-gray-900">{data.venue || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <p className="text-sm text-gray-900">{data.address || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <p className="text-sm text-gray-900">{data.city || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
            <p className="text-sm text-gray-900">{data.state || 'Not specified'}</p>
          </div>
        </div>
        {data.latitude && data.longitude && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <label className="block text-xs font-medium text-gray-600 mb-1">Coordinates</label>
            <p className="text-sm text-gray-900">
              {parseFloat(data.latitude).toFixed(6)}, {parseFloat(data.longitude).toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* Date & Time */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="flex items-center text-sm font-medium text-green-900 mb-3">
          <FaCalendarAlt className="mr-2" />
          Schedule
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date & Time</label>
            <p className="text-sm text-gray-900">{formatDate(data.startDate)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date & Time</label>
            <p className="text-sm text-gray-900">{formatDate(data.endDate)}</p>
          </div>
        </div>
      </div>

      {/* Participants */}
      {data.maxParticipants && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaUsers className="inline mr-2" />
            Max Participants
          </label>
          <p className="text-gray-900">{data.maxParticipants}</p>
        </div>
      )}

      {/* Coach Info */}
      {data.coach && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="flex items-center text-sm font-medium text-purple-900 mb-3">
            <FaUser className="mr-2" />
            Coach Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <p className="text-sm text-gray-900">{data.coach.name}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <p className="text-sm text-gray-900">{data.coach.user?.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notes */}
      {data.adminNotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">Admin Notes</h4>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{data.adminNotes}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
        <div>
          <label className="block font-medium mb-1">Created</label>
          <p>{formatDate(data.createdAt)}</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Updated</label>
          <p>{formatDate(data.updatedAt)}</p>
        </div>
      </div>
    </div>
  );

  const renderUserDetails = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <p className="text-gray-900 font-semibold">{data.name || `${data.firstName} ${data.lastName}` || 'Not specified'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            data.user?.role === 'COACH' ? 'bg-blue-100 text-blue-800' :
            data.user?.role === 'STUDENT' ? 'bg-green-100 text-green-800' :
            data.user?.role === 'INSTITUTE' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {data.user?.role || data.role || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="flex items-center text-sm font-medium text-blue-900 mb-3">
          <FaEnvelope className="mr-2" />
          Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <p className="text-sm text-gray-900">{data.user?.email || data.email || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <p className="text-sm text-gray-900">{data.user?.phone || data.phone || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <div className="flex space-x-2">
          {getStatusBadge(data.user?.status || data.status || 'ACTIVE')}
          {data.user?.isVerified && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Role-specific details */}
      {data.user?.role === 'COACH' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-900 mb-3">Coach Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.specialization && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Specialization</label>
                <p className="text-sm text-gray-900">{data.specialization}</p>
              </div>
            )}
            {data.experience && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Experience</label>
                <p className="text-sm text-gray-900">{data.experience} years</p>
              </div>
            )}
          </div>
          {data.bio && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{data.bio}</p>
            </div>
          )}
        </div>
      )}

      {data.user?.role === 'STUDENT' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-3">Student Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.sport && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sport</label>
                <p className="text-sm text-gray-900">{data.sport}</p>
              </div>
            )}
            {data.level && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
                <p className="text-sm text-gray-900">{data.level}</p>
              </div>
            )}
            {data.institute && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Institute</label>
                <p className="text-sm text-gray-900">{data.institute}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
        <div>
          <label className="block font-medium mb-1">Joined</label>
          <p>{formatDate(data.user?.createdAt || data.createdAt)}</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Last Updated</label>
          <p>{formatDate(data.user?.updatedAt || data.updatedAt)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {type === 'event' ? renderEventDetails() : renderUserDetails()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;