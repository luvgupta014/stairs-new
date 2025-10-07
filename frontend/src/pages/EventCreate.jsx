import { useState, useEffect } from 'react';
import { createEvent, processEventPayment, getCoachDashboard } from '../api';
import Spinner from '../components/Spinner';
import { useNavigate, Link } from 'react-router-dom';
import { FaExclamationTriangle, FaCreditCard, FaLocationArrow } from 'react-icons/fa';

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
    maxParticipants: '',
    eventFee: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [coachData, setCoachData] = useState(null);
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);
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
    if (coachData?.paymentStatus === 'PENDING' && !coachData?.isActive) {
      setError('Please complete your payment to create events. You can add events after payment completion.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Combine date and time for startDate
      const eventData = {
        ...formData,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        eventFee: formData.eventFee ? parseFloat(formData.eventFee) : 0
      };

      const result = await createEvent(eventData);
      
      if (result.success) {
        setCreatedEvent(result.data.event);
        
        if (result.data.requiresPayment && formData.eventFee > 0) {
          setPaymentStep(true);
        } else {
          setSuccess(true);
          setTimeout(() => {
            navigate('/dashboard/coach');
          }, 2000);
        }
      } else {
        setError(result.message || 'Failed to create event');
      }
    } catch (error) {
      setError(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!createdEvent) return;
    
    setLoading(true);
    try {
      // TODO: Integrate with Razorpay
      const paymentData = {
        amount: formData.eventFee,
        razorpayOrderId: 'order_' + Date.now(),
        razorpayPaymentId: 'pay_' + Date.now()
      };

      const result = await processEventPayment(createdEvent.id, paymentData);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard/coach');
        }, 2000);
      } else {
        setError(result.message || 'Payment failed');
      }
    } catch (error) {
      setError(error.message || 'Payment failed');
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

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get address details
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_OPENCAGE_API_KEY`
          );
          
          if (!response.ok) {
            // Fallback to a free service
            const nominatimResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            
            if (nominatimResponse.ok) {
              const data = await nominatimResponse.json();
              
              setFormData(prev => ({
                ...prev,
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                address: data.display_name || '',
                city: data.address?.city || data.address?.town || data.address?.village || '',
                state: data.address?.state || ''
              }));
            } else {
              // Just set coordinates if reverse geocoding fails
              setFormData(prev => ({
                ...prev,
                latitude: latitude.toString(),
                longitude: longitude.toString()
              }));
            }
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Just set coordinates if reverse geocoding fails
          setFormData(prev => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }));
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGettingLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied by user. Please enable location permissions and try again.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred while retrieving location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
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

  if (paymentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">💳</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
            <p className="text-gray-600 mb-4">
              Complete the event fee payment to submit your event for admin approval.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm font-medium text-gray-900">Event Fee</p>
              <p className="text-2xl font-bold text-blue-600">₹{formData.eventFee}</p>
              <p className="text-xs text-gray-500">One-time event fee</p>
            </div>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Pay with Razorpay'}
            </button>
            {error && (
              <div className="mt-4 text-red-600 text-sm">{error}</div>
            )}
            <p className="text-xs text-gray-500 mt-4">
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>
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
              <FaLocationArrow className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Quick Location Setup
                </h4>
                <p className="text-sm text-blue-700">
                  Use the "Use Current Location" button to automatically fill in your address, city, and state. 
                  Make sure to allow location access when prompted by your browser.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status Alert */}
        {coachData?.paymentStatus === 'PENDING' && !coachData?.isActive && (
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
                <Link
                  to="/coach/payment"
                  state={{ from: '/coach/event/create' }}
                  className="inline-flex items-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <FaCreditCard className="mr-2" />
                  Complete Payment
                </Link>
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
              <input
                type="text"
                id="venue"
                name="venue"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter venue name"
                value={formData.venue}
                onChange={handleChange}
              />
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
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gettingLocation ? (
                  <>
                    <Spinner size="xs" color="blue" />
                    <span className="ml-1">Getting location...</span>
                  </>
                ) : (
                  <>
                    <FaLocationArrow className="mr-1" />
                    Use Current Location
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              id="address"
              name="address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter venue address or use current location"
              value={formData.address}
              onChange={handleChange}
            />
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
                placeholder="Enter city"
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
                placeholder="Enter state"
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
                  <FaLocationArrow className="text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">Location Coordinates</span>
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
                These coordinates will help students find your event location easily.
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

          {/* Fee */}
          <div>
            <label htmlFor="eventFee" className="block text-sm font-medium text-gray-700 mb-2">
              Event Fee (₹)
            </label>
            <input
              type="number"
              id="eventFee"
              name="eventFee"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="0.00"
              value={formData.eventFee}
              onChange={handleChange}
            />
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
    </div>
  );
};

export default EventCreate;