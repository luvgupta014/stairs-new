// Complete Test Component to Debug Student View Details Issue
// Add this to any page temporarily to test the student login flow

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EventCard from '../components/EventCard';

const StudentViewDetailsTest = () => {
  const { user, login, logout } = useAuth();
  const [testResult, setTestResult] = useState('');

  // Mock event data for testing
  const mockEvent = {
    id: 'test-event-123',
    name: 'Test Cricket Tournament',
    sport: 'Cricket',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Sports Complex',
    city: 'Mumbai',
    address: '123 Sports Street',
    state: 'Maharashtra',
    eventFee: 500,
    maxParticipants: 50,
    currentParticipants: 15,
    status: 'upcoming',
    isRegistered: false,
    description: 'Test event for debugging view details functionality',
    coach: {
      id: 'coach-123',
      name: 'Test Coach',
      email: 'coach@test.com'
    }
  };

  const handleDemoLogin = async () => {
    try {
      setTestResult('Logging in as demo student...');
      await login({ 
        email: 'demo@student.com', 
        password: 'password' 
      }, 'student');
      setTestResult('✅ Demo login successful!');
    } catch (error) {
      setTestResult(`❌ Login failed: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setTestResult('Logged out successfully');
    } catch (error) {
      setTestResult(`❌ Logout failed: ${error.message}`);
    }
  };

  const handleEventAction = (action, event) => {
    setTestResult(`🎯 Event action: ${action} for event: ${event.name}`);
    console.log('Event action triggered:', { action, event, userRole: user?.role });
    
    if (action === 'view') {
      setTestResult(`✅ View Details would navigate to: /events/${event.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-blue-900 mb-4">Student View Details Debug Test</h2>
        
        {/* User Status */}
        <div className="mb-4">
          <h3 className="font-semibold">Current User Status:</h3>
          {user ? (
            <div className="bg-green-50 p-3 rounded mt-2">
              <p><strong>Logged in as:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>ID:</strong> {user.id}</p>
            </div>
          ) : (
            <div className="bg-red-50 p-3 rounded mt-2">
              <p className="text-red-700">Not logged in</p>
            </div>
          )}
        </div>

        {/* Login/Logout Controls */}
        <div className="flex gap-2 mb-4">
          {!user ? (
            <button
              onClick={handleDemoLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Login as Demo Student
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          )}
        </div>

        {/* Test Result */}
        {testResult && (
          <div className="bg-gray-50 p-3 rounded">
            <strong>Test Result:</strong> {testResult}
          </div>
        )}
      </div>

      {/* Role Check Debug */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Role Check Debug:</h3>
        <div className="text-sm space-y-1">
          <p>user?.role: <code className="bg-white px-1 rounded">{JSON.stringify(user?.role)}</code></p>
          <p>typeof user?.role: <code className="bg-white px-1 rounded">{typeof user?.role}</code></p>
          <p>user?.role === 'student': <code className="bg-white px-1 rounded">{String(user?.role === 'student')}</code></p>
          <p>user?.role === 'STUDENT': <code className="bg-white px-1 rounded">{String(user?.role === 'STUDENT')}</code></p>
          <p>Should show View Details: <code className="bg-white px-1 rounded">{String(user?.role === 'student' || user?.role === 'STUDENT')}</code></p>
        </div>
      </div>

      {/* Test EventCard */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-4">Test EventCard Component:</h3>
        
        {user ? (
          <div className="max-w-md">
            <EventCard
              event={mockEvent}
              userRole={user.role}
              userId={user.id}
              onAction={handleEventAction}
            />
          </div>
        ) : (
          <p className="text-gray-600">Please login to test EventCard component</p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Login as Demo Student" to authenticate as a student</li>
          <li>Check that the role debug shows user.role as "STUDENT"</li>
          <li>Look at the EventCard below - it should show a "View Details" button</li>
          <li>Click "View Details" and check the test result message</li>
          <li>Check browser console for any errors</li>
        </ol>
      </div>
    </div>
  );
};

export default StudentViewDetailsTest;