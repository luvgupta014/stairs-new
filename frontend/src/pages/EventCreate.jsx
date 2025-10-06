import { useState } from 'react';
import { createEvent, processEventPayment } from '../api';
import Spinner from '../components/Spinner';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter venue address"
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