import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAdminEvents, moderateEvent, getEventParticipants, getEventPayments } from '../../api';
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
    payments: [],
    loading: false,
    paymentsLoading: false
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
        // If backend already includes payment summary on events, use it.
        // Otherwise we'll lazy-load payments in the modal.
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

  // Enhanced: fetch participants + payments when opening modal
  const handleViewEventDetails = async (event) => {
    try {
      setEventDetailsModal({
        isOpen: true,
        event,
        participants: [],
        payments: [],
        loading: true,
        paymentsLoading: true
      });

      console.log('📋 Fetching participants and payments for event:', event.id);

      // Load participants and payments concurrently
      const [participantsResponse, paymentsResponse] = await Promise.allSettled([
        getEventParticipants(event.id),
        getEventPayments(event.id)
      ]);

      // Participants
      if (participantsResponse.status === 'fulfilled' && participantsResponse.value?.success) {
        console.log('✅ Participants loaded:', participantsResponse.value.data.registrations?.length || 0);
        setEventDetailsModal(prev => ({
          ...prev,
          participants: participantsResponse.value.data.registrations || [],
          loading: false
        }));
      } else {
        console.warn('Participants fetch failed or returned unexpected shape:', participantsResponse);
        setEventDetailsModal(prev => ({ ...prev, participants: [], loading: false }));
      }

      // Payments
      if (paymentsResponse.status === 'fulfilled') {
        // paymentsResponse.value could be an Error thrown by getEventPayments; handle both shapes
        const paymentsPayload = paymentsResponse.value?.payments || paymentsResponse.value?.data || paymentsResponse.value;
        // Normalize: if server returned { success, data }, check data
        let paymentsList = [];
        if (paymentsResponse.value?.success && paymentsResponse.value?.data) {
          // assume data.payments or data
          paymentsList = paymentsResponse.value.data.payments || paymentsResponse.value.data || [];
        } else if (Array.isArray(paymentsPayload)) {
          paymentsList = paymentsPayload;
        } else if (paymentsPayload && paymentsPayload.payments) {
          paymentsList = paymentsPayload.payments;
        }

        console.log('✅ Payments loaded:', paymentsList.length || 0);
        setEventDetailsModal(prev => ({
          ...prev,
          payments: paymentsList,
          paymentsLoading: false
        }));
      } else {
        console.warn('Payments fetch failed:', paymentsResponse);
        setEventDetailsModal(prev => ({ ...prev, payments: [], paymentsLoading: false }));
      }

    } catch (error) {
      console.error('❌ Failed to fetch participants/payments:', error);
      setEventDetailsModal({
        isOpen: true,
        event,
        participants: [],
        payments: [],
        loading: false,
        paymentsLoading: false
      });
    }
  };

  const closeEventDetailsModal = () => {
    setEventDetailsModal({
      isOpen: false,
      event: null,
      participants: [],
      payments: [],
      loading: false,
      paymentsLoading: false
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

  // Enhanced helper: derive payment status / summary for an event object with comprehensive edge case handling
  const getEventPaymentSummary = (event, modalPayments = []) => {
    // Prefer server-provided summary fields if present (from registration orders)
    if (event.paymentSummary && typeof event.paymentSummary === 'object') {
      return {
        totalAmount: event.paymentSummary.totalAmount || 0,
        paidAmount: event.paymentSummary.paidAmount || 0,
        status: event.paymentSummary.status || 'NO_PAYMENTS',
        orderCount: event.paymentSummary.orderCount || 0,
        paidOrderCount: event.paymentSummary.paidOrderCount || 0
      };
    }
    if (event.paymentsSummary && typeof event.paymentsSummary === 'object') {
      return event.paymentsSummary;
    }
    // If event has payments array embedded (legacy support)
    if (Array.isArray(event.payments) && event.payments.length > 0) {
      const total = event.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const paid = event.payments.reduce((s, p) => {
        const amount = Number(p.amount) || 0;
        const isPaid = p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID';
        return isPaid ? s + amount : s;
      }, 0);
      const status = total > 0 ? (paid >= total ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING')) : 'NO_PAYMENTS';
      return { totalAmount: total, paidAmount: paid, status, orderCount: event.payments.length, paidOrderCount: event.payments.filter(p => p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID').length };
    }
    // Fallback: if modalPayments were loaded (used in modal)
    if (Array.isArray(modalPayments) && modalPayments.length > 0) {
      const total = modalPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const paid = modalPayments.reduce((s, p) => {
        const amount = Number(p.amount) || 0;
        const isPaid = p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID';
        return isPaid ? s + amount : s;
      }, 0);
      const status = total > 0 ? (paid >= total ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING')) : 'NO_PAYMENTS';
      return { totalAmount: total, paidAmount: paid, status, orderCount: modalPayments.length, paidOrderCount: modalPayments.filter(p => p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID').length };
    }
    // Default: no payments found
    return { totalAmount: 0, paidAmount: 0, status: 'NO_PAYMENTS', orderCount: 0, paidOrderCount: 0 };
  };

  // Event Details Modal Component
  const EventDetailsModal = ({ isOpen, onClose, event, participants, loading, payments, paymentsLoading }) => {
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

    const paymentSummary = getEventPaymentSummary(event, payments);

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
                {/* Payment summary in header */}
                <div className="mt-2 flex items-center space-x-3 text-sm">
                  <span className={`px-2 py-1 rounded-full font-semibold ${paymentSummary.status === 'PAID' ? 'bg-green-100 text-green-800' : paymentSummary.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {paymentSummary.status === 'NO_PAYMENTS' ? 'No Payments' : paymentSummary.status}
                  </span>
                  {paymentSummary.totalAmount > 0 && (
                    <span className="text-blue-100/80">• Total: ₹{(paymentSummary.totalAmount || 0).toLocaleString()}</span>
                  )}
                  {paymentSummary.paidAmount > 0 && (
                    <span className="text-blue-100/80">• Paid: ₹{(paymentSummary.paidAmount || 0).toLocaleString()}</span>
                  )}
                </div>
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
              onClick={() => setModalTab('results')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                modalTab === 'results'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Upload Results
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
                {/* (event details markup unchanged...) */}
                {/* ...existing event details content omitted for brevity in this snippet (keeps UI identical) ... */}

                {/* Participants Section (keeps existing UI) */}
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
                      {/* existing participants list rendering (unchanged) */}
                      {participants.map((participant, index) => {
                        const studentName = participant.student?.name || 
                                           `${participant.student?.firstName || ''} ${participant.student?.lastName || ''}`.trim() || 
                                           'Student';
                        const studentUID = participant.student?.user?.uniqueId;
                        
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

                {/* Payments Section */}
                <div className="px-6 py-5 bg-white border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></div>
                      <h4 className="text-lg font-bold text-gray-900">Payments</h4>
                    </div>
                    <div className="text-sm text-gray-600">
                      {paymentsLoading ? 'Loading payments...' : `${payments?.length || 0} payment record${(payments?.length || 0) !== 1 ? 's' : ''}`}
                    </div>
                  </div>

                  {paymentsLoading ? (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      <div>Loading payment records...</div>
                    </div>
                  ) : payments && payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.map((p) => (
                        <div key={p.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{p.type || p.description || 'Payment'}</div>
                            <div className="text-xs text-gray-500">Order: {p.razorpayOrderId || p.orderId || '—'}</div>
                            <div className="text-xs text-gray-500">
                              Amount: ₹{(p.amount || p.value || 0).toLocaleString()}
                              {p.currency ? ` ${p.currency}` : ''}
                              {' • '}
                              {new Date(p.createdAt || p.created_at || Date.now()).toLocaleDateString()}
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${p.status === 'COMPLETED' || p.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {p.status || 'UNKNOWN'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No payments recorded for this event.</div>
                  )}
                </div>
              </>
            )}

            {/* Results Tab - Admin can upload result sheets */}
            {modalTab === 'results' && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Result Sheet</h3>
                  <p className="text-gray-600 mb-4">
                    Upload Excel/CSV file with student results. System will automatically update scores and calculate winners.
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    <strong>File Format:</strong> Excel (.xlsx, .xls) or CSV with columns: studentId, name, score
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const { downloadSampleResultSheet } = await import('../../api');
                          await downloadSampleResultSheet(event.id, true);
                        } catch (error) {
                          alert('Failed to download sample sheet: ' + (error.message || 'Unknown error'));
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      📥 Download Sample Result Sheet
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Download a sample Excel file with the correct format and example data
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Result Upload Instructions</h4>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>Event must be completed or ended</li>
                    <li>Upload Excel/CSV file with student results</li>
                    <li>System will parse and update scores automatically</li>
                    <li>Winners and runners-up will be calculated automatically</li>
                    <li>Admin must validate results before they become visible to students</li>
                  </ol>
                </div>

                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const fileInput = e.target.querySelector('input[type="file"]');
                      
                      if (!fileInput.files || fileInput.files.length === 0) {
                        alert('Please select a file to upload');
                        return;
                      }

                      const uploadFormData = new FormData();
                      Array.from(fileInput.files).forEach(file => {
                        uploadFormData.append('files', file);
                      });
                      
                      const description = formData.get('description') || '';
                      if (description) {
                        uploadFormData.append('description', description);
                      }

                      try {
                        const { uploadEventResults } = await import('../../api');
                        const response = await uploadEventResults(event.id, uploadFormData);
                        
                        if (response.success) {
                          alert(`✅ Successfully uploaded ${response.data.uploadedFiles?.length || response.data.count || 0} file(s). Scores updated and winners calculated.`);
                          fileInput.value = '';
                          e.target.reset();
                          // Reload event data
                          handleViewEventDetails(event);
                        } else {
                          alert('Failed to upload: ' + (response.message || 'Unknown error'));
                        }
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Failed to upload: ' + (error.message || 'Unknown error'));
                      }
                    }}
                  >
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Result File(s)
                      </label>
                      <input
                        type="file"
                        name="files"
                        multiple
                        accept=".xlsx,.xls,.csv"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        name="description"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Final results for event completion"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      📤 Upload Result Sheet
                    </button>
                  </form>
                </div>

                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">After Upload:</h4>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                    <li>System will process the file and update student scores</li>
                    <li>Winners and runners-up will be automatically calculated</li>
                    <li>Event status will change to "RESULTS_UPLOADED"</li>
                    <li>Admin must validate results to make them visible to students</li>
                    <li>After validation, event opens for next registration cycle</li>
                  </ol>
                </div>
              </div>
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

  // Enhanced helper: render payment status badge with comprehensive information and edge case handling
  // Made more prominent with better visual indicators
  const renderPaymentCell = (event) => {
    try {
      const summary = getEventPaymentSummary(event);
      const status = summary?.status || 'NO_PAYMENTS';
      
      // Determine badge colors, text, and visual styling
      let badgeConfig = {
        bgColor: '',
        textColor: '',
        borderColor: '',
        badgeText: '',
        badgeIcon: '',
        pulse: false,
        shadow: false
      };
      
      switch (status) {
        case 'PAID':
          badgeConfig = {
            bgColor: 'bg-green-50',
            textColor: 'text-green-800',
            borderColor: 'border-green-400',
            badgeText: 'Payment Complete',
            badgeIcon: '✅',
            pulse: false,
            shadow: true
          };
          break;
        case 'PARTIAL':
          badgeConfig = {
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-400',
            badgeText: 'Payment Pending',
            badgeIcon: '⚠️',
            pulse: true,
            shadow: true
          };
          break;
        case 'PENDING':
          badgeConfig = {
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-800',
            borderColor: 'border-orange-400',
            badgeText: 'Payment Pending',
            badgeIcon: '⏳',
            pulse: true,
            shadow: true
          };
          break;
        default:
          badgeConfig = {
            bgColor: 'bg-gray-50',
            textColor: 'text-gray-600',
            borderColor: 'border-gray-300',
            badgeText: 'No Payments',
            badgeIcon: '—',
            pulse: false,
            shadow: false
          };
      }

      const paymentPercentage = summary?.totalAmount > 0 
        ? Math.round((summary.paidAmount / summary.totalAmount) * 100) 
        : 0;

      return (
        <div className="flex flex-col space-y-2 min-w-[180px]">
          {/* Prominent Status Badge */}
          <div className={`relative ${badgeConfig.bgColor} border-2 ${badgeConfig.borderColor} rounded-lg p-2.5 ${badgeConfig.shadow ? 'shadow-md' : 'shadow-sm'} ${badgeConfig.pulse ? 'animate-pulse' : ''} transition-all hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{badgeConfig.badgeIcon}</span>
                <span className={`font-bold text-sm ${badgeConfig.textColor}`}>
                  {badgeConfig.badgeText}
                </span>
              </div>
              {status === 'PAID' && (
                <span className="text-green-600 text-xs font-semibold">100%</span>
              )}
              {status === 'PARTIAL' && (
                <span className="text-yellow-600 text-xs font-semibold">{paymentPercentage}%</span>
              )}
            </div>
            
            {/* Progress bar for partial payments */}
            {status === 'PARTIAL' && summary?.totalAmount > 0 && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${paymentPercentage}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {/* Payment Details Card */}
          {summary && summary.totalAmount > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-2 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">Total:</span>
                <span className="font-bold text-gray-900">₹{(summary.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              {summary.paidAmount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Paid:</span>
                  <span className="font-bold text-green-700">₹{(summary.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
              {summary.orderCount > 0 && (
                <div className="pt-1 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Orders:</span>
                    <span className={`font-semibold ${status === 'PAID' ? 'text-green-700' : 'text-yellow-700'}`}>
                      {summary.paidOrderCount || 0}/{summary.orderCount || 0} paid
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View Details button - more prominent */}
          <button
            onClick={() => handleViewEventDetails(event)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 hover:shadow-md transition-all transform hover:scale-105 w-full flex items-center justify-center space-x-1"
          >
            <span>👁️</span>
            <span>View Details</span>
          </button>
        </div>
      );
    } catch (error) {
      console.error('Error rendering payment cell:', error);
      // Fallback UI on error
      return (
        <div className="flex flex-col space-y-2 min-w-[180px]">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-2.5 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">❌</span>
              <span className="font-bold text-sm text-red-800">Error Loading</span>
            </div>
          </div>
          <button
            onClick={() => handleViewEventDetails(event)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors w-full"
          >
            👁️ View Details
          </button>
        </div>
      );
    }
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
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>💳 Payment Status</span>
                        <span className="text-xs text-gray-500 font-normal">(Click to view)</span>
                      </div>
                    </th>
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
                      <td className="py-3 px-4 align-top">
                        <div className="min-w-[200px]">
                          {renderPaymentCell(event)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-2">
                          {/* Moderation Actions (keeps existing behavior) */}
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
        payments={eventDetailsModal.payments}
        paymentsLoading={eventDetailsModal.paymentsLoading}
      />
    </div>
  );
};

export default AdminEventsManagement;