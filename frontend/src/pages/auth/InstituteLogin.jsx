import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding } from 'react-icons/fa';
import LoginLayout from '../../components/LoginLayout';
import ErrorPopup from '../../components/ErrorPopup';
import { useAuth } from '../../contexts/AuthContext';
import { parseLoginError } from '../../utils/errorUtils';

const InstituteLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorPopup, setErrorPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });
  const navigate = useNavigate();
  const { login, isAuthenticated, getDashboardRoute } = useAuth();

  // Remove auto-redirect to prevent immediate dashboard navigation
  // useEffect(() => {
  //   if (isAuthenticated()) {
  //     navigate(getDashboardRoute());
  //   }
  // }, [isAuthenticated, navigate, getDashboardRoute]);

  const handleLogin = async (formData) => {
    setLoading(true);
    setError('');
    setErrorPopup({ isOpen: false, title: '', message: '', type: 'error' });

    try {
      const result = await login({ email: formData.email, password: formData.password }, 'institute');
      if (result.success) {
        navigate('/dashboard/institute');
      } else {
        // Parse error and show popup
        const errorConfig = parseLoginError(result.message || result, 'institute');
        setErrorPopup({
          isOpen: true,
          title: errorConfig.title,
          message: errorConfig.message,
          type: errorConfig.type
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      // Parse catch errors too
      const errorConfig = parseLoginError(err.message || err, 'institute');
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
    <>
      <LoginLayout
        role="Institute"
        title="Institute Login"
        subtitle="Manage your institution and oversee operations"
        icon={<FaBuilding />}
        onSubmit={handleLogin}
        loading={loading}
        error="" // Clear error since we're using popup
        registerPath="/register/institute-premium"
        color="orange"
      />
      
      {/* Error Popup */}
      <ErrorPopup
        isOpen={errorPopup.isOpen}
        onClose={closeErrorPopup}
        title={errorPopup.title}
        message={errorPopup.message}
        type={errorPopup.type}
      />
    </>
  );
};

export default InstituteLogin;