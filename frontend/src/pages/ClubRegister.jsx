import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaUserTie, 
  FaTrophy, 
  FaCrown, 
  FaCheck, 
  FaArrowRight, 
  FaArrowLeft,
  FaCalendarAlt,
  FaMedal,
  FaHandshake,
  FaChartLine
} from 'react-icons/fa';
import RegistrationSuccessModal from '../components/RegistrationSuccessModal';
import api from '../api';

const ClubRegister = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    // Step 1: Club Info
    clubName: '',
    email: '',
    phone: '',
    website: '',
    foundedYear: '',
    clubType: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Management
    presidentName: '',
    presidentContact: '',
    secretaryName: '',
    secretaryContact: '',
    coachName: '',
    coachExperience: '',
    
    // Step 3: Activities & Sports
    primarySports: [],
    competitions: [],
    membershipLevels: [],
    facilities: ''
  });
  
  const navigate = useNavigate();

  // Validator functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  const validateMobile = (mobile) => /^\d{10}$/.test((mobile || '').replace(/\D/g, ''));
  const validatePassword = (password) => password.length >= 6;

  // Real-time field validation
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'clubName':
        if (!value.trim()) {
          errors.clubName = 'Club name is required';
        } else if (value.trim().length < 3) {
          errors.clubName = 'Name must be at least 3 characters';
        } else {
          delete errors.clubName;
        }
        break;

      case 'email':
        if (!value) {
          errors.email = 'Email is required';
        } else if (!validateEmail(value)) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;

      case 'phone':
        if (!value) {
          errors.phone = 'Phone number is required';
        } else if (!/^\d*$/.test(value)) {
          errors.phone = 'Phone must contain only numbers';
        } else if (value.length < 10) {
          errors.phone = `Phone must be 10 digits (${value.length}/10)`;
        } else if (value.length > 10) {
          errors.phone = 'Phone cannot exceed 10 digits';
        } else {
          delete errors.phone;
        }
        break;

      case 'presidentContact':
        if (value && !/^\d*$/.test(value)) {
          errors.presidentContact = 'Phone must contain only numbers';
        } else if (value && value.length < 10) {
          errors.presidentContact = `Phone must be 10 digits (${value.length}/10)`;
        } else if (value && value.length > 10) {
          errors.presidentContact = 'Phone cannot exceed 10 digits';
        } else {
          delete errors.presidentContact;
        }
        break;

      case 'secretaryContact':
        if (value && !/^\d*$/.test(value)) {
          errors.secretaryContact = 'Phone must contain only numbers';
        } else if (value && value.length < 10) {
          errors.secretaryContact = `Phone must be 10 digits (${value.length}/10)`;
        } else if (value && value.length > 10) {
          errors.secretaryContact = 'Phone cannot exceed 10 digits';
        } else {
          delete errors.secretaryContact;
        }
        break;

      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 6) {
          errors.password = `Password must be at least 6 characters (${value.length}/6)`;
        } else {
          delete errors.password;
        }
        break;

      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;

      default:
        break;
    }

    setFieldErrors(errors);
  };

  // Helper component for field error display
  const FieldError = ({ fieldName }) => {
    return fieldErrors[fieldName] ? (
      <p className="text-sm text-red-500 mt-1 flex items-center space-x-1">
        <span>⚠️</span>
        <span>{fieldErrors[fieldName]}</span>
      </p>
    ) : null;
  };

  const steps = [
    {
      id: 1,
      title: 'Club Information',
      subtitle: 'Tell us about your club',
      icon: FaUsers,
      color: 'indigo'
    },
    {
      id: 2,
      title: 'Management Team',
      subtitle: 'Who runs the club',
      icon: FaUserTie,
      color: 'blue'
    },
    {
      id: 3,
      title: 'Activities & Sports',
      subtitle: 'What you offer',
      icon: FaTrophy,
      color: 'purple'
    }
  ];

  const clubTypes = [
    'Sports Club', 'Athletic Club', 'Recreation Club', 'Community Club',
    'Professional Club', 'Youth Club', 'Multi-Sport Club', 'Elite Club'
  ];

  const sportsOptions = [
    'Football', 'Basketball', 'Cricket', 'Tennis', 'Swimming', 
    'Badminton', 'Hockey', 'Athletics', 'Volleyball', 'Boxing',
    'Table Tennis', 'Wrestling', 'Archery', 'Gymnastics', 'Golf',
    'Cycling', 'Marathon', 'Martial Arts'
  ];

  const competitionTypes = [
    'Local Tournaments', 'State Championships', 'National Competitions',
    'International Events', 'Youth Leagues', 'Professional Circuits',
    'Corporate Tournaments', 'Charity Events'
  ];

  const membershipOptions = [
    'Junior Members (Under 18)', 'Senior Members (18+)', 'Premium Members',
    'Life Members', 'Corporate Members', 'Honorary Members'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = async () => {
    // Validate current step before proceeding
    let hasErrors = false;
    
    if (currentStep === 1) {
      // Step 1: Club Information validation
      if (!formData.clubName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword || !formData.clubType) {
        setError('Please fill in all required fields');
        hasErrors = true;
      } else if (Object.keys(fieldErrors).length > 0) {
        setError('Please fix the errors in the form before continuing');
        hasErrors = true;
      } else if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        hasErrors = true;
      }
    } else if (currentStep === 2) {
      // Step 2: Management Team validation
      if (!formData.presidentName || !formData.presidentContact || !formData.secretaryName) {
        setError('Please fill in all required management information');
        hasErrors = true;
      } else if (fieldErrors.presidentContact || fieldErrors.secretaryContact) {
        setError('Please fix the phone number errors before continuing');
        hasErrors = true;
      }
    }
    
    if (!hasErrors && currentStep < 3) {
      setError('');
      setCurrentStep(currentStep + 1);
    } else if (!hasErrors && currentStep === 3) {
      // Final step - submit the form
      await handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);
      
      // Validation
      if (!formData.clubName || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      const registrationData = {
        name: formData.clubName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        address: '',
        website: formData.website,
        sportsOffered: formData.primarySports,
        contactPerson: formData.presidentName,
        establishedYear: formData.foundedYear
      };

      const response = await api.post('/api/auth/club/register', registrationData);

      if (response.data.success) {
        navigate('/verify-otp', {
          state: {
            userId: response.data.data.userId,
            email: formData.email,
            role: 'CLUB',
            name: formData.clubName
          }
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
  };

  const handleContinueToDashboard = () => {
    setShowSuccessModal(false);
    navigate('/login/club');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl text-gray-900">STAIRS</span>
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
              Club
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="hidden lg:flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.id 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? <FaCheck /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate('/login/club')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Already registered?
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Step Header */}
              <div className={`bg-gradient-to-r ${
                currentStep === 1 ? 'from-indigo-500 to-indigo-600' :
                currentStep === 2 ? 'from-blue-500 to-blue-600' :
                currentStep === 3 ? 'from-purple-500 to-purple-600' :
                'from-yellow-400 to-orange-500'
              } p-8 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      {React.createElement(steps[currentStep - 1].icon, { className: "w-8 h-8" })}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{steps[currentStep - 1].title}</h2>
                      <p className="text-lg opacity-90">{steps[currentStep - 1].subtitle}</p>
                    </div>
                  </div>
                  
                  <div className="text-right hidden md:block">
                    <div className="text-sm opacity-75">Step {currentStep} of {steps.length}</div>
                    <div className="text-lg font-semibold">{Math.round((currentStep / steps.length) * 100)}% Complete</div>
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <div className="p-8">
                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start space-x-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}
                
                {/* Step 1: Club Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Club Name *
                      </label>
                      <input
                        type="text"
                        value={formData.clubName}
                        onChange={(e) => handleInputChange('clubName', e.target.value)}
                        className={`w-full px-4 py-3 border ${fieldErrors.clubName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                        placeholder="Champions Sports Club"
                      />
                      <FieldError fieldName="clubName" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Official Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full px-4 py-3 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                          placeholder="info@championsclub.com"
                        />
                        <FieldError fieldName="email" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Number * (10 digits)
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`w-full px-4 py-3 border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                          placeholder="+91 9876543210"
                        />
                        <FieldError fieldName="phone" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website/Social Media
                        </label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="https://www.championsclub.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Founded Year *
                        </label>
                        <input
                          type="number"
                          value={formData.foundedYear}
                          onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="2015"
                          min="1900"
                          max="2024"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Club Type *
                      </label>
                      <select
                        value={formData.clubType}
                        onChange={(e) => handleInputChange('clubType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        <option value="">Select Club Type</option>
                        {clubTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Password Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password * (minimum 6 characters)
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={`w-full px-4 py-3 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                          placeholder="••••••••"
                        />
                        <FieldError fieldName="password" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className={`w-full px-4 py-3 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                          placeholder="••••••••"
                        />
                        <FieldError fieldName="confirmPassword" />
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h3 className="font-semibold text-indigo-800 mb-2">🏆 Welcome to STAIRS Club Network</h3>
                      <p className="text-sm text-indigo-700">
                        Join India's premier sports club management platform and connect with athletes, coaches, and other clubs nationwide.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Management Team */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-2">👥 Management Team</h3>
                      <p className="text-sm text-blue-700">
                        Provide details of key management members who will have administrative access.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          President Name *
                        </label>
                        <input
                          type="text"
                          value={formData.presidentName}
                          onChange={(e) => handleInputChange('presidentName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Rajesh Kumar"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          President Contact * (10 digits)
                        </label>
                        <input
                          type="tel"
                          value={formData.presidentContact}
                          onChange={(e) => handleInputChange('presidentContact', e.target.value)}
                          className={`w-full px-4 py-3 border ${fieldErrors.presidentContact ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                          placeholder="+91 9876543210"
                        />
                        <FieldError fieldName="presidentContact" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secretary Name *
                        </label>
                        <input
                          type="text"
                          value={formData.secretaryName}
                          onChange={(e) => handleInputChange('secretaryName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Priya Sharma"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secretary Contact (10 digits)
                        </label>
                        <input
                          type="tel"
                          value={formData.secretaryContact}
                          onChange={(e) => handleInputChange('secretaryContact', e.target.value)}
                          className={`w-full px-4 py-3 border ${fieldErrors.secretaryContact ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                          placeholder="+91 9876543210"
                        />
                        <FieldError fieldName="secretaryContact" />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Head Coach Information</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Head Coach Name
                          </label>
                          <input
                            type="text"
                            value={formData.coachName}
                            onChange={(e) => handleInputChange('coachName', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Suresh Raina"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Coaching Experience (Years)
                          </label>
                          <select
                            value={formData.coachExperience}
                            onChange={(e) => handleInputChange('coachExperience', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="">Select Experience</option>
                            <option value="1-3">1-3 years</option>
                            <option value="3-5">3-5 years</option>
                            <option value="5-10">5-10 years</option>
                            <option value="10-15">10-15 years</option>
                            <option value="15+">15+ years</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Activities & Sports */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Primary Sports * (Select all that apply)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {sportsOptions.map(sport => (
                          <button
                            key={sport}
                            type="button"
                            onClick={() => handleArrayToggle('primarySports', sport)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              formData.primarySports.includes(sport)
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700'
                            }`}
                          >
                            {sport}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Competition Types * (Select all that apply)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {competitionTypes.map(comp => (
                          <button
                            key={comp}
                            type="button"
                            onClick={() => handleArrayToggle('competitions', comp)}
                            className={`p-4 rounded-lg border-2 text-sm font-medium transition-all flex items-center space-x-2 ${
                              formData.competitions.includes(comp)
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700'
                            }`}
                          >
                            <FaMedal className="text-lg" />
                            <span>{comp}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Membership Levels * (Select all that apply)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {membershipOptions.map(membership => (
                          <button
                            key={membership}
                            type="button"
                            onClick={() => handleArrayToggle('membershipLevels', membership)}
                            className={`p-4 rounded-lg border-2 text-sm font-medium transition-all flex items-center space-x-2 ${
                              formData.membershipLevels.includes(membership)
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700'
                            }`}
                          >
                            <FaUsers className="text-lg" />
                            <span>{membership}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Club Facilities & Amenities
                      </label>
                      <textarea
                        value={formData.facilities}
                        onChange={(e) => handleInputChange('facilities', e.target.value)}
                        rows="4"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder="Describe your club facilities, equipment, changing rooms, parking, cafeteria, etc."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <FaCalendarAlt className="mx-auto text-2xl text-purple-600 mb-2" />
                        <h4 className="font-semibold text-purple-800">Event Management</h4>
                        <p className="text-sm text-purple-700">Organize tournaments and events</p>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <FaHandshake className="mx-auto text-2xl text-purple-600 mb-2" />
                        <h4 className="font-semibold text-purple-800">Member Portal</h4>
                        <p className="text-sm text-purple-700">Connect and engage members</p>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <FaChartLine className="mx-auto text-2xl text-purple-600 mb-2" />
                        <h4 className="font-semibold text-purple-800">Analytics</h4>
                        <p className="text-sm text-purple-700">Track performance and growth</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      currentStep === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <FaArrowLeft />
                    <span>Previous</span>
                  </button>

                  {currentStep < 3 ? (
                    <button
                      onClick={nextStep}
                      className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
                    >
                      <span>Continue</span>
                      <FaArrowRight />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <FaCrown />
                      <span>{loading ? 'Registering...' : 'Complete Registration'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Registration Success Modal */}
      <RegistrationSuccessModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        uniqueId={registrationData?.uniqueId}
        role="CLUB"
        userName={registrationData?.name}
        onContinue={handleContinueToDashboard}
      />
    </div>
  );
};

export default ClubRegister;
