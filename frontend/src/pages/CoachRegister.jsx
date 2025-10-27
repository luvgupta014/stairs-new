import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { processCoachPayment } from '../api';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const CoachRegister = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    experience: '',
    certifications: '',
    bio: '',
    location: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [paymentStep, setPaymentStep] = useState(false);

  // Validator functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  const validateMobile = (mobile) => /^\d{10}$/.test((mobile || '').replace(/\D/g, ''));
  const validatePincode = (pincode) => /^\d{6}$/.test(pincode || '');
  const validatePassword = (password) => password.length >= 6;

  // Real-time field validation
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Full name is required';
        } else if (value.trim().length < 3) {
          errors.name = 'Name must be at least 3 characters';
        } else {
          delete errors.name;
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

      case 'specialization':
        if (!value) {
          errors.specialization = 'Specialization is required';
        } else {
          delete errors.specialization;
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setModalMessage('Please fill in all required fields.');
      setShowModal(true);
      return;
    }

    // Check for any field errors
    if (Object.keys(fieldErrors).length > 0) {
      setModalMessage('Please fix the errors in the form before submitting.');
      setShowModal(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setModalMessage('Passwords do not match.');
      setShowModal(true);
      return;
    }

    if (formData.password.length < 6) {
      setModalMessage('Password must be at least 6 characters long.');
      setShowModal(true);
      return;
    }

    // Remove confirmPassword from data sent to backend
    const { confirmPassword, ...registerData } = formData;

    const result = await register(registerData, 'coach');
    
    if (result.success) {
      if (result.data.requiresPayment) {
        // Store coach data for payment
        localStorage.setItem('pendingCoachId', result.data.coachId);
        setModalMessage('Registration successful! Please complete the payment to activate your account.');
        setShowModal(true);
        setPaymentStep(true);
      } else {
        setModalMessage('Registration successful!');
        setShowModal(true);
        setTimeout(() => navigate('/login/coach'), 2000);
      }
    } else {
      setModalMessage(result.message);
      setShowModal(true);
    }
  };

  const handlePayment = async () => {
    try {
      const coachId = localStorage.getItem('pendingCoachId');
      if (!coachId) {
        setModalMessage('Error: Coach ID not found. Please try registering again.');
        setShowModal(true);
        return;
      }

      // TODO: Integrate with Razorpay
      // For now, simulate successful payment
      const paymentData = {
        coachId,
        paymentType: 'REGISTRATION',
        amount: 1999,
        razorpayOrderId: 'order_' + Date.now(),
        razorpayPaymentId: 'pay_' + Date.now(),
        subscriptionType: 'MONTHLY' // or 'ANNUAL'
      };

      const result = await processCoachPayment(paymentData);
      
      if (result.success) {
        localStorage.removeItem('pendingCoachId');
        setModalMessage('Payment successful! Your coordinator account is now active. Redirecting to login...');
        setShowModal(true);
        
        setTimeout(() => {
          navigate('/login/coach');
        }, 3000);
      } else {
        setModalMessage(result.message || 'Payment failed. Please try again.');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setModalMessage('Payment failed. Please try again later.');
      setShowModal(true);
    }
  };

  const sports = [
    'Football', 'Cricket', 'Basketball', 'Volleyball', 'Tennis', 'Badminton',
    'Athletics', 'Swimming', 'Wrestling', 'Boxing', 'Hockey', 'Table Tennis',
    'Kabaddi', 'Chess', 'Carrom', 'Weightlifting', 'Gymnastics', 'Other'
  ];

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  if (loading) {
    return <Spinner />;
  }

  if (paymentStep) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Successful!</h3>
            <p className="text-sm text-gray-600 mb-6">
              Complete your payment to activate your coordinator account and start connecting with Athletes.
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Registration Fee</p>
                <p className="text-2xl font-bold text-blue-600">₹1,999</p>
                <p className="text-xs text-gray-500">One-time registration fee</p>
              </div>
              <button
                onClick={handlePayment}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Pay with Razorpay
              </button>
              <p className="text-xs text-gray-500">
                Secure payment powered by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Coordinator Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join STAIRS Talent Hub as a Certified Coordinator
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                <FieldError fieldName="name" />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                <FieldError fieldName="email" />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number * (10 digits)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                <FieldError fieldName="phone" />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password * (minimum 6 characters)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                <FieldError fieldName="password" />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                <FieldError fieldName="confirmPassword" />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select State</option>
                  {states.map((state, index) => (
                    <option key={index} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                  Pincode (6 digits)
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  value={formData.pincode}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.pincode ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                <FieldError fieldName="pincode" />
              </div>
            </div>

            {/* Professional Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio/Description
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="3"
                    value={formData.bio}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                    Specialization *
                  </label>
                  <select
                    id="specialization"
                    name="specialization"
                    required
                    value={formData.specialization}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Specialization</option>
                    {sports.map((sport, index) => (
                      <option key={index} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                    Years of Experience *
                  </label>
                  <input
                    id="experience"
                    name="experience"
                    type="number"
                    required
                    value={formData.experience}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="certifications" className="block text-sm font-medium text-gray-700">
                    Certifications (if any)
                  </label>
                  <input
                    id="certifications"
                    name="certifications"
                    type="text"
                    value={formData.certifications}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Register
              </button>
            </div>
          </form>
        </div>
      </div>

      {showModal && (
        <Modal message={modalMessage} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default CoachRegister;
