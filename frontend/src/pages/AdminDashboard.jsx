import React, { useState, useEffect } from 'react';
import { getAdminDashboard, moderateEvent } from '../api';

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
  const [error, setError] = useState('');
  const [moderatingEventId, setModeratingEventId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const handleModerateEvent = async (eventId, action, remarks = '') => {
    try {
      setModeratingEventId(eventId);
      console.log(`🔄 ${action}ing event ${eventId}...`);
      
      const response = await moderateEvent(eventId, action, remarks);
      
      if (response.success) {
        console.log(`✅ Event ${action.toLowerCase()}d successfully`);
        
        // Remove the event from pending list
        setPendingEvents(prev => prev.filter(event => event.id !== eventId));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          pendingEvents: Math.max(0, prev.pendingEvents - 1)
        }));
        
        // Show success message (you can use a toast library here)
        alert(`Event ${action.toLowerCase()}d successfully!`);
      } else {
        throw new Error(response.message || `Failed to ${action.toLowerCase()} event`);
      }
    } catch (err) {
      console.error(`❌ Failed to ${action.toLowerCase()} event:`, err);
      alert(`Failed to ${action.toLowerCase()} event: ${err.message}`);
    } finally {
      setModeratingEventId(null);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, view analytics, and monitor system health</p>
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

        {/* ADDED: Pending Events for Approval */}
        {pendingEvents.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Events Pending Approval ({pendingEvents.length})
              </h3>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                Requires Action
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
                          {/* Removed fee display */}
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
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleModerateEvent(event.id, 'APPROVE')}
                            disabled={moderatingEventId === event.id}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {moderatingEventId === event.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => {
                              const remarks = prompt('Enter rejection reason (optional):');
                              if (remarks !== null) {
                                handleModerateEvent(event.id, 'REJECT', remarks);
                              }
                            }}
                            disabled={moderatingEventId === event.id}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Reject
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

        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Registrations</h3>
          
          {recentUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent users found
            </div>
          )}
        </div>
      </div>
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