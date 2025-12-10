import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any stale authentication data first
    clearStaleAuth();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      // Try to get user profile based on role
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        // Skip API calls for demo users
        if (token && token.startsWith('demo-token-')) {
          setUser(userData);
          setLoading(false);
          return;
        }
        
        // Fetch fresh profile data for real users
        let profileResponse;
        switch (userData.role) {
          case 'STUDENT':
            profileResponse = await api.get('/api/student/profile');
            break;
          case 'COACH':
            profileResponse = await api.get('/api/coach/profile');
            break;
          case 'INSTITUTE':
            profileResponse = await api.get('/api/institute/profile');
            break;
          case 'CLUB':
            profileResponse = await api.get('/api/club/profile');
            break;
          case 'ADMIN':
            profileResponse = await api.get('/api/admin/profile');
            break;
          case 'EVENT_INCHARGE':
            // No dedicated profile endpoint; trust stored user data
            profileResponse = { data: { success: true, data: userData.profile || {} } };
            break;
          default:
            throw new Error('Invalid user role');
        }
        
        if (profileResponse.data.success) {
          const updatedUser = {
            ...userData,
            profile: profileResponse.data.data
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          throw new Error('Profile fetch failed');
        }
      } else {
        throw new Error('No user data found');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials, role) => {
    try {
      setLoading(true);
      
      // Demo login for development - Fixed for Vite
      if (import.meta.env.DEV && credentials.email && credentials.email.startsWith('demo@')) {
        const demoUser = {
          id: `demo-${role}-${Date.now()}`,
          email: credentials.email,
          role: role.toUpperCase(),
          name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          isVerified: true,
          profile: {
            firstName: 'Demo',
            lastName: role.charAt(0).toUpperCase() + role.slice(1),
            phone: '+1234567890',
            dateOfBirth: '1990-01-01',
            createdAt: new Date().toISOString(),
            // Add role-specific demo data
            ...(role === 'student' && {
              parentContact: '+1234567891',
              school: 'Demo High School'
            }),
            ...(role === 'coach' && {
              specialization: 'Football, Basketball',
              experience: '5 years',
              city: 'Demo City',
              state: 'Demo State',
              certifications: 'UEFA Level 1, Basketball Coaching'
            }),
            ...(role === 'institute' && {
              instituteName: 'Demo Sports Institute',
              address: '123 Demo Street',
              city: 'Demo City',
              state: 'Demo State',
              website: 'https://demo-institute.com'
            }),
            ...(role === 'club' && {
              clubName: 'Demo Sports Club',
              address: '456 Demo Avenue',
              city: 'Demo City',
              state: 'Demo State',
              establishedYear: '2020'
            })
          }
        };
        
        const demoToken = `demo-token-${role}-${Date.now()}`;
        
        // Store demo session
        localStorage.setItem('authToken', demoToken);
        localStorage.setItem('user', JSON.stringify(demoUser));
        
        setToken(demoToken);
        setUser(demoUser);
        
        return { success: true, user: demoUser };
      }
      
      // Production API login
      console.log('🔄 Attempting login with:', {
        email: credentials.email,
        role: role.toUpperCase(),
        hasPassword: !!credentials.password
      });
      
      const response = await api.post('/api/auth/login', {
        email: credentials.email,
        password: credentials.password,
        role: role.toUpperCase()
      });

      console.log('✅ Login API response:', response.data);

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data;
        
        // Store token and user data
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setToken(newToken);
        setUser(userData);
        
        // Set token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        return { success: true, user: userData };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('❌ Login error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      // Extract the error message from the response
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      
      return { 
        success: false, 
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data, role) => {
    try {
      setLoading(true);
      console.log('Attempting registration with role:', role);
      console.log('Registration data:', { ...data, password: '***' });
      
      const response = await api.post(`/api/auth/${role}/register`, data);
      console.log('Registration response:', response.data);

      if (response.data.success) {
        return { 
          success: true, 
          data: response.data.data,
          message: response.data.message 
        };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Registration failed' 
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (userId, otp) => {
    try {
      setLoading(true);
      const response = await api.post('/api/auth/verify-otp', { userId, otp });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data;
        
        // Store token and user data
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setToken(newToken);
        setUser(userData);
        
        // Set token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        return { success: true, user: userData };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'OTP verification failed.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (userId) => {
    try {
      const response = await api.post('/api/auth/resend-otp', { userId });
      return { 
        success: response.data.success, 
        message: response.data.message 
      };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to resend OTP.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  const clearStaleAuth = () => {
    // Clear any stale authentication data
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    // Clear if token exists but user doesn't, or vice versa
    if ((storedToken && !storedUser) || (!storedToken && storedUser)) {
      logout();
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      let endpoint;
      
      switch (user.role) {
        case 'STUDENT':
          endpoint = '/api/student/profile';
          break;
        case 'COACH':
          endpoint = '/api/coach/profile';
          break;
        case 'INSTITUTE':
          endpoint = '/api/institute/profile';
          break;
        case 'CLUB':
          endpoint = '/api/club/profile';
          break;
        default:
          throw new Error('Invalid user role');
      }

      const response = await api.put(endpoint, profileData);

      if (response.data.success) {
        const updatedUser = {
          ...user,
          profile: response.data.data
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return { success: true, data: response.data.data };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Profile update failed.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (!user) return;
      
      let endpoint;
      switch (user.role) {
        case 'STUDENT':
          endpoint = '/api/student/profile';
          break;
        case 'COACH':
          endpoint = '/api/coach/profile';
          break;
        case 'INSTITUTE':
          endpoint = '/api/institute/profile';
          break;
        case 'CLUB':
          endpoint = '/api/club/profile';
          break;
        default:
          return;
      }

      const response = await api.get(endpoint);
      
      if (response.data.success) {
        const updatedUser = {
          ...user,
          profile: response.data.data
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('User context refreshed with updated profile');
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const getDashboardRoute = () => {
    if (!user) return '/login/student';
    return `/dashboard/${user.role.toLowerCase()}`;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    verifyOtp,
    resendOtp,
    logout,
    clearStaleAuth,
    updateProfile,
    refreshUser,
    isAuthenticated,
    getDashboardRoute
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};