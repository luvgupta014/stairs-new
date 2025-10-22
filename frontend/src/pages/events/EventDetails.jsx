import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';

/**
 * EventDetails Page
 * Displays detailed information about a specific event
 * Allows registration and management actions based on user role
 */
const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Load event details
  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Event not found');
        }
        throw new Error('Failed to load event details');
      }

      const data = await response.json();
      setEvent(data.event);
    } catch (err) {
      console.error('Error loading event details:', err);
      setError(err.message || 'Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle event registration
  const handleRegister = async () => {
    try {
      setIsRegistering(true);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register for event');
      }

      alert('Successfully registered for the event!');
      loadEventDetails(); // Reload to update registration status
    } catch (err) {
      console.error('Error registering for event:', err);
      alert(err.message || 'Failed to register for event. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Check if user can register
  const canRegister = () => {
    if (!user || !event) return false;
    if (user.role !== 'student') return false;
    if (event.isRegistered) return false;
    if (event.status !== 'upcoming') return false;
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) return false;
    if (event.registrationsCount >= event.maxParticipants) return false;
    return true;
  };

  // Check if user can manage event
  const canManageEvent = () => {
    if (!user || !event) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'coach' && event.createdBy?.role === 'coach' && event.createdBy?.id === user.id) return true;
    if (user.role === 'institute' && event.createdBy?.role === 'institute' && event.createdBy?.id === user.id) return true;
    if (user.role === 'club' && event.createdBy?.role === 'club' && event.createdBy?.id === user.id) return true;
    return false;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/events')} className="w-full">
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <button
                onClick={() => navigate('/events')}
                className="text-gray-400 hover:text-gray-500"
              >
                Events
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500 truncate">{event.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">{event.sport}</span>
                    </div>
                  </div>
                  
                  {canManageEvent() && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => navigate(`/events/${eventId}/edit`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => navigate(`/events/${eventId}/participants`)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Participants
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* Event Details */}
              <div className="px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Event Details</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Start Date & Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(event.startDate)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">End Date & Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(event.endDate)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Venue</dt>
                    <dd className="mt-1 text-sm text-gray-900">{event.venue}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {event.address && `${event.address}, `}{event.city}, {event.state}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Event Fee</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {event.eventFee > 0 ? `₹${event.eventFee}` : 'Free'}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Max Participants</dt>
                    <dd className="mt-1 text-sm text-gray-900">{event.maxParticipants}</dd>
                  </div>
                  
                  {event.registrationDeadline && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Registration Deadline</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(event.registrationDeadline)}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Organizer Info */}
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Organized By</h3>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {event.createdBy?.name?.charAt(0)?.toUpperCase() || 'O'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{event.createdBy?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">
                      {event.createdBy?.role?.charAt(0)?.toUpperCase() + event.createdBy?.role?.slice(1) || 'Organizer'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Status</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Registered</span>
                    <span className="font-medium">{event.registrationsCount || 0}/{event.maxParticipants}</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((event.registrationsCount || 0) / event.maxParticipants * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                {event.isRegistered ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm text-green-800 font-medium">You're registered!</p>
                        <p className="text-xs text-green-600">You have successfully registered for this event.</p>
                      </div>
                    </div>
                  </div>
                ) : canRegister() ? (
                  <Button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isRegistering ? 'Registering...' : 'Register Now'}
                  </Button>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-sm text-gray-600">
                      {user?.role !== 'student' ? 'Only students can register for events' :
                       event.status !== 'upcoming' ? 'Registration is closed' :
                       event.registrationDeadline && new Date(event.registrationDeadline) < new Date() ? 'Registration deadline has passed' :
                       event.registrationsCount >= event.maxParticipants ? 'Event is full' :
                       'Registration not available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Map placeholder if coordinates are available */}
              {event.latitude && event.longitude && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Location</h4>
                  <div className="bg-gray-100 rounded-md h-32 flex items-center justify-center">
                    <p className="text-sm text-gray-500">Map integration coming soon</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: {event.latitude}, {event.longitude}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;