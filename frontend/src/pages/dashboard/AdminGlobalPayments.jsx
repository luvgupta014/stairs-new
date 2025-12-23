import React, { useEffect, useState } from 'react';
import { getGlobalPaymentSettings, updateGlobalPaymentSettings, getEventsFeesOverview, updateEventFee } from '../../api';
import Spinner from '../../components/Spinner';
import { FaSave, FaEdit, FaCheck, FaTimes, FaSync } from 'react-icons/fa';

const AdminGlobalPayments = () => {
  const [form, setForm] = useState({
    perStudentBaseCharge: '',
    defaultEventFee: '',
    coordinatorSubscriptionFee: '',
    adminStudentFeeEnabled: false,
    adminStudentFeeAmount: ''
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
          defaultEventFee: data.defaultEventFee ?? '',
          coordinatorSubscriptionFee: data.coordinatorSubscriptionFee ?? '',
          adminStudentFeeEnabled: data.adminStudentFeeEnabled ?? false,
          adminStudentFeeAmount: data.adminStudentFeeAmount ?? ''
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
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      setError('');
      const payload = {
        perStudentBaseCharge: Number(form.perStudentBaseCharge) || 0,
        defaultEventFee: Number(form.defaultEventFee) || 0,
        coordinatorSubscriptionFee: Number(form.coordinatorSubscriptionFee) || 0,
        adminStudentFeeEnabled: !!form.adminStudentFeeEnabled,
        adminStudentFeeAmount: Number(form.adminStudentFeeAmount) || 0
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
      feeMode: event.feeMode || 'GLOBAL',
      eventFee: event.eventFee || 0,
      coordinatorFee: event.coordinatorFee || 0,
      // Student-fee configuration (admin-created events only)
      createdByAdmin: !!event.isAdminCreated || !!event.createdByAdmin,
      studentFeeEnabled: !!event.studentFeeEnabled,
      studentFeeAmount: event.studentFeeAmount || 0,
      studentFeeUnit: event.studentFeeUnit || 'PERSON'
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
      const isAdminEvent = !!eventEditForm.createdByAdmin;
      const payload = {
        feeMode: eventEditForm.feeMode,
        eventFee: Number(eventEditForm.eventFee) || 0,
        coordinatorFee: Number(eventEditForm.coordinatorFee) || 0,
        // Only allow configuring student fees for admin-created events
        ...(isAdminEvent && {
          studentFeeEnabled: !!eventEditForm.studentFeeEnabled,
          studentFeeAmount: Number(eventEditForm.studentFeeAmount) || 0,
          studentFeeUnit: eventEditForm.studentFeeUnit || 'PERSON'
        })
      };
      const res = await updateEventFee(eventId, payload);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-xs text-gray-500 mt-1">
                Event fee per student (Use Case 1)
              </p>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coordinator Subscription Fee (₹)
              </label>
              <input
                type="number"
                name="coordinatorSubscriptionFee"
                value={form.coordinatorSubscriptionFee}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                step="0.01"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                One-time registration fee (Use Case 2)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <input
                id="adminStudentFeeEnabled"
                type="checkbox"
                name="adminStudentFeeEnabled"
                checked={!!form.adminStudentFeeEnabled}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div>
                <label htmlFor="adminStudentFeeEnabled" className="block text-sm font-medium text-gray-700">
                  Enable student fee for admin-created events
                </label>
                <p className="text-xs text-gray-500">
                  When enabled, admin-created events will charge students by default.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default student participation fee (₹)
              </label>
              <input
                type="number"
                name="adminStudentFeeAmount"
                value={form.adminStudentFeeAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                step="0.01"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for admin-created events when no specific student fee is provided.
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
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee Mode (Organizer)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organizer Event Fee (₹)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coordinator Fee (₹)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organizer Total (₹)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Fee Enabled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Fee (₹ / unit)
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {event.isAdminCreated || event.createdByAdmin ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          Admin-created (Student Fee)
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Coordinator-created
                        </span>
                      )}
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
                          {(event.isAdminCreated || event.createdByAdmin) ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700">
                              Student fee only
                            </span>
                          ) : (
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
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(event.isAdminCreated || event.createdByAdmin) ? (
                            <span className="text-xs text-gray-400">N/A</span>
                          ) : (
                            <input
                              type="number"
                              name="eventFee"
                              value={eventEditForm.eventFee}
                              onChange={handleEventFeeChange}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                              min="0"
                              step="0.01"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(event.isAdminCreated || event.createdByAdmin) ? (
                            <span className="text-xs text-gray-400">N/A</span>
                          ) : (
                            <input
                              type="number"
                              name="coordinatorFee"
                              value={eventEditForm.coordinatorFee}
                              onChange={handleEventFeeChange}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                              min="0"
                              step="0.01"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(event.isAdminCreated || event.createdByAdmin)
                            ? <span className="text-xs text-gray-400">N/A</span>
                            : (
                              eventEditForm.feeMode === 'GLOBAL' 
                                ? `₹${(Number(form.perStudentBaseCharge) * (event.currentParticipants || 0)).toFixed(2)}`
                                : `₹${(Number(eventEditForm.eventFee || 0) + Number(eventEditForm.coordinatorFee || 0)).toFixed(2)}`
                            )
                          }
                        </td>
                        {/* Student fee controls */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {(event.isAdminCreated || event.createdByAdmin) ? (
                            <input
                              type="checkbox"
                              name="studentFeeEnabled"
                              checked={!!eventEditForm.studentFeeEnabled}
                              onChange={(e) =>
                                setEventEditForm((prev) => ({
                                  ...prev,
                                  studentFeeEnabled: e.target.checked
                                }))
                              }
                            />
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {(event.isAdminCreated || event.createdByAdmin) ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                name="studentFeeAmount"
                                value={eventEditForm.studentFeeAmount}
                                onChange={handleEventFeeChange}
                                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                                min="0"
                                step="0.01"
                                disabled={!eventEditForm.studentFeeEnabled}
                              />
                              <select
                                name="studentFeeUnit"
                                value={eventEditForm.studentFeeUnit}
                                onChange={handleEventFeeChange}
                                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                                disabled={!eventEditForm.studentFeeEnabled}
                              >
                                <option value="PERSON">PERSON</option>
                                <option value="TEAM">TEAM</option>
                              </select>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
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
                          {event.isAdminCreated || event.createdByAdmin
                            ? <span className="text-gray-400 text-xs">N/A</span>
                            : (event.coordinatorFee || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{event.calculatedFee?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {event.isAdminCreated || event.createdByAdmin ? (
                            <span className="text-xs font-medium">
                              {event.studentFeeEnabled ? 'Yes' : 'No'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.isAdminCreated || event.createdByAdmin
                            ? `${event.studentFeeAmount || 0} / ${(event.studentFeeUnit || 'PERSON')}`
                            : 'N/A'}
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
