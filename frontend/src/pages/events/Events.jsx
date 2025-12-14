import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EventsList from '../../components/EventsList';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { useNavigate } from 'react-router-dom';
import CheckoutModal from '../../components/CheckoutModal';
import {
  getStudentEvents,
  getCoachEvents,
  getEvents,
  registerForEvent,
  unregisterFromEvent,
  getStudentEventDetails,
  createStudentEventPaymentOrder,
  getMyAssignedEvents
} from '../../api';

/**
 * Events Page
 * Main events listing page with role-based actions
 * Accessible by all user types with appropriate permissions
 */
const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Payment-first flow state (students only)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [pendingEventId, setPendingEventId] = useState(null);
  const [payingEventId, setPayingEventId] = useState(null);

  // Load events on component mount
  useEffect(() => {
    loadEvents();
    if (user?.role === 'STUDENT') {
      loadRazorpayScript();
    }
  }, []);

  const loadRazorpayScript = () => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setRazorpayLoaded(true);
      console.log('✅ Razorpay SDK loaded');
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay SDK');
    };
    document.body.appendChild(script);
  };

  const initiatePaymentFlow = async (eventId, errorMessage = '') => {
    try {
      console.log('💰 Initiating payment flow for event:', eventId, errorMessage);

      // 1) Fetch event details to show in checkout modal
      const eventDetailsResponse = await getStudentEventDetails(eventId);
      const eventDetails = eventDetailsResponse.data || eventDetailsResponse;

      // 2) Create payment order
      const paymentOrderResponse = await createStudentEventPaymentOrder(eventId);
      const orderData = paymentOrderResponse.data || paymentOrderResponse;
      if (!orderData.orderId) {
        throw new Error('Payment order creation failed - no order ID received');
      }

      const feeAmount = orderData.studentFeeAmount || eventDetails.studentFeeAmount || 0;

      setPendingEventId(eventId);
      setCheckoutData({
        title: 'Event Registration Payment',
        description: 'Payment is required to register for this event',
        paymentType: 'registration',
        eventDetails: {
          name: eventDetails.name,
          sport: eventDetails.sport,
          venue: eventDetails.venue,
          startDate: eventDetails.startDate
        },
        items: [{
          name: `Participation fee for ${eventDetails.name}`,
          description: `Event: ${eventDetails.sport} at ${eventDetails.venue}`,
          amount: feeAmount,
          quantity: 1
        }],
        subtotal: feeAmount,
        tax: 0,
        discount: 0,
        total: feeAmount,
        currency: orderData.currency || 'INR',
        orderData,
        event: eventDetails
      });

      setShowCheckout(true);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to initiate payment';
      console.error('❌ Payment flow initiation failed:', e);
      alert(`Payment setup failed: ${msg}`);
      throw e;
    }
  };

  const handleConfirmPayment = async () => {
    if (!checkoutData || !pendingEventId) {
      alert('Payment data is missing. Please try again.');
      return;
    }

    try {
      setPayingEventId(pendingEventId);
      setShowCheckout(false);

      // Ensure Razorpay is ready
      if (!razorpayLoaded && !window.Razorpay) {
        await new Promise((resolve, reject) => {
          const check = setInterval(() => {
            if (window.Razorpay) {
              clearInterval(check);
              setRazorpayLoaded(true);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(check);
            if (!window.Razorpay) reject(new Error('Razorpay SDK failed to load'));
          }, 5000);
        });
      }
      if (!window.Razorpay) throw new Error('Razorpay SDK not loaded. Please refresh and try again.');

      const { orderData, event } = checkoutData;
      const eventId = pendingEventId;

      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const profile = userObj.profile || {};

      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Missing auth token. Please login again.');

      const options = {
        key: orderData.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'STAIRS Talent Hub',
        description: `Participation fee for ${event?.name || 'Event'}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                context: 'student_event_fee',
                eventId
              })
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed');
            }

            alert('Payment successful! You have been registered for the event.');
            setCheckoutData(null);
            setPendingEventId(null);
            setPayingEventId(null);
            await loadEvents();
          } catch (verifyError) {
            console.error('❌ Payment verification failed:', verifyError);
            setPayingEventId(null);
            alert(`Payment verification failed: ${verifyError?.message || 'Unknown error'}`);
          }
        },
        prefill: {
          name: profile.name || userObj.name || '',
          email: userObj.email || '',
          contact: profile.phone || userObj.phone || ''
        },
        theme: { color: '#4F46E5' },
        modal: {
          ondismiss: () => {
            setPayingEventId(null);
          }
        }
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      console.error('❌ Failed to open Razorpay:', e);
      setPayingEventId(null);
      alert(e?.message || 'Failed to open payment gateway. Please try again.');
    }
  };

  const handleCancelCheckout = () => {
    setShowCheckout(false);
    setCheckoutData(null);
    setPendingEventId(null);
    setPayingEventId(null);
  };

  // Load events from API based on user role
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError('');

      console.log('🔄 Loading events for user role:', user?.role);

      let response;
      let loadedEvents = [];
      
      if (user?.role === 'STUDENT') {
        // Students see available events for registration
        console.log('📚 Calling getStudentEvents...');
        response = await getStudentEvents({
          page: 1,
          limit: 50
        });
        console.log('📚 Student events response:', response);
        loadedEvents = response.data?.events || [];
      } else if (user?.role === 'EVENT_INCHARGE') {
        // Event Incharge sees only assigned events
        const assigned = await getMyAssignedEvents();
        const assignments = assigned?.data || assigned || [];
        loadedEvents = Array.isArray(assignments)
          ? assignments.map(a => a.event).filter(Boolean)
          : [];
      } else if (user?.role === 'COACH') {
        // Coaches see their own events
        response = await getCoachEvents({
          page: 1,
          limit: 50
        });
        loadedEvents = response.data?.events || [];
      } else {
        // Admin and others see all events
        response = await getEvents({
          page: 1,
          limit: 50
        });
        loadedEvents = response.data?.events || [];
      }

      console.log('📊 Loaded events count:', loadedEvents.length);
      console.log('📊 First event structure:', loadedEvents[0]);
      
      // Normalize all events to ensure consistent field names for filtering
      const normalizedEvents = loadedEvents.map(event => ({
        ...event,
        name: event.name || event.title || '',
        sport: event.sport || '',
        venue: event.venue || event.location || '',
        city: event.city || '',
        startDate: event.startDate || '',
        endDate: event.endDate || '',
        isRegistered: event.isRegistered || false
      }));
      
      console.log('✅ Normalized events:', normalizedEvents.length);
      console.log('📊 Sample normalized event:', normalizedEvents[0]);
      setEvents(normalizedEvents);

      console.log('✅ Events loaded:', normalizedEvents.length);
      console.log('📊 Sample event for debug:', normalizedEvents[0]);
      
    } catch (err) {
      console.error('❌ Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle event registration
  const handleEventRegister = async (eventId) => {
    try {
      // Payment-first for student + admin-created fee events
      if (user?.role === 'STUDENT') {
        const eventResponse = await getStudentEventDetails(eventId);
        const eventDetails = eventResponse.data || eventResponse;
        const requiresPayment = !!(eventDetails.createdByAdmin && eventDetails.studentFeeEnabled && (eventDetails.studentFeeAmount || 0) > 0);

        if (requiresPayment) {
          await initiatePaymentFlow(eventId, 'Payment required to register for this event');
          return;
        }
      }

      const response = await registerForEvent(eventId);
      if (!response?.success) {
        throw new Error(response?.message || 'Registration failed');
      }
      alert('Successfully registered for the event!');
      loadEvents();
    } catch (err) {
      console.error('Error registering for event:', err);
      const errorData = err?.response?.data || err?.data || {};
      const errorMessage = errorData.message || err?.message || 'Failed to register for event. Please try again.';
      const statusCode = err?.response?.status || err?.statusCode || err?.status;

      // Fallback: if backend indicates payment required, start payment flow
      const isPaymentError = typeof errorMessage === 'string' && (
        errorMessage.toLowerCase().includes('payment required') ||
        errorMessage.toLowerCase().includes('complete payment') ||
        errorMessage.toLowerCase().includes('payment')
      );

      if (user?.role === 'STUDENT' && (isPaymentError || statusCode === 400)) {
        try {
          await initiatePaymentFlow(eventId, errorMessage);
          return;
        } catch (_) {
          // handled inside initiatePaymentFlow
          return;
        }
      }

      alert(errorMessage);
    }
  };

  // Handle event unregistration
  const handleEventUnregister = async (eventId) => {
    if (!window.confirm('Are you sure you want to unregister from this event?')) {
      return;
    }

    try {
      await unregisterFromEvent(eventId);

      // Show success message
      alert('Successfully unregistered from the event!');
      
      // Reload events to update registration status
      loadEvents();
    } catch (err) {
      console.error('Error unregistering from event:', err);
      alert(err.message || 'Failed to unregister from event. Please try again.');
    }
  };

  // Handle event deletion
  const handleEventDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      // Show success message
      alert('Event deleted successfully!');
      
      // Reload events
      loadEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert(err.message || 'Failed to delete event. Please try again.');
    }
  };

  // Handle creating new event
  const handleCreateEvent = () => {
    navigate('/events/create');
  };

  // Handle editing event
  const handleEventEdit = (eventId) => {
    navigate(`/events/${eventId}/edit`);
  };

  // Handle event actions (unified handler for EventsList)
  const handleEventAction = (action, event) => {
    console.log('🎯 Event action triggered:', action);
    console.log('📊 Event details:', { id: event.id, name: event.name });
    console.log('👤 User role:', user?.role);
    
    switch (action) {
      case 'view':
        console.log('🔍 Navigating to event details:', event.id);
        handleEventView(event.id);
        break;
      case 'register':
        handleEventRegister(event.id);
        break;
      case 'unregister':
        handleEventUnregister(event.id);
        break;
      case 'edit':
        if (canManageEvents()) handleEventEdit(event.id);
        break;
      case 'delete':
        if (canManageEvents()) handleEventDelete(event.id);
        break;
      case 'participants':
        if (canManageEvents()) handleViewParticipants(event.id);
        break;
      case 'results':
        if (canManageEvents()) handleUploadResults(event.id);
        break;
      default:
        console.warn('Unknown event action:', action);
    }
  };

  // Handle viewing event details
  const handleEventView = (eventId) => {
    console.log('🚀 Navigating to event details page:', `/events/${eventId}`);
    navigate(`/events/${eventId}`);
  };

  // Handle viewing event participants
  const handleViewParticipants = (eventId) => {
    navigate(`/events/${eventId}/participants`);
  };

  // Handle uploading results
  const handleUploadResults = (eventId) => {
    navigate(`/events/${eventId}/results`);
  };

  // Check if user can create events
  const canCreateEvents = () => {
    return user && ['coach', 'institute', 'club'].includes(user.role);
  };

  // Check if user can manage events
  const canManageEvents = () => {
    return user && ['coach', 'institute', 'club', 'admin'].includes(user.role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              {/* Back button for students */}
              {user?.role === 'STUDENT' && (
                <button
                  onClick={() => navigate('/dashboard/student')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="Back to Dashboard"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Events</h1>
                <p className="text-gray-600 mt-1">
                  Discover and participate in sports events
                </p>
              </div>
            </div>
            
            {canCreateEvents() && (
              <Button
                onClick={handleCreateEvent}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Event
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
        <EventsList
          events={events}
          onEventAction={handleEventAction}
          userRole={user?.role}
          userId={user?.id}
        />

        {/* Empty State for Event Creators */}
        {events.length === 0 && !error && canCreateEvents() && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first event.
            </p>
            <div className="mt-6">
              <Button
                onClick={handleCreateEvent}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Event
              </Button>
            </div>
          </div>
        )}

        {/* Empty State for Students */}
        {events.length === 0 && !error && !canCreateEvents() && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l2-2 4 4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events available</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are currently no events available for registration. Check back later!
            </p>
          </div>
        )}
      </div>

      {/* Checkout Modal (students only) */}
      {user?.role === 'STUDENT' && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={handleCancelCheckout}
          onConfirm={handleConfirmPayment}
          paymentData={checkoutData}
          loading={payingEventId !== null}
        />
      )}
    </div>
  );
};

export default Events;