import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminDashboard, moderateEvent, getAdminEvents, getEventParticipants } from '../../api';
import InfoModal from '../../components/InfoModal';
import DetailModal from '../../components/DetailModal';
import ActionModal from '../../components/ActionModal';
import ParticipantsModal from '../../components/ParticipantsModal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usingCachedData, setUsingCachedData] = useState(false);

  // Stats and data states
  const [stats, setStats] = useState({
    totalAthletes: 0,
    totalCoaches: 0,
    totalInstitutes: 0,
    totalClubs: 0,
    totalUsers: 0,
    totalEvents: 0,
    pendingEvents: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    monthlyGrowth: 0,
    revenue: 0,
    revenueGrowth: 0
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);

  // Tab and filter states
  const [activeTab, setActiveTab] = useState('pending');
  const [eventFilters, setEventFilters] = useState({
    status: 'PENDING',
    sport: '',
    search: ''
  });
  const [eventLoading, setEventLoading] = useState(false);
  const [moderatingEventId, setModeratingEventId] = useState(null);

  // Filter states for registrations
  const [registrationFilters, setRegistrationFilters] = useState({
    role: '',
    status: '',
    search: ''
  });

  // Modal states
  const [infoModal, setInfoModal] = useState({
    isOpen: false,
    title: '',
    content: '',
    type: 'info',
    data: null
  });
  
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    type: '', // 'event' or 'user'
    data: null,
    title: ''
  });

  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: '', // 'approve', 'reject', 'suspend', 'restart'
    eventId: null,
    eventName: '',
    loading: false
  });

  const [participantsModal, setParticipantsModal] = useState({
    isOpen: false,
    eventData: null,
    participants: [],
    loading: false
  });

  // Use ref to track if initial load is done
  const initialLoadDone = useRef(false);
  const allEventsCache = useRef({ timestamp: 0, data: [], filters: {} });
  const dashboardCache = useRef({ timestamp: 0, data: null });
  const CACHE_DURATION = 120000; // 2 minutes cache
  const searchDebounceTimer = useRef(null);
  const recentRegistrationsRef = useRef(null);

  // Modal helper functions
  const showInfoModal = (title, content, type = 'info', data = null) => {
    setInfoModal({
      isOpen: true,
      title,
      content,
      type,
      data
    });
  };

  const showDetailModal = (type, data, title) => {
    setDetailModal({
      isOpen: true,
      type,
      data,
      title
    });
  };

  const closeInfoModal = () => {
    setInfoModal(prev => ({ ...prev, isOpen: false }));
  };

  const closeDetailModal = () => {
    setDetailModal(prev => ({ ...prev, isOpen: false }));
  };

  const showActionModal = (type, eventId, eventName) => {
    setActionModal({
      isOpen: true,
      type,
      eventId,
      eventName,
      loading: false
    });
  };
  

  const closeActionModal = () => {
    setActionModal(prev => ({ ...prev, isOpen: false, loading: false }));
  };

  const handleViewEventRegistrations = async (event) => {
    try {
      setParticipantsModal(prev => ({
        ...prev,
        isOpen: true,
        eventData: event,
        loading: true,
        participants: []
      }));

      console.log('📋 Fetching participants for event:', event.id);
      
      const response = await getEventParticipants(event.id);
      
      if (response.success) {
        console.log('✅ Participants loaded:', response.data.registrations?.length || 0);
        setParticipantsModal(prev => ({
          ...prev,
          participants: response.data.registrations || [],
          loading: false
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch participants');
      }
    } catch (error) {
      console.error('❌ Failed to fetch participants:', error);
      setParticipantsModal(prev => ({
        ...prev,
        participants: [],
        loading: false
      }));
      showInfoModal(
        'Error',
        `Failed to load participants: ${error.message}`,
        'error'
      );
    }
  };

  const closeParticipantsModal = () => {
    setParticipantsModal(prev => ({ ...prev, isOpen: false }));
  };

  const fetchDashboardData = useCallback(async (force = false) => {
    // Check cache first
    const now = Date.now();
    if (!force && dashboardCache.current.timestamp && (now - dashboardCache.current.timestamp) < CACHE_DURATION && dashboardCache.current.data) {
      console.log('✅ Using cached dashboard data');
      const cached = dashboardCache.current.data;
      setStats(cached.stats);
      setRecentUsers(cached.recentUsers);
      setPendingEvents(cached.pendingEvents);
      setLoading(false);
      setUsingCachedData(true);
      setTimeout(() => setUsingCachedData(false), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setUsingCachedData(false);
      
      console.log('🔄 Fetching admin dashboard data...');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000);
      });
      
      const response = await Promise.race([
        getAdminDashboard(),
        timeoutPromise
      ]);
      
      if (response && response.success) {
        const { stats: dashboardStats, recentUsers: users, recentEvents, pendingEvents: pendingEventsData } = response.data;
        
        console.log('✅ Dashboard response received:', {
          stats: dashboardStats,
          usersCount: users?.length || 0,
          eventsCount: pendingEventsData?.length || recentEvents?.length || 0
        });
        
        const statsData = {
          totalAthletes: dashboardStats?.totalStudents || 0,
          totalCoaches: dashboardStats?.totalCoaches || 0,
          totalInstitutes: dashboardStats?.totalInstitutes || 0,
          totalClubs: dashboardStats?.totalClubs || 0,
          totalUsers: dashboardStats?.totalUsers || 0,
          totalEvents: dashboardStats?.totalEvents || 0,
          pendingEvents: dashboardStats?.pendingEvents || 0,
          pendingApprovals: (dashboardStats?.pendingCoachApprovals || 0) + (dashboardStats?.pendingInstituteApprovals || 0),
          activeUsers: (dashboardStats?.totalStudents || 0) + (dashboardStats?.totalCoaches || 0) + (dashboardStats?.totalInstitutes || 0) + (dashboardStats?.totalClubs || 0),
          monthlyGrowth: dashboardStats?.monthlyGrowth || 0,
          revenue: dashboardStats?.revenue || 0,
          revenueGrowth: dashboardStats?.revenueGrowth || 0
        };
        
        setStats(statsData);
        setRecentUsers(users || []);
        setPendingEvents(pendingEventsData || recentEvents || []);
        
        dashboardCache.current = {
          timestamp: now,
          data: {
            stats: statsData,
            recentUsers: users || [],
            pendingEvents: pendingEventsData || recentEvents || []
          }
        };
        
        console.log('✅ Dashboard data loaded and cached successfully');
      } else {
        throw new Error(response?.message || 'Failed to fetch dashboard data');
      }
      
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      
      const errorMessage = err?.message || err?.toString() || 'Unknown error';
      
      if (errorMessage.includes('timeout')) {
        setError('Dashboard is taking too long to load. Please check if the backend server is running and try again.');
      } else if (errorMessage.includes('Network Error') || errorMessage.includes('fetch')) {
        setError('Cannot connect to server. Please ensure the backend is running on port 5000.');
      } else {
        setError(errorMessage || 'Failed to load dashboard data');
      }
      
      setStats({
        totalAthletes: 0,
        totalCoaches: 0,
        totalInstitutes: 0,
        totalClubs: 0,
        totalUsers: 0,
        totalEvents: 0,
        pendingEvents: 0,
        pendingApprovals: 0,
        activeUsers: 0,
        monthlyGrowth: 0
      });
      setRecentUsers([]);
      setPendingEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllEvents = useCallback(async (force = false) => {
    const filtersKey = JSON.stringify(eventFilters);
    const now = Date.now();
    
    if (!force && 
        allEventsCache.current.timestamp && 
        (now - allEventsCache.current.timestamp) < CACHE_DURATION &&
        allEventsCache.current.filters === filtersKey) {
      console.log('✅ Using cached events data');
      setAllEvents(allEventsCache.current.data);
      return;
    }

    try {
      setEventLoading(true);
      console.log('🔄 Fetching all events with filters:', eventFilters);
      
      const response = await getAdminEvents({
        page: 1,
        limit: 50,
        ...eventFilters
      });
      
      if (response.success) {
        const eventsData = response.data.events || [];
        setAllEvents(eventsData);
        
        allEventsCache.current = {
          timestamp: now,
          data: eventsData,
          filters: filtersKey
        };
        
        console.log('✅ All events loaded and cached successfully:', eventsData.length);
      } else {
        throw new Error(response.message || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('❌ Failed to fetch all events:', err);
      setAllEvents([]);
    } finally {
      setEventLoading(false);
    }
  }, [eventFilters]);

  // Initial data load
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchDashboardData();
    }
  }, [fetchDashboardData]);

  // Load all events when tab changes
  useEffect(() => {
    if (activeTab === 'all') {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }

      if (eventFilters.search) {
        console.log('⏱️ Debouncing search input...');
        searchDebounceTimer.current = setTimeout(() => {
          fetchAllEvents();
        }, 500);
      } else {
        fetchAllEvents();
      }
    }

    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, [activeTab, eventFilters, fetchAllEvents]);

  const handleModerateEvent = async (eventId, action, remarks = '') => {
    try {
      setActionModal(prev => ({ ...prev, loading: true }));
      setModeratingEventId(eventId);
      console.log(`🔄 ${action}ing event ${eventId} with remarks:`, remarks);
      
      const response = await moderateEvent(eventId, action, remarks);
      console.log('✅ Moderation response:', response);
      
      if (response.success) {
        console.log(`✅ Event ${action.toLowerCase()}d successfully`);
        
        if (action === 'APPROVE' || action === 'REJECT') {
          setPendingEvents(prev => prev.filter(event => event.id !== eventId));
        }
        
        if (activeTab === 'all') {
          setAllEvents(prev => prev.map(event => 
            event.id === eventId 
              ? { 
                  ...event, 
                  status: action === 'APPROVE' ? 'APPROVED' : 
                         action === 'REJECT' ? 'REJECTED' :
                         action === 'SUSPEND' ? 'SUSPENDED' :
                         action === 'RESTART' ? 'APPROVED' : event.status,
                  adminNotes: remarks || event.adminNotes
                }
              : event
          ));
        }
        
        if (action === 'APPROVE' || action === 'REJECT') {
          setStats(prev => ({
            ...prev,
            pendingEvents: Math.max(0, prev.pendingEvents - 1)
          }));
        }
        
        closeActionModal();
        
        const actionMessages = {
          APPROVE: 'approved',
          REJECT: 'rejected',
          SUSPEND: 'suspended',
          RESTART: 'restarted and reactivated'
        };
        
        showInfoModal(
          'Success',
          `Event ${actionMessages[action]} successfully!`,
          'success'
        );
      } else {
        throw new Error(response.message || `Failed to ${action.toLowerCase()} event`);
      }
    } catch (err) {
      console.error(`❌ Failed to ${action.toLowerCase()} event:`, err);
      
      let errorMessage = err.message || `Failed to ${action.toLowerCase()} event`;
      
      if (errorMessage.includes('not found')) {
        errorMessage = 'Event not found. It may have been deleted.';
      } else if (errorMessage.includes('Invalid action')) {
        errorMessage = 'Invalid action. Please try again.';
      } else if (errorMessage.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      closeActionModal();
      showInfoModal(
        'Error',
        `Failed to ${action.toLowerCase()} event: ${errorMessage}`,
        'error'
      );
    } finally {
      setModeratingEventId(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setEventFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRegistrationFilterChange = (key, value) => {
    setRegistrationFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getUserName = (user) => {
    if (!user) return 'Unknown User';
    // Check flattened name field first (from backend formatting)
    if (user.name && user.name !== 'Unknown') return user.name;
    // Then check nested profile objects
    if (user.studentProfile?.name) return user.studentProfile.name;
    if (user.coachProfile?.name) return user.coachProfile.name;
    if (user.instituteProfile?.name) return user.instituteProfile.name;
    if (user.clubProfile?.name) return user.clubProfile.name;
    if (user.adminProfile?.name) return user.adminProfile.name;
    return user.email || 'Unknown User';
  };

  // Filter recent users based on filters
  const getFilteredRecentUsers = () => {
    return recentUsers.filter(user => {
      const userName = getUserName(user);
      const matchesRole = !registrationFilters.role || user.role === registrationFilters.role;
      const matchesStatus = !registrationFilters.status || 
        (registrationFilters.status === 'active' && user.isActive && user.isVerified) ||
        (registrationFilters.status === 'pending' && (!user.isActive || !user.isVerified));
      const search = registrationFilters.search?.toLowerCase() || '';
      const matchesSearch = !search ||
        userName?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        (user.uniqueId && user.uniqueId.toLowerCase().includes(search));
      return matchesRole && matchesStatus && matchesSearch;
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      ACTIVE: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      SUSPENDED: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchDashboardData(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage users, view analytics, and monitor system health</p>
              {usingCachedData && (
                <div className="mt-2 inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 text-sm text-blue-700">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Loaded from cache (instant)
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <Link
                to="/admin/users"
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4V7a4 4 0 00-8 0v3m12 4a4 4 0 01-8 0m8 0a4 4 0 01-8 0" />
                </svg>
                All Users
              </Link>
              <Link
                to="/admin/event-results"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Event Results
              </Link>
              <Link
                to="/admin/orders"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Event Orders
              </Link>
              <Link
                to="/admin/revenue"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Revenue Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="👥"
            color="blue"
            growth={stats.monthlyGrowth}
            onClick={() => navigate('/admin/users')}
          />
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon="🎯"
            color="green"
            onClick={() => navigate('/admin/events')}
          />
          <StatCard
            title="Pending Events"
            value={stats.pendingEvents}
            icon="⏳"
            color="orange"
            urgent={stats.pendingEvents > 0}
            onClick={() => navigate('/admin/events?status=PENDING')}
          />
          <StatCard
            title="Revenue"
            value={typeof stats.revenue === 'number' ? `₹${stats.revenue.toLocaleString('en-IN')}` : '₹0'}
            icon="💰"
            color="red"
            growth={typeof stats.revenueGrowth === 'number' ? stats.revenueGrowth : undefined}
            onClick={() => navigate('/admin/revenue')}
          />
        </div>

        {/* Secondary Stats - Navigate to separate pages */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Athletes"
            value={stats.totalAthletes}
            icon="🏃"
            color="indigo"
            onClick={() => navigate('/admin/users?role=STUDENT')}
          />
          <StatCard
            title="Coaches"
            value={stats.totalCoaches}
            icon="🏆"
            color="purple"
            onClick={() => navigate('/admin/users?role=COACH')}
          />
          <StatCard
            title="Institutes"
            value={stats.totalInstitutes}
            icon="🏫"
            color="pink"
            onClick={() => navigate('/admin/users?role=INSTITUTE')}
          />
          <StatCard
            title="Clubs"
            value={stats.totalClubs}
            icon="🏟️"
            color="teal"
            onClick={() => navigate('/admin/users?role=CLUB')}
          />
        </div>

        {/* All Events Button */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Events Management</h3>
              <p className="text-gray-600">View and manage all events, issue certificates</p>
            </div>
            <Link
              to="/admin/events"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md flex items-center space-x-2"
            >
              <span>📅</span>
              <span>All Events</span>
            </Link>
          </div>
        </div>

        {/* Pending Events Section */}
        {pendingEvents.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Events Pending Approval</h3>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                {pendingEvents.length} Requires Action
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Event</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Sport</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Coach</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEvents.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{event.name}</div>
                          <div className="text-sm text-gray-500">
                            Max: {event.maxParticipants} participants
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {event.sport}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{event.coach?.name}</div>
                          <div className="text-sm text-gray-500">{event.coach?.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(event.startDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900">{event.venue}</div>
                        <div className="text-sm text-gray-500">{event.city}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-1 items-center">
                          <button
                            onClick={() => showActionModal('approve', event.id, event.name)}
                            disabled={moderatingEventId === event.id}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 h-6"
                          >
                            {moderatingEventId === event.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => showActionModal('reject', event.id, event.name)}
                            disabled={moderatingEventId === event.id}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50 h-6"
                          >
                            {moderatingEventId === event.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Users Section */}
        <div ref={recentRegistrationsRef} className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Recent Registrations ({getFilteredRecentUsers().length})</h3>
            <button
              onClick={() => fetchDashboardData(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Registration Filter Bar */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={registrationFilters.role}
                  onChange={(e) => handleRegistrationFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="ATHLETE">Athletes</option>
                  <option value="COACH">Coaches</option>
                  <option value="INSTITUTE">Institutes</option>
                  <option value="CLUB">Clubs</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={registrationFilters.status}
                  onChange={(e) => handleRegistrationFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search by name, email or uid..."
                  value={registrationFilters.search}
                  onChange={(e) => handleRegistrationFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setRegistrationFilters({ role: '', status: '', search: '' })}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          
          {getFilteredRecentUsers().length > 0 ? (
            <UserTable users={getFilteredRecentUsers()} getUserName={getUserName} showDetailModal={showDetailModal} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              {Object.values(registrationFilters).some(filter => filter) ? (
                <div>
                  <div className="text-4xl mb-4">🔍</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h4>
                  <p>No users match your current filters.</p>
                  <button
                    onClick={() => setRegistrationFilters({ role: '', status: '', search: '' })}
                    className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters to see all users
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-4">👥</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Recent Users</h4>
                  <p>No recent user registrations found.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        <InfoModal
          isOpen={infoModal.isOpen}
          onClose={closeInfoModal}
          title={infoModal.title}
          content={infoModal.content}
          type={infoModal.type}
          data={infoModal.data}
        />
        <DetailModal
          isOpen={detailModal.isOpen}
          onClose={closeDetailModal}
          type={detailModal.type}
          data={detailModal.data}
          title={detailModal.title}
        />
        <ActionModal
          isOpen={actionModal.isOpen}
          onClose={closeActionModal}
          onConfirm={(remarks) => handleModerateEvent(actionModal.eventId, actionModal.type.toUpperCase(), remarks)}
          type={actionModal.type}
          eventName={actionModal.eventName}
          loading={actionModal.loading}
        />
        <ParticipantsModal
          isOpen={participantsModal.isOpen}
          onClose={closeParticipantsModal}
          eventData={participantsModal.eventData}
          participants={participantsModal.participants}
          loading={participantsModal.loading}
        />
      </div>
    </div>
  );
}

// User Table Component
const UserTable = ({ users, getUserName, showDetailModal }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
          <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
          <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
          <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
          <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
          <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4">
              <Link to={`/admin/users/${user.uniqueId}`} className="group">
                <div className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors">{getUserName(user)}</div>
                {user.uniqueId && (
                  <div className="text-xs text-blue-600 font-mono font-medium mt-1 group-hover:text-blue-700">UID: {user.uniqueId}</div>
                )}
              </Link>
            </td>
            <td className="py-3 px-4">
              <Link to={`/admin/users/${user.uniqueId}`} className="text-gray-600 hover:text-blue-600 transition-colors">
                {user.email}
              </Link>
            </td>
            <td className="py-3 px-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </td>
            <td className="py-3 px-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.isActive && user.isVerified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.isActive && user.isVerified ? 'Active' : 'Pending'}
              </span>
            </td>
            <td className="py-3 px-4 text-gray-600">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td className="py-3 px-4">
              <div className="flex space-x-1 items-center">
                <button
                  onClick={() => {
                    showDetailModal('user', user, `User Details: ${getUserName(user)}`);
                  }}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors h-6"
                >
                  View
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Helper component for stat cards
const StatCard = ({ title, value, icon, color, growth, urgent, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    indigo: 'bg-indigo-500',
    pink: 'bg-pink-500',
    red: 'bg-red-500',
    teal: 'bg-teal-500'
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-lg p-6 ${urgent ? 'border-l-4 border-orange-500' : ''} ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow duration-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {growth !== undefined && (
            <p className={`text-sm mt-1 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth >= 0 ? '+' : ''}{growth}% this month
            </p>
          )}
          {urgent && (
            <p className="text-sm mt-1 text-orange-600 font-medium">Requires attention</p>
          )}
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Helper function for role colors
const getRoleColor = (role) => {
  const colors = {
    ATHLETE: 'bg-blue-100 text-blue-800 border border-blue-300',
    COACH: 'bg-green-100 text-green-800 border border-green-300',
    INSTITUTE: 'bg-purple-100 text-purple-800 border border-purple-300',
    CLUB: 'bg-orange-100 text-orange-800 border border-orange-300',
    ADMIN: 'bg-red-100 text-red-800 border border-red-300'
  };
  return colors[role] || 'bg-gray-100 text-gray-800 border border-gray-300';
};