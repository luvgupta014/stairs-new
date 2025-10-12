import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoginLayout from '../../components/LoginLayout';

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (formData) => {
    setLoading(true);
    setError('');

    try {
      console.log('Attempting admin login with:', formData.email);
      
      // FIXED: Call login with correct parameters (credentials, role)
      const response = await login(formData, 'ADMIN');
      
      console.log('Admin login response:', response);
      
      if (response.success) {
        // Navigate to admin dashboard - FIXED path
        navigate('/dashboard/admin', { replace: true });
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <LoginLayout
        role="ADMIN"
        title="Admin Login"
        subtitle="Access the administrative dashboard"
        icon="🔐"
        color="red"
        registerPath="/admin/register"
        onSubmit={handleLogin}
        loading={loading}
        error={error}
      />

      {/* Additional Admin-specific Features */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="max-w-md mx-auto mt-8 bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Admin Access Features
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">User Management</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Event Approval</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700">Coach Verification</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">Analytics Dashboard</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Payment Monitoring</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span className="text-gray-700">System Reports</span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Security Notice</p>
              <p className="text-xs text-yellow-700 mt-1">
                Admin access is logged and monitored. Only authorized personnel should access this area.
              </p>
            </div>
          </div>
        </div>

        {/* Support Contact */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact{' '}
            <a 
              href="mailto:admin@stairs.com" 
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              admin@stairs.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;