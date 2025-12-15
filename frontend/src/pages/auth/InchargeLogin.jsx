import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginLayout from '../../components/LoginLayout';
import ErrorPopup from '../../components/ErrorPopup';
import { useAuth } from '../../contexts/AuthContext';
import { parseLoginError } from '../../utils/errorUtils';

const InchargeLogin = () => {
  const [loading, setLoading] = useState(false);
  const [errorPopup, setErrorPopup] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (formData) => {
    setLoading(true);
    setErrorPopup({ isOpen: false, title: '', message: '', type: 'error' });
    try {
      const result = await login(formData, 'EVENT_INCHARGE');
      if (result.success) {
        navigate('/dashboard/incharge');
      } else {
        const errorConfig = parseLoginError(result.message || result, 'incharge');
        setErrorPopup({ isOpen: true, title: errorConfig.title, message: errorConfig.message, type: errorConfig.type });
      }
    } catch (err) {
      const errorConfig = parseLoginError(err.message || err, 'incharge');
      setErrorPopup({ isOpen: true, title: errorConfig.title, message: errorConfig.message, type: errorConfig.type });
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
      <ErrorPopup isOpen={errorPopup.isOpen} onClose={closeErrorPopup} title={errorPopup.title} message={errorPopup.message} type={errorPopup.type} />
    </>
  );
};

export default InchargeLogin;
