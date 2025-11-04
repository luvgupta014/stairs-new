import { useState, useEffect, useRef } from 'react';
import { 
  getStudentDashboard, 
  getAvailableCoaches, 
  requestCoachConnection,
  getStudentEvents,
  registerForEvent,
  unregisterFromEvent,
  getStudentEventRegistrations
} from '../../api';
import CoachCard from '../../components/CoachCard';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [myEventRegistrations, setMyEventRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [connectedCoaches, setConnectedCoaches] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [registeringEventId, setRegisteringEventId] = useState(null);
  
  // ADDED: Filter states for events
  const [eventsFilter, setEventsFilter] = useState('all'); // all, registered, pending, approved
  const [modalSearchFilter, setModalSearchFilter] = useState('');
  const [modalSportFilter, setModalSportFilter] = useState('');
  
  const tabContentRef = useRef(null);
  
  const navigate = useNavigate();
  
  // Get user profile from localStorage
  const localUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();
  const localProfile = localUser.profile || {};

  // Helper to get student field from dashboardData or fallback to localProfile
  const getStudentField = (field, fallback = '') =>
    dashboardData?.student?.[field] ??
    localProfile[field] ??
    fallback;

  useEffect(() => {
    loadDashboardData();
    loadCoaches();
    loadAvailableEvents();
    loadMyEventRegistrations();
  }, []);

  const handleUpdateProfile = () => {
    navigate('/student/profile');
  };

  const loadDashboardData = async () => {
    try {
      const data = await getStudentDashboard();
      console.log('✅ Dashboard data loaded:', data);
      setDashboardData(data.data || data);
      setConnectedCoaches(data.data?.connectedCoaches || data.connectedCoaches || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Using mock data for demo
      setDashboardData({
        student: {
          name: 'John Doe',
          sport: 'Football',
          level: 'Intermediate',
          joinedDate: '2024-03-01',
          profileCompletion: 85,
          achievements: ['Regional Champion', 'Team Captain'],
          upcomingEvents: 3,
          trainingHours: 24
        },
        events: [
          { id: 1, name: 'State Championship', date: '2025-12-15', status: 'registered', category: 'Competition' },
          { id: 2, name: 'Regional Trials', date: '2025-11-20', status: 'pending', category: 'Selection' },
          { id: 3, name: 'Summer Training Camp', date: '2025-12-01', status: 'registered', category: 'Training' }
        ],
        connectedCoaches: [1, 2],
        notifications: [
          { id: 1, type: 'event', message: 'State Championship registration confirmed', time: '2 hours ago' },
          { id: 2, type: 'coach', message: 'New message from Coach Mike Johnson', time: '5 hours ago' },
          { id: 3, type: 'achievement', message: 'Congratulations! You earned a new badge', time: '1 day ago' }
        ],
        progress: {
          skillLevel: 75,
          physicalFitness: 82,
          mentalStrength: 68,
          teamwork: 90
        }
      });
      setConnectedCoaches([1, 2]);
    } finally {
      setLoading(false);
    }
  };

  const loadCoaches = async () => {
    try {
      const coachesData = await getAvailableCoaches();
      setCoaches(coachesData.data?.coaches || []);
      console.log('Fetched coaches:', coachesData);
    } catch (error) {
      console.error('Failed to load coaches:', error);
      // Using mock data for demo
      setCoaches([
        {
          id: 1,
          name: 'Mike Johnson',
          specialization: 'Football Training',
          experience: 5,
          location: 'New York',
          rating: 4.8,
          certifications: ['FIFA Level 1', 'Sports Science'],
          students: 24,
          successRate: 92
        },
        {
          id: 2,
          name: 'Sarah Williams',
          specialization: 'Athletics',
          experience: 8,
          location: 'California',
          rating: 4.9,
          certifications: ['IAAF Level 2', 'Nutrition'],
          students: 18,
          successRate: 95
        },
        {
          id: 3,
          name: 'David Chen',
          specialization: 'Swimming',
          experience: 6,
          location: 'Florida',
          rating: 4.7,
          certifications: ['Swimming Australia Level 3'],
          students: 15,
          successRate: 88
        }
      ]);
    }
  };

  // ADDED: Load available events for registration
  const loadAvailableEvents = async () => {
    try {
      setEventsLoading(true);
      console.log('🔄 Loading available events...');
      
      const eventsData = await getStudentEvents({
        page: 1,
        limit: 20
        // Don't set status here - let the backend handle student filtering
      });
      
      console.log('✅ Available events loaded:', eventsData);
      setAvailableEvents(eventsData.data?.events || []);
    } catch (error) {
      console.error('❌ Failed to load available events:', error);
      setAvailableEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  // ADDED: Load student's event registrations
  const loadMyEventRegistrations = async () => {
    try {
      console.log('🔄 Loading student event registrations...');
      
      const registrationsData = await getStudentEventRegistrations({
        page: 1,
        limit: 20
      });
      
      console.log('✅ Event registrations loaded:', registrationsData);
      setMyEventRegistrations(registrationsData.data?.registrations || []);
    } catch (error) {
      console.error('❌ Failed to load event registrations:', error);
      setMyEventRegistrations([]);
    }
  };

  const handleConnectCoach = async (coachId) => {
    try {
      await requestCoachConnection(coachId);
      setConnectedCoaches([...connectedCoaches, coachId]);
    } catch (error) {
      console.error('Failed to connect coach:', error);
      // For demo, just update the state
      setConnectedCoaches([...connectedCoaches, coachId]);
    }
  };

  // ADDED: Handle viewing event details
  const handleViewEventDetails = (eventId) => {
    console.log(`🔍 Navigating to event details for event ${eventId}`);
    navigate(`/events/${eventId}`);
  };

  // ADDED: Handle event registration
  const handleRegisterForEvent = async (eventId) => {
    try {
      setRegisteringEventId(eventId);
      console.log(`🔄 Registering for event ${eventId}...`);
      
      const response = await registerForEvent(eventId);
      
      if (response.success) {
        console.log('✅ Successfully registered for event');
        
        // Refresh the events and registrations data
        await Promise.all([
          loadAvailableEvents(),
          loadMyEventRegistrations(),
          loadDashboardData()
        ]);
        
        alert('Successfully registered for the event!');
      } else {
        throw new Error(response.message || 'Failed to register for event');
      }
    } catch (error) {
      console.error('❌ Failed to register for event:', error);
      alert(`Failed to register for event: ${error.message || 'Unknown error'}`);
    } finally {
      setRegisteringEventId(null);
    }
  };

  // ADDED: Handle event unregistration
  const handleUnregisterFromEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to unregister from this event?')) {
      return;
    }

    try {
      setRegisteringEventId(eventId);
      console.log(`🔄 Unregistering from event ${eventId}...`);
      
      await unregisterFromEvent(eventId);
      
      console.log('✅ Successfully unregistered from event');
      
      // Refresh the events and registrations data
      await Promise.all([
        loadAvailableEvents(),
        loadMyEventRegistrations(),
        loadDashboardData()
      ]);
      
      alert('Successfully unregistered from the event!');
    } catch (error) {
      console.error('❌ Failed to unregister from event:', error);
      alert(`Failed to unregister from event: ${error.message || 'Unknown error'}`);
    } finally {
      setRegisteringEventId(null);
    }
  };

  // ADDED: Browse events handler
  const handleBrowseEvents = () => {
    setShowEventsModal(true);
    // Clear filters when opening modal
    setModalSearchFilter('');
    setModalSportFilter('');
    if (availableEvents.length === 0) {
      loadAvailableEvents();
    }
  };

  // ADDED: Filter functions
  const getFilteredRegistrations = () => {
    if (!myEventRegistrations) return [];
    
    switch (eventsFilter) {
      case 'registered':
        return myEventRegistrations.filter(reg => reg.status === 'REGISTERED');
      case 'pending':
        return myEventRegistrations.filter(reg => reg.status === 'PENDING');
      case 'approved':
        return myEventRegistrations.filter(reg => reg.status === 'APPROVED');
      default:
        return myEventRegistrations;
    }
  };

  const getFilteredAvailableEvents = () => {
    if (!availableEvents) return [];
    
    let filtered = [...availableEvents];
    
    // Search filter
    if (modalSearchFilter.trim()) {
      const searchTerm = modalSearchFilter.toLowerCase();
      filtered = filtered.filter(event =>
        (event.name || event.title || '').toLowerCase().includes(searchTerm) ||
        (event.sport || '').toLowerCase().includes(searchTerm) ||
        (event.venue || event.location || '').toLowerCase().includes(searchTerm)
      );
    }
    
    // Sport filter
    if (modalSportFilter && modalSportFilter !== 'all') {
      filtered = filtered.filter(event => 
        (event.sport || '').toLowerCase() === modalSportFilter.toLowerCase()
      );
    }
    
    return filtered;
  };

  const getAvailableSports = () => {
    if (!availableEvents) return [];
    const sports = [...new Set(availableEvents.map(event => event.sport).filter(Boolean))];
    return sports.sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {getStudentField('name', 'Student')}!
              </h1>
              <p className="text-blue-100 text-lg">
                {getStudentField('sport', 'Sports')} • {getStudentField('level', 'Athlete')} Level
              </p>
              <div className="mt-3 flex items-center space-x-4">
                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                  🏆 {(getStudentField('achievements') || []).length}
                  {' Achievements'}
                </span>
                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                  ⏱️ {getStudentField('trainingHours', 0)}h Training
                </span>
              </div>
            </div>
            <div className="hidden md:flex space-x-4">
              <button
                onClick={() => setShowCoachModal(true)}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Find Coaches
              </button>
              <button 
                onClick={handleBrowseEvents}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors"
              >
                Browse Events
              </button>
              {/* Link to full events page */}
              <button 
                onClick={() => navigate('/events')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500 transition-colors"
              >
                View All Events
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Connected Coaches */}
          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => {
              setActiveTab('coaches');
              setTimeout(() => {
                tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected Coaches</p>
                <p className="text-3xl font-bold text-gray-900">{connectedCoaches.length}</p>
                <p className="text-sm text-green-600 mt-1">Active connections</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
          {/* Events Regiastered */}
          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => {
              setActiveTab('events');
              setTimeout(() => {
                tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Events Registered</p>
                <p className="text-3xl font-bold text-gray-900">{myEventRegistrations.length}</p>
                <p className="text-sm text-blue-600 mt-1">{getStudentField('upcomingEvents', 0)} upcoming</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          {/* Available Events */}
          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={handleBrowseEvents}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Events</p>
                <p className="text-3xl font-bold text-gray-900">{availableEvents.length}</p>
                <p className="text-sm text-orange-600 mt-1">Ready to join</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            </div>
          </div>
          {/* Profile Completion */}
          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={handleUpdateProfile}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Completion</p>
                <p className="text-3xl font-bold text-gray-900">{getStudentField('profileCompletion', 0)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${getStudentField('profileCompletion', 0)}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div ref={tabContentRef} className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'coaches', name: 'My Coaches', icon: '👨‍🏫' },
                { id: 'events', name: 'My Events', icon: '🏆' },
                { id: 'progress', name: 'Progress', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {dashboardData?.notifications?.map(notification => (
                      <div key={notification.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                          notification.type === 'event' ? 'bg-blue-500' :
                          notification.type === 'coach' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}>
                          {notification.type === 'event' ? '🏆' : notification.type === 'coach' ? '👨‍🏫' : '🏅'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* UPDATED: Show upcoming events from API */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                    <div className="space-y-3">
                      {myEventRegistrations.filter(reg => 
                        new Date(reg.event.startDate) > new Date()
                      ).slice(0, 3).map(registration => (
                        <div key={registration.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{registration.event.title || registration.event.name}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(registration.event.startDate).toLocaleDateString()} • {registration.event.location || registration.event.venue}
                            </p>
                            <p className="text-sm text-gray-500">
                              Registration: {registration.status}
                            </p>
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {registration.event.sport}
                          </span>
                        </div>
                      ))}
                      
                      {myEventRegistrations.filter(reg => 
                        new Date(reg.event.startDate) > new Date()
                      ).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">📅</div>
                          <p>No upcoming events</p>
                          <button 
                            onClick={handleBrowseEvents}
                            className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Browse available events
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions & Achievements */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3 mb-8">
                    <button
                      onClick={() => setShowCoachModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      🔍 Find New Coaches
                    </button>
                    <button 
                      onClick={handleBrowseEvents}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      🏆 Browse Events
                    </button>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors" onClick={() => handleUpdateProfile()}>
                      📝 Update Profile
                    </button>
                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                      📊 View Analytics
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
                  <div className="space-y-3">
                    {dashboardData?.student?.achievements?.map((achievement, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">🏅</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'coaches' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Connected Coaches ({connectedCoaches.length})</h3>
                  <button
                    onClick={() => setShowCoachModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Find More Coaches
                  </button>
                </div>

                {connectedCoaches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coaches
                      .filter(coach => connectedCoaches.includes(coach.id))
                      .map(coach => (
                        <div key={coach.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              {coach.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{coach.name}</h4>
                              <p className="text-sm text-gray-600">{coach.specialization}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Experience</span>
                              <span className="font-medium">{coach.experience} years</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Rating</span>
                              <span className="font-medium">⭐ {coach.rating}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Students</span>
                              <span className="font-medium">{coach.students}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                              Message
                            </button>
                            <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                              View Profile
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-4xl">👨‍🏫</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Connected Coaches</h3>
                    <p className="text-gray-600 mb-6">Connect with coaches to enhance your training and performance.</p>
                    <button
                      onClick={() => setShowCoachModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      Find Coaches
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* UPDATED: Events tab to show real data */}
            {activeTab === 'events' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Events ({getFilteredRegistrations().length})</h3>
                  <div className="flex space-x-3">
                    <select 
                      value={eventsFilter}
                      onChange={(e) => setEventsFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Events ({myEventRegistrations.length})</option>
                      <option value="registered">Registered ({myEventRegistrations.filter(r => r.status === 'REGISTERED').length})</option>
                      <option value="pending">Pending ({myEventRegistrations.filter(r => r.status === 'PENDING').length})</option>
                      <option value="approved">Approved ({myEventRegistrations.filter(r => r.status === 'APPROVED').length})</option>
                    </select>
                    <button 
                      onClick={handleBrowseEvents}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Browse Events
                    </button>
                  </div>
                </div>

                {getFilteredRegistrations().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredRegistrations().map(registration => (
                      <div key={registration.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-semibold text-gray-900">{registration.event.title || registration.event.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            registration.status === 'REGISTERED' || registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {registration.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">📅 {new Date(registration.event.startDate).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">📍 {registration.event.location || registration.event.venue}</p>
                          <p className="text-sm text-gray-600">🏷️ {registration.event.sport}</p>
                          {registration.event.fees !== undefined && (
                            <p className="text-sm text-gray-600">💰 ₹{registration.event.fees || registration.event.eventFee || 0}</p>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewEventDetails(registration.event.id)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            View Details
                          </button>
                          {/* Add unregister button for registered events */}
                          {(registration.status === 'REGISTERED' || registration.status === 'APPROVED') && (
                            <button
                              onClick={() => handleUnregisterFromEvent(registration.event.id)}
                              disabled={registeringEventId === registration.event.id}
                              className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {registeringEventId === registration.event.id ? 'Processing...' : 'Unregister'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-4xl">🏆</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {eventsFilter === 'all' ? 'No Event Registrations' : 
                       eventsFilter === 'registered' ? 'No Registered Events' :
                       eventsFilter === 'pending' ? 'No Pending Events' :
                       'No Approved Events'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {eventsFilter === 'all' ? 'Browse available events and register to participate.' :
                       `You don't have any ${eventsFilter} events.`}
                    </p>
                    <button
                      onClick={handleBrowseEvents}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      Browse Events
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-6">Skill Assessment</h4>
                  <div className="space-y-4">
                    {Object.entries(dashboardData?.progress || {}).map(([skill, value]) => (
                      <div key={skill}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">{skill.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-sm text-gray-600">{value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-6">Training Progress</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">📊 Training Progress Chart (Chart.js integration)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Find Coaches Modal */}
      <Modal
        isOpen={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        title="Find Coaches"
        maxWidth="max-w-6xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map(coach => (
            <CoachCard
              key={coach.id}
              coach={coach}
              isConnected={connectedCoaches.includes(coach.id)}
              onConnect={handleConnectCoach}
            />
          ))}
        </div>
      </Modal>

      {/* ADDED: Browse Events Modal */}
      <Modal
        isOpen={showEventsModal}
        onClose={() => setShowEventsModal(false)}
        title={`Available Events (${availableEvents.length})`}
        maxWidth="max-w-6xl"
      >
        <div className="mb-4">
          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              placeholder="Search events..."
              value={modalSearchFilter}
              onChange={(e) => setModalSearchFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select 
              value={modalSportFilter}
              onChange={(e) => setModalSportFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sports</option>
              {getAvailableSports().map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>
          
          {/* Filter results info */}
          {(modalSearchFilter || modalSportFilter) && (
            <div className="text-sm text-gray-600 mb-2">
              Showing {getFilteredAvailableEvents().length} of {availableEvents.length} events
              {modalSearchFilter && ` matching "${modalSearchFilter}"`}
              {modalSportFilter && ` in ${modalSportFilter}`}
              <button
                onClick={() => {
                  setModalSearchFilter('');
                  setModalSportFilter('');
                }}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
        
        {eventsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading events...</p>
          </div>
        ) : getFilteredAvailableEvents().length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto">
            {getFilteredAvailableEvents().map(event => (
              <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-gray-900">{event.title || event.name}</h4>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    {event.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">📅 {new Date(event.startDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">📍 {event.location || event.venue}</p>
                  <p className="text-sm text-gray-600">🏷️ {event.sport}</p>
                  <p className="text-sm text-gray-600">👨‍🏫 {event.organizer?.name || event.coach?.name || 'Unknown Organizer'}</p>
                  <p className="text-sm text-gray-600">👥 {event.currentParticipants || 0}/{event.maxParticipants || 'Unlimited'}</p>
                  {(event.fees !== undefined || event.eventFee !== undefined) && (
                    <p className="text-sm text-gray-600">💰 ₹{event.fees || event.eventFee || 0}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleViewEventDetails(event.id)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                  
                  {/* Registration/Unregistration button */}
                  {event.isRegistered ? (
                    <button
                      onClick={() => handleUnregisterFromEvent(event.id)}
                      disabled={registeringEventId === event.id}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {registeringEventId === event.id ? 'Processing...' : 'Unregister'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegisterForEvent(event.id)}
                      disabled={registeringEventId === event.id}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {registeringEventId === event.id ? 'Registering...' : 'Register'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {(modalSearchFilter || modalSportFilter) ? 'No events match your filters' : 'No Events Available'}
            </h3>
            <p className="text-gray-600">
              {(modalSearchFilter || modalSportFilter) ? 
                'Try adjusting your search or sport filter.' : 
                'Check back later for upcoming events.'}
            </p>
            {(modalSearchFilter || modalSportFilter) && (
              <button
                onClick={() => {
                  setModalSearchFilter('');
                  setModalSportFilter('');
                }}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentDashboard;