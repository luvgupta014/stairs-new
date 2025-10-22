import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard, moderateEvent, getAdminEvents, getEventRegistrations } from '../api';
import InfoModal from '../components/InfoModal';
import DetailModal from '../components/DetailModal';
import ActionModal from '../components/ActionModal';
import ParticipantsModal from '../components/ParticipantsModal';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
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
  
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [error, setError] = useState('');
  const [moderatingEventId, setModeratingEventId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
  const [eventFilters, setEventFilters] = useState({
    status: '',
    sport: '',
    search: ''
  });
  const [eventLoading, setEventLoading] = useState(false);

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

  // New state variables for filters
  const [recentUsersFilters, setRecentUsersFilters] = useState({
    role: '',
    status: '',
    search: ''
  });
  const [pendingEventsFilters, setPendingEventsFilters] = useState({
    sport: '',
    search: '',
    dateRange: ''
  });

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
      
      const response = await getEventRegistrations(event.id);
      
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllEvents();
    }
  }, [activeTab, eventFilters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Fetching admin dashboard data...');
      
      const dashboardResponse = await getAdminDashboard();
      
      if (dashboardResponse.success) {
        const { stats: dashboardStats, recentUsers: users, recentEvents, pendingEvents: pendingEventsData } = dashboardResponse.data;
        
        setStats({
          totalStudents: dashboardStats.totalStudents || 0,
          totalCoaches: dashboardStats.totalCoaches || 0,
          totalInstitutes: dashboardStats.totalInstitutes || 0,
          totalClubs: dashboardStats.totalClubs || 0,
          totalUsers: dashboardStats.totalUsers || 0,
          totalEvents: dashboardStats.totalEvents || 0,
          pendingEvents: dashboardStats.pendingEvents || 0,
          pendingApprovals: (dashboardStats.pendingCoachApprovals || 0) + (dashboardStats.pendingInstituteApprovals || 0),
          activeUsers: dashboardStats.totalStudents + dashboardStats.totalCoaches + dashboardStats.totalInstitutes + dashboardStats.totalClubs || 0,
          monthlyGrowth: dashboardStats.monthlyGrowth || 0
        });
        
        setRecentUsers(users || []);
        setPendingEvents(pendingEventsData || recentEvents || []);
        
        console.log('✅ Dashboard data loaded successfully');
        console.log('📊 Pending events for approval:', pendingEventsData?.length || recentEvents?.length || 0);
      } else {
        throw new Error(dashboardResponse.message || 'Failed to fetch dashboard data');
      }
      
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      // Set default values on error
      setStats({
        totalStudents: 0,
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
  };

  const fetchAllEvents = async () => {
    try {
      setEventLoading(true);
      console.log('🔄 Fetching all events...');
      
      const response = await getAdminEvents({
        page: 1,
        limit: 50,
        ...eventFilters
      });
      
      if (response.success) {
        setAllEvents(response.data.events || []);
        console.log('✅ All events loaded successfully:', response.data.events?.length || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('❌ Failed to fetch all events:', err);
      setAllEvents([]);
    } finally {
      setEventLoading(false);
    }
  };

  // Update the handleModerateEvent function with better error handling
  const handleModerateEvent = async (eventId, action, remarks = '') => {
    try {
      setActionModal(prev => ({ ...prev, loading: true }));
      setModeratingEventId(eventId);
      console.log(`🔄 ${action}ing event ${eventId} with remarks:`, remarks);
      
      const response = await moderateEvent(eventId, action, remarks);
      console.log('✅ Moderation response:', response);
      
      if (response.success) {
        console.log(`✅ Event ${action.toLowerCase()}d successfully`);
        
        // Remove the event from pending list if it was pending
        if (action === 'APPROVE' || action === 'REJECT') {
          setPendingEvents(prev => prev.filter(event => event.id !== eventId));
        }
        
        // Update the event in all events list if it's loaded
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
        
        // Update stats only for pending events
        if (action === 'APPROVE' || action === 'REJECT') {
          setStats(prev => ({
            ...prev,
            pendingEvents: Math.max(0, prev.pendingEvents - 1)
          }));
        }
        
        // Close action modal and show success message
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
      console.error('Full error object:', err);
      
      // More user-friendly error message
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

  // New filter change handlers
  const handleRecentUsersFilterChange = (key, value) => {
    setRecentUsersFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePendingEventsFilterChange = (key, value) => {
    setPendingEventsFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Filtered data functions
  const getFilteredRecentUsers = () => {
    return recentUsers.filter(user => {
      const matchesRole = !recentUsersFilters.role || user.role === recentUsersFilters.role;
      const matchesStatus = !recentUsersFilters.status || 
        (recentUsersFilters.status === 'active' && user.isActive && user.isVerified) ||
        (recentUsersFilters.status === 'pending' && (!user.isActive || !user.isVerified));
      const matchesSearch = !recentUsersFilters.search || 
        user.name.toLowerCase().includes(recentUsersFilters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(recentUsersFilters.search.toLowerCase());
      
      return matchesRole && matchesStatus && matchesSearch;
    });
  };

  const getFilteredPendingEvents = () => {
    return pendingEvents.filter(event => {
      const matchesSport = !pendingEventsFilters.sport || event.sport === pendingEventsFilters.sport;
      const matchesSearch = !pendingEventsFilters.search || 
        event.name.toLowerCase().includes(pendingEventsFilters.search.toLowerCase()) ||
        event.venue?.toLowerCase().includes(pendingEventsFilters.search.toLowerCase()) ||
        event.city?.toLowerCase().includes(pendingEventsFilters.search.toLowerCase());
      
      let matchesDateRange = true;
      if (pendingEventsFilters.dateRange) {
        const eventDate = new Date(event.startDate);
        const now = new Date();
        
        switch (pendingEventsFilters.dateRange) {
          case 'today':
            matchesDateRange = eventDate.toDateString() === now.toDateString();
            break;
          case 'this_week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            matchesDateRange = eventDate >= weekStart && eventDate < weekEnd;
            break;
          case 'next_week':
            const nextWeekStart = new Date(now);
            nextWeekStart.setDate(now.getDate() + (7 - now.getDay()));
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
            matchesDateRange = eventDate >= nextWeekStart && eventDate < nextWeekEnd;
            break;
          case 'this_month':
            matchesDateRange = eventDate.getMonth() === now.getMonth() && 
                             eventDate.getFullYear() === now.getFullYear();
            break;
        }
      }
      
      return matchesSport && matchesSearch && matchesDateRange;
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
            onClick={fetchDashboardData}
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
            </div>
            <div className="flex space-x-3">
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
          />
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon="🎯"
            color="green"
          />
          <StatCard
            title="Pending Events"
            value={stats.pendingEvents}
            icon="⏳"
            color="orange"
            urgent={stats.pendingEvents > 0}
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon="👤"
            color="red"
            urgent={stats.pendingApprovals > 0}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Students"
            value={stats.totalStudents}
            icon="🎓"
            color="indigo"
          />
          <StatCard
            title="Coaches"
            value={stats.totalCoaches}
            icon="🏆"
            color="purple"
          />
          <StatCard
            title="Institutes"
            value={stats.totalInstitutes}
            icon="🏫"
            color="pink"
          />
          <StatCard
            title="Clubs"
            value={stats.totalClubs}
            icon="🏟️"
            color="teal"
          />
        </div>

        {/* Events Management Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Event Management</h3>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({pendingEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Events ({stats.totalEvents})
              </button>
            </div>
          </div>

          {/* Filters for All Events */}
          {activeTab === 'all' && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={eventFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                <select
                  value={eventFilters.sport}
                  onChange={(e) => handleFilterChange('sport', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sports</option>
                  <option value="Football">Football</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Athletics">Athletics</option>
                  <option value="Swimming">Swimming</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={eventFilters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Events Table */}
          {activeTab === 'pending' && pendingEvents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Events Pending Approval ({getFilteredPendingEvents().length})
                </h4>
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  Requires Action
                </span>
              </div>
              
              {/* ADDED: Pending Events Filter Bar */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                    <select
                      value={pendingEventsFilters.sport}
                      onChange={(e) => handlePendingEventsFilterChange('sport', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">All Sports</option>
                      <option value="Football">Football</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Tennis">Tennis</option>
                      <option value="Cricket">Cricket</option>
                      <option value="Athletics">Athletics</option>
                      <option value="Swimming">Swimming</option>
                      <option value="Badminton">Badminton</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <select
                      value={pendingEventsFilters.dateRange}
                      onChange={(e) => handlePendingEventsFilterChange('dateRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">All Dates</option>
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="next_week">Next Week</option>
                      <option value="this_month">This Month</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={pendingEventsFilters.search}
                      onChange={(e) => handlePendingEventsFilterChange('search', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => setPendingEventsFilters({ sport: '', search: '', dateRange: '' })}
                      className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
              
              {getFilteredPendingEvents().length > 0 ? (
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
                      {getFilteredPendingEvents().map((event) => (
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
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {Object.values(pendingEventsFilters).some(filter => filter) ? (
                    <div>
                      <div className="text-4xl mb-4">🔍</div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h4>
                      <p>No pending events match your current filters.</p>
                      <button
                        onClick={() => setPendingEventsFilters({ sport: '', search: '', dateRange: '' })}
                        className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear filters to see all pending events
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-4">🎉</div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Pending Events</h4>
                      <p>All events have been reviewed. Great job!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* All Events Tab */}
          {activeTab === 'all' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  All Events ({allEvents.length})
                </h4>
                <button
                  onClick={fetchAllEvents}
                  disabled={eventLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {eventLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {eventLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading events...</p>
                </div>
              ) : allEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Event</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Sport</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Coach</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allEvents.map((event) => (
                        <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{event.name || event.title}</div>
                              <div className="text-sm text-gray-500">
                                Max: {event.maxParticipants} participants
                              </div>
                              <div className="text-sm text-gray-500">
                                Created: {new Date(event.createdAt).toLocaleDateString()}
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
                              <div className="font-medium text-gray-900">{event.organizer?.name || event.coach?.name}</div>
                              <div className="text-sm text-gray-500">{event.organizer?.email || event.coach?.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(event.startDate).toLocaleDateString()}
                            {event.endDate && (
                              <div className="text-sm text-gray-500">
                                to {new Date(event.endDate).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-900">{event.location || event.venue}</div>
                            <div className="text-sm text-gray-500">{event.city}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                              {event.status}
                            </span>
                            {event.adminNotes && (
                              <div className="text-xs text-gray-500 mt-1">
                                Notes: {event.adminNotes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-1 items-center flex-wrap gap-1">
                              {event.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => showActionModal('approve', event.id, event.name || event.title)}
                                    disabled={moderatingEventId === event.id}
                                    className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 h-6"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => showActionModal('reject', event.id, event.name || event.title)}
                                    disabled={moderatingEventId === event.id}
                                    className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50 h-6"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              
                              {event.status === 'APPROVED' && (
                                <button
                                  onClick={() => showActionModal('suspend', event.id, event.name || event.title)}
                                  disabled={moderatingEventId === event.id}
                                  className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 h-6"
                                >
                                  {moderatingEventId === event.id ? 'Processing...' : 'Suspend'}
                                </button>
                              )}
                              
                              {(event.status === 'SUSPENDED' || event.status === 'REJECTED') && (
                                <button
                                  onClick={() => showActionModal('restart', event.id, event.name || event.title)}
                                  disabled={moderatingEventId === event.id}
                                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 h-6"
                                >
                                  {moderatingEventId === event.id ? 'Processing...' : 'Restart'}
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  showDetailModal('event', event, `Event Details: ${event.name || event.title}`);
                                }}
                                className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-gray-700 transition-colors h-6"
                              >
                                View
                              </button>
                              
                              <button
                                onClick={() => handleViewEventRegistrations(event)}
                                className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-purple-700 transition-colors h-6"
                              >
                                Participants ({event.currentParticipants || 0})
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No events found
                </div>
              )}
            </div>
          )}

          {/* Empty States */}
          {activeTab === 'pending' && pendingEvents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🎉</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Pending Events</h4>
              <p>All events have been reviewed. Great job!</p>
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Recent Registrations ({getFilteredRecentUsers().length})</h3>
            <button
              onClick={fetchDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* ADDED: Recent Users Filter Bar */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={recentUsersFilters.role}
                  onChange={(e) => handleRecentUsersFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="COACH">Coaches</option>
                  <option value="INSTITUTE">Institutes</option>
                  <option value="CLUB">Clubs</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={recentUsersFilters.status}
                  onChange={(e) => handleRecentUsersFilterChange('status', e.target.value)}
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
                  placeholder="Search users..."
                  value={recentUsersFilters.search}
                  onChange={(e) => handleRecentUsersFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setRecentUsersFilters({ role: '', status: '', search: '' })}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          
          {getFilteredRecentUsers().length > 0 ? (
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
                  {getFilteredRecentUsers().map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{user.name}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
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
                              showDetailModal('user', user, `User Details: ${user.name}`);
                            }}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors h-6"
                          >
                            View
                          </button>
                          {!user.isActive && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to activate ${user.name}?`)) {
                                  // TODO: Implement user activation
                                  showInfoModal(
                                    'Coming Soon', 
                                    'User activation functionality will be implemented in a future update.',
                                    'info'
                                  );
                                }
                              }}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors h-6"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {Object.values(recentUsersFilters).some(filter => filter) ? (
                <div>
                  <div className="text-4xl mb-4">🔍</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h4>
                  <p>No users match your current filters.</p>
                  <button
                    onClick={() => setRecentUsersFilters({ role: '', status: '', search: '' })}
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
  );
};

// Helper component for stat cards
const StatCard = ({ title, value, icon, color, growth, urgent }) => {
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
    <div className={`bg-white rounded-xl shadow-lg p-6 ${urgent ? 'border-l-4 border-orange-500' : ''}`}>
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
    STUDENT: 'bg-blue-100 text-blue-800',
    COACH: 'bg-purple-100 text-purple-800',
    INSTITUTE: 'bg-indigo-100 text-indigo-800',
    CLUB: 'bg-pink-100 text-pink-800',
    ADMIN: 'bg-red-100 text-red-800'
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
};

export default AdminDashboard;