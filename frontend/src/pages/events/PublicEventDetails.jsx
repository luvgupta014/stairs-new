import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPublicEventByUniqueId } from '../../api';
import Spinner from '../../components/Spinner';
import Footer from '../../components/Footer';
import logo from '../../assets/logo.png';
import { FaCalendar, FaMapMarkerAlt, FaUsers, FaTrophy, FaClock, FaArrowRight, FaLock, FaGlobe, FaRupeeSign, FaDumbbell } from 'react-icons/fa';

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
      localStorage.setItem('pendingEventRegistration', uniqueId);
      navigate('/register/student');
    } else if (user.role === 'STUDENT') {
      if (event?.id) {
        navigate(`/events/${event.id}`);
      } else {
        navigate(`/events/${uniqueId}`);
      }
    } else {
      localStorage.setItem('pendingEventRegistration', uniqueId);
      navigate('/register/student');
    }
  };

  const handleLoginClick = () => {
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

  const getParticipantPercentage = () => {
    if (!event?.maxParticipants || event.maxParticipants === 0) return 0;
    return Math.min((event.currentParticipants || 0) / event.maxParticipants * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600 font-medium">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center transform transition-all">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Event Not Found</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{error || 'The event you are looking for does not exist or is no longer available.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* STAIRS Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="STAIRS Talent Hub Logo"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                STAIRS Talent Hub
              </h1>
              <p className="text-xs text-gray-500">Empowering Athletes, Connecting Talent</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Main Content */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          {/* Event Title Card */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl overflow-hidden transform transition-all hover:shadow-3xl mb-8">
            <div className="p-8 md:p-12 text-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FaTrophy className="w-6 h-6" />
                </div>
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold uppercase tracking-wide">
                  {event.level || 'EVENT'}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{event.name}</h1>
              {event.description && (
                <p className="text-blue-100 text-lg md:text-xl leading-relaxed max-w-3xl">
                  {event.description}
                </p>
              )}
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Details Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 transform transition-all hover:shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaDumbbell className="w-5 h-5 text-blue-600" />
                  </div>
                  Event Details
                </h2>
                
                <div className="space-y-6">
                  {/* Sport */}
                  <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FaTrophy className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Sport</p>
                      <p className="text-xl font-bold text-gray-900">{event.sport}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FaCalendar className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Date</p>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(event.startDate)}</p>
                      </div>
                    </div>

                    {event.endDate && (
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FaClock className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">End Date</p>
                          <p className="text-lg font-semibold text-gray-900">{formatDate(event.endDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Venue */}
                  <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FaMapMarkerAlt className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Venue</p>
                      <p className="text-lg font-semibold text-gray-900 leading-relaxed">
                        {event.venue}
                        {event.address && `, ${event.address}`}
                        {event.city && `, ${event.city}`}
                        {event.state && `, ${event.state}`}
                      </p>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <FaUsers className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Participants</p>
                          <p className="text-lg font-bold text-gray-900">
                            {event.currentParticipants || 0} / {event.maxParticipants || 'Unlimited'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {event.maxParticipants && (
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${getParticipantPercentage()}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {/* Registration Fee */}
                  {event.studentFeeEnabled && event.studentFeeAmount > 0 && (
                    <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FaRupeeSign className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Registration Fee</p>
                        <p className="text-2xl font-bold text-gray-900">₹{event.studentFeeAmount}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Organizer & CTA */}
            <div className="space-y-6">
              {/* Organizer Card */}
              {(event.coach || event.createdByAdmin) && (
                <div className="bg-white rounded-2xl shadow-xl p-6 transform transition-all hover:shadow-2xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <FaGlobe className="w-4 h-4 text-white" />
                    </div>
                    Organized By
                  </h3>
                  <div className="space-y-2">
                    {event.createdByAdmin ? (
                      <>
                        <div className="flex items-center gap-2">
                          <img
                            src={logo}
                            alt="STAIRS Logo"
                            className="w-6 h-6 object-contain"
                          />
                          <p className="text-xl font-bold text-gray-900">STAIRS Talent Hub</p>
                        </div>
                        <p className="text-sm text-gray-600">Official STAIRS Event</p>
                      </>
                    ) : event.coach ? (
                      <>
                        <p className="text-xl font-bold text-gray-900">{event.coach.name}</p>
                        {event.coach.primarySport && (
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <FaTrophy className="w-4 h-4" />
                            {event.coach.primarySport}
                          </p>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Registration CTA Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-6 text-white transform transition-all hover:scale-105">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FaTrophy className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Join the Competition!</h3>
                  <p className="text-indigo-100 text-sm">Don't miss this opportunity to showcase your talent</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Section */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 transform transition-all hover:shadow-3xl">
            <div className="text-center max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-4">
                <img
                  src={logo}
                  alt="STAIRS Logo"
                  className="w-8 h-8 object-contain opacity-60"
                />
                <span className="text-sm text-gray-400 font-medium">Powered by STAIRS Talent Hub</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Are you an athlete?
              </h2>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Sign up or log in to register for this event and showcase your talent on STAIRS Talent Hub!
              </p>
              
              {!user ? (
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <button
                    onClick={handleRegisterClick}
                    className="group px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3 min-w-[220px] justify-center"
                  >
                    <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Sign Up to Register
                    <FaArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <span className="text-gray-400 font-semibold text-lg">or</span>
                  
                  <button
                    onClick={handleLoginClick}
                    className="group px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3 min-w-[220px] justify-center"
                  >
                    <FaLock className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    Log In to Register
                    <FaArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : user.role === 'STUDENT' ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <p className="text-green-800 font-semibold text-lg mb-4">You're logged in! Redirecting to registration...</p>
                    <button
                      onClick={handleRegisterClick}
                      className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                    >
                      Go to Event Registration
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                    <p className="text-amber-800 font-semibold text-lg mb-4">Please log in as an athlete to register for events.</p>
                    <button
                      onClick={() => {
                        localStorage.setItem('pendingEventRegistration', uniqueId);
                        navigate('/register/student');
                      }}
                      className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                    >
                      Register as Athlete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PublicEventDetails;

