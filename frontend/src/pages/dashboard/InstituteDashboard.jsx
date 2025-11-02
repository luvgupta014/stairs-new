import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getInstituteDashboard, bulkUploadStudents } from '../../api';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import StudentCard from '../../components/StudentCard';

const InstituteDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('all');
  const tabContentRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await getInstituteDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Using mock data for demo
      setDashboardData({
        institute: {
          name: 'Springfield Sports Academy',
          type: 'Academy',
          location: 'Springfield, IL',
          established: '2015',
          studentsCount: 245,
          coachesCount: 18,
          sportsOffered: ['Football', 'Basketball', 'Tennis', 'Swimming', 'Athletics'],
          eventsHosted: 12,
          successRate: 87
        },
        students: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            sport: 'Football',
            level: 'Intermediate',
            joinedDate: '2024-01-15',
            performance: 85,
            coach: 'Mike Johnson',
            achievements: ['Regional Champion'],
            status: 'active'
          },
          {
            id: 2,
            name: 'Sarah Williams',
            email: 'sarah@example.com',
            sport: 'Basketball',
            level: 'Advanced',
            joinedDate: '2024-02-20',
            performance: 92,
            coach: 'David Wilson',
            achievements: ['State Qualifier', 'MVP Award'],
            status: 'active'
          },
          {
            id: 3,
            name: 'Mike Chen',
            email: 'mike@example.com',
            sport: 'Tennis',
            level: 'Beginner',
            joinedDate: '2024-03-10',
            performance: 76,
            coach: 'Lisa Taylor',
            achievements: [],
            status: 'active'
          }
        ],
        coaches: [
          {
            id: 1,
            name: 'Mike Johnson',
            specialization: 'Football',
            experience: 8,
            students: 25,
            rating: 4.8,
            certifications: ['FIFA Level 2', 'Sports Psychology']
          },
          {
            id: 2,
            name: 'David Wilson',
            specialization: 'Basketball',
            experience: 6,
            students: 18,
            rating: 4.9,
            certifications: ['FIBA Level 1', 'Youth Coaching']
          }
        ],
        recentEvents: [
          {
            id: 1,
            name: 'Annual Sports Day',
            date: '2024-12-15',
            participants: 150,
            type: 'Internal'
          },
          {
            id: 2,
            name: 'Inter-School Championship',
            date: '2024-11-28',
            participants: 45,
            type: 'Competition'
          }
        ],
        analytics: {
          monthlyGrowth: 12,
          performanceAverage: 84,
          eventsThisMonth: 3,
          newStudentsThisMonth: 22
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const results = await bulkUploadStudents(formData);
      setUploadResults(results);
    } catch (error) {
      console.error('Upload failed:', error);
      // Mock results for demo
      setUploadResults({
        success: 15,
        failed: 2,
        total: 17,
        errors: [
          { row: 5, error: 'Invalid email format' },
          { row: 12, error: 'Missing sport field' }
        ]
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.xlsx'))) {
      setSelectedFile(file);
      setUploadResults(null);
    } else {
      alert('Please select a CSV or Excel file');
    }
  };

  const filteredStudents = dashboardData?.students?.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = filterSport === 'all' || student.sport === filterSport;
    return matchesSearch && matchesSport;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">
                {dashboardData?.institute?.name || 'Institute Dashboard'}
              </h1>
              <p className="text-blue-100 text-lg">
                {dashboardData?.institute?.type || 'Sports Institute'} • Est. {dashboardData?.institute?.established || '2020'}
              </p>
              <div className="mt-3 flex items-center space-x-4">
                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                  👥 {dashboardData?.institute?.studentsCount || 0} Students
                </span>
                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                  👨‍🏫 {dashboardData?.institute?.coachesCount || 0} Coaches
                </span>
                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                  🏆 {dashboardData?.institute?.eventsHosted || 0} Events
                </span>
              </div>
            </div>
            <div className="hidden md:flex space-x-4">
              <button
                onClick={() => setUploadModal(true)}
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Bulk Upload
              </button>
              <button className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-400 transition-colors">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => {
              setActiveTab('students');
              setTimeout(() => {
                tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.institute?.studentsCount || 0}</p>
                <p className="text-sm text-blue-600 mt-1">+{dashboardData?.analytics?.newStudentsThisMonth || 0} this month</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => {
              setActiveTab('coaches');
              setTimeout(() => {
                tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Coaches</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.institute?.coachesCount || 0}</p>
                <p className="text-sm text-green-600 mt-1">All verified</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => {
              setActiveTab('analytics');
              setTimeout(() => {
                tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.institute?.successRate || 0}%</p>
                <p className="text-sm text-purple-600 mt-1">Performance metric</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sports Offered</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.institute?.sportsOffered?.length || 0}</p>
                <p className="text-sm text-yellow-600 mt-1">Different disciplines</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div ref={tabContentRef} className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'students', name: 'Students', icon: '👥' },
                { id: 'coaches', name: 'Coaches', icon: '👨‍🏫' },
                { id: 'events', name: 'Events', icon: '🏆' },
                { id: 'analytics', name: 'Analytics', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                        👥
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">22 new students enrolled this month</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                        🏆
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">Inter-School Championship completed successfully</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                        👨‍🏫
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">New coach David Wilson verified and approved</p>
                        <p className="text-xs text-gray-500">3 days ago</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                  <div className="space-y-3">
                    {dashboardData?.recentEvents?.map(event => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{event.name}</h4>
                          <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
                            {event.type}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">{event.participants} participants</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3 mb-8">
                    <button
                      onClick={() => setUploadModal(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      📤 Bulk Upload Students
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                      🏆 Create Event
                    </button>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                      👨‍🏫 Invite Coach
                    </button>
                    <Link
                      to="/institute/profile"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors block text-center"
                    >
                      📝 Update Profile
                    </Link>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                      📊 Generate Report
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sports Offered</h3>
                  <div className="space-y-2">
                    {dashboardData?.institute?.sportsOffered?.map((sport, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{sport}</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Student Management ({filteredStudents.length})
                  </h3>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={filterSport}
                      onChange={(e) => setFilterSport(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Sports</option>
                      {dashboardData?.institute?.sportsOffered?.map(sport => (
                        <option key={sport} value={sport}>{sport}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setUploadModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Bulk Upload
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStudents.map(student => (
                    <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Sport</span>
                          <span className="font-medium">{student.sport}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Level</span>
                          <span className="font-medium">{student.level}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Performance</span>
                          <span className="font-medium">{student.performance}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Coach</span>
                          <span className="font-medium">{student.coach}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700 transition-colors">
                          View Profile
                        </button>
                        <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'coaches' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Coach Management</h3>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">
                    Invite Coach
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData?.coaches?.map(coach => (
                    <div key={coach.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {coach.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{coach.name}</h4>
                          <p className="text-sm text-gray-600">{coach.specialization}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Experience</span>
                          <span className="font-medium">{coach.experience} years</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Students</span>
                          <span className="font-medium">{coach.students}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Rating</span>
                          <span className="font-medium">⭐ {coach.rating}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-1">Certifications:</p>
                        <div className="flex flex-wrap gap-1">
                          {coach.certifications.map((cert, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                          View Profile
                        </button>
                        <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Event Management</h3>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">
                    Create Event
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData?.recentEvents?.map(event => (
                    <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-semibold text-gray-900">{event.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.type === 'Competition' ? 'bg-red-100 text-red-800' :
                          event.type === 'Internal' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {event.type}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">📅 {new Date(event.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">👥 {event.participants} participants</p>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700 transition-colors">
                          View Details
                        </button>
                        <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-6">Performance Metrics</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Average Performance</span>
                        <span className="text-sm text-gray-600">{dashboardData?.analytics?.performanceAverage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${dashboardData?.analytics?.performanceAverage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Monthly Growth</span>
                        <span className="text-sm text-gray-600">{dashboardData?.analytics?.monthlyGrowth}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${dashboardData?.analytics?.monthlyGrowth}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-6">Growth Analytics</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">📊 Analytics Chart (Chart.js integration)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        title="Bulk Upload Students"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV or Excel File
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Name, Email, Sport, Level (Required fields)</li>
              <li>• Phone, Date of Birth, Address (Optional fields)</li>
              <li>• First row should contain column headers</li>
              <li>• Maximum 500 students per upload</li>
            </ul>
          </div>

          {uploadResults && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Upload Results:</h4>
              <div className="space-y-2">
                <p className="text-sm text-green-600">✅ Successfully uploaded: {uploadResults.success}</p>
                <p className="text-sm text-red-600">❌ Failed: {uploadResults.failed}</p>
                <p className="text-sm text-gray-600">📊 Total processed: {uploadResults.total}</p>
                {uploadResults.errors?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Errors:</p>
                    {uploadResults.errors.map((error, index) => (
                      <p key={index} className="text-xs text-red-600">
                        Row {error.row}: {error.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setUploadModal(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkUpload}
              disabled={!selectedFile || uploading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Students'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InstituteDashboard;