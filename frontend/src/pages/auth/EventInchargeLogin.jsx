import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoginLayout from '../../components/LoginLayout';
import ErrorPopup from '../../components/ErrorPopup';
import { parseLoginError } from '../../utils/errorUtils';

const EventInchargeLogin = () => {
  const [loading, setLoading] = useState(false);
  const [errorPopup, setErrorPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (formData) => {
    setLoading(true);
    setErrorPopup({ isOpen: false, title: '', message: '', type: 'error' });

    try {
      const response = await login(formData, 'EVENT_INCHARGE');
      if (response.success) {
        navigate('/dashboard/event_incharge', { replace: true });
      } else {
        const errorConfig = parseLoginError(response.message || response, 'event incharge');
        setErrorPopup({
          isOpen: true,
          title: errorConfig.title,
          message: errorConfig.message,
          type: errorConfig.type
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials and try again.';
      const errorConfig = parseLoginError(errorMessage, 'event incharge');
      setErrorPopup({
        isOpen: true,
        title: errorConfig.title,
        message: errorConfig.message,
        type: errorConfig.type
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
      <LoginLayout
        role="EVENT_INCHARGE"
        title="Event Incharge Login"
        subtitle="Access your assigned events and tasks"
        icon="🛠️"
        color="indigo"
        registerPath="/login/admin" // no self-register; point to admin login
        onSubmit={handleLogin}
        loading={loading}
        error=""
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="max-w-md mx-auto mt-6 bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
          Event Incharge Access
        </h3>
        <p className="text-sm text-gray-700 text-center">
          Use the credentials provided by Admin. You will see only the events assigned to you.
        </p>
      </motion.div>

      <ErrorPopup
        isOpen={errorPopup.isOpen}
        onClose={closeErrorPopup}
        title={errorPopup.title}
        message={errorPopup.message}
        type={errorPopup.type}
      />
    </div>
  );
};

export default EventInchargeLogin;

