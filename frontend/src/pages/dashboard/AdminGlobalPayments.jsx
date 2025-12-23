import React, { useEffect, useMemo, useState } from 'react';
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

  // Filters for events table
  const [eventFilters, setEventFilters] = useState({
    search: '',
    eventType: 'ALL', // ALL | ADMIN | COORDINATOR
    sport: 'ALL',
    level: 'ALL',
    state: 'ALL',
    status: 'ALL',
    feeMode: 'ALL', // ALL | GLOBAL | EVENT | DISABLED (organizer fee mode)
    studentFee: 'ALL', // ALL | ENABLED | DISABLED (admin-created events)
    overridesOnly: false, // show only events overriding global settings
    dateRange: 'ALL', // ALL | 7D | 30D | 90D
    sort: 'CREATED_DESC' // CREATED_DESC | CREATED_ASC | NAME_ASC | NAME_DESC | PARTICIPANTS_DESC | FEE_DESC
  });

  const onFilterChange = (key, value) => {
    setEventFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setEventFilters({
      search: '',
      eventType: 'ALL',
      sport: 'ALL',
      level: 'ALL',
      state: 'ALL',
      status: 'ALL',
      feeMode: 'ALL',
      studentFee: 'ALL',
      overridesOnly: false,
      dateRange: 'ALL',
      sort: 'CREATED_DESC'
    });
  };

  // UI label helper: keep backend values (GLOBAL/EVENT/DISABLED) but display clearer labels.
  const displayOrganizerFeeMode = (mode) => {
    const m = String(mode || '').toUpperCase();
    if (m === 'GLOBAL') return 'COORDINATOR_FEE';
    return m || 'GLOBAL';
  };

  const uniqueSports = useMemo(() => {
    const set = new Set((events || []).map(e => (e.sport || '').toString().trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set((events || []).map(e => (e.status || '').toString().trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const uniqueLevels = useMemo(() => {
    const set = new Set((events || []).map(e => (e.level || '').toString().trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const uniqueStates = useMemo(() => {
    const set = new Set((events || []).map(e => (e.state || '').toString().trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const q = (eventFilters.search || '').trim().toLowerCase();
    const rangeCutoff = (() => {
      if (eventFilters.dateRange === '7D') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (eventFilters.dateRange === '30D') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (eventFilters.dateRange === '90D') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return null;
    })();

    const matches = (e) => {
      const isAdminCreated = !!(e.isAdminCreated || e.createdByAdmin);
      const feeMode = (e.feeMode || '').toString().toUpperCase();

      // Search
      if (q) {
        const hay = [
          e.name,
          e.uniqueId,
          e.sport,
          e.status,
          e.coach?.name,
          e.venue,
          e.city,
          e.state
        ]
          .filter(Boolean)
          .map(x => x.toString().toLowerCase())
          .join(' | ');
        if (!hay.includes(q)) return false;
      }

      // Event Type
      if (eventFilters.eventType === 'ADMIN' && !isAdminCreated) return false;
      if (eventFilters.eventType === 'COORDINATOR' && isAdminCreated) return false;

      // Sport
      if (eventFilters.sport !== 'ALL') {
        if ((e.sport || '').toString() !== eventFilters.sport) return false;
      }

      // Level
      if (eventFilters.level !== 'ALL') {
        if ((e.level || '').toString().toUpperCase() !== eventFilters.level) return false;
      }

      // State
      if (eventFilters.state !== 'ALL') {
        if ((e.state || '').toString().toLowerCase() !== eventFilters.state.toLowerCase()) return false;
      }

      // Status
      if (eventFilters.status !== 'ALL') {
        if ((e.status || '').toString().toUpperCase() !== eventFilters.status) return false;
      }

      // Fee Mode (Organizer): only meaningful for coordinator-created events
      if (eventFilters.feeMode !== 'ALL') {
        if (isAdminCreated) return false;
        if ((e.feeMode || '').toString().toUpperCase() !== eventFilters.feeMode) return false;
      }

      // Student fee enabled: only meaningful for admin-created events
      if (eventFilters.studentFee !== 'ALL') {
        if (!isAdminCreated) return false;
        const enabled = !!e.studentFeeEnabled;
        if (eventFilters.studentFee === 'ENABLED' && !enabled) return false;
        if (eventFilters.studentFee === 'DISABLED' && enabled) return false;
      }

      // Overrides only:
      // - coordinator-created: feeMode EVENT indicates per-event override
      // - admin-created: studentFeeEnabled indicates event-level override (beyond global default)
      if (eventFilters.overridesOnly) {
        if (isAdminCreated) {
          if (!e.studentFeeEnabled) return false;
        } else {
          if (feeMode !== 'EVENT') return false;
        }
      }

      // Date range (createdAt)
      if (rangeCutoff) {
        const created = e.createdAt ? new Date(e.createdAt) : null;
        if (!created || created < rangeCutoff) return false;
      }

      return true;
    };

    const out = (events || []).filter(matches);

    // Sort
    const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const sortKey = eventFilters.sort;
    out.sort((a, b) => {
      if (sortKey === 'CREATED_ASC') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortKey === 'CREATED_DESC') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortKey === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '');
      if (sortKey === 'NAME_DESC') return (b.name || '').localeCompare(a.name || '');
      if (sortKey === 'PARTICIPANTS_DESC') return toNumber(b.currentParticipants) - toNumber(a.currentParticipants);
      if (sortKey === 'FEE_DESC') return toNumber(b.calculatedFee) - toNumber(a.calculatedFee);
      return 0;
    });

    return out;
  }, [events, eventFilters]);

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

        {/* Filters */}
        <div className="mb-5 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="flex-1 lg:flex-[2] min-w-[260px] lg:min-w-[420px]">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
              <input
                value={eventFilters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                placeholder="Search by event name, coach, sport, status..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Event Type</label>
              <select
                value={eventFilters.eventType}
                onChange={(e) => onFilterChange('eventType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="ALL">All</option>
                <option value="ADMIN">Admin-created (Student Fee)</option>
                <option value="COORDINATOR">Coordinator-created</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sport</label>
              <select
                value={eventFilters.sport}
                onChange={(e) => onFilterChange('sport', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="ALL">All</option>
                {uniqueSports.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Level</label>
              <select
                value={eventFilters.level}
                onChange={(e) => onFilterChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="ALL">All</option>
                {uniqueLevels.map((l) => (
                  <option key={l} value={l.toUpperCase()}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
              <select
                value={eventFilters.state}
                onChange={(e) => onFilterChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="ALL">All</option>
                {uniqueStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select
                value={eventFilters.status}
                onChange={(e) => onFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="ALL">All</option>
                {uniqueStatuses.map((s) => (
                  <option key={s} value={s.toUpperCase()}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fee Mode (Organizer)</label>
              <select
                value={eventFilters.feeMode}
                onChange={(e) => onFilterChange('feeMode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                title="Applies to coordinator-created events only"
              >
                <option value="ALL">All</option>
                <option value="GLOBAL">COORDINATOR_FEE</option>
                <option value="EVENT">EVENT</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Student Fee</label>
              <select
                value={eventFilters.studentFee}
                onChange={(e) => onFilterChange('studentFee', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                title="Applies to admin-created events only"
              >
                <option value="ALL">All</option>
                <option value="ENABLED">Enabled</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={!!eventFilters.overridesOnly}
                  onChange={(e) => onFilterChange('overridesOnly', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                Overrides only
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Created</label>
              <select
                value={eventFilters.dateRange}
                onChange={(e) => onFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="ALL">All time</option>
                <option value="7D">Last 7 days</option>
                <option value="30D">Last 30 days</option>
                <option value="90D">Last 90 days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sort</label>
              <select
                value={eventFilters.sort}
                onChange={(e) => onFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="CREATED_DESC">Newest</option>
                <option value="CREATED_ASC">Oldest</option>
                <option value="NAME_ASC">Name (A → Z)</option>
                <option value="NAME_DESC">Name (Z → A)</option>
                <option value="PARTICIPANTS_DESC">Participants (high → low)</option>
                <option value="FEE_DESC">Organizer total (high → low)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                title="Clear filters"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-600 flex items-center justify-between flex-wrap gap-2">
            <div>
              Showing <span className="font-semibold">{filteredEvents.length}</span> of{' '}
              <span className="font-semibold">{events.length}</span> events
            </div>
            {(eventFilters.feeMode !== 'ALL' || eventFilters.studentFee !== 'ALL') && (
              <div className="text-gray-500">
                Note: Fee Mode filter applies to coordinator-created events; Student Fee filter applies to admin-created events.
              </div>
            )}
          </div>
        </div>

        {eventsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No events match your filters.
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
                    <div className="flex items-center gap-2">
                      <span>Fee Mode (Organizer)</span>
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold cursor-help"
                        title="COORDINATOR_FEE uses Global Payment Settings (per-student base charge / default event fee). EVENT uses this event’s organizer fees. DISABLED blocks organizer payments."
                        aria-label="Fee mode help"
                      >
                        i
                      </span>
                    </div>
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
                {filteredEvents.map((event) => (
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
                      {/* Show live value during edit; for admin-created events show Student-only badge */}
                      {event.isAdminCreated || event.createdByAdmin ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          STUDENT_FEE
                        </span>
                      ) : editingEventId === event.id ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          (eventEditForm.feeMode === 'GLOBAL') ? 'bg-blue-100 text-blue-800' :
                          (eventEditForm.feeMode === 'EVENT') ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {displayOrganizerFeeMode(eventEditForm.feeMode)}
                        </span>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.feeMode === 'GLOBAL' ? 'bg-blue-100 text-blue-800' :
                          event.feeMode === 'EVENT' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {displayOrganizerFeeMode(event.feeMode)}
                        </span>
                      )}
                    </td>
                    {editingEventId === event.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(event.isAdminCreated || event.createdByAdmin) ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700">
                              Student fee only
                            </span>
                          ) : (
                            <div>
                              <select
                                name="feeMode"
                                value={eventEditForm.feeMode}
                                onChange={handleEventFeeChange}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="GLOBAL">COORDINATOR_FEE</option>
                                <option value="EVENT">EVENT</option>
                                <option value="DISABLED">DISABLED</option>
                              </select>
                              <div className="mt-1 text-[11px] text-gray-500">
                                COORDINATOR_FEE = global settings, EVENT = per-event override
                              </div>
                            </div>
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
                          {(event.isAdminCreated || event.createdByAdmin) ? (
                            <span className="text-xs text-gray-400">N/A</span>
                          ) : (
                            event.eventFee || 0
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.isAdminCreated || event.createdByAdmin
                            ? <span className="text-gray-400 text-xs">N/A</span>
                            : (event.coordinatorFee || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(event.isAdminCreated || event.createdByAdmin)
                            ? <span className="text-xs text-gray-400">N/A</span>
                            : `₹${event.calculatedFee?.toFixed(2) || '0.00'}`}
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
