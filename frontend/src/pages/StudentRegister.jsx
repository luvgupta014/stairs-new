import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const StudentRegister = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    sport: '',
    institute: '',
    level: 'BEGINNER',
    preferredLocation: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setApiError(''); // Clear API error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.password) {
      setModalMessage('Please fill in all required fields.');
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

    const result = await register(registerData, 'student');
    
    if (result.success) {
      setApiError('');
      setModalMessage('Registration successful! Please verify your phone number with the OTP sent.');
      setShowModal(true);
      setTimeout(() => {
        navigate('/verify-otp', { 
          state: { 
            userId: result.data.userId,
            phone: formData.phone,
            role: 'student'
          } 
        });
      }, 2000);
    } else {
      setApiError(result.message || 'Registration failed. Please try again.');
    }
  };

  const sports = [
    'Football', 'Cricket', 'Basketball', 'Volleyball', 'Tennis', 'Badminton',
    'Athletics', 'Swimming', 'Wrestling', 'Boxing', 'Hockey', 'Table Tennis',
    'Kabaddi', 'Chess', 'Carrom', 'Weightlifting', 'Gymnastics', 'Other'
  ];

  const levels = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'PROFESSIONAL', label: 'Professional' }
  ];

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Student Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join STAIRS Talent Hub as a Student
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Show API error if exists */}
            {apiError && (
              <div className="text-red-600 text-sm font-medium text-center">{apiError}</div>
            )}

            {/* Personal Information */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your last name"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your phone number"
              />
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="sport" className="block text-sm font-medium text-gray-700">
                Primary Sport
              </label>
              <select
                id="sport"
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Sport</option>
                {sports.map((sport) => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="institute" className="block text-sm font-medium text-gray-700">
                Institute/School/College
              </label>
              <input
                id="institute"
                name="institute"
                type="text"
                value={formData.institute}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your institute name"
              />
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                Skill Level
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {levels.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="preferredLocation" className="block text-sm font-medium text-gray-700">
                Preferred Training Location
              </label>
              <input
                id="preferredLocation"
                name="preferredLocation"
                type="text"
                value={formData.preferredLocation}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your preferred location"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login/student" className="font-medium text-blue-600 hover:text-blue-500">
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

export default StudentRegister;