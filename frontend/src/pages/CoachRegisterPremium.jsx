import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CoachRegisterPremium = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    aadhaar: '',
    gender: '',
    dateOfBirth: '',
    state: '',
    district: '',
    address: '',
    pinCode: '',
    mobileNumber: '',
    emailId: '',
    panNumber: '',
    utrNumber: '',
    password: '',
    confirmPassword: '',
    membershipStatus: 'NEW',
    applyingAs: 'Chief District coordinator',
    primarySports: '',
    otherSports: '',
    payLater: false
  });
  
  const navigate = useNavigate();
  const totalSteps = 6;

  // Validator functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  const validateAadhaar = (aadhaar) => /^\d{12}$/.test((aadhaar || '').replace(/\D/g, ''));
  const validateMobile = (mobile) => /^\d{10}$/.test((mobile || '').replace(/\D/g, ''));
  const validatePincode = (pincode) => /^\d{6}$/.test(pincode || '');
  const validatePAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan || '');
  const validatePassword = (password) => password.length >= 6;

  // Real-time field validation
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'fullName':
        if (!value.trim()) {
          errors.fullName = 'Full name is required';
        } else if (value.trim().length < 3) {
          errors.fullName = 'Name must be at least 3 characters';
        } else {
          delete errors.fullName;
        }
        break;

      case 'fatherName':
        if (!value.trim()) {
          errors.fatherName = 'Father name is required';
        } else if (value.trim().length < 3) {
          errors.fatherName = 'Name must be at least 3 characters';
        } else {
          delete errors.fatherName;
        }
        break;

      case 'aadhaar':
        if (!value) {
          errors.aadhaar = 'Aadhaar number is required';
        } else if (!/^\d*$/.test(value)) {
          errors.aadhaar = 'Aadhaar must contain only numbers';
        } else if (value.length < 12) {
          errors.aadhaar = `Aadhaar must be 12 digits (${value.length}/12)`;
        } else if (value.length > 12) {
          errors.aadhaar = 'Aadhaar cannot exceed 12 digits';
        } else {
          delete errors.aadhaar;
        }
        break;

      case 'emailId':
        if (!value) {
          errors.emailId = 'Email is required';
        } else if (!validateEmail(value)) {
          errors.emailId = 'Please enter a valid email address';
        } else {
          delete errors.emailId;
        }
        break;

      case 'mobileNumber':
        if (!value) {
          errors.mobileNumber = 'Mobile number is required';
        } else if (!/^\d*$/.test(value)) {
          errors.mobileNumber = 'Mobile must contain only numbers';
        } else if (value.length < 10) {
          errors.mobileNumber = `Mobile must be 10 digits (${value.length}/10)`;
        } else if (value.length > 10) {
          errors.mobileNumber = 'Mobile cannot exceed 10 digits';
        } else {
          delete errors.mobileNumber;
        }
        break;

      case 'pinCode':
        if (!value) {
          errors.pinCode = 'Pincode is required';
        } else if (!/^\d*$/.test(value)) {
          errors.pinCode = 'Pincode must contain only numbers';
        } else if (value.length < 6) {
          errors.pinCode = `Pincode must be 6 digits (${value.length}/6)`;
        } else if (value.length > 6) {
          errors.pinCode = 'Pincode cannot exceed 6 digits';
        } else {
          delete errors.pinCode;
        }
        break;

      case 'panNumber':
        if (!value) {
          errors.panNumber = 'PAN number is required';
        } else if (!validatePAN(value.toUpperCase())) {
          errors.panNumber = 'Please enter a valid PAN number (format: AAAAA0000A)';
        } else {
          delete errors.panNumber;
        }
        break;

      case 'utrNumber':
        if (value && !/^\d{12}$/.test(value)) {
          errors.utrNumber = 'UTR must be 12 digits';
        } else {
          delete errors.utrNumber;
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    validateField(field, value);
    setError('');
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    // First check for any field-level validation errors
    if (Object.keys(fieldErrors).length > 0) {
      setError('Please fix the errors in the form before continuing.');
      return false;
    }

    switch (currentStep) {
      case 1: // Role & Sports
        if (!formData.membershipStatus || !formData.applyingAs || !formData.primarySports) {
          setError('Please complete your role and sports information.');
          return false;
        }
        break;
      case 2: // Personal Info
        if (!formData.fullName || !formData.fatherName || !formData.aadhaar || !formData.gender || !formData.dateOfBirth) {
          setError('Please fill in all personal information fields.');
          return false;
        }
        // Validate aadhaar is exactly 12 digits
        if (!validateAadhaar(formData.aadhaar)) {
          setError('Aadhaar number must be exactly 12 digits.');
          return false;
        }
        break;
      case 3: // Location
        if (!formData.state || !formData.district || !formData.address || !formData.pinCode) {
          setError('Please provide your complete location details.');
          return false;
        }
        // Validate pincode is exactly 6 digits
        if (!validatePincode(formData.pinCode)) {
          setError('PIN Code must be exactly 6 digits.');
          return false;
        }
        break;
      case 4: // Contact & Documents
        if (!formData.mobileNumber || !formData.emailId || !formData.panNumber) {
          setError('Please provide your contact and document information.');
          return false;
        }
        // Validate mobile is exactly 10 digits
        if (!validateMobile(formData.mobileNumber)) {
          setError('Mobile number must be exactly 10 digits.');
          return false;
        }
        // Validate email format
        if (!validateEmail(formData.emailId)) {
          setError('Please enter a valid email address.');
          return false;
        }
        // Validate PAN format
        if (!validatePAN(formData.panNumber)) {
          setError('Please enter a valid PAN number.');
          return false;
        }
        break;
      case 5: // Payment & Security
        if (!formData.password || formData.password !== formData.confirmPassword) {
          setError('Please set up your password correctly.');
          return false;
        }
        if (!validatePassword(formData.password)) {
          setError('Password must be at least 6 characters long.');
          return false;
        }
        if (!formData.payLater && !formData.utrNumber) {
          setError('Please provide UTR number or select pay later option.');
          return false;
        }
        break;
    }
    
    // Clear error if validation passes
    setError('');
    return true;
  };

  const getStepTitle = () => {
    const titles = {
      1: "Welcome, Future Coordinator! 🏅",
      2: "Tell Us About Yourself 👨‍🏫",
      3: "Your Location & Address 📍",
      4: "Contact & Documentation 📋",
      5: "Payment & Security 💳",
      6: "Review & Confirm ✅"
    };
    return titles[currentStep];
  };

  const getStepSubtitle = () => {
    const subtitles = {
      1: "Let's start by understanding your role and sporting expertise.",
      2: "Help us get to know you better with your personal information.",
      3: "Where are you based? This helps us assign you to the right region.",
      4: "Your contact details and necessary documents for verification.",
      5: "Secure your account and complete the membership payment process.",
      6: "Almost there! Review your information before submitting."
    };
    return subtitles[currentStep];
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (!validateCurrentStep()) {
        setLoading(false);
        return;
      }

      // Prepare registration data
      const registrationData = {
        name: formData.fullName,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        aadhaar: formData.aadhaar,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        state: formData.state,
        district: formData.district,
        address: formData.address,
        pincode: formData.pinCode,
        email: formData.emailId,
        phone: formData.mobileNumber,
        panNumber: formData.panNumber,
        utrNumber: formData.utrNumber,
        membershipStatus: formData.membershipStatus,
        applyingAs: formData.applyingAs,
        primarySport: formData.primarySports,
        otherSports: formData.otherSports,
        password: formData.password,
        specialization: formData.primarySports,
        experience: '0-1',
        certifications: '',
        bio: '',
        location: formData.address,
        payLater: formData.payLater
      };

      console.log('Registering coach:', registrationData);

      // Call API
      const response = await api.post('/api/auth/coach/register', registrationData);

      if (response.data.success) {
        // Navigate to OTP verification
        navigate('/verify-otp-premium', {
          state: {
            userId: response.data.data.userId,
            email: formData.emailId,
            role: 'COACH',
            name: formData.fullName,
            payLater: formData.payLater
          }
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-600">Welcome to the STAIRS coordinator program! Let's define your role and expertise.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Status *
                </label>
                <select
                  value={formData.membershipStatus}
                  onChange={(e) => handleInputChange('membershipStatus', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="NEW">NEW Member</option>
                  <option value="RENEWAL">RENEWAL Member</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applying As *
                </label>
                <select
                  value={formData.applyingAs}
                  onChange={(e) => handleInputChange('applyingAs', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="Chief District coordinator">Chief District Coordinator</option>
                  <option value="District coordinator">District Coordinator</option>
                  <option value="Coach">Coach</option>
                  <option value="Trainer">Trainer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Sports Specialization *
                </label>
                <select
                  value={formData.primarySports}
                  onChange={(e) => handleInputChange('primarySports', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="">Choose your main expertise...</option>
                  <option value="Football">Football</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Athletics">Athletics</option>
                  <option value="Swimming">Swimming</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Hockey">Hockey</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Sports (Optional)
                </label>
                <select
                  value={formData.otherSports}
                  onChange={(e) => handleInputChange('otherSports', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="">Choose additional expertise...</option>
                  <option value="Football">Football</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Athletics">Athletics</option>
                  <option value="Swimming">Swimming</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Hockey">Hockey</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-purple-500 text-xl">💼</div>
                <div>
                  <h4 className="font-medium text-purple-900 mb-1">Coordinator Benefits</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Lead and mentor young athletes in your region</li>
                    <li>• Organize local tournaments and training programs</li>
                    <li>• Access to exclusive coaching resources and certifications</li>
                    <li>• Network with sports professionals across the country</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">👨‍🏫</div>
              <p className="text-gray-600">Tell us about yourself so we can create your coordinator profile.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full px-4 py-3 border ${fieldErrors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                placeholder="Enter your full name"
              />
              <FieldError fieldName="fullName" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Father's Name *
                </label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  className={`w-full px-4 py-3 border ${fieldErrors.fatherName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                  placeholder="Enter father's name"
                />
                <FieldError fieldName="fatherName" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mother's Name
                </label>
                <input
                  type="text"
                  value={formData.motherName}
                  onChange={(e) => handleInputChange('motherName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Enter mother's name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhaar Number * (12 digits)
                </label>
                <input
                  type="text"
                  value={formData.aadhaar}
                  onChange={(e) => handleInputChange('aadhaar', e.target.value)}
                  className={`w-full px-4 py-3 border ${fieldErrors.aadhaar ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                  placeholder="Enter Aadhaar number"
                  maxLength="12"
                />
                <FieldError fieldName="aadhaar" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="">Select gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🏠</div>
              <p className="text-gray-600">Your location helps us assign you to the appropriate district and region.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="">Select State...</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Delhi">Delhi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District *
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Enter your district"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complete Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Enter your complete address"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pin Code * (6 digits)
              </label>
              <input
                type="text"
                value={formData.pinCode}
                onChange={(e) => handleInputChange('pinCode', e.target.value)}
                className={`w-full px-4 py-3 border ${fieldErrors.pinCode ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                placeholder="Enter pin code"
                maxLength="6"
              />
              <FieldError fieldName="pinCode" />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-600">Your contact information and documents for verification purposes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number * (10 digits)
                </label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                  className={`w-full px-4 py-3 border ${fieldErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                  placeholder="Enter mobile number"
                  maxLength="10"
                />
                <FieldError fieldName="mobileNumber" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.emailId}
                  onChange={(e) => handleInputChange('emailId', e.target.value)}
                  className={`w-full px-4 py-3 border ${fieldErrors.emailId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                  placeholder="Enter email address"
                />
                <FieldError fieldName="emailId" />
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
                className={`w-full px-4 py-3 border ${fieldErrors.panNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                placeholder="Enter PAN number"
                maxLength="10"
              />
              <FieldError fieldName="panNumber" />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-blue-500 text-xl">🔐</div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Document Verification</h4>
                  <p className="text-sm text-blue-700">
                    Your PAN number is required for coordinator verification and will be kept secure. 
                    This helps us maintain the integrity of our coaching network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔐</div>
              <p className="text-gray-600">Secure your account and complete the membership process.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password * (minimum 6 characters)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-4 py-3 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                  placeholder="Create a strong password"
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
                  className={`w-full px-4 py-3 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                  placeholder="Confirm your password"
                />
                <FieldError fieldName="confirmPassword" />
              </div>
            </div>

            {!formData.payLater && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UTR Number (Transaction Reference) {!formData.payLater ? '*' : ''}
                </label>
                <input
                  type="text"
                  value={formData.utrNumber}
                  onChange={(e) => handleInputChange('utrNumber', e.target.value)}
                  className={`w-full px-4 py-3 border ${fieldErrors.utrNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                  placeholder="Enter UTR number from payment"
                  required={!formData.payLater}
                />
                <FieldError fieldName="utrNumber" />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the UTR number from your payment transaction
                </p>
              </div>
            )}

            {/* Pay Later Option */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  id="payLater"
                  checked={formData.payLater}
                  onChange={(e) => handleInputChange('payLater', e.target.checked)}
                  className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="payLater" className="font-semibold text-gray-900 cursor-pointer flex items-center space-x-2">
                    <span>💳 Pay Later Option</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-2">
                    Skip payment for now and complete it later from your dashboard. Start setting up your coordinator profile immediately.
                  </p>
                  <div className="mt-3 bg-orange-50 border-l-4 border-orange-400 p-3 rounded">
                    <p className="text-xs text-orange-800 font-medium">
                      ⚠️ <strong>Note:</strong> With "Pay Later", some coordinator features will be restricted:
                    </p>
                    <ul className="text-xs text-orange-700 mt-2 space-y-1 ml-4">
                      <li>• Cannot register or manage athletes</li>
                      <li>• Cannot create tournaments or events</li>
                      <li>• Limited coordinator dashboard access</li>
                      <li>• Cannot issue certificates or conduct evaluations</li>
                    </ul>
                    <p className="text-xs text-orange-800 mt-2">
                      Complete payment anytime to unlock all coordinator privileges!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-600">Please review your information before submitting your coordinator application.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Role:</strong> {formData.applyingAs}</div>
                <div><strong>Primary Sport:</strong> {formData.primarySports}</div>
                <div><strong>Name:</strong> {formData.fullName}</div>
                <div><strong>Email:</strong> {formData.emailId}</div>
                <div><strong>Mobile:</strong> {formData.mobileNumber}</div>
                <div><strong>State:</strong> {formData.state}</div>
                <div><strong>District:</strong> {formData.district}</div>
                <div><strong>Payment:</strong> {formData.payLater ? 'Pay Later' : 'Immediate Payment'}</div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="text-green-500 text-2xl">🎉</div>
                <div>
                  <h4 className="font-bold text-green-900 mb-2">Ready to Launch Your Coordinator Journey!</h4>
                  <p className="text-sm text-green-700 mb-3">
                    After registration, you'll have access to:
                  </p>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Comprehensive coordinator dashboard</li>
                    <li>• Athlete management and registration tools</li>
                    <li>• Tournament creation and management</li>
                    <li>• Performance tracking and analytics</li>
                    <li>• Certification and evaluation systems</li>
                    <li>• Direct communication with STAIRS administration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🏆 STAIRS Coordinator Registration
          </h1>
          <p className="text-gray-600 text-lg">Join the elite community of verified coordinators</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-600">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Step Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">{getStepTitle()}</h2>
              <p className="text-purple-100">{getStepSubtitle()}</p>
            </div>

            {/* Form Content */}
            <div className="p-8">
              {/* Show error if exists */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start space-x-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={currentStep === totalSteps ? (e) => { e.preventDefault(); handleSubmit(); } : (e) => { e.preventDefault(); nextStep(); }}>
                {/* Step Content */}
                <div className="min-h-[500px]">
                  {renderStepContent()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-8 border-t mt-8">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>←</span>
                      <span>Previous</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {currentStep < totalSteps ? (
                    <button
                      type="submit"
                      className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105"
                    >
                      <span>Continue</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            <span>{loading ? 'Submitting...' : 'Complete Registration'}</span>
                                            <span>✓</span>
                                          </button>
                                        )}
                                      </div>
                                    </form>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      };
                      
                      export default CoachRegisterPremium;