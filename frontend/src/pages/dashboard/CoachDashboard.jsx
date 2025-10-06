import { useState, useEffect } from 'react';
import { getCoachDashboard } from '../../api';
import StudentCard from '../../components/StudentCard';
import Spinner from '../../components/Spinner';
import { Link } from 'react-router-dom';

const CoachDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await getCoachDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Using mock data for demo
      setDashboardData({
        coach: {
          name: 'Mike Johnson',
          specialization: 'Football Training',
          studentsCount: 24,
          eventsCreated: 12,
          rating: 4.8,
          totalRevenue: 45000,
          joinedDate: '2024-01-15'
        },
        students: [
          {
            id: 1,
            name: 'John Doe',
            sport: 'Football',
            level: 'Intermediate',
            location: 'New York',
            achievements: ['Regional Champion', 'Team Captain'],
            joinedDate: '2024-03-01',
            performance: 85
          },
          {
            id: 2,
            name: 'Jane Smith',
            sport: 'Football',
            level: 'Advanced',
            location: 'Brooklyn',
            achievements: ['State Qualifier', 'MVP'],
            joinedDate: '2024-02-15',
            performance: 92
          },
          {
            id: 3,
            name: 'Alex Johnson',
            sport: 'Football',
            level: 'Beginner',
            location: 'Queens',
            achievements: ['Best Improvement'],
            joinedDate: '2024-04-01',
            performance: 78
          }
        ],
        recentEvents: [
          { id: 1, name: 'Youth Championship', date: '2025-12-15', participants: 24, status: 'upcoming' },
          { id: 2, name: 'Skills Development Camp', date: '2025-11-20', participants: 18, status: 'completed' },
          { id: 3, name: 'Weekend Training', date: '2025-10-30', participants: 15, status: 'ongoing' }
        ],
        notifications: [
          { id: 1, type: 'student', message: 'New student request from Sarah Wilson', time: '2 hours ago' },
          { id: 2, type: 'event', message: 'Youth Championship registration deadline tomorrow', time: '5 hours ago' },
          { id: 3, type: 'payment', message: 'Monthly payment received from 3 students', time: '1 day ago' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

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
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, Coach {dashboardData?.coach?.name || 'Coach'}!
              </h1>
              <p className="text-green-100 text-lg">
                {dashboardData?.coach?.specialization || 'Sports Training'} • Member since {new Date(dashboardData?.coach?.joinedDate).getFullYear()}
              </p>
            </div>
            <div className="hidden md:flex space-x-4">
              <Link
                to="/coach/event/create"
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Create Event
              </Link>
              <Link
                to="/coach/bulk-upload"
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-400 transition-colors"
              >
                Add Students
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.coach?.studentsCount || 0}</p>
                <p className="text-sm text-green-600 mt-1">↗ +3 this month</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Events Created</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.coach?.eventsCreated || 0}</p>
                <p className="text-sm text-green-600 mt-1">↗ +2 this month</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.coach?.rating || 0}</p>
                <div className="flex items-center mt-1">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">Based on 45 reviews</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₹{(dashboardData?.coach?.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">↗ +12% this month</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
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
                { id: 'students', name: 'Students', icon: '👥' },
                { id: 'events', name: 'Events', icon: '📅' },
                { id: 'analytics', name: 'Analytics', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
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
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'student' ? 'bg-blue-500' :
                          notification.type === 'event' ? 'bg-green-500' : 'bg-purple-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      to="/coach/event/create"
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-medium text-center block transition-colors"
                    >
                      🎯 Create New Event
                    </Link>
                    <Link
                      to="/coach/bulk-upload"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium text-center block transition-colors"
                    >
                      📥 Add Students (Bulk)
                    </Link>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                      💬 Send Message to All
                    </button>
                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                      📋 Schedule Training
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Students ({dashboardData?.students?.length || 0})</h3>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Search students..."
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                      <option>All Levels</option>
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                </div>

                {dashboardData?.students?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData.students.map(student => (
                      <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{student.name}</h4>
                            <p className="text-sm text-gray-600">{student.sport} • {student.level}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Performance</span>
                            <span className="font-medium">{student.performance}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${student.performance}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                            View Profile
                          </button>
                          <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                            Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-4xl">👥</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Yet</h3>
                    <p className="text-gray-600 mb-6">Students will appear here when they connect with you.</p>
                    <Link
                      to="/coach/bulk-upload"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      Add Students
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Events</h3>
                  <Link
                    to="/coach/event/create"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Create Event
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData?.recentEvents?.map(event => (
                    <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-semibold text-gray-900">{event.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          event.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">📅 {new Date(event.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">👥 {event.participants} participants</p>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                          Manage
                        </button>
                        <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                          View
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
                  <h4 className="font-semibold text-gray-900 mb-4">Student Performance Trends</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">📊 Performance Chart (Chart.js integration)</p>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Revenue Analytics</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">💰 Revenue Chart (Chart.js integration)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;