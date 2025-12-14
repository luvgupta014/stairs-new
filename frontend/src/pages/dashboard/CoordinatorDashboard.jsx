import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignedEvents } from '../../api';
import Spinner from '../../components/Spinner';

const CoordinatorDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAssignedEvents({ page: 1, limit: 50 });
        if (res.success) {
          setEvents(res.data.events || []);
        } else {
          setError(res.message || 'Failed to load assigned events');
        }
      } catch (e) {
        setError(e.message || 'Failed to load assigned events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Assigned Events</h1>
      {events.length === 0 ? (
        <div className="text-gray-600">No events assigned yet.</div>
      ) : (
        <div className="space-y-3">
          {events.map(evt => (
            <div key={evt.id} className="border rounded p-3 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{evt.name}</div>
                  <div className="text-sm text-gray-600">{evt.sport} • {new Date(evt.startDate).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">{evt.city} • {evt.venue}</div>
                </div>
                <div className="flex gap-2">
                  <Link className="px-3 py-1 bg-blue-600 text-white rounded" to={`/coordinator/event/${evt.id}/results`}>Upload Results</Link>
                  <Link className="px-3 py-1 bg-gray-800 text-white rounded" to={`/incharge/event/${evt.id}/participants`}>View Participants</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;
