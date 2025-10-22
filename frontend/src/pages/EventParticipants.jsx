import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getEventRegistrations } from '../api';
import Spinner from '../components/Spinner';
import { FaArrowLeft, FaDownload, FaEnvelope, FaPhone, FaUser } from 'react-icons/fa';

const EventParticipants = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  
  const event = location.state?.event;

  useEffect(() => {
    loadParticipants();
  }, [eventId]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await getEventRegistrations(eventId);
      
      if (response.success) {
        setParticipants(response.data.registrations || []);
      } else {
        throw new Error(response.message || 'Failed to load participants');
      }
    } catch (err) {
      console.error('Failed to load participants:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportParticipants = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Phone,Sport,Level,Registration Date,Status\n"
      + participants.map(p => 
          `"${p.student.name}","${p.student.user.email}","${p.student.user.phone}","${p.student.sport}","${p.student.level}","${new Date(p.registrationDate).toLocaleDateString()}","${p.status}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${event?.name || 'event'}_participants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = !filters.search || 
      participant.student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      participant.student.user.email.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || participant.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard/coach', { state: { activeTab: 'events' } })}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Events
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {event?.name || 'Event Participants'}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>📅 {event && new Date(event.startDate).toLocaleDateString()}</span>
                <span>📍 {event?.venue}</span>
                <span>🏃‍♂️ {event?.sport}</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={exportParticipants}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
              >
                <FaDownload className="mr-2" />
                Export List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {filteredParticipants.length} of {participants.length} participants
            </div>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-lg shadow-md">
        {error ? (
          <div className="p-6 text-center">
            <div className="text-red-600 text-lg mb-2">Error</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={loadParticipants}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredParticipants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Participant</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Contact</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Details</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Registration</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant, index) => (
                  <tr key={participant.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {participant.student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{participant.student.name}</div>
                          <div className="text-sm text-gray-500">{participant.student.institute || 'Independent'}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaEnvelope className="mr-2 text-gray-400" />
                          {participant.student.user.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FaPhone className="mr-2 text-gray-400" />
                          {participant.student.user.phone}
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">Sport:</span> {participant.student.sport}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Level:</span> {participant.student.level}
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">
                        {new Date(participant.registrationDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        participant.status === 'REGISTERED' || participant.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        participant.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {participant.status}
                      </span>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`mailto:${participant.student.user.email}`, '_blank')}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Email
                        </button>
                        <button
                          onClick={() => window.open(`tel:${participant.student.user.phone}`, '_blank')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Call
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FaUser className="text-gray-400 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Participants Yet</h3>
            <p className="text-gray-600">
              {filters.search || filters.status 
                ? 'No participants match your current filters.' 
                : 'Participants will appear here when students register for this event.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventParticipants;