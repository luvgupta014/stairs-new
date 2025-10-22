import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EventsList from '../../components/EventsList';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { useNavigate } from 'react-router-dom';
import { getStudentEvents, getCoachEvents, getEvents } from '../../api';

/**
 * Events Page
 * Main events listing page with role-based actions
 * Accessible by all user types with appropriate permissions
 */
const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Load events from API based on user role
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError('');

      console.log('🔄 Loading events for user role:', user?.role);

      let response;
      if (user?.role === 'STUDENT') {
        // Students see available events for registration
        response = await getStudentEvents({
          page: 1,
          limit: 50
        });
        setEvents(response.data?.events || []);
      } else if (user?.role === 'COACH') {
        // Coaches see their own events
        response = await getCoachEvents({
          page: 1,
          limit: 50
        });
        setEvents(response.data?.events || []);
      } else {
        // Admin and others see all events
        response = await getEvents({
          page: 1,
          limit: 50
        });
        setEvents(response.data?.events || []);
      }

      console.log('✅ Events loaded:', response.data?.events?.length || 0);
    } catch (err) {
      console.error('❌ Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle event registration
  const handleEventRegister = async (eventId) => {
    try {
      const token = localStorage.getItem('authToken');
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

      const data = await response.json();
      
      // Show success message
      alert('Successfully registered for the event!');
      
      // Reload events to update registration status
      loadEvents();
    } catch (err) {
      console.error('Error registering for event:', err);
      alert(err.message || 'Failed to register for event. Please try again.');
    }
  };

  // Handle event deletion
  const handleEventDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      // Show success message
      alert('Event deleted successfully!');
      
      // Reload events
      loadEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert(err.message || 'Failed to delete event. Please try again.');
    }
  };

  // Handle creating new event
  const handleCreateEvent = () => {
    navigate('/events/create');
  };

  // Handle editing event
  const handleEventEdit = (eventId) => {
    navigate(`/events/${eventId}/edit`);
  };

  // Handle viewing event details
  const handleEventView = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  // Handle viewing event participants
  const handleViewParticipants = (eventId) => {
    navigate(`/events/${eventId}/participants`);
  };

  // Handle uploading results
  const handleUploadResults = (eventId) => {
    navigate(`/events/${eventId}/results`);
  };

  // Check if user can create events
  const canCreateEvents = () => {
    return user && ['coach', 'institute', 'club'].includes(user.role);
  };

  // Check if user can manage events
  const canManageEvents = () => {
    return user && ['coach', 'institute', 'club', 'admin'].includes(user.role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Events</h1>
              <p className="text-gray-600 mt-1">
                Discover and participate in sports events
              </p>
            </div>
            
            {canCreateEvents() && (
              <Button
                onClick={handleCreateEvent}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Event
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
        <EventsList
          events={events}
          onRegister={handleEventRegister}
          onEdit={canManageEvents() ? handleEventEdit : null}
          onDelete={canManageEvents() ? handleEventDelete : null}
          onView={handleEventView}
          onViewParticipants={canManageEvents() ? handleViewParticipants : null}
          onUploadResults={canManageEvents() ? handleUploadResults : null}
          userRole={user?.role}
          userId={user?.id}
        />

        {/* Empty State for Event Creators */}
        {events.length === 0 && !error && canCreateEvents() && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first event.
            </p>
            <div className="mt-6">
              <Button
                onClick={handleCreateEvent}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Event
              </Button>
            </div>
          </div>
        )}

        {/* Empty State for Students */}
        {events.length === 0 && !error && !canCreateEvents() && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l2-2 4 4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events available</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are currently no events available for registration. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;