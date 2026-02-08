import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { updateEvent } from '../../api';
import Spinner from '../../components/Spinner';
import BackButton from '../../components/BackButton';
import GoogleMapsPlacesAutocomplete from '../../components/GoogleMapsPlacesAutocomplete';
import { FaMapMarkerAlt, FaSave, FaTimes } from 'react-icons/fa';
import CategorySelector from '../../components/CategorySelector';

const EventEdit = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
    level: 'DISTRICT',
    categoriesAvailable: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Pre-fill form with event data from location state
    if (location.state?.event) {
      const event = location.state.event;
      
      // Helper to format datetime for datetime-local input (IST only)
      // For India-only platform, extract date/time as-is without any conversion
      const formatForInput = (dateString) => {
        if (!dateString) return '';
        
        console.log('📅 Original date from API:', dateString);
        
        // Simply extract YYYY-MM-DDTHH:mm from the ISO string
        // This assumes the backend is storing times in IST without timezone conversion
        const formatted = dateString.substring(0, 16);
        
        console.log('📅 Formatted for input field:', formatted);
        
        return formatted;
      };
      
      const formattedStartDate = formatForInput(event.startDate);
      const formattedEndDate = formatForInput(event.endDate);
      
      console.log('📅 Event dates being loaded:', {
        originalStart: event.startDate,
        originalEnd: event.endDate,
        formattedStart: formattedStartDate,
        formattedEnd: formattedEndDate
      });
      
      setFormData({
        name: event.name || '',
        description: event.description || '',
        sport: event.sport || '',
        venue: event.venue || '',
        address: event.address || '',
        city: event.city || '',
        state: event.state || '',
        latitude: event.latitude?.toString() || '',
        longitude: event.longitude?.toString() || '',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        maxParticipants: event.maxParticipants?.toString() || '',
        level: event.level || 'DISTRICT',
        categoriesAvailable: event.categoriesAvailable || ''
      });
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For India-only platform, we treat all times as IST
      // Send datetime-local value directly without any timezone conversion
      const eventData = {
        ...formData,
        startDate: formData.startDate ? formData.startDate + ':00' : '',
        endDate: formData.endDate ? formData.endDate + ':00' : null,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null
      };
      
      console.log('📅 Event update - dates being sent (IST):', {
        startDate: eventData.startDate,
        endDate: eventData.endDate
      });

      const result = await updateEvent(eventId, eventData);
      
      if (result.success) {
        navigate('/dashboard/coach', { 
          state: { 
            message: 'Event updated successfully!',
            activeTab: 'events'
          }
        });
      } else {
        setError(result.message || 'Failed to update event');
      }
    } catch (error) {
      setError(error.message || 'Failed to update event');
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <BackButton to="/dashboard/coach" label="Back to Events" />
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Event</h1>
          <p className="text-gray-600">
            Update your event details below.
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

          {/* Event Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                Event Level
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="DISTRICT">District</option>
                <option value="STATE">State</option>
                <option value="NATIONAL">National</option>
                <option value="SCHOOL">School</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Controls how the event is categorized in admin and student views.
              </p>
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
                Venue Name {/esports/i.test(String(formData.sport || '')) ? '(Optional)' : '*'}
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

          {/* Categories Available */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories Available (Optional)
            </label>
            <CategorySelector
              value={formData.categoriesAvailable}
              onChange={(value) => setFormData(prev => ({ ...prev, categoriesAvailable: value }))}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/coach', { state: { activeTab: 'events' } })}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center"
            >
              <FaTimes className="mr-2" />
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
                  <span className="ml-2">Updating...</span>
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Update Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventEdit;
