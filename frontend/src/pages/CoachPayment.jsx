import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCrown, FaCheck, FaTimes, FaCreditCard } from 'react-icons/fa';

const CoachPayment = () => {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from state (e.g., from event create page)
  const redirectPath = location.state?.from || '/dashboard/coach';

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 999,
      originalPrice: 1499,
      duration: 'month',
      popular: false,
      features: [
        'Up to 15 students',
        '2 events per month',
        'Basic analytics',
        'Email support',
        'Mobile app access'
      ],
      notIncluded: [
        'Priority support',
        'Advanced analytics',
        'Bulk student import',
        'Custom branding'
      ]
    },
    {
      id: 'professional',
      name: 'Professional Plan',
      price: 1999,
      originalPrice: 2999,
      duration: 'month',
      popular: true,
      features: [
        'Up to 50 students',
        'Unlimited events',
        'Advanced analytics',
        'Priority support',
        'Mobile app access',
        'Bulk student import',
        'Custom branding',
        'Payment processing'
      ],
      notIncluded: [
        'White-label solution',
        'API access'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 4999,
      originalPrice: 7499,
      duration: 'month',
      popular: false,
      features: [
        'Unlimited students',
        'Unlimited events',
        'Advanced analytics',
        'Priority support',
        'Mobile app access',
        'Bulk student import',
        'Custom branding',
        'Payment processing',
        'White-label solution',
        'API access',
        'Dedicated account manager'
      ],
      notIncluded: []
    }
  ];

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const plan = plans.find(p => p.id === selectedPlan);
      
      // Create Razorpay order (you'll need to implement the backend endpoint)
      const orderResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/coach/create-payment-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId: selectedPlan,
          amount: plan.price
        })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      // Razorpay payment options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_R72yQ8cKrLWlkY',
        amount: plan.price * 100, // Amount in paise
        currency: 'INR',
        name: 'StairsHub Coach',
        description: `${plan.name} Subscription`,
        order_id: orderData.data.orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/coach/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: selectedPlan
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Payment successful, redirect
              navigate(redirectPath, { 
                state: { 
                  paymentSuccess: true, 
                  message: 'Payment completed successfully! You now have full access to all features.' 
                } 
              });
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (error) {
            setError('Payment verification failed. Please contact support.');
            console.error('Payment verification error:', error);
          }
        },
        prefill: {
          name: 'Coach',
          email: localStorage.getItem('userEmail') || '',
          contact: localStorage.getItem('userPhone') || ''
        },
        theme: {
          color: '#059669'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment initialization failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Your Payment
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose your plan to unlock full access to student management, event creation, and advanced analytics.
            </p>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <FaTimes className="mr-2" />
              {error}
            </div>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                selectedPlan === plan.id
                  ? 'border-green-500 shadow-xl scale-105'
                  : 'border-gray-200 hover:border-green-300 hover:shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center">
                    <FaCrown className="mr-2" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div 
                className="p-8 cursor-pointer"
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-4xl font-bold text-green-600">₹{plan.price}</span>
                    <span className="text-gray-500 ml-2">/{plan.duration}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-sm text-gray-500 line-through">₹{plan.originalPrice}</span>
                    <span className="text-sm text-green-600 ml-2 font-semibold">
                      Save ₹{plan.originalPrice - plan.price}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center">
                      <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <div key={feature} className="flex items-center opacity-50">
                      <FaTimes className="text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-500">{feature}</span>
                    </div>
                  ))}
                </div>

                <div 
                  className={`w-6 h-6 rounded-full border-2 mx-auto transition-all ${
                    selectedPlan === plan.id 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-300'
                  }`}
                >
                  {selectedPlan === plan.id && (
                    <FaCheck className="text-white text-xs m-1" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Summary</h3>
              <div className="flex items-center justify-between text-lg">
                <span>Selected Plan:</span>
                <span className="font-semibold">{plans.find(p => p.id === selectedPlan)?.name}</span>
              </div>
              <div className="flex items-center justify-between text-2xl font-bold text-green-600 mt-2">
                <span>Total Amount:</span>
                <span>₹{plans.find(p => p.id === selectedPlan)?.price}</span>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCreditCard className="mr-3" />
                    Pay with Razorpay
                  </>
                )}
              </button>

              <button
                onClick={() => navigate(redirectPath)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">
                🔒 Secure payment powered by Razorpay
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Your payment information is encrypted and secure
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CoachPayment;