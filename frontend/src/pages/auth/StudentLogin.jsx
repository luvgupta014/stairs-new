import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate } from 'react-icons/fa';
import LoginLayout from '../../components/LoginLayout';
import ErrorPopup from '../../components/ErrorPopup';
import { useAuth } from '../../contexts/AuthContext';
import { parseLoginError } from '../../utils/errorUtils';

const StudentLogin = () => {
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
      console.log('Login attempt with data:', { email: formData.email, password: '***' });
      
      // Use consistent parameter structure for both demo and real login
      const result = await login(formData, 'student');
      
      console.log('Login result:', { success: result.success, message: result.message });
      
      if (result.success) {
        // Check if there's a pending event registration
        const pendingEvent = localStorage.getItem('pendingEventRegistration');
        if (pendingEvent) {
          localStorage.removeItem('pendingEventRegistration');
          // Redirect to the public event page, which will then redirect to authenticated page
          navigate(`/event/${pendingEvent}`);
        } else {
        navigate('/dashboard/student');
        }
      } else {
        // Parse error and show popup
        const errorConfig = parseLoginError(result.message || result, 'student');
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
      const errorConfig = parseLoginError(err.message || err, 'student');
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
        role="Student"
        title="Athlete Login"
        subtitle="Access your learning dashboard and track your progress"
        icon={<FaUserGraduate />}
        onSubmit={handleLogin}
        loading={loading}
        error="" // Clear error since we're using popup
        registerPath="/register/student"
        color="blue"
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

export default StudentLogin;