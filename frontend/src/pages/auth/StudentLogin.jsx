import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate } from 'react-icons/fa';
import LoginLayout from '../../components/LoginLayout';
import { useAuth } from '../../contexts/AuthContext';

const StudentLogin = () => {
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
    console.log('Login attempt with data:', { email: formData.email, password: '***' });
    
    // Use consistent parameter structure for both demo and real login
    const result = await login(formData, 'student');
    
    console.log('Login result:', { success: result.success, message: result.message });
    
    if (result.success) {
      navigate('/dashboard/student');
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
      role="Student"
      title="Athlete Login"
      subtitle="Access your learning dashboard and track your progress"
      icon={<FaUserGraduate />}
      onSubmit={handleLogin}
      loading={loading}
      error={error}
      registerPath="/register/student"
      color="blue"
    />
  );
};

export default StudentLogin;