import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

const InstituteRegisterPremium = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    documents: [],
    
    // Step 5: Payment
    plan: 'premium',
    paymentMethod: 'card',
    payLater: false
  });
  
  const navigate = useNavigate();

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
      title: 'Launch Institute',
      subtitle: 'Choose your plan',
      icon: FaCrown,
      color: 'gold'
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

  const sportsOptions = [
    'Football', 'Basketball', 'Cricket', 'Tennis', 'Swimming', 
    'Badminton', 'Hockey', 'Athletics', 'Volleyball', 'Boxing',
    'Table Tennis', 'Wrestling', 'Archery', 'Gymnastics'
  ];

  const instituteTypes = [
    'Sports Academy', 'School', 'College', 'University', 
    'Training Center', 'Club', 'Government Institute'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
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
        payLater: formData.payLater
      };

      const response = await api.post('/auth/institute/register', registrationData);

      if (response.data.success) {
        navigate('/verify-otp-premium', {
          state: {
            userId: response.data.data.userId,
            email: formData.email,
            role: 'INSTITUTE',
            name: formData.instituteName,
            payLater: formData.payLater
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Elite Sports Academy"
                      />
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="admin@elitesports.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="+91 9876543210"
                        />
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
                          Password *
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="••••••••"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Min. 8 characters with uppercase, lowercase, and number
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="••••••••"
                        />
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                        )}
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
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={(e) => handleInputChange('pincode', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="400001"
                        />
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
                        PAN Number *
                      </label>
                      <input
                        type="text"
                        value={formData.panNumber}
                        onChange={(e) => handleInputChange('panNumber', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="PAN number"
                      />
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

                {/* Step 5: Payment & Launch */}
                {currentStep === 5 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Institute Plan</h3>
                      <p className="text-gray-600">Scale your sports institute with premium features</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Standard Plan */}
                      <div className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${
                        formData.plan === 'standard' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('plan', 'standard')}>
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-gray-900">Standard</h4>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">₹4,999</span>
                            <span className="text-gray-500">/month</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li>• Up to 500 students</li>
                            <li>• Basic reporting</li>
                            <li>• Email support</li>
                            <li>• Student management</li>
                            <li>• Payment processing</li>
                          </ul>
                        </div>
                      </div>

                      {/* Premium Plan */}
                      <div className={`rounded-xl border-2 p-6 cursor-pointer transition-all relative ${
                        formData.plan === 'premium' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('plan', 'premium')}>
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Recommended
                          </span>
                        </div>
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-gray-900">Premium</h4>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">₹9,999</span>
                            <span className="text-gray-500">/month</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li>• Up to 2000 students</li>
                            <li>• Advanced analytics</li>
                            <li>• Priority support</li>
                            <li>• Coach management</li>
                            <li>• Event organization</li>
                            <li>• Parent portal</li>
                          </ul>
                        </div>
                      </div>

                      {/* Enterprise Plan */}
                      <div className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${
                        formData.plan === 'enterprise' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('plan', 'enterprise')}>
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-gray-900">Enterprise</h4>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">₹19,999</span>
                            <span className="text-gray-500">/month</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li>• Unlimited students</li>
                            <li>• Custom reporting</li>
                            <li>• 24/7 support</li>
                            <li>• Multi-campus</li>
                            <li>• API integration</li>
                            <li>• White labeling</li>
                            <li>• Dedicated manager</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                      <div className="flex items-center space-x-3">
                        <FaCrown className="text-yellow-500 text-xl" />
                        <div>
                          <h4 className="font-semibold text-gray-900">🏆 Institute Launch Offer!</h4>
                          <p className="text-sm text-gray-600">Get 3 months free + dedicated onboarding specialist</p>
                        </div>
                      </div>
                    </div>

                    {/* Pay Later Option */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          id="payLater"
                          checked={formData.payLater}
                          onChange={(e) => handleInputChange('payLater', e.target.checked)}
                          className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <label htmlFor="payLater" className="font-semibold text-gray-900 cursor-pointer flex items-center space-x-2">
                            <span>💳 Pay Later Option</span>
                          </label>
                          <p className="text-sm text-gray-600 mt-2">
                            Skip payment for now and complete it later from your dashboard. You can start setting up your institute profile immediately.
                          </p>
                          <div className="mt-3 bg-orange-50 border-l-4 border-orange-400 p-3 rounded">
                            <p className="text-xs text-orange-800 font-medium">
                              ⚠️ <strong>Note:</strong> With "Pay Later", some features will be restricted:
                            </p>
                            <ul className="text-xs text-orange-700 mt-2 space-y-1 ml-4">
                              <li>• Limited student management</li>
                              <li>• Restricted coach connections</li>
                              <li>• Basic dashboard access</li>
                            </ul>
                            <p className="text-xs text-orange-800 mt-2">
                              Complete payment anytime to unlock all features!
                            </p>
                          </div>
                        </div>
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

                  {currentStep < 5 ? (
                    <button
                      onClick={nextStep}
                      className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-lg font-medium hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105"
                    >
                      <span>Continue</span>
                      <FaArrowRight />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
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
                          <span>{formData.payLater ? 'Complete Registration' : 'Launch Institute'}</span>
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

export default InstituteRegisterPremium;