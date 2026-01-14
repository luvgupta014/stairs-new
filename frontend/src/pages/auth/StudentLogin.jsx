import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate } from 'react-icons/fa';
import LoginLayout from '../../components/LoginLayout';
import ErrorPopup from '../../components/ErrorPopup';
import { useAuth } from '../../contexts/AuthContext';
import { parseLoginError } from '../../utils/errorUtils';
import { requestVerificationOtp } from '../../api';

const StudentLogin = () => {
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
    setLastEmail(formData?.email || '');
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
                  navigate('/verify-otp', { state: { userId: p.userId, email: p.email || formData?.email || lastEmail, role: p.role || 'STUDENT', name: p.name } });
                } else {
                  // If backend intentionally hid existence, just close with guidance.
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
      console.error('Login error:', err);
      // Parse catch errors too
      const errorConfig = parseLoginError(err.message || err, 'student');
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
                navigate('/verify-otp', { state: { userId: p.userId, email: p.email || lastEmail, role: p.role || 'STUDENT', name: p.name } });
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
        primaryAction={errorPopup.primaryAction}
        secondaryAction={errorPopup.secondaryAction}
      />
    </>
  );
};

export default StudentLogin;