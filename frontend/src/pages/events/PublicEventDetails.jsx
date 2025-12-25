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

  // Redirect to authenticated event page if already logged in as student
  useEffect(() => {
    if (user?.role === 'STUDENT' && event?.id) {
      // If logged in as student, redirect to authenticated event details page
      navigate(`/events/${event.id}`, { replace: true });
    }
  }, [user, event, navigate]);

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
      // Not logged in - show options to sign up or login
      // Store the event uniqueId to redirect back after registration/login
      localStorage.setItem('pendingEventRegistration', uniqueId);
      // For now, default to registration, but could show a modal with options
      navigate('/register/student');
    } else if (user.role === 'STUDENT') {
      // Already logged in as student - redirect to authenticated event details page
      if (event?.id) {
        navigate(`/events/${event.id}`);
      } else {
        // Fallback: try with uniqueId
        navigate(`/events/${uniqueId}`);
      }
    } else {
      // Logged in but not as student - redirect to student registration
      localStorage.setItem('pendingEventRegistration', uniqueId);
      navigate('/register/student');
    }
  };

  const handleLoginClick = () => {
    // Store event for redirect after login
    localStorage.setItem('pendingEventRegistration', uniqueId);
    navigate('/login/student');
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
                <div className="mt-3">
                  <p className="text-blue-100 text-lg leading-relaxed">{event.description}</p>
                </div>
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

              {/* Registration Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Are you an athlete?
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Sign up or log in to register for this event and showcase your talent!
                  </p>
                  
                  {!user ? (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <Button
                        onClick={handleRegisterClick}
                        className="px-8 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Sign Up to Register
                      </Button>
                      <span className="text-gray-400 font-medium">or</span>
                      <Button
                        onClick={handleLoginClick}
                        className="px-8 py-3 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Log In to Register
                      </Button>
                    </div>
                  ) : user.role === 'STUDENT' ? (
                    <div>
                      <p className="text-gray-600 mb-4">You're logged in! Redirecting to registration...</p>
                      <Button
                        onClick={handleRegisterClick}
                        className="px-8 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                      >
                        Go to Event Registration
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-red-600 mb-4">Please log in as an athlete to register for events.</p>
                      <Button
                        onClick={() => {
                          localStorage.setItem('pendingEventRegistration', uniqueId);
                          navigate('/register/student');
                        }}
                        className="px-8 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                      >
                        Register as Athlete
                      </Button>
                    </div>
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

