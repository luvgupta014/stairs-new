import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import api from '../../api';

const VerifyOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { userId, email, role, name } = location.state || {};

  useEffect(() => {
    if (!userId || !email || !role) {
      navigate('/');
    }
  }, [userId, email, role, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/verify-otp', {
        userId,
        otp: otpCode
      });

      if (response.data.success) {
        // Store token
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        // Check if payment is required
        if (response.data.data.requiresPayment) {
          // Store payment info and redirect to payment page
          const paymentData = {
            userId: response.data.data.user.id,
            role: response.data.data.user.role,
            profileId: response.data.data.user.profile?.id,
            email: response.data.data.user.email,
            name: response.data.data.user.profile?.name
          };
          localStorage.setItem('pendingPayment', JSON.stringify(paymentData));
          
          // Navigate to payment page based on role
          setTimeout(() => {
            if (role === 'COACH') {
              navigate('/coach/payment');
            } else if (role === 'INSTITUTE') {
              navigate('/institute/payment');
            } else if (role === 'CLUB') {
              navigate('/club/payment');
            }
          }, 1500);
        } else {
          // Navigate to appropriate dashboard
          setTimeout(() => {
            if (role === 'COACH') {
              navigate('/coach/dashboard');
            } else if (role === 'INSTITUTE') {
              navigate('/institute/dashboard');
            } else if (role === 'CLUB') {
              navigate('/club/dashboard');
            }
          }, 1500);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0').focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setResending(true);
    setError('');

    try {
      await api.post('/api/auth/resend-otp', { userId });
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0').focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'COACH': return 'from-blue-600 to-purple-600';
      case 'INSTITUTE': return 'from-orange-600 to-red-600';
      case 'CLUB': return 'from-indigo-600 to-purple-600';
      default: return 'from-blue-600 to-purple-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${getRoleColor()} p-8 text-white text-center`}>
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
            <p className="opacity-90">We've sent a code to</p>
            <p className="font-semibold">{email}</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter 6-digit OTP
              </label>
              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || otp.join('').length !== 6}
              className={`w-full py-3 rounded-lg font-medium text-white transition-all ${
                loading || otp.join('').length !== 6
                  ? 'bg-gray-300 cursor-not-allowed'
                  : `bg-gradient-to-r ${getRoleColor()} hover:shadow-lg transform hover:scale-105`
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <FaCheckCircle />
                  <span>Verify OTP</span>
                </div>
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Didn't receive the code?
              </p>
              <button
                onClick={handleResend}
                disabled={countdown > 0 || resending}
                className={`text-sm font-medium ${
                  countdown > 0 || resending
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {resending ? (
                  'Resending...'
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  'Resend OTP'
                )}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900 mx-auto"
              >
                <FaArrowLeft />
                <span>Back to Registration</span>
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-white rounded-lg p-4 shadow-md">
          <h3 className="font-semibold text-gray-900 mb-2">📧 Check your email</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Check your inbox and spam folder</li>
            <li>• OTP is valid for 10 minutes</li>
            <li>• Contact support if you don't receive it</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOtp;