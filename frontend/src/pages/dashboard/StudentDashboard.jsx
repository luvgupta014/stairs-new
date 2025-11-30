import { useState, useEffect, useRef } from 'react';
import { 
  getStudentDashboard, 
  getAvailableCoaches, 
  requestCoachConnection,
  getStudentEvents,
  registerForEvent,
  unregisterFromEvent,
  getStudentEventRegistrations,
  getStudentCertificates
} from '../../api';
import CoachCard from '../../components/CoachCard';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import { useNavigate, useSearchParams } from 'react-router-dom';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [myEventRegistrations, setMyEventRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [connectedCoaches, setConnectedCoaches] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [registeringEventId, setRegisteringEventId] = useState(null);

  // Format notification time
  const formatNotificationTime = (timeOrDate) => {
    // If it's already a formatted string like "2 hours ago", return it
    if (typeof timeOrDate === 'string' && timeOrDate.includes('ago')) {
      return timeOrDate;
    }
    
    // Otherwise format as date/time
    const now = new Date();
    const notificationTime = new Date(timeOrDate);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };
  
  // ADDED: Filter states for events
  const [eventsFilter, setEventsFilter] = useState('all'); // all, registered, pending, approved
  const [modalSearchFilter, setModalSearchFilter] = useState('');
  const [modalSportFilter, setModalSportFilter] = useState('');
  
  const tabContentRef = useRef(null);
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
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
    // Check if tab is specified in URL query params
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
      // Scroll to tab content after a small delay
      setTimeout(() => {
        tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    
    loadDashboardData();
    loadCoaches();
    loadAvailableEvents();
    loadMyEventRegistrations();
    loadCertificates();
  }, [searchParams]);

  const handleUpdateProfile = () => {
    navigate('/student/profile');
  };

  const loadDashboardData = async () => {
    try {
      const response = await getStudentDashboard();
      console.log('✅ Dashboard data loaded:', response);
      const data = response.data || response;
      setDashboardData(data);
      
      // Set connected coaches from API data
      const connectedCoachesList = data.connectedCoaches || data.recentConnections || [];
      setConnectedCoaches(connectedCoachesList.map(c => c.id));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Set empty data structure
      setDashboardData({
        student: {
          name: localProfile.name || 'Student',
          sport: localProfile.sport || 'Sports',
          level: localProfile.level || 'Beginner',
          profileCompletion: localProfile.profileCompletion || 0,
          achievements: [],
          trainingHours: 0
        },
        analytics: {
          totalConnections: 0,
          pendingConnections: 0,
          totalEvents: 0,
          upcomingEvents: 0,
          trainingHours: 0,
          achievementsCount: 0
        },
        connectedCoaches: [],
        recentConnections: [],
        upcomingEvents: [],
        progress: {}
      });
      setConnectedCoaches([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCoaches = async () => {
    try {
      const coachesData = await getAvailableCoaches();
      if (coachesData.success) {
        setCoaches(coachesData.data?.coaches || []);
        console.log('Fetched coaches:', coachesData.data?.coaches?.length || 0);
      } else {
        setCoaches([]);
      }
    } catch (error) {
      console.error('Failed to load coaches:', error);
      setCoaches([]);
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

  // Load student certificates
  const loadCertificates = async () => {
    try {
      setCertificatesLoading(true);
      console.log('🔄 Loading certificates...');
      
      const response = await getStudentCertificates();
      console.log('✅ Certificates loaded:', response);
      
      if (response.success) {
        setCertificates(response.data?.certificates || []);
      } else {
        setCertificates([]);
      }
    } catch (error) {
      console.error('❌ Failed to load certificates:', error);
      setCertificates([]);
    } finally {
      setCertificatesLoading(false);
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
                  🏆 {dashboardData?.student?.achievements?.length || dashboardData?.analytics?.achievementsCount || 0} Achievements
                </span>
                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                  ⏱️ {dashboardData?.student?.trainingHours || dashboardData?.analytics?.trainingHours || 0}h Training
                </span>
              </div>
            </div>
            <div className="hidden md:flex space-x-4">
              <button
                onClick={() => navigate('/student/browse-coaches')}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Coaches
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
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.analytics?.totalConnections || dashboardData?.connectedCoaches?.length || connectedCoaches.length}</p>
                <p className="text-sm text-green-600 mt-1">{dashboardData?.analytics?.pendingConnections || 0} pending</p>
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
          {/* Certificates */}
          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => {
              setActiveTab('certificates');
              setTimeout(() => {
                tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Certificates</p>
                <p className="text-3xl font-bold text-gray-900">{certificates.length}</p>
                <p className="text-sm text-yellow-600 mt-1">Earned achievements</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.student?.profileCompletion || getStudentField('profileCompletion', 0)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${dashboardData?.student?.profileCompletion || getStudentField('profileCompletion', 0)}%` }}
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
                { id: 'certificates', name: 'My Certificates', icon: '🎓' },
                { id: 'notifications', name: 'Notifications', icon: '🔔' },
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
                          <p className="text-xs text-gray-500 mt-1">
                            {formatNotificationTime(notification.createdAt || notification.time)}
                          </p>
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
                    {dashboardData?.student?.achievements && dashboardData.student.achievements.length > 0 ? (
                      dashboardData.student.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">🏅</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {typeof achievement === 'string' ? achievement : achievement.title || achievement}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No achievements yet</p>
                        <p className="text-xs mt-1">Participate in events to earn achievements!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'coaches' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Coaches ({dashboardData?.connectedCoaches?.length || dashboardData?.analytics?.totalConnections || 0})</h3>
                  <button
                    onClick={() => setShowCoachModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Find More Coaches
                  </button>
                </div>

                {dashboardData?.connectedCoaches && dashboardData.connectedCoaches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData.connectedCoaches.map(coach => (
                        <div key={coach.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              {coach.name?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{coach.name}</h4>
                              <p className="text-sm text-gray-600">{coach.specialization || coach.primarySport || 'Sports Coach'}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            {coach.experience && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Experience</span>
                                <span className="font-medium">{coach.experience} years</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Rating</span>
                              <span className="font-medium">⭐ {coach.rating || 0}</span>
                            </div>
                            {coach.uniqueId && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">UID</span>
                                <span className="font-mono text-xs">{coach.uniqueId}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex space-x-2">
                            <button 
                              onClick={() => navigate(`/admin/users/${coach.uniqueId}`)}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
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

            {activeTab === 'certificates' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Certificates ({certificates.length})</h3>
                  <button
                    onClick={loadCertificates}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                </div>

                {certificatesLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Spinner />
                    <p className="ml-3 text-gray-600">Loading certificates...</p>
                  </div>
                ) : certificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                        </div>
                        
                        <div className="text-center mb-4">
                          <h4 className="font-bold text-gray-900 text-lg mb-1">{cert.eventName}</h4>
                          <p className="text-sm text-gray-700 font-medium">{cert.participantName}</p>
                          <p className="text-sm text-gray-600 mt-1">Sport: {cert.sportName}</p>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-700 mb-4">
                          <div className="flex justify-between">
                            <span className="font-medium">Certificate ID:</span>
                            <span className="text-xs">{cert.uid}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Issue Date:</span>
                            <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <a
                            href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${cert.certificateUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors text-center font-medium"
                          >
                            📄 View PDF
                          </a>
                          <a
                            href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${cert.certificateUrl}`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors text-center font-medium"
                          >
                            ⬇️ Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-5xl">🎓</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h3>
                    <p className="text-gray-600 mb-6">Participate in events and earn certificates to showcase your achievements!</p>
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

            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">All Notifications</h3>
                {dashboardData?.notifications && dashboardData.notifications.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.notifications.map(notification => (
                      <div
                        key={notification.id}
                        className="flex items-start space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                          notification.type === 'event' ? 'bg-blue-100' :
                          notification.type === 'coach' ? 'bg-green-100' : 
                          notification.type === 'achievement' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          {notification.type === 'event' ? '🏆' : 
                           notification.type === 'coach' ? '👨‍🏫' : 
                           notification.type === 'achievement' ? '🏅' : '📢'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatNotificationTime(notification.createdAt || notification.time)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-5xl">🔔</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
                    <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-6">Event Participation Analytics</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Total Events</span>
                        <span className="text-sm text-gray-600">{dashboardData?.analytics?.totalEvents || dashboardData?.progress?.totalEventsParticipated || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((dashboardData?.analytics?.totalEvents || 0) * 10, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Completed Events</span>
                        <span className="text-sm text-gray-600">{dashboardData?.progress?.completedEvents || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${dashboardData?.analytics?.totalEvents > 0 ? Math.round((dashboardData?.progress?.completedEvents || 0) / dashboardData?.analytics?.totalEvents * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Upcoming Events</span>
                        <span className="text-sm text-gray-600">{dashboardData?.analytics?.upcomingEvents || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((dashboardData?.analytics?.upcomingEvents || 0) * 20, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Training Hours</span>
                        <span className="text-sm text-gray-600">{dashboardData?.student?.trainingHours || dashboardData?.analytics?.trainingHours || 0}h</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((dashboardData?.student?.trainingHours || 0) * 2, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-6">Performance Summary</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Achievements</span>
                        <span className="text-2xl font-bold text-blue-600">{dashboardData?.student?.achievements?.length || dashboardData?.analytics?.achievementsCount || 0}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Connected Coaches</span>
                        <span className="text-2xl font-bold text-green-600">{dashboardData?.analytics?.totalConnections || 0}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                        <span className="text-2xl font-bold text-purple-600">{dashboardData?.student?.profileCompletion || 0}%</span>
                      </div>
                    </div>
                    {dashboardData?.progress?.averageEventDuration > 0 && (
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Avg Event Duration</span>
                          <span className="text-2xl font-bold text-orange-600">{dashboardData.progress.averageEventDuration}h</span>
                        </div>
                      </div>
                    )}
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