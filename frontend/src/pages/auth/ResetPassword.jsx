import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../api';
import Spinner from '../../components/Spinner';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | success
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [redirectIn, setRedirectIn] = useState(4);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    resetToken: '',
    newPassword: '',
    confirmPassword: ''
  });

  const portal = useMemo(() => (location.state?.portal || '').toString().toLowerCase(), [location.state]);

  const loginPath = useMemo(() => {
    const portalToLogin = {
      student: '/login/student',
      coach: '/login/coach',
      coordinator: '/login/coordinator',
      institute: '/login/institute',
      club: '/login/club',
      admin: '/login/admin',
      incharge: '/login/incharge'
    };
    return portalToLogin[portal] || '/login/student';
  }, [portal]);

  const portalLabel = useMemo(() => {
    const map = {
      student: 'Student',
      coach: 'Coach',
      coordinator: 'Coordinator',
      institute: 'Institute',
      club: 'Club',
      admin: 'Admin',
      incharge: 'Event Incharge'
    };
    return map[portal] || 'Login';
  }, [portal]);

  // Auto redirect countdown on success
  useEffect(() => {
    if (status !== 'success') return;
    if (redirectIn <= 0) {
      navigate(loginPath, { replace: true });
      return;
    }
    const t = setTimeout(() => setRedirectIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [status, redirectIn, navigate, loginPath]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email) {
      setError('Please enter your registered email.');
      return;
    }
    if (!formData.resetToken) {
      setError('Please enter the reset code.');
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Resetting password with:', {
        email: formData.email,
        resetToken: formData.resetToken,
        passwordLength: formData.newPassword.length
      });
      
      const result = await resetPassword(
        formData.email,
        formData.resetToken,
        formData.newPassword
      );
      
      console.log('✅ Reset password result:', result);

      if (result.success) {
        const payload = result?.data || null;
        if (payload?.requiresVerification && payload?.userId) {
          setSuccessMessage('Password updated. Your account still needs email verification — we sent a new verification code.');
          setStatus('success');
          // Take them directly to verify flow
          setTimeout(() => {
            navigate('/verify-otp', {
              replace: true,
              state: {
                userId: payload.userId,
                email: payload.email || formData.email,
                role: payload.role || 'STUDENT',
                name: payload.name
              }
            });
          }, 800);
        } else {
          setSuccessMessage('Your password has been updated successfully.');
          setRedirectIn(4);
          setStatus('success');
        }
      } else {
        setError(result.message || 'Failed to reset password.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error?.userMessage || error?.response?.data?.message || error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home */}
        <div className="text-left">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 text-white text-2xl mb-4">
              🔐
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {status === 'success' ? 'Password Updated' : 'Reset Password'}
            </h2>
            <p className="text-gray-600 mb-6">
              {status === 'success'
                ? `Redirecting you to ${portalLabel} login…`
                : 'Enter the code sent to your email and set a new password.'}
            </p>
          </div>

          {/* Success */}
          {status === 'success' ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold">{successMessage || 'Password reset successful.'}</div>
                    <div className="text-sm mt-1">
                      Redirecting in <span className="font-semibold">{redirectIn}s</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(loginPath, { replace: true })}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Go to {portalLabel} Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password', { replace: true })}
                  className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Request New Code
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error */}
              {error ? (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              ) : null}

              {/* Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {!formData.email ? (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter your registered email"
                    />
                  </div>
                ) : null}

                <div>
                  <label htmlFor="resetToken" className="block text-sm font-medium text-gray-700 mb-2">
                    Reset Code
                  </label>
                  <input
                    id="resetToken"
                    name="resetToken"
                    type="text"
                    required
                    value={formData.resetToken}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                  <p className="mt-2 text-xs text-gray-500">Check your email for the reset code.</p>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.newPassword}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">At least 6 characters.</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showConfirmPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" color="white" />
                      <span className="ml-2">Resetting…</span>
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    ← Request new code
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(loginPath)}
                    className="text-sm font-medium text-gray-600 hover:text-gray-500"
                  >
                    Back to {portalLabel} Login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">© 2026 STAIRS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;