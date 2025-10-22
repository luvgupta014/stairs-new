import { useState, useEffect } from 'react';
import { getCoachDashboard, getCoachEvents, updateEvent, deleteEvent, getEventRegistrations } from '../../api';
import StudentCard from '../../components/StudentCard';
import Spinner from '../../components/Spinner';
import CoachParticipantsModal from '../../components/CoachParticipantsModal';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaCreditCard, FaCheckCircle, FaEdit, FaTrash, FaEye, FaUsers, FaCalendar, FaMapMarkerAlt } from 'react-icons/fa';

const CoachDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [coachEvents, setCoachEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventFilters, setEventFilters] = useState({
    status: '',
    sport: '',
    search: ''
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Participants modal state
  const [participantsModal, setParticipantsModal] = useState({
    isOpen: false,
    eventData: null,
    participants: [],
    loading: false
  });
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
    
    // Check if redirected from payment success
    if (location.state?.paymentSuccess) {
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 5000);
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === 'events') {
      loadCoachEvents();
    }
  }, [activeTab, eventFilters]);

  const loadDashboardData = async () => {
    try {
      const response = await getCoachDashboard();
      console.log('Dashboard response:', response);
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Using mock data for demo when API fails
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

  const loadCoachEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await getCoachEvents({
        page: 1,
        limit: 50,
        ...eventFilters
      });
      
      if (response.success) {
        setCoachEvents(response.data.events || []);
      } else {
        throw new Error(response.message || 'Failed to load events');
      }
    } catch (error) {
      console.error('Failed to load coach events:', error);
      setCoachEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setEventFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      ACTIVE: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      COMPLETED: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: '⏳',
      APPROVED: '✅',
      REJECTED: '❌',
      ACTIVE: '🔵',
      CANCELLED: '⚫',
      COMPLETED: '🎉'
    };
    return icons[status] || '❓';
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    navigate(`/coach/event/edit/${event.id}`, { state: { event } });
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      setActionLoading(true);
      const response = await deleteEvent(eventId);
      
      if (response.success) {
        setCoachEvents(prev => prev.filter(event => event.id !== eventId));
        setShowDeleteModal(false);
        setEventToDelete(null);
        alert('Event deleted successfully!');
      } else {
        throw new Error(response.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert(`Failed to delete event: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteEvent = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const exportEvents = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Event Name,Sport,Status,Start Date,Venue,City,Participants,Max Participants\n"
      + coachEvents.map(event => 
          `"${event.name}","${event.sport}","${event.status}","${new Date(event.startDate).toLocaleDateString()}","${event.venue}","${event.city}","${event.currentParticipants || 0}","${event.maxParticipants || 'Unlimited'}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `my_events_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewRegistrations = async (event) => {
    try {
      setParticipantsModal({
        isOpen: true,
        eventData: event,
        participants: [],
        loading: true
      });

      const response = await getEventRegistrations(event.id);
      
      if (response.success) {
        setParticipantsModal(prev => ({
          ...prev,
          participants: response.data.registrations || [],
          loading: false
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch participants');
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      setParticipantsModal(prev => ({
        ...prev,
        loading: false
      }));
      alert(`Failed to load participants: ${error.message}`);
    }
  };

  const closeParticipantsModal = () => {
    setParticipantsModal({
      isOpen: false,
      eventData: null,
      participants: [],
      loading: false
    });
  };

  const cancelEvent = async (event) => {
    const reason = prompt('Please provide a reason for cancelling this event:');
    if (reason === null) return; // User cancelled
    
    try {
      setActionLoading(true);
      const response = await cancelEventAPI(event.id, reason);
      
      if (response.success) {
        setCoachEvents(prev => prev.map(e => 
          e.id === event.id ? { ...e, status: 'CANCELLED' } : e
        ));
        alert('Event cancelled successfully!');
      } else {
        throw new Error(response.message || 'Failed to cancel event');
      }
    } catch (error) {
      console.error('Failed to cancel event:', error);
      alert(`Failed to cancel event: ${error.message}`);
    } finally {
      setActionLoading(false);
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
        {/* Payment Success Alert */}
        {paymentSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <FaCheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-green-700">
                  {location.state?.message || 'Your payment has been completed successfully. You now have full access to all features.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status Alert */}
        {dashboardData?.coach?.paymentStatus === 'PENDING' && !dashboardData?.coach?.isActive && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-amber-500 mt-1 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  Complete Your Payment
                </h3>
                <p className="text-amber-700 mb-4">
                  Your account has limited access. Complete your subscription payment to unlock student management, event creation, and advanced analytics.
                </p>
                <Link
                  to="/coach/payment"
                  state={{ from: '/dashboard/coach' }}
                  className="inline-flex items-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <FaCreditCard className="mr-2" />
                  Complete Payment
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.totalStudents || dashboardData?.coach?.studentsCount || 0}</p>
                <p className="text-sm text-green-600 mt-1">↗ +{dashboardData?.pendingRequests || 0} requests</p>
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
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.totalEvents || dashboardData?.coach?.eventsCreated || 0}</p>
                <p className="text-sm text-green-600 mt-1">↗ {dashboardData?.upcomingEvents || 0} upcoming</p>
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
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.averageRating || dashboardData?.coach?.rating || 0}</p>
                <div className="flex items-center mt-1">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">Based on {dashboardData?.totalReviews || 0} reviews</span>
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
                <p className="text-3xl font-bold text-gray-900">₹{(dashboardData?.totalEarnings || dashboardData?.coach?.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">↗ {dashboardData?.activeEvents || 0} active events</p>
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
                { id: 'events', name: 'My Events', icon: '📅' },
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
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm font-medium text-center block transition-colors">
                      💬 Send Message to All
                    </button>
                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-medium text-center block transition-colors">
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

            {/* Enhanced Events Tab */}
            {activeTab === 'events' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Events ({coachEvents.length})</h3>
                  <Link
                    to="/coach/event/create"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center"
                  >
                    <FaCalendar className="mr-2" />
                    Create New Event
                  </Link>
                </div>

                {/* Event Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold">📅</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Events</p>
                        <p className="text-xl font-bold text-blue-900">{coachEvents.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-yellow-600 font-semibold">⏳</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-yellow-600">Pending</p>
                        <p className="text-xl font-bold text-yellow-900">
                          {coachEvents.filter(e => e.status === 'PENDING').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-green-600 font-semibold">✅</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600">Approved</p>
                        <p className="text-xl font-bold text-green-900">
                          {coachEvents.filter(e => ['APPROVED', 'ACTIVE'].includes(e.status)).length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-purple-600 font-semibold">👥</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600">Total Participants</p>
                        <p className="text-xl font-bold text-purple-900">
                          {coachEvents.reduce((sum, e) => sum + (e.currentParticipants || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={eventFilters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">Pending Approval</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      value={eventFilters.dateRange || ''}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">All Dates</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="past">Past Events</option>
                      <option value="this_month">This Month</option>
                      <option value="next_month">Next Month</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={eventFilters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadCoachEvents()}
                      disabled={eventsLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center disabled:opacity-50"
                    >
                      {eventsLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => exportEvents()}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Showing {coachEvents.length} events
                  </div>
                </div>

                {/* Events List */}
                {eventsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your events...</p>
                  </div>
                ) : coachEvents.length > 0 ? (
                  <div className="space-y-4">
                    {coachEvents.map(event => (
                      <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-semibold text-gray-900">{event.name}</h4>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                                {getStatusIcon(event.status)} {event.status}
                              </span>
                              
                              {/* Event Type Badge */}
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                                {event.sport}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center text-gray-600">
                                <FaCalendar className="mr-2 text-gray-400" />
                                <div>
                                  <div className="font-medium">
                                    {new Date(event.startDate).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-xs">
                                    {new Date(event.startDate).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                    {event.endDate && (
                                      ` - ${new Date(event.endDate).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}`
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center text-gray-600">
                                <FaMapMarkerAlt className="mr-2 text-gray-400" />
                                <div>
                                  <div className="font-medium">{event.venue}</div>
                                  <div className="text-xs">{event.city}, {event.state}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center text-gray-600">
                                <FaUsers className="mr-2 text-gray-400" />
                                <div>
                                  <div className="font-medium">
                                    {event.currentParticipants || 0} / {event.maxParticipants || 'Unlimited'}
                                  </div>
                                  <div className="text-xs">Participants</div>
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar for Participants */}
                            {event.maxParticipants && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Registration Progress</span>
                                  <span>{Math.round(((event.currentParticipants || 0) / event.maxParticipants) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full transition-all" 
                                    style={{ 
                                      width: `${Math.min(((event.currentParticipants || 0) / event.maxParticipants) * 100, 100)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {/* Admin Notes */}
                            {event.adminNotes && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start">
                                  <svg className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-yellow-800">Admin Note:</p>
                                    <p className="text-sm text-yellow-700">{event.adminNotes}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewEvent(event)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors inline-flex items-center"
                            >
                              <FaEye className="mr-2" />
                              View Details
                            </button>
                            
                            {['PENDING', 'APPROVED', 'ACTIVE'].includes(event.status) && (
                              <button
                                onClick={() => handleEditEvent(event)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors inline-flex items-center"
                              >
                                <FaEdit className="mr-2" />
                                Edit
                              </button>
                            )}
                            
                            {['APPROVED', 'ACTIVE'].includes(event.status) && (
                              <button
                                onClick={() => viewRegistrations(event)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors inline-flex items-center"
                              >
                                <FaUsers className="mr-2" />
                                Participants ({event.currentParticipants || 0})
                              </button>
                            )}

                            {['APPROVED', 'ACTIVE', 'COMPLETED'].includes(event.status) && (
                              <>
                                <Link
                                  to={`/coach/event/${event.id}/results`}
                                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors inline-flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Upload Results
                                </Link>
                                <Link
                                  to={`/coach/event/${event.id}/orders`}
                                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors inline-flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                  </svg>
                                  Place Orders
                                </Link>
                              </>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            {event.status === 'PENDING' && (
                              <button
                                onClick={() => confirmDeleteEvent(event)}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors inline-flex items-center"
                              >
                                <FaTrash className="mr-2" />
                                Delete
                              </button>
                            )}
                            
                            {['APPROVED', 'ACTIVE'].includes(event.status) && new Date(event.startDate) > new Date() && (
                              <button
                                onClick={() => cancelEvent(event)}
                                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors"
                              >
                                Cancel Event
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaCalendar className="text-gray-400 text-3xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                    <p className="text-gray-600 mb-6">
                      {Object.values(eventFilters).some(filter => filter) 
                        ? 'No events match your current filters.' 
                        : 'Create your first event to start managing student activities.'}
                    </p>
                    {!Object.values(eventFilters).some(filter => filter) && (
                      <Link
                        to="/coach/event/create"
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
                      >
                        <FaCalendar className="mr-2" />
                        Create Your First Event
                      </Link>
                    )}
                  </div>
                )}
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

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedEvent.name}</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedEvent.status)}`}>
                  {getStatusIcon(selectedEvent.status)} {selectedEvent.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sport</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEvent.sport}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedEvent.startDate).toLocaleString()}
                    </p>
                  </div>
                  
                  {selectedEvent.endDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedEvent.endDate).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Participants</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedEvent.currentParticipants || 0} / {selectedEvent.maxParticipants || 'Unlimited'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Venue</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEvent.venue}</p>
                  </div>
                  
                  {selectedEvent.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedEvent.address}</p>
                    </div>
                  )}
                  
                  {selectedEvent.city && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedEvent.city}, {selectedEvent.state}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedEvent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.adminNotes && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <p className="text-sm text-gray-900 bg-yellow-50 p-3 rounded border border-yellow-200">{selectedEvent.adminNotes}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                {['PENDING', 'APPROVED', 'ACTIVE'].includes(selectedEvent.status) && (
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      handleEditEvent(selectedEvent);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Edit Event
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && eventToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <FaTrash className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Event</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "<strong>{eventToDelete.name}</strong>"? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEventToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteEvent(eventToDelete.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting...' : 'Delete Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      <CoachParticipantsModal
        isOpen={participantsModal.isOpen}
        onClose={closeParticipantsModal}
        eventData={participantsModal.eventData}
        participants={participantsModal.participants}
        loading={participantsModal.loading}
      />
    </div>
  );
};

export default CoachDashboard;