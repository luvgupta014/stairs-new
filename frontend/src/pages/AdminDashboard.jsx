import { useState, useEffect } from 'react';
import { getAdminDashboard, getAdminStats, adminApproveEvent, adminRejectEvent } from '../api';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCoaches: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  });
  
  const [coaches, setCoaches] = useState([]);
  const [events, setEvents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardData, statsData] = await Promise.all([
        getAdminDashboard(),
        getAdminStats()
      ]);
      
      // TODO: Remove mock data when backend is integrated
      // Mock data for demonstration
      setStats({
        totalStudents: 1250,
        totalCoaches: 45,
        totalEvents: 128,
        pendingApprovals: 8,
        totalRevenue: 89500,
        monthlyGrowth: 12.5
      });

      setCoaches([
        { id: 1, name: 'Rajesh Kumar', students: 25, events: 5, revenue: 15000, status: 'active' },
        { id: 2, name: 'Priya Sharma', students: 18, events: 3, revenue: 12000, status: 'active' },
        { id: 3, name: 'Amit Singh', students: 30, events: 7, revenue: 18000, status: 'pending' },
      ]);

      setEvents([
        { id: 1, name: 'Summer Cricket Camp', coach: 'Rajesh Kumar', participants: 45, status: 'pending', date: '2024-03-15' },
        { id: 2, name: 'Football Training Program', coach: 'Priya Sharma', participants: 30, status: 'approved', date: '2024-03-20' },
        { id: 3, name: 'Basketball Championship', coach: 'Amit Singh', participants: 60, status: 'pending', date: '2024-03-25' },
      ]);

      setTransactions([
        { id: 1, coach: 'Rajesh Kumar', amount: 1999, type: 'registration', status: 'completed', date: '2024-03-01' },
        { id: 2, coach: 'Priya Sharma', amount: 1999, type: 'registration', status: 'completed', date: '2024-03-02' },
        { id: 3, coach: 'Amit Singh', amount: 1999, type: 'registration', status: 'pending', date: '2024-03-03' },
      ]);

    } catch (error) {
      setModalMessage(`Failed to load dashboard data: ${error.message}`);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      await adminApproveEvent(eventId);
      setModalMessage('Event approved successfully!');
      setShowModal(true);
      
      // Update local state
      setEvents(events.map(event => 
        event.id === eventId ? { ...event, status: 'approved' } : event
      ));
      
    } catch (error) {
      setModalMessage(`Failed to approve event: ${error.message}`);
      setShowModal(true);
    }
  };

  const handleRejectEvent = async (eventId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      await adminRejectEvent(eventId, reason);
      setModalMessage('Event rejected successfully!');
      setShowModal(true);
      
      // Update local state
      setEvents(events.map(event => 
        event.id === eventId ? { ...event, status: 'rejected' } : event
      ));
      
    } catch (error) {
      setModalMessage(`Failed to reject event: ${error.message}`);
      setShowModal(true);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">STAIRS Talent Hub Management</p>
            </div>
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Export Data
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'coaches', 'events', 'transactions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-md">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Coaches</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCoaches}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-md">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-md">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-md">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-md">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.monthlyGrowth}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'coaches' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Coach Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coaches.map((coach) => (
                    <tr key={coach.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coach.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coach.students}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coach.events}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{coach.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          coach.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {coach.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Event Approvals</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.coach}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.participants}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {event.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveEvent(event.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectEvent(event.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.coach}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{transaction.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{transaction.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Admin Action"
          message={modalMessage}
        />
      )}
    </div>
  );
};

export default AdminDashboard;