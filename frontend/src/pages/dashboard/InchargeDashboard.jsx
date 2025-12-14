import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignedEvents, updateAssignedEventFee } from '../../api';
import Spinner from '../../components/Spinner';

const InchargeDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feeInputs, setFeeInputs] = useState({});
  const [savingFeeId, setSavingFeeId] = useState(null);

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
                  <Link className="px-3 py-1 bg-blue-600 text-white rounded" to={`/incharge/event/${evt.id}/results`}>Upload Results</Link>
                  <Link className="px-3 py-1 bg-gray-800 text-white rounded" to={`/incharge/event/${evt.id}/participants`}>View Participants</Link>
                </div>
              </div>
              {evt.feeType === 'EVENT_SPECIFIC' && (
                <div className="mt-3 p-2 bg-gray-50 border rounded">
                  <div className="text-sm text-gray-700 mb-2">Participation Fee</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={feeInputs[evt.id] ?? evt.eventFee ?? 0}
                      onChange={(e) => setFeeInputs(prev => ({ ...prev, [evt.id]: e.target.value }))}
                      className="w-32 px-2 py-1 border rounded"
                    />
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
                      onClick={async () => {
                        try {
                          setSavingFeeId(evt.id);
                          const fee = Number(feeInputs[evt.id] ?? evt.eventFee ?? 0);
                          const res = await updateAssignedEventFee(evt.id, fee);
                          if (res.success) {
                            setEvents(curr => curr.map(e => e.id === evt.id ? { ...e, eventFee: fee } : e));
                          } else {
                            alert(res.message || 'Failed to update fee');
                          }
                        } catch (err) {
                          alert((err && err.message) || 'Failed to update fee');
                        } finally {
                          setSavingFeeId(null);
                        }
                      }}
                      disabled={savingFeeId === evt.id}
                    >
                      {savingFeeId === evt.id ? 'Saving...' : 'Save Fee'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Requires permission; enforced server-side.</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InchargeDashboard;
