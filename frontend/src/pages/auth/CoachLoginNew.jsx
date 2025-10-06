import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../../components/Spinner';

const CoachLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, loading, isAuthenticated, getDashboardRoute } = useAuth();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getDashboardRoute());
    }
  }, [isAuthenticated, navigate, getDashboardRoute]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email && !formData.phone) {
      setError('Please enter either email or phone number');
      return;
    }

    if (!formData.password) {
      setError('Please enter your password');
      return;
    }

    const loginData = {
      password: formData.password
    };

    // Add email or phone to login data
    if (formData.email) {
      loginData.email = formData.email;
    } else {
      loginData.phone = formData.phone;
    }

    const result = await login(loginData, 'coach');
    
    if (result.success) {
      navigate('/dashboard/coach');
    } else {
      setError(result.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear the other field when one is filled
    if (name === 'email' && value) {
      setFormData(prev => ({ ...prev, [name]: value, phone: '' }));
    } else if (name === 'phone' && value) {
      setFormData(prev => ({ ...prev, [name]: value, email: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Coach Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your coach account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                disabled={!!formData.phone}
              />
            </div>

            <div className="text-center text-sm text-gray-500">OR</div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                disabled={!!formData.email}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="#" className="font-medium text-green-600 hover:text-green-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner size="sm" color="white" /> : 'Sign In'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              New coach?{' '}
              <Link to="/register/coach" className="font-medium text-green-600 hover:text-green-500">
                Register here
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Not a coach?{' '}
              <span className="text-green-600">
                Try{' '}
                <Link to="/login/student" className="font-medium hover:underline">
                  Student
                </Link>
                {', '}
                <Link to="/login/club" className="font-medium hover:underline">
                  Club
                </Link>
                {', or '}
                <Link to="/login/institute" className="font-medium hover:underline">
                  Institute
                </Link>
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoachLogin;