import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png'; 

const Landing = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const { user, logout, isAuthenticated, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      id: 'student',
      title: 'Athlete',
      description: 'Find and connect with top coaches to enhance your skills',
      icon: '🎯',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      loginPath: '/login/student',
      registerPath: '/register/student',
      features: ['Find Expert Coaches', 'Join Sports Events', 'Track Progress', 'Connect with Peers']
    },
    {
      id: 'coach',
      title: 'Coordinator',
      description: 'Build your coaching business and mentor aspiring athletes',
      icon: '🏆',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      loginPath: '/login/coach',
      registerPath: '/register/coach-premium',
      features: ['Manage Students', 'Create Events', 'Track Performance', 'Grow Your Business']
    },
    {
      id: 'institute',
      title: 'Institute',
      description: 'Manage your sports institute and connect with talented athletes',
      icon: '🏫',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      loginPath: '/login/institute',
      registerPath: '/register/institute-premium',
      features: ['Manage Faculty', 'Student Enrollment', 'Event Management', 'Analytics Dashboard']
    },
    {
      id: 'club',
      title: 'Club',
      description: 'Connect sports enthusiasts and organize amazing sporting events',
      icon: '⚽',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      loginPath: '/login/club',
      registerPath: '/register/club-premium',
      features: ['Member Management', 'Event Organization', 'Community Building', 'Tournament Hosting']
    },
    {
      id: 'incharge',
      title: 'Event Incharge',
      description: 'Access and manage events assigned by the Admin',
      icon: '🛠️',
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      loginPath: '/login/incharge',
      registerPath: '/login/admin',
      features: ['Assigned Events', 'Result Upload (if permitted)', 'Certificates (if permitted)', 'Fee Management (if permitted)']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex-shrink-0 flex items-center"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  STAIRS
                </span>
              </motion.div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="flex items-baseline space-x-4">
                  <Link to="/about" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    About
                  </Link>
                  <Link to="/features" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Features
                  </Link>
                  <Link to="/contact" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Contact
                  </Link>
                </div>
              </div>
              
              {/* User Authentication Section */}
              {isAuthenticated() ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user?.profile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {user?.profile?.name || user?.name || 'User'}
                      </p>
                      <p className="text-gray-500 capitalize">
                        {user?.role?.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(getDashboardRoute())}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={logout}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login/admin"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Admin Login
                  </Link>
                  {/*<Link
                    to="/register/student"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </Link>*/}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {isAuthenticated() ? (
              // Personalized Hero for Logged-in Users
              <>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
                >
                  Welcome back,{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    {user?.profile?.name || user?.name || 'User'}!
                  </span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto"
                >
                  {user?.role === 'STUDENT' && "Continue your sports journey and connect with amazing coaches"}
                  {user?.role === 'COACH' && "Manage your students and grow your coaching business"}
                  {user?.role === 'INSTITUTE' && "Oversee your sports programs and track student progress"}
                  {user?.role === 'CLUB' && "Organize events and build your sports community"}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex justify-center space-x-4"
                >
                  <button
                    onClick={() => navigate(getDashboardRoute())}
                    className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-300 shadow-lg"
                  >
                    Go to Dashboard
                  </button>
                  {user?.role === 'COACH' && (
                    <button
                      onClick={() => navigate('/bulk-upload')}
                      className="bg-white text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors shadow-lg"
                    >
                      Add Students
                    </button>
                  )}
                </motion.div>
              </>
            ) : (
              // Default Hero for Non-logged-in Users
              <>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
                >
                  Welcome to{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    STAIRS
                  </span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto"
                >
                  The Society for Transformation, Inclusion and Recognition through Sports (STAIRS)
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto"
                >
                  Connect athletes with coordinators, manage institutes, and organize sporting events all in one platform
                </motion.p>
              </>
            )}
          </div>
        </div>

        {/* Floating Elements Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute bottom-40 right-10 w-12 h-12 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
        </div>
      </div>

      {/* Role Selection Section - Only for non-authenticated users */}
      {!isAuthenticated() && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Role
            </h2>
            <p className="text-lg text-gray-600">
            Select how you'd like to join the STAIRS community
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
              className={`relative group cursor-pointer ${
                selectedRole === role.id ? 'scale-105' : ''
              } transition-all duration-300`}
              onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 h-full border-2 border-transparent hover:border-gray-100">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${role.color} text-white text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {role.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{role.title}</h3>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">{role.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {role.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-500">
                        <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {selectedRole === role.id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      <Link
                        to={role.loginPath}
                        className={`block w-full ${role.color} ${role.hoverColor} text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200`}
                      >
                        Login
                      </Link>
                      <Link
                        to={role.registerPath}
                        className="block w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Register
                      </Link>
                    </motion.div>
                  )}

                  {selectedRole !== role.id && (
                    <button className={`w-full ${role.color} ${role.hoverColor} text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200`}>
                      Get Started
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      )}

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose STAIRS?
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to excel in sports, all in one platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Expert Coaching',
                description: 'Connect with certified coaches who can help you reach your potential'
              },
              {
                icon: '📊',
                title: 'Progress Tracking',
                description: 'Monitor your improvement with detailed analytics and performance metrics'
              },
              {
                icon: '🏆',
                title: 'Event Management',
                description: 'Discover and participate in sports events and competitions'
              },
              {
                icon: '🤝',
                title: 'Community',
                description: 'Join a vibrant community of athletes, coaches, and sports enthusiasts'
              },
              {
                icon: '💼',
                title: 'Business Growth',
                description: 'Coaches and institutes can grow their business and reach more students'
              },
              {
                icon: '🔒',
                title: 'Secure Platform',
                description: 'Your data is protected with enterprise-grade security measures'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
 {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img
                  src={logo}
                  alt="STAIRS Talent Hub Logo"
                  className="w-12 h-12 mr-3 object-contain"
                />
                <span className="text-xl font-bold">STAIRS Talent Hub</span>
              </div>
              <p className="text-gray-300 mb-4">
                Connecting students, coaches, clubs, and institutes to foster athletic excellence and development.
              </p>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/stairsngo/" className="text-gray-300 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://x.com/StairsNGO" className="text-gray-300 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://www.youtube.com/stairsngo" className="text-gray-300 hover:text-white transition-colors">
                  <span className="sr-only">YouTube</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/stairs/" className="text-gray-300 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.98 3.5C3.34 3.5 2 4.84 2 6.48c0 1.62 1.3 2.96 2.92 2.96h.03c1.66 0 3-1.34 3-2.96C7.95 4.84 6.61 3.5 4.98 3.5zM2.4 20.5h5.16V9H2.4v11.5zM9.34 9h4.94v1.57h.07c.69-1.23 2.38-2.52 4.9-2.52 5.24 0 6.2 3.45 6.2 7.93V20.5h-5.16v-7.72c0-1.84-.03-4.21-2.57-4.21-2.57 0-2.97 2.01-2.97 4.09V20.5H9.34V9z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="text-gray-300 hover:text-white transition-colors">
                    Events
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="text-gray-300 hover:text-white transition-colors">
                    Programs
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/help" className="text-gray-300 hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-gray-300 hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              © {new Date().getFullYear()} STAIRS Talent Hub. All rights reserved. STAIRS Talent Hub is a registered non-profit initiative.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;