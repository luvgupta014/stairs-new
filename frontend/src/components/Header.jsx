import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login/student');
  };

  const isLoginPage = location.pathname.includes('/login');
  const isRegisterPage = location.pathname.includes('/register');

  const getDisplayName = () => {
    if (!user || !user.profile) return user?.role || 'User';
    
    const profile = user.profile;
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (profile.name) {
      return profile.name;
    }
    return user.email || user.role;
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              STAIRS Talent Hub
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {isAuthenticated() && user && (
              <>
                <Link
                  to={`/dashboard/${user.role.toLowerCase()}`}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                {user.role === 'COACH' && (
                  <>
                    <Link
                      to="/coach/event/create"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Create Event
                    </Link>
                    <Link
                      to="/coach/bulk-upload"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Bulk Upload
                    </Link>
                  </>
                )}
                {user.role === 'INSTITUTE' && (
                  <Link
                    to="/bulk-upload"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Bulk Upload
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center space-x-4">
            {isLoginPage ? (
              <div className="flex space-x-2">
                <Link
                  to="/login/student"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/login/student'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Student
                </Link>
                <Link
                  to="/login/coach"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/login/coach'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Coach
                </Link>
                <Link
                  to="/login/club"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/login/club'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Club
                </Link>
                <Link
                  to="/login/institute"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/login/institute'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Institute
                </Link>
              </div>
            ) : isRegisterPage ? (
              <div className="flex space-x-2">
                <Link
                  to="/register/student"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/register/student'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Student
                </Link>
                <Link
                  to="/register/coach"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/register/coach'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Coach
                </Link>
                <Link
                  to="/register/institute"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/register/institute'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Institute
                </Link>
              </div>
            ) : isAuthenticated() && user ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-blue-600 focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {getDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:block">{getDisplayName()}</span>
                    <span className="text-xs text-gray-500 hidden md:block">({user.role})</span>
                  </button>
                  
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to={`/dashboard/${user.role.toLowerCase()}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to={`/dashboard/${user.role.toLowerCase()}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login/student"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register/student"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;