import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login/student');
  };

  // Memoized function to load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const response = await getNotifications({ limit: 10 });
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []); // No dependencies needed as it only uses state setters

  // Load notifications when user is authenticated (all user roles)
  useEffect(() => {
    if (user && isAuthenticated()) {
      loadNotifications();
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loadNotifications]); // Depend on user and memoized loadNotifications

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, isRead: true, readAt: new Date() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    // Smooth close animation
    setTimeout(() => {
      setShowNotifications(false);
    }, 150);

    // Parse notification data if available
    let navigationPath = null;
    try {
      if (notification.data) {
        const data = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data;
        
        // Route based on notification type
        switch (notification.type) {
          case 'EVENT_APPROVED':
          case 'EVENT_REJECTED':
          case 'EVENT_SUSPENDED':
          case 'EVENT_RESTARTED':
            if (data.eventId) {
              navigationPath = `/events/${data.eventId}`;
            }
            break;
          case 'ORDER_CONFIRMED':
          case 'ORDER_IN_PROGRESS':
          case 'ORDER_COMPLETED':
          case 'ORDER_CANCELLED':
            if (data.orderId) {
              navigationPath = `/admin/orders/${data.orderId}`;
            }
            break;
          case 'PAYMENT_RECEIVED':
          case 'PAYMENT_FAILED':
            if (data.paymentId) {
              navigationPath = `/admin/payments/${data.paymentId}`;
            }
            break;
          default:
            // For general notifications, go to dashboard
            navigationPath = `/dashboard/${user.role.toLowerCase()}`;
        }

        if (navigationPath) {
          navigate(navigationPath);
        }
      }
    } catch (error) {
      console.error('Error parsing notification data:', error);
      // Fallback to dashboard
      navigate(`/dashboard/${user.role.toLowerCase()}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
      // Smooth animation - remove unread indicators
      setTimeout(() => {
        setShowNotifications(false);
      }, 300);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      EVENT_APPROVED: '✅',
      EVENT_REJECTED: '❌',
      EVENT_SUSPENDED: '⏸️',
      EVENT_RESTARTED: '🔄',
      ORDER_CONFIRMED: '📋',
      ORDER_IN_PROGRESS: '⚙️',
      ORDER_COMPLETED: '🎉',
      ORDER_CANCELLED: '❌',
      PAYMENT_RECEIVED: '💰',
      PAYMENT_FAILED: '💳',
      GENERAL: '📢'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type) => {
    const colors = {
      EVENT_APPROVED: 'text-green-600',
      EVENT_REJECTED: 'text-red-600',
      EVENT_SUSPENDED: 'text-orange-600',
      EVENT_RESTARTED: 'text-blue-600',
      ORDER_CONFIRMED: 'text-green-600',
      ORDER_IN_PROGRESS: 'text-blue-600',
      ORDER_COMPLETED: 'text-green-600',
      ORDER_CANCELLED: 'text-red-600',
      PAYMENT_RECEIVED: 'text-green-600',
      PAYMENT_FAILED: 'text-red-600',
      GENERAL: 'text-gray-600'
    };
    return colors[type] || 'text-gray-600';
  };

  const formatNotificationTime = (createdAt) => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const isLoginPage = location.pathname.includes('/login');
  const isRegisterPage = location.pathname.includes('/register');

  const getDisplayName = () => {
    if (!user || !user.profile) return user?.role || 'User';
    
    const profile = user.profile;
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (profile.name) {
      return profile.name;
    }
    return user.email || user.role;
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              STAIRS Talent Hub
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {isAuthenticated() && user && (
              <>
                <Link
                  to={`/dashboard/${user.role.toLowerCase()}`}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                {user.role === 'COACH' && (
                  <>
                    <Link
                      to="/coach/event/create"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Create Event
                    </Link>
                    <Link
                      to="/coach/bulk-upload"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Bulk Upload
                    </Link>
                  </>
                )}
                {user.role === 'INSTITUTE' && (
                  <Link
                    to="/bulk-upload"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Bulk Upload
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center space-x-4">
            {isLoginPage ? (
              <div className="flex space-x-2 flex-wrap">
                <Link
                  to="/login/student"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/login/student'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Student
                </Link>
                <Link
                  to="/login/coach"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/login/coach'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Coach
                </Link>
                <Link
                  to="/login/club"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/login/club'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Club
                </Link>
                <Link
                  to="/login/institute"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/login/institute'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Institute
                </Link>
                <Link
                  to="/login/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/login/admin'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Admin
                </Link>
                <Link
                  to="/login/incharge"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/login/incharge'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Incharge
                </Link>
              </div>
            ) : isRegisterPage ? (
              <div className="flex space-x-2">
                <Link
                  to="/register/student"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/register/student'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Student
                </Link>
                <Link
                  to="/register/coach"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/register/coach'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Coach
                </Link>
                <Link
                  to="/register/institute"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/register/institute'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Institute
                </Link>
              </div>
            ) : isAuthenticated() && user ? (
              <div className="flex items-center space-x-4">
                {/* Notifications - All Authenticated Users */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 19h6v2H4a2 2 0 01-2-2V7a2 2 0 012-2h6v2H4v10zM20 5H8a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2z" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="px-4 py-8 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                              notification.isRead 
                                ? 'border-transparent bg-gray-50' 
                                : 'border-blue-500 bg-white'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-lg flex-shrink-0">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatNotificationTime(notification.createdAt)}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 19h6v2H4a2 2 0 01-2-2V7a2 2 0 012-2h6v2H4v10zM20 5H8a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2z" />
                          </svg>
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-200 text-center">
                        <Link
                          to={`/dashboard/${user.role.toLowerCase()}?tab=notifications`}
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => setShowNotifications(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-blue-600 focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {getDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:block">
                      <div className="flex items-center space-x-2">
                        <span>{getDisplayName()}</span>
                        <span className="text-xs text-gray-500">({user.role})</span>
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        ID: {user.role === 'ADMIN' ? 'ADMIN' : user.uniqueId}
                      </div>
                    </div>
                  </button>
                  
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to={`/${user.role.toLowerCase()}/profile`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to={`/dashboard/${user.role.toLowerCase()}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login/admin"
                  className="px-3 py-2 rounded-md text-sm font-medium text-blue-600 border border-blue-600 hover:bg-blue-50"
                >
                  Admin Login
                </Link>
                <Link
                  to="/login/incharge"
                  className="px-3 py-2 rounded-md text-sm font-medium text-indigo-600 border border-indigo-600 hover:bg-indigo-50"
                >
                  Incharge Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;