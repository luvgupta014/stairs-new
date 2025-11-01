import { useState, useEffect } from 'react';
import { getClubDashboard, getClubMembers } from '../../api';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';

const ClubDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadDashboardData();
    loadMembers();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await getClubDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Using mock data for demo
      setDashboardData({
        club: {
          name: 'Metro Athletic Club',
          type: 'Sports Club',
          location: 'New York, NY',
          established: '2018',
          membersCount: 156,
          activeEvents: 8,
          facilities: ['Swimming Pool', 'Tennis Courts', 'Gym', 'Basketball Court'],
          membershipTypes: ['Basic', 'Premium', 'VIP'],
          revenue: 45000,
          monthlyGrowth: 8
        },
        events: [
          {
            id: 1,
            name: 'Summer Tennis Tournament',
            date: '2024-12-20',
            participants: 32,
            status: 'upcoming',
            category: 'Competition'
          },
          {
            id: 2,
            name: 'Fitness Challenge',
            date: '2024-12-10',
            participants: 45,
            status: 'ongoing',
            category: 'Fitness'
          },
          {
            id: 3,
            name: 'Swimming Lessons',
            date: '2024-11-15',
            participants: 20,
            status: 'completed',
            category: 'Training'
          }
        ],
        recentActivity: [
          {
            id: 1,
            type: 'member_joined',
            message: 'Sarah Johnson joined as a Premium member',
            time: '2 hours ago',
            user: 'Sarah Johnson'
          },
          {
            id: 2,
            type: 'event_registration',
            message: '5 new registrations for Summer Tennis Tournament',
            time: '4 hours ago',
            event: 'Summer Tennis Tournament'
          },
          {
            id: 3,
            type: 'payment',
            message: 'Monthly membership payment received from 12 members',
            time: '1 day ago',
            amount: '$2,400'
          }
        ],
        analytics: {
          totalRevenue: 45000,
          monthlyGrowth: 8,
          activeMembers: 142,
          newMembersThisMonth: 15,
          eventAttendance: 89,
          facilityUtilization: 76
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const membersData = await getClubMembers();
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to load members:', error);
      // Using mock data for demo
      setMembers([
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          membershipType: 'Premium',
          joinedDate: '2024-01-15',
          status: 'active',
          sports: ['Tennis', 'Swimming'],
          lastActivity: '2024-11-15',
          phone: '+1 234-567-8900'
        },
        {
          id: 2,
          name: 'Sarah Williams',
          email: 'sarah@example.com',
          membershipType: 'VIP',
          joinedDate: '2024-02-20',
          status: 'active',
          sports: ['Basketball', 'Gym'],
          lastActivity: '2024-11-16',
          phone: '+1 234-567-8901'
        },
        {
          id: 3,
          name: 'Mike Chen',
          email: 'mike@example.com',
          membershipType: 'Basic',
          joinedDate: '2024-03-10',
          status: 'inactive',
          sports: ['Swimming'],
          lastActivity: '2024-10-20',
          phone: '+1 234-567-8902'
        }
      ]);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;

    try {
      // In real implementation, this would send an invitation
      console.log('Inviting member:', inviteEmail);
      setInviteEmail('');
      setInviteModal(false);
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const filteredMembers = (Array.isArray(members) ? members : []).filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">
                {dashboardData?.club?.name || 'Club Dashboard'}
              </h1>
              <p className="text-emerald-100 text-lg">
                {dashboardData?.club?.type || 'Sports Club'} • {dashboardData?.club?.location || 'Location'}
              </p>
              <div className="mt-3 flex items-center space-x-4">
                <span className="bg-emerald-500 px-3 py-1 rounded-full text-sm">
                  👥 {dashboardData?.club?.membersCount || 0} Members
                </span>
                <span className="bg-emerald-500 px-3 py-1 rounded-full text-sm">
                  🏆 {dashboardData?.club?.activeEvents || 0} Events
                </span>
                <span className="bg-emerald-500 px-3 py-1 rounded-full text-sm">
                  🏢 {dashboardData?.club?.facilities?.length || 0} Facilities
                </span>
              </div>
            </div>
            <div className="hidden md:flex space-x-4">
              <button
                onClick={() => setInviteModal(true)}
                className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Invite Members
              </button>
              <button className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-400 transition-colors">
                Create Event
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => setActiveTab('members')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.club?.membersCount || 0}</p>
                <p className="text-sm text-emerald-600 mt-1">+{dashboardData?.analytics?.newMembersThisMonth || 0} this month</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => setActiveTab('analytics')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${(dashboardData?.analytics?.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-sm text-blue-600 mt-1">+{dashboardData?.analytics?.monthlyGrowth || 0}% growth</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => setActiveTab('events')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Event Attendance</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.analytics?.eventAttendance || 0}%</p>
                <p className="text-sm text-purple-600 mt-1">Average rate</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => setActiveTab('facilities')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Facility Usage</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.analytics?.facilityUtilization || 0}%</p>
                <p className="text-sm text-yellow-600 mt-1">Utilization rate</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'members', name: 'Members', icon: '👥' },
                { id: 'events', name: 'Events', icon: '🏆' },
                { id: 'facilities', name: 'Facilities', icon: '🏢' },
                { id: 'analytics', name: 'Analytics', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
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
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4 mb-8">
                    {dashboardData?.recentActivity?.map(activity => (
                      <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                          activity.type === 'member_joined' ? 'bg-emerald-500' :
                          activity.type === 'event_registration' ? 'bg-blue-500' :
                          activity.type === 'payment' ? 'bg-green-500' : 'bg-gray-500'
                        }`}>
                          {activity.type === 'member_joined' ? '👥' :
                           activity.type === 'event_registration' ? '🏆' :
                           activity.type === 'payment' ? '💰' : '📋'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                  <div className="space-y-3">
                    {dashboardData?.events?.filter(event => event.status === 'upcoming').map(event => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{event.name}</h4>
                          <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">
                            {event.category}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">{event.participants} participants</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3 mb-8">
                    <button
                      onClick={() => setInviteModal(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      👥 Invite Members
                    </button>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                      🏆 Create Event
                    </button>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                      📊 View Reports
                    </button>
                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                      💰 Billing
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Club Facilities</h3>
                  <div className="space-y-2">
                    {dashboardData?.club?.facilities?.map((facility, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{facility}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Available
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Member Management ({filteredMembers.length})
                  </h3>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <button
                      onClick={() => setInviteModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Invite Member
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMembers.map(member => (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Membership</span>
                          <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                            member.membershipType === 'VIP' ? 'bg-purple-100 text-purple-800' :
                            member.membershipType === 'Premium' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.membershipType}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status</span>
                          <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                            member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {member.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Joined</span>
                          <span className="font-medium">{new Date(member.joinedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Sports: </span>
                          <span className="font-medium">{member.sports.join(', ')}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded text-sm hover:bg-emerald-700 transition-colors">
                          View Profile
                        </button>
                        <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                          Contact
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Event Management</h3>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium">
                    Create Event
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData?.events?.map(event => (
                    <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-semibold text-gray-900">{event.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          event.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">📅 {new Date(event.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">👥 {event.participants} participants</p>
                        <p className="text-sm text-gray-600">🏷️ {event.category}</p>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded text-sm hover:bg-emerald-700 transition-colors">
                          View Details
                        </button>
                        <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'facilities' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Facility Management</h3>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium">
                    Add Facility
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData?.club?.facilities?.map((facility, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">{facility}</h4>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Available
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Utilization</span>
                          <span className="font-medium">{Math.floor(Math.random() * 40) + 60}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Bookings Today</span>
                          <span className="font-medium">{Math.floor(Math.random() * 10) + 5}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full" 
                            style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded text-sm hover:bg-emerald-700 transition-colors">
                          View Schedule
                        </button>
                        <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                          Settings
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-6">Performance Metrics</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Member Retention</span>
                        <span className="text-sm text-gray-600">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Revenue Growth</span>
                        <span className="text-sm text-gray-600">{dashboardData?.analytics?.monthlyGrowth}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${dashboardData?.analytics?.monthlyGrowth}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Facility Utilization</span>
                        <span className="text-sm text-gray-600">{dashboardData?.analytics?.facilityUtilization}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${dashboardData?.analytics?.facilityUtilization}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-6">Member Analytics</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">📊 Member Analytics Chart (Chart.js integration)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Members Modal */}
      <Modal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        title="Invite New Member"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter member's email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Membership Type
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
              {dashboardData?.club?.membershipTypes?.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg">
            <h4 className="font-medium text-emerald-900 mb-2">Invitation Details:</h4>
            <ul className="text-sm text-emerald-800 space-y-1">
              <li>• Member will receive an email invitation</li>
              <li>• They can choose their preferred sports/activities</li>
              <li>• Access to all club facilities included</li>
              <li>• Welcome orientation will be scheduled</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setInviteModal(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleInviteMember}
              disabled={!inviteEmail}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Invitation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClubDashboard;