import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPublicEventByUniqueId } from '../../api';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

/**
 * PublicEventDetails Page
 * Public event details page accessible via shareable link
 * Shows event information and allows users to register
 */
const PublicEventDetails = () => {
  const { uniqueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEventDetails();
  }, [uniqueId]);

  const loadEventDetails = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await getPublicEventByUniqueId(uniqueId);
      const eventData = response?.data || response;
      
      if (!eventData) {
        throw new Error('Event not found');
      }
      
      setEvent(eventData);
    } catch (err) {
      console.error('Error loading event:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    if (!user) {
      // Not logged in - redirect to student registration/login
      // Store the event ID to redirect back after registration
      localStorage.setItem('pendingEventRegistration', uniqueId);
      navigate('/register/student');
    } else if (user.role === 'STUDENT') {
      // Already logged in as student - redirect to event details page for registration
      // We need to use the event ID (database ID) for the authenticated route
      if (event?.id) {
        navigate(`/events/${event.id}`);
      } else {
        // If we only have uniqueId, try to use it
        navigate(`/events/${uniqueId}`);
      }
    } else {
      // Logged in but not as student - redirect to student registration
      alert('Please register as a student to participate in events.');
      localStorage.setItem('pendingEventRegistration', uniqueId);
      navigate('/register/student');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spinner />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The event you are looking for does not exist or is no longer available.'}</p>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Event Header */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
              <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
              {event.description && (
                <p className="text-blue-100 text-lg">{event.description}</p>
              )}
            </div>

            {/* Event Details */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Sport</h3>
                  <p className="text-lg font-medium text-gray-900">{event.sport}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Level</h3>
                  <p className="text-lg font-medium text-gray-900">{event.level}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Start Date</h3>
                  <p className="text-lg font-medium text-gray-900">{formatDate(event.startDate)}</p>
                </div>

                {event.endDate && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">End Date</h3>
                    <p className="text-lg font-medium text-gray-900">{formatDate(event.endDate)}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Venue</h3>
                  <p className="text-lg font-medium text-gray-900">
                    {event.venue}
                    {event.address && `, ${event.address}`}
                    {event.city && `, ${event.city}`}
                    {event.state && `, ${event.state}`}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Participants</h3>
                  <p className="text-lg font-medium text-gray-900">
                    {event.currentParticipants || 0} / {event.maxParticipants || 'Unlimited'}
                  </p>
                </div>

                {event.studentFeeEnabled && event.studentFeeAmount > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Registration Fee</h3>
                    <p className="text-lg font-medium text-gray-900">₹{event.studentFeeAmount}</p>
                  </div>
                )}
              </div>

              {/* Register Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Are you an athlete?
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Register now to participate in this event and showcase your talent!
                  </p>
                  <Button
                    onClick={handleRegisterClick}
                    className="px-8 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    Register Now
                  </Button>
                  {!user && (
                    <p className="text-sm text-gray-500 mt-4">
                      You'll need to create an account or log in to register
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Coach/Organizer Info */}
          {event.coach && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organized By</h3>
              <p className="text-gray-700">{event.coach.name}</p>
              {event.coach.primarySport && (
                <p className="text-sm text-gray-500 mt-1">Sport: {event.coach.primarySport}</p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PublicEventDetails;

