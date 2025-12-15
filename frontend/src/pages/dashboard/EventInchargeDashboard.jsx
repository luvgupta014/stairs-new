import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEventInchargeAssignedEvents } from '../../api';

const EventInchargeDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assigned, setAssigned] = useState([]);
  const [error, setError] = useState('');

  const displayName = useMemo(() => {
    const p = user?.profile || {};
    return (
      p.fullName ||
      p.name ||
      user?.name ||
      user?.email ||
      user?.uniqueId ||
      'Event Incharge'
    );
  }, [user]);

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="rounded-2xl overflow-hidden shadow-lg border bg-white">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Event Incharge Dashboard</h1>
              <p className="text-indigo-100 text-sm mt-1">
                Welcome <span className="font-semibold">{displayName}</span>. You will see events assigned by Admin.
              </p>
              <div className="mt-2 text-xs text-indigo-100">
                {user?.email ? <>Signed in as <span className="font-mono">{user.email}</span></> : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-semibold bg-white/15 rounded-full">
                Role: Event Incharge
              </span>
              {user?.uniqueId ? (
                <span className="px-3 py-1 text-xs font-semibold bg-white/15 rounded-full font-mono">
                  UID: {user.uniqueId}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl border bg-gray-50">
              <div className="text-xs text-gray-500">Assigned events</div>
              <div className="text-2xl font-bold text-gray-900">{assigned.length}</div>
            </div>
            <div className="p-4 rounded-xl border bg-gray-50">
              <div className="text-xs text-gray-500">Point of contact</div>
              <div className="text-2xl font-bold text-gray-900">{assigned.some(a => a.isPointOfContact) ? 'Yes' : 'No'}</div>
            </div>
            <div className="p-4 rounded-xl border bg-gray-50">
              <div className="text-xs text-gray-500">Support</div>
              <div className="text-sm text-gray-700 mt-1">If anything looks wrong, contact Admin.</div>
            </div>
          </div>

          {/* Alerts */}
          {error ? (
            <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800">
              <div className="font-semibold">Couldn’t load assigned events</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          ) : null}

          {/* Assigned Events */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Events</h2>
            <Link to="/events" className="text-sm text-indigo-700 hover:text-indigo-900 font-medium">
              Browse all events
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-4 rounded-xl border bg-white animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3 mt-3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
                </div>
              ))}
            </div>
          ) : assigned.length === 0 ? (
            <div className="p-6 rounded-xl border bg-gray-50">
              <div className="font-semibold text-gray-900">No events assigned yet</div>
              <div className="text-sm text-gray-600 mt-1">
                Ask Admin to assign an event and grant the required permissions.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assigned.map((a) => {
                const ev = a.event || {};
                const p = a.permissionOverride || {};
                const chips = [
                  p.resultUpload ? 'Result Upload' : null,
                  p.studentManagement ? 'Student Mgmt' : null,
                  p.certificateManagement ? 'Certificates' : null,
                  p.feeManagement ? 'Fees' : null
                ].filter(Boolean);

                return (
                  <div key={a.id} className="p-4 rounded-xl border bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-900 truncate">
                            {ev.name || 'Unnamed Event'}
                          </div>
                          {a.isPointOfContact ? (
                            <span className="inline-flex text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                              POC
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {ev.sport ? <span className="font-medium">{ev.sport}</span> : null}
                          {ev.venue || ev.city || ev.state ? (
                            <> • {[ev.venue, ev.city, ev.state].filter(Boolean).join(', ')}</>
                          ) : null}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {ev.uniqueId ? <>Event ID: <span className="font-mono">{ev.uniqueId}</span></> : null}
                        </div>
                      </div>
                      <Link
                        to={`/events/${a.eventId}`}
                        className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                      >
                        Open
                      </Link>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-semibold text-gray-700">Permissions</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {chips.length ? chips.map((c) => (
                          <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                            {c}
                          </span>
                        )) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                            None
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventInchargeDashboard;

