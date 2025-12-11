import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAdminEvents, moderateEvent, getEventParticipants, getEventPayments, getGlobalPaymentSettings, updateGlobalPaymentSettings, updateEventAssignments, getEventAssignments, updateEventPermissions, getAllUsers } from '../../api';
import ParticipantsModal from '../../components/ParticipantsModal';
import AdminCertificateIssuance from '../../components/AdminCertificateIssuance';

const AdminEventsManagement = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [moderatingEventId, setModeratingEventId] = useState(null);
  const [error, setError] = useState(null);
  
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
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [globalPaymentSettings, setGlobalPaymentSettings] = useState({ perStudentBaseCharge: '', defaultEventFee: '' });
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [assignmentForm, setAssignmentForm] = useState({ eventId: '', userId: '', role: 'INCHARGE' });
  const [assignmentMsg, setAssignmentMsg] = useState('');
  const [assignmentErr, setAssignmentErr] = useState('');
  const [permissionForm, setPermissionForm] = useState({
    eventId: '',
    role: 'INCHARGE',
    resultUpload: false,
    studentManagement: false,
    certificateManagement: false,
    feeManagement: false
  });
  const [permissionMsg, setPermissionMsg] = useState('');
  const [permissionErr, setPermissionErr] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userListLimit, setUserListLimit] = useState(200);
  const [assigningEventId, setAssigningEventId] = useState('');
  const [assignmentEventIdSearch, setAssignmentEventIdSearch] = useState('');
  const [permissionEventIdSearch, setPermissionEventIdSearch] = useState('');
  const [userUniqueIdSearch, setUserUniqueIdSearch] = useState('');
  const [userSearchResult, setUserSearchResult] = useState(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [existingAssignments, setExistingAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const assignmentRef = useRef(null);

  // Load analytics when results tab is opened
  useEffect(() => {
    if (modalTab === 'results' && eventDetailsModal.event) {
      loadAnalytics(eventDetailsModal.event.id);
    }
  }, [modalTab, eventDetailsModal.event]);

  const loadAnalytics = async (eventId) => {
    try {
      setAnalyticsLoading(true);
      const { getEventResultAnalytics } = await import('../../api');
      const response = await getEventResultAnalytics(eventId);
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
    fetchGlobalSettings();
    fetchAllUsers();
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
      setError(null);
      console.log('🔄 Fetching admin events...');
      const response = await getAdminEvents();
      console.log('📦 Admin events API response:', response);
      
      if (response && response.success) {
        // Handle different response formats
        const eventsData = response.data?.events || response.data || [];
        console.log(`✅ Received ${eventsData.length} events`);
        
        if (Array.isArray(eventsData)) {
          setEvents(eventsData);
        } else {
          console.warn('⚠️  Events data is not an array:', eventsData);
          setEvents([]);
          setError('Invalid response format from server');
        }
      } else {
        const errorMsg = response?.message || 'Failed to fetch events';
        console.error('❌ API returned error:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to load events. Please try again.';
      setError(errorMessage);
      setEvents([]); // Clear events on error
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const res = await getGlobalPaymentSettings();
      if (res?.success) {
        const data = res.data || {};
        setGlobalPaymentSettings({
          perStudentBaseCharge: data.perStudentBaseCharge ?? '',
          defaultEventFee: data.defaultEventFee ?? '',
          coordinatorSubscriptionFee: data.coordinatorSubscriptionFee ?? ''
        });
      }
    } catch (err) {
      console.error('Error fetching global payment settings:', err);
      setGlobalError(err?.message || 'Failed to load global payment settings');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await getAllUsers({ page: 1, limit: userListLimit });
      if (res?.success) {
        setAllUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users for assignment:', err);
    }
  };

  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userListLimit]);

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

  const handleGlobalSettingsSave = async (e) => {
    e.preventDefault();
    try {
      setSavingGlobal(true);
      setGlobalMessage('');
      setGlobalError('');
      const payload = {
        perStudentBaseCharge: Number(globalPaymentSettings.perStudentBaseCharge) || 0,
        defaultEventFee: Number(globalPaymentSettings.defaultEventFee) || 0,
        coordinatorSubscriptionFee: Number(globalPaymentSettings.coordinatorSubscriptionFee) || 0
      };
      const res = await updateGlobalPaymentSettings(payload);
      if (res?.success) {
        setGlobalMessage('Global payment settings saved.');
      } else {
        setGlobalError(res?.message || 'Failed to save global payment settings.');
      }
    } catch (err) {
      console.error('Error saving global payment settings:', err);
      setGlobalError(err?.message || 'Failed to save global payment settings.');
    } finally {
      setSavingGlobal(false);
    }
  };

  const loadEventAssignments = async (eventId) => {
    if (!eventId) return;
    try {
      setLoadingAssignments(true);
      const res = await getEventAssignments(eventId);
      if (res?.success) {
        setExistingAssignments(res.data || []);
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
      setExistingAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignmentMsg('');
    setAssignmentErr('');
    
    // Validation
    if (!assignmentForm.eventId) {
      setAssignmentErr('Please select an event.');
      return;
    }
    if (!assignmentForm.userId) {
      setAssignmentErr('Please select a user.');
      return;
    }
    if (!assignmentForm.role) {
      setAssignmentErr('Please select a role.');
      return;
    }

    // Check if this assignment already exists
    const existing = existingAssignments.find(
      a => a.userId === assignmentForm.userId && a.role === assignmentForm.role
    );
    if (existing) {
      setAssignmentErr('This user is already assigned to this event with this role.');
      return;
    }

    try {
      setAssigningEventId(assignmentForm.eventId);
      // Use 'add' mode to add assignment without removing existing ones
      const res = await updateEventAssignments(assignmentForm.eventId, [
        { userId: assignmentForm.userId, role: assignmentForm.role }
      ], 'add');
      if (res?.success) {
        const selectedUser = allUsers.find(u => u.id === assignmentForm.userId);
        const selectedEvent = events.find(e => e.id === assignmentForm.eventId);
        setAssignmentMsg(
          `✓ Successfully assigned ${selectedUser?.name || selectedUser?.email || 'User'} as ${assignmentForm.role} to "${selectedEvent?.name || 'Event'}". ` +
          `Don't forget to set permissions for this role!`
        );
        // Clear form but keep event selected
        setAssignmentForm(prev => ({ eventId: prev.eventId, userId: '', role: 'INCHARGE' }));
        setUserSearch('');
        setUserUniqueIdSearch('');
        setUserSearchResult(null);
        setAssignmentEventIdSearch('');
        // Reload assignments to show updated list
        await loadEventAssignments(assignmentForm.eventId);
        // Clear success message after 5 seconds
        setTimeout(() => setAssignmentMsg(''), 5000);
      } else {
        setAssignmentErr(res?.message || 'Failed to save assignment.');
      }
    } catch (err) {
      console.error('Assignment error:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to save assignment.';
      setAssignmentErr(errorMsg);
    } finally {
      setAssigningEventId('');
    }
  };

  const handlePermissionSubmitWithClose = async (e) => {
    await handlePermissionSubmit(e);
    // Close modal after successful save (with delay to show success message)
    if (permissionMsg && !permissionErr) {
      setTimeout(() => {
        if (permissionMsg && !permissionErr) {
          setShowPermissionModal(false);
        }
      }, 2000);
    }
  };

  const handleAssignClick = async (eventId) => {
    setAssignmentForm(prev => ({ ...prev, eventId }));
    setAssignmentEventIdSearch('');
    setUserUniqueIdSearch('');
    setUserSearch('');
    setUserSearchResult(null);
    setExistingAssignments([]);
    setAssignmentMsg('');
    setAssignmentErr('');
    // Load existing assignments for this event
    await loadEventAssignments(eventId);
    // Open the modal
    setShowAssignmentModal(true);
  };

  const handleRemoveAssignment = async (eventId, assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }
    try {
      // Get current assignments, remove the one to delete, and replace all
      const currentAssignments = existingAssignments.filter(a => a.id !== assignmentId);
      const assignmentsToKeep = currentAssignments.map(a => ({
        userId: a.userId,
        role: a.role
      }));
      
      const res = await updateEventAssignments(eventId, assignmentsToKeep, 'replace');
      if (res?.success) {
        setAssignmentMsg('Assignment removed successfully.');
        await loadEventAssignments(eventId);
      } else {
        setAssignmentErr(res?.message || 'Failed to remove assignment.');
      }
    } catch (err) {
      setAssignmentErr(err?.message || 'Failed to remove assignment.');
    }
  };

  const handlePermissionClick = (eventId) => {
    setPermissionForm(prev => ({ ...prev, eventId }));
    setPermissionEventIdSearch('');
    setPermissionMsg('');
    setPermissionErr('');
    // Open the modal
    setShowPermissionModal(true);
  };

  // Auto-select event by uniqueId search
  const handleEventIdSearch = (searchValue, formType) => {
    if (formType === 'assignment') {
      setAssignmentEventIdSearch(searchValue);
      if (searchValue.trim()) {
        const foundEvent = events.find(e => 
          e.uniqueId?.toLowerCase() === searchValue.toLowerCase().trim() ||
          e.id === searchValue.trim()
        );
        if (foundEvent) {
          setAssignmentForm(prev => ({ ...prev, eventId: foundEvent.id }));
        }
      }
    } else if (formType === 'permission') {
      setPermissionEventIdSearch(searchValue);
      if (searchValue.trim()) {
        const foundEvent = events.find(e => 
          e.uniqueId?.toLowerCase() === searchValue.toLowerCase().trim() ||
          e.id === searchValue.trim()
        );
        if (foundEvent) {
          setPermissionForm(prev => ({ ...prev, eventId: foundEvent.id }));
        }
      }
    }
  };

  // Auto-select user by uniqueId search
  const handleUserUniqueIdSearch = async (uniqueId) => {
    setUserUniqueIdSearch(uniqueId);
    setUserSearchResult(null);
    
    if (!uniqueId.trim()) {
      return;
    }

    try {
      setSearchingUser(true);
      const { getUserByUniqueId } = await import('../../api');
      const response = await getUserByUniqueId(uniqueId.trim());
      
      if (response?.success && response?.data) {
        setUserSearchResult(response.data);
        setAssignmentForm(prev => ({ ...prev, userId: response.data.id }));
      } else {
        setUserSearchResult({ error: 'User not found' });
      }
    } catch (err) {
      console.error('Error searching user:', err);
      setUserSearchResult({ error: err?.message || 'Failed to search user' });
    } finally {
      setSearchingUser(false);
    }
  };

  const handlePermissionSubmit = async (e) => {
    e.preventDefault();
    setPermissionMsg('');
    setPermissionErr('');
    if (!permissionForm.eventId) {
      setPermissionErr('Please select an event.');
      return;
    }
    
    // Check if at least one permission is selected
    const hasAnyPermission = permissionForm.resultUpload || 
                            permissionForm.studentManagement || 
                            permissionForm.certificateManagement || 
                            permissionForm.feeManagement;
    
    if (!hasAnyPermission) {
      setPermissionErr('Please select at least one permission.');
      return;
    }

    try {
      const payload = [{
        role: permissionForm.role,
        resultUpload: !!permissionForm.resultUpload,
        studentManagement: !!permissionForm.studentManagement,
        certificateManagement: !!permissionForm.certificateManagement,
        feeManagement: !!permissionForm.feeManagement
      }];
      const res = await updateEventPermissions(permissionForm.eventId, payload);
      if (res?.success) {
        const selectedEvent = events.find(e => e.id === permissionForm.eventId);
        const permissionsList = [];
        if (permissionForm.resultUpload) permissionsList.push('Result Upload');
        if (permissionForm.studentManagement) permissionsList.push('Student Management');
        if (permissionForm.certificateManagement) permissionsList.push('Certificate Management');
        if (permissionForm.feeManagement) permissionsList.push('Fee Management');
        
        setPermissionMsg(
          `✓ Permissions saved for ${permissionForm.role} role on "${selectedEvent?.name || 'Event'}". ` +
          `Granted: ${permissionsList.join(', ')}`
        );
        // Clear success message after 5 seconds
        setTimeout(() => setPermissionMsg(''), 5000);
      } else {
        setPermissionErr(res?.message || 'Failed to save permissions.');
      }
    } catch (err) {
      console.error('Permission error:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to save permissions.';
      setPermissionErr(errorMsg);
    }
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

      // Payments - Enhanced error handling
      if (paymentsResponse.status === 'fulfilled') {
        try {
          const responseValue = paymentsResponse.value;
        let paymentsList = [];
          
          // Handle different response shapes
          if (responseValue?.success && responseValue?.data) {
            // Standard API response: { success: true, data: { payments: [...] } }
            paymentsList = responseValue.data.payments || responseValue.data || [];
          } else if (Array.isArray(responseValue)) {
            // Direct array response
            paymentsList = responseValue;
          } else if (responseValue?.payments && Array.isArray(responseValue.payments)) {
            // Wrapped in payments key
            paymentsList = responseValue.payments;
          } else if (responseValue?.data?.payments && Array.isArray(responseValue.data.payments)) {
            // Nested data.payments
            paymentsList = responseValue.data.payments;
          }

          console.log('✅ Payments loaded:', paymentsList.length || 0, paymentsList);
        setEventDetailsModal(prev => ({
          ...prev,
          payments: paymentsList,
          paymentsLoading: false
        }));
        } catch (paymentError) {
          console.error('Error processing payments:', paymentError);
          setEventDetailsModal(prev => ({ ...prev, payments: [], paymentsLoading: false }));
        }
      } else {
        console.warn('Payments fetch failed:', paymentsResponse);
        const errorReason = paymentsResponse.reason?.message || paymentsResponse.reason || 'Unknown error';
        console.error('Payment fetch error:', errorReason);
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
            <button
              onClick={() => setModalTab('payments')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                modalTab === 'payments'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💳 Payments ({payments?.length || 0})
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

                {/* Payments Summary in Details Tab */}
                <div className="px-6 py-5 bg-white border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></div>
                      <h4 className="text-lg font-bold text-gray-900">Payments Summary</h4>
                    </div>
                    <button
                      onClick={() => setModalTab('payments')}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View All Payments →
                    </button>
                  </div>

                  {paymentsLoading ? (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      <div>Loading payment records...</div>
                    </div>
                  ) : payments && payments.length > 0 ? (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                          <div className="text-xs text-gray-600 mb-1">Total Payments</div>
                          <div className="text-lg font-bold text-gray-900">{payments.length}</div>
                            </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Total Amount</div>
                          <div className="text-lg font-bold text-green-600">
                            ₹{payments.reduce((sum, p) => sum + (parseFloat(p.amount || p.value || 0)), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Completed</div>
                          <div className="text-lg font-bold text-green-600">
                            {payments.filter(p => p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID').length}
                        </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Pending</div>
                          <div className="text-lg font-bold text-yellow-600">
                            {payments.filter(p => p.status === 'PENDING' || p.status === 'CREATED').length}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setModalTab('payments')}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Click to view detailed payment records →
                      </button>
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
                          // Reload event data and analytics
                          handleViewEventDetails(event);
                          loadAnalytics(event.id);
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

                {/* Analytics Section */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Result Analytics & Predictions</h3>
                    <button
                      onClick={() => loadAnalytics(event.id)}
                      disabled={analyticsLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {analyticsLoading ? 'Loading...' : '🔄 Refresh'}
                    </button>
                  </div>

                  {analyticsLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Loading analytics...</p>
                    </div>
                  ) : analytics ? (
                    <div className="space-y-6">
                      {/* Statistics */}
                      {analytics.statistics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-blue-600 font-medium">Total Participants</p>
                            <p className="text-2xl font-bold text-blue-900">{analytics.statistics.totalParticipants || 0}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-sm text-green-600 font-medium">With Scores</p>
                            <p className="text-2xl font-bold text-green-900">{analytics.statistics.participantsWithScores || 0}</p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <p className="text-sm text-yellow-600 font-medium">Without Scores</p>
                            <p className="text-2xl font-bold text-yellow-900">{analytics.statistics.participantsWithoutScores || 0}</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <p className="text-sm text-purple-600 font-medium">Completion Rate</p>
                            <p className="text-2xl font-bold text-purple-900">{analytics.statistics.completionRate || '0%'}</p>
                          </div>
                        </div>
                      )}

                      {/* Winners */}
                      {analytics.winners && analytics.winners.length > 0 && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            🏆 Winners (Top 3)
                          </h4>
                          <div className="space-y-3">
                            {analytics.winners.map((winner, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-yellow-200 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                    winner.placement === 1 ? 'bg-yellow-500' : winner.placement === 2 ? 'bg-gray-400' : 'bg-orange-600'
                                  }`}>
                                    {winner.placement}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{winner.studentName}</p>
                                    {winner.studentUniqueId && (
                                      <p className="text-xs text-gray-500">ID: {winner.studentUniqueId}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">Score: {winner.score?.toFixed(2) || 'N/A'}</p>
                                  {winner.sport && (
                                    <p className="text-xs text-gray-500">{winner.sport}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Predicted Winners */}
                      {analytics.predictedWinners && analytics.predictedWinners.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            🔮 Predicted Winners
                          </h4>
                          <div className="space-y-3">
                            {analytics.predictedWinners.map((prediction, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
                                      {prediction.predictedPlacement}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">{prediction.studentName}</p>
                                      {prediction.studentUniqueId && (
                                        <p className="text-xs text-gray-500">ID: {prediction.studentUniqueId}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {prediction.currentScore !== null && (
                                      <p className="text-lg font-bold text-gray-900">Score: {prediction.currentScore?.toFixed(2) || 'N/A'}</p>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      prediction.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                      prediction.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {prediction.confidence} confidence
                                    </span>
                                    {prediction.note && (
                                      <p className="text-xs text-gray-500 mt-1">{prediction.note}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Score Statistics */}
                      {analytics.scoreStatistics && (
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">📊 Score Statistics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Minimum</p>
                              <p className="text-xl font-bold text-gray-900">{analytics.scoreStatistics.min?.toFixed(2) || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Maximum</p>
                              <p className="text-xl font-bold text-gray-900">{analytics.scoreStatistics.max?.toFixed(2) || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Average</p>
                              <p className="text-xl font-bold text-gray-900">{analytics.scoreStatistics.avg?.toFixed(2) || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Median</p>
                              <p className="text-xl font-bold text-gray-900">{analytics.scoreStatistics.median?.toFixed(2) || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ties */}
                      {analytics.ties && analytics.ties.length > 0 && (
                        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">⚠️ Tied Scores</h4>
                          <div className="space-y-2">
                            {analytics.ties.map((tie, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-orange-200">
                                <p className="font-semibold text-gray-900">
                                  Score: {tie.score?.toFixed(2)} - {tie.count} participant{tie.count !== 1 ? 's' : ''}
                                </p>
                                <div className="mt-2 text-sm text-gray-600">
                                  {tie.students.map((s, i) => (
                                    <span key={i}>
                                      {s.studentName} (Place: {s.placement || 'N/A'}){i < tie.students.length - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No Results Message */}
                      {(!analytics.winners || analytics.winners.length === 0) && 
                       (!analytics.predictedWinners || analytics.predictedWinners.length === 0) && 
                       (!analytics.statistics || analytics.statistics.participantsWithScores === 0) && (
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                          <p className="text-gray-600">No results uploaded yet. Upload a result sheet to see analytics and predictions.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                      <p className="text-gray-600">Click "Refresh" to load analytics.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Certificates Tab */}
            {modalTab === 'certificates' && (
              <div className="p-6">
                <AdminCertificateIssuance event={event} onSuccess={closeEventDetailsModal} />
              </div>
            )}

            {/* Payments Tab */}
            {modalTab === 'payments' && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Event Payments</h3>
                  <p className="text-gray-600">
                    All payment records for this event including registration fees, event fees, and other transactions.
                  </p>
                </div>

                {paymentsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <span className="text-gray-600 font-medium">Loading payments...</span>
                  </div>
                ) : payments && payments.length > 0 ? (
                  <div className="space-y-4">
                    {/* Payment Summary */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-gray-600 mb-1">Total Payments</div>
                          <div className="text-2xl font-bold text-gray-900">{payments.length}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                          <div className="text-2xl font-bold text-green-600">
                            ₹{payments.reduce((sum, p) => sum + (parseFloat(p.amount || p.value || 0)), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-gray-600 mb-1">Completed</div>
                          <div className="text-2xl font-bold text-green-600">
                            {payments.filter(p => p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID').length}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-gray-600 mb-1">Pending</div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {payments.filter(p => p.status === 'PENDING' || p.status === 'CREATED').length}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payments List */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment Details
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map((payment) => (
                              <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {payment.type || payment.description || 'Payment'}
                                  </div>
                                  {payment.userId && (
                                    <div className="text-xs text-gray-500">User ID: {payment.userId}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-mono">
                                    {payment.razorpayOrderId || payment.orderId || payment.id || '—'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-semibold text-gray-900">
                                    ₹{(parseFloat(payment.amount || payment.value || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  {payment.currency && payment.currency !== 'INR' && (
                                    <div className="text-xs text-gray-500">{payment.currency}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {new Date(payment.createdAt || payment.created_at || Date.now()).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(payment.createdAt || payment.created_at || Date.now()).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    payment.status === 'COMPLETED' || payment.status === 'SUCCESS' || payment.status === 'PAID'
                                      ? 'bg-green-100 text-green-800'
                                      : payment.status === 'PENDING' || payment.status === 'CREATED'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : payment.status === 'FAILED' || payment.status === 'CANCELLED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {payment.status || 'UNKNOWN'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">No Payments Yet</h4>
                    <p className="text-gray-600">No payment records found for this event.</p>
                  </div>
                )}
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
    <>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div id="assignment-section" ref={assignmentRef} className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Events Management</h1>
              <p className="text-gray-600 mt-1">
                Manage all events, approve/reject submissions, assign events, set permissions, and issue certificates
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/admin/settings/global-payments"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm flex items-center space-x-2"
              >
                <span>💰</span>
                <span>Payment Settings</span>
              </Link>
            <Link
              to="/admin/dashboard"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            </div>
          </div>
        </div>

        {/* Global payment settings quick edit */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Payment Settings (Quick)</h3>
          <form onSubmit={handleGlobalSettingsSave} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per-Student Base Charge (₹)
              </label>
              <input
                type="number"
                value={globalPaymentSettings.perStudentBaseCharge}
                onChange={(e) =>
                  setGlobalPaymentSettings((prev) => ({
                    ...prev,
                    perStudentBaseCharge: e.target.value
                  }))
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Event Fee (₹) — fallback
              </label>
              <input
                type="number"
                value={globalPaymentSettings.defaultEventFee}
                onChange={(e) =>
                  setGlobalPaymentSettings((prev) => ({
                    ...prev,
                    defaultEventFee: e.target.value
                  }))
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coordinator Subscription Fee (₹)
              </label>
              <input
                type="number"
                value={globalPaymentSettings.coordinatorSubscriptionFee}
                onChange={(e) =>
                  setGlobalPaymentSettings((prev) => ({
                    ...prev,
                    coordinatorSubscriptionFee: e.target.value
                  }))
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                step="0.01"
                placeholder="One-time registration fee"
              />
              <p className="text-xs text-gray-500 mt-1">One-time registration fee</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={savingGlobal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60"
              >
                {savingGlobal ? 'Saving...' : 'Save'}
              </button>
              {globalMessage && <span className="text-green-600 text-sm">{globalMessage}</span>}
              {globalError && <span className="text-red-600 text-sm">{globalError}</span>}
            </div>
            <div className="text-right">
              <Link
                to="/admin/settings/global-payments"
                className="inline-flex items-center text-sm text-indigo-700 hover:text-indigo-900 underline"
              >
                Full settings
              </Link>
            </div>
          </form>
        </div>

        {/* Assignment and Permissions - Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Event Management</h3>
              <p className="text-sm text-gray-600 mt-1">Assign events to users and manage permissions</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setAssignmentForm({ eventId: '', userId: '', role: 'INCHARGE' });
                  setAssignmentEventIdSearch('');
                  setUserUniqueIdSearch('');
                  setUserSearch('');
                  setUserSearchResult(null);
                  setExistingAssignments([]);
                  setAssignmentMsg('');
                  setAssignmentErr('');
                  setShowAssignmentModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>👤</span>
                <span>Assign Event to User</span>
              </button>
              <button
                onClick={() => {
                  setPermissionForm({
                    eventId: '',
                    role: 'INCHARGE',
                    resultUpload: false,
                    studentManagement: false,
                    certificateManagement: false,
                    feeManagement: false
                  });
                  setPermissionEventIdSearch('');
                  setPermissionMsg('');
                  setPermissionErr('');
                  setShowPermissionModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>🔐</span>
                <span>Set Permissions</span>
              </button>
            </div>
          </div>
        </div>

        {/* Assignment Modal */}
        {showAssignmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-xl flex-shrink-0 flex items-center justify-between">
                <h3 className="text-xl font-bold">Assign Event to User</h3>
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setAssignmentForm({ eventId: '', userId: '', role: 'INCHARGE' });
                    setAssignmentEventIdSearch('');
                    setUserUniqueIdSearch('');
                    setUserSearch('');
                    setUserSearchResult(null);
                    setExistingAssignments([]);
                    setAssignmentMsg('');
                    setAssignmentErr('');
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {/* Assignment Form Content */}
                <div ref={assignmentRef}>
                  {/* Existing Assignments */}
                  {assignmentForm.eventId && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Current Assignments</h4>
                        {loadingAssignments && <span className="text-xs text-gray-500">Loading...</span>}
                      </div>
                      {existingAssignments.length > 0 ? (
                        <div className="space-y-2">
                          {existingAssignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {assignment.user?.name || assignment.user?.email || 'Unknown User'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Role: {assignment.role} • {assignment.user?.email}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAssignment(assignmentForm.eventId, assignment.id)}
                                className="ml-2 text-red-600 hover:text-red-800 text-xs font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No assignments yet. Add one below.</p>
                      )}
                    </div>
                  )}
               
              <form onSubmit={handleAssignSubmit} className="space-y-3">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event <span className="text-gray-500 text-xs">(or search by Event ID)</span>
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Type Event ID/Unique ID to auto-select"
                          value={assignmentEventIdSearch}
                          onChange={(e) => handleEventIdSearch(e.target.value, 'assignment')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                  <select
                    value={assignmentForm.eventId}
                          onChange={(e) => {
                            setAssignmentForm(prev => ({ ...prev, eventId: e.target.value }));
                            setAssignmentEventIdSearch('');
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    name="eventId"
                  >
                          <option value="">Select event from dropdown</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                              {ev.name} ({ev.sport}) — {ev.city} {ev.uniqueId ? `[${ev.uniqueId}]` : ''}
                      </option>
                    ))}
                  </select>
                        {assignmentForm.eventId && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                            ✓ Selected: {events.find(e => e.id === assignmentForm.eventId)?.name || 'Event'}
                          </div>
                        )}
                      </div>
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User <span className="text-gray-500 text-xs">(or search by Unique ID)</span>
                      </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                          placeholder="Type User Unique ID to auto-select"
                          value={userUniqueIdSearch}
                          onChange={(e) => handleUserUniqueIdSearch(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          disabled={searchingUser}
                        />
                        {searchingUser && (
                          <div className="text-xs text-blue-600">Searching...</div>
                        )}
                        {userSearchResult && (
                          <div className={`text-xs p-2 rounded ${
                            userSearchResult.error 
                              ? 'text-red-600 bg-red-50' 
                              : 'text-green-600 bg-green-50'
                          }`}>
                            {userSearchResult.error || `✓ Found: ${userSearchResult.name || userSearchResult.email} (${userSearchResult.role})`}
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder="Or search user by name/email/phone"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <select
                      value={assignmentForm.userId}
                          onChange={(e) => {
                            setAssignmentForm(prev => ({ ...prev, userId: e.target.value }));
                            setUserUniqueIdSearch('');
                            setUserSearchResult(null);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select user from dropdown</option>
                      {allUsers
                        .filter(u => {
                          if (!userSearch.trim()) return true;
                          const term = userSearch.toLowerCase();
                          return (
                            (u.name || '').toLowerCase().includes(term) ||
                            (u.email || '').toLowerCase().includes(term) ||
                                (u.phone || '').toLowerCase().includes(term) ||
                                (u.uniqueId || '').toLowerCase().includes(term)
                          );
                        })
                        .map(u => (
                          <option key={u.id} value={u.id}>
                                {u.name || u.email || u.phone} ({u.role}) {u.uniqueId ? `[${u.uniqueId}]` : ''}
                          </option>
                        ))}
                    </select>
                        {assignmentForm.userId && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                            ✓ Selected: {allUsers.find(u => u.id === assignmentForm.userId)?.name || 'User'}
                          </div>
                        )}
                    {allUsers.length >= userListLimit && (
                      <button
                        type="button"
                        onClick={() => setUserListLimit(prev => prev + 200)}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Load more users
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={assignmentForm.role}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="INCHARGE">INCHARGE</option>
                    <option value="COORDINATOR">COORDINATOR</option>
                    <option value="TEAM">TEAM</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60"
                  >
                    {assigningEventId === assignmentForm.eventId ? 'Saving...' : 'Save Assignment'}
                  </button>
                      {assignmentMsg && (
                        <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
                          {assignmentMsg}
                        </div>
                      )}
                      {assignmentErr && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                          {assignmentErr}
                        </div>
                      )}
                    </div>
                 
                    {/* Info Note */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> After assigning a user, make sure to set permissions for their role using the "Set Permissions" button. 
                        Users need both assignment and permissions to access event features.
                      </p>
                </div>
              </form>
            </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end flex-shrink-0">
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setAssignmentForm({ eventId: '', userId: '', role: 'INCHARGE' });
                    setAssignmentEventIdSearch('');
                    setUserUniqueIdSearch('');
                    setUserSearch('');
                    setUserSearchResult(null);
                    setExistingAssignments([]);
                    setAssignmentMsg('');
                    setAssignmentErr('');
                  }}
                  className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-xl flex-shrink-0 flex items-center justify-between">
                <h3 className="text-xl font-bold">Set Permissions</h3>
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    setPermissionForm({
                      eventId: '',
                      role: 'INCHARGE',
                      resultUpload: false,
                      studentManagement: false,
                      certificateManagement: false,
                      feeManagement: false
                    });
                    setPermissionEventIdSearch('');
                    setPermissionMsg('');
                    setPermissionErr('');
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handlePermissionSubmit(e);
                }} className="space-y-3">
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event <span className="text-gray-500 text-xs">(or search by Event ID)</span>
                    </label>
                    <div className="space-y-2">
                  <input
                    type="text"
                        placeholder="Type Event ID/Unique ID to auto-select"
                        value={permissionEventIdSearch}
                        onChange={(e) => handleEventIdSearch(e.target.value, 'permission')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <select
                        value={permissionForm.eventId}
                        onChange={(e) => {
                          setPermissionForm(prev => ({ ...prev, eventId: e.target.value }));
                          setPermissionEventIdSearch('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select event from dropdown</option>
                        {events.map(ev => (
                          <option key={ev.id} value={ev.id}>
                            {ev.name} ({ev.sport}) — {ev.city} {ev.uniqueId ? `[${ev.uniqueId}]` : ''}
                          </option>
                        ))}
                      </select>
                      {permissionForm.eventId && (
                        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                          ✓ Selected: {events.find(e => e.id === permissionForm.eventId)?.name || 'Event'}
                        </div>
                      )}
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={permissionForm.role}
                    onChange={(e) => setPermissionForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="INCHARGE">INCHARGE</option>
                    <option value="COORDINATOR">COORDINATOR</option>
                    <option value="TEAM">TEAM</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={permissionForm.resultUpload}
                      onChange={(e) => setPermissionForm(prev => ({ ...prev, resultUpload: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>Result Upload</span>
                  </label>
                  <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={permissionForm.studentManagement}
                      onChange={(e) => setPermissionForm(prev => ({ ...prev, studentManagement: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>Student Management</span>
                  </label>
                  <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={permissionForm.certificateManagement}
                      onChange={(e) => setPermissionForm(prev => ({ ...prev, certificateManagement: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>Certificate Management</span>
                  </label>
                  <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={permissionForm.feeManagement}
                      onChange={(e) => setPermissionForm(prev => ({ ...prev, feeManagement: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>Fee Management</span>
                  </label>
                </div>

                <div className="flex items-center space-x-3 pt-1">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60"
                  >
                    Save Permissions
                  </button>
                    {permissionMsg && (
                      <div className="text-green-600 text-sm bg-green-50 p-2 rounded flex-1">
                        {permissionMsg}
                      </div>
                    )}
                    {permissionErr && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded flex-1">
                        {permissionErr}
                      </div>
                    )}
                  </div>
                 
                  {/* Info Note */}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <strong>Important:</strong> Permissions are set per role (INCHARGE, COORDINATOR, TEAM). 
                      Users assigned to an event with a specific role will inherit the permissions set for that role. 
                      Make sure to assign users to events first, then set permissions for their roles.
                    </p>
                </div>
              </form>
            </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end flex-shrink-0">
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    setPermissionForm({
                      eventId: '',
                      role: 'INCHARGE',
                      resultUpload: false,
                      studentManagement: false,
                      certificateManagement: false,
                      feeManagement: false
                    });
                    setPermissionEventIdSearch('');
                    setPermissionMsg('');
                    setPermissionErr('');
                  }}
                  className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Close
                </button>
          </div>
        </div>
          </div>
        )}

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
          {error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 max-w-md mx-auto">
                <div className="text-red-600 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Events</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={fetchAllEvents}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : loading ? (
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
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Level</th>
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
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {event.level || 'DISTRICT'}
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
                          {/* Moderation / Assign Actions */}
                          <div className="flex space-x-1 flex-wrap">
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

                            {/* Quick Assign button */}
                            <button
                              type="button"
                              onClick={() => handleAssignClick(event.id)}
                              className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-indigo-700 transition-colors"
                            >
                              Assign
                            </button>
                            {/* Quick Set Permissions button */}
                            <button
                              type="button"
                              onClick={() => handlePermissionClick(event.id)}
                              className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                            >
                              Permissions
                            </button>
                          </div>

                          {/* Certificate Action - Only show when event has ended */}
                          {(() => {
                            const dynamicStatus = getDynamicEventStatus(event);
                            const eventHasEnded = dynamicStatus === 'ENDED';
                            
                            if (!eventHasEnded) return null;
                            
                            return (
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
    </>
  );
};

export default AdminEventsManagement;
