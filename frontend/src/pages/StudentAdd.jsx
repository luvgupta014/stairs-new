import { useState } from 'react';
import { addStudentManually } from '../api';
import Spinner from '../components/Spinner';
import { useNavigate } from 'react-router-dom';

const StudentAdd = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    sport: '',
    level: 'BEGINNER',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await addStudentManually(formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard/coach');
        }, 2000);
      } else {
        setError(result.message || 'Failed to add student');
      }
    } catch (error) {
      setError(error.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Added Successfully!</h2>
            <p className="text-gray-600 mb-4">
              The student has been added and connected to your account.
            </p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Student Manually</h1>
          <p className="text-gray-600">
            Add a new student to your coaching program. They will be automatically connected to your account.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter student's full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Sports Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-2">
                Sport *
              </label>
              <select
                id="sport"
                name="sport"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.sport}
                onChange={handleChange}
              >
                <option value="">Select a sport</option>
                {sports.map((sport, index) => (
                  <option key={index} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                Skill Level
              </label>
              <select
                id="level"
                name="level"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.level}
                onChange={handleChange}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="PROFESSIONAL">Professional</option>
              </select>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
                id="state"
                name="state"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.state}
                onChange={handleChange}
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
              <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
                Pincode
              </label>
              <input
                type="text"
                id="pincode"
                name="pincode"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/coach')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Spinner size="sm" color="white" />
                  <span className="ml-2">Adding...</span>
                </>
              ) : (
                'Add Student'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentAdd;