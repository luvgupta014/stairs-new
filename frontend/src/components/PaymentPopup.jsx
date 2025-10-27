import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCrown, FaCheck, FaTimes, FaCreditCard, FaExclamationTriangle } from 'react-icons/fa';
import { getPaymentPlans } from '../api';

const PaymentPopup = ({ 
  isOpen, 
  onClose, 
  userType = 'coach', 
  userProfile = null,
  onPaymentSuccess = null 
}) => {
  const [planConfig, setPlanConfig] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Load payment plans when popup opens
  useEffect(() => {
    if (isOpen) {
      loadPaymentPlans();
    }
  }, [isOpen, userType]);

  useEffect(() => {
    // Load Razorpay script when popup opens
    if (isOpen && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isOpen]);

  const loadPaymentPlans = async () => {
    try {
      setLoading(true);
      setError('');
      
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setError('Please login to view payment plans.');
        return;
      }
      
      const plans = await getPaymentPlans(userType);
      setPlanConfig(plans);
      setSelectedPlan(plans.defaultPlan);
    } catch (err) {
      console.error('Failed to load payment plans:', err);
      setError('Failed to load payment plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (plan) => {
    setPaymentLoading(true);
    setError('');

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Please login first to make a payment.');
      }

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
        description: `${planName} - ${planConfig.userDisplayName} Membership`,
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
              
              // Show success state
              setPaymentSuccess(true);
              setPaymentLoading(false);
              
              // Call success callback if provided
              if (onPaymentSuccess) {
                onPaymentSuccess({
                  plan: plan.name,
                  amount: plan.price,
                  paymentId: response.razorpay_payment_id
                });
              }
              
              // Close popup after a delay
              setTimeout(() => {
                setPaymentSuccess(false);
                onClose();
                // Refresh the page to update payment status
                window.location.reload();
              }, 2000);
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            setError('Payment verification failed. Please contact support.');
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: userProfile?.name || 'User Name',
          email: userProfile?.email || 'user@example.com',
          contact: userProfile?.phone || '9999999999'
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

  const handleSkipForNow = () => {
    onClose();
  };

  const selectedPlanData = planConfig?.plans?.find(plan => plan.id === selectedPlan);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-amber-500 text-2xl mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Complete Your Payment
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading payment options...</p>
                </div>
              ) : paymentSuccess ? (
                <div className="text-center py-8">
                  <FaCheck className="text-6xl text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                  <p className="text-gray-600">Your account will be activated shortly.</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <FaTimes className="text-6xl text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={loadPaymentPlans}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Warning Message */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-1">Payment Required</h4>
                        <p className="text-amber-800 text-sm">
                          Your account has limited access. Complete your payment to unlock all features including student management, event creation, and advanced analytics.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Plan Display */}
                  {selectedPlanData && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-6 border border-emerald-200">
                      <div className="text-center mb-4">
                        <h4 className="text-xl font-bold text-emerald-900 mb-1">
                          {selectedPlanData.name}
                        </h4>
                        <div className="flex items-center justify-center">
                          <span className="text-3xl font-bold text-emerald-600">
                            ₹{selectedPlanData.price.toLocaleString()}
                          </span>
                          <span className="text-emerald-700 ml-2">/{selectedPlanData.duration}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {selectedPlanData.features.slice(0, 6).map((feature, index) => (
                          <div key={index} className="flex items-center text-sm text-emerald-800">
                            <FaCheck className="text-emerald-600 mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {selectedPlanData.features.length > 6 && (
                          <div className="text-sm text-emerald-700 font-medium">
                            +{selectedPlanData.features.length - 6} more features...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => selectedPlanData && handlePayment(selectedPlanData)}
                      disabled={paymentLoading || !selectedPlanData}
                      className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                        paymentLoading ? 'cursor-not-allowed' : 'hover:shadow-lg'
                      }`}
                    >
                      <FaCreditCard className="mr-2" />
                      {paymentLoading ? 'Processing...' : `Pay ₹${selectedPlanData?.price.toLocaleString()}`}
                    </button>

                    <button
                      onClick={handleSkipForNow}
                      className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors duration-300 hover:bg-gray-50"
                    >
                      Skip for Now
                    </button>
                  </div>

                  {/* Trust Indicators */}
                  <div className="mt-6 text-center">
                    <div className="flex justify-center items-center space-x-6 text-gray-500 text-xs">
                      <span>🔒 Secure Payment</span>
                      <span>✅ Money Back Guarantee</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentPopup;