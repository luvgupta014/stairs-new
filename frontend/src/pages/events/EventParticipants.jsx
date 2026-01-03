import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { bulkAddEventParticipants, bulkUploadEventParticipantsFile, getEventParticipants, getEventStudentProfile } from '../../api';
import Spinner from '../../components/Spinner';
import BackButton from '../../components/BackButton';
import { FaDownload, FaEnvelope, FaPhone, FaUser } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGateNotice from '../../components/PermissionGateNotice';

const EventParticipants = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [eventMeta, setEventMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [singleId, setSingleId] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkFileName, setBulkFileName] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    missingTournamentOnly: false
  });
  const [forbidden, setForbidden] = useState(false);
  const [showTournamentCols, setShowTournamentCols] = useState(true);
  const [sortBy, setSortBy] = useState('registeredAt');
  const [sortDir, setSortDir] = useState('desc'); // asc | desc
  const [profileModal, setProfileModal] = useState({ isOpen: false, loading: false, error: '', data: null });
  
  const event = location.state?.event;

  useEffect(() => {
    loadParticipants();
  }, [eventId]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      setForbidden(false);
      const response = await getEventParticipants(eventId);
      
      if (response.success) {
        setParticipants(response.data.participants || []);
        setEventMeta(response.data.event || null);
      } else {
        throw new Error(response.message || 'Failed to load participants');
      }
    } catch (err) {
      console.error('Failed to load participants:', err);
      const status = err?.statusCode || err?.status || err?.response?.status;
      if ((status === 401 || status === 403) && user?.role === 'EVENT_INCHARGE') {
        setForbidden(true);
        setError('');
      } else {
        setError(err?.message || 'Failed to load participants.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    try {
      setBulkSubmitting(true);
      setBulkMsg('');
      setError('');

      const identifiers = bulkText
        .split(/[\n,]+/g)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 300);

      if (identifiers.length === 0) {
        setBulkMsg('Please paste at least one Student ID / email / phone / UID.');
        return;
      }

      const res = await bulkAddEventParticipants(eventId, identifiers);
      if (res?.success) {
        const d = res.data || {};
        const failed = Array.isArray(d.failed) ? d.failed : [];
        const failedPreview = failed.slice(0, 3).map(f => `${f.identifier}: ${f.reason}`).join(' | ');
        setBulkMsg(`Added: ${d.registered || 0}, Failed: ${d.failedCount || 0}${failedPreview ? ` (${failedPreview}${failed.length > 3 ? ' ...' : ''})` : ''}`);
        await loadParticipants();
      } else {
        setBulkMsg(res?.message || 'Failed to add students.');
      }
    } catch (e) {
      setBulkMsg(e?.message || 'Failed to add students.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleBulkFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setBulkFile(null);
      setBulkFileName('');
      return;
    }
    const name = (f.name || '').toLowerCase();
    const ok = name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls');
    if (!ok) {
      setBulkMsg('Invalid file type. Please upload CSV / XLSX / XLS.');
      setBulkFile(null);
      setBulkFileName('');
      return;
    }
    setBulkMsg('');
    setBulkFile(f);
    setBulkFileName(f.name || 'upload');
  };

  const handleBulkFileUpload = async () => {
    try {
      if (!bulkFile) {
        setBulkMsg('Please choose a CSV/XLSX/XLS file first.');
        return;
      }
      setBulkSubmitting(true);
      setBulkMsg('');
      setError('');

      const res = await bulkUploadEventParticipantsFile(eventId, bulkFile);
      if (res?.success) {
        const d = res.data || {};
        const failed = Array.isArray(d.failed) ? d.failed : [];
        const failedPreview = failed.slice(0, 3).map(f => `${f.identifier}: ${f.reason}`).join(' | ');
        setBulkMsg(`Uploaded "${d.filename || bulkFileName}". Added: ${d.registered || 0}, Failed: ${d.failedCount || 0}${failedPreview ? ` (${failedPreview}${failed.length > 3 ? ' ...' : ''})` : ''}`);
        setBulkFile(null);
        setBulkFileName('');
        await loadParticipants();
      } else {
        setBulkMsg(res?.message || 'Failed to upload file.');
      }
    } catch (e) {
      setBulkMsg(e?.message || 'Failed to upload file.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleSingleAdd = async () => {
    try {
      const id = String(singleId || '').trim();
      if (!id) {
        setBulkMsg('Please enter a Student ID / email / phone / UID.');
        return;
      }

      setBulkSubmitting(true);
      setBulkMsg('');
      setError('');
      const res = await bulkAddEventParticipants(eventId, [id]);
      if (res?.success) {
        const d = res.data || {};
        const failed = Array.isArray(d.failed) ? d.failed : [];
        if (d.registered > 0) {
          setBulkMsg('Student added successfully.');
          setSingleId('');
          await loadParticipants();
        } else if (failed.length) {
          setBulkMsg(`${failed[0].identifier}: ${failed[0].reason || 'Failed to add'}`);
        } else {
          setBulkMsg('Failed to add student.');
        }
      } else {
        setBulkMsg(res?.message || 'Failed to add student.');
      }
    } catch (e) {
      setBulkMsg(e?.message || 'Failed to add student.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const toCsvValue = (val) => {
    const s = val === null || val === undefined ? '' : String(val);
    const escaped = s.replaceAll('"', '""');
    return `"${escaped}"`;
  };

  const downloadCsv = (filename, rows) => {
    // Add UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    const content = bom + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportParticipants = (rowsToExport) => {
    const evName = eventMeta?.name || event?.name || 'event';
    const dateTag = new Date().toISOString().split('T')[0];
    const filename = `${evName}_students_${dateTag}.csv`;

    const headers = [
      'Student UID',
      'Student Name',
      'Selected Category',
      'Status',
      'Registered At',
      'Account Email',
      'Account Phone',
      'Sport',
      'Level',
      'Alias',
      'Tournament Email',
      'Tournament Phone',
      'PlayStation ID',
      'EA ID',
      'Instagram Handle'
    ];

    const rows = [headers.map(toCsvValue)];
    rowsToExport.forEach((p) => {
      const student = p?.student || {};
      const userObj = student?.user || {};
      const reg = p?.registrationContact || {};

      // Prefer registration snapshot for tournament details; fall back to profile optional fields if present
      const psn = reg.playstationId || student.playstationId || '';
      const ea = reg.eaId || student.eaId || '';
      const ig = reg.instagramHandle || student.instagramHandle || '';

      rows.push([
        toCsvValue(userObj.uniqueId || ''),
        toCsvValue(student.name || ''),
        toCsvValue(p?.selectedCategory || ''),
        toCsvValue(p?.status || ''),
        toCsvValue(p?.registeredAt ? new Date(p.registeredAt).toISOString() : ''),
        toCsvValue(userObj.email || ''),
        toCsvValue(userObj.phone || ''),
        toCsvValue(student.sport || ''),
        toCsvValue(student.level || ''),
        toCsvValue(student.alias || ''),
        toCsvValue(reg.email || ''),
        toCsvValue(reg.phone || ''),
        toCsvValue(psn || ''),
        toCsvValue(ea || ''),
        toCsvValue(ig || '')
      ]);
    });

    downloadCsv(filename, rows);
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = !filters.search || 
      (participant?.student?.name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
      (participant?.student?.user?.email || '').toLowerCase().includes(filters.search.toLowerCase()) ||
      (participant?.student?.user?.phone || '').toLowerCase().includes(filters.search.toLowerCase()) ||
      (participant?.student?.user?.uniqueId || '').toLowerCase().includes(filters.search.toLowerCase()) ||
      (participant?.selectedCategory || '').toLowerCase().includes(filters.search.toLowerCase()) ||
      (participant?.registrationContact?.email || '').toLowerCase().includes(filters.search.toLowerCase()) ||
      (participant?.registrationContact?.phone || '').toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || participant.status === filters.status;
    const matchesCategory = !filters.category || (participant?.selectedCategory || '') === filters.category;

    const missingTournament = isOnlineLike
      ? (!participant?.registrationContact?.email || !participant?.registrationContact?.phone)
      : false;
    const matchesMissingTournament = !filters.missingTournamentOnly || missingTournament;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesMissingTournament;
  });

  const isOnlineLike = (() => {
    const fmt = (eventMeta?.eventFormat || event?.eventFormat || '').toString().toUpperCase();
    return fmt === 'ONLINE' || fmt === 'HYBRID';
  })();

  const openStudentProfile = async (participant) => {
    try {
      const sid = participant?.student?.id;
      if (!sid) return;
      setProfileModal({ isOpen: true, loading: true, error: '', data: null });
      const res = await getEventStudentProfile(eventId, sid);
      if (res?.success) {
        setProfileModal({ isOpen: true, loading: false, error: '', data: res.data });
      } else {
        setProfileModal({ isOpen: true, loading: false, error: res?.message || 'Failed to load profile.', data: null });
      }
    } catch (e) {
      setProfileModal({ isOpen: true, loading: false, error: e?.message || 'Failed to load profile.', data: null });
    }
  };

  const categoryOptions = useMemo(() => {
    const set = new Set();
    participants.forEach(p => {
      const c = (p?.selectedCategory || '').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [participants]);

  const sortedParticipants = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const list = [...filteredParticipants];
    const toLower = (v) => (v === null || v === undefined ? '' : String(v)).toLowerCase();
    list.sort((a, b) => {
      if (sortBy === 'registeredAt') {
        const da = a?.registeredAt ? new Date(a.registeredAt).getTime() : 0;
        const db = b?.registeredAt ? new Date(b.registeredAt).getTime() : 0;
        return (da - db) * dir;
      }
      if (sortBy === 'name') {
        return toLower(a?.student?.name).localeCompare(toLower(b?.student?.name)) * dir;
      }
      if (sortBy === 'uid') {
        return toLower(a?.student?.user?.uniqueId).localeCompare(toLower(b?.student?.user?.uniqueId)) * dir;
      }
      if (sortBy === 'status') {
        return toLower(a?.status).localeCompare(toLower(b?.status)) * dir;
      }
      if (sortBy === 'category') {
        return toLower(a?.selectedCategory).localeCompare(toLower(b?.selectedCategory)) * dir;
      }
      // Fallback
      return 0;
    });
    return list;
  }, [filteredParticipants, sortBy, sortDir]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <PermissionGateNotice
        title="Student management access required"
        description="This page is available only when you have Student Management permission for this event."
        requiredLabel="Student Management"
        eventLink={`/events/${eventId}`}
        secondaryAction={{
          label: 'Email Support',
          href: 'mailto:info@stairs.org.in?subject=Permission%20Request%20-%20Student%20Management'
        }}
        primaryAction={{
          label: 'Back to My Events',
          onClick: () => navigate('/dashboard/event_incharge'),
          className: 'bg-indigo-600 hover:bg-indigo-700'
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <BackButton 
            to="/events" 
            label="Back to Events"
            onClick={() => navigate('/events')}
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {eventMeta?.name || event?.name || 'Event Participants'}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>📅 {eventMeta?.startDate ? new Date(eventMeta.startDate).toLocaleDateString() : (event?.startDate ? new Date(event.startDate).toLocaleDateString() : '')}</span>
                <span>📍 {eventMeta?.venue || event?.venue || ''}</span>
                <span>🏃‍♂️ {eventMeta?.sport || event?.sport || ''}</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {user?.role === 'EVENT_INCHARGE' ? (
                <button
                  onClick={() => setBulkOpen(v => !v)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
                >
                  Bulk Add Students
                </button>
              ) : null}
              <button
                onClick={() => exportParticipants(sortedParticipants)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
              >
                <FaDownload className="mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          {bulkOpen ? (
            <div className="mt-4 border-t pt-4">
              <div className="text-sm font-medium text-gray-900 mb-2">Bulk Add Students</div>
              <div className="text-xs text-gray-600 mb-2">
                Paste one per line (or comma-separated). Accepts Student DB ID, Student UID, email, or phone.
              </div>

              <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Upload CSV / Excel</div>
                <div className="text-xs text-gray-600 mb-3">
                  Supported columns: <span className="font-mono">identifier</span>, <span className="font-mono">uniqueId</span>, <span className="font-mono">email</span>, <span className="font-mono">phone</span> (or put values in the first column).
                </div>
                <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleBulkFileSelect}
                    disabled={bulkSubmitting}
                    className="block w-full md:w-auto text-sm"
                  />
                  {bulkFileName ? (
                    <div className="text-xs text-gray-700">
                      Selected: <span className="font-semibold">{bulkFileName}</span>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleBulkFileUpload}
                    disabled={bulkSubmitting || !bulkFile}
                    className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkSubmitting ? 'Uploading...' : 'Upload & Add'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <input
                  value={singleId}
                  onChange={(e) => setSingleId(e.target.value)}
                  className="md:col-span-2 border rounded-md p-3 text-sm"
                  placeholder="Single add: Student UID / email / phone"
                  disabled={bulkSubmitting}
                />
                <button
                  onClick={handleSingleAdd}
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50"
                  type="button"
                  disabled={bulkSubmitting}
                >
                  {bulkSubmitting ? 'Adding...' : 'Add One'}
                </button>
              </div>

              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={4}
                className="w-full border rounded-md p-3 text-sm"
                placeholder={`e.g.\nSTU-UID-123\nstudent@email.com\n9876543210`}
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-sm text-gray-600">{bulkMsg}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setBulkText(''); setBulkMsg(''); setBulkFile(null); setBulkFileName(''); }}
                    className="px-3 py-2 rounded-md border text-sm"
                    type="button"
                    disabled={bulkSubmitting}
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleBulkAdd}
                    className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50"
                    type="button"
                    disabled={bulkSubmitting}
                  >
                    {bulkSubmitting ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Name, UID, email, phone, category..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quick Status</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: '', label: 'All' },
                { key: 'APPROVED', label: 'Approved' },
                { key: 'REGISTERED', label: 'Registered' },
                { key: 'PENDING', label: 'Pending' },
                { key: 'REJECTED', label: 'Rejected' }
              ].map(opt => {
                const active = filters.status === opt.key;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, status: opt.key }))}
                    className={`px-3 py-2 rounded-full text-sm font-semibold border transition ${
                      active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All categories</option>
              {categoryOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="registeredAt">Registration time</option>
                <option value="name">Student name</option>
                <option value="uid">Student UID</option>
                <option value="status">Status</option>
                <option value="category">Category</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-semibold"
                title="Toggle sort order"
              >
                {sortDir === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col justify-end gap-2">
            {isOnlineLike ? (
              <>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={showTournamentCols}
                    onChange={(e) => setShowTournamentCols(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Show tournament columns
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={filters.missingTournamentOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, missingTournamentOnly: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  Missing tournament details only
                </label>
              </>
            ) : (
              <div className="text-xs text-gray-500">Offline event</div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {sortedParticipants.length} of {participants.length} students
              </div>
              <button
                type="button"
                onClick={() => setFilters({ search: '', status: '', category: '', missingTournamentOnly: false })}
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-lg shadow-md">
        {error ? (
          <div className="p-6 text-center">
            <div className="text-red-600 text-lg mb-2">Error</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={loadParticipants}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : sortedParticipants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Participant</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Category</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Account Contact</th>
                  {isOnlineLike && showTournamentCols ? (
                    <>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Tournament Contact</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Tournament IDs</th>
                    </>
                  ) : null}
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Registration</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedParticipants.map((participant, index) => (
                  <tr key={participant.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {(participant?.student?.name || '?').charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{participant?.student?.name || 'Unknown Student'}</div>
                          <div className="text-xs text-gray-500">
                            UID: <span className="font-mono">{participant?.student?.user?.uniqueId || '—'}</span>
                            {participant?.student?.alias ? (
                              <span className="ml-2">• Alias: <span className="font-semibold">{participant.student.alias}</span></span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">
                        {participant?.selectedCategory ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-800 text-xs font-semibold">
                            {participant.selectedCategory}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Not selected</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {participant?.student?.sport ? <span>Sport: <span className="font-semibold">{participant.student.sport}</span></span> : null}
                        {participant?.student?.level ? <span className="ml-2">• Level: <span className="font-semibold">{participant.student.level}</span></span> : null}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaEnvelope className="mr-2 text-gray-400" />
                          {participant?.student?.user?.email || '—'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FaPhone className="mr-2 text-gray-400" />
                          {participant?.student?.user?.phone || '—'}
                        </div>
                      </div>
                    </td>

                    {isOnlineLike && showTournamentCols ? (
                      <>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-700">
                              <FaEnvelope className="mr-2 text-gray-400" />
                              {participant?.registrationContact?.email || '—'}
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <FaPhone className="mr-2 text-gray-400" />
                              {participant?.registrationContact?.phone || '—'}
                            </div>
                          </div>
                          {!participant?.registrationContact?.email || !participant?.registrationContact?.phone ? (
                            <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 inline-block">
                              Missing tournament contact
                            </div>
                          ) : null}
                        </td>
                        <td className="py-4 px-6">
                          <div className="grid grid-cols-1 gap-1 text-sm text-gray-700">
                            <div>
                              <span className="text-xs text-gray-500">PSN:</span>{' '}
                              <span className="font-mono">{participant?.registrationContact?.playstationId || participant?.student?.playstationId || '—'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">EA:</span>{' '}
                              <span className="font-mono">{participant?.registrationContact?.eaId || participant?.student?.eaId || '—'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">IG:</span>{' '}
                              <span className="font-mono">{participant?.registrationContact?.instagramHandle || participant?.student?.instagramHandle || '—'}</span>
                            </div>
                          </div>
                        </td>
                      </>
                    ) : null}
                    
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">
                        {new Date(participant.registeredAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        participant.status === 'REGISTERED' || participant.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        participant.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {participant.status}
                      </span>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openStudentProfile(participant)}
                          className="bg-gray-900 text-white px-3 py-1 rounded text-sm hover:bg-gray-800 transition-colors"
                          disabled={!participant?.student?.id}
                          title={!participant?.student?.id ? 'Student profile not available' : 'View full profile'}
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => participant?.student?.user?.email && window.open(`mailto:${participant.student.user.email}`, '_blank')}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          disabled={!participant?.student?.user?.email}
                        >
                          Email
                        </button>
                        <button
                          onClick={() => participant?.student?.user?.phone && window.open(`tel:${participant.student.user.phone}`, '_blank')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          disabled={!participant?.student?.user?.phone}
                        >
                          Call
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FaUser className="text-gray-400 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Participants Yet</h3>
            <p className="text-gray-600">
              {filters.search || filters.status 
                ? 'No participants match your current filters.' 
                : 'Participants will appear here when students register for this event.'}
            </p>
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      {profileModal.isOpen ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-lg font-bold text-gray-900">Student Profile</div>
                <div className="text-sm text-gray-600 truncate">
                  {profileModal.data?.student?.name || profileModal.data?.student?.user?.uniqueId || '—'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModal({ isOpen: false, loading: false, error: '', data: null })}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {profileModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
                  <span className="ml-3 text-gray-600">Loading profile…</span>
                </div>
              ) : profileModal.error ? (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  {profileModal.error}
                </div>
              ) : (
                (() => {
                  const s = profileModal.data?.student || {};
                  const u = s.user || {};
                  const reg = profileModal.data?.registration || {};
                  const rc = reg.registrationContact || {};
                  const fmt = (profileModal.data?.event?.eventFormat || '').toString().toUpperCase();
                  const onlineLike = fmt === 'ONLINE' || fmt === 'HYBRID';
                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <div className="text-xs text-gray-500 font-semibold">Identity</div>
                          <div className="mt-1 text-base font-bold text-gray-900">{s.name || '—'}</div>
                          <div className="mt-2 text-sm text-gray-700">
                            UID: <span className="font-mono">{u.uniqueId || '—'}</span>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            Email: <span className="font-medium">{u.email || '—'}</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-700">
                            Phone: <span className="font-medium">{u.phone || '—'}</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <div className="text-xs text-gray-500 font-semibold">Event Registration</div>
                          <div className="mt-2 text-sm text-gray-700">
                            Status: <span className="font-semibold">{reg.status || '—'}</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-700">
                            Category: <span className="font-semibold">{reg.selectedCategory || '—'}</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-700">
                            Registered: <span className="font-medium">{reg.createdAt ? new Date(reg.createdAt).toLocaleString('en-IN') : '—'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="text-xs text-gray-500 font-semibold">Athlete Details</div>
                          <div className="mt-2 text-sm text-gray-700">Sport: <span className="font-semibold">{s.sport || '—'}</span></div>
                          <div className="mt-1 text-sm text-gray-700">Level: <span className="font-semibold">{s.level || '—'}</span></div>
                          <div className="mt-1 text-sm text-gray-700">Alias: <span className="font-semibold">{s.alias || '—'}</span></div>
                          <div className="mt-1 text-sm text-gray-700">State/District: <span className="font-semibold">{[s.state, s.district].filter(Boolean).join(', ') || '—'}</span></div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="text-xs text-gray-500 font-semibold">Online/Hybrid IDs</div>
                          {onlineLike ? (
                            <>
                              <div className="mt-2 text-sm text-gray-700">Tournament Email: <span className="font-semibold">{rc.email || '—'}</span></div>
                              <div className="mt-1 text-sm text-gray-700">Tournament Phone: <span className="font-semibold">{rc.phone || '—'}</span></div>
                              <div className="mt-1 text-sm text-gray-700">PSN: <span className="font-mono font-semibold">{rc.playstationId || s.playstationId || '—'}</span></div>
                              <div className="mt-1 text-sm text-gray-700">EA: <span className="font-mono font-semibold">{rc.eaId || s.eaId || '—'}</span></div>
                              <div className="mt-1 text-sm text-gray-700">IG: <span className="font-mono font-semibold">{rc.instagramHandle || s.instagramHandle || '—'}</span></div>
                            </>
                          ) : (
                            <div className="mt-2 text-sm text-gray-600">This event is Offline.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EventParticipants;