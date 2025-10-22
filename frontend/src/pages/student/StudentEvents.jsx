import { useState, useEffect } from 'react';
import { getStudentEvents, registerForEvent, getStudentEventRegistrations } from '../../api';
import Spinner from '../../components/Spinner';

const StudentEvents = () => {
  const [availableEvents, setAvailableEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  const [filters, setFilters] = useState({
    search: '',
    sport: '',
    location: '',
    maxFees: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading student events data...');
      
      const [eventsResponse, registrationsResponse] = await Promise.all([
        getStudentEvents({ page: 1, limit: 50 }),
        getStudentEventRegistrations({ page: 1, limit: 50 })
      ]);
      
      console.log('✅ Events loaded:', eventsResponse);
      console.log('✅ Registrations loaded:', registrationsResponse);
      
      setAvailableEvents(eventsResponse.data?.events || []);
      setMyRegistrations(registrationsResponse.data?.registrations || []);
    } catch (error) {
      console.error('❌ Failed to load events data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      setRegistering(eventId);
      console.log(`🔄 Registering for event ${eventId}...`);
      
      const response = await registerForEvent(eventId);
      
      if (response.success) {
        console.log('✅ Registration successful');
        alert('Successfully registered for the event!');
        
        // Refresh data
        await loadData();
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration failed:', error);
      alert(`Registration failed: ${error.message || 'Unknown error'}`);
    } finally {
      setRegistering(null);
    }
  };

  const filteredEvents = availableEvents.filter(event => {
    const matchesSearch = !filters.search || 
      event.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesSport = !filters.sport || event.sport === filters.sport;
    
    const matchesLocation = !filters.location ||
      event.venue?.toLowerCase().includes(filters.location.toLowerCase()) ||
      event.city?.toLowerCase().includes(filters.location.toLowerCase());
    
    const matchesFees = !filters.maxFees || 
      (event.eventFee || event.fees || 0) <= parseFloat(filters.maxFees);
    
    return matchesSearch && matchesSport && matchesLocation && matchesFees;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-2">Discover and register for sporting events</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('available')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Available Events ({availableEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('registered')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'registered'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Registrations ({myRegistrations.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'available' && (
              <div>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filters.sport}
                    onChange={(e) => setFilters(prev => ({ ...prev, sport: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Sports</option>
                    <option value="Football">Football</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Swimming">Swimming</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Athletics">Athletics</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Location..."
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max fees..."
                    value={filters.maxFees}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxFees: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Events Grid */}
                {filteredEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map(event => (
                      <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-gray-900 text-lg">{event.title || event.name}</h3>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {event.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">📅 {new Date(event.startDate).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">📍 {event.location || event.venue}</p>
                          <p className="text-sm text-gray-600">🏷️ {event.sport}</p>
                          <p className="text-sm text-gray-600">👨‍🏫 {event.organizer?.name || event.coach?.name}</p>
                          <p className="text-sm text-gray-600">👥 {event.currentParticipants || 0}/{event.maxParticipants || 'Unlimited'}</p>
                          <p className="text-sm text-gray-600">💰 ₹{event.fees || event.eventFee || 0}</p>
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-700 mb-4 line-clamp-3">{event.description}</p>
                        )}

                        <div className="flex space-x-2">
                          <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                            View Details
                          </button>
                          <button
                            onClick={() => handleRegister(event.id)}
                            disabled={registering === event.id}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {registering === event.id ? 'Registering...' : 'Register'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🏆</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                    <p className="text-gray-600">Try adjusting your filters or check back later for new events.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'registered' && (
              <div>
                {myRegistrations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myRegistrations.map(registration => (
                      <div key={registration.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-gray-900 text-lg">{registration.event.title || registration.event.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            registration.status === 'REGISTERED' || registration.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {registration.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">📅 {new Date(registration.event.startDate).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">📍 {registration.event.location || registration.event.venue}</p>
                          <p className="text-sm text-gray-600">🏷️ {registration.event.sport}</p>
                          <p className="text-sm text-gray-600">💰 ₹{registration.event.fees || registration.event.eventFee || 0}</p>
                          <p className="text-sm text-gray-600">📝 Registered: {new Date(registration.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="flex space-x-2">
                          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Registrations Yet</h3>
                    <p className="text-gray-600 mb-6">You haven't registered for any events yet.</p>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Browse Available Events
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEvents;