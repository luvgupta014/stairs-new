import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAdminEvents, moderateEvent, getEventParticipants } from '../../api';
import ParticipantsModal from '../../components/ParticipantsModal';
import AdminCertificateIssuance from '../../components/AdminCertificateIssuance';

const AdminEventsManagement = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [moderatingEventId, setModeratingEventId] = useState(null);
  
  // Initialize filters from URL query parameters
  const getInitialFilters = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      status: searchParams.get('status') || '',
      sport: searchParams.get('sport') || '',
      search: searchParams.get('search') || ''
    };
  };
  
  const [filters, setFilters] = useState(getInitialFilters());

  // Event details modal state
  const [eventDetailsModal, setEventDetailsModal] = useState({
    isOpen: false,
    event: null,
    participants: [],
    loading: false
  });

  const [modalTab, setModalTab] = useState('details'); // 'details', 'certificates'

  useEffect(() => {
    fetchAllEvents();
  }, []);

  useEffect(() => {
    // Update filters when URL query parameters change
    const searchParams = new URLSearchParams(location.search);
    const newFilters = {
      status: searchParams.get('status') || '',
      sport: searchParams.get('sport') || '',
      search: searchParams.get('search') || ''
    };
    setFilters(newFilters);
  }, [location.search]);

  useEffect(() => {
    applyFilters();
  }, [filters, events]);

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const response = await getAdminEvents();
      if (response.success) {
        setEvents(response.data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...events];

    if (filters.status) {
      result = result.filter(event => {
        const dynamicStatus = getDynamicEventStatus(event);
        return dynamicStatus === filters.status || event.status === filters.status;
      });
    }

    if (filters.sport) {
      result = result.filter(event => event.sport === filters.sport);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(event =>
        event.name?.toLowerCase().includes(searchLower) ||
        event.title?.toLowerCase().includes(searchLower) ||
        event.coach?.name?.toLowerCase().includes(searchLower) ||
        event.venue?.toLowerCase().includes(searchLower) ||
        event.city?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredEvents(result);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleModerateEvent = async (eventId, action) => {
    try {
      setModeratingEventId(eventId);
      const response = await moderateEvent(eventId, action);
      
      if (response.success) {
        // Update the event in the list
        setEvents(prev =>
          prev.map(event =>
            event.id === eventId ? { ...event, status: response.data.event.status } : event
          )
        );
      }
    } catch (error) {
      console.error('Error moderating event:', error);
      alert(error.response?.data?.message || 'Failed to moderate event');
    } finally {
      setModeratingEventId(null);
    }
  };

  const handleViewEventDetails = async (event) => {
    try {
      setEventDetailsModal({
        isOpen: true,
        event,
        participants: [],
        loading: true
      });

      console.log('📋 Fetching participants for event:', event.id);
      
      const response = await getEventParticipants(event.id);
      
      if (response.success) {
        console.log('✅ Participants loaded:', response.data.registrations?.length || 0);
        setEventDetailsModal(prev => ({
          ...prev,
          participants: response.data.registrations || [],
          loading: false
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch participants');
      }
    } catch (error) {
      console.error('❌ Failed to fetch participants:', error);
      setEventDetailsModal(prev => ({
        ...prev,
        participants: [],
        loading: false
      }));
    }
  };

  const closeEventDetailsModal = () => {
    setEventDetailsModal({
      isOpen: false,
      event: null,
      participants: [],
      loading: false
    });
    setModalTab('details');
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-orange-100 text-orange-800',
      ACTIVE: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      'ABOUT TO START': 'bg-cyan-100 text-cyan-800',
      ONGOING: 'bg-indigo-100 text-indigo-800',
      ENDED: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Helper function to get dynamic event status based on dates
  const getDynamicEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;
    
    // Calculate time differences in milliseconds
    const timeUntilStart = startDate - now;
    const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
    const daysUntilStart = timeUntilStart / (1000 * 60 * 60 * 24);
    
    // If event is not approved yet, show the actual status
    if (event.status === 'PENDING' || event.status === 'REJECTED' || event.status === 'SUSPENDED' || event.status === 'CANCELLED') {
      return event.status;
    }
    
    // Check if event has ended
    if (endDate && now > endDate) {
      return 'ENDED';
    }
    
    // Check if event is ongoing
    if (now >= startDate && (!endDate || now <= endDate)) {
      return 'ONGOING';
    }
    
    // Check if event is about to start (within 24 hours)
    if (hoursUntilStart > 0 && hoursUntilStart <= 24) {
      return 'ABOUT TO START';
    }
    
    // Check if event is within 7 days
    if (daysUntilStart > 1 && daysUntilStart <= 7) {
      return 'UPCOMING';
    }
    
    // Otherwise return the current status
    return event.status;
  };

  // Event Details Modal Component
  const EventDetailsModal = ({ isOpen, onClose, event, participants, loading }) => {
    if (!isOpen || !event) return null;

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return 'Not specified';
      const d = new Date(dateString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (participant) => {
      const status = participant.status || 'REGISTERED';
      const statusColors = {
        'PENDING': 'bg-yellow-100 text-yellow-800',
        'REGISTERED': 'bg-green-100 text-green-800',
        'APPROVED': 'bg-green-100 text-green-800',
        'CONFIRMED': 'bg-blue-100 text-blue-800',
        'CANCELLED': 'bg-red-100 text-red-800',
        'REJECTED': 'bg-red-100 text-red-800'
      };
      
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
          {status}
        </span>
      );
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header - Fixed */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5 rounded-t-xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{event.name || event.title}</h3>
                <p className="text-blue-100 text-sm">Complete Event Information & Participant List</p>
              </div>
              <button
                onClick={onClose}
                className="ml-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 flex flex-shrink-0 bg-white">
            <button
              onClick={() => setModalTab('details')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                modalTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Event Details & Participants
            </button>
            <button
              onClick={() => setModalTab('certificates')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                modalTab === 'certificates'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎓 Certificate Issuance
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Details Tab */}
            {modalTab === 'details' && (
              <>
                {/* Event Details Section */}
                <div className="px-6 py-5 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-1 h-6 bg-blue-600 rounded-full mr-3"></div>
                <h4 className="text-lg font-bold text-gray-900">Event Information</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {event.uniqueId && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-3">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                      </svg>
                      <p className="text-xs font-semibold text-blue-700 uppercase">Event ID</p>
                    </div>
                    <p className="font-mono font-bold text-blue-900 text-xl tracking-wide">{event.uniqueId}</p>
                  </div>
                )}
                
                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Sport</p>
                  </div>
                  <p className="font-semibold text-gray-900 text-lg">{event.sport}</p>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(getDynamicEventStatus(event))}`}>
                    {getDynamicEventStatus(event)}
                  </span>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Start Date</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatDateTime(event.startDate)}</p>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500 uppercase">End Date</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatDateTime(event.endDate)}</p>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Venue</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue + ', ' + event.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                  >
                    {event.venue}
                  </a>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500 uppercase">City</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue + ', ' + event.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                  >
                    {event.city}
                  </a>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Max Participants</p>
                  </div>
                  <p className="font-semibold text-gray-900 text-lg">{event.maxParticipants || 'Unlimited'}</p>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Registrations</p>
                  </div>
                  <p className="font-semibold text-green-600 text-lg">{participants?.length || 0}</p>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-gray-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Created</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatDateTime(event.createdAt)}</p>
                </div>

                {event.uniqueId && (
                  <div className="bg-white border border-indigo-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-indigo-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd"/>
                      </svg>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Event UID</p>
                    </div>
                    <p className="font-mono font-bold text-indigo-600 text-base">{event.uniqueId}</p>
                  </div>
                )}
              </div>

              {/* Coach Information */}
              {event.coach && (
                <div className="mt-5 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <svg className="w-6 h-6 text-gray-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-sm font-bold text-gray-700 uppercase">Coach Information</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">Name</p>
                      {event.coach.user?.uniqueId ? (
                        <Link
                          to={`/admin/users/${event.coach.user.uniqueId}`}
                          onClick={onClose}
                          className="font-semibold text-gray-900 text-lg hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                        >
                          {event.coach.name}
                        </Link>
                      ) : (
                        <p className="font-semibold text-gray-900 text-lg">{event.coach.name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">Email</p>
                      <a
                        href={`mailto:${event.coach.user?.email || event.coach.email}`}
                        className="font-medium text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        {event.coach.user?.email || event.coach.email || 'N/A'}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">Phone</p>
                      <a
                        href={`tel:${event.coach.user?.phone || event.coach.phone}`}
                        className="font-medium text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        {event.coach.user?.phone || event.coach.phone || 'N/A'}
                      </a>
                    </div>
                    {event.coach.user?.uniqueId && (
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Coach UID</p>
                        <Link
                          to={`/admin/users/${event.coach.user.uniqueId}`}
                          onClick={onClose}
                          className="font-mono font-bold text-gray-700 hover:text-blue-600 hover:underline transition-colors"
                        >
                          {event.coach.user.uniqueId}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="mt-5 bg-gray-50 border border-gray-200 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-gray-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-sm font-bold text-gray-700 uppercase">Description</p>
                  </div>
                  <p className="text-gray-900 leading-relaxed">{event.description}</p>
                </div>
              )}
            </div>

            {/* Participants Section */}
            <div className="px-6 py-5 bg-white">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center">
                  <div className="w-1 h-6 bg-green-600 rounded-full mr-3"></div>
                  <h4 className="text-lg font-bold text-gray-900">
                    Participants ({participants?.length || 0})
                  </h4>
                </div>
                {participants && participants.length > 0 && event.maxParticipants && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                    {Math.round((participants.length / event.maxParticipants) * 100)}% Full
                  </div>
                )}
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <span className="text-gray-600 font-medium">Loading participants...</span>
                </div>
              ) : participants && participants.length > 0 ? (
                <div className="space-y-3">
                  {participants.map((participant, index) => {
                    const studentName = participant.student?.name || 
                                       `${participant.student?.firstName || ''} ${participant.student?.lastName || ''}`.trim() || 
                                       'Student';
                    const studentUID = participant.student?.user?.uniqueId;
                    
                    // Wrapper component for clickable card
                    const CardWrapper = studentUID ? Link : 'div';
                    const cardProps = studentUID ? {
                      to: `/admin/users/${studentUID}`,
                      onClick: onClose,
                      className: "block bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-400 transition-all duration-200 cursor-pointer"
                    } : {
                      className: "bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                    };
                    
                    return (
                      <CardWrapper key={participant.id || index} {...cardProps}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h5 className={`font-bold text-lg ${studentUID ? 'text-gray-900 group-hover:text-blue-600' : 'text-gray-900'}`}>
                                {studentName}
                              </h5>
                              <p className="text-sm text-gray-600 mt-1">
                                📅 Registered on {formatDateTime(participant.registeredAt || participant.createdAt)}
                              </p>
                              {studentUID && (
                                <p className="text-xs text-blue-600 font-mono font-bold mt-1 bg-blue-50 inline-block px-2 py-1 rounded">
                                  UID: {studentUID}
                                </p>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(participant)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                            </svg>
                            <p className="text-sm text-gray-900 truncate">{participant.student?.user?.email || participant.student?.email || 'N/A'}</p>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                            </svg>
                            <p className="text-sm text-gray-900">{participant.student?.user?.phone || participant.student?.phone || 'N/A'}</p>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                            </svg>
                            <p className="text-sm text-gray-900">{participant.student?.sport || 'N/A'}</p>
                          </div>
                        </div>
                      </CardWrapper>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">No Participants Yet</h4>
                  <p className="text-gray-600">No one has registered for this event yet.</p>
                </div>
              )}
            </div>
              </>
            )}

            {/* Certificates Tab */}
            {modalTab === 'certificates' && (
              <div className="p-6">
                <AdminCertificateIssuance event={event} onSuccess={closeEventDetailsModal} />
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-between items-center flex-shrink-0">
            <div className="text-sm text-gray-600 font-medium">
              {participants && participants.length > 0 && (
                <>
                  Total: <span className="font-bold text-gray-900">{participants.length}</span> participant{participants.length !== 1 ? 's' : ''}
                  {event.maxParticipants && (
                    <span className="ml-3 text-blue-600">
                      • <span className="font-bold">{Math.round((participants.length / event.maxParticipants) * 100)}%</span> capacity
                    </span>
                  )}
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Events Management</h1>
              <p className="text-gray-600 mt-1">
                Manage all events, approve/reject submissions, and issue certificates
              </p>
            </div>
            <Link
              to="/admin/dashboard"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="ABOUT TO START">About to Start</option>
                <option value="ONGOING">Ongoing</option>
                <option value="ENDED">Ended</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
              <select
                value={filters.sport}
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
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredEvents.length} of {events.length} events
            </p>
            <button
              onClick={fetchAllEvents}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
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
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <button
                            onClick={() => handleViewEventDetails(event)}
                            className="font-medium text-gray-900 hover:text-blue-600 hover:underline text-left transition-colors"
                          >
                            {event.name || event.title}
                          </button>
                          {event.uniqueId && (
                            <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                              ID: {event.uniqueId}
                            </div>
                          )}
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
                          {event.coach?.user?.uniqueId ? (
                            <Link
                              to={`/admin/users/${event.coach.user.uniqueId}`}
                              className="font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                            >
                              {event.coach.name}
                            </Link>
                          ) : (
                            <div className="font-medium text-gray-900">{event.coach?.name}</div>
                          )}
                          {event.coach?.user?.uniqueId && (
                            <div className="text-xs font-mono text-gray-600 mt-1">
                              UID: {event.coach.user.uniqueId}
                            </div>
                          )}
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
                        <div className="text-gray-900">{event.venue}</div>
                        <div className="text-sm text-gray-500">{event.city}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getDynamicEventStatus(event))}`}>
                          {getDynamicEventStatus(event)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-1">
                          {/* View Button */}
                          <button
                            onClick={() => handleViewEventDetails(event)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors h-6"
                          >
                            👁️ View Details
                          </button>
                          
                          {/* Moderation Actions */}
                          <div className="flex space-x-1">
                            {event.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleModerateEvent(event.id, 'approve')}
                                  disabled={moderatingEventId === event.id}
                                  className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                  {moderatingEventId === event.id ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleModerateEvent(event.id, 'reject')}
                                  disabled={moderatingEventId === event.id}
                                  className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            
                            {event.status === 'APPROVED' && (
                              <button
                                onClick={() => handleModerateEvent(event.id, 'suspend')}
                                disabled={moderatingEventId === event.id}
                                className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                              >
                                Suspend
                              </button>
                            )}
                            
                            {(event.status === 'SUSPENDED' || event.status === 'REJECTED') && (
                              <button
                                onClick={() => handleModerateEvent(event.id, 'restart')}
                                disabled={moderatingEventId === event.id}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                Restart
                              </button>
                            )}
                          </div>

                          {/* Certificate Action - Only show when event has ended */}
                          {(() => {
                            const dynamicStatus = getDynamicEventStatus(event);
                            const eventHasEnded = dynamicStatus === 'ENDED';
                            
                            return eventHasEnded && (
                              <Link
                                to={`/admin/event/${event.uniqueId || event.id}/certificates`}
                                className="bg-teal-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-teal-700 transition-colors inline-flex items-center justify-center"
                              >
                                🎓 Issue Certificates
                              </Link>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📅</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h4>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={eventDetailsModal.isOpen}
        onClose={closeEventDetailsModal}
        event={eventDetailsModal.event}
        participants={eventDetailsModal.participants}
        loading={eventDetailsModal.loading}
      />
    </div>
  );
};

export default AdminEventsManagement;
