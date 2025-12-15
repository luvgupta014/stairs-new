import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEventInchargeAssignedEvents } from '../../api';

const EventInchargeDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assigned, setAssigned] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getEventInchargeAssignedEvents();
        if (res?.success) setAssigned(res.data || []);
        else setAssigned([]);
      } catch (e) {
        setError(e?.message || 'Failed to load assigned events.');
        setAssigned([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

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
            {loading ? (
              <p className="text-sm text-gray-600">Loading...</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : assigned.length === 0 ? (
              <p className="text-sm text-gray-600">
                No events assigned yet. Contact Admin if you expect access.
              </p>
            ) : (
              <div className="space-y-3">
                {assigned.map((a) => {
                  const p = a.permissionOverride || {};
                  const perms = [
                    p.resultUpload ? 'Result Upload' : null,
                    p.studentManagement ? 'Student Management' : null,
                    p.certificateManagement ? 'Certificate Management' : null,
                    p.feeManagement ? 'Fee Management' : null
                  ].filter(Boolean);

                  return (
                    <div key={a.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">{a.event?.name}</div>
                          <div className="text-xs text-gray-600">
                            {a.event?.sport} • {[a.event?.venue, a.event?.city, a.event?.state].filter(Boolean).join(', ')}
                          </div>
                          <div className="mt-2 text-xs text-gray-700">
                            <span className="font-semibold">Permissions:</span> {perms.join(', ') || 'None'}
                            {a.isPointOfContact ? (
                              <span className="ml-2 inline-flex text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                                POC
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <Link
                          to={`/events/${a.eventId}`}
                          className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

