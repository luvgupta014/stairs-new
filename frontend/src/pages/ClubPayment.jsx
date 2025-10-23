import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCrown, FaCheck, FaTimes, FaCreditCard, FaUsers } from 'react-icons/fa';

const ClubPayment = () => {
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/club/dashboard';

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

  const plans = [
    {
      id: 'standard',
      name: 'Standard Plan',
      price: 2999,
      originalPrice: 4499,
      duration: 'month',
      popular: true,
      features: [
        'Up to 200 members',
        'Event management',
        'Member analytics',
        'Priority support',
        'Mobile app access',
        'Bulk member import',
        'Custom branding',
        'Payment processing',
        'Club dashboard'
      ],
      notIncluded: [
        'White-label solution',
        'API access'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 5999,
      originalPrice: 8999,
      duration: 'month',
      popular: false,
      features: [
        'Unlimited members',
        'Event management',
        'Advanced analytics',
        'Priority support',
        'Mobile app access',
        'Bulk member import',
        'Custom branding',
        'Payment processing',
        'Club dashboard',
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
      const selectedPlanData = plans.find(plan => plan.id === selectedPlan);
      
      // For now, just simulate payment success and redirect
      // In a real implementation, you would integrate with Razorpay
      
      setTimeout(() => {
        localStorage.setItem('clubPaymentCompleted', 'true');
        navigate('/club/dashboard');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPayment = () => {
    navigate('/club/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaUsers className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Your Club Registration
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your plan to unlock all features and start managing your club
          </p>
        </div>

        {error && (
          <div className="mb-8 max-w-md mx-auto p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'ring-4 ring-indigo-500 ring-opacity-50'
                  : 'hover:shadow-2xl'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 text-sm font-medium">
                  <FaCrown className="inline mr-1" />
                  Most Popular
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-500 ml-2">/{plan.duration}</span>
                  {plan.originalPrice && (
                    <div className="mt-2">
                      <span className="text-lg text-gray-400 line-through">₹{plan.originalPrice}</span>
                      <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                        Save ₹{plan.originalPrice - plan.price}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <FaCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 opacity-50">
                      <FaTimes className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className={`w-6 h-6 rounded-full border-2 mx-auto ${
                    selectedPlan === plan.id
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPlan === plan.id && (
                      <FaCheck className="w-4 h-4 text-white m-0.5" />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment Actions */}
        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={handlePayment}
            disabled={loading}
            className={`w-full py-4 rounded-lg font-medium text-white transition-all ${
              loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transform hover:scale-105'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing Payment...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <FaCreditCard />
                <span>Pay ₹{plans.find(p => p.id === selectedPlan)?.price} Now</span>
              </div>
            )}
          </button>

          <button
            onClick={handleSkipPayment}
            className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            Skip Payment for Now
          </button>

          <p className="text-sm text-gray-500 text-center">
            You can complete payment later from your dashboard. Some features may be limited until payment is completed.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ClubPayment;