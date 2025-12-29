import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentEventDetails, getEventById, registerForEvent, unregisterFromEvent, createStudentEventPaymentOrder, getEventFeeSettings, updateEventFeeSettings, getEventInchargeAssignedEvents, shareEventViaEmail } from '../../api';
import Spinner from '../../components/Spinner';
import Button from '../../components/Button';
import BackButton from '../../components/BackButton';
import CheckoutModal from '../../components/CheckoutModal';
import { FaShare, FaCopy, FaEnvelope } from 'react-icons/fa';

/**
 * EventDetails Page
 * Displays detailed information about a specific event
 * Allows registration and management actions based on user role
 */
const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [pendingEventId, setPendingEventId] = useState(null);
  const [payingEventId, setPayingEventId] = useState(null);

  // Event Incharge permissions (per-event)
  const [inchargeAssignment, setInchargeAssignment] = useState(null);
  const [inchargePermsLoading, setInchargePermsLoading] = useState(false);
  const [inchargePermsError, setInchargePermsError] = useState('');

  // Fee management (event-scoped permissions)
  const [feePanelVisible, setFeePanelVisible] = useState(false);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeError, setFeeError] = useState('');
  const [feeMsg, setFeeMsg] = useState('');
  const [feeForm, setFeeForm] = useState({
    feeMode: 'GLOBAL',
    eventFee: 0,
    studentFeeEnabled: false,
    studentFeeAmount: 0,
    studentFeeUnit: 'PERSON'
  });

  // Share link modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmails, setShareEmails] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');

  // Load Razorpay script
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

  // Load event details
  useEffect(() => {
    loadEventDetails();
    if (user?.role === 'STUDENT') {
      loadRazorpayScript();
    }
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      setIsLoading(true);
      setError('');

      console.log('🔄 Loading event details for:', eventId);
      console.log('👤 User role:', user?.role);
      console.log('🆔 User ID:', user?.id);

      let response;
      let loadedEvent = null;
      if (user?.role === 'STUDENT') {
        // Use student-specific API endpoint
        console.log('📚 Using student API endpoint');
        response = await getStudentEventDetails(eventId);
        console.log('✅ Student API response:', response);
        loadedEvent = response.data;
        setEvent(loadedEvent);
      } else {
        // Use dedicated event details endpoint for other roles (includes proper access checks)
        console.log('🌐 Using event details API for role:', user?.role);
        response = await getEventById(eventId);
        const eventData = response?.data || response;
        if (!eventData) throw new Error('Event not found');
        loadedEvent = eventData;
        setEvent(loadedEvent);
      }

      console.log('✅ Event details loaded successfully');

      // Load incharge per-event permissions for management UI
      if (user?.role === 'EVENT_INCHARGE') {
        try {
          setInchargePermsLoading(true);
          setInchargePermsError('');
          const res = await getEventInchargeAssignedEvents();
          const list = res?.data || res || [];
          const resolvedId = loadedEvent?.id || eventId;
          const match = Array.isArray(list)
            ? list.find(a => a?.eventId === resolvedId || a?.event?.id === resolvedId || a?.event?.uniqueId === eventId)
            : null;
          setInchargeAssignment(match || null);
        } catch (e) {
          setInchargeAssignment(null);
          setInchargePermsError(e?.message || 'Failed to load your incharge permissions for this event.');
        } finally {
          setInchargePermsLoading(false);
        }
      } else {
        setInchargeAssignment(null);
        setInchargePermsError('');
        setInchargePermsLoading(false);
      }

      // Fee settings: only show panel if user has feeManagement access (endpoint returns 403 otherwise)
      // Skip for STUDENT (students should not manage event fees).
      if (user?.role && user.role !== 'STUDENT') {
        try {
          setFeeLoading(true);
          setFeeError('');
          setFeeMsg('');
          const feeRes = await getEventFeeSettings(eventId);
          if (feeRes?.success && feeRes?.data) {
            setFeePanelVisible(true);
            const d = feeRes.data;
            setFeeForm({
              feeMode: d.feeMode || 'GLOBAL',
              eventFee: Number(d.eventFee) || 0,
              studentFeeEnabled: !!d.studentFeeEnabled,
              studentFeeAmount: Number(d.studentFeeAmount) || 0,
              studentFeeUnit: d.studentFeeUnit || 'PERSON'
            });
          } else {
            setFeePanelVisible(false);
          }
        } catch (feeErr) {
          // Hide panel on 403/401, show message for other errors
          const status = feeErr?.statusCode || feeErr?.status || feeErr?.response?.status;
          if (status === 401 || status === 403) {
            setFeePanelVisible(false);
          } else {
            setFeePanelVisible(false);
            setFeeError(feeErr?.message || 'Failed to load fee settings.');
          }
        } finally {
          setFeeLoading(false);
        }
      } else {
        setFeePanelVisible(false);
      }
    } catch (err) {
      console.error('❌ Error loading event details:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.message || 'Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  const saveFeeSettings = async () => {
    try {
      setFeeSaving(true);
      setFeeError('');
      setFeeMsg('');
      const payload = {
        feeMode: feeForm.feeMode,
        eventFee: Number(feeForm.eventFee) || 0,
        studentFeeEnabled: !!feeForm.studentFeeEnabled,
        studentFeeAmount: Number(feeForm.studentFeeAmount) || 0,
        studentFeeUnit: feeForm.studentFeeUnit
      };
      const res = await updateEventFeeSettings(eventId, payload);
      if (res?.success) {
        setFeeMsg('Fee settings updated.');
        await loadEventDetails();
        setTimeout(() => setFeeMsg(''), 4000);
      } else {
        setFeeError(res?.message || 'Failed to update fee settings.');
      }
    } catch (e) {
      setFeeError(e?.message || 'Failed to update fee settings.');
    } finally {
      setFeeSaving(false);
    }
  };

  // Helper function to initiate payment flow
  const initiatePaymentFlow = async (eventId, errorMessage = '') => {
    try {
      console.log('💰 Initiating payment flow for event:', eventId);
      
      // Get event details to ensure we have the latest payment info
      let eventDetails;
      try {
        const eventResponse = await getStudentEventDetails(eventId);
        eventDetails = eventResponse.data || eventResponse;
      } catch (eventError) {
        console.error('❌ Failed to fetch event details:', eventError);
        throw new Error('Failed to load event details. Please try again.');
      }

      const amount = eventDetails.studentFeeAmount || 0;
      if (amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Create payment order
      setPayingEventId(eventId);
      const orderResponse = await createStudentEventPaymentOrder(eventId);
      
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      const orderData = orderResponse.data;

      // Set checkout data (align to StudentEvents shape so CheckoutModal + Razorpay flow is consistent)
      const feeAmount = orderData.studentFeeAmount || eventDetails.studentFeeAmount || 0;
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

      setPendingEventId(eventId);
      setShowCheckout(true);
      setPayingEventId(null);
    } catch (error) {
      console.error('❌ Payment flow initiation failed:', error);
      setPayingEventId(null);
      alert(error.message || 'Failed to initiate payment. Please try again.');
    }
  };

  // Handle confirmation from CheckoutModal, then open Razorpay
  const handleConfirmPayment = async () => {
    if (!checkoutData || !pendingEventId) {
      alert('Payment data is missing. Please try again.');
      return;
    }

    try {
      setPayingEventId(pendingEventId);
      setShowCheckout(false);

      // Ensure Razorpay SDK is loaded
      if (!razorpayLoaded && !window.Razorpay) {
        await new Promise((resolve, reject) => {
          const checkRazorpay = setInterval(() => {
            if (window.Razorpay) {
              clearInterval(checkRazorpay);
              setRazorpayLoaded(true);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(checkRazorpay);
            if (!window.Razorpay) reject(new Error('Razorpay SDK failed to load'));
          }, 5000);
        });
      }
      if (!window.Razorpay) throw new Error('Razorpay SDK not loaded. Please refresh and try again.');

      const { orderData, event } = checkoutData;
      const eventId = pendingEventId;

      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Missing auth token. Please login again.');

      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const profile = userObj.profile || {};

      const options = {
        key: orderData.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'STAIRS Talent Hub',
        description: `Participation fee for ${event?.name || 'Event'}`,
        order_id: orderData.orderId,
        handler: async (response) => {
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

            setPayingEventId(null);
            setCheckoutData(null);
            setPendingEventId(null);
            await loadEventDetails();
            alert('Payment successful! You have been registered for the event.');
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

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('❌ Error opening Razorpay:', error);
      setPayingEventId(null);
      alert('Failed to open payment gateway. Please try again.');
    }
  };

  // Handle cancellation from CheckoutModal
  const handleCancelCheckout = () => {
    setShowCheckout(false);
    setCheckoutData(null);
    setPendingEventId(null);
    setPayingEventId(null);
  };

  // Handle event registration
  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      console.log('🔄 Starting registration process for event:', eventId);

      // STEP 1: Get event details to check if payment is required
      let eventDetails;
      try {
        if (user?.role === 'STUDENT') {
          const eventResponse = await getStudentEventDetails(eventId);
          eventDetails = eventResponse.data || eventResponse;
        } else {
          eventDetails = event;
        }
        console.log('✅ Event details fetched:', {
          id: eventDetails.id,
          name: eventDetails.name,
          createdByAdmin: eventDetails.createdByAdmin,
          studentFeeEnabled: eventDetails.studentFeeEnabled,
          studentFeeAmount: eventDetails.studentFeeAmount
        });
      } catch (eventError) {
        console.error('❌ Failed to fetch event details:', eventError);
        throw new Error('Failed to load event details. Please try again.');
      }

      // STEP 2: Check if payment is required (only for students)
      if (user?.role === 'STUDENT') {
        const requiresPayment = eventDetails.createdByAdmin &&
                               eventDetails.studentFeeEnabled &&
                               (eventDetails.studentFeeAmount || 0) > 0;

        if (requiresPayment) {
          console.log('💰 Payment required for this event. Initiating payment flow...');
          setIsRegistering(false);
          await initiatePaymentFlow(eventId, 'Payment required to register for this event');
          return;
        }
      }

      // STEP 3: No payment required - register directly
      console.log('✅ No payment required. Registering directly...');
      try {
        const response = await registerForEvent(eventId);
        
        if (response && response.success) {
          console.log('✅ Registration successful');
          alert('Successfully registered for the event!');
          await loadEventDetails();
        } else {
          throw new Error(response?.message || 'Registration failed');
        }
      } catch (regError) {
        console.error('❌ Direct registration failed:', regError);
        // If registration fails, check if it's a payment error (fallback)
        const errorData = regError?.response?.data || regError?.data || { message: regError?.message || 'Registration failed' };
        const errorMessage = errorData.message || regError?.message || 'Registration failed';
        const statusCode = regError?.response?.status || regError?.statusCode || regError?.status;
        
        const isPaymentError = errorMessage && typeof errorMessage === 'string' && (
          errorMessage.toLowerCase().includes('payment required') || 
          errorMessage.toLowerCase().includes('complete payment') ||
          errorMessage.toLowerCase().includes('payment')
        );

        // If backend says payment is required (even though event details didn't indicate it), trigger payment flow
        if (user?.role === 'STUDENT' && (isPaymentError || statusCode === 400)) {
          console.log('💰 Backend indicates payment required. Initiating payment flow...');
          setIsRegistering(false);
          await initiatePaymentFlow(eventId, errorMessage);
          return;
        }

        // Other registration errors
        throw regError;
      }
      setIsRegistering(false);
    } catch (error) {
      console.error('❌ Registration process failed:', error);
      const errorData = error?.response?.data || error?.data || { message: error?.message || 'Registration failed' };
      const errorMessage = errorData.message || error?.message || 'Unknown error occurred';
      
      // Final fallback: if it's a 400 error and user is student, try payment flow
      const statusCode = error?.response?.status || error?.statusCode || error?.status;
      if (user?.role === 'STUDENT' && statusCode === 400) {
        console.log('💰 Final fallback: Attempting payment flow for 400 error...');
        setIsRegistering(false);
        try {
          await initiatePaymentFlow(eventId, errorMessage);
          return;
        } catch (paymentError) {
          console.error('❌ Payment flow failed in final fallback:', paymentError);
        }
      }
      
      alert(`Registration failed: ${errorMessage}`);
      setIsRegistering(false);
    }
  };

  // Handle event unregistration
  const handleUnregister = async () => {
    if (!window.confirm('Are you sure you want to unregister from this event?')) {
      return;
    }

    try {
      setIsRegistering(true);

      console.log('🔄 Unregistering from event:', eventId);
      
      await unregisterFromEvent(eventId);
      
      console.log('✅ Unregistration successful');
      alert('Successfully unregistered from the event!');
      loadEventDetails(); // Reload to update registration status
    } catch (err) {
      console.error('❌ Error unregistering from event:', err);
      alert(err.message || 'Failed to unregister from event. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Check if user can register
  const canRegister = () => {
    if (!user || !event) return false;
    if (user.role !== 'STUDENT') return false;
    if (event.isRegistered) return false;
    if (typeof event.canRegister === 'boolean') return event.canRegister;
    const now = new Date();
    const startDate = new Date(event.startDate);
    const regDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : startDate;
    if (now >= startDate) return false;
    if (now > regDeadline) return false;
    if ((event.currentParticipants || 0) >= event.maxParticipants) return false;
    return true;
  };

  // Check if user can unregister
  const canUnregister = () => {
    if (!user || !event) return false;
    if (user.role !== 'STUDENT') return false;
    if (!event.isRegistered) return false;
    // Can unregister if event hasn't started yet
    const now = new Date();
    const startDate = new Date(event.startDate);
    return now < startDate;
  };

  // Check if user can manage event
  const canManageEvent = () => {
    if (!user || !event) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'COACH' && event.createdBy?.role === 'COACH' && event.createdBy?.id === user.id) return true;
    if (user.role === 'INSTITUTE' && event.createdBy?.role === 'INSTITUTE' && event.createdBy?.id === user.id) return true;
    if (user.role === 'CLUB' && event.createdBy?.role === 'CLUB' && event.createdBy?.id === user.id) return true;
    return false;
  };

  const inchargePerms = inchargeAssignment?.permissionOverride || {};
  const canInchargeStudentMgmt = user?.role === 'EVENT_INCHARGE' && !!inchargePerms.studentManagement;
  const canInchargeResultUpload = user?.role === 'EVENT_INCHARGE' && !!inchargePerms.resultUpload;
  const canInchargeCertificates = user?.role === 'EVENT_INCHARGE' && !!inchargePerms.certificateManagement;

  // Get shareable link
  const getShareableLink = () => {
    if (!event?.uniqueId) return null;
    return `${window.location.origin}/event/${event.uniqueId}`;
  };

  // Copy link to clipboard
  const copyLinkToClipboard = () => {
    const link = getShareableLink();
    if (!link) {
      alert('Event does not have a shareable link yet.');
      return;
    }
    navigator.clipboard.writeText(link).then(() => {
      alert('Link copied to clipboard!');
      setShareSuccess('Link copied to clipboard!');
      setTimeout(() => setShareSuccess(''), 3000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy link. Please try again.');
    });
  };

  // Share via email
  const handleShareViaEmail = async () => {
    if (!shareEmails.trim()) {
      setShareError('Please enter at least one email address');
      return;
    }

    const emailList = shareEmails.split(',').map(e => e.trim()).filter(Boolean);
    if (emailList.length === 0) {
      setShareError('Please enter valid email addresses');
      return;
    }

    setShareLoading(true);
    setShareError('');
    setShareSuccess('');

    try {
      const response = await shareEventViaEmail(eventId, emailList);
      if (response.success) {
        setShareSuccess(`Event shared successfully! ${response.data?.sent || 0} email(s) sent.`);
        setShareEmails('');
        setTimeout(() => {
          setShowShareModal(false);
          setShareSuccess('');
        }, 3000);
      } else {
        setShareError(response.message || 'Failed to share event');
      }
    } catch (error) {
      console.error('Share event error:', error);
      setShareError(error.message || 'Failed to share event. Please try again.');
    } finally {
      setShareLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/events')} className="w-full">
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton to="/events" label="Back to Events" />
        </div>

        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <button
                onClick={() => navigate('/events')}
                className="text-gray-400 hover:text-gray-500"
              >
                Events
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500 truncate">{event.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">{event.sport}</span>
                    </div>
                  </div>
                  
                  {canManageEvent() && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setShowShareModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                      >
                        <FaShare className="w-4 h-4" />
                        Share Link
                      </Button>
                      <Button
                        onClick={() => navigate(`/events/${eventId}/edit`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => navigate(`/events/${eventId}/participants`)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Participants
                      </Button>
                    </div>
                  )}

                  {user?.role === 'EVENT_INCHARGE' && (
                    <div className="flex flex-col items-end gap-2">
                      {inchargePermsError ? (
                        <div className="text-xs text-red-600">{inchargePermsError}</div>
                      ) : null}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => navigate(`/events/${eventId}/participants`)}
                          className={canInchargeStudentMgmt ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
                          disabled={!canInchargeStudentMgmt || inchargePermsLoading}
                          title={!canInchargeStudentMgmt ? 'Student Management permission not granted for this event.' : 'Student Management'}
                        >
                          Student Mgmt
                        </Button>
                        <Button
                          onClick={() => navigate(`/events/${eventId}/results`)}
                          className={canInchargeResultUpload ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
                          disabled={!canInchargeResultUpload || inchargePermsLoading}
                          title={!canInchargeResultUpload ? 'Result Upload permission not granted for this event.' : 'Result Upload'}
                        >
                          Results
                        </Button>
                        {canInchargeCertificates ? (
                          <Button
                            onClick={() => navigate(`/events/${eventId}/certificates`)}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            title="Certificate Management"
                          >
                            Certificates
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* Event Details */}
              <div className="px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Event Details</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  {event.uniqueId && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Event ID</dt>
                      <dd className="mt-1 text-sm font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded inline-block">
                        {event.uniqueId}
                      </dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Start Date & Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(event.startDate)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">End Date & Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(event.endDate)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Venue</dt>
                    <dd className="mt-1 text-sm text-gray-900">{event.venue}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {event.address && `${event.address}, `}{event.city}, {event.state}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Event Fee</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {event.eventFee > 0 ? `₹${event.eventFee}` : 'Free'}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Max Participants</dt>
                    <dd className="mt-1 text-sm text-gray-900">{event.maxParticipants}</dd>
                  </div>
                  
                  {event.registrationDeadline && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Registration Deadline</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(event.registrationDeadline)}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Fee Management (Admin/Coach Owner/Incharge with feeManagement) */}
              {feePanelVisible && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Fee Settings</h3>
                  <p className="text-sm text-gray-600">
                    Visible only to users with <span className="font-semibold">Fee Management</span> permission for this event.
                  </p>

                  {feeError ? (
                    <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                      {feeError}
                    </div>
                  ) : null}
                  {feeMsg ? (
                    <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
                      {feeMsg}
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fee Mode</label>
                      <select
                        value={feeForm.feeMode}
                        onChange={(e) => setFeeForm((p) => ({ ...p, feeMode: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="GLOBAL">GLOBAL</option>
                        <option value="EVENT">EVENT</option>
                        <option value="DISABLED">DISABLED</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        EVENT requires a positive Event Fee.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Fee (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={feeForm.eventFee}
                        onChange={(e) => setFeeForm((p) => ({ ...p, eventFee: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled={feeForm.feeMode !== 'EVENT'}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={!!feeForm.studentFeeEnabled}
                          onChange={(e) => setFeeForm((p) => ({ ...p, studentFeeEnabled: e.target.checked }))}
                        />
                        Enable student participation fee (admin-created events)
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Fee Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={feeForm.studentFeeAmount}
                        onChange={(e) => setFeeForm((p) => ({ ...p, studentFeeAmount: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled={!feeForm.studentFeeEnabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Fee Unit</label>
                      <select
                        value={feeForm.studentFeeUnit}
                        onChange={(e) => setFeeForm((p) => ({ ...p, studentFeeUnit: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled={!feeForm.studentFeeEnabled}
                      >
                        <option value="PERSON">PERSON</option>
                        <option value="TEAM">TEAM</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                      onClick={saveFeeSettings}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={feeSaving || feeLoading}
                    >
                      {feeSaving ? 'Saving...' : 'Save Fee Settings'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Organizer Info */}
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Organized By</h3>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {(event.organizer?.name || event.coach?.name || event.createdBy?.name || 'Unknown')?.charAt(0)?.toUpperCase() || 'O'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {event.organizer?.name || event.coach?.name || event.createdBy?.name || 'Unknown Organizer'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {event.organizer?.specialization || event.coach?.specialization || 'Event Organizer'}
                    </p>
                    {(event.organizer?.experience || event.coach?.experience) && (
                      <p className="text-xs text-gray-400">
                        {event.organizer?.experience || event.coach?.experience} years experience
                      </p>
                    )}
                    {(event.organizer?.rating || event.coach?.rating) && (
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-yellow-500">⭐</span>
                        <span className="text-xs text-gray-500 ml-1">
                          {(event.organizer?.rating || event.coach?.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Status</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Registered</span>
                    <span className="font-medium">{event.currentParticipants || 0}/{event.maxParticipants}</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((event.currentParticipants || 0) / event.maxParticipants * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                {event.isRegistered ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm text-green-800 font-medium">You're registered!</p>
                          <p className="text-xs text-green-600">You have successfully registered for this event.</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Show unregister button if user can still unregister */}
                    {canUnregister() && (
                      <Button
                        onClick={handleUnregister}
                        disabled={isRegistering}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isRegistering ? 'Unregistering...' : 'Unregister'}
                      </Button>
                    )}
                  </div>
                ) : canRegister() ? (
                  <Button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isRegistering ? 'Registering...' : 'Register Now'}
                  </Button>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-sm text-gray-600">
                      {user?.role !== 'STUDENT' ? 'Only students can register for events' :
                       event.status !== 'upcoming' ? 'Registration is closed' :
                       event.registrationDeadline && new Date(event.registrationDeadline) < new Date() ? 'Registration deadline has passed' :
                       event.currentParticipants >= event.maxParticipants ? 'Event is full' :
                       'Registration not available'}
                    </p>
                  </div>
                )}
              </div>

              {/* Map integration for location */}
              {(event.latitude && event.longitude) || event.address || event.venue ? (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Location & Navigation</h4>
                  
                  {/* Address display */}
                  <div className="text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">{event.venue}</div>
                        {event.address && <div className="text-gray-600">{event.address}</div>}
                        <div className="text-gray-600">{event.city}, {event.state}</div>
                        {event.latitude && event.longitude && (
                          <div className="text-xs text-gray-500 mt-1">Coordinates: {event.latitude}, {event.longitude}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation buttons */}
                  <div className="space-y-2">
                    {event.latitude && event.longitude ? (
                      <>
                        <button
                          onClick={() => {
                            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;
                            window.open(googleMapsUrl, '_blank');
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          Get Directions on Google Maps
                        </button>
                        
                        <button
                          onClick={() => {
                            const appleMapUrl = `http://maps.apple.com/?ll=${event.latitude},${event.longitude}&q=${encodeURIComponent(event.venue + ', ' + event.city)}`;
                            window.open(appleMapUrl, '_blank');
                          }}
                          className="w-full bg-gray-700 hover:bg-gray-800 text-white px-4 py-2.5 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Open in Apple Maps
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          const searchQuery = encodeURIComponent((event.address || event.venue) + ', ' + event.city + ', ' + event.state);
                          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
                          window.open(googleMapsUrl, '_blank');
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Find on Google Maps
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
                  
            </div>
          </div>
        </div>
      </div>

      {/* Share Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Share Event</h2>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareEmails('');
                  setShareError('');
                  setShareSuccess('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {getShareableLink() ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shareable Link:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getShareableLink()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={copyLinkToClipboard}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FaCopy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share via Email (comma-separated):
                  </label>
                  <textarea
                    value={shareEmails}
                    onChange={(e) => setShareEmails(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter email addresses separated by commas
                  </p>
                </div>

                {shareError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    {shareError}
                  </div>
                )}

                {shareSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
                    {shareSuccess}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleShareViaEmail}
                    disabled={shareLoading || !shareEmails.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FaEnvelope className="w-4 h-4" />
                    {shareLoading ? 'Sending...' : 'Send Email'}
                  </button>
                  <button
                    onClick={() => {
                      setShowShareModal(false);
                      setShareEmails('');
                      setShareError('');
                      setShareSuccess('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">This event does not have a shareable link yet.</p>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
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

export default EventDetails;