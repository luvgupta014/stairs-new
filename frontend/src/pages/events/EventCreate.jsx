import { useState, useEffect } from 'react';
import { createEvent, getCoachDashboard } from '../../api';
import Spinner from '../../components/Spinner';
import BackButton from '../../components/BackButton';
import GoogleMapsPlacesAutocomplete from '../../components/GoogleMapsPlacesAutocomplete';
import PaymentPopup from '../../components/PaymentPopup';
import usePaymentStatus from '../../hooks/usePaymentStatus';
import { useNavigate, Link } from 'react-router-dom';
import { FaExclamationTriangle, FaCreditCard, FaMapMarkerAlt } from 'react-icons/fa';

const EventCreate = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sport: '',
    venue: '',
    address: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    startDate: '',
    endDate: '',
    maxParticipants: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [coachData, setCoachData] = useState(null);
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState(true);
  
  // Payment status hook
  const {
    isPending,
    showPaymentPopup,
    dismissPaymentPopup,
    onPaymentSuccess,
    showPaymentPopupManually
  } = usePaymentStatus();
  
  const navigate = useNavigate();

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const response = await getCoachDashboard();
      if (response.success) {
        setCoachData(response.data.coach);
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
    } finally {
      setCheckingPaymentStatus(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check payment status before allowing event creation
    if (isPending) {
      showPaymentPopupManually();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const eventData = {
        ...formData,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null
      };

      const result = await createEvent(eventData);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard/coach');
        }, 2000);
      } else {
        setError(result.message || 'Failed to create event');
      }
    } catch (error) {
      setError(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (placeData) => {
    console.log('Place selected:', placeData);
    
    setFormData(prev => ({
      ...prev,
      venue: placeData.name || placeData.address || '',
      address: placeData.address || '',
      city: placeData.city || '',
      state: placeData.state || '',
      latitude: placeData.latitude ? placeData.latitude.toString() : '',
      longitude: placeData.longitude ? placeData.longitude.toString() : ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearLocation = () => {
    setFormData(prev => ({
      ...prev,
      latitude: '',
      longitude: '',
      address: '',
      city: '',
      state: ''
    }));
  };

  if (checkingPaymentStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Created Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your event has been created and submitted for admin approval.
            </p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <BackButton to="/dashboard/coach" label="Back to Dashboard" />
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
          <p className="text-gray-600">
            Fill in the details below to create a new sports event for your students.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Location Info */}
        {!formData.latitude && !formData.longitude && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FaMapMarkerAlt className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Smart Venue Search with Google Maps
                </h4>
                <p className="text-sm text-blue-700">
                  Start typing in the venue field to search for sports facilities, stadiums, complexes, and venues. 
                  Select from the dropdown suggestions to automatically fill address, city, state, and coordinates.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Examples: "M. A. Chidambaram Stadium", "Jawaharlal Nehru Stadium", "Sports Complex"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status Alert */}
        {isPending && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-amber-500 mt-1 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  Payment Required
                </h3>
                <p className="text-amber-700 mb-4">
                  You need to complete your subscription payment to create events. Complete your payment to unlock full access to student management and event creation.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={showPaymentPopupManually}
                    type="button"
                    className="inline-flex items-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    <FaCreditCard className="mr-2" />
                    Pay Now (₹2,000)
                  </button>
                  <Link
                    to="/coach/payment"
                    state={{ from: '/coach/event/create' }}
                    className="inline-flex items-center border border-amber-600 text-amber-600 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hidden fields for coordinates */}
          <input type="hidden" name="latitude" value={formData.latitude} />
          <input type="hidden" name="longitude" value={formData.longitude} />
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter event name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-2">
                Sport *
              </label>
              <select
                id="sport"
                name="sport"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={formData.sport}
                onChange={handleChange}
              >
                <option value="">Select a sport</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Tennis">Tennis</option>
                <option value="Cricket">Cricket</option>
                <option value="Athletics">Athletics</option>
                <option value="Swimming">Swimming</option>
                <option value="Badminton">Badminton</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Event Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe your event..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Venue Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name *
              </label>
              <GoogleMapsPlacesAutocomplete
                onPlaceSelect={handlePlaceSelect}
                placeholder="Search for venue (e.g., stadium, sports complex)"
                value={formData.venue}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {formData.venue && !formData.latitude && (
                <p className="mt-1 text-xs text-amber-600">
                  💡 Select from dropdown suggestions for automatic address filling
                </p>
              )}
              {formData.venue && formData.latitude && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Venue location confirmed with coordinates
                </p>
              )}
            </div>

            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants
              </label>
              <input
                type="number"
                id="maxParticipants"
                name="maxParticipants"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter maximum participants"
                value={formData.maxParticipants}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Address will be auto-filled when you select a venue from Google Maps"
              value={formData.address}
              onChange={handleChange}
            />
            {!formData.address && (
              <p className="mt-1 text-xs text-gray-500">
                💡 Use the venue search above to automatically fill this field
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="City will be auto-filled"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="State will be auto-filled"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Coordinates Display */}
          {(formData.latitude && formData.longitude) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">Venue Location Confirmed</span>
                </div>
                <button
                  type="button"
                  onClick={clearLocation}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Clear Location
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Latitude:</span>
                  <span className="ml-2 text-green-600">{parseFloat(formData.latitude).toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Longitude:</span>
                  <span className="ml-2 text-green-600">{parseFloat(formData.longitude).toFixed(6)}</span>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">
                These coordinates will help students find your event location easily on maps.
              </p>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/coach')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Spinner size="sm" color="white" />
                  <span className="ml-2">Creating...</span>
                </>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Payment Popup */}
      <PaymentPopup
        isOpen={showPaymentPopup}
        onClose={() => dismissPaymentPopup(false)}
        userType="coach"
        userProfile={coachData}
        onPaymentSuccess={onPaymentSuccess}
      />
    </div>
  );
};

export default EventCreate;