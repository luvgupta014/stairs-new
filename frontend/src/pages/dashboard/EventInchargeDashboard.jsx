import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const EventInchargeDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event Incharge Dashboard</h1>
            <p className="text-sm text-gray-600">
              Welcome {user?.name || user?.email}. You will see events assigned by Admin.
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full">
            Role: Event Incharge
          </span>
        </div>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Assigned Events</h2>
            <p className="text-sm text-gray-600 mb-3">
              This view will list events assigned to you. Contact Admin if you do not see any events.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              View Events
            </Link>
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Need Access?</h2>
            <p className="text-sm text-gray-600">
              If you need result upload, student management, certificate management, or fee management permissions,
              ask the Admin to enable them for your assigned events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventInchargeDashboard;

