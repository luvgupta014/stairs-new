import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import TermsAgreementStep from '../components/TermsAgreementStep';
import { TERMS, TERMS_VERSION } from '../content/terms';
import { SORTED_SPORTS } from '../constants/sports';

const StudentRegister = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    aadhaar: '',
    gender: '',
    dateOfBirth: '',
    state: '',
    district: '',
    address: '',
    pincode: '',
    mobileNumber: '',
    emailId: '',
    game: '',
    game2: '',
    game3: '',
    school: '',
    club: '',
    coachName: '',
    coachMobile: '',
    password: '',
    confirmPassword: '',
    level: 'BEGINNER'
  });

  const totalSteps = 6;

  // Validator functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateAadhaar = (aadhaar) => /^\d{12}$/.test(aadhaar);
  const validateMobile = (mobile) => /^\d{10}$/.test(mobile);
  const validatePincode = (pincode) => /^\d{6}$/.test(pincode);
  const validatePassword = (password) => password.length >= 6;

  // Real-time field validation
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'fullName':
        if (!value.trim()) {
          errors.fullName = 'Full name is required';
        } else if (value.trim().length < 3) {
          errors.fullName = 'Full name must be at least 3 characters';
        } else {
          delete errors.fullName;
        }
        break;

      case 'fatherName':
        if (!value.trim()) {
          errors.fatherName = 'Father\'s name is required';
        } else if (value.trim().length < 3) {
          errors.fatherName = 'Father\'s name must be at least 3 characters';
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

      case 'gender':
        if (!value) {
          errors.gender = 'Please select your gender';
        } else {
          delete errors.gender;
        }
        break;

      case 'dateOfBirth':
        if (!value) {
          errors.dateOfBirth = 'Date of birth is required';
        } else {
          delete errors.dateOfBirth;
        }
        break;

      case 'state':
        if (!value) {
          errors.state = 'Please select your state';
        } else {
          delete errors.state;
        }
        break;

      case 'district':
        if (!value.trim()) {
          errors.district = 'District is required';
        } else if (value.trim().length < 2) {
          errors.district = 'District name must be at least 2 characters';
        } else {
          delete errors.district;
        }
        break;

      case 'address':
        if (!value.trim()) {
          errors.address = 'Address is required';
        } else if (value.trim().length < 5) {
          errors.address = 'Address must be at least 5 characters';
        } else {
          delete errors.address;
        }
        break;

      case 'pincode':
        if (!value) {
          errors.pincode = 'Pin code is required';
        } else if (!/^\d*$/.test(value)) {
          errors.pincode = 'Pin code must contain only numbers';
        } else if (value.length < 6) {
          errors.pincode = `Pin code must be 6 digits (${value.length}/6)`;
        } else if (value.length > 6) {
          errors.pincode = 'Pin code cannot exceed 6 digits';
        } else {
          delete errors.pincode;
        }
        break;

      case 'mobileNumber':
        if (!value) {
          errors.mobileNumber = 'Mobile number is required';
        } else if (!/^\d*$/.test(value)) {
          errors.mobileNumber = 'Mobile number must contain only numbers';
        } else if (value.length < 10) {
          errors.mobileNumber = `Mobile number must be 10 digits (${value.length}/10)`;
        } else if (value.length > 10) {
          errors.mobileNumber = 'Mobile number cannot exceed 10 digits';
        } else {
          delete errors.mobileNumber;
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

      case 'game':
        if (!value) {
          errors.game = 'Primary sport is required';
        } else {
          delete errors.game;
        }
        break;

      case 'school':
        if (!value.trim()) {
          errors.school = 'School/College name is required';
        } else if (value.trim().length < 2) {
          errors.school = 'School/College name must be at least 2 characters';
        } else {
          delete errors.school;
        }
        break;

      case 'coachMobile':
        if (value && !/^\d*$/.test(value)) {
          errors.coachMobile = 'Coach mobile must contain only numbers';
        } else if (value && value.length < 10) {
          errors.coachMobile = `Coach mobile must be 10 digits (${value.length}/10)`;
        } else if (value && value.length > 10) {
          errors.coachMobile = 'Coach mobile cannot exceed 10 digits';
        } else {
          delete errors.coachMobile;
        }
        break;

      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 6) {
          errors.password = `Password must be at least 6 characters (${value.length}/6)`;
        } else if (!/[a-zA-Z]/.test(value)) {
          errors.password = 'Password must contain at least one letter';
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setApiError('');
    // Real-time validation
    validateField(name, value);
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
    const stepErrors = {};

    switch (currentStep) {
      case 1:
        if (!formData.fullName.trim()) stepErrors.fullName = 'Full name is required';
        if (!formData.fatherName.trim()) stepErrors.fatherName = 'Father\'s name is required';
        if (!validateAadhaar(formData.aadhaar)) stepErrors.aadhaar = 'Aadhaar must be 12 digits';
        if (!formData.gender) stepErrors.gender = 'Gender is required';
        if (!formData.dateOfBirth) stepErrors.dateOfBirth = 'Date of birth is required';
        break;

      case 2:
        if (!formData.state) stepErrors.state = 'State is required';
        if (!formData.district.trim()) stepErrors.district = 'District is required';
        if (!formData.address.trim()) stepErrors.address = 'Address is required';
        if (!validatePincode(formData.pincode)) stepErrors.pincode = 'Pin code must be 6 digits';
        break;

      case 3:
        if (!validateMobile(formData.mobileNumber)) stepErrors.mobileNumber = 'Mobile number must be 10 digits';
        if (!validateEmail(formData.emailId)) stepErrors.emailId = 'Valid email is required';
        break;

      case 4:
        if (!formData.game) stepErrors.game = 'Primary sport is required';
        if (!formData.school.trim()) stepErrors.school = 'School/College is required';
        break;

      case 5:
        if (!validatePassword(formData.password)) stepErrors.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) stepErrors.confirmPassword = 'Passwords do not match';
        break;
      case 6:
        if (!termsScrolled) stepErrors.terms = 'Please scroll through the Terms & Conditions.';
        if (!termsAccepted) stepErrors.termsAccepted = 'You must agree to the Terms & Conditions to create an account.';
        break;

      default:
        break;
    }

    if (Object.keys(stepErrors).length > 0) {
      setFieldErrors(stepErrors);
      setModalMessage('Please fix the errors before continuing.');
      setShowModal(true);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const getStepTitle = () => {
    const titles = {
      1: "Let's Get to Know You! 🌟",
      2: "Tell Us Where You're From 📍",
      3: "How Can We Reach You? 📱",
      4: "Your Athletic Journey 🏃‍♀️",
      5: "Secure Your Account 🔒",
      6: "Terms & Conditions ✅"
    };
    return titles[currentStep];
  };

  const getStepSubtitle = () => {
    const subtitles = {
      1: "Welcome, future champion! Let's start with your basic information.",
      2: "Help us understand your location for better local opportunities.",
      3: "Your contact info helps us keep you updated on exciting events!",
      4: "Time to showcase your sporting talents and interests!",
      5: "Almost there! Create a secure password to protect your profile.",
      6: "Please scroll and accept the Terms & Conditions to create your account."
    };
    return subtitles[currentStep];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) return;

    const studentData = {
      name: formData.fullName,
      fatherName: formData.fatherName,
      aadhaar: formData.aadhaar,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      state: formData.state,
      district: formData.district,
      address: formData.address,
      pincode: formData.pincode,
      phone: formData.mobileNumber,
      email: formData.emailId,
      sport: formData.game,
      sport2: formData.game2 || null,
      sport3: formData.game3 || null,
      school: formData.school,
      club: formData.club || null,
      coachName: formData.coachName || null,
      coachMobile: formData.coachMobile || null,
      level: formData.level,
      password: formData.password,
      termsAccepted: true,
      termsVersion: TERMS_VERSION
    };

    const result = await register(studentData, 'student');
    
    if (result.success) {
      setApiError('');
      setModalMessage('🎉 Registration successful! Please check your email for the OTP.');
      setShowModal(true);
      setTimeout(() => {
        navigate('/verify-otp', { 
          state: { 
            userId: result.data.userId,
            email: formData.emailId,
            role: 'student'
          } 
        });
      }, 2000);
    } else {
      setApiError(result.message || 'Registration failed. Please try again.');
    }
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

  // Use comprehensive sports list from constants
  const sports = SORTED_SPORTS;

  const levels = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'PROFESSIONAL', label: 'Professional' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">👋</div>
              <p className="text-gray-600">Tell us about yourself so we can personalize your experience!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                <FieldError fieldName="fullName" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Father's Name *
                </label>
                <input
                  name="fatherName"
                  type="text"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.fatherName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your father's name"
                />
                <FieldError fieldName="fatherName" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhaar Number * (12 digits)
                </label>
                <input
                  name="aadhaar"
                  type="text"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.aadhaar ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your 12-digit Aadhaar number"
                  maxLength="12"
                />
                <FieldError fieldName="aadhaar" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <FieldError fieldName="gender" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fieldErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <FieldError fieldName="dateOfBirth" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🏠</div>
              <p className="text-gray-600">Where are you located? This helps us find opportunities near you!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
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
                <FieldError fieldName="state" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District *
                </label>
                <input
                  name="district"
                  type="text"
                  value={formData.district}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.district ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your district"
                />
                <FieldError fieldName="district" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fieldErrors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your complete address"
              />
              <FieldError fieldName="address" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pin Code * (6 digits)
              </label>
              <input
                name="pincode"
                type="text"
                value={formData.pincode}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fieldErrors.pincode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your 6-digit pin code"
                maxLength="6"
              />
              <FieldError fieldName="pincode" />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📞</div>
              <p className="text-gray-600">How can we reach you with exciting opportunities and updates?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number * (10 digits)
              </label>
              <input
                name="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fieldErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your 10-digit mobile number"
                maxLength="10"
              />
              <FieldError fieldName="mobileNumber" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email ID *
              </label>
              <input
                name="emailId"
                type="email"
                value={formData.emailId}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fieldErrors.emailId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
              />
              <FieldError fieldName="emailId" />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-blue-500 text-xl">💡</div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Why do we need this?</h4>
                  <p className="text-sm text-blue-700">
                    We'll use your contact information to send you notifications about:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Tournament registrations in your area</li>
                    <li>• Training opportunities and coaching sessions</li>
                    <li>• Important updates about your athletic journey</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-gray-600">Time to shine! Tell us about your sports and training background.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Sport *
                </label>
                <select
                  name="game"
                  value={formData.game}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.game ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select your main sport...</option>
                  {sports.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
                <FieldError fieldName="game" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.level ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {levels.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Sport (Optional)
                </label>
                <select
                  name="game2"
                  value={formData.game2}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Choose another sport...</option>
                  {sports.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Third Sport (Optional)
                </label>
                <select
                  name="game3"
                  value={formData.game3}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Choose another sport...</option>
                  {sports.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School/College *
              </label>
              <input
                name="school"
                type="text"
                value={formData.school}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fieldErrors.school ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your school or college name"
              />
              <FieldError fieldName="school" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club (Optional)
                </label>
                <input
                  name="club"
                  type="text"
                  value={formData.club}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your club name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coach Name (Optional)
                </label>
                <input
                  name="coachName"
                  type="text"
                  value={formData.coachName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your coach's name"
                />
              </div>
            </div>

            {formData.coachName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coach Mobile (10 digits)
                </label>
                <input
                  name="coachMobile"
                  type="tel"
                  value={formData.coachMobile}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldErrors.coachMobile ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your coach's 10-digit mobile number"
                  maxLength="10"
                />
                <FieldError fieldName="coachMobile" />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔐</div>
              <p className="text-gray-600">Almost done! Create a secure password to protect your athletic profile.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password * (min 6 characters)
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Create a strong password"
              />
              <FieldError fieldName="password" />
              <p className="text-sm text-gray-500 mt-1">
                Must be at least 6 characters with letters and numbers
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
              />
              <FieldError fieldName="confirmPassword" />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="text-green-500 text-2xl">🎉</div>
                <div>
                  <h4 className="font-bold text-green-900 mb-2">You're Almost There!</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Once you complete registration, you'll get access to:
                  </p>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Personalized athlete dashboard</li>
                    <li>• Local tournament notifications</li>
                    <li>• Training opportunities in your area</li>
                    <li>• Connect with coaches and other athletes</li>
                    <li>• Track your athletic progress</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <TermsAgreementStep
              title={TERMS.ATHLETE.title}
              sections={TERMS.ATHLETE.sections}
              checkboxText={TERMS.ATHLETE.checkboxText}
              version={TERMS_VERSION}
              accepted={termsAccepted}
              onAcceptedChange={setTermsAccepted}
              hasScrolledToBottom={termsScrolled}
              onScrolledToBottom={setTermsScrolled}
            />
            {(fieldErrors.terms || fieldErrors.termsAccepted) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {fieldErrors.termsAccepted || fieldErrors.terms}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🌟 Join STAIRS as an Athlete! 🏆
          </h1>
          <p className="text-gray-600 text-lg">Your journey to athletic excellence starts here</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Step Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">{getStepTitle()}</h2>
              <p className="text-blue-100">{getStepSubtitle()}</p>
            </div>

            {/* Form Content */}
            <div className="p-8">
              {/* Show API error if exists */}
              {apiError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start space-x-2">
                  <span>⚠️</span>
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
                {/* Step Content */}
                <div className="min-h-[400px]">
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
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
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
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>🚀</span>
                          <span>Launch My Profile!</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

              {/* Login Link */}
              {currentStep === 1 && (
                <div className="text-center mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login/student" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                      Login here
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StudentRegister;