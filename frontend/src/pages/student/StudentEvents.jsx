import { useState, useEffect } from 'react';
import { getStudentEvents, registerForEvent, getStudentEventRegistrations, createStudentEventPaymentOrder, getStudentEventDetails } from '../../api';
import Spinner from '../../components/Spinner';
import CheckoutModal from '../../components/CheckoutModal';

const StudentEvents = () => {
  const [availableEvents, setAvailableEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);
  const [payingEventId, setPayingEventId] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [pendingEventId, setPendingEventId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    sport: '',
    location: '',
    maxFees: ''
  });

  const getLevelBadge = (lvlRaw) => {
    const lvl = (lvlRaw || 'DISTRICT').toString().toUpperCase();
    const label = lvl === 'DISTRICT' ? 'District'
      : lvl === 'STATE' ? 'State'
      : lvl === 'NATIONAL' ? 'National'
      : lvl === 'SCHOOL' ? 'School'
      : lvl;
    const cls = lvl === 'DISTRICT' ? 'bg-green-100 text-green-800'
      : lvl === 'STATE' ? 'bg-blue-100 text-blue-800'
      : lvl === 'NATIONAL' ? 'bg-purple-100 text-purple-800'
      : lvl === 'SCHOOL' ? 'bg-amber-100 text-amber-800'
      : 'bg-gray-100 text-gray-800';
    return (
      <span className={`${cls} px-2 py-1 rounded-full text-xs font-semibold`}>
        {label}
      </span>
    );
  };

  useEffect(() => {
    loadData();
    loadRazorpayScript();
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

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading student events data...');
      
      const [eventsResponse, registrationsResponse] = await Promise.all([
        getStudentEvents({ page: 1, limit: 50 }),
        getStudentEventRegistrations({ page: 1, limit: 50 })
      ]);
      
      console.log('✅ Events loaded:', eventsResponse);
      console.log('✅ Registrations loaded:', registrationsResponse);
      
      setAvailableEvents(eventsResponse.data?.events || []);
      setMyRegistrations(registrationsResponse.data?.registrations || []);
    } catch (error) {
      console.error('❌ Failed to load events data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Production-ready registration handler
   * Strategy: Check payment requirement FIRST, then proceed accordingly
   */
  const handleRegister = async (eventId) => {
    try {
      setRegistering(eventId);
      console.log(`🔄 Starting registration process for event ${eventId}...`);
      
      // STEP 1: Get event details to check if payment is required
      let eventDetails;
      try {
        const eventResponse = await getStudentEventDetails(eventId);
        eventDetails = eventResponse.data || eventResponse;
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

      // STEP 2: Check if payment is required
      const requiresPayment = eventDetails.createdByAdmin && 
                             eventDetails.studentFeeEnabled && 
                             (eventDetails.studentFeeAmount || 0) > 0;

      if (requiresPayment) {
        console.log('💰 Payment required for this event. Initiating payment flow...');
        // Payment required - initiate payment flow directly
        await initiatePaymentFlow(eventId, 'Payment required to register for this event');
        setRegistering(null);
        return;
      }

      // STEP 3: No payment required - register directly
      console.log('✅ No payment required. Registering directly...');
      try {
        const response = await registerForEvent(eventId);
        
        if (response && response.success) {
          console.log('✅ Registration successful');
          alert('Successfully registered for the event!');
          await loadData();
          setRegistering(null);
          return;
        } else {
          throw new Error(response?.message || 'Registration failed');
        }
      } catch (regError) {
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
        if (isPaymentError || statusCode === 400) {
          console.log('💰 Backend indicates payment required. Initiating payment flow...');
          await initiatePaymentFlow(eventId, errorMessage);
          setRegistering(null);
          return;
        }

        // Other registration errors
        throw regError;
      }
    } catch (error) {
      console.error('❌ Registration process failed:', error);
      
      // Extract error message
      const errorData = error?.response?.data || error?.data || { message: error?.message || 'Registration failed' };
      const errorMessage = errorData.message || error?.message || 'Unknown error occurred';
      
      // Final fallback: if it's a 400 error, try payment flow
      const statusCode = error?.response?.status || error?.statusCode || error?.status;
      if (statusCode === 400) {
        console.log('💰 Final fallback: Attempting payment flow for 400 error...');
        try {
          await initiatePaymentFlow(eventId, errorMessage);
          setRegistering(null);
          return;
        } catch (paymentError) {
          console.error('❌ Payment flow failed in final fallback:', paymentError);
        }
      }
      
      // Show error to user
      alert(`Registration failed: ${errorMessage}`);
      setRegistering(null);
    }
  };

  /**
   * Production-ready payment flow initiation
   * Fetches event details, creates payment order, and shows checkout modal
   */
  const initiatePaymentFlow = async (eventId, errorMessage = '') => {
    try {
      console.log('💰 Initiating payment flow for event:', eventId);
      
      // STEP 1: Get event details (if not already fetched)
      let event;
      try {
        const eventDetails = await getStudentEventDetails(eventId);
        event = eventDetails.data || eventDetails;
        console.log('✅ Event details fetched:', {
          name: event.name,
          studentFeeAmount: event.studentFeeAmount
        });
      } catch (eventError) {
        console.error('❌ Failed to fetch event details:', eventError);
        throw new Error('Failed to load event details. Please try again.');
      }
      
      // STEP 2: Create payment order
      let orderData;
      try {
        console.log('💳 Creating payment order...');
        const paymentOrderResponse = await createStudentEventPaymentOrder(eventId);
        orderData = paymentOrderResponse.data || paymentOrderResponse;
        console.log('✅ Payment order created:', {
          orderId: orderData.orderId,
          amount: orderData.amount,
          studentFeeAmount: orderData.studentFeeAmount
        });
        
        if (!orderData.orderId) {
          throw new Error('Payment order creation failed - no order ID received');
        }
      } catch (orderError) {
        console.error('❌ Failed to create payment order:', orderError);
        const orderErrMsg = orderError?.response?.data?.message || orderError?.message || 'Failed to create payment order';
        throw new Error(`Payment setup failed: ${orderErrMsg}`);
      }

      // STEP 3: Set up checkout modal data
      const feeAmount = orderData.studentFeeAmount || event.studentFeeAmount || 0;
      console.log('📝 Setting up checkout modal with amount:', feeAmount);
      
      setPendingEventId(eventId);
      setCheckoutData({
        title: 'Event Registration Payment',
        description: 'Payment is required to register for this event',
        paymentType: 'registration',
        eventDetails: {
          name: event.name,
          sport: event.sport,
          venue: event.venue,
          startDate: event.startDate
        },
        items: [{
          name: `Participation fee for ${event.name}`,
          description: `Event: ${event.sport} at ${event.venue}`,
          amount: feeAmount,
          quantity: 1
        }],
        subtotal: feeAmount,
        tax: 0,
        discount: 0,
        total: feeAmount,
        currency: orderData.currency || 'INR',
        orderData: orderData,
        event: event
      });
      
      // STEP 4: Show checkout modal
      console.log('✅ Showing checkout modal...');
      setShowCheckout(true);
      console.log('✅ Checkout modal displayed');
    } catch (paymentError) {
      console.error('❌ Payment flow initiation failed:', paymentError);
      const paymentErrMsg = paymentError?.message || paymentError?.response?.data?.message || 'Unknown error';
      alert(`Payment setup failed: ${paymentErrMsg}. Please try again.`);
      throw paymentError; // Re-throw so caller can handle
    }
  };

  /**
   * Production-ready payment confirmation handler
   * Opens Razorpay checkout and handles payment verification
   */
  const handleConfirmPayment = async () => {
    if (!checkoutData || !pendingEventId) {
      console.error('❌ Missing checkout data or event ID');
      alert('Payment data is missing. Please try again.');
      return;
    }

    try {
      setPayingEventId(pendingEventId);
      setShowCheckout(false);

      // STEP 1: Ensure Razorpay SDK is loaded
      if (!razorpayLoaded && !window.Razorpay) {
        console.log('⏳ Waiting for Razorpay SDK to load...');
        await new Promise((resolve, reject) => {
          const checkRazorpay = setInterval(() => {
            if (window.Razorpay) {
              clearInterval(checkRazorpay);
              setRazorpayLoaded(true);
              console.log('✅ Razorpay SDK loaded');
              resolve();
            }
          }, 100);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkRazorpay);
            if (!window.Razorpay) {
              reject(new Error('Razorpay SDK failed to load'));
            }
          }, 5000);
        });
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
      }

      // STEP 2: Extract payment data
      const { orderData, event } = checkoutData;
      const eventId = pendingEventId; // Use pendingEventId from state
      
      if (!orderData || !orderData.orderId) {
        throw new Error('Invalid payment order data');
      }

      // STEP 3: Get user profile for Razorpay prefill
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      const profile = user.profile || {};

      console.log('💳 Opening Razorpay checkout...', {
        orderId: orderData.orderId,
        amount: orderData.amount,
        eventId: eventId
      });

      // STEP 4: Configure Razorpay options
      const options = {
        key: orderData.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'STAIRS Talent Hub',
        description: `Participation fee for ${event?.name || 'Event'}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            console.log('💳 Payment successful, verifying with backend...', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id
            });
            
            setPayingEventId(eventId); // Keep loading state
            
            // STEP 5: Verify payment on backend
            const verifyResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                context: 'student_event_fee',
                eventId: eventId // Use eventId from state
              })
            });

            const verifyData = await verifyResponse.json();
            
            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed');
            }

            console.log('✅ Payment verified successfully. Registration completed automatically.');
            
            // STEP 6: Backend automatically creates/updates registration after payment verification
            // Refresh data to show updated registration status
            await loadData();
            
            // Show success message
            alert('Payment successful! You have been registered for the event.');
            
          } catch (verifyError) {
            console.error('❌ Payment verification/registration error:', verifyError);
            const errorMsg = verifyError?.message || 'Unknown error';
            alert(`Payment successful but registration failed: ${errorMsg}. Please contact support with payment ID: ${response?.razorpay_payment_id || 'N/A'}`);
          } finally {
            setPayingEventId(null);
            setRegistering(null);
            setCheckoutData(null);
            setPendingEventId(null);
          }
        },
        prefill: {
          name: profile.name || user.name || 'Student',
          email: user.email || profile.email || '',
          contact: user.phone || profile.phone || ''
        },
        theme: {
          color: '#059669'
        },
        modal: {
          ondismiss: function() {
            console.log('⚠️ Payment cancelled by user');
            setPayingEventId(null);
            setRegistering(null);
            setCheckoutData(null);
            setPendingEventId(null);
          }
        }
      };

      // STEP 7: Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('❌ Razorpay payment failed:', response);
        alert(`Payment failed: ${response.error?.description || 'Unknown error'}. Please try again.`);
        setPayingEventId(null);
        setRegistering(null);
      });
      
      rzp.open();
      console.log('✅ Razorpay checkout opened');
        
    } catch (error) {
      console.error('❌ Payment initialization failed:', error);
      alert(`Payment setup failed: ${error.message || 'Unknown error'}. Please try again.`);
      setPayingEventId(null);
      setRegistering(null);
      setCheckoutData(null);
      setPendingEventId(null);
    }
  };

  const handleCancelCheckout = () => {
    setShowCheckout(false);
    setCheckoutData(null);
    setPendingEventId(null);
    setRegistering(null);
  };

  const handlePayFee = async (registration) => {
    try {
      setPayingEventId(registration.event.id);
      const response = await createStudentEventPaymentOrder(registration.event.id);
      const orderId = response?.data?.orderId || response.orderId;
      alert(`Payment order created. Order ID: ${orderId}. Complete payment to confirm your spot.`);
      await loadData();
    } catch (error) {
      console.error('❌ Failed to create payment order:', error);
      const message = error?.message || error?.userMessage || 'Failed to create payment order.';
      alert(message);
    } finally {
      setPayingEventId(null);
    }
  };

  const filteredEvents = availableEvents.filter(event => {
    const matchesSearch = !filters.search || 
      event.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesSport = !filters.sport || event.sport === filters.sport;
    
    const matchesLocation = !filters.location ||
      event.venue?.toLowerCase().includes(filters.location.toLowerCase()) ||
      event.city?.toLowerCase().includes(filters.location.toLowerCase());
    
    const matchesFees = !filters.maxFees || 
      (event.eventFee || event.fees || 0) <= parseFloat(filters.maxFees);
    
    return matchesSearch && matchesSport && matchesLocation && matchesFees;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-2">Discover and register for sporting events</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('available')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Available Events ({availableEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('registered')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'registered'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Registrations ({myRegistrations.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'available' && (
              <div>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filters.sport}
                    onChange={(e) => setFilters(prev => ({ ...prev, sport: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Sports</option>
                    <option value="Football">Football</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Swimming">Swimming</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Athletics">Athletics</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Location..."
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max fees..."
                    value={filters.maxFees}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxFees: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Events Grid */}
                {filteredEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map(event => (
                      <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-lg truncate">{event.title || event.name}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {getLevelBadge(event.level)}
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                {event.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">📅 {new Date(event.startDate).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">📍 {event.location || event.venue}</p>
                          <p className="text-sm text-gray-600">🏷️ {event.sport}</p>
                          <p className="text-sm text-gray-600">👨‍🏫 {event.organizer?.name || event.coach?.name}</p>
                          <p className="text-sm text-gray-600">👥 {event.currentParticipants || 0}/{event.maxParticipants || 'Unlimited'}</p>
                          <p className="text-sm text-gray-600">💰 ₹{event.fees || event.eventFee || 0}</p>
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-700 mb-4 line-clamp-3">{event.description}</p>
                        )}

                        <div className="flex space-x-2">
                          <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                            View Details
                          </button>
                          <button
                            onClick={() => handleRegister(event.id)}
                            disabled={registering === event.id}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {registering === event.id ? 'Registering...' : 'Register'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🏆</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                    <p className="text-gray-600">Try adjusting your filters or check back later for new events.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'registered' && (
              <div>
                {myRegistrations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myRegistrations.map(registration => (
                      <div key={registration.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-lg truncate">{registration.event.title || registration.event.name}</h3>
                            <div className="mt-2">
                              {getLevelBadge(registration.event.level)}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            registration.status === 'REGISTERED' || registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {registration.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">📅 {new Date(registration.event.startDate).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">📍 {registration.event.location || registration.event.venue}</p>
                          <p className="text-sm text-gray-600">🏷️ {registration.event.sport}</p>
                          <p className="text-sm text-gray-600">💰 ₹{registration.event.fees || registration.event.eventFee || 0}</p>
                      {registration.paymentRequired && (
                        <p className="text-sm text-gray-600">
                          Payment status: {registration.paymentStatus === 'SUCCESS' ? 'Paid' : 'Pending'}
                        </p>
                      )}
                          <p className="text-sm text-gray-600">📝 Registered: {new Date(registration.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="flex space-x-2">
                          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            View Details
                          </button>
                      {registration.paymentRequired && registration.paymentStatus !== 'SUCCESS' && (
                        <button
                          onClick={() => handlePayFee(registration)}
                          disabled={payingEventId === registration.event.id}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {payingEventId === registration.event.id ? 'Creating order...' : 'Pay Fee'}
                        </button>
                      )}
                      {registration.paymentRequired && registration.paymentStatus === 'SUCCESS' && (
                        <span className="flex-1 text-center text-green-700 font-semibold bg-green-50 px-3 py-2 rounded-lg">
                          Fee Paid
                        </span>
                      )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Registrations Yet</h3>
                    <p className="text-gray-600 mb-6">You haven't registered for any events yet.</p>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Browse Available Events
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={handleCancelCheckout}
        onConfirm={handleConfirmPayment}
        paymentData={checkoutData}
        loading={payingEventId !== null}
      />
    </div>
  );
};

export default StudentEvents;