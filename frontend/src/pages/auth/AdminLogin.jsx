import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoginLayout from '../../components/LoginLayout';
import ErrorPopup from '../../components/ErrorPopup';
import { parseLoginError } from '../../utils/errorUtils';
import { requestVerificationOtp } from '../../api';

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastEmail, setLastEmail] = useState('');
  const [errorPopup, setErrorPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error',
    primaryAction: null,
    secondaryAction: null
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (formData) => {
    setLoading(true);
    setError('');
    setLastEmail(formData?.email || '');
    setErrorPopup({ isOpen: false, title: '', message: '', type: 'error' });

    try {
      console.log('Attempting admin login with:', formData.email);
      
      // FIXED: Call login with correct parameters (credentials, role)
      const response = await login(formData, 'ADMIN');
      
      console.log('Admin login response:', response);
      
      if (response.success) {
        // Navigate to admin dashboard - FIXED path
        navigate('/dashboard/admin', { replace: true });
      } else {
        // Parse error and show popup
        const errorConfig = parseLoginError(response.message || response, 'admin');
        const needsVerify = errorConfig?.code === 'ACCOUNT_NOT_VERIFIED';
        setErrorPopup({
          isOpen: true,
          title: errorConfig.title,
          message: errorConfig.message,
          type: errorConfig.type,
          primaryAction: needsVerify ? {
            label: 'Resend & Verify',
            onClick: async () => {
              try {
                const resp = await requestVerificationOtp(formData?.email || lastEmail);
                const p = resp?.data;
                if (p?.userId) {
                  navigate('/verify-otp', { state: { userId: p.userId, email: p.email || formData?.email || lastEmail, role: p.role || 'ADMIN', name: p.name } });
                } else {
                  setErrorPopup((prev) => ({ ...prev, isOpen: true, message: 'If your account exists, a verification code has been sent. Please check your email (and spam) and try again.' }));
                }
              } catch (e) {
                setErrorPopup((prev) => ({ ...prev, isOpen: true, message: e?.message || 'Failed to request verification code. Please try again.' }));
              }
            }
          } : null,
          secondaryAction: needsVerify ? { label: 'Close', onClick: closeErrorPopup } : null
        });
      }
    } catch (err) {
      console.error('Admin login error:', err);
      // Parse catch errors too
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials and try again.';
      const errorConfig = parseLoginError(errorMessage, 'admin');
      const needsVerify = errorConfig?.code === 'ACCOUNT_NOT_VERIFIED';
      setErrorPopup({
        isOpen: true,
        title: errorConfig.title,
        message: errorConfig.message,
        type: errorConfig.type,
        primaryAction: needsVerify ? {
          label: 'Resend & Verify',
          onClick: async () => {
            try {
              const resp = await requestVerificationOtp(lastEmail);
              const p = resp?.data;
              if (p?.userId) {
                navigate('/verify-otp', { state: { userId: p.userId, email: p.email || lastEmail, role: p.role || 'ADMIN', name: p.name } });
              } else {
                setErrorPopup((prev) => ({ ...prev, isOpen: true, message: 'If your account exists, a verification code has been sent. Please check your email (and spam) and try again.' }));
              }
            } catch (e) {
              setErrorPopup((prev) => ({ ...prev, isOpen: true, message: e?.message || 'Failed to request verification code. Please try again.' }));
            }
          }
        } : null,
        secondaryAction: needsVerify ? { label: 'Close', onClick: closeErrorPopup } : null
      });
    } finally {
      setLoading(false);
    }
  };

  const closeErrorPopup = () => {
    setErrorPopup({ isOpen: false, title: '', message: '', type: 'error' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <LoginLayout
        role="ADMIN"
        title="Admin Login"
        subtitle="Access the administrative dashboard"
        icon="🔐"
        color="red"
        registerPath="/admin/register"
        onSubmit={handleLogin}
        loading={loading}
        error="" // Clear error since we're using popup
      />

      {/* Additional Admin-specific Features */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="max-w-md mx-auto mt-8 bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Admin Access Features
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">User Management</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Event Approval</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700">Coach Verification</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">Analytics Dashboard</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Payment Monitoring</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span className="text-gray-700">System Reports</span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Security Notice</p>
              <p className="text-xs text-yellow-700 mt-1">
                Admin access is logged and monitored. Only authorized personnel should access this area.
              </p>
            </div>
          </div>
        </div>

        {/* Support Contact */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact{' '}
            <a 
              href="mailto:admin@stairs.com" 
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              admin@stairs.com
            </a>
          </p>
        </div>
      </motion.div>
      
      {/* Error Popup */}
      <ErrorPopup
        isOpen={errorPopup.isOpen}
        onClose={closeErrorPopup}
        title={errorPopup.title}
        message={errorPopup.message}
        type={errorPopup.type}
        primaryAction={errorPopup.primaryAction}
        secondaryAction={errorPopup.secondaryAction}
      />
    </div>
  );
};

export default AdminLogin;