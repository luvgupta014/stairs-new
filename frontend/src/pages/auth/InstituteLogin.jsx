import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding } from 'react-icons/fa';
import LoginLayout from '../../components/LoginLayout';
import { useAuth } from '../../contexts/AuthContext';

const InstituteLogin = () => {
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
      // Check if it's a demo login
      if (formData.email.startsWith('demo@')) {
        // Use demo authentication
        const result = await login({ email: formData.email, password: formData.password }, 'institute');
        if (result.success) {
          navigate('/dashboard/institute');
        } else {
          setError(result.message || 'Demo login failed');
        }
      } else {
        // Use real API authentication
        const result = await login({ email: formData.email, password: formData.password }, 'institute');
        if (result.success) {
          navigate('/dashboard/institute');
        } else {
          setError(result.message || 'Login failed');
        }
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
      role="Institute"
      title="Institute Login"
      subtitle="Manage your institution and oversee operations"
      icon={<FaBuilding />}
      onSubmit={handleLogin}
      loading={loading}
      error={error}
      registerPath="/register/institute-premium"
      color="orange"
    />
  );
};

export default InstituteLogin;