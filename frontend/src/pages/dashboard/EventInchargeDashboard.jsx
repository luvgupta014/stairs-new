import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEventInchargeAssignedEvents, shareEventViaEmail } from '../../api';
import { FaCertificate, FaEnvelope, FaFilter, FaLink, FaSearch, FaShareAlt, FaTrophy, FaUsers } from 'react-icons/fa';

const EventInchargeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assigned, setAssigned] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [onlyPoc, setOnlyPoc] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTarget, setShareTarget] = useState(null); // { eventId, uniqueId, name }
  const [shareEmails, setShareEmails] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');

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

  const formatDateShort = (d) => {
    try {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const computeTimingStatus = (ev) => {
    const now = new Date();
    const start = ev?.startDate ? new Date(ev.startDate) : null;
    const end = ev?.endDate ? new Date(ev.endDate) : null;
    if (start && now < start) return { key: 'UPCOMING', label: 'Upcoming', cls: 'bg-blue-100 text-blue-800' };
    if (start && end && now >= start && now <= end) return { key: 'ONGOING', label: 'Ongoing', cls: 'bg-emerald-100 text-emerald-800' };
    if (end && now > end) return { key: 'COMPLETED', label: 'Completed', cls: 'bg-gray-100 text-gray-700' };
    // Fallback when dates missing
    return { key: 'SCHEDULED', label: 'Scheduled', cls: 'bg-gray-100 text-gray-700' };
  };

  const getLevelBadge = (lvlRaw) => {
    const lvl = (lvlRaw || 'DISTRICT').toString().toUpperCase();
    const label = lvl === 'DISTRICT' ? 'District'
      : lvl === 'STATE' ? 'State'
      : lvl === 'NATIONAL' ? 'National'
      : lvl === 'SCHOOL' ? 'School'
      : lvl;
    const cls = lvl === 'DISTRICT' ? 'bg-green-100 text-green-800'
      : lvl === 'STATE' ? 'bg-blue-100 text-blue-800'
      : lvl === 'NATIONAL' ? 'bg-purple-100 text-purple-800'
      : lvl === 'SCHOOL' ? 'bg-amber-100 text-amber-800'
      : 'bg-gray-100 text-gray-800';
    return (
      <span className={`${cls} px-2 py-1 rounded text-xs font-semibold`}>
        {label}
      </span>
    );
  };

  const enriched = useMemo(() => {
    const q = (query || '').trim().toLowerCase();

    const rows = (assigned || []).map((a) => {
      const ev = a.event || {};
      const p = a.permissionOverride || {};
      const timing = computeTimingStatus(ev);
      const searchable = [
        ev.name,
        ev.uniqueId,
        ev.sport,
        ev.venue,
        ev.city,
        ev.state
      ].filter(Boolean).join(' ').toLowerCase();

      const canStudentMgmt = !!p.studentManagement;
      const canResults = !!p.resultUpload;
      const canCertificates = !!p.certificateManagement;
      const canFees = !!p.feeManagement;

      const enabledCount = [canStudentMgmt, canResults, canCertificates, canFees].filter(Boolean).length;
      const missing = [
        !canStudentMgmt ? 'Student Management' : null,
        !canResults ? 'Results' : null,
        !canCertificates ? 'Certificates' : null,
        !canFees ? 'Fees' : null
      ].filter(Boolean);

      return {
        assignment: a,
        event: ev,
        perms: p,
        timing,
        searchable,
        canStudentMgmt,
        canResults,
        canCertificates,
        canFees,
        enabledCount,
        missing
      };
    });

    const filtered = rows.filter((r) => {
      if (onlyPoc && !r.assignment?.isPointOfContact) return false;
      if (!q) return true;
      return r.searchable.includes(q);
    });

    const orderKey = (timingKey) => (timingKey === 'UPCOMING' ? 0 : timingKey === 'ONGOING' ? 1 : 2);
    filtered.sort((a, b) => {
      const ak = orderKey(a.timing.key);
      const bk = orderKey(b.timing.key);
      if (ak !== bk) return ak - bk;
      const as = a.event?.startDate ? new Date(a.event.startDate).getTime() : 0;
      const bs = b.event?.startDate ? new Date(b.event.startDate).getTime() : 0;
      return as - bs;
    });

    return filtered;
  }, [assigned, query, onlyPoc]);

  const stats = useMemo(() => {
    const total = assigned.length;
    const pocCount = assigned.filter((a) => a.isPointOfContact).length;
    const upcomingCount = enriched.filter((r) => r.timing.key === 'UPCOMING').length;
    const totalEnabled = enriched.reduce((sum, r) => sum + (r.enabledCount || 0), 0);
    const maxPossible = enriched.length * 4;
    const coveragePct = maxPossible ? Math.round((totalEnabled / maxPossible) * 100) : 0;
    return { total, pocCount, upcomingCount, coveragePct };
  }, [assigned, enriched]);

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

  const getShareableLink = () => {
    if (!shareTarget?.uniqueId) return '';
    return `${window.location.origin}/event/${shareTarget.uniqueId}`;
  };

  const openShare = ({ eventId, uniqueId, name }) => {
    setShareTarget({ eventId, uniqueId, name });
    setShareEmails('');
    setShareError('');
    setShareSuccess('');
    setShowShareModal(true);
  };

  const closeShare = () => {
    setShowShareModal(false);
    setShareTarget(null);
    setShareEmails('');
    setShareError('');
    setShareSuccess('');
    setShareLoading(false);
  };

  const copyLinkToClipboard = async () => {
    try {
      const link = getShareableLink();
      if (!link) return;
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = link;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setShareSuccess('Link copied to clipboard!');
      setShareError('');
      setTimeout(() => setShareSuccess(''), 2000);
    } catch (err) {
      setShareError(err?.message || 'Failed to copy link. Please copy manually.');
      setShareSuccess('');
    }
  };

  const handleShareViaEmail = async () => {
    try {
      if (!shareTarget?.eventId) return;
      if (!shareEmails.trim()) {
        setShareError('Please enter at least one email address.');
        setShareSuccess('');
        return;
      }

      const emailList = shareEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      if (emailList.length === 0) {
        setShareError('Please enter valid email address(es).');
        setShareSuccess('');
        return;
      }

      setShareLoading(true);
      setShareError('');
      setShareSuccess('');

      const response = await shareEventViaEmail(shareTarget.eventId, emailList);
      if (response?.success) {
        setShareSuccess(response?.message || `Event shared successfully. ${emailList.length} email(s) sent.`);
        setShareEmails('');
      } else {
        setShareError(response?.message || 'Failed to share event via email.');
      }
    } catch (err) {
      setShareError(err?.response?.data?.message || err?.message || 'Failed to share event via email.');
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="rounded-2xl overflow-hidden shadow-lg border bg-white">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Event Incharge Dashboard</h1>
              <p className="text-indigo-100 text-sm mt-1">
                Welcome <span className="font-semibold">{displayName}</span>. Here are your assigned events and tools.
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
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500 mt-1">{stats.upcomingCount} upcoming</div>
            </div>
            <div className="p-4 rounded-xl border bg-gray-50">
              <div className="text-xs text-gray-500">Point of contact</div>
              <div className="text-2xl font-bold text-gray-900">{stats.pocCount ? 'Yes' : 'No'}</div>
              <div className="text-xs text-gray-500 mt-1">{stats.pocCount} event(s)</div>
            </div>
            <div className="p-4 rounded-xl border bg-gray-50">
              <div className="text-xs text-gray-500">Access coverage</div>
              <div className="text-2xl font-bold text-gray-900">{stats.coveragePct}%</div>
              <div className="text-xs text-gray-500 mt-1">Across students/results/certs/fees</div>
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
            <Link to="/events?portal=incharge" className="text-sm text-indigo-700 hover:text-indigo-900 font-medium">
              Browse all events
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Search</label>
              <div className="mt-1 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by event name, sport, city, state, or event ID…"
                  className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white w-full">
                <FaFilter className="text-gray-400" />
                <label className="text-sm text-gray-700 flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyPoc}
                    onChange={(e) => setOnlyPoc(e.target.checked)}
                    className="rounded"
                    disabled={loading}
                  />
                  POC only
                </label>
              </div>
            </div>
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
          ) : enriched.length === 0 ? (
            <div className="p-6 rounded-xl border bg-gray-50">
              <div className="font-semibold text-gray-900">{assigned.length ? 'No matching events' : 'No events assigned yet'}</div>
              <div className="text-sm text-gray-600 mt-1">
                {assigned.length
                  ? 'Try adjusting your search/filter.'
                  : 'Ask Admin to assign an event and grant the required permissions.'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enriched.map((row) => {
                const a = row.assignment;
                const ev = row.event || {};
                const p = row.perms || {};
                const chips = [
                  row.canResults ? 'Result Upload' : null,
                  row.canStudentMgmt ? 'Student Management' : null,
                  row.canCertificates ? 'Certificates' : null,
                  row.canFees ? 'Fees' : null
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
                          <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full ${row.timing.cls}`}>
                            {row.timing.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {ev.sport ? <span className="font-medium">{ev.sport}</span> : null}
                          {ev.level ? <> • {getLevelBadge(ev.level)}</> : null}
                          {ev.venue || ev.city || ev.state ? (
                            <> • {[ev.venue, ev.city, ev.state].filter(Boolean).join(', ')}</>
                          ) : null}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="font-medium">Dates:</span> {formatDateShort(ev.startDate)} → {formatDateShort(ev.endDate)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {ev.uniqueId ? <>Event ID: <span className="font-mono">{ev.uniqueId}</span></> : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={() => openShare({ eventId: a.eventId, uniqueId: ev.uniqueId, name: ev.name })}
                          disabled={!ev?.uniqueId}
                          className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold border ${
                            ev?.uniqueId
                              ? 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          }`}
                          title={ev?.uniqueId ? 'Share public registration link' : 'Share link unavailable (missing uniqueId)'}
                        >
                          <FaShareAlt className="w-4 h-4 mr-2" />
                          Share
                        </button>
                        <Link
                          to={`/events/${a.eventId}`}
                          className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                        >
                          Open
                        </Link>
                        {row.missing?.length ? (
                          <div className="text-[11px] text-gray-500 text-right">
                            Missing: <span className="font-semibold">{row.missing.join(', ')}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-700 text-right font-semibold">All tools enabled</div>
                        )}
                      </div>
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

                    {/* Quick actions */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => row.canStudentMgmt && navigate(`/events/${a.eventId}/participants`, { state: { event: ev } })}
                        disabled={!row.canStudentMgmt}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border ${
                          row.canStudentMgmt
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                        title={row.canStudentMgmt ? 'Manage participants' : 'Student Management permission not granted'}
                      >
                        <FaUsers className="w-4 h-4" />
                        Students
                      </button>
                      <button
                        type="button"
                        onClick={() => row.canResults && navigate(`/events/${a.eventId}/results`, { state: { event: ev } })}
                        disabled={!row.canResults}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border ${
                          row.canResults
                            ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                        title={row.canResults ? 'Upload/manage results' : 'Result Upload permission not granted'}
                      >
                        <FaTrophy className="w-4 h-4" />
                        Results
                      </button>
                      <button
                        type="button"
                        onClick={() => row.canCertificates && navigate(`/events/${a.eventId}/certificates`, { state: { event: ev } })}
                        disabled={!row.canCertificates}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border ${
                          row.canCertificates
                            ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                        title={row.canCertificates ? 'Generate/issue certificates' : 'Certificate Management permission not granted'}
                      >
                        <FaCertificate className="w-4 h-4" />
                        Certificates
                      </button>
                      <button
                        type="button"
                        onClick={() => row.canFees && navigate(`/events/${a.eventId}`)}
                        disabled={!row.canFees}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border ${
                          row.canFees
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                        title={row.canFees ? 'Open event and manage fee settings' : 'Fee Management permission not granted'}
                      >
                        ₹ Fees
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Share Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900">Share Event</h2>
                {shareTarget?.name ? (
                  <div className="text-sm text-gray-600 truncate">{shareTarget.name}</div>
                ) : null}
              </div>
              <button onClick={closeShare} className="text-gray-400 hover:text-gray-600" aria-label="Close share modal">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {getShareableLink() ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Public Event Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={getShareableLink()}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                    />
                    <button
                      onClick={copyLinkToClipboard}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium flex items-center"
                      type="button"
                    >
                      <FaLink className="w-4 h-4 mr-2" />
                      Copy
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share via Email (comma separated)
                  </label>
                  <textarea
                    value={shareEmails}
                    onChange={(e) => setShareEmails(e.target.value)}
                    placeholder="example@email.com, another@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                  />
                </div>

                {shareError ? (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {shareError}
                  </div>
                ) : null}

                {shareSuccess ? (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                    {shareSuccess}
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button
                    onClick={handleShareViaEmail}
                    disabled={shareLoading || !shareEmails.trim()}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    type="button"
                  >
                    <FaEnvelope className="w-4 h-4 mr-2" />
                    {shareLoading ? 'Sending…' : 'Send Email'}
                  </button>
                  <button
                    onClick={closeShare}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                Share link is unavailable for this event.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventInchargeDashboard;

