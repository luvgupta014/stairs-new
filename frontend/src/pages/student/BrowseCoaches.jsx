import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableCoaches, requestCoachConnection } from '../../api';
import Spinner from '../../components/Spinner';

const BrowseCoaches = () => {
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState([]);
  const [filteredCoaches, setFilteredCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [connecting, setConnecting] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCoaches();
  }, []);

  useEffect(() => {
    filterCoaches();
  }, [coaches, searchTerm, selectedSport]);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      const response = await getAvailableCoaches();
      if (response.success) {
        setCoaches(response.data.coaches || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load coaches' });
      }
    } catch (error) {
      console.error('Error loading coaches:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to load coaches' });
    } finally {
      setLoading(false);
    }
  };

  const filterCoaches = () => {
    let result = coaches;

    if (searchTerm.trim()) {
      result = result.filter(coach =>
        coach.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSport) {
      result = result.filter(coach => coach.specialization === selectedSport);
    }

    setFilteredCoaches(result);
  };

  const handleConnect = async (coachId, coachName) => {
    try {
      setConnecting(coachId);
      const response = await requestCoachConnection(coachId);
      if (response.success) {
        setMessage({ type: 'success', text: `Connection request sent to ${coachName}!` });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to send connection request' });
      }
    } catch (error) {
      console.error('Error connecting with coach:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to send connection request' });
    } finally {
      setConnecting(null);
    }
  };

  const uniqueSports = [...new Set(coaches.map(c => c.specialization).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-teal-600 hover:text-teal-700 font-medium mb-4 inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Browse Coaches</h1>
          <p className="text-gray-600 mt-2">
            Find and connect with experienced coaches to enhance your skills
          </p>
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, sport, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Sports</option>
                {uniqueSports.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Coaches Grid */}
        <div>
          {filteredCoaches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoaches.map((coach) => (
                <div
                  key={coach.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
                >
                  {/* Coach Header */}
                  <div className="bg-gradient-to-r from-teal-500 to-blue-500 h-20"></div>

                  {/* Coach Info */}
                  <div className="px-6 py-5">
                    <div className="flex items-center -mt-12 mb-4">
                      <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {coach.name.charAt(0).toUpperCase()}
                      </div>
                      {coach.rating && (
                        <div className="ml-auto flex items-center">
                          <span className="text-yellow-400 text-lg">★</span>
                          <span className="ml-1 font-semibold text-gray-900">{coach.rating}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">{coach.name}</h3>
                    
                    {coach.specialization && (
                      <p className="text-sm text-teal-600 font-medium mb-3">
                        🏃 {coach.specialization}
                      </p>
                    )}

                    {coach.location && (
                      <p className="text-sm text-gray-600 mb-2">
                        📍 {coach.location}
                      </p>
                    )}

                    {coach.experience && (
                      <p className="text-sm text-gray-600 mb-3">
                        📅 {coach.experience} years experience
                      </p>
                    )}

                    {coach.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {coach.bio}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConnect(coach.id, coach.name)}
                        disabled={connecting === coach.id}
                        className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        {connecting === coach.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Connecting...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.5C7.305 4.5 3.364 7.05 1.5 10.5c1.864 3.45 5.805 6 10.5 6s8.636-2.55 10.5-6c-1.864-3.45-5.805-6-10.5-6z" />
                            </svg>
                            Connect
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/coach/${coach.id}`)}
                        className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Coaches Found</h3>
              <p className="text-gray-600">
                {coaches.length === 0 
                  ? "No coaches are available at the moment. Please try again later." 
                  : "Try adjusting your search or filter criteria."}
              </p>
              {coaches.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSport('');
                  }}
                  className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="mt-6 text-center text-gray-600">
            {filteredCoaches.length > 0 && (
              <p>
                Showing <span className="font-semibold">{filteredCoaches.length}</span> of{' '}
                <span className="font-semibold">{coaches.length}</span> coaches
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseCoaches;
