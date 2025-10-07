import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Landing = () => {
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'Find and connect with top coaches to enhance your sports skills',
      icon: '🎯',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      loginPath: '/login/student',
      registerPath: '/register/student',
      features: ['Find Expert Coaches', 'Join Sports Events', 'Track Progress', 'Connect with Peers']
    },
    {
      id: 'coach',
      title: 'Coach',
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
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
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
              Sports Training and Athletic Instruction Registration System
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto"
            >
              Connect students with expert coaches, manage institutes, and organize sporting events all in one platform
            </motion.p>
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

      {/* Role Selection Section */}
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
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="ml-2 text-xl font-bold">STAIRS</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering the sports community with innovative technology and connecting talents worldwide.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  📘
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  📷
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 STAIRS. All rights reserved. Built with ❤️ for the sports community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;