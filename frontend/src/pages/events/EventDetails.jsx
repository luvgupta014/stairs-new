import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentEventDetails, getEvents, registerForEvent, unregisterFromEvent } from '../../api';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';
import BackButton from '../../components/BackButton';

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

      console.log('🔄 Loading event details for:', eventId);
      console.log('👤 User role:', user?.role);
      console.log('🆔 User ID:', user?.id);

      let response;
      if (user?.role === 'STUDENT') {
        // Use student-specific API endpoint
        console.log('📚 Using student API endpoint');
        response = await getStudentEventDetails(eventId);
        console.log('✅ Student API response:', response);
        setEvent(response.data);
      } else {
        // Use general events API for other roles
        console.log('🌐 Using general events API for role:', user?.role);
        response = await getEvents({ eventId });
        const eventData = response.data?.events?.find(e => e.id === eventId);
        if (!eventData) {
          throw new Error('Event not found');
        }
        setEvent(eventData);
      }

      console.log('✅ Event details loaded successfully');
    } catch (err) {
      console.error('❌ Error loading event details:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.message || 'Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle event registration
  const handleRegister = async () => {
    try {
      setIsRegistering(true);

      console.log('🔄 Registering for event:', eventId);
      
      const response = await registerForEvent(eventId);
      
      console.log('✅ Registration successful');
      alert('Successfully registered for the event!');
      loadEventDetails(); // Reload to update registration status
    } catch (err) {
      console.error('❌ Error registering for event:', err);
      alert(err.message || 'Failed to register for event. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle event unregistration
  const handleUnregister = async () => {
    if (!window.confirm('Are you sure you want to unregister from this event?')) {
      return;
    }

    try {
      setIsRegistering(true);

      console.log('🔄 Unregistering from event:', eventId);
      
      await unregisterFromEvent(eventId);
      
      console.log('✅ Unregistration successful');
      alert('Successfully unregistered from the event!');
      loadEventDetails(); // Reload to update registration status
    } catch (err) {
      console.error('❌ Error unregistering from event:', err);
      alert(err.message || 'Failed to unregister from event. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Check if user can register
  const canRegister = () => {
    if (!user || !event) return false;
    if (user.role !== 'STUDENT') return false;
    if (event.isRegistered) return false;
    if (event.status !== 'upcoming') return false;
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) return false;
    if (event.currentParticipants >= event.maxParticipants) return false;
    return true;
  };

  // Check if user can unregister
  const canUnregister = () => {
    if (!user || !event) return false;
    if (user.role !== 'STUDENT') return false;
    if (!event.isRegistered) return false;
    // Can unregister if event hasn't started yet
    const now = new Date();
    const startDate = new Date(event.startDate);
    return now < startDate;
  };

  // Check if user can manage event
  const canManageEvent = () => {
    if (!user || !event) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'COACH' && event.createdBy?.role === 'COACH' && event.createdBy?.id === user.id) return true;
    if (user.role === 'INSTITUTE' && event.createdBy?.role === 'INSTITUTE' && event.createdBy?.id === user.id) return true;
    if (user.role === 'CLUB' && event.createdBy?.role === 'CLUB' && event.createdBy?.id === user.id) return true;
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
        {/* Back Button */}
        <div className="mb-6">
          <BackButton to="/events" label="Back to Events" />
        </div>

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
                  {event.uniqueId && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Event ID</dt>
                      <dd className="mt-1 text-sm font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded inline-block">
                        {event.uniqueId}
                      </dd>
                    </div>
                  )}
                  
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
                        {(event.organizer?.name || event.coach?.name || event.createdBy?.name || 'Unknown')?.charAt(0)?.toUpperCase() || 'O'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {event.organizer?.name || event.coach?.name || event.createdBy?.name || 'Unknown Organizer'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {event.organizer?.specialization || event.coach?.specialization || 'Event Organizer'}
                    </p>
                    {(event.organizer?.experience || event.coach?.experience) && (
                      <p className="text-xs text-gray-400">
                        {event.organizer?.experience || event.coach?.experience} years experience
                      </p>
                    )}
                    {(event.organizer?.rating || event.coach?.rating) && (
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-yellow-500">⭐</span>
                        <span className="text-xs text-gray-500 ml-1">
                          {(event.organizer?.rating || event.coach?.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
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
                    <span className="font-medium">{event.currentParticipants || 0}/{event.maxParticipants}</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((event.currentParticipants || 0) / event.maxParticipants * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                {event.isRegistered ? (
                  <div className="space-y-3">
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
                    
                    {/* Show unregister button if user can still unregister */}
                    {canUnregister() && (
                      <Button
                        onClick={handleUnregister}
                        disabled={isRegistering}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isRegistering ? 'Unregistering...' : 'Unregister'}
                      </Button>
                    )}
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
                      {user?.role !== 'STUDENT' ? 'Only students can register for events' :
                       event.status !== 'upcoming' ? 'Registration is closed' :
                       event.registrationDeadline && new Date(event.registrationDeadline) < new Date() ? 'Registration deadline has passed' :
                       event.currentParticipants >= event.maxParticipants ? 'Event is full' :
                       'Registration not available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Map integration for location */}
              {(event.latitude && event.longitude) || event.address || event.venue ? (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Location & Navigation</h4>
                  
                  {event.latitude && event.longitude ? (
                    <div>
                      {/* Embedded Google Map */}
                      <div className="bg-gray-100 rounded-md overflow-hidden mb-3">
                        <iframe
                          src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${event.latitude},${event.longitude}&zoom=15`}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="w-full"
                        />
                      </div>
                      
                      {/* Navigation buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;
                            window.open(googleMapsUrl, '_blank');
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          Open in Google Maps
                        </button>
                        
                        <button
                          onClick={() => {
                            const appleMapUrl = `http://maps.apple.com/?ll=${event.latitude},${event.longitude}&q=${encodeURIComponent(event.venue + ', ' + event.city)}`;
                            window.open(appleMapUrl, '_blank');
                          }}
                          className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Open in Apple Maps
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Fallback: Search-based map */}
                      <div className="bg-gray-100 rounded-md overflow-hidden mb-3">
                        <iframe
                          src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent((event.address || event.venue) + ', ' + event.city + ', ' + event.state)}`}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="w-full"
                        />
                      </div>
                      
                      {/* Navigation button for address search */}
                      <button
                        onClick={() => {
                          const searchQuery = encodeURIComponent((event.address || event.venue) + ', ' + event.city + ', ' + event.state);
                          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
                          window.open(googleMapsUrl, '_blank');
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Find on Google Maps
                      </button>
                    </div>
                  )}
                  
                  {/* Address display */}
                  <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                    📍 {event.venue}
                    {event.address && <><br/>{event.address}</>}
                    <br/>{event.city}, {event.state}
                    {event.latitude && event.longitude && (
                      <><br/>Coordinates: {event.latitude}, {event.longitude}</>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;