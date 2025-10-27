import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const InstituteRegister = () => {
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
    address: '',
    website: '',
    description: '',
    sportsOffered: [],
    contactPerson: '',
    licenseNumber: ''
  });

  // Validator functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  const validateMobile = (mobile) => /^\d{10}$/.test((mobile || '').replace(/\D/g, ''));
  const validatePassword = (password) => password.length >= 6;

  // Real-time field validation
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors };

    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Institute name is required';
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    validateField(name, value);
  };

  const handleSportsChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData({
        ...formData,
        sportsOffered: [...formData.sportsOffered, value]
      });
    } else {
      setFormData({
        ...formData,
        sportsOffered: formData.sportsOffered.filter(sport => sport !== value)
      });
    }
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

    const result = await register(registerData, 'institute');
    
    if (result.success) {
      setModalMessage('Registration successful! Please verify your phone number with the OTP sent.');
      setShowModal(true);
      
      // Navigate to OTP verification with userId
      setTimeout(() => {
        navigate('/verify-otp', { 
          state: { 
            userId: result.data.userId,
            phone: formData.phone,
            role: 'institute'
          } 
        });
      }, 2000);
    } else {
      setModalMessage(result.message);
      setShowModal(true);
    }
  };

  const sports = [
    'Football', 'Cricket', 'Basketball', 'Volleyball', 'Tennis', 'Badminton',
    'Athletics', 'Swimming', 'Wrestling', 'Boxing', 'Hockey', 'Table Tennis',
    'Kabaddi', 'Chess', 'Carrom', 'Weightlifting', 'Gymnastics', 'Other'
  ];

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Institute Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join STAIRS Talent Hub as an Institute
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Institute Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                placeholder="Enter institute name"
              />
              <FieldError fieldName="name" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                  placeholder="Enter email address"
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
                  className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                  placeholder="Enter phone number"
                />
                <FieldError fieldName="phone" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                  placeholder="Enter password"
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
                  className={`mt-1 block w-full px-3 py-2 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                  placeholder="Confirm password"
                />
                <FieldError fieldName="confirmPassword" />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter institute address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                <input
                  id="contactPerson"
                  name="contactPerson"
                  type="text"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter contact person name"
                />
              </div>

              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                  License Number
                </label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter license number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter website URL"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Tell us about your institute"
              />
            </div>

            {/* Sports Offered */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sports Offered
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sports.map((sport) => (
                  <div key={sport} className="flex items-center">
                    <input
                      id={`sport-${sport}`}
                      name="sportsOffered"
                      type="checkbox"
                      value={sport}
                      checked={formData.sportsOffered.includes(sport)}
                      onChange={handleSportsChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`sport-${sport}`} className="ml-2 block text-sm text-gray-900">
                      {sport}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login/institute" className="font-medium text-orange-600 hover:text-orange-500">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Registration Status"
          message={modalMessage}
        />
      )}
    </div>
  );
};

export default InstituteRegister;