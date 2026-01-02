import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { resetPassword } from '../../api';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    resetToken: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // If user refreshed the page, location.state may be lost. Allow manual email entry.
    // (No redirect here — keeps the flow resilient.)
  }, [formData.email, navigate]);

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

    // Validation
    if (!formData.email) {
      setModalMessage('Please enter your registered email.');
      setShowModal(true);
      return;
    }
    if (!formData.resetToken) {
      setModalMessage('Please enter the reset code');
      setShowModal(true);
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setModalMessage('Please fill in all password fields');
      setShowModal(true);
      return;
    }

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setModalMessage(passwordError);
      setShowModal(true);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setModalMessage('Passwords do not match');
      setShowModal(true);
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
        setModalMessage('Password reset successful! Redirecting to login...');
        setShowModal(true);

        setTimeout(() => {
          // Send users back to the correct login portal when possible.
          const portal = (location.state?.portal || '').toString().toLowerCase();
          const portalToLogin = {
            student: '/login/student',
            coach: '/login/coach',
            coordinator: '/login/coordinator',
            institute: '/login/institute',
            club: '/login/club',
            admin: '/login/admin',
            incharge: '/login/incharge'
          };

          navigate(portalToLogin[portal] || '/login/coach');
        }, 2000);
      } else {
        setModalMessage(result.message || 'Failed to reset password');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setModalMessage(error?.response?.data?.message || error.message || 'An error occurred. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the code sent to your email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!formData.email ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your registered email"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label htmlFor="resetToken" className="block text-sm font-medium text-gray-700">
                Reset Code
              </label>
              <div className="mt-1">
                <input
                  id="resetToken"
                  name="resetToken"
                  type="text"
                  required
                  value={formData.resetToken}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Check your email for the reset code
              </p>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                At least 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>

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
                onClick={() => {
                  const portal = (location.state?.portal || '').toString().toLowerCase();
                  const portalToLogin = {
                    student: '/login/student',
                    coach: '/login/coach',
                    coordinator: '/login/coordinator',
                    institute: '/login/institute',
                    club: '/login/club',
                    admin: '/login/admin',
                    incharge: '/login/incharge'
                  };
                  navigate(portalToLogin[portal] || '/login/student');
                }}
                className="text-sm font-medium text-gray-600 hover:text-gray-500"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Password Reset"
          message={modalMessage}
        />
      )}
    </div>
  );
};

export default ResetPassword;