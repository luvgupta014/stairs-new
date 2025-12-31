import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAdminEvents, moderateEvent, getEventParticipants, getEventPayments, getGlobalPaymentSettings, updateGlobalPaymentSettings, updateEventAssignments, getEventAssignments, getEventInchargePermissions, updateEventInchargePermissions, getAllUsers, createEventInchargeInvite, getEventInchargeInvites, revokeEventInchargeInvite, resendEventInchargeInvite, adminUpdateEvent, shareEventViaEmail } from '../../api';
import ParticipantsModal from '../../components/ParticipantsModal';
import AdminCertificateIssuance from '../../components/AdminCertificateIssuance';
import CategorySelector from '../../components/CategorySelector';

const AdminEventsManagement = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [moderatingEventId, setModeratingEventId] = useState(null);
  const [error, setError] = useState(null);
  
  // Initialize filters from URL query parameters
  const getInitialFilters = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      status: searchParams.get('status') || '',
      sport: searchParams.get('sport') || '',
      search: searchParams.get('search') || '',
      openEventId: searchParams.get('openEventId') || ''
    };
  };
  
  const [filters, setFilters] = useState(getInitialFilters());

  // Event details modal state
  const [eventDetailsModal, setEventDetailsModal] = useState({
    isOpen: false,
    event: null,
    participants: [],
    payments: [],
    loading: false,
    paymentsLoading: false
  });

  const [modalTab, setModalTab] = useState('details'); // 'details', 'certificates'
  // Admin edit event (in modal)
  const [editEventForm, setEditEventForm] = useState(null);
  const [editEventOriginal, setEditEventOriginal] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [editErr, setEditErr] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [globalPaymentSettings, setGlobalPaymentSettings] = useState({ perStudentBaseCharge: '', defaultEventFee: '' });
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [assignmentForm, setAssignmentForm] = useState({ eventId: '', userId: '', role: 'COORDINATOR' });
  const [assignmentMsg, setAssignmentMsg] = useState('');
  const [assignmentErr, setAssignmentErr] = useState('');
  const [inchargeInviteForm, setInchargeInviteForm] = useState({
    email: '',
    isPointOfContact: false,
    resultUpload: false,
    studentManagement: false,
    certificateManagement: false,
    feeManagement: false
  });
  const [inchargeInvites, setInchargeInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteErr, setInviteErr] = useState('');
  const [inviteDebugLink, setInviteDebugLink] = useState('');
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionForm, setPermissionForm] = useState({
    eventId: '',
    userId: '', // legacy; kept for backwards compatibility with existing UI state resets
    resultUpload: false,
    studentManagement: false,
    certificateManagement: false,
    feeManagement: false
  });
  const [permissionMsg, setPermissionMsg] = useState('');
  const [permissionErr, setPermissionErr] = useState('');
  const [permissionIncharges, setPermissionIncharges] = useState([]); // [{ userId, label, isPointOfContact, permissions, saving, error, msg }]
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userListLimit, setUserListLimit] = useState(200);
  const [assigningEventId, setAssigningEventId] = useState('');
  const [assignmentEventIdSearch, setAssignmentEventIdSearch] = useState('');
  const [permissionEventIdSearch, setPermissionEventIdSearch] = useState('');
  const [userUniqueIdSearch, setUserUniqueIdSearch] = useState('');
  const [userSearchResult, setUserSearchResult] = useState(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [existingAssignments, setExistingAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const assignmentRef = useRef(null);

  // Bulk incharge invites (Admin)
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false);
  const [bulkInviteText, setBulkInviteText] = useState('');
  const [bulkInviting, setBulkInviting] = useState(false);
  const [bulkInviteReport, setBulkInviteReport] = useState(null); // {total, sent, assigned, failed, rows:[]}
  const [bulkInviteRows, setBulkInviteRows] = useState([]); // [{ email, isPointOfContact, permissions }]
  const [bulkInviteFileName, setBulkInviteFileName] = useState('');
  const [bulkInvitePrepared, setBulkInvitePrepared] = useState([]); // verified rows to send
  const [bulkInviteStats, setBulkInviteStats] = useState(null); // { raw, deduped, invalid, ready, duplicatesRemoved }
  const [bulkInviteInvalidEmails, setBulkInviteInvalidEmails] = useState([]); // string[]

  // Share link modal state
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    event: null,
    emails: '',
    loading: false,
    error: '',
    success: ''
  });

  // Cache incharge assignments per event for quick UI rendering
  const [eventIncharges, setEventIncharges] = useState({}); // { [eventId]: [{ userId, name, email, uniqueId, isPointOfContact }] }

  // Toasts (lightweight, no deps)
  const [toasts, setToasts] = useState([]);
  const pushToast = (type, title, message, ttlMs = 4500) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ttlMs);
  };

  const getErrorMessage = (err, fallback = 'Something went wrong.') => {
    // Axios-style error first
    const apiMsg = err?.response?.data?.message || err?.response?.data?.error;
    if (apiMsg) return apiMsg;
    if (err?.message) return err.message;
    if (typeof err === 'string') return err;
    return fallback;
  };

  const toastColors = useMemo(() => ({
    success: 'border-green-200 bg-green-50 text-green-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900'
  }), []);

  // Load analytics when results tab is opened
  useEffect(() => {
    if (modalTab === 'results' && eventDetailsModal.event) {
      loadAnalytics(eventDetailsModal.event.id);
    }
  }, [modalTab, eventDetailsModal.event]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Initialize edit form when opening modal or switching event
  useEffect(() => {
    const ev = eventDetailsModal?.event;
    if (!ev) {
      setEditEventForm(null);
      setEditEventOriginal(null);
      setEditSaving(false);
      setEditMsg('');
      setEditErr('');
      return;
    }
    setEditEventOriginal(ev);
    setEditEventForm({
      name: ev.name || '',
      description: ev.description || '',
      sport: ev.sport || '',
      level: (ev.level || 'DISTRICT'),
      startDate: formatDateForInput(ev.startDate),
      endDate: formatDateForInput(ev.endDate),
      venue: ev.venue || '',
      address: ev.address || '',
      city: ev.city || '',
      state: ev.state || '',
      maxParticipants: ev.maxParticipants ?? '',
      categoriesAvailable: ev.categoriesAvailable || ''
    });
    setEditMsg('');
    setEditErr('');
  }, [eventDetailsModal?.event?.id]);

  const loadAnalytics = async (eventId) => {
    try {
      setAnalyticsLoading(true);
      const { getEventResultAnalytics } = await import('../../api');
      const response = await getEventResultAnalytics(eventId);
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
    fetchGlobalSettings();
    fetchAllUsers();
  }, []);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast('success', 'Copied', 'Link copied to clipboard.');
    } catch (e) {
      // fallback
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        pushToast('success', 'Copied', 'Link copied to clipboard.');
      } catch {
        pushToast('error', 'Copy failed', 'Please copy the link manually.');
      }
    }
  };

  useEffect(() => {
    // Update filters when URL query parameters change
    const searchParams = new URLSearchParams(location.search);
    const newFilters = {
      status: searchParams.get('status') || '',
      sport: searchParams.get('sport') || '',
      search: searchParams.get('search') || ''
    };
    setFilters(newFilters);
  }, [location.search]);

  useEffect(() => {
    applyFilters();
  }, [filters, events]);

  // Deep-link support: /admin/events?openEventId=<eventId>
  useEffect(() => {
    const openEventId = filters?.openEventId;
    if (!openEventId) return;
    if (!events || events.length === 0) return;

    const ev = events.find(e => e.id === openEventId);
    if (ev) {
      handleViewEventDetails(ev);
      // Clear the param so it doesn't keep reopening
      const params = new URLSearchParams(location.search);
      params.delete('openEventId');
      const next = params.toString();
      window.history.replaceState({}, '', next ? `?${next}` : location.pathname);
      setFilters(prev => ({ ...prev, openEventId: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching admin events...');
      const response = await getAdminEvents();
      console.log('📦 Admin events API response:', response);
      
      if (response && response.success) {
        // Handle different response formats
        const eventsData = response.data?.events || response.data || [];
        console.log(`✅ Received ${eventsData.length} events`);
        
        if (Array.isArray(eventsData)) {
          // Enrich events with incharge assignments (for button visibility + name display)
          const settled = await Promise.allSettled(
            eventsData.map(async (ev) => {
              try {
                const aRes = await getEventAssignments(ev.id);
                const assignments = aRes?.success ? (aRes.data || []) : [];
                const incharges = assignments
                  .filter(a => a.role === 'INCHARGE' && a.user?.role === 'EVENT_INCHARGE')
                  .map(a => ({
                    userId: a.userId,
                    name: a.user?.name || '',
                    email: a.user?.email || '',
                    uniqueId: a.user?.uniqueId || '',
                    isPointOfContact: !!a.isPointOfContact
                  }));
                return { ev, incharges };
              } catch {
                return { ev, incharges: [] };
              }
            })
          );

          const nextMap = {};
          const enriched = settled
            .filter(r => r.status === 'fulfilled')
            .map(r => {
              const { ev, incharges } = r.value || {};
              if (ev?.id) nextMap[ev.id] = incharges || [];
              return ev;
            });

          setEventIncharges(nextMap);
          setEvents(enriched);
        } else {
          console.warn('⚠️  Events data is not an array:', eventsData);
          setEvents([]);
          setError('Invalid response format from server');
        }
      } else {
        const errorMsg = response?.message || 'Failed to fetch events';
        console.error('❌ API returned error:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      const errorMessage = getErrorMessage(error, 'Failed to load events. Please try again.');
      setError(errorMessage);
      pushToast('error', 'Failed to load events', errorMessage);
      setEvents([]); // Clear events on error
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const res = await getGlobalPaymentSettings();
      if (res?.success) {
        const data = res.data || {};
        setGlobalPaymentSettings({
          perStudentBaseCharge: data.perStudentBaseCharge ?? '',
          defaultEventFee: data.defaultEventFee ?? '',
          coordinatorSubscriptionFee: data.coordinatorSubscriptionFee ?? ''
        });
      }
    } catch (err) {
      console.error('Error fetching global payment settings:', err);
      setGlobalError(err?.message || 'Failed to load global payment settings');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await getAllUsers({ page: 1, limit: userListLimit });
      if (res?.success) {
        setAllUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users for assignment:', err);
    }
  };

  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userListLimit]);

  const applyFilters = () => {
    let result = [...events];

    if (filters.status) {
      result = result.filter(event => {
        const dynamicStatus = getDynamicEventStatus(event);
        return dynamicStatus === filters.status || event.status === filters.status;
      });
    }

    if (filters.sport) {
      result = result.filter(event => event.sport === filters.sport);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(event =>
        event.name?.toLowerCase().includes(searchLower) ||
        event.title?.toLowerCase().includes(searchLower) ||
        event.coach?.name?.toLowerCase().includes(searchLower) ||
        event.venue?.toLowerCase().includes(searchLower) ||
        event.city?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredEvents(result);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGlobalSettingsSave = async (e) => {
    e.preventDefault();
    try {
      setSavingGlobal(true);
      setGlobalMessage('');
      setGlobalError('');
      const payload = {
        perStudentBaseCharge: Number(globalPaymentSettings.perStudentBaseCharge) || 0,
        defaultEventFee: Number(globalPaymentSettings.defaultEventFee) || 0,
        coordinatorSubscriptionFee: Number(globalPaymentSettings.coordinatorSubscriptionFee) || 0
      };
      const res = await updateGlobalPaymentSettings(payload);
      if (res?.success) {
        setGlobalMessage('Global payment settings saved.');
        pushToast('success', 'Saved', 'Global payment settings updated.');
      } else {
        const msg = res?.message || 'Failed to save global payment settings.';
        setGlobalError(msg);
        pushToast('error', 'Save failed', msg);
      }
    } catch (err) {
      console.error('Error saving global payment settings:', err);
      const msg = getErrorMessage(err, 'Failed to save global payment settings.');
      setGlobalError(msg);
      pushToast('error', 'Save failed', msg);
    } finally {
      setSavingGlobal(false);
    }
  };

  const loadEventAssignments = async (eventId) => {
    if (!eventId) return;
    try {
      setLoadingAssignments(true);
      const res = await getEventAssignments(eventId);
      if (res?.success) {
        setExistingAssignments(res.data || []);
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
      setExistingAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const loadInchargeInvites = async (eventId) => {
    if (!eventId) return;
    try {
      setLoadingInvites(true);
      const res = await getEventInchargeInvites(eventId);
      if (res?.success) setInchargeInvites(res.data || []);
      else setInchargeInvites([]);
    } catch (err) {
      console.error('Error loading incharge invites:', err);
      setInchargeInvites([]);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignmentMsg('');
    setAssignmentErr('');
    
    // Validation
    if (!assignmentForm.eventId) {
      setAssignmentErr('Please select an event.');
      return;
    }
    if (!assignmentForm.userId) {
      setAssignmentErr('Please select a user.');
      return;
    }
    if (!assignmentForm.role) {
      setAssignmentErr('Please select a role.');
      return;
    }

    // Check if this assignment already exists
    const existing = existingAssignments.find(
      a => a.userId === assignmentForm.userId && a.role === assignmentForm.role
    );
    if (existing) {
      setAssignmentErr('This user is already assigned to this event with this role.');
      return;
    }

    try {
      setAssigningEventId(assignmentForm.eventId);
      // Use 'add' mode to add assignment without removing existing ones
      const res = await updateEventAssignments(assignmentForm.eventId, [
        { userId: assignmentForm.userId, role: assignmentForm.role }
      ], 'add');
      if (res?.success) {
        const selectedUser = allUsers.find(u => u.id === assignmentForm.userId);
        const selectedEvent = events.find(e => e.id === assignmentForm.eventId);
        setAssignmentMsg(
          `✓ Successfully assigned ${selectedUser?.name || selectedUser?.email || 'User'} as ${assignmentForm.role} to "${selectedEvent?.name || 'Event'}". ` +
          `Don't forget to set permissions for this role!`
        );
        // Clear form but keep event selected
        setAssignmentForm(prev => ({ eventId: prev.eventId, userId: '', role: 'COORDINATOR' }));
        setUserSearch('');
        setUserUniqueIdSearch('');
        setUserSearchResult(null);
        setAssignmentEventIdSearch('');
        // Reload assignments to show updated list
        await loadEventAssignments(assignmentForm.eventId);
        // Clear success message after 5 seconds
        setTimeout(() => setAssignmentMsg(''), 5000);
      } else {
        setAssignmentErr(res?.message || 'Failed to save assignment.');
      }
    } catch (err) {
      console.error('Assignment error:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to save assignment.';
      setAssignmentErr(errorMsg);
    } finally {
      setAssigningEventId('');
    }
  };

  // Legacy helper removed: permissions are saved per-incharge row.

  const handleAssignClick = async (eventId) => {
    setAssignmentForm(prev => ({ ...prev, eventId }));
    setAssignmentEventIdSearch('');
    setUserUniqueIdSearch('');
    setUserSearch('');
    setUserSearchResult(null);
    setExistingAssignments([]);
    setAssignmentMsg('');
    setAssignmentErr('');
    setInviteMsg('');
    setInviteErr('');
    setInchargeInviteForm({
      email: '',
      isPointOfContact: false,
      resultUpload: false,
      studentManagement: false,
      certificateManagement: false,
      feeManagement: false
    });
    // Load existing assignments for this event
    await loadEventAssignments(eventId);
    await loadInchargeInvites(eventId);
    // Open the modal
    setShowAssignmentModal(true);
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteMsg('');
    setInviteErr('');
    setInviteDebugLink('');

    if (!assignmentForm.eventId) return setInviteErr('Please select an event first.');
    if (!inchargeInviteForm.email.trim()) return setInviteErr('Email is required.');
    // basic email check (backend validates too)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inchargeInviteForm.email.trim())) {
      return setInviteErr('Please enter a valid email address.');
    }
    const permissions = {
      resultUpload: !!inchargeInviteForm.resultUpload,
      studentManagement: !!inchargeInviteForm.studentManagement,
      certificateManagement: !!inchargeInviteForm.certificateManagement,
      feeManagement: !!inchargeInviteForm.feeManagement
    };

    try {
      setSendingInvite(true);
      const res = await createEventInchargeInvite(assignmentForm.eventId, {
        email: inchargeInviteForm.email.trim(),
        isPointOfContact: !!inchargeInviteForm.isPointOfContact,
        permissions
      });
      if (res?.success) {
        const emailSent = res?.data?.emailSent;
        const regLink = res?.data?.registrationLink;
        if (emailSent === false && regLink) {
          setInviteMsg('Email not sent. Use the registration link below (non-production).');
          setInviteDebugLink(regLink);
          pushToast('warning', 'Email not sent', 'Email service not configured. Use the manual registration link.');
        } else {
          setInviteMsg(res.message || 'Invite sent.');
          pushToast('success', 'Invite sent', `Invite sent to ${inchargeInviteForm.email.trim()}`);
        }
        setInchargeInviteForm(prev => ({ ...prev, email: '' }));
        await loadInchargeInvites(assignmentForm.eventId);
        await loadEventAssignments(assignmentForm.eventId);
        setTimeout(() => setInviteMsg(''), 5000);
      } else {
        const msg = res?.message || 'Failed to send invite.';
        setInviteErr(msg);
        pushToast('error', 'Invite failed', msg);
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to send invite.');
      setInviteErr(msg);
      pushToast('error', 'Invite failed', msg);
    }
    finally {
      setSendingInvite(false);
    }
  };

  // Share link functions
  const getShareableLink = (event) => {
    if (!event?.uniqueId) return null;
    return `${window.location.origin}/event/${event.uniqueId}`;
  };

  const openShareModal = (event) => {
    setShareModal({
      isOpen: true,
      event,
      emails: '',
      loading: false,
      error: '',
      success: ''
    });
  };

  const closeShareModal = () => {
    setShareModal({
      isOpen: false,
      event: null,
      emails: '',
      loading: false,
      error: '',
      success: ''
    });
  };

  const copyLinkToClipboard = (event) => {
    const link = getShareableLink(event);
    if (!link) {
      alert('Event does not have a shareable link yet.');
      return;
    }
    navigator.clipboard.writeText(link).then(() => {
      setShareModal(prev => ({ ...prev, success: 'Link copied to clipboard!' }));
      setTimeout(() => setShareModal(prev => ({ ...prev, success: '' })), 3000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      setShareModal(prev => ({ ...prev, error: 'Failed to copy link. Please try again.' }));
    });
  };

  const handleShareViaEmail = async () => {
    if (!shareModal.emails.trim()) {
      setShareModal(prev => ({ ...prev, error: 'Please enter at least one email address' }));
      return;
    }

    const emailList = shareModal.emails.split(',').map(e => e.trim()).filter(Boolean);
    if (emailList.length === 0) {
      setShareModal(prev => ({ ...prev, error: 'Please enter valid email addresses' }));
      return;
    }

    setShareModal(prev => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      const response = await shareEventViaEmail(shareModal.event.id, emailList);
      if (response.success) {
        setShareModal(prev => ({
          ...prev,
          success: `Event shared successfully! ${response.data?.sent || 0} email(s) sent.`,
          emails: '',
          loading: false
        }));
        setTimeout(() => {
          closeShareModal();
        }, 3000);
      } else {
        setShareModal(prev => ({
          ...prev,
          error: response.message || 'Failed to share event',
          loading: false
        }));
      }
    } catch (error) {
      console.error('Share event error:', error);
      setShareModal(prev => ({
        ...prev,
        error: error.message || 'Failed to share event. Please try again.',
        loading: false
      }));
    }
  };

  const parseBulkInviteEmails = (text) => {
    const raw = String(text || '');
    const parts = raw.split(/[\n,;]+/g).map(s => s.trim()).filter(Boolean);
    return Array.from(new Set(parts.map(p => p.toLowerCase())));
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

  const downloadInchargeInviteTemplateCsv = () => {
    // Header-only template (no sample data)
    const header = 'email,isPointOfContact,resultUpload,studentManagement,certificateManagement,feeManagement\n';
    const blob = new Blob([header], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'incharge_invite_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseBool = (v) => {
    const s = String(v ?? '').trim().toLowerCase();
    return ['1', 'true', 'yes', 'y'].includes(s);
  };

  const parseInviteCsv = (csvText) => {
    const lines = String(csvText || '')
      .split(/\r?\n/g)
      .map(l => l.trim())
      .filter(l => l.length > 0);
    if (lines.length === 0) return { rows: [], error: 'CSV is empty.' };
    const header = lines[0].split(',').map(h => h.trim());
    const idx = (name) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());

    const emailIdx = idx('email');
    if (emailIdx === -1) return { rows: [], error: 'CSV must include an "email" column.' };

    const pocIdx = idx('isPointOfContact');
    const ruIdx = idx('resultUpload');
    const smIdx = idx('studentManagement');
    const cmIdx = idx('certificateManagement');
    const fmIdx = idx('feeManagement');

    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
      const email = (cols[emailIdx] || '').toLowerCase().trim();
      if (!email) continue;
      out.push({
        email,
        isPointOfContact: pocIdx >= 0 ? parseBool(cols[pocIdx]) : false,
        permissions: {
          resultUpload: ruIdx >= 0 ? parseBool(cols[ruIdx]) : undefined,
          studentManagement: smIdx >= 0 ? parseBool(cols[smIdx]) : undefined,
          certificateManagement: cmIdx >= 0 ? parseBool(cols[cmIdx]) : undefined,
          feeManagement: fmIdx >= 0 ? parseBool(cols[fmIdx]) : undefined
        }
      });
    }
    return { rows: out, error: '' };
  };

  const verifyBulkInvite = (sourceRows, rawCountForStats = null) => {
    const raw = Array.isArray(sourceRows) ? sourceRows : [];
    const rawCount = Number.isFinite(rawCountForStats) ? rawCountForStats : raw.length;

    // Dedup by email
    const uniq = [];
    const seen = new Set();
    for (const r of raw) {
      const em = String(r.email || '').toLowerCase().trim();
      if (!em || seen.has(em)) continue;
      seen.add(em);
      uniq.push({ ...r, email: em });
    }

    const invalidEmails = uniq.filter(r => !isValidEmail(r.email)).map(r => r.email);
    const ready = uniq.filter(r => isValidEmail(r.email));

    setBulkInviteStats({
      raw: rawCount,
      deduped: uniq.length,
      invalid: invalidEmails.length,
      ready: ready.length,
      duplicatesRemoved: Math.max(0, rawCount - uniq.length)
    });
    setBulkInvitePrepared(ready);
    setBulkInviteInvalidEmails(invalidEmails);

    return { invalidEmails, ready };
  };

  const removeBulkInviteEmail = (email) => {
    const em = String(email || '').toLowerCase().trim();
    if (!em) return;

    const nextRows = (bulkInviteRows || []).filter(
      (r) => String(r.email || '').toLowerCase().trim() !== em
    );
    setBulkInviteRows(nextRows);

    // Keep textarea in sync (remove exact email lines)
    const nextText = String(bulkInviteText || '')
      .split(/[\r\n]+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => s.toLowerCase().trim() !== em)
      .join('\n');
    setBulkInviteText(nextText);

    verifyBulkInvite(nextRows, nextRows.length);
  };

  const removeAllInvalidBulkInviteEmails = () => {
    if (!bulkInviteInvalidEmails?.length) return;
    const invalidSet = new Set(bulkInviteInvalidEmails.map((e) => String(e).toLowerCase().trim()));

    const nextRows = (bulkInviteRows || []).filter(
      (r) => !invalidSet.has(String(r.email || '').toLowerCase().trim())
    );
    setBulkInviteRows(nextRows);

    const nextText = String(bulkInviteText || '')
      .split(/[\r\n]+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !invalidSet.has(s.toLowerCase().trim()))
      .join('\n');
    setBulkInviteText(nextText);

    verifyBulkInvite(nextRows, nextRows.length);
  };

  const downloadBulkInviteReportCsv = () => {
    if (!bulkInviteReport?.rows?.length) return;
    const header = 'email,status,message\n';
    const lines = bulkInviteReport.rows.map(r => {
      const em = String(r.email || '').replace(/"/g, '""');
      const st = r.ok ? (r.assigned ? 'ASSIGNED' : 'INVITED') : 'FAILED';
      const msg = String(r.message || '').replace(/"/g, '""');
      return `"${em}","${st}","${msg}"`;
    });
    const blob = new Blob([header + lines.join('\n') + '\n'], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incharge_bulk_invite_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkInvite = async () => {
    setInviteMsg('');
    setInviteErr('');
    setInviteDebugLink('');
    setBulkInviteReport(null);

    if (!assignmentForm.eventId) {
      setInviteErr('Please select an event first.');
      return;
    }

    const inputRows = bulkInvitePrepared;
    if (!inputRows.length) {
      setInviteErr('Please click “Verify & Preview” first (and fix any invalid emails).');
      return;
    }
    if (inputRows.length > 200) {
      setInviteErr('Too many emails. Max 200 per upload.');
      return;
    }

    const permissions = {
      resultUpload: !!inchargeInviteForm.resultUpload,
      studentManagement: !!inchargeInviteForm.studentManagement,
      certificateManagement: !!inchargeInviteForm.certificateManagement,
      feeManagement: !!inchargeInviteForm.feeManagement
    };

    setBulkInviting(true);
    let sent = 0;
    let assigned = 0;
    let failed = 0;
    const rows = [];

    for (const row of inputRows) {
      const email = String(row.email || '').trim().toLowerCase();
      if (!email) continue;
      const rowPerms = row.permissions || {};
      const effPerms = {
        resultUpload: typeof rowPerms.resultUpload === 'boolean' ? rowPerms.resultUpload : permissions.resultUpload,
        studentManagement: typeof rowPerms.studentManagement === 'boolean' ? rowPerms.studentManagement : permissions.studentManagement,
        certificateManagement: typeof rowPerms.certificateManagement === 'boolean' ? rowPerms.certificateManagement : permissions.certificateManagement,
        feeManagement: typeof rowPerms.feeManagement === 'boolean' ? rowPerms.feeManagement : permissions.feeManagement
      };
      try {
        const res = await createEventInchargeInvite(assignmentForm.eventId, {
          email,
          isPointOfContact: !!row.isPointOfContact,
          permissions: effPerms
        });
        if (res?.success) {
          if (res?.data?.assigned) assigned += 1;
          else sent += 1;
          rows.push({ email, ok: true, assigned: !!res?.data?.assigned, message: res?.message || 'OK' });
        } else {
          failed += 1;
          rows.push({ email, ok: false, message: res?.message || 'Failed' });
        }
      } catch (e) {
        failed += 1;
        rows.push({ email, ok: false, message: getErrorMessage(e, 'Failed') });
      }
    }

    setBulkInviteReport({ total: inputRows.length, sent, assigned, failed, rows });
    setBulkInviting(false);

    await loadInchargeInvites(assignmentForm.eventId);
    const aRes = await getEventAssignments(assignmentForm.eventId).catch(() => null);
    const assignments = aRes?.success ? (aRes.data || []) : [];
    setExistingAssignments(assignments);

    setEventIncharges(prev => ({
      ...prev,
      [assignmentForm.eventId]: assignments
        .filter(a => a.role === 'INCHARGE' && a.user?.role === 'EVENT_INCHARGE')
        .map(a => ({
          userId: a.userId,
          name: a.user?.name || '',
          email: a.user?.email || '',
          uniqueId: a.user?.uniqueId || '',
          isPointOfContact: !!a.isPointOfContact
        }))
    }));
  };

  const handleMakePoc = async (assignment) => {
    if (!assignmentForm.eventId) return;
    if (!assignment?.userId) return;
    try {
      setAssignmentMsg('');
      setAssignmentErr('');
      const res = await updateEventAssignments(assignmentForm.eventId, [
        { userId: assignment.userId, role: 'INCHARGE', isPointOfContact: true }
      ], 'add');
      if (res?.success) {
        setAssignmentMsg('Point of Contact updated.');
        await loadEventAssignments(assignmentForm.eventId);
        setTimeout(() => setAssignmentMsg(''), 4000);
      } else {
        setAssignmentErr(res?.message || 'Failed to update POC.');
      }
    } catch (e) {
      setAssignmentErr(e?.message || 'Failed to update POC.');
    }
  };

  const handleResendInvite = async (inviteId) => {
    if (!assignmentForm.eventId) return;
    try {
      const res = await resendEventInchargeInvite(assignmentForm.eventId, inviteId);
      if (res?.success) {
        setInviteMsg('Invite resent.');
        if (res?.data?.emailSent === false && res?.data?.registrationLink) {
          setInviteDebugLink(res.data.registrationLink);
          pushToast('warning', 'Email not sent', 'Resend succeeded but email was not sent. Use manual link.');
        } else {
          pushToast('success', 'Invite resent', 'Invite email resent successfully.');
        }
        await loadInchargeInvites(assignmentForm.eventId);
        setTimeout(() => setInviteMsg(''), 5000);
      } else {
        setInviteErr(res?.message || 'Failed to resend invite.');
        pushToast('error', 'Resend failed', res?.message || 'Failed to resend invite.');
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to resend invite.');
      setInviteErr(msg);
      pushToast('error', 'Resend failed', msg);
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    if (!assignmentForm.eventId) return;
    if (!window.confirm('Revoke this invite?')) return;
    try {
      const res = await revokeEventInchargeInvite(assignmentForm.eventId, inviteId);
      if (res?.success) {
        setInviteMsg('Invite revoked.');
        pushToast('info', 'Invite revoked', 'Invite was revoked.');
        await loadInchargeInvites(assignmentForm.eventId);
        setTimeout(() => setInviteMsg(''), 5000);
      } else {
        setInviteErr(res?.message || 'Failed to revoke invite.');
        pushToast('error', 'Revoke failed', res?.message || 'Failed to revoke invite.');
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to revoke invite.');
      setInviteErr(msg);
      pushToast('error', 'Revoke failed', msg);
    }
  };

  const handleRemoveAssignment = async (eventId, assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }
    try {
      // Get current assignments, remove the one to delete, and replace all
      const currentAssignments = existingAssignments.filter(a => a.id !== assignmentId);
      const assignmentsToKeep = currentAssignments.map(a => ({
        userId: a.userId,
        role: a.role
      }));
      
      const res = await updateEventAssignments(eventId, assignmentsToKeep, 'replace');
      if (res?.success) {
        setAssignmentMsg('Assignment removed successfully.');
        await loadEventAssignments(eventId);
      } else {
        setAssignmentErr(res?.message || 'Failed to remove assignment.');
      }
    } catch (err) {
      setAssignmentErr(err?.message || 'Failed to remove assignment.');
    }
  };

  const loadAllInchargePermissionsForEvent = async (eventId) => {
    if (!eventId) return;
    try {
      setPermissionLoading(true);
      setPermissionErr('');
      setPermissionMsg('');
      setPermissionIncharges([]);

      // Ensure assignments are loaded
      const aRes = await getEventAssignments(eventId);
      const assignments = aRes?.success ? (aRes.data || []) : [];
      setExistingAssignments(assignments);

      const incharges = assignments
        .filter(a => a.role === 'INCHARGE' && a.user?.role === 'EVENT_INCHARGE')
        .map(a => ({
          userId: a.userId,
          label: a.user?.name || a.user?.email || a.user?.uniqueId || 'Incharge',
          email: a.user?.email || '',
          uniqueId: a.user?.uniqueId || '',
          isPointOfContact: !!a.isPointOfContact
        }));

      if (!incharges.length) {
        setPermissionIncharges([]);
        return;
      }

      const permsSettled = await Promise.allSettled(
        incharges.map(async (i) => {
          const res = await getEventInchargePermissions(eventId, i.userId);
          const p = res?.success ? (res.data?.permissions || {}) : {};
          return {
            ...i,
            permissions: {
              resultUpload: !!p.resultUpload,
              studentManagement: !!p.studentManagement,
              certificateManagement: !!p.certificateManagement,
              feeManagement: !!p.feeManagement
            },
            saving: false,
            error: '',
            msg: ''
          };
        })
      );

      const rows = permsSettled.map((r, idx) => {
        if (r.status === 'fulfilled') return r.value;
        const i = incharges[idx];
        return {
          ...i,
          permissions: { resultUpload: false, studentManagement: false, certificateManagement: false, feeManagement: false },
          saving: false,
          error: 'Failed to load permissions.',
          msg: ''
        };
      });

      setPermissionIncharges(rows);
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to load incharge permissions.');
      setPermissionErr(msg);
      setPermissionIncharges([]);
    } finally {
      setPermissionLoading(false);
    }
  };

  const updatePermissionRow = (userId, patch) => {
    setPermissionIncharges((prev) => prev.map((r) => (r.userId === userId ? { ...r, ...patch } : r)));
  };

  const togglePermission = (userId, key, value) => {
    setPermissionIncharges((prev) =>
      prev.map((r) =>
        r.userId === userId
          ? { ...r, permissions: { ...(r.permissions || {}), [key]: value }, error: '', msg: '' }
          : r
      )
    );
  };

  const saveInchargePermissionsRow = async (eventId, userId) => {
    const row = permissionIncharges.find(r => r.userId === userId);
    if (!row) return;
    const p = row.permissions || {};
    const hasAny = p.resultUpload || p.studentManagement || p.certificateManagement || p.feeManagement;
    if (!hasAny) {
      updatePermissionRow(userId, { error: 'Select at least one permission.', msg: '' });
      return;
    }
    try {
      updatePermissionRow(userId, { saving: true, error: '', msg: '' });
      const res = await updateEventInchargePermissions(eventId, userId, {
        resultUpload: !!p.resultUpload,
        studentManagement: !!p.studentManagement,
        certificateManagement: !!p.certificateManagement,
        feeManagement: !!p.feeManagement
      });
      if (res?.success) {
        updatePermissionRow(userId, { saving: false, msg: 'Saved.', error: '' });
        pushToast('success', 'Incharge permissions saved', row.email || row.label);
      } else {
        updatePermissionRow(userId, { saving: false, error: res?.message || 'Failed to save.', msg: '' });
      }
    } catch (err) {
      updatePermissionRow(userId, { saving: false, error: getErrorMessage(err, 'Failed to save.'), msg: '' });
    }
  };

  const handlePermissionClick = async (eventId) => {
    setPermissionForm(prev => ({ ...prev, eventId }));
    setPermissionEventIdSearch('');
    setPermissionMsg('');
    setPermissionErr('');
    setPermissionLoading(false);
    // Open the modal
    setShowPermissionModal(true);
    await loadAllInchargePermissionsForEvent(eventId);
  };

  // Auto-select event by uniqueId search
  const handleEventIdSearch = (searchValue, formType) => {
    if (formType === 'assignment') {
      setAssignmentEventIdSearch(searchValue);
      if (searchValue.trim()) {
        const foundEvent = events.find(e => 
          e.uniqueId?.toLowerCase() === searchValue.toLowerCase().trim() ||
          e.id === searchValue.trim()
        );
        if (foundEvent) {
          setAssignmentForm(prev => ({ ...prev, eventId: foundEvent.id }));
        }
      }
    } else if (formType === 'permission') {
      setPermissionEventIdSearch(searchValue);
      if (searchValue.trim()) {
        const foundEvent = events.find(e => 
          e.uniqueId?.toLowerCase() === searchValue.toLowerCase().trim() ||
          e.id === searchValue.trim()
        );
        if (foundEvent) {
          setPermissionForm(prev => ({ ...prev, eventId: foundEvent.id }));
        }
      }
    }
  };

  // Auto-select user by uniqueId search
  const handleUserUniqueIdSearch = async (uniqueId) => {
    setUserUniqueIdSearch(uniqueId);
    setUserSearchResult(null);
    
    if (!uniqueId.trim()) {
      return;
    }

    try {
      setSearchingUser(true);
      const { getUserByUniqueId } = await import('../../api');
      const response = await getUserByUniqueId(uniqueId.trim());
      
      if (response?.success && response?.data) {
        setUserSearchResult(response.data);
        setAssignmentForm(prev => ({ ...prev, userId: response.data.id }));
      } else {
        setUserSearchResult({ error: 'User not found' });
      }
    } catch (err) {
      console.error('Error searching user:', err);
      setUserSearchResult({ error: err?.message || 'Failed to search user' });
    } finally {
      setSearchingUser(false);
    }
  };

  // Legacy single-submit handler removed: the modal now edits all incharges per event with per-row saves.

  const handleModerateEvent = async (eventId, action) => {
    try {
      setModeratingEventId(eventId);
      const response = await moderateEvent(eventId, action);
      
      if (response.success) {
        // Update the event in the list
        setEvents(prev =>
          prev.map(event =>
            event.id === eventId ? { ...event, status: response.data.event.status } : event
          )
        );
        pushToast('success', 'Event updated', `Event has been ${action.toLowerCase()}d.`);
      }
    } catch (error) {
      console.error('Error moderating event:', error);
      pushToast('error', 'Action failed', getErrorMessage(error, 'Failed to moderate event.'));
    } finally {
      setModeratingEventId(null);
    }
  };

  // Enhanced: fetch participants + payments when opening modal
  const handleViewEventDetails = async (event) => {
    try {
      setEventDetailsModal({
        isOpen: true,
        event,
        participants: [],
        payments: [],
        loading: true,
        paymentsLoading: true
      });

      console.log('📋 Fetching participants and payments for event:', event.id);

      // Load participants and payments concurrently
      const [participantsResponse, paymentsResponse] = await Promise.allSettled([
        getEventParticipants(event.id),
        getEventPayments(event.id)
      ]);

      // Participants
      if (participantsResponse.status === 'fulfilled' && participantsResponse.value?.success) {
        console.log('✅ Participants loaded:', participantsResponse.value.data.registrations?.length || 0);
        setEventDetailsModal(prev => ({
          ...prev,
          participants: participantsResponse.value.data.registrations || [],
          loading: false
        }));
      } else {
        console.warn('Participants fetch failed or returned unexpected shape:', participantsResponse);
        setEventDetailsModal(prev => ({ ...prev, participants: [], loading: false }));
      }

      // Payments - Enhanced error handling
      if (paymentsResponse.status === 'fulfilled') {
        try {
          const responseValue = paymentsResponse.value;
        let paymentsList = [];
          
          // Handle different response shapes
          if (responseValue?.success && responseValue?.data) {
            // Standard API response: { success: true, data: { payments: [...] } }
            paymentsList = responseValue.data.payments || responseValue.data || [];
          } else if (Array.isArray(responseValue)) {
            // Direct array response
            paymentsList = responseValue;
          } else if (responseValue?.payments && Array.isArray(responseValue.payments)) {
            // Wrapped in payments key
            paymentsList = responseValue.payments;
          } else if (responseValue?.data?.payments && Array.isArray(responseValue.data.payments)) {
            // Nested data.payments
            paymentsList = responseValue.data.payments;
          }

          console.log('✅ Payments loaded:', paymentsList.length || 0, paymentsList);
        setEventDetailsModal(prev => ({
          ...prev,
          payments: paymentsList,
          paymentsLoading: false
        }));
        } catch (paymentError) {
          console.error('Error processing payments:', paymentError);
          setEventDetailsModal(prev => ({ ...prev, payments: [], paymentsLoading: false }));
        }
      } else {
        console.warn('Payments fetch failed:', paymentsResponse);
        const errorReason = paymentsResponse.reason?.message || paymentsResponse.reason || 'Unknown error';
        console.error('Payment fetch error:', errorReason);
        setEventDetailsModal(prev => ({ ...prev, payments: [], paymentsLoading: false }));
      }

    } catch (error) {
      console.error('❌ Failed to fetch participants/payments:', error);
      setEventDetailsModal({
        isOpen: true,
        event,
        participants: [],
        payments: [],
        loading: false,
        paymentsLoading: false
      });
    }
  };

  // Open event modal directly on Edit tab (lighter than full details fetch)
  const handleEditEvent = (event) => {
    setModalTab('edit');
    setEventDetailsModal({
      isOpen: true,
      event,
      participants: [],
      payments: [],
      loading: false,
      paymentsLoading: false
    });
    
    // Initialize edit form immediately
    setEditEventForm({
      name: event.name || '',
      description: event.description || '',
      sport: event.sport || '',
      level: event.level || 'DISTRICT',
      startDate: formatDateForInput(event.startDate),
      endDate: formatDateForInput(event.endDate),
      venue: event.venue || '',
      address: event.address || '',
      city: event.city || '',
      state: event.state || '',
      maxParticipants: event.maxParticipants ?? '',
      categoriesAvailable: event.categoriesAvailable || ''
    });
    setEditEventOriginal({
      name: event.name || '',
      description: event.description || '',
      sport: event.sport || '',
      level: event.level || 'DISTRICT',
      startDate: event.startDate,
      endDate: event.endDate,
      venue: event.venue || '',
      address: event.address || '',
      city: event.city || '',
      state: event.state || '',
      maxParticipants: event.maxParticipants ?? '',
      categoriesAvailable: event.categoriesAvailable || ''
    });
    setEditErr('');
    setEditMsg('');
  };

  const closeEventDetailsModal = () => {
    setEventDetailsModal({
      isOpen: false,
      event: null,
      participants: [],
      payments: [],
      loading: false,
      paymentsLoading: false
    });
    setModalTab('details');
    setEditEventForm(null);
    setEditEventOriginal(null);
    setEditSaving(false);
    setEditMsg('');
    setEditErr('');
  };

  const handleEditEventChange = (e) => {
    const { name, value } = e.target;
    setEditEventForm((prev) => ({ ...(prev || {}), [name]: value }));
  };

  const buildEventPatch = (next, original) => {
    if (!next || !original) return {};
    const patch = {};

    const setIfChanged = (key, nextVal, origVal) => {
      // normalize undefined/null/'' for comparisons
      const n = (nextVal === undefined ? null : nextVal);
      const o = (origVal === undefined ? null : origVal);
      if (String(n ?? '') !== String(o ?? '')) patch[key] = nextVal;
    };

    setIfChanged('name', next.name?.trim() || '', original.name || '');
    setIfChanged('description', next.description?.trim() || '', original.description || '');
    setIfChanged('sport', next.sport?.trim() || '', original.sport || '');
    setIfChanged('level', String(next.level || 'DISTRICT').toUpperCase(), String(original.level || 'DISTRICT').toUpperCase());
    setIfChanged('venue', next.venue?.trim() || '', original.venue || '');
    setIfChanged('address', next.address?.trim() || '', original.address || '');
    setIfChanged('city', next.city?.trim() || '', original.city || '');
    setIfChanged('state', next.state?.trim() || '', original.state || '');
    // Handle categoriesAvailable: normalize empty strings to null for comparison
    const nextCat = next.categoriesAvailable?.trim() || null;
    const origCat = original.categoriesAvailable?.trim() || null;
    if (nextCat !== origCat) {
      patch.categoriesAvailable = nextCat || null; // Send null instead of empty string
    }

    // maxParticipants
    const nextMax = next.maxParticipants === '' ? null : Number(next.maxParticipants);
    const origMax = original.maxParticipants === '' ? null : Number(original.maxParticipants);
    if (Number.isFinite(nextMax) && nextMax > 0 && nextMax !== origMax) patch.maxParticipants = nextMax;

    // Dates: only include if changed; send ISO-ish strings the backend can parse.
    const nextStart = next.startDate ? `${next.startDate}:00` : null;
    const origStart = original.startDate ? new Date(original.startDate).toISOString().slice(0, 19) : null;
    if (next.startDate) {
      // compare by minute precision
      const nextStartKey = nextStart?.slice(0, 16);
      const origStartKey = original.startDate ? formatDateForInput(original.startDate) : '';
      if (nextStartKey !== origStartKey) patch.startDate = nextStart;
    }

    const nextEndKey = next.endDate ? next.endDate : '';
    const origEndKey = original.endDate ? formatDateForInput(original.endDate) : '';
    if (nextEndKey !== origEndKey) patch.endDate = next.endDate ? `${next.endDate}:00` : null;

    return patch;
  };

  const resetEditedEvent = () => {
    const ev = editEventOriginal;
    if (!ev) return;
    setEditEventForm({
      name: ev.name || '',
      description: ev.description || '',
      sport: ev.sport || '',
      level: (ev.level || 'DISTRICT'),
      startDate: formatDateForInput(ev.startDate),
      endDate: formatDateForInput(ev.endDate),
      venue: ev.venue || '',
      address: ev.address || '',
      city: ev.city || '',
      state: ev.state || '',
      maxParticipants: ev.maxParticipants ?? '',
      categoriesAvailable: ev.categoriesAvailable || ''
    });
    setEditErr('');
    setEditMsg('');
  };

  const editPatch = useMemo(() => buildEventPatch(editEventForm, editEventOriginal), [editEventForm, editEventOriginal]);
  const hasEditChanges = useMemo(() => !!editPatch && Object.keys(editPatch).length > 0, [editPatch]);

  const editValidation = useMemo(() => {
    const errors = {};
    const warnings = {};
    const ev = eventDetailsModal?.event;

    if (!editEventForm) return { isValid: false, errors, warnings };

    // Only validate fields that are being changed (in the patch)
    const patch = buildEventPatch(editEventForm, editEventOriginal);
    const fieldsBeingChanged = Object.keys(patch || {});

    const required = (key, label) => {
      // Only validate if this field is being changed
      if (fieldsBeingChanged.includes(key)) {
        const v = String(editEventForm[key] ?? '').trim();
        if (!v) errors[key] = `${label} is required.`;
      }
    };

    // Required fields per schema - but only validate if being changed
    if (fieldsBeingChanged.includes('name')) required('name', 'Event name');
    if (fieldsBeingChanged.includes('sport')) required('sport', 'Sport');
    if (fieldsBeingChanged.includes('venue')) required('venue', 'Venue');
    if (fieldsBeingChanged.includes('city')) required('city', 'City');
    if (fieldsBeingChanged.includes('state')) required('state', 'State');
    if (fieldsBeingChanged.includes('startDate')) required('startDate', 'Start date');

    // Dates - only validate if being changed
    if (fieldsBeingChanged.includes('startDate') || fieldsBeingChanged.includes('endDate')) {
      const start = editEventForm.startDate ? new Date(`${editEventForm.startDate}:00`) : null;
      const end = editEventForm.endDate ? new Date(`${editEventForm.endDate}:00`) : null;
      if (editEventForm.startDate && Number.isNaN(start?.getTime())) errors.startDate = 'Start date is invalid.';
      if (editEventForm.endDate && Number.isNaN(end?.getTime())) errors.endDate = 'End date is invalid.';
      if (start && end && end <= start) errors.endDate = 'End date must be after start date.';

      // Backend edge case: startDate updates must be in the future
      if (patch?.startDate && start && start <= new Date()) {
        errors.startDate = 'Start date must be in the future (backend restriction).';
      } else if (start && start <= new Date() && fieldsBeingChanged.includes('startDate')) {
        // If event is already in the past, warn that changing startDate won't be allowed.
        warnings.startDate = 'This event has already started/ended. Changing start date may be rejected by the backend.';
      }
    }

    // Max participants: must be >= current participants (safety) - only if being changed
    if (fieldsBeingChanged.includes('maxParticipants')) {
      const currentParticipants =
        Number(ev?.currentParticipants) ||
        Number(ev?._count?.registrations) ||
        0;
      if (editEventForm.maxParticipants !== '' && editEventForm.maxParticipants !== null && editEventForm.maxParticipants !== undefined) {
        const mp = Number(editEventForm.maxParticipants);
        if (!Number.isFinite(mp) || mp < 1) errors.maxParticipants = 'Max participants must be a positive number.';
        else if (mp < currentParticipants) errors.maxParticipants = `Max participants cannot be less than current participants (${currentParticipants}).`;
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors, warnings };
  }, [editEventForm, editEventOriginal, eventDetailsModal?.event]);

  const saveEditedEvent = async () => {
    try {
      const ev = eventDetailsModal?.event;
      if (!ev?.id) {
        console.error('❌ No event ID found');
        setEditErr('No event selected.');
        return;
      }
      
      console.log('💾 Saving event changes...', {
        eventId: ev.id,
        editPatch,
        editEventForm,
        editValidation
      });
      
      setEditSaving(true);
      setEditErr('');
      setEditMsg('');

      const patch = editPatch;
      console.log('📦 Patch to send:', patch);
      
      if (!patch || Object.keys(patch).length === 0) {
        console.log('⚠️ No changes detected');
        setEditMsg('No changes to save.');
        setEditSaving(false);
        return;
      }

      if (!editValidation || !editValidation.isValid) {
        const errorKeys = Object.keys(editValidation?.errors || {});
        const errorMessages = Object.values(editValidation?.errors || {});
        console.error('❌ Validation failed:', {
          errors: editValidation?.errors,
          warnings: editValidation?.warnings,
          fieldsBeingChanged: Object.keys(patch),
          formData: editEventForm
        });
        
        if (errorKeys.length > 0) {
          // Show first error, but allow saving if only warnings exist
          const firstError = errorMessages[0];
          setEditErr(firstError);
          setEditSaving(false);
          return;
        }
        // If only warnings, allow save but show warning
        if (Object.keys(editValidation?.warnings || {}).length > 0) {
          console.warn('⚠️ Validation warnings (but allowing save):', editValidation?.warnings);
        }
      }

      // Basic client-side guardrails
      if (patch.name !== undefined && !patch.name.trim()) {
        setEditErr('Event name is required.');
        setEditSaving(false);
        return;
      }
      if (patch.sport !== undefined && !patch.sport.trim()) {
        setEditErr('Sport is required.');
        setEditSaving(false);
        return;
      }

      console.log('🚀 Calling adminUpdateEvent API...');
      const res = await adminUpdateEvent(ev.id, patch);
      console.log('✅ API response:', res);
      if (!res?.success) {
        setEditErr(res?.message || 'Failed to update event.');
        return;
      }

      const updated = res.data || res;
      setEditMsg('Event updated successfully. Refreshing event details...');

      // Normalize categoriesAvailable: empty string becomes null
      const normalizedUpdated = {
        ...updated,
        categoriesAvailable: updated.categoriesAvailable && updated.categoriesAvailable.trim() 
          ? updated.categoriesAvailable.trim() 
          : null
      };

      // Update in-memory lists so UI is instantly consistent
      setEvents((prev) => prev.map((x) => (x.id === ev.id ? { ...x, ...normalizedUpdated } : x)));
      setEventDetailsModal((prev) => ({ ...prev, event: { ...(prev.event || {}), ...normalizedUpdated } }));
      setEditEventOriginal((prev) => ({ ...(prev || {}), ...normalizedUpdated }));
      
      // Update edit form with fresh data
      setEditEventForm((prev) => ({
        ...prev,
        ...Object.keys(patch).reduce((acc, key) => {
          if (key === 'categoriesAvailable') {
            acc[key] = normalizedUpdated.categoriesAvailable || '';
          } else if (normalizedUpdated[key] !== undefined) {
            acc[key] = normalizedUpdated[key];
          }
          return acc;
        }, {})
      }));
      
      // Refresh event from API to get latest data including categoriesAvailable
      try {
        const { getEventById } = await import('../../api');
        const freshEventResponse = await getEventById(ev.id);
        if (freshEventResponse?.success && freshEventResponse?.data) {
          const freshEvent = freshEventResponse.data;
          // Update all state with fresh data
          setEvents((prev) => prev.map((x) => (x.id === ev.id ? { ...x, ...freshEvent } : x)));
          setEventDetailsModal((prev) => ({ ...prev, event: { ...(prev.event || {}), ...freshEvent } }));
          setEditEventOriginal((prev) => ({ ...(prev || {}), ...freshEvent }));
          setEditEventForm((prev) => ({
            ...prev,
            categoriesAvailable: freshEvent.categoriesAvailable || ''
          }));
        }
      } catch (refreshError) {
        console.warn('Failed to refresh event after save:', refreshError);
      }
      
      // Clear success message after a delay
      setTimeout(() => {
        setEditMsg('Event updated successfully.');
      }, 2000);
    } catch (error) {
      setEditErr(getErrorMessage(error, 'Failed to update event.'));
    } finally {
      setEditSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-orange-100 text-orange-800',
      ACTIVE: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      'ABOUT TO START': 'bg-cyan-100 text-cyan-800',
      ONGOING: 'bg-indigo-100 text-indigo-800',
      ENDED: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Helper function to get dynamic event status based on dates
  const getDynamicEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;
    
    // Calculate time differences in milliseconds
    const timeUntilStart = startDate - now;
    const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
    const daysUntilStart = timeUntilStart / (1000 * 60 * 60 * 24);
    
    // If event is not approved yet, show the actual status
    if (event.status === 'PENDING' || event.status === 'REJECTED' || event.status === 'SUSPENDED' || event.status === 'CANCELLED') {
      return event.status;
    }
    
    // Check if event has ended
    if (endDate && now > endDate) {
      return 'ENDED';
    }
    
    // Check if event is ongoing
    if (now >= startDate && (!endDate || now <= endDate)) {
      return 'ONGOING';
    }
    
    // Check if event is about to start (within 24 hours)
    if (hoursUntilStart > 0 && hoursUntilStart <= 24) {
      return 'ABOUT TO START';
    }
    
    // Check if event is within 7 days
    if (daysUntilStart > 1 && daysUntilStart <= 7) {
      return 'UPCOMING';
    }
    
    // Otherwise return the current status
    return event.status;
  };

  // Enhanced helper: derive payment status / summary for an event object with comprehensive edge case handling
  const getEventPaymentSummary = (event, modalPayments = []) => {
    // Prefer modal-loaded payments when available (fixes "No Payments" badge when modal has payments)
    if (Array.isArray(modalPayments) && modalPayments.length > 0) {
      const total = modalPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const paid = modalPayments.reduce((s, p) => {
        const amount = Number(p.amount) || 0;
        const isPaid = p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID';
        return isPaid ? s + amount : s;
      }, 0);
      const status = total > 0 ? (paid >= total ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING')) : (paid > 0 ? 'PAID' : 'NO_PAYMENTS');
      return {
        totalAmount: total,
        paidAmount: paid,
        status,
        orderCount: modalPayments.length,
        paidOrderCount: modalPayments.filter(p => p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID').length
      };
    }

    // Prefer server-provided summary fields if present
    if (event.paymentSummary && typeof event.paymentSummary === 'object') {
      return {
        totalAmount: event.paymentSummary.totalAmount || 0,
        paidAmount: event.paymentSummary.paidAmount || 0,
        status: event.paymentSummary.status || 'NO_PAYMENTS',
        orderCount: event.paymentSummary.orderCount || 0,
        paidOrderCount: event.paymentSummary.paidOrderCount || 0
      };
    }
    if (event.paymentsSummary && typeof event.paymentsSummary === 'object') {
      return event.paymentsSummary;
    }
    // If event has payments array embedded (legacy support)
    if (Array.isArray(event.payments) && event.payments.length > 0) {
      const total = event.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const paid = event.payments.reduce((s, p) => {
        const amount = Number(p.amount) || 0;
        const isPaid = p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID';
        return isPaid ? s + amount : s;
      }, 0);
      const status = total > 0 ? (paid >= total ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING')) : 'NO_PAYMENTS';
      return { totalAmount: total, paidAmount: paid, status, orderCount: event.payments.length, paidOrderCount: event.payments.filter(p => p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID').length };
    }
    // Fallback: if modalPayments were loaded (used in modal)
    if (Array.isArray(modalPayments) && modalPayments.length > 0) {
      const total = modalPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const paid = modalPayments.reduce((s, p) => {
        const amount = Number(p.amount) || 0;
        const isPaid = p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID';
        return isPaid ? s + amount : s;
      }, 0);
      const status = total > 0 ? (paid >= total ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING')) : 'NO_PAYMENTS';
      return { totalAmount: total, paidAmount: paid, status, orderCount: modalPayments.length, paidOrderCount: modalPayments.filter(p => p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID').length };
    }
    // Default: no payments found
    return { totalAmount: 0, paidAmount: 0, status: 'NO_PAYMENTS', orderCount: 0, paidOrderCount: 0 };
  };

  // Event Details Modal Component
  const EventDetailsModal = ({ isOpen, onClose, event, participants, loading, payments, paymentsLoading }) => {
    if (!isOpen || !event) return null;

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return 'Not specified';
      const d = new Date(dateString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (participant) => {
      const status = participant.status || 'REGISTERED';
      const statusColors = {
        'PENDING': 'bg-yellow-100 text-yellow-800',
        'REGISTERED': 'bg-green-100 text-green-800',
        'APPROVED': 'bg-green-100 text-green-800',
        'CONFIRMED': 'bg-blue-100 text-blue-800',
        'CANCELLED': 'bg-red-100 text-red-800',
        'REJECTED': 'bg-red-100 text-red-800'
      };
      
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
          {status}
        </span>
      );
    };

    const paymentSummary = getEventPaymentSummary(event, payments);

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5 rounded-t-xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{event.name || event.title}</h3>
                <p className="text-blue-100 text-sm">Complete Event Information & Participant List</p>
                {/* Payment summary in header */}
                <div className="mt-2 flex items-center space-x-3 text-sm">
                  <span className={`px-2 py-1 rounded-full font-semibold ${paymentSummary.status === 'PAID' ? 'bg-green-100 text-green-800' : paymentSummary.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {paymentSummary.status === 'NO_PAYMENTS' ? 'No Payments' : paymentSummary.status}
                  </span>
                  {paymentSummary.totalAmount > 0 && (
                    <span className="text-blue-100/80">• Total: ₹{(paymentSummary.totalAmount || 0).toLocaleString()}</span>
                  )}
                  {paymentSummary.paidAmount > 0 && (
                    <span className="text-blue-100/80">• Paid: ₹{(paymentSummary.paidAmount || 0).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="ml-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 flex flex-shrink-0 bg-white">
            <button
              onClick={() => setModalTab('details')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                modalTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Event Details & Participants
            </button>
            {event.uniqueId && (event.status === 'APPROVED' || event.status === 'ACTIVE') && (
              <button
                onClick={() => openShareModal(event)}
                className="px-6 py-3 font-medium text-sm transition-colors text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <span>🔗</span>
                <span>Share Link</span>
              </button>
            )}
            <button
              onClick={() => {
                setModalTab('edit');
                // Always initialize edit form when switching to edit tab to ensure fresh data
                if (event) {
                  setEditEventForm({
                    name: event.name || '',
                    description: event.description || '',
                    sport: event.sport || '',
                    level: event.level || 'DISTRICT',
                    startDate: formatDateForInput(event.startDate),
                    endDate: formatDateForInput(event.endDate),
                    venue: event.venue || '',
                    address: event.address || '',
                    city: event.city || '',
                    state: event.state || '',
                    maxParticipants: event.maxParticipants ?? '',
                    categoriesAvailable: event.categoriesAvailable || ''
                  });
                  setEditEventOriginal({
                    name: event.name || '',
                    description: event.description || '',
                    sport: event.sport || '',
                    level: event.level || 'DISTRICT',
                    startDate: event.startDate,
                    endDate: event.endDate,
                    venue: event.venue || '',
                    address: event.address || '',
                    city: event.city || '',
                    state: event.state || '',
                    maxParticipants: event.maxParticipants ?? '',
                    categoriesAvailable: event.categoriesAvailable || ''
                  });
                  setEditErr('');
                  setEditMsg('');
                }
              }}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                modalTab === 'edit'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ✏️ Edit Event
            </button>
            <button
              onClick={() => setModalTab('results')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                modalTab === 'results'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Upload Results
            </button>
            <button
              onClick={() => setModalTab('certificates')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                modalTab === 'certificates'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎓 Certificate Issuance
            </button>
            <button
              onClick={() => setModalTab('payments')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                modalTab === 'payments'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💳 Payments ({payments?.length || 0})
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Details Tab */}
            {modalTab === 'details' && (
              <>
                {/* Event Information Section */}
                <div className="px-6 py-5 bg-white border-b border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Event Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Sport:</span>
                      <span className="ml-2 text-gray-900">{event.sport || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Venue:</span>
                      <span className="ml-2 text-gray-900">{event.venue || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Start Date:</span>
                      <span className="ml-2 text-gray-900">{formatDateTime(event.startDate)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">End Date:</span>
                      <span className="ml-2 text-gray-900">{formatDateTime(event.endDate)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Max Participants:</span>
                      <span className="ml-2 text-gray-900">{event.maxParticipants || 'Unlimited'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Current Participants:</span>
                      <span className="ml-2 text-gray-900">
                        {loading ? 'Loading...' : (participants && Array.isArray(participants) ? participants.length : (event.currentParticipants || 0))}
                      </span>
                    </div>
                  </div>
                  
                  {/* Categories Available Display - Always show */}
                  <div className="mt-5 pt-5 border-t border-gray-200">
                    <h5 className="text-md font-semibold text-gray-900 mb-3">Categories Available</h5>
                    {event.categoriesAvailable && event.categoriesAvailable.trim() ? (
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-300">
                        <CategorySelector
                          value={event.categoriesAvailable}
                          onChange={() => {}} // Read-only in details view
                          readOnly={true}
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">No categories specified</span> for this event. Athletes can register without category selection.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Participants Section (keeps existing UI) */}
                <div className="px-6 py-5 bg-white">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center">
                      <div className="w-1 h-6 bg-green-600 rounded-full mr-3"></div>
                      <h4 className="text-lg font-bold text-gray-900">
                        Participants ({participants?.length || 0})
                      </h4>
                    </div>
                    {participants && participants.length > 0 && event.maxParticipants && (
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                        {Math.round((participants.length / event.maxParticipants) * 100)}% Full
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <span className="text-gray-600 font-medium">Loading participants...</span>
                    </div>
                  ) : participants && participants.length > 0 ? (
                    <div className="space-y-3">
                      {/* existing participants list rendering (unchanged) */}
                      {participants.map((participant, index) => {
                        const studentName = participant.student?.name || 
                                           `${participant.student?.firstName || ''} ${participant.student?.lastName || ''}`.trim() || 
                                           'Student';
                        const studentUID = participant.student?.user?.uniqueId;
                        
                        const CardWrapper = studentUID ? Link : 'div';
                        const cardProps = studentUID ? {
                          to: `/admin/users/${studentUID}`,
                          onClick: onClose,
                          className: "block bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-400 transition-all duration-200 cursor-pointer"
                        } : {
                          className: "bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                        };
                        
                        return (
                          <CardWrapper key={participant.id || index} {...cardProps}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center flex-1">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h5 className={`font-bold text-lg ${studentUID ? 'text-gray-900 group-hover:text-blue-600' : 'text-gray-900'}`}>
                                    {studentName}
                                  </h5>
                                  <p className="text-sm text-gray-600 mt-1">
                                    📅 Registered on {formatDateTime(participant.registeredAt || participant.createdAt)}
                                  </p>
                                  {studentUID && (
                                    <p className="text-xs text-blue-600 font-mono font-bold mt-1 bg-blue-50 inline-block px-2 py-1 rounded">
                                      UID: {studentUID}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {getStatusBadge(participant)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                </svg>
                                <p className="text-sm text-gray-900 truncate">{participant.student?.user?.email || participant.student?.email || 'N/A'}</p>
                              </div>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                                </svg>
                                <p className="text-sm text-gray-900">{participant.student?.user?.phone || participant.student?.phone || 'N/A'}</p>
                              </div>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-sm text-gray-900">{participant.student?.sport || 'N/A'}</p>
                              </div>
                            </div>
                          </CardWrapper>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">No Participants Yet</h4>
                      <p className="text-gray-600">No one has registered for this event yet.</p>
                    </div>
                  )}
                </div>

                {/* Payments Summary in Details Tab */}
                <div className="px-6 py-5 bg-white border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-1 h-6 bg-indigo-600 rounded-full mr-3"></div>
                      <h4 className="text-lg font-bold text-gray-900">Payments Summary</h4>
                    </div>
                    <button
                      onClick={() => setModalTab('payments')}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View All Payments →
                    </button>
                  </div>

                  {paymentsLoading ? (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      <div>Loading payment records...</div>
                    </div>
                  ) : payments && payments.length > 0 ? (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                          <div className="text-xs text-gray-600 mb-1">Total Payments</div>
                          <div className="text-lg font-bold text-gray-900">{payments.length}</div>
                            </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Total Amount</div>
                          <div className="text-lg font-bold text-green-600">
                            ₹{payments.reduce((sum, p) => sum + (parseFloat(p.amount || p.value || 0)), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Completed</div>
                          <div className="text-lg font-bold text-green-600">
                            {payments.filter(p => p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID').length}
                        </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Pending</div>
                          <div className="text-lg font-bold text-yellow-600">
                            {payments.filter(p => p.status === 'PENDING' || p.status === 'CREATED').length}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setModalTab('payments')}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Click to view detailed payment records →
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No payments recorded for this event.</div>
                  )}
                </div>
              </>
            )}

            {/* Edit Tab */}
            {modalTab === 'edit' && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Edit Event</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Updates apply immediately. Only changed fields are saved (prevents date-validation issues).
                  </p>
                  {hasEditChanges && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded text-sm">
                      <div className="font-semibold">Unsaved changes</div>
                      <div className="mt-1">
                        Changed fields: <span className="font-medium">{Object.keys(editPatch || {}).join(', ')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {editErr && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {editErr}
                  </div>
                )}
                {editMsg && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {editMsg}
                  </div>
                )}

                {!editEventForm ? (
                  <div className="text-gray-600">Loading...</div>
                ) : (
                  <div className="space-y-5">
                    {editValidation?.warnings?.startDate && (
                      <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded text-sm">
                        {editValidation.warnings.startDate}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="edit-event-name" className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                        <input
                          type="text"
                          id="edit-event-name"
                          name="name"
                          value={editEventForm.name || ''}
                          onChange={handleEditEventChange}
                          disabled={editSaving}
                          autoComplete="off"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            editValidation?.errors?.name ? 'border-red-300' : 'border-gray-300'
                          } ${editSaving ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        />
                        {editValidation?.errors?.name && (
                          <div className="mt-1 text-xs text-red-600">{editValidation.errors.name}</div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="edit-event-sport" className="block text-sm font-medium text-gray-700 mb-1">Sport *</label>
                        <input
                          type="text"
                          id="edit-event-sport"
                          name="sport"
                          value={editEventForm.sport}
                          onChange={handleEditEventChange}
                          disabled={editSaving}
                          autoComplete="off"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            editValidation?.errors?.sport ? 'border-red-300' : 'border-gray-300'
                          } ${editSaving ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                          placeholder="e.g. Cricket (or Cricket, Football)"
                        />
                        {editValidation?.errors?.sport && (
                          <div className="mt-1 text-xs text-red-600">{editValidation.errors.sport}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="edit-event-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        id="edit-event-description"
                        name="description"
                        rows={3}
                        value={editEventForm.description}
                        onChange={handleEditEventChange}
                        disabled={editSaving}
                        autoComplete="off"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          editSaving ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="edit-event-level" className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                        <select
                          id="edit-event-level"
                          name="level"
                          value={editEventForm.level}
                          onChange={handleEditEventChange}
                          disabled={editSaving}
                          autoComplete="off"
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            editSaving ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                          }`}
                        >
                          <option value="DISTRICT">DISTRICT</option>
                          <option value="STATE">STATE</option>
                          <option value="NATIONAL">NATIONAL</option>
                          <option value="SCHOOL">SCHOOL</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="edit-event-start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                        <input
                          type="datetime-local"
                          id="edit-event-start-date"
                          name="startDate"
                          value={editEventForm.startDate}
                          onChange={handleEditEventChange}
                          disabled={editSaving}
                          autoComplete="off"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            editValidation?.errors?.startDate ? 'border-red-300' : 'border-gray-300'
                          } ${editSaving ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        />
                        {editValidation?.errors?.startDate && (
                          <div className="mt-1 text-xs text-red-600">{editValidation.errors.startDate}</div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="edit-event-end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                        <input
                          type="datetime-local"
                          id="edit-event-end-date"
                          name="endDate"
                          value={editEventForm.endDate}
                          onChange={handleEditEventChange}
                          disabled={editSaving}
                          autoComplete="off"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            editValidation?.errors?.endDate ? 'border-red-300' : 'border-gray-300'
                          } ${editSaving ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        />
                        {editValidation?.errors?.endDate && (
                          <div className="mt-1 text-xs text-red-600">{editValidation.errors.endDate}</div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="edit-event-venue" className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
                        <input
                          type="text"
                          id="edit-event-venue"
                          name="venue"
                          value={editEventForm.venue}
                          onChange={handleEditEventChange}
                          disabled={editSaving}
                          autoComplete="organization"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            editValidation?.errors?.venue ? 'border-red-300' : 'border-gray-300'
                          } ${editSaving ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        />
                        {editValidation?.errors?.venue && (
                          <div className="mt-1 text-xs text-red-600">{editValidation.errors.venue}</div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="edit-event-max-participants" className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                        <input
                          type="number"
                          id="edit-event-max-participants"
                          min="1"
                          name="maxParticipants"
                          value={editEventForm.maxParticipants}
                          onChange={handleEditEventChange}
                          disabled={editSaving}
                          autoComplete="off"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            editValidation?.errors?.maxParticipants ? 'border-red-300' : 'border-gray-300'
                          } ${editSaving ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        />
                        {editValidation?.errors?.maxParticipants && (
                          <div className="mt-1 text-xs text-red-600">{editValidation.errors.maxParticipants}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="edit-event-address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        id="edit-event-address"
                        name="address"
                        value={editEventForm.address}
                        onChange={handleEditEventChange}
                        disabled={editSaving}
                        autoComplete="street-address"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          editSaving ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="edit-event-city" className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input
                          type="text"
                          id="edit-event-city"
                          name="city"
                          value={editEventForm.city}
                          onChange={handleEditEventChange}
                          disabled={editSaving}
                          autoComplete="address-level2"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            editValidation?.errors?.city ? 'border-red-300' : 'border-gray-300'
                          } ${editSaving ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        />
                        {editValidation?.errors?.city && (
                          <div className="mt-1 text-xs text-red-600">{editValidation.errors.city}</div>
                        )}
                      </div>
                    <div>
                      <label htmlFor="edit-event-state" className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <input
                        type="text"
                        id="edit-event-state"
                        name="state"
                        value={editEventForm.state}
                        onChange={handleEditEventChange}
                        disabled={editSaving}
                        autoComplete="address-level1"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          editValidation?.errors?.state ? 'border-red-300' : 'border-gray-300'
                        } ${editSaving ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                      />
                      {editValidation?.errors?.state && (
                        <div className="mt-1 text-xs text-red-600">{editValidation.errors.state}</div>
                      )}
                    </div>
                  </div>

                  {/* Categories Available */}
                  {editEventForm && (
                    <div>
                      <label htmlFor="edit-event-categories" className="block text-sm font-medium text-gray-700 mb-2">
                        Categories Available (Optional)
                      </label>
                      <div id="edit-event-categories" className={editSaving ? 'pointer-events-none opacity-60' : ''}>
                        <CategorySelector
                          value={editEventForm.categoriesAvailable || ''}
                          onChange={(value) => {
                            if (!editSaving && editEventForm) {
                              setEditEventForm(prev => ({ ...prev, categoriesAvailable: value }));
                            }
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Define age groups, strokes/event types, and distances for this event. Athletes can select from these during registration.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={resetEditedEvent}
                        disabled={editSaving || !hasEditChanges}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-60"
                        title={hasEditChanges ? 'Reset changes' : 'No changes to reset'}
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔘 Save button clicked', {
                            editSaving,
                            hasEditChanges,
                            isValid: editValidation?.isValid,
                            errors: editValidation?.errors,
                            patch: editPatch
                          });
                          saveEditedEvent();
                        }}
                        disabled={editSaving || !hasEditChanges || !editValidation?.isValid}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        title={
                          !hasEditChanges
                            ? 'No changes to save'
                            : !editValidation?.isValid
                              ? `Please fix validation errors: ${Object.keys(editValidation?.errors || {}).join(', ')}`
                              : 'Save changes'
                        }
                      >
                        {editSaving ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results Tab - Admin can upload result sheets */}
            {modalTab === 'results' && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Result Sheet</h3>
                  <p className="text-gray-600 mb-4">
                    Upload Excel/CSV file with student results. System will automatically update scores and calculate winners.
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    <strong>File Format:</strong> Excel (.xlsx, .xls) or CSV with columns: studentId, name, score
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const { downloadSampleResultSheet } = await import('../../api');
                          await downloadSampleResultSheet(event.id, true);
                        } catch (error) {
                          alert('Failed to download sample sheet: ' + (error.message || 'Unknown error'));
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      📥 Download Sample Result Sheet
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Download a sample Excel file with the correct format and example data
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Result Upload Instructions</h4>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>Event must be completed or ended</li>
                    <li>Upload Excel/CSV file with student results</li>
                    <li>System will parse and update scores automatically</li>
                    <li>Winners and runners-up will be calculated automatically</li>
                    <li>Admin must validate results before they become visible to students</li>
                  </ol>
                </div>

                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const fileInput = e.target.querySelector('input[type="file"]');
                      
                      if (!fileInput.files || fileInput.files.length === 0) {
                        alert('Please select a file to upload');
                        return;
                      }

                      const uploadFormData = new FormData();
                      Array.from(fileInput.files).forEach(file => {
                        uploadFormData.append('files', file);
                      });
                      
                      const description = formData.get('description') || '';
                      if (description) {
                        uploadFormData.append('description', description);
                      }

                      try {
                        const { uploadEventResults } = await import('../../api');
                        const response = await uploadEventResults(event.id, uploadFormData);
                        
                        if (response.success) {
                          alert(`✅ Successfully uploaded ${response.data.uploadedFiles?.length || response.data.count || 0} file(s). Scores updated and winners calculated.`);
                          fileInput.value = '';
                          e.target.reset();
                          // Reload event data and analytics
                          handleViewEventDetails(event);
                          loadAnalytics(event.id);
                        } else {
                          alert('Failed to upload: ' + (response.message || 'Unknown error'));
                        }
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Failed to upload: ' + (error.message || 'Unknown error'));
                      }
                    }}
                  >
                    <div className="mb-4">
                      <label htmlFor="result-upload-files" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Result File(s)
                      </label>
                      <input
                        type="file"
                        id="result-upload-files"
                        name="files"
                        multiple
                        accept=".xlsx,.xls,.csv"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="result-upload-description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        id="result-upload-description"
                        name="description"
                        rows={2}
                        autoComplete="off"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Final results for event completion"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      📤 Upload Result Sheet
                    </button>
                  </form>
                </div>

                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">After Upload:</h4>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                    <li>System will process the file and update student scores</li>
                    <li>Winners and runners-up will be automatically calculated</li>
                    <li>Event status will change to "RESULTS_UPLOADED"</li>
                    <li>Admin must validate results to make them visible to students</li>
                    <li>After validation, event opens for next registration cycle</li>
                  </ol>
                </div>

                {/* Analytics Section */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Result Analytics & Predictions</h3>
                    <button
                      onClick={() => loadAnalytics(event.id)}
                      disabled={analyticsLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {analyticsLoading ? 'Loading...' : '🔄 Refresh'}
                    </button>
                  </div>

                  {analyticsLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Loading analytics...</p>
                    </div>
                  ) : analytics ? (
                    <div className="space-y-6">
                      {/* Statistics */}
                      {analytics.statistics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-blue-600 font-medium">Total Participants</p>
                            <p className="text-2xl font-bold text-blue-900">{analytics.statistics.totalParticipants || 0}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-sm text-green-600 font-medium">With Scores</p>
                            <p className="text-2xl font-bold text-green-900">{analytics.statistics.participantsWithScores || 0}</p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <p className="text-sm text-yellow-600 font-medium">Without Scores</p>
                            <p className="text-2xl font-bold text-yellow-900">{analytics.statistics.participantsWithoutScores || 0}</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <p className="text-sm text-purple-600 font-medium">Completion Rate</p>
                            <p className="text-2xl font-bold text-purple-900">{analytics.statistics.completionRate || '0%'}</p>
                          </div>
                        </div>
                      )}

                      {/* Winners */}
                      {analytics.winners && analytics.winners.length > 0 && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            🏆 Winners (Top 3)
                          </h4>
                          <div className="space-y-3">
                            {analytics.winners.map((winner, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-yellow-200 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                    winner.placement === 1 ? 'bg-yellow-500' : winner.placement === 2 ? 'bg-gray-400' : 'bg-orange-600'
                                  }`}>
                                    {winner.placement}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{winner.studentName}</p>
                                    {winner.studentUniqueId && (
                                      <p className="text-xs text-gray-500">ID: {winner.studentUniqueId}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">Score: {winner.score?.toFixed(2) || 'N/A'}</p>
                                  {winner.sport && (
                                    <p className="text-xs text-gray-500">{winner.sport}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Predicted Winners */}
                      {analytics.predictedWinners && analytics.predictedWinners.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            🔮 Predicted Winners
                          </h4>
                          <div className="space-y-3">
                            {analytics.predictedWinners.map((prediction, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
                                      {prediction.predictedPlacement}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">{prediction.studentName}</p>
                                      {prediction.studentUniqueId && (
                                        <p className="text-xs text-gray-500">ID: {prediction.studentUniqueId}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {prediction.currentScore !== null && (
                                      <p className="text-lg font-bold text-gray-900">Score: {prediction.currentScore?.toFixed(2) || 'N/A'}</p>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      prediction.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                      prediction.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {prediction.confidence} confidence
                                    </span>
                                    {prediction.note && (
                                      <p className="text-xs text-gray-500 mt-1">{prediction.note}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Score Statistics */}
                      {analytics.scoreStatistics && (
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">📊 Score Statistics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Minimum</p>
                              <p className="text-xl font-bold text-gray-900">{analytics.scoreStatistics.min?.toFixed(2) || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Maximum</p>
                              <p className="text-xl font-bold text-gray-900">{analytics.scoreStatistics.max?.toFixed(2) || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Average</p>
                              <p className="text-xl font-bold text-gray-900">{analytics.scoreStatistics.avg?.toFixed(2) || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Median</p>
                              <p className="text-xl font-bold text-gray-900">{analytics.scoreStatistics.median?.toFixed(2) || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ties */}
                      {analytics.ties && analytics.ties.length > 0 && (
                        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">⚠️ Tied Scores</h4>
                          <div className="space-y-2">
                            {analytics.ties.map((tie, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-orange-200">
                                <p className="font-semibold text-gray-900">
                                  Score: {tie.score?.toFixed(2)} - {tie.count} participant{tie.count !== 1 ? 's' : ''}
                                </p>
                                <div className="mt-2 text-sm text-gray-600">
                                  {tie.students.map((s, i) => (
                                    <span key={i}>
                                      {s.studentName} (Place: {s.placement || 'N/A'}){i < tie.students.length - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No Results Message */}
                      {(!analytics.winners || analytics.winners.length === 0) && 
                       (!analytics.predictedWinners || analytics.predictedWinners.length === 0) && 
                       (!analytics.statistics || analytics.statistics.participantsWithScores === 0) && (
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                          <p className="text-gray-600">No results uploaded yet. Upload a result sheet to see analytics and predictions.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                      <p className="text-gray-600">Click "Refresh" to load analytics.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Certificates Tab */}
            {modalTab === 'certificates' && (
              <div className="p-6">
                <AdminCertificateIssuance event={event} onSuccess={closeEventDetailsModal} />
              </div>
            )}

            {/* Payments Tab */}
            {modalTab === 'payments' && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Event Payments</h3>
                  <p className="text-gray-600">
                    All payment records for this event including registration fees, event fees, and other transactions.
                  </p>
                </div>

                {paymentsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <span className="text-gray-600 font-medium">Loading payments...</span>
                  </div>
                ) : payments && payments.length > 0 ? (
                  <div className="space-y-4">
                    {/* Payment Summary */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-gray-600 mb-1">Total Payments</div>
                          <div className="text-2xl font-bold text-gray-900">{payments.length}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                          <div className="text-2xl font-bold text-green-600">
                            ₹{payments.reduce((sum, p) => sum + (parseFloat(p.amount || p.value || 0)), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-gray-600 mb-1">Completed</div>
                          <div className="text-2xl font-bold text-green-600">
                            {payments.filter(p => p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID').length}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-gray-600 mb-1">Pending</div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {payments.filter(p => p.status === 'PENDING' || p.status === 'CREATED').length}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payments List */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment Details
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map((payment) => (
                              <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {payment.type || payment.description || 'Payment'}
                                  </div>
                                  {payment.userId && (
                                    <div className="text-xs text-gray-500">User ID: {payment.userId}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-mono">
                                    {payment.razorpayOrderId || payment.orderId || payment.id || '—'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-semibold text-gray-900">
                                    ₹{(parseFloat(payment.amount || payment.value || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  {payment.currency && payment.currency !== 'INR' && (
                                    <div className="text-xs text-gray-500">{payment.currency}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {new Date(payment.createdAt || payment.created_at || Date.now()).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(payment.createdAt || payment.created_at || Date.now()).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    payment.status === 'COMPLETED' || payment.status === 'SUCCESS' || payment.status === 'PAID'
                                      ? 'bg-green-100 text-green-800'
                                      : payment.status === 'PENDING' || payment.status === 'CREATED'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : payment.status === 'FAILED' || payment.status === 'CANCELLED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {payment.status || 'UNKNOWN'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">No Payments Yet</h4>
                    <p className="text-gray-600">No payment records found for this event.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-between items-center flex-shrink-0">
            <div className="text-sm text-gray-600 font-medium">
              {participants && participants.length > 0 && (
                <>
                  Total: <span className="font-bold text-gray-900">{participants.length}</span> participant{participants.length !== 1 ? 's' : ''}
                  {event.maxParticipants && (
                    <span className="ml-3 text-blue-600">
                      • <span className="font-bold">{Math.round((participants.length / event.maxParticipants) * 100)}%</span> capacity
                    </span>
                  )}
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced helper: render payment status badge with comprehensive information and edge case handling
  // Made more prominent with better visual indicators
  const renderPaymentCell = (event) => {
    try {
      const summary = getEventPaymentSummary(event);
      const status = summary?.status || 'NO_PAYMENTS';
      
      // Determine badge colors, text, and visual styling
      let badgeConfig = {
        bgColor: '',
        textColor: '',
        borderColor: '',
        badgeText: '',
        badgeIcon: '',
        pulse: false,
        shadow: false
      };
      
      switch (status) {
        case 'PAID':
          badgeConfig = {
            bgColor: 'bg-green-50',
            textColor: 'text-green-800',
            borderColor: 'border-green-400',
            badgeText: 'Payment Complete',
            badgeIcon: '✅',
            pulse: false,
            shadow: true
          };
          break;
        case 'PARTIAL':
          badgeConfig = {
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-400',
            badgeText: 'Payment Pending',
            badgeIcon: '⚠️',
            pulse: true,
            shadow: true
          };
          break;
        case 'PENDING':
          badgeConfig = {
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-800',
            borderColor: 'border-orange-400',
            badgeText: 'Payment Pending',
            badgeIcon: '⏳',
            pulse: true,
            shadow: true
          };
          break;
        default:
          badgeConfig = {
            bgColor: 'bg-gray-50',
            textColor: 'text-gray-600',
            borderColor: 'border-gray-300',
            badgeText: 'No Payments',
            badgeIcon: '—',
            pulse: false,
            shadow: false
          };
      }

      const paymentPercentage = summary?.totalAmount > 0 
        ? Math.round((summary.paidAmount / summary.totalAmount) * 100) 
        : 0;

      return (
        <div className="flex flex-col space-y-2 min-w-[180px]">
          {/* Prominent Status Badge */}
          <div className={`relative ${badgeConfig.bgColor} border-2 ${badgeConfig.borderColor} rounded-lg p-2.5 ${badgeConfig.shadow ? 'shadow-md' : 'shadow-sm'} ${badgeConfig.pulse ? 'animate-pulse' : ''} transition-all hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{badgeConfig.badgeIcon}</span>
                <span className={`font-bold text-sm ${badgeConfig.textColor}`}>
                  {badgeConfig.badgeText}
                </span>
              </div>
              {status === 'PAID' && (
                <span className="text-green-600 text-xs font-semibold">100%</span>
              )}
              {status === 'PARTIAL' && (
                <span className="text-yellow-600 text-xs font-semibold">{paymentPercentage}%</span>
              )}
            </div>
            
            {/* Progress bar for partial payments */}
            {status === 'PARTIAL' && summary?.totalAmount > 0 && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${paymentPercentage}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {/* Payment Details Card */}
          {summary && summary.totalAmount > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-2 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">Total:</span>
                <span className="font-bold text-gray-900">₹{(summary.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              {summary.paidAmount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Paid:</span>
                  <span className="font-bold text-green-700">₹{(summary.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
              {summary.orderCount > 0 && (
                <div className="pt-1 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Orders:</span>
                    <span className={`font-semibold ${status === 'PAID' ? 'text-green-700' : 'text-yellow-700'}`}>
                      {summary.paidOrderCount || 0}/{summary.orderCount || 0} paid
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col space-y-2 w-full">
          <button
            onClick={() => handleViewEventDetails(event)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 hover:shadow-md transition-all transform hover:scale-105 w-full flex items-center justify-center space-x-1"
          >
            <span>👁️</span>
            <span>View Details</span>
          </button>
            {event.uniqueId && (event.status === 'APPROVED' || event.status === 'ACTIVE') && (
              <button
                onClick={() => openShareModal(event)}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-indigo-700 hover:shadow-md transition-all transform hover:scale-105 w-full flex items-center justify-center space-x-1"
              >
                <span>🔗</span>
                <span>Share Link</span>
              </button>
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering payment cell:', error);
      // Fallback UI on error
      return (
        <div className="flex flex-col space-y-2 min-w-[180px]">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-2.5 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">❌</span>
              <span className="font-bold text-sm text-red-800">Error Loading</span>
            </div>
          </div>
          <button
            onClick={() => handleViewEventDetails(event)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors w-full"
          >
            👁️ View Details
          </button>
        </div>
      );
    }
  };

  return (
    <>
    {/* Toast stack */}
    <div className="fixed top-4 right-4 z-[60] space-y-2 w-[360px] max-w-[90vw]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`border rounded-xl shadow-lg p-4 ${toastColors[t.type] || toastColors.info}`}
        >
          <div className="font-semibold text-sm">{t.title}</div>
          {t.message ? <div className="text-sm mt-1 opacity-90">{t.message}</div> : null}
        </div>
      ))}
    </div>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div id="assignment-section" ref={assignmentRef} className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Events Management</h1>
              <p className="text-gray-600 mt-1">
                Manage all events, approve/reject submissions, assign events, set permissions, and issue certificates
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/admin/settings/global-payments"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm flex items-center space-x-2"
              >
                <span>💰</span>
                <span>Payment Settings</span>
              </Link>
            <Link
              to="/admin/dashboard"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            </div>
          </div>
        </div>

        {/* Global payment settings quick edit */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Payment Settings (Quick)</h3>
          <form onSubmit={handleGlobalSettingsSave} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label htmlFor="global-payment-per-student-charge" className="block text-sm font-medium text-gray-700 mb-1">
                Per-Student Base Charge (₹)
              </label>
              <input
                type="number"
                id="global-payment-per-student-charge"
                name="perStudentBaseCharge"
                value={globalPaymentSettings.perStudentBaseCharge}
                onChange={(e) =>
                  setGlobalPaymentSettings((prev) => ({
                    ...prev,
                    perStudentBaseCharge: e.target.value
                  }))
                }
                autoComplete="off"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label htmlFor="global-payment-default-event-fee" className="block text-sm font-medium text-gray-700 mb-1">
                Default Event Fee (₹) — fallback
              </label>
              <input
                type="number"
                id="global-payment-default-event-fee"
                name="defaultEventFee"
                value={globalPaymentSettings.defaultEventFee}
                onChange={(e) =>
                  setGlobalPaymentSettings((prev) => ({
                    ...prev,
                    defaultEventFee: e.target.value
                  }))
                }
                autoComplete="off"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coordinator Subscription Fee (₹)
              </label>
              <input
                type="number"
                value={globalPaymentSettings.coordinatorSubscriptionFee}
                onChange={(e) =>
                  setGlobalPaymentSettings((prev) => ({
                    ...prev,
                    coordinatorSubscriptionFee: e.target.value
                  }))
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0"
                step="0.01"
                placeholder="One-time registration fee"
              />
              <p className="text-xs text-gray-500 mt-1">One-time registration fee</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={savingGlobal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60"
              >
                {savingGlobal ? 'Saving...' : 'Save'}
              </button>
              {globalMessage && <span className="text-green-600 text-sm">{globalMessage}</span>}
              {globalError && <span className="text-red-600 text-sm">{globalError}</span>}
            </div>
            <div className="text-right">
              <Link
                to="/admin/settings/global-payments"
                className="inline-flex items-center text-sm text-indigo-700 hover:text-indigo-900 underline"
              >
                Full settings
              </Link>
            </div>
          </form>
        </div>

        {/* Assignment and Permissions - Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Event Management</h3>
              <p className="text-sm text-gray-600 mt-1">Assign events to users and manage permissions</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setAssignmentForm({ eventId: '', userId: '', role: 'COORDINATOR' });
                  setAssignmentEventIdSearch('');
                  setUserUniqueIdSearch('');
                  setUserSearch('');
                  setUserSearchResult(null);
                  setExistingAssignments([]);
                  setAssignmentMsg('');
                  setAssignmentErr('');
                  setShowAssignmentModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>🏷️</span>
                <span>Assign Event Vendor (Incharge)</span>
              </button>
              <button
                onClick={() => {
                  setPermissionForm({
                    eventId: '',
                    userId: '',
                    resultUpload: false,
                    studentManagement: false,
                    certificateManagement: false,
                    feeManagement: false
                  });
                  setPermissionEventIdSearch('');
                  setPermissionMsg('');
                  setPermissionErr('');
                  setShowPermissionModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>🔐</span>
                <span>Incharge Permissions</span>
              </button>
            </div>
          </div>
        </div>

        {/* Assignment Modal */}
        {showAssignmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-xl flex-shrink-0 flex items-center justify-between">
                <h3 className="text-xl font-bold">Assign Event Vendor (Incharge)</h3>
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setAssignmentForm({ eventId: '', userId: '', role: 'COORDINATOR' });
                    setAssignmentEventIdSearch('');
                    setUserUniqueIdSearch('');
                    setUserSearch('');
                    setUserSearchResult(null);
                    setExistingAssignments([]);
                    setAssignmentMsg('');
                    setAssignmentErr('');
                    setInchargeInvites([]);
                    setInviteMsg('');
                    setInviteErr('');
                    setBulkInviteOpen(false);
                    setBulkInviteText('');
                    setBulkInviteRows([]);
                    setBulkInviteFileName('');
                    setBulkInvitePrepared([]);
                    setBulkInviteStats(null);
                    setBulkInviteInvalidEmails([]);
                    setBulkInviting(false);
                    setBulkInviteReport(null);
                    setInchargeInviteForm({
                      email: '',
                      isPointOfContact: false,
                      resultUpload: false,
                      studentManagement: false,
                      certificateManagement: false,
                      feeManagement: false
                    });
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {/* Assignment Form Content */}
                <div ref={assignmentRef}>
                  {/* Existing Assignments */}
                  {assignmentForm.eventId && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Current Assignments</h4>
                        {loadingAssignments && <span className="text-xs text-gray-500">Loading...</span>}
                      </div>
                      {existingAssignments.length > 0 ? (
                        <div className="space-y-2">
                          {existingAssignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-start justify-between gap-3 p-2 bg-white rounded border border-gray-200">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {assignment.user?.name || assignment.user?.email || 'Unknown User'}
                                  </div>
                                  {assignment.role === 'INCHARGE' && assignment.isPointOfContact ? (
                                    <span className="inline-flex text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                                      POC
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Role: {assignment.role} • {assignment.user?.email}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {assignment.role === 'INCHARGE' && !assignment.isPointOfContact ? (
                                  <button
                                    type="button"
                                    onClick={() => handleMakePoc(assignment)}
                                    className="text-xs text-indigo-700 hover:text-indigo-900 font-medium"
                                  >
                                    Make POC
                                  </button>
                                ) : null}
                              <button
                                type="button"
                                onClick={() => handleRemoveAssignment(assignmentForm.eventId, assignment.id)}
                                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                              >
                                Remove
                              </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No assignments yet. Add one below.</p>
                      )}
                    </div>
                  )}
               
              <div className="space-y-3">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event <span className="text-gray-500 text-xs">(or search by Event ID)</span>
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Type Event ID/Unique ID to auto-select"
                          value={assignmentEventIdSearch}
                          onChange={(e) => handleEventIdSearch(e.target.value, 'assignment')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                  <select
                    value={assignmentForm.eventId}
                          onChange={(e) => {
                            setAssignmentForm(prev => ({ ...prev, eventId: e.target.value }));
                            setAssignmentEventIdSearch('');
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    name="eventId"
                  >
                          <option value="">Select event from dropdown</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                              {ev.name} ({ev.sport}) — {ev.city} {ev.uniqueId ? `[${ev.uniqueId}]` : ''}
                      </option>
                    ))}
                  </select>
                        {assignmentForm.eventId && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                            ✓ Selected: {events.find(e => e.id === assignmentForm.eventId)?.name || 'Event'}
                          </div>
                        )}
                      </div>
                </div>

                {/* Incharge (Event Vendor) Invite */}
                {assignmentForm.eventId && (
                  <div className="p-4 border rounded-lg bg-indigo-50 border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                <div>
                        <h4 className="text-sm font-semibold text-indigo-900">Invite Event Vendor (Incharge)</h4>
                        <p className="text-xs text-indigo-800">
                          Admin assigns by <strong>email</strong>. The invite email contains a registration link for KYC/vendor details and password setup.
                        </p>
                      </div>
                      {loadingInvites ? <span className="text-xs text-indigo-800">Loading...</span> : null}
                    </div>

                    <form onSubmit={handleInviteSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-indigo-900 mb-1">Incharge Email</label>
                    <input
                            type="email"
                            value={inchargeInviteForm.email}
                            onChange={(e) => setInchargeInviteForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="vendor.person@example.com"
                            className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                          </div>

                        <label className="flex items-center gap-2 text-xs text-indigo-900">
                        <input
                            type="checkbox"
                            checked={!!inchargeInviteForm.isPointOfContact}
                            onChange={(e) => setInchargeInviteForm(prev => ({ ...prev, isPointOfContact: e.target.checked }))}
                          />
                          Mark as Point of Contact (POC)
                        </label>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-indigo-900 mb-2">Permissions for this incharge (per-event)</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className="flex items-center gap-2 text-xs text-indigo-900">
                            <input
                              type="checkbox"
                              checked={!!inchargeInviteForm.resultUpload}
                              onChange={(e) => setInchargeInviteForm(prev => ({ ...prev, resultUpload: e.target.checked }))}
                            />
                            Result Upload
                          </label>
                          <label className="flex items-center gap-2 text-xs text-indigo-900">
                            <input
                              type="checkbox"
                              checked={!!inchargeInviteForm.studentManagement}
                              onChange={(e) => setInchargeInviteForm(prev => ({ ...prev, studentManagement: e.target.checked }))}
                            />
                            Student Management
                          </label>
                          <label className="flex items-center gap-2 text-xs text-indigo-900">
                            <input
                              type="checkbox"
                              checked={!!inchargeInviteForm.certificateManagement}
                              onChange={(e) => setInchargeInviteForm(prev => ({ ...prev, certificateManagement: e.target.checked }))}
                            />
                            Certificate Management
                          </label>
                          <label className="flex items-center gap-2 text-xs text-indigo-900">
                            <input
                              type="checkbox"
                              checked={!!inchargeInviteForm.feeManagement}
                              onChange={(e) => setInchargeInviteForm(prev => ({ ...prev, feeManagement: e.target.checked }))}
                            />
                            Fee Management
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={sendingInvite}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          {sendingInvite ? 'Sending...' : 'Send Invite'}
                        </button>
                        {inviteMsg ? (
                          <div className="text-green-700 text-sm bg-green-50 p-2 rounded">{inviteMsg}</div>
                        ) : null}
                        {inviteErr ? (
                          <div className="text-red-700 text-sm bg-red-50 p-2 rounded">{inviteErr}</div>
                        ) : null}
                          </div>

                      {/* Non-production fallback: show manual registration link */}
                      {inviteDebugLink ? (
                        <div className="text-xs bg-white border border-indigo-200 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-indigo-900">Registration link</div>
                      <button
                        type="button"
                              onClick={() => copyToClipboard(inviteDebugLink)}
                              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                      >
                              Copy
                      </button>
                  </div>
                          <div className="text-gray-700 break-all mt-2 font-mono">{inviteDebugLink}</div>
                          <div className="text-gray-500 mt-2">
                            This appears only when email sending fails in non-production.
                </div>
                </div>
                      ) : null}
                    </form>

                    {/* Bulk invite */}
                    <div className="mt-3 border-t border-indigo-200 pt-3">
                      <button
                        type="button"
                        onClick={() => setBulkInviteOpen((v) => !v)}
                        className="text-xs font-semibold text-indigo-900 hover:text-indigo-700"
                      >
                        {bulkInviteOpen ? 'Hide Bulk Invite' : 'Bulk Invite Incharges (Upload list)'}
                      </button>

                      {bulkInviteOpen ? (
                        <div className="mt-2 bg-white border border-indigo-200 rounded-lg p-3">
                          <div className="text-xs text-gray-700">
                            Upload CSV or paste emails (comma/newline separated). CSV rows can optionally override permissions per email.
                </div>
                          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                  <button
                              type="button"
                              onClick={downloadInchargeInviteTemplateCsv}
                              className="px-3 py-2 rounded-md border text-xs font-semibold"
                  >
                              Download CSV Template
                  </button>
                            <label className="text-xs text-gray-700 flex items-center gap-2">
                              <input
                                type="file"
                                accept=".csv,text/csv"
                                disabled={bulkInviting}
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  setInviteErr('');
                                  setBulkInviteReport(null);
                                  setBulkInviteFileName(f.name || 'upload.csv');
                                  setBulkInvitePrepared([]);
                                  setBulkInviteStats(null);
                                  setBulkInviteInvalidEmails([]);
                                  try {
                                    const text = await f.text();
                                    const parsed = parseInviteCsv(text);
                                    if (parsed.error) {
                                      setInviteErr(parsed.error);
                                      setBulkInviteRows([]);
                                      return;
                                    }
                                    setBulkInviteRows(parsed.rows);
                                    setBulkInviteText(parsed.rows.map(r => r.email).join('\n'));
                                    const { invalidEmails, ready } = verifyBulkInvite(parsed.rows, parsed.rows.length);
                                    if (invalidEmails.length) {
                                      pushToast('warning', 'CSV loaded with issues', `Loaded ${ready.length} valid email(s). Invalid: ${invalidEmails.length}.`);
                                    } else {
                                      pushToast('success', 'CSV verified', `Loaded ${ready.length} valid email(s) from ${f.name}.`);
                                    }
                                  } catch (err) {
                                    const msg = getErrorMessage(err, 'Failed to read CSV.');
                                    setInviteErr(msg);
                                    setBulkInviteRows([]);
                                  }
                                }}
                              />
                              <span>{bulkInviteFileName ? `Loaded: ${bulkInviteFileName}` : 'Choose CSV file'}</span>
                            </label>
                        </div>
                          <textarea
                            value={bulkInviteText}
                            onChange={(e) => setBulkInviteText(e.target.value)}
                            rows={4}
                            className="mt-2 w-full px-3 py-2 border rounded-md text-sm"
                            placeholder={`a@vendor.com\nb@vendor.com\nc@vendor.com`}
                            disabled={bulkInviting}
                          />

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <div className="text-xs text-gray-600">
                              {bulkInviteStats ? (
                                <span>
                                  Raw: <strong>{bulkInviteStats.raw}</strong> • Deduped: <strong>{bulkInviteStats.deduped}</strong> • Ready: <strong>{bulkInviteStats.ready}</strong> • Invalid: <strong>{bulkInviteStats.invalid}</strong>
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                // Verify from textarea (email-only) if no CSV rows are loaded
                                if (bulkInviteRows.length) {
                                  verifyBulkInvite(bulkInviteRows, bulkInviteRows.length);
                                } else {
                                  const emails = parseBulkInviteEmails(bulkInviteText);
                                  const rows = emails.map(email => ({ email, isPointOfContact: false, permissions: {} }));
                                  setBulkInviteRows(rows);
                                  verifyBulkInvite(rows, emails.length);
                                }
                              }}
                              className="px-3 py-2 rounded-md border text-xs font-semibold"
                              disabled={bulkInviting}
                            >
                              Verify & Preview
                            </button>
                          </div>

                          {bulkInviteStats?.invalid ? (
                            bulkInviteStats.invalid > 0 ? (
                              <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div>Some emails are invalid. Fix/remove them before sending.</div>
                                  <button
                                    type="button"
                                    onClick={removeAllInvalidBulkInviteEmails}
                                    className="px-2 py-1 rounded border text-[11px] font-semibold"
                                  >
                                    Remove all invalid
                                  </button>
                                </div>
                                {bulkInviteInvalidEmails?.length ? (
                                  <div className="mt-2 space-y-1">
                                    {bulkInviteInvalidEmails.slice(0, 12).map((em) => (
                                      <div key={em} className="flex items-center justify-between gap-2">
                                        <div className="break-all">{em}</div>
                                        <button
                                          type="button"
                                          onClick={() => removeBulkInviteEmail(em)}
                                          className="px-2 py-1 rounded border text-[11px] font-semibold"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    {bulkInviteInvalidEmails.length > 12 ? (
                                      <div className="text-gray-600">…and {bulkInviteInvalidEmails.length - 12} more.</div>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            ) : null
                          ) : null}

                          {bulkInvitePrepared?.length ? (
                            <div className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded p-2">
                              <div className="font-semibold text-gray-900 mb-1">Ready to invite (preview)</div>
                              <div className="space-y-1">
                                {bulkInvitePrepared.slice(0, 12).map((r) => (
                                  <div key={r.email} className="flex items-center justify-between gap-2">
                                    <div className="break-all">{r.email}</div>
                                    <button
                                      type="button"
                                      onClick={() => removeBulkInviteEmail(r.email)}
                                      className="px-2 py-1 rounded border text-[11px] font-semibold"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                {bulkInvitePrepared.length > 12 ? (
                                  <div className="text-gray-600">…and {bulkInvitePrepared.length - 12} more.</div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <div className="text-xs text-gray-600">
                              {bulkInviteReport ? (
                                <span>
                                  Total: <strong>{bulkInviteReport.total}</strong> • Sent: <strong>{bulkInviteReport.sent}</strong> • Assigned: <strong>{bulkInviteReport.assigned}</strong> • Failed: <strong>{bulkInviteReport.failed}</strong>
                                </span>
                              ) : null}
                        </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setBulkInviteText('');
                                  setBulkInviteRows([]);
                                  setBulkInviteFileName('');
                                  setBulkInviteReport(null);
                                  setBulkInvitePrepared([]);
                                  setBulkInviteStats(null);
                                  setBulkInviteInvalidEmails([]);
                                }}
                                className="px-3 py-2 rounded-md border text-xs font-semibold"
                                disabled={bulkInviting}
                              >
                                Clear
                              </button>
                              <button
                                type="button"
                                onClick={handleBulkInvite}
                                className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-60"
                                disabled={bulkInviting || !bulkInvitePrepared.length}
                              >
                                {bulkInviting ? 'Inviting...' : 'Send Bulk Invites'}
                              </button>
                            </div>
                          </div>

                          {bulkInviteReport?.failed ? (
                            <div className="mt-2 text-xs">
                              {bulkInviteReport.failed > 0 ? (
                                <div className="text-red-700">
                                  {bulkInviteReport.rows.filter(r => !r.ok).slice(0, 6).map((r) => (
                                    <div key={r.email} className="break-all">
                                      {r.email}: {r.message}
                                    </div>
                                  ))}
                                  {bulkInviteReport.failed > 6 ? (
                                    <div className="text-gray-500 mt-1">…and more.</div>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="text-green-700">All invites processed successfully.</div>
                              )}
                              {bulkInviteReport?.rows?.length ? (
                                <div className="mt-2">
                                  <button
                                    type="button"
                                    onClick={downloadBulkInviteReportCsv}
                                    className="px-3 py-2 rounded-md border text-xs font-semibold"
                                  >
                                    Download Report CSV
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                 
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-indigo-900 mb-2">Invites</div>
                      {inchargeInvites.length === 0 ? (
                        <div className="text-xs text-indigo-900">No invites yet.</div>
                      ) : (
                        <div className="space-y-2">
                          {inchargeInvites.map((inv) => (
                            <div key={inv.id} className="flex items-start justify-between gap-3 p-2 bg-white rounded border border-indigo-100">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {inv.email}{' '}
                                  {inv.isPointOfContact ? (
                                    <span className="ml-2 inline-flex text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                                      POC
                                    </span>
                                  ) : null}
                </div>
                                <div className="text-xs text-gray-600">
                                  Status:{' '}
                                  {inv.revokedAt ? 'REVOKED' : inv.usedAt ? 'USED' : inv.isExpired ? 'EXPIRED' : 'PENDING'} •
                                  Expires: {inv.expiresAt ? new Date(inv.expiresAt).toLocaleString('en-IN') : '-'}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {inv.permissions?.resultUpload ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">Result Upload</span> : null}
                                  {inv.permissions?.studentManagement ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">Student Mgmt</span> : null}
                                  {inv.permissions?.certificateManagement ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">Certificates</span> : null}
                                  {inv.permissions?.feeManagement ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">Fees</span> : null}
                                  {!inv.permissions?.resultUpload && !inv.permissions?.studentManagement && !inv.permissions?.certificateManagement && !inv.permissions?.feeManagement ? (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">No permissions</span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                  <button
                                  type="button"
                                  onClick={() => handleResendInvite(inv.id)}
                                  disabled={!!inv.usedAt || !!inv.revokedAt}
                                  className="text-xs text-indigo-700 hover:text-indigo-900 disabled:opacity-50"
                                >
                                  Resend
                  </button>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeInvite(inv.id)}
                                  disabled={!!inv.usedAt || !!inv.revokedAt}
                                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                                >
                                  Revoke
                                </button>
                        </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                </div>
                )}
              </div>
            </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end flex-shrink-0">
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setAssignmentForm({ eventId: '', userId: '', role: 'COORDINATOR' });
                    setAssignmentEventIdSearch('');
                    setUserUniqueIdSearch('');
                    setUserSearch('');
                    setUserSearchResult(null);
                    setExistingAssignments([]);
                    setAssignmentMsg('');
                    setAssignmentErr('');
                    setInchargeInvites([]);
                    setInviteMsg('');
                    setInviteErr('');
                    setBulkInviteOpen(false);
                    setBulkInviteText('');
                    setBulkInviteRows([]);
                    setBulkInviteFileName('');
                    setBulkInvitePrepared([]);
                    setBulkInviteStats(null);
                    setBulkInviteInvalidEmails([]);
                    setBulkInviting(false);
                    setBulkInviteReport(null);
                    setInchargeInviteForm({
                      email: '',
                      isPointOfContact: false,
                      resultUpload: false,
                      studentManagement: false,
                      certificateManagement: false,
                      feeManagement: false
                    });
                  }}
                  className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-xl flex-shrink-0 flex items-center justify-between">
                <h3 className="text-xl font-bold">Incharge Permissions</h3>
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    setPermissionForm({
                      eventId: '',
                      userId: '',
                      resultUpload: false,
                      studentManagement: false,
                      certificateManagement: false,
                      feeManagement: false
                    });
                    setPermissionLoading(false);
                    setPermissionEventIdSearch('');
                    setPermissionMsg('');
                    setPermissionErr('');
                    setPermissionIncharges([]);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event <span className="text-gray-500 text-xs">(or search by Event ID)</span>
                    </label>
                    <div className="space-y-2">
                  <input
                    type="text"
                        placeholder="Type Event ID/Unique ID to auto-select"
                        value={permissionEventIdSearch}
                        onChange={(e) => handleEventIdSearch(e.target.value, 'permission')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <select
                        value={permissionForm.eventId}
                        onChange={async (e) => {
                          const eid = e.target.value;
                          setPermissionForm(prev => ({ ...prev, eventId: eid }));
                          setPermissionEventIdSearch('');
                          setPermissionIncharges([]);
                          if (eid) await loadAllInchargePermissionsForEvent(eid);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select event from dropdown</option>
                        {events.map(ev => (
                          <option key={ev.id} value={ev.id}>
                            {ev.name} ({ev.sport}) — {ev.city} {ev.uniqueId ? `[${ev.uniqueId}]` : ''}
                          </option>
                        ))}
                      </select>
                      {permissionForm.eventId && (
                        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                          ✓ Selected: {events.find(e => e.id === permissionForm.eventId)?.name || 'Event'}
                        </div>
                      )}
                    </div>
                </div>
                  {permissionErr ? (
                    <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{permissionErr}</div>
                  ) : null}
                  {permissionLoading ? (
                    <div className="text-xs text-blue-600">Loading incharge permissions…</div>
                  ) : null}

                  {permissionForm.eventId ? (
                    permissionIncharges.length === 0 && !permissionLoading ? (
                      <div className="p-3 bg-gray-50 border rounded text-sm text-gray-700">
                        No incharge assigned to this event yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {permissionIncharges.map((row) => (
                          <div key={row.userId} className="p-3 border rounded-lg bg-white">
                            <div className="flex items-start justify-between gap-3">
                <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {row.label} {row.isPointOfContact ? <span className="ml-2 text-xs font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">POC</span> : null}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {row.email ? row.email : null} {row.uniqueId ? <>• <span className="font-mono">{row.uniqueId}</span></> : null}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => saveInchargePermissionsRow(permissionForm.eventId, row.userId)}
                                disabled={row.saving}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-xs font-semibold disabled:opacity-60"
                              >
                                {row.saving ? 'Saving…' : 'Save'}
                              </button>
                </div>

                            <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                                  checked={!!row.permissions?.resultUpload}
                                  onChange={(e) => togglePermission(row.userId, 'resultUpload', e.target.checked)}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>Result Upload</span>
                  </label>
                  <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                                  checked={!!row.permissions?.studentManagement}
                                  onChange={(e) => togglePermission(row.userId, 'studentManagement', e.target.checked)}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>Student Management</span>
                  </label>
                  <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                                  checked={!!row.permissions?.certificateManagement}
                                  onChange={(e) => togglePermission(row.userId, 'certificateManagement', e.target.checked)}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>Certificate Management</span>
                  </label>
                  <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                                  checked={!!row.permissions?.feeManagement}
                                  onChange={(e) => togglePermission(row.userId, 'feeManagement', e.target.checked)}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>Fee Management</span>
                  </label>
                </div>

                            {row.msg ? (
                              <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">{row.msg}</div>
                            ) : null}
                            {row.error ? (
                              <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{row.error}</div>
                            ) : null}
                      </div>
                        ))}
                      </div>
                    )
                  ) : null}
                 
                  {/* Info Note */}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <strong>Important:</strong> These permissions are saved per <strong>incharge person</strong> for this event.
                      Assign an incharge first, then edit each person’s permissions here.
                    </p>
                </div>
                </div>
            </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-end flex-shrink-0">
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    setPermissionForm({
                      eventId: '',
                      userId: '',
                      resultUpload: false,
                      studentManagement: false,
                      certificateManagement: false,
                      feeManagement: false
                    });
                    setPermissionEventIdSearch('');
                    setPermissionMsg('');
                    setPermissionErr('');
                  }}
                  className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Close
                </button>
          </div>
        </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="ABOUT TO START">About to Start</option>
                <option value="ONGOING">Ongoing</option>
                <option value="ENDED">Ended</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
              <select
                value={filters.sport}
                onChange={(e) => handleFilterChange('sport', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sports</option>
                <option value="Football">Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Tennis">Tennis</option>
                <option value="Cricket">Cricket</option>
                <option value="Athletics">Athletics</option>
                <option value="Swimming">Swimming</option>
                <option value="Badminton">Badminton</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredEvents.length} of {events.length} events
            </p>
            <button
              onClick={fetchAllEvents}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 max-w-md mx-auto">
                <div className="text-red-600 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Events</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={fetchAllEvents}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Event</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Sport</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Level</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Coach</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>💳 Payment Status</span>
                        <span className="text-xs text-gray-500 font-normal">(Click to view)</span>
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <button
                            onClick={() => handleViewEventDetails(event)}
                            className="font-medium text-gray-900 hover:text-blue-600 hover:underline text-left transition-colors"
                          >
                            {event.name || event.title}
                          </button>
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => handleEditEvent(event)}
                              className="inline-flex items-center text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-2 py-1 transition-colors"
                              title="Edit event details"
                            >
                              ✏️ Edit
                            </button>
                          </div>
                          {event.uniqueId && (
                            <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                              ID: {event.uniqueId}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            Max: {event.maxParticipants} participants
                          </div>
                          <div className="text-sm text-gray-500">
                            Created: {new Date(event.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {event.sport}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const lvl = (event.level || 'DISTRICT').toString().toUpperCase();
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
                            <span className={`px-2 py-1 ${cls} rounded-full text-xs font-medium`}>
                              {label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          {event.coach?.user?.uniqueId ? (
                            <Link
                              to={`/admin/users/${event.coach.user.uniqueId}`}
                              className="font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                            >
                              {event.coach.name}
                            </Link>
                          ) : (
                            <div className="font-medium text-gray-900">{event.coach?.name}</div>
                          )}
                          {event.coach?.user?.uniqueId && (
                            <div className="text-xs font-mono text-gray-600 mt-1">
                              UID: {event.coach.user.uniqueId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(event.startDate).toLocaleDateString()}
                        {event.endDate && (
                          <div className="text-sm text-gray-500">
                            to {new Date(event.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900">{event.venue}</div>
                        <div className="text-sm text-gray-500">{event.city}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getDynamicEventStatus(event))}`}>
                          {getDynamicEventStatus(event)}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="min-w-[200px]">
                          {renderPaymentCell(event)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-2">
                          {/* Moderation / Assign Actions */}
                          <div className="flex space-x-1 flex-wrap">
                            {event.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleModerateEvent(event.id, 'approve')}
                                  disabled={moderatingEventId === event.id}
                                  className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                  {moderatingEventId === event.id ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleModerateEvent(event.id, 'reject')}
                                  disabled={moderatingEventId === event.id}
                                  className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            
                            {event.status === 'APPROVED' && (
                              <button
                                onClick={() => handleModerateEvent(event.id, 'suspend')}
                                disabled={moderatingEventId === event.id}
                                className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                              >
                                Suspend
                              </button>
                            )}
                            
                            {(event.status === 'SUSPENDED' || event.status === 'REJECTED') && (
                              <button
                                onClick={() => handleModerateEvent(event.id, 'restart')}
                                disabled={moderatingEventId === event.id}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                Restart
                              </button>
                            )}

                            {/* Quick Assign button */}
                            <button
                              type="button"
                              onClick={() => handleAssignClick(event.id)}
                              className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-indigo-700 transition-colors"
                            >
                              Assign
                            </button>
                            {/* Quick Incharge Permissions button (only when incharge assigned) */}
                            {(() => {
                              const incharges = eventIncharges[event.id] || [];
                              if (!incharges.length) return null;
                              return (
                            <button
                              type="button"
                                  onClick={() => handlePermissionClick(event.id)}
                              className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                                  title="Edit permissions for assigned incharges"
                            >
                                  Incharge Permissions
                            </button>
                              );
                            })()}
                          </div>

                          {/* Certificate Action - Only show when event has ended */}
                          {(() => {
                            const dynamicStatus = getDynamicEventStatus(event);
                            const eventHasEnded = dynamicStatus === 'ENDED';
                            
                            if (!eventHasEnded) return null;
                            
                            return (
                              <Link
                                to={`/admin/event/${event.uniqueId || event.id}/certificates`}
                                className="bg-teal-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-teal-700 transition-colors inline-flex items-center justify-center"
                              >
                                🎓 Issue Certificates
                              </Link>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📅</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h4>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={eventDetailsModal.isOpen}
        onClose={closeEventDetailsModal}
        event={eventDetailsModal.event}
        participants={eventDetailsModal.participants}
        loading={eventDetailsModal.loading}
        payments={eventDetailsModal.payments}
        paymentsLoading={eventDetailsModal.paymentsLoading}
      />

      {/* Share Link Modal */}
      {shareModal.isOpen && shareModal.event && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Share Event</h2>
              <button
                onClick={closeShareModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {getShareableLink(shareModal.event) ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shareable Link:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getShareableLink(shareModal.event)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => copyLinkToClipboard(shareModal.event)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share via Email (comma-separated):
                  </label>
                  <textarea
                    value={shareModal.emails}
                    onChange={(e) => setShareModal(prev => ({ ...prev, emails: e.target.value }))}
                    placeholder="email1@example.com, email2@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter email addresses separated by commas
                  </p>
                </div>

                {shareModal.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    {shareModal.error}
                  </div>
                )}

                {shareModal.success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
                    {shareModal.success}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleShareViaEmail}
                    disabled={shareModal.loading || !shareModal.emails.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {shareModal.loading ? 'Sending...' : 'Send Email'}
                  </button>
                  <button
                    onClick={closeShareModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">This event does not have a shareable link yet.</p>
                <button
                  onClick={closeShareModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminEventsManagement;
