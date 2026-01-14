import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoginLayout from '../../components/LoginLayout';
import ErrorPopup from '../../components/ErrorPopup';
import { parseLoginError } from '../../utils/errorUtils';
import { requestVerificationOtp } from '../../api';

const EventInchargeLogin = () => {
  const [loading, setLoading] = useState(false);
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
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (formData) => {
    setLoading(true);
    setLastEmail(formData?.email || '');
    setErrorPopup({ isOpen: false, title: '', message: '', type: 'error' });

    try {
      const response = await login(formData, 'EVENT_INCHARGE');
      if (response.success) {
        // Prefer redirect back to the originally requested page (e.g. from an email deep-link),
        // otherwise land on the incharge dashboard.
        const fromState = location.state?.from;
        const fromPath =
          fromState && typeof fromState === 'object'
            ? `${fromState.pathname || ''}${fromState.search || ''}${fromState.hash || ''}`
            : '';

        const qs = new URLSearchParams(location.search || '');
        const redirect = (qs.get('redirect') || '').toString();

        const target = fromPath || redirect || '/dashboard/event_incharge';
        navigate(target, { replace: true });
      } else {
        const errorConfig = parseLoginError(response.message || response, 'event incharge');
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
                  navigate('/verify-otp', { state: { userId: p.userId, email: p.email || formData?.email || lastEmail, role: p.role || 'EVENT_INCHARGE', name: p.name } });
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
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials and try again.';
      const errorConfig = parseLoginError(errorMessage, 'event incharge');
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
                navigate('/verify-otp', { state: { userId: p.userId, email: p.email || lastEmail, role: p.role || 'EVENT_INCHARGE', name: p.name } });
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  STAIRS
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="flex items-baseline space-x-4">
                  <Link to="/about" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    About
                  </Link>
                  <Link to="/features" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Features
                  </Link>
                  <Link to="/contact" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Contact
                  </Link>
                  <Link to="/login/admin" className="text-indigo-600 hover:text-indigo-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Admin Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <LoginLayout
            role="EVENT_INCHARGE"
            title="Event Incharge Login"
            subtitle="Access your assigned events and tasks"
            icon="🛠️"
            color="indigo"
            registerPath={null} // no self-register; admin creates accounts
            onSubmit={handleLogin}
            loading={loading}
            error=""
          />

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
              Event Incharge Access
            </h3>
            <p className="text-sm text-gray-700 text-center mb-4">
              Use the credentials provided by Admin. You will see only the events assigned to you.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Need help? Contact your administrator or visit our{' '}
                <Link to="/contact" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Contact
                </Link>{' '}
                page.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

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

export default EventInchargeLogin;

