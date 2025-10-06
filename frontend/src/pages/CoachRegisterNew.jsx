import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const CoachRegister = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    experience: '',
    certifications: '',
    bio: '',
    hourlyRate: '',
    location: ''
  });

  const [paymentStep, setPaymentStep] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
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

    if (!formData.specialization) {
      setModalMessage('Please select your specialization.');
      setShowModal(true);
      return;
    }

    // Remove confirmPassword from data sent to backend
    const { confirmPassword, ...registerData } = formData;

    const result = await register(registerData, 'coach');
    
    if (result.success) {
      setModalMessage('Registration successful! Please complete the payment to activate your account.');
      setShowModal(true);
      setPaymentStep(true);
    } else {
      setModalMessage(result.message);
      setShowModal(true);
    }
  };

  const handlePayment = () => {
    // TODO: Integrate with Razorpay
    setModalMessage('Payment integration will be implemented soon! For now, redirecting to dashboard...');
    setShowModal(true);
    
    // Navigate to coach dashboard after payment
    setTimeout(() => {
      navigate('/dashboard/coach');
    }, 2000);
  };

  const sports = [
    'Football', 'Cricket', 'Basketball', 'Volleyball', 'Tennis', 'Badminton',
    'Athletics', 'Swimming', 'Wrestling', 'Boxing', 'Hockey', 'Table Tennis',
    'Kabaddi', 'Chess', 'Carrom', 'Weightlifting', 'Gymnastics', 'Other'
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
              Complete your payment to activate your coach account and start connecting with students.
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Registration Fee</p>
                <p className="text-2xl font-bold text-green-600">₹1,999</p>
                <p className="text-xs text-gray-500">One-time registration fee</p>
              </div>
              <button
                onClick={handlePayment}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
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
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Coach Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join STAIRS Talent Hub as a Coach
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your last name"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your email address"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your phone number"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                Primary Specialization *
              </label>
              <select
                id="specialization"
                name="specialization"
                required
                value={formData.specialization}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select Sport</option>
                {sports.map((sport) => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                id="experience"
                name="experience"
                type="number"
                min="0"
                value={formData.experience}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter years of experience"
              />
            </div>

            <div>
              <label htmlFor="certifications" className="block text-sm font-medium text-gray-700">
                Certifications
              </label>
              <textarea
                id="certifications"
                name="certifications"
                rows={3}
                value={formData.certifications}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="List your certifications"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Tell us about yourself"
              />
            </div>

            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                Hourly Rate (₹)
              </label>
              <input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                min="0"
                value={formData.hourlyRate}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your hourly rate"
              />
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your location"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register & Proceed to Payment'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login/coach" className="font-medium text-green-600 hover:text-green-500">
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

export default CoachRegister;