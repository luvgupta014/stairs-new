import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { bulkAddEventParticipants, bulkUploadEventParticipantsFile, getEventParticipants } from '../../api';
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
    status: ''
  });
  const [forbidden, setForbidden] = useState(false);
  
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

  const exportParticipants = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Phone,Sport,Level,Registration Date,Status\n"
      + participants.map(p => 
          `"${p.student.name}","${p.student.user.email}","${p.student.user.phone}","${p.student.sport}","${p.student.level}","${new Date(p.registeredAt).toLocaleDateString()}","${p.status}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${event?.name || 'event'}_participants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = !filters.search || 
      participant.student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      participant.student.user.email.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || participant.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

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
                {event?.name || 'Event Participants'}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>📅 {event && new Date(event.startDate).toLocaleDateString()}</span>
                <span>📍 {event?.venue}</span>
                <span>🏃‍♂️ {event?.sport}</span>
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
                onClick={exportParticipants}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
              >
                <FaDownload className="mr-2" />
                Export List
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {filteredParticipants.length} of {participants.length} participants
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
        ) : filteredParticipants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Participant</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Contact</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Details</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Registration</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant, index) => (
                  <tr key={participant.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {participant.student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{participant.student.name}</div>
                          <div className="text-sm text-gray-500">{participant.student.institute || 'Independent'}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaEnvelope className="mr-2 text-gray-400" />
                          {participant.student.user.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FaPhone className="mr-2 text-gray-400" />
                          {participant.student.user.phone}
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">Sport:</span> {participant.student.sport}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Level:</span> {participant.student.level}
                        </div>
                      </div>
                    </td>
                    
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
                          onClick={() => window.open(`mailto:${participant.student.user.email}`, '_blank')}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Email
                        </button>
                        <button
                          onClick={() => window.open(`tel:${participant.student.user.phone}`, '_blank')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
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
    </div>
  );
};

export default EventParticipants;