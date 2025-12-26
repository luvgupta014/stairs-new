import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  bulkDeleteNotifications
} from '../api';
import { 
  FaBell, 
  FaCheckCircle, 
  FaTimes, 
  FaCheck, 
  FaExclamationCircle,
  FaInfoCircle,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import Spinner from './Spinner';

const NotificationsPage = ({ userRole = 'student' }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters and pagination
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  const loadNotifications = useCallback(async (page = 1, filterType = filter) => {
    try {
      setLoading(true);
      setError('');
      
      // Ensure page is a valid number
      const pageNum = Math.max(1, parseInt(page) || 1);
      
      const params = {
        page: pageNum,
        limit: itemsPerPage,
        ...(filterType === 'unread' && { unreadOnly: 'true' })
      };

      const response = await getNotifications(params);
      
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
        const pagination = response.data.pagination || {};
        setTotalPages(pagination.totalPages || 1);
        setTotalItems(pagination.totalItems || 0);
        // Use the page from response, or fallback to the page we requested
        setCurrentPage(pagination.currentPage || pageNum);
      } else {
        throw new Error(response.message || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Failed to load notifications. Please try again.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications(1, filter);
  }, [loadNotifications, filter]);

  const handleNotificationClick = async (notification) => {
    if (isSelecting) {
      // Toggle selection
      setSelectedNotifications(prev => {
        const newSet = new Set(prev);
        if (newSet.has(notification.id)) {
          newSet.delete(notification.id);
        } else {
          newSet.add(notification.id);
        }
        return newSet;
      });
      return;
    }

    // Mark as read if unread
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

    // Navigate based on notification type
    try {
      if (notification.data) {
        const data = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data;
        
        switch (notification.type) {
          case 'EVENT_APPROVED':
          case 'EVENT_REJECTED':
          case 'EVENT_SUSPENDED':
          case 'EVENT_RESTARTED':
            if (data.eventId) {
              navigate(`/events/${data.eventId}`);
            }
            break;
          case 'ORDER_CONFIRMED':
          case 'ORDER_IN_PROGRESS':
          case 'ORDER_COMPLETED':
          case 'ORDER_CANCELLED':
            if (data.orderId) {
              navigate(`/admin/orders/${data.orderId}`);
            }
            break;
          case 'PAYMENT_RECEIVED':
          case 'PAYMENT_FAILED':
            if (data.paymentId) {
              navigate(`/admin/payments/${data.paymentId}`);
            }
            break;
          default:
            navigate(`/dashboard/${userRole.toLowerCase()}`);
        }
      } else {
        navigate(`/dashboard/${userRole.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error parsing notification data:', error);
      navigate(`/dashboard/${userRole.toLowerCase()}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      setError('Failed to mark all notifications as read. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      setActionLoading(true);
      await deleteNotification(notificationId);
      
      // Remove from current list
      const deletedNotification = notifications.find(n => n.id === notificationId);
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      
      // Update unread count if needed
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // If current page becomes empty and not on first page, go to previous page
      if (updatedNotifications.length === 0 && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else {
        // Reload current page to refresh counts
        loadNotifications(currentPage, filter);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setError('Failed to delete notification. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedNotifications.size} notification(s)?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await bulkDeleteNotifications(Array.from(selectedNotifications));
      setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
      
      // Update unread count
      const deletedUnreadCount = notifications.filter(
        n => selectedNotifications.has(n.id) && !n.isRead
      ).length;
      setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
      
      setSelectedNotifications(new Set());
      setIsSelecting(false);
      
      // If current page becomes empty and not on first page, go to previous page
      if (notifications.length === selectedNotifications.size && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else {
        // Reload to refresh list
        await loadNotifications(currentPage, filter);
      }
    } catch (error) {
      console.error('Failed to bulk delete notifications:', error);
      setError('Failed to delete notifications. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setTotalItems(0);
      setTotalPages(1);
      setCurrentPage(1);
      setSelectedNotifications(new Set());
      setIsSelecting(false);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      setError('Failed to clear all notifications. Please try again.');
    } finally {
      setActionLoading(false);
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
    if (!createdAt) return 'Just now';
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return notificationTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: notificationTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handlePageChange = (newPage) => {
    // Validate page number
    const pageNum = parseInt(newPage);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (loading) return;
    
    // Update state and load notifications
    loadNotifications(pageNum, filter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaBell className="text-blue-600" />
                Notifications
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} • {totalItems} total
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {isSelecting ? (
                <>
                  <button
                    onClick={() => {
                      setSelectedNotifications(new Set());
                      setIsSelecting(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedNotifications.size === 0 || actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FaTimes className="w-4 h-4" />
                    Delete ({selectedNotifications.size})
                  </button>
                </>
              ) : (
                <>
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={() => setIsSelecting(true)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FaFilter className="w-4 h-4" />
                        Select
                      </button>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          disabled={actionLoading}
                          className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center gap-2"
                        >
                          <FaCheck className="w-4 h-4" />
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={handleClearAll}
                        disabled={actionLoading}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 flex items-center gap-2"
                      >
                        <FaTimes className="w-4 h-4" />
                        Clear All
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaExclamationCircle className="text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBell className="text-gray-400 text-4xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No notifications found' : 'No notifications'}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Try adjusting your search terms.'
                : filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : "You're all caught up! Check back later for updates."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                  notification.isRead
                    ? 'border-gray-200'
                    : 'border-blue-500 bg-blue-50'
                } ${
                  isSelecting && selectedNotifications.has(notification.id)
                    ? 'ring-2 ring-blue-500'
                    : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox */}
                    {isSelecting && (
                      <input
                        type="checkbox"
                        checked={selectedNotifications.has(notification.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedNotifications(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(notification.id)) {
                              newSet.delete(notification.id);
                            } else {
                              newSet.add(notification.id);
                            }
                            return newSet;
                          });
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}

                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      notification.isRead ? 'bg-gray-100' : 'bg-blue-100'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${getNotificationColor(notification.type)} ${
                            !notification.isRead ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm mt-1 line-clamp-2 ${
                            notification.isRead ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-xs text-gray-500">
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                            {!notification.isRead && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                New
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {!isSelecting && (
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <FaCheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              disabled={actionLoading}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages} ({totalItems} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

