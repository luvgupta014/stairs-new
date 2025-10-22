import React from 'react';

// Test component to debug student view details issue
const StudentEventDebug = () => {
  const testUserRole = 'student'; // Test with lowercase
  const testEvent = {
    id: 'test-123',
    name: 'Test Event',
    sport: 'Cricket',
    startDate: new Date().toISOString(),
    venue: 'Test Venue',
    city: 'Test City'
  };

  const handleAction = (action, event) => {
    console.log('🎯 Action triggered:', action);
    console.log('📊 Event:', event);
    console.log('👤 User role:', testUserRole);
    
    if (action === 'view') {
      console.log('✅ View Details action would navigate to:', `/events/${event.id}`);
    }
  };

  const shouldShowViewButton = (testUserRole === 'student' || testUserRole === 'STUDENT');

  return (
    <div className="p-4 border rounded">
      <h3>Student Event Debug</h3>
      <p>User Role: {testUserRole}</p>
      <p>Should show View Details button: {shouldShowViewButton ? 'YES' : 'NO'}</p>
      
      {shouldShowViewButton && (
        <button
          onClick={() => handleAction('view', testEvent)}
          className="bg-blue-600 text-white px-3 py-2 rounded mt-2"
        >
          View Details (Test)
        </button>
      )}
      
      <div className="mt-4 text-sm">
        <p>Role checks:</p>
        <ul>
          <li>testUserRole === 'student': {testUserRole === 'student' ? '✅' : '❌'}</li>
          <li>testUserRole === 'STUDENT': {testUserRole === 'STUDENT' ? '✅' : '❌'}</li>
          <li>Combined check: {(testUserRole === 'student' || testUserRole === 'STUDENT') ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentEventDebug;