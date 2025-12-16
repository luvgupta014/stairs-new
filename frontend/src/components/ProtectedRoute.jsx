import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute = ({ children, role, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated()) {
    // Redirect to appropriate login page based on current path
    const currentPath = location.pathname;
    let loginPath = '/login/student'; // default

    if (currentPath.includes('/coach')) {
      loginPath = '/login/coach';
    } else if (currentPath.includes('/coordinator')) {
      loginPath = '/login/coordinator';
    } else if (currentPath.includes('/institute')) {
      loginPath = '/login/institute';
    } else if (currentPath.includes('/club')) {
      loginPath = '/login/club';
    } else if (currentPath.includes('/admin')) {
      loginPath = '/login/admin';
    } else if (currentPath.includes('/incharge')) {
      loginPath = '/login/incharge';
    }

    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  const rolesToCheck = allowedRoles || (role ? [role] : null);

  // Check role-based access
  if (rolesToCheck && !rolesToCheck.includes(user.role)) {
    // Redirect to appropriate dashboard
    const userDashboard = `/dashboard/${user.role.toLowerCase()}`;
    return <Navigate to={userDashboard} replace />;
  }

  return children;
};

export default ProtectedRoute;