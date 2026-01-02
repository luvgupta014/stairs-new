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

    // Optional override: allow deep links like /events/:id?portal=incharge to route to the right login.
    const searchParams = new URLSearchParams(location.search || '');
    const portal = (searchParams.get('portal') || searchParams.get('role') || '').toString().toLowerCase();

    const portalToLogin = {
      student: '/login/student',
      coach: '/login/coach',
      coordinator: '/login/coordinator',
      institute: '/login/institute',
      club: '/login/club',
      admin: '/login/admin',
      incharge: '/login/incharge',
      event_incharge: '/login/incharge',
      'event-incharge': '/login/incharge',
    };

    if (portal && portalToLogin[portal]) {
      loginPath = portalToLogin[portal];
    }

    // If no explicit portal is present and the path is generic (e.g. /events),
    // use last authenticated role as a hint so logout never sends incharge → student login.
    if (!portal) {
      const lastRole = (localStorage.getItem('lastAuthRole') || '').toString().toUpperCase();
      if (lastRole === 'EVENT_INCHARGE') {
        loginPath = '/login/incharge';
      } else if (lastRole === 'ADMIN') {
        loginPath = '/login/admin';
      } else if (lastRole === 'INSTITUTE') {
        loginPath = '/login/institute';
      } else if (lastRole === 'CLUB') {
        loginPath = '/login/club';
      } else if (lastRole === 'COACH') {
        loginPath = '/login/coach';
      }
    }

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
    } else if (currentPath.includes('/incharge') || currentPath.includes('/event_incharge')) {
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