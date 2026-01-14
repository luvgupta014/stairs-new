import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginLayout from '../../components/LoginLayout';
import ErrorPopup from '../../components/ErrorPopup';
import { useAuth } from '../../contexts/AuthContext';
import { parseLoginError } from '../../utils/errorUtils';
import { requestVerificationOtp } from '../../api';

const InchargeLogin = () => {
  const [loading, setLoading] = useState(false);
  const [lastEmail, setLastEmail] = useState('');
  const [errorPopup, setErrorPopup] = useState({ isOpen: false, title: '', message: '', type: 'error', primaryAction: null, secondaryAction: null });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (formData) => {
    setLoading(true);
    setLastEmail(formData?.email || '');
    setErrorPopup({ isOpen: false, title: '', message: '', type: 'error' });
    try {
      const result = await login(formData, 'EVENT_INCHARGE');
      if (result.success) {
        navigate('/dashboard/incharge');
      } else {
        const errorConfig = parseLoginError(result.message || result, 'incharge');
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
      const errorConfig = parseLoginError(err.message || err, 'incharge');
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
    <>
      <LoginLayout
        role="EVENT_INCHARGE"
        title="Event Incharge Login"
        subtitle="Access assigned events and manage results"
        icon="🛠️"
        color="orange"
        registerPath="/register/coach-premium"
        onSubmit={handleLogin}
        loading={loading}
        error=""
      />
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

export default InchargeLogin;
