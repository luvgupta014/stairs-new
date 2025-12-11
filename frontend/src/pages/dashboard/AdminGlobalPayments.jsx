import React, { useEffect, useState } from 'react';
import { getGlobalPaymentSettings, updateGlobalPaymentSettings, getEventsFeesOverview, updateEventFee } from '../../api';
import Spinner from '../../components/Spinner';
import { FaSave, FaEdit, FaCheck, FaTimes, FaSync } from 'react-icons/fa';

const AdminGlobalPayments = () => {
  const [form, setForm] = useState({
    perStudentBaseCharge: '',
    defaultEventFee: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Events with fees
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventEditForm, setEventEditForm] = useState({});
  const [savingEventId, setSavingEventId] = useState(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await getGlobalPaymentSettings();
      if (res?.success) {
        const data = res.data || {};
        setForm({
          perStudentBaseCharge: data.perStudentBaseCharge ?? '',
          defaultEventFee: data.defaultEventFee ?? ''
        });
      }
    } catch (err) {
      console.error('Failed to load global payment settings:', err);
      setError(err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      const res = await getEventsFeesOverview();
      if (res?.success) {
        setEvents(res.data?.events || []);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadEvents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      setError('');
      const payload = {
        perStudentBaseCharge: Number(form.perStudentBaseCharge) || 0,
        defaultEventFee: Number(form.defaultEventFee) || 0
      };
      const res = await updateGlobalPaymentSettings(payload);
      if (res?.success) {
        setMessage('Global payment settings saved.');
        // Reload events to reflect new global settings
        await loadEvents();
      } else {
        setError(res?.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Failed to save global payment settings:', err);
      setError(err?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const startEditEvent = (event) => {
    setEditingEventId(event.id);
    setEventEditForm({
      eventFee: event.eventFee || 0,
      coordinatorFee: event.coordinatorFee || 0,
      feeMode: event.feeMode || 'GLOBAL'
    });
  };

  const cancelEditEvent = () => {
    setEditingEventId(null);
    setEventEditForm({});
  };

  const handleEventFeeChange = (e) => {
    const { name, value } = e.target;
    setEventEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEventFee = async (eventId) => {
    try {
      setSavingEventId(eventId);
      const res = await updateEventFee(eventId, eventEditForm);
      if (res?.success) {
        setMessage(`Event fee updated successfully.`);
        setEditingEventId(null);
        setEventEditForm({});
        await loadEvents(); // Reload to get updated data
      } else {
        setError(res?.message || 'Failed to update event fee.');
      }
    } catch (err) {
      console.error('Failed to update event fee:', err);
      setError(err?.message || 'Failed to update event fee.');
    } finally {
      setSavingEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Global Settings Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Global Payment Settings</h1>
        <p className="text-sm text-gray-600 mb-6">
          Set the default per-student base charge and default event fee used when an event uses GLOBAL fee mode.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per-Student Base Charge (₹)
              </label>
              <input
                type="number"
                name="perStudentBaseCharge"
                value={form.perStudentBaseCharge}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                step="0.01"
                placeholder="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Event Fee (₹)
              </label>
              <input
                type="number"
                name="defaultEventFee"
                value={form.defaultEventFee}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                step="0.01"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Fallback when participant count is zero
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60 flex items-center space-x-2"
            >
              <FaSave />
              <span>{saving ? 'Saving...' : 'Save Global Settings'}</span>
            </button>
            {message && <span className="text-green-600 text-sm">{message}</span>}
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </form>
      </div>

      {/* Events Fee Management Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Events Fee Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage individual event fees. Changes are saved in real-time.
            </p>
          </div>
          <button
            onClick={loadEvents}
            disabled={eventsLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium disabled:opacity-50"
          >
            <FaSync className={eventsLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {eventsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No events found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Fee (₹)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coordinator Fee (₹)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calculated Total (₹)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event.name}</div>
                      <div className="text-xs text-gray-500">{event.coach?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.sport}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.currentParticipants || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.feeMode === 'GLOBAL' ? 'bg-blue-100 text-blue-800' :
                        event.feeMode === 'EVENT' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.feeMode}
                      </span>
                    </td>
                    {editingEventId === event.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            name="feeMode"
                            value={eventEditForm.feeMode}
                            onChange={handleEventFeeChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="GLOBAL">GLOBAL</option>
                            <option value="EVENT">EVENT</option>
                            <option value="DISABLED">DISABLED</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            name="eventFee"
                            value={eventEditForm.eventFee}
                            onChange={handleEventFeeChange}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            name="coordinatorFee"
                            value={eventEditForm.coordinatorFee}
                            onChange={handleEventFeeChange}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {eventEditForm.feeMode === 'GLOBAL' 
                            ? `₹${(Number(form.perStudentBaseCharge) * (event.currentParticipants || 0)).toFixed(2)}`
                            : `₹${(Number(eventEditForm.eventFee || 0) + Number(eventEditForm.coordinatorFee || 0)).toFixed(2)}`
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => saveEventFee(event.id)}
                              disabled={savingEventId === event.id}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Save"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={cancelEditEvent}
                              className="text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.eventFee || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.coordinatorFee || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{event.calculatedFee?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => startEditEvent(event)}
                            className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                            title="Edit Fee"
                          >
                            <FaEdit />
                            <span>Edit</span>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGlobalPayments;
