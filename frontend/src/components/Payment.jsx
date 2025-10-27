import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCrown, FaCheck, FaTimes, FaCreditCard, FaUsers, FaBuilding, FaDumbbell } from 'react-icons/fa';
import { getPaymentPlans } from '../api';

const Payment = ({ userType = 'student' }) => {
  const [planConfig, setPlanConfig] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Icon mapping
  const iconMap = {
    coach: FaDumbbell,
    club: FaUsers,
    institute: FaBuilding,
    student: FaCrown
  };

  // Load payment plans
  const loadPaymentPlans = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      
      // Check authentication first
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setAuthError(true);
        setError('Please login to view payment plans.');
        return;
      }
      
      const plans = await getPaymentPlans(userType);
      setPlanConfig(plans);
      setSelectedPlan(plans.defaultPlan);
    } catch (err) {
      console.error('Failed to load payment plans:', err);
      if (err.message && err.message.includes('401')) {
        setAuthError(true);
        setError('Your session has expired. Please login again.');
      } else {
        setError('Failed to load payment plans. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  useEffect(() => {
    loadPaymentPlans();
  }, [userType]);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Compute derived values
  const redirectPath = location.state?.from || planConfig?.redirectPath;
  const userDisplayName = planConfig?.userDisplayName;
  const UserIcon = iconMap[userType] || FaCrown;
  const selectedPlanData = planConfig?.plans?.find(plan => plan.id === selectedPlan);

  // NOW we can have conditional returns after all hooks are called
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment plans...</p>
        </div>
      </div>
    );
  }

  if (authError || !planConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <FaCrown className="text-4xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-red-600 mb-6">{error || 'Please login to view payment plans.'}</p>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/login/coach')}
                className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Login as Coach
              </button>
              <button 
                onClick={() => navigate('/login/student')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login as Student
              </button>
              <button 
                onClick={loadPaymentPlans}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <FaCheck className="text-6xl text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully. You will be redirected to your dashboard shortly.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const handlePayment = async (plan) => {
    setPaymentLoading(true);
    setError('');

    try {
      // Check if user is authenticated
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Please login first to make a payment.');
      }

      console.log('Auth token present:', authToken ? 'Yes' : 'No');
      console.log('Making payment for:', { planId: plan.id, userType });

      // Create payment order on backend
      const createOrderResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          planId: plan.id,
          userType: userType
        })
      });

      const orderData = await createOrderResponse.json();
      
      // Log the full response for debugging
      console.log('Payment order response status:', createOrderResponse.status);
      console.log('Payment order response:', orderData);
      
      if (!createOrderResponse.ok || !orderData.success) {
        if (createOrderResponse.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          throw new Error('Your session has expired. Please login again.');
        }
        throw new Error(orderData.message || `Server error: ${createOrderResponse.status}`);
      }

      const { orderId, amount, currency, planName, razorpayKeyId } = orderData.data;

      // Configure Razorpay options
      const options = {
        key: razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'STAIRS Talent Hub',
        description: `${planName} - ${userDisplayName} Membership`,
        image: '/logo.png',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userType: userType
              })
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              console.log('Payment verified successfully:', verifyData);
              console.log('Navigating to:', redirectPath);
              
              // Show success state
              setPaymentSuccess(true);
              setPaymentLoading(false);
              
              // After successful payment, always redirect to dashboard (ignore 'from' state)
              const dashboardPath = planConfig?.redirectPath;
              console.log('Redirecting to dashboard:', dashboardPath);
              
              // Add a small delay to ensure state updates and show success message
              setTimeout(() => {
                navigate(dashboardPath, { 
                  state: { 
                    paymentSuccess: true, 
                    plan: plan.name,
                    amount: plan.price 
                  } 
                });
              }, 2000);
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            setError('Payment verification failed. Please contact support.');
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: 'User Name', // TODO: Get from user context
          email: 'user@example.com', // TODO: Get from user context
          contact: '9999999999' // TODO: Get from user context
        },
        notes: {
          user_type: userType,
          plan_id: plan.id
        },
        theme: {
          color: '#059669'
        },
        modal: {
          ondismiss: function() {
            setPaymentLoading(false);
          }
        }
      };

      // Check if Razorpay script is loaded
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay SDK not loaded. Please refresh and try again.');
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment initialization failed. Please try again.');
      setPaymentLoading(false);
    }
  };

  const handleSkipPayment = () => {
    // Navigate to dashboard without payment
    const dashboardPath = planConfig?.redirectPath;
    navigate(dashboardPath, { 
      state: { 
        paymentSkipped: true 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <UserIcon className="text-4xl text-emerald-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {userDisplayName} Membership Plans
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your {userType === 'coach' ? 'coaching business' : 
              userType === 'club' ? 'club management' : 
              userType === 'institute' ? 'institute operations' : 'athletic journey'}
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className={`grid gap-8 mb-12 ${
          planConfig.plans.length === 1 ? 'max-w-md mx-auto' :
          planConfig.plans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 
          planConfig.plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {planConfig.plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * planConfig.plans.indexOf(plan) }}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-300 ${
                selectedPlan === plan.id
                  ? 'border-emerald-500 shadow-emerald-200'
                  : 'border-gray-200 hover:border-emerald-300'
              } ${plan.popular ? 'ring-4 ring-emerald-100' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center py-2 text-sm font-semibold">
                  <FaCrown className="inline mr-2" />
                  Most Popular
                </div>
              )}

              <div className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-emerald-600">₹{plan.price.toLocaleString()}</span>
                    <span className="text-gray-500 ml-2">/{plan.duration}</span>
                  </div>
                  {plan.originalPrice > plan.price && (
                    <div className="flex items-center mt-2">
                      <span className="text-lg text-gray-400 line-through">₹{plan.originalPrice.toLocaleString()}</span>
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                        Save ₹{(plan.originalPrice - plan.price).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Included Features:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-700">
                          <FaCheck className="text-emerald-500 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Not Included:</h4>
                      <ul className="space-y-2">
                        {plan.notIncluded.map((feature, index) => (
                          <li key={index} className="flex items-center text-gray-500">
                            <FaTimes className="text-gray-400 mr-3 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    selectedPlan === plan.id
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                  }}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center space-y-4"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selected: {selectedPlanData?.name}
            </h3>
            <p className="text-3xl font-bold text-emerald-600 mb-4">
              ₹{selectedPlanData?.price.toLocaleString()}/{selectedPlanData?.duration}
            </p>
            
            <button
              onClick={() => handlePayment(selectedPlanData)}
              disabled={paymentLoading}
              className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                paymentLoading ? 'cursor-not-allowed' : 'hover:shadow-lg'
              }`}
            >
              <FaCreditCard className="mr-2" />
              {paymentLoading ? 'Processing...' : `Pay ₹${selectedPlanData?.price.toLocaleString()}`}
            </button>
          </div>

          <button
            onClick={handleSkipPayment}
            className="text-gray-600 hover:text-gray-800 underline transition-colors duration-300"
          >
            Skip for now and continue to dashboard
          </button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500 mb-4">Trusted by thousands of athletes and sports organizations</p>
          <div className="flex justify-center items-center space-x-8 text-gray-400">
            <span className="text-xs">🔒 Secure Payment</span>
            <span className="text-xs">✅ Money Back Guarantee</span>
            <span className="text-xs">📞 24/7 Support</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Payment;