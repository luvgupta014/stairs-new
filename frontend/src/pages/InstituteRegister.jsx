import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SORTED_SPORTS } from '@constants/sports';
import { 
  FaBuilding, 
  FaIdCard, 
  FaDumbbell, 
  FaShieldAlt, 
  FaCrown, 
  FaCheck, 
  FaArrowRight, 
  FaArrowLeft,
  FaUpload,
  FaSwimmingPool,
  FaRunning,
  FaTableTennis
} from 'react-icons/fa';
import RegistrationSuccessModal from '../components/RegistrationSuccessModal';
import api from '../api';
import TermsAgreementStep from '../components/TermsAgreementStep';
import { TERMS, TERMS_VERSION } from '../content/terms';

const InstituteRegister = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    instituteName: '',
    email: '',
    phone: '',
    website: '',
    establishedYear: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Institution Details
    address: '',
    city: '',
    state: '',
    pincode: '',
    instituteType: '',
    affiliation: '',
    principalName: '',
    principalContact: '',
    
    // Step 3: Facilities
    facilities: [],
    capacity: '',
    sportsOffered: [],
    infrastructure: '',
    
    // Step 4: Verification
    registrationNumber: '',
    gstNumber: '',
    panNumber: '',
    documents: []
  });
  
  const navigate = useNavigate();

  // Validator functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  const validateMobile = (mobile) => /^\d{10}$/.test((mobile || '').replace(/\D/g, ''));
  const validatePincode = (pincode) => /^\d{6}$/.test(pincode || '');
  const validatePAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan || '');
  const validatePassword = (password) => password.length >= 6;

  // Real-time field validation
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'instituteName':
        if (!value.trim()) {
          errors.instituteName = 'Institute name is required';
        } else if (value.trim().length < 3) {
          errors.instituteName = 'Name must be at least 3 characters';
        } else {
          delete errors.instituteName;
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

      case 'pincode':
        if (value && !/^\d*$/.test(value)) {
          errors.pincode = 'Pincode must contain only numbers';
        } else if (value && value.length < 6) {
          errors.pincode = `Pincode must be 6 digits (${value.length}/6)`;
        } else if (value && value.length > 6) {
          errors.pincode = 'Pincode cannot exceed 6 digits';
        } else {
          delete errors.pincode;
        }
        break;

      case 'panNumber':
        if (value && !validatePAN(value.toUpperCase())) {
          errors.panNumber = 'Please enter a valid PAN number (format: AAAAA0000A)';
        } else {
          delete errors.panNumber;
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
      title: 'Basic Information',
      subtitle: 'Tell us about your institute',
      icon: FaBuilding,
      color: 'blue'
    },
    {
      id: 2,
      title: 'Institution Details',
      subtitle: 'Location and management',
      icon: FaIdCard,
      color: 'green'
    },
    {
      id: 3,
      title: 'Facilities & Sports',
      subtitle: 'What you offer',
      icon: FaDumbbell,
      color: 'purple'
    },
    {
      id: 4,
      title: 'Verification',
      subtitle: 'Legal compliance',
      icon: FaShieldAlt,
      color: 'orange'
    },
    {
      id: 5,
      title: 'Terms & Conditions',
      subtitle: 'Scroll & agree to continue',
      icon: FaCheck,
      color: 'green'
    }
  ];

  const facilitiesOptions = [
    { name: 'Swimming Pool', icon: FaSwimmingPool },
    { name: 'Athletic Track', icon: FaRunning },
    { name: 'Football Field', icon: '⚽' },
    { name: 'Basketball Court', icon: '🏀' },
    { name: 'Tennis Court', icon: '🎾' },
    { name: 'Cricket Ground', icon: '🏏' },
    { name: 'Gymnasium', icon: FaDumbbell },
    { name: 'Table Tennis', icon: FaTableTennis },
    { name: 'Badminton Court', icon: '🏸' },
    { name: 'Volleyball Court', icon: '🏐' },
    { name: 'Hockey Field', icon: '🏑' },
    { name: 'Boxing Ring', icon: '🥊' }
  ];

  // Use comprehensive sports list from constants
  const sportsOptions = SORTED_SPORTS;

  const instituteTypes = [
    'Sports Academy', 'School', 'College', 'University', 
    'Training Center', 'Club', 'Government Institute'
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
    
    // Check for field-level validation errors
    if (Object.keys(fieldErrors).length > 0) {
      setError('Please fix the errors in the form before continuing');
      hasErrors = true;
    }
    
    if (currentStep === 1) {
      // Step 1: Basic Information validation
      if (!formData.instituteName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields');
        hasErrors = true;
      } else if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        hasErrors = true;
      } else if (formData.phone.length !== 10) {
        setError('Phone number must be exactly 10 digits');
        hasErrors = true;
      }
    } else if (currentStep === 2) {
      // Step 2: Institution Details validation
      if (!formData.address || !formData.city || !formData.state || !formData.pincode || !formData.instituteType) {
        setError('Please fill in all required institution details');
        hasErrors = true;
      } else if (formData.pincode.length !== 6) {
        setError('PIN code must be exactly 6 digits');
        hasErrors = true;
      }
    } else if (currentStep === 3) {
      // Step 3: Facilities validation
      if (formData.sportsOffered.length === 0) {
        setError('Please select at least one sport offered');
        hasErrors = true;
      }
    }
    
    if (!hasErrors && currentStep < steps.length) {
      setError('');
      setCurrentStep(currentStep + 1);
    } else if (!hasErrors && currentStep === steps.length) {
      // Final step - submit the form
      if (!termsScrolled) {
        setError('Please scroll through the Terms & Conditions.');
        return;
      }
      if (!termsAccepted) {
        setError('You must agree to the Terms & Conditions to complete registration.');
        return;
      }
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
      if (!formData.instituteName || !formData.email || !formData.phone || !formData.password) {
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
        name: formData.instituteName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        address: formData.address,
        website: formData.website,
        sportsOffered: formData.sportsOffered,
        contactPerson: formData.principalName,
        licenseNumber: formData.registrationNumber,
        termsAccepted: true,
        termsVersion: TERMS_VERSION
      };

      const response = await api.post('/api/auth/institute/register', registrationData);

      if (response.data.success) {
        navigate('/verify-otp', {
          state: {
            userId: response.data.data.userId,
            email: formData.email,
            role: 'INSTITUTE',
            name: formData.instituteName
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
    navigate('/login/institute');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl text-gray-900">STAIRS</span>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
              Institute
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
                      ? 'bg-orange-500 text-white' 
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
            onClick={() => navigate('/login/institute')}
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
                currentStep === 1 ? 'from-blue-500 to-blue-600' :
                currentStep === 2 ? 'from-green-500 to-green-600' :
                currentStep === 3 ? 'from-purple-500 to-purple-600' :
                currentStep === 4 ? 'from-orange-500 to-orange-600' :
                currentStep === 5 ? 'from-green-600 to-emerald-600' :
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
                
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Institute Name *
                      </label>
                      <input
                        type="text"
                        value={formData.instituteName}
                        onChange={(e) => handleInputChange('instituteName', e.target.value)}
                        className={`w-full px-4 py-3 border ${fieldErrors.instituteName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                        placeholder="Elite Sports Academy"
                      />
                      <FieldError fieldName="instituteName" />
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
                          className={`w-full px-4 py-3 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                          placeholder="admin@elitesports.com"
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
                          className={`w-full px-4 py-3 border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                          placeholder="+91 9876543210"
                        />
                        <FieldError fieldName="phone" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="https://www.elitesports.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Established Year *
                        </label>
                        <input
                          type="number"
                          value={formData.establishedYear}
                          onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="2010"
                          min="1900"
                          max="2024"
                        />
                      </div>
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
                          className={`w-full px-4 py-3 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
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
                          className={`w-full px-4 py-3 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                          placeholder="••••••••"
                        />
                        <FieldError fieldName="confirmPassword" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Institution Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Complete Address *
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="Building No, Street, Area, Landmark"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="Mumbai"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <select
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        >
                          <option value="">Select State</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Gujarat">Gujarat</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PIN Code * (6 digits)
                        </label>
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={(e) => handleInputChange('pincode', e.target.value)}
                          className={`w-full px-4 py-3 border ${fieldErrors.pincode ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                          placeholder="400001"
                        />
                        <FieldError fieldName="pincode" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Institute Type *
                      </label>
                      <select
                        value={formData.instituteType}
                        onChange={(e) => handleInputChange('instituteType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Select Institute Type</option>
                        {instituteTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Principal/Director Name *
                        </label>
                        <input
                          type="text"
                          value={formData.principalName}
                          onChange={(e) => handleInputChange('principalName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="Dr. Rajesh Kumar"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Principal Contact
                        </label>
                        <input
                          type="tel"
                          value={formData.principalContact}
                          onChange={(e) => handleInputChange('principalContact', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Facilities */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Available Facilities * (Select all that apply)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {facilitiesOptions.map(facility => (
                          <button
                            key={facility.name}
                            type="button"
                            onClick={() => handleArrayToggle('facilities', facility.name)}
                            className={`p-4 rounded-lg border-2 text-sm font-medium transition-all flex flex-col items-center space-y-2 ${
                              formData.facilities.includes(facility.name)
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700'
                            }`}
                          >
                            {typeof facility.icon === 'string' ? (
                              <span className="text-2xl">{facility.icon}</span>
                            ) : (
                              React.createElement(facility.icon, { className: "text-2xl" })
                            )}
                            <span className="text-center">{facility.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Capacity (Students) *
                      </label>
                      <select
                        value={formData.capacity}
                        onChange={(e) => handleInputChange('capacity', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      >
                        <option value="">Select Capacity</option>
                        <option value="50-100">50-100 students</option>
                        <option value="100-250">100-250 students</option>
                        <option value="250-500">250-500 students</option>
                        <option value="500-1000">500-1000 students</option>
                        <option value="1000+">1000+ students</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Sports Offered * (Select all that apply)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {sportsOptions.map(sport => (
                          <button
                            key={sport}
                            type="button"
                            onClick={() => handleArrayToggle('sportsOffered', sport)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              formData.sportsOffered.includes(sport)
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Infrastructure Details
                      </label>
                      <textarea
                        value={formData.infrastructure}
                        onChange={(e) => handleInputChange('infrastructure', e.target.value)}
                        rows="4"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder="Describe your sports infrastructure, equipment, hostel facilities, medical room, etc."
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Verification */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-800 mb-2">🔒 Legal Verification</h3>
                      <p className="text-sm text-orange-700">
                        Please provide the following information for verification. All data is secure and encrypted.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Registration Number *
                        </label>
                        <input
                          type="text"
                          value={formData.registrationNumber}
                          onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          placeholder="Institute registration number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GST Number
                        </label>
                        <input
                          type="text"
                          value={formData.gstNumber}
                          onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          placeholder="GST number (if applicable)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number * (format: AAAAA0000A)
                      </label>
                      <input
                        type="text"
                        value={formData.panNumber}
                        onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                        className={`w-full px-4 py-3 border ${fieldErrors.panNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors`}
                        placeholder="PAN number"
                      />
                      <FieldError fieldName="panNumber" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Required Documents
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          'Registration Certificate',
                          'NOC from Sports Authority',
                          'Infrastructure Photos',
                          'Facility License'
                        ].map(doc => (
                          <div key={doc} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors cursor-pointer">
                            <FaUpload className="mx-auto text-2xl text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">{doc}</p>
                            <p className="text-xs text-gray-500 mt-1">Click to upload</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Terms */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <TermsAgreementStep
                      title={TERMS.INSTITUTION.title}
                      sections={TERMS.INSTITUTION.sections}
                      checkboxText={TERMS.INSTITUTION.checkboxText}
                      version={TERMS_VERSION}
                      accepted={termsAccepted}
                      onAcceptedChange={setTermsAccepted}
                      hasScrolledToBottom={termsScrolled}
                      onScrolledToBottom={setTermsScrolled}
                    />
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

                  {currentStep < steps.length ? (
                    <button
                      onClick={nextStep}
                      className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-lg font-medium hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105"
                    >
                      <span>Continue</span>
                      <FaArrowRight />
                    </button>
                  ) : (
                    <button
                      onClick={nextStep}
                      disabled={loading}
                      className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Registering...</span>
                        </>
                      ) : (
                        <>
                          <FaCrown />
                          <span>Complete Registration</span>
                        </>
                      )}
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
        role="INSTITUTE"
        userName={registrationData?.name}
        onContinue={handleContinueToDashboard}
      />
    </div>
  );
};

export default InstituteRegister;