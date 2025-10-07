import React, { createContext, useContext, useState } from 'react';

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
  const [loading, setLoading] = useState(false);

  // Simplified auth functions for testing
  const login = async (credentials) => {
    setLoading(true);
    try {
      // Demo authentication
      if (import.meta.env.DEV) {
        const demoUser = {
          id: 1,
          name: 'Demo User',
          email: credentials.email,
          role: credentials.role || 'STUDENT'
        };
        setUser(demoUser);
        localStorage.setItem('authToken', 'demo-token');
        return { user: demoUser, token: 'demo-token' };
      }
      // Real authentication would go here
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      console.log('Registration attempt:', userData);
      // Demo registration
      const newUser = {
        id: Date.now(),
        ...userData
      };
      setUser(newUser);
      return { user: newUser };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;