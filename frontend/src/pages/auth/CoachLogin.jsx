import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserTie } from 'react-icons/fa';
import LoginLayout from '../../components/LoginLayout';
import { useAuth } from '../../contexts/AuthContext';

const CoachLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    try {
      const result = await login(formData, 'coach');
      
      if (result.success) {
        navigate('/dashboard/coach');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginLayout
      role="Coach"
      title="Coordinator Login"
      subtitle="Manage your Athlete and track their progress"
      icon={<FaUserTie />}
      onSubmit={handleLogin}
      loading={loading}
      error={error}
      registerPath="/register/coach-premium"
      color="green"
    />
  );
};

export default CoachLogin;
