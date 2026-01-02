// Admin: Get all users with filters, pagination, search
export const getAllUsers = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Global payment settings
export const getGlobalPaymentSettings = async () => {
  try {
    const response = await api.get('/api/admin/settings/global-payments');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateGlobalPaymentSettings = async (payload) => {
  try {
    const response = await api.put('/api/admin/settings/global-payments', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all events with fee information
export const getEventsFeesOverview = async () => {
  try {
    const response = await api.get('/api/admin/events/fees-overview');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update individual event fee
export const updateEventFee = async (eventId, payload) => {
  try {
    const response = await api.put(`/api/admin/events/${eventId}/fee`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Event assignments (Admin)
export const getEventAssignments = async (eventId) => {
  try {
    const response = await api.get(`/api/admin/events/${eventId}/assignments`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateEventAssignments = async (eventId, assignments, mode = 'add') => {
  try {
    const response = await api.put(`/api/admin/events/${eventId}/assignments`, { assignments, mode });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Event Incharge (Event Vendor) invites (Admin)
export const createEventInchargeInvite = async (eventId, payload) => {
  try {
    const response = await api.post(`/api/admin/events/${eventId}/incharge-invites`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getEventInchargeInvites = async (eventId) => {
  try {
    const response = await api.get(`/api/admin/events/${eventId}/incharge-invites`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const revokeEventInchargeInvite = async (eventId, inviteId) => {
  try {
    const response = await api.delete(`/api/admin/events/${eventId}/incharge-invites/${inviteId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const resendEventInchargeInvite = async (eventId, inviteId) => {
  try {
    const response = await api.post(`/api/admin/events/${eventId}/incharge-invites/${inviteId}/resend`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Event Incharge registration (Public)
export const validateEventInchargeInvite = async (token) => {
  try {
    const response = await api.get('/api/event-incharge/invites/validate', { params: { token } });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const registerEventInchargeFromInvite = async (payload) => {
  try {
    const response = await api.post('/api/event-incharge/register', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getEventInchargeAssignedEvents = async () => {
  try {
    const response = await api.get('/api/event-incharge/me/assigned-events');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get user's assigned events
export const getMyAssignedEvents = async () => {
  try {
    const response = await api.get('/api/admin/users/me/assigned-events');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Backwards-compatible helpers used by older dashboards.
 * Normalizes `/api/admin/users/me/assigned-events` (array of assignments)
 * into `{ data: { events: [...] } }`.
 */
export const getAssignedEvents = async (params = {}) => {
  try {
    // Endpoint does not paginate today, but accept params for compatibility.
    const response = await api.get('/api/admin/users/me/assigned-events', { params });
    const payload = response.data;
    if (payload?.success && Array.isArray(payload?.data)) {
      const events = payload.data
        .map((a) => ({
          ...(a.event || {}),
          assignmentRole: a.role,
          permissions: a.permissions || null,
          hasPermissions: !!a.hasPermissions
        }))
        .filter((e) => e.id);
      return { ...payload, data: { events } };
    }
    return payload;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Backwards-compatible fee updater (uses event fee settings endpoint)
export const updateAssignedEventFee = async (eventId, eventFee) => {
  try {
    const response = await api.put(`/api/events/${eventId}/fees`, {
      feeMode: 'EVENT',
      eventFee: Number(eventFee) || 0
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Event permissions (Admin)
export const updateEventPermissions = async (eventId, permissions) => {
  try {
    const response = await api.put(`/api/admin/events/${eventId}/permissions`, { permissions });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Verify the logged-in user's permission for a specific event (works for any authenticated user)
export const verifyEventPermission = async (eventId, permissionKey) => {
  try {
    const response = await api.get(`/api/admin/events/${eventId}/verify-permission/${permissionKey}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin: Incharge (per-user) permissions
export const getEventInchargePermissions = async (eventId, userId) => {
  try {
    const response = await api.get(`/api/admin/events/${eventId}/incharge-permissions/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateEventInchargePermissions = async (eventId, userId, permissions) => {
  try {
    const response = await api.put(`/api/admin/events/${eventId}/incharge-permissions/${userId}`, permissions);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin: Get single user details by uniqueId
export const getUserByUniqueId = async (uniqueId) => {
  try {
    const response = await api.get(`/api/admin/users/${uniqueId}/details`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
import axios from 'axios';

const resolveBackendBaseUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length) return envUrl.trim();

  // In production, default to same-origin so reverse proxies like Nginx/Apache can route `/api/*`.
  if (import.meta.env.PROD && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // Local dev fallback
  return 'http://localhost:5000';
};

// Debug function to help diagnose connection issues
window.debugBackendConnection = () => {
  const backendUrl = resolveBackendBaseUrl();
  console.log('🔍 Backend Connection Debug Info:');
  console.log('  Backend URL:', backendUrl);
  console.log('  Environment:', import.meta.env.MODE);
  console.log('  All VITE env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

  // Test multiple possible backend URLs
  const possibleUrls = [
    backendUrl,
    // Auto-detect alternatives based on current location
    `${window.location.protocol}//${window.location.hostname}:5000`,
    `${window.location.protocol}//${window.location.hostname}:3001`,
    `${window.location.protocol}//${window.location.hostname}:8000`,
    'http://localhost:5000'
  ];

  console.log('🔍 Testing possible backend URLs...');

  possibleUrls.forEach(url => {
    fetch(`${url}/health`, {
      method: 'GET',
      timeout: 5000
    })
      .then(response => {
        if (response.ok) {
          console.log(`✅ Backend found at: ${url}`);
          return response.text();
        } else {
          console.log(`❌ Backend at ${url} responded with error:`, response.status);
        }
      })
      .then(data => {
        if (data) console.log(`✅ Response from ${url}:`, data);
      })
      .catch(error => {
        console.log(`❌ Cannot reach backend at ${url}:`, error.message);
      });
  });

  // Show fix instructions
  setTimeout(() => {
    console.log('💡 If no backend found, try these solutions:');
    console.log('  1. SSH to server: ssh root@160.187.22.41');
    console.log('  2. Start backend: cd ~/stairs-new/backend && npm run dev');
    console.log('  3. Check PM2: pm2 list');
    console.log('  4. Check ports: netstat -tlnp | grep LISTEN');
    console.log('  5. See PRODUCTION_SERVER_FIX.md for complete guide');
  }, 3000);
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: resolveBackendBaseUrl(),
  timeout: 60000, // Increased to 60 seconds for all requests
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include httpOnly cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle FormData - remove Content-Type to let browser set boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Guard: if an API endpoint returns HTML (often SPA index.html due to proxy misroute),
    // fail fast with a clear message.
    const url = (response?.config?.url || '').toString();
    if (url.startsWith('/api/') && typeof response.data === 'string') {
      const body = response.data.trim().toLowerCase();
      if (body.startsWith('<!doctype html') || body.startsWith('<html')) {
        const err = new Error(
          'API misconfiguration: received HTML instead of JSON. Check VITE_BACKEND_URL and reverse-proxy rules for /api/*.'
        );
        err.userMessage =
          'Server misconfiguration: the API request returned the website HTML instead of JSON. Please verify backend URL/proxy for /api/*.';
        return Promise.reject(err);
      }
    }
    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('🔌 Connection timeout to backend server');
      const backendUrl = resolveBackendBaseUrl();
      error.userMessage = `Connection timeout. Backend server at ${backendUrl} is not responding.`;
    } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('🚫 Network error - cannot reach backend server');
      const backendUrl = resolveBackendBaseUrl();
      error.userMessage = `Cannot connect to backend server at ${backendUrl}. Please check if the server is running.`;
    } else if (error.response?.status === 401) {
      // FIXED: Only redirect to login if this is NOT a login/register attempt
      // Don't redirect on login/register endpoints - let the component handle the error
      const isAuthEndpoint = error.config?.url?.includes('/api/auth/');

      if (!isAuthEndpoint) {
        // User's session has expired while accessing protected resources
        console.warn('🔒 Session expired - redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        // Only redirect if not already on a login page
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/';
        }
      } else {
        // This is a failed login/register attempt - let component handle the error
        console.log('❌ Authentication failed:', error.response?.data?.message || 'Invalid credentials');
      }
    }
    return Promise.reject(error);
  }
);

// Student Authentication APIs
export const sendOtp = async (data) => {
  try {
    // TODO: Integrate with backend OTP service
    const response = await api.post('/api/auth/student/send-otp', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const verifyOtp = async (data) => {
  try {
    // TODO: Integrate with backend OTP verification
    const response = await api.post('/api/auth/student/verify-otp', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const registerStudent = async (data) => {
  try {
    // TODO: Integrate with backend student registration
    const response = await api.post('/api/auth/student/register', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// General Login API for Coach, Club, Institute
export const login = async (data, role) => {
  try {
    console.log(`🔐 Attempting login for ${role} at ${api.defaults.baseURL}`);
    const response = await api.post(`/api/auth/${role}/login`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Login failed for ${role}:`, error.message);

    // Provide user-friendly error messages
    if (error.userMessage) {
      throw { message: error.userMessage };
    } else if (error.response?.data) {
      throw error.response.data;
    } else if (error.message.includes('ERR_CONNECTION_TIMED_OUT')) {
      throw { message: `Cannot connect to server. Please check if the backend server is running at ${api.defaults.baseURL}` };
    } else {
      throw { message: error.message || 'Login failed. Please try again.' };
    }
  }
};

// Add forgot password API
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Add reset password API
export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await api.post('/api/auth/reset-password', {
      email,
      // Backend expects `resetToken`; keep `otp` for backwards compatibility with any older servers.
      resetToken: otp,
      otp,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Coach Registration and Management APIs
export const registerCoach = async (data) => {
  try {
    const response = await api.post('/api/auth/coach/register', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Process coach payment
export const processCoachPayment = async (paymentData) => {
  try {
    const response = await api.post('/api/auth/coach/payment', paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const addStudentManually = async (studentData) => {
  try {
    const response = await api.post('/api/coach/students/add', studentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const bulkUploadStudents = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/coach/students/bulk-upload', formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Institute: bulk upload students
export const bulkUploadInstituteStudents = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/institute/bulk-upload/students', formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createEvent = async (data, adminMode = false) => {
  try {
    const endpoint = adminMode ? '/api/admin/events' : '/api/coach/events';
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// export const processEventPayment = async (eventId, paymentData) => {
//   try {
//     const response = await api.post(`/api/coach/events/${eventId}/payment`, paymentData);
//     return response.data;
//   } catch (error) {
//     throw error.response?.data || error.message;
//   }
// };

// Institute Registration and Management APIs
export const registerInstitute = async (data) => {
  try {
    // TODO: Integrate with backend institute registration
    const response = await api.post('/api/auth/institute/register', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Club Registration and Management APIs
export const registerClub = async (data) => {
  try {
    // TODO: Integrate with backend club registration
    const response = await api.post('/api/auth/club/register', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const generateStudentLink = async () => {
  try {
    // TODO: Integrate with backend link generation
    const response = await api.post('/api/club/generate-student-link');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Dashboard APIs
export const getStudentDashboard = async () => {
  try {
    // TODO: Integrate with backend dashboard data
    const response = await api.get('/api/student/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCoachDashboard = async () => {
  try {
    const response = await api.get('/api/coach/dashboard', {
      timeout: 60000 // 60 seconds timeout for coach dashboard
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getInstituteDashboard = async () => {
  try {
    // TODO: Integrate with backend dashboard data
    const response = await api.get('/api/institute/dashboard', {
      timeout: 60000 // 60 seconds timeout for institute dashboard
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getClubDashboard = async () => {
  try {
    // TODO: Integrate with backend dashboard data
    const response = await api.get('/api/club/dashboard', {
      timeout: 60000 // 60 seconds timeout for club dashboard
    });
    return response.data.data; // Extract data from response
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getClubMembers = async () => {
  try {
    // TODO: Integrate with backend club members data
    const response = await api.get('/api/club/members');
    return response.data.data.members; // Extract members array from response
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdminDashboard = async () => {
  try {
    // TODO: Integrate with backend admin dashboard
    const response = await api.get('/api/admin/dashboard', {
      timeout: 120000 // 2 minutes timeout for admin dashboard
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Profile APIs
export const getStudentProfile = async () => {
  try {
    const response = await api.get('/api/student/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateStudentProfile = async (data) => {
  try {
    const response = await api.put('/api/student/profile', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCoachProfile = async () => {
  try {
    const response = await api.get('/api/coach/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Coach: connection requests (student -> coach connect approvals)
export const getCoachConnectionRequests = async (status = 'PENDING', params = {}) => {
  try {
    const response = await api.get('/api/coach/connection-requests', {
      params: { status, ...params }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const respondToCoachConnectionRequest = async (connectionId, action, message = '') => {
  try {
    const response = await api.put(`/api/coach/connection-requests/${connectionId}`, { action, message });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateCoachProfile = async (data) => {
  try {
    console.log('API: Sending PUT request to /api/coach/profile with data:', data);
    const response = await api.put('/api/coach/profile', data);
    console.log('API: Response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error in updateCoachProfile:', error);
    console.error('API: Error response:', error.response?.data);
    throw error.response?.data || error.message;
  }
};

export const getInstituteProfile = async () => {
  try {
    const response = await api.get('/api/institute/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateInstituteProfile = async (data) => {
  try {
    const response = await api.put('/api/institute/profile', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getClubProfile = async () => {
  try {
    const response = await api.get('/api/club/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateClubProfile = async (data) => {
  try {
    const response = await api.put('/api/club/profile', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Student Connection APIs
export const getAvailableCoaches = async () => {
  try {
    // TODO: Integrate with backend coach listing
    const response = await api.get('/api/student/coaches');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const requestCoachConnection = async (coachId) => {
  try {
    const response = await api.post(`/api/student/connect/${coachId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// General Event APIs
export const getEvents = async (params = {}) => {
  try {
    const response = await api.get('/api/events', { params });
    return response.data;
  } catch (error) {
    console.error('Get events error:', error);
    throw error.response?.data || error.message;
  }
};

// Student Event APIs
export const getStudentEvents = async (params = {}) => {
  try {
    const response = await api.get('/api/student/events', { params });
    return response.data;
  } catch (error) {
    console.error('Get student events error:', error);
    throw error.response?.data || error.message;
  }
};

export const getStudentEventDetails = async (eventId) => {
  try {
    const response = await api.get(`/api/student/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Get student event details error:', error);
    throw error.response?.data || error.message;
  }
};

export const getStudentEventRegistrations = async (params = {}) => {
  try {
    const response = await api.get('/api/student/event-registrations', { params });
    return response.data;
  } catch (error) {
    console.error('Get student event registrations error:', error);
    throw error.response?.data || error.message;
  }
};

export const registerForEvent = async (eventId, data = {}) => {
  try {
    const response = await api.post(`/api/events/${eventId}/register`, data);
    return response.data;
  } catch (error) {
    console.error('Register for event error:', error);
    // Extract error data from response
    const errorData = error.response?.data || { message: error.message || 'Registration failed' };
    const errorMessage = errorData.message || error.message || 'Registration failed';
    const statusCode = error.response?.status || error.statusCode;
    
    // Create error object that preserves all error information
    const registrationError = new Error(errorMessage);
    registrationError.response = error.response;
    registrationError.data = errorData;
    registrationError.statusCode = statusCode;
    registrationError.status = statusCode; // Also set status for compatibility
    registrationError.isAxiosError = true;
    
    // Preserve original error for debugging
    registrationError.originalError = error;
    
    // Re-throw so it can be caught by the component
    throw registrationError;
  }
};

export const unregisterFromEvent = async (eventId) => {
  try {
    const response = await api.delete(`/api/events/${eventId}/register`);
    return response.data;
  } catch (error) {
    console.error('Unregister from event error:', error);
    throw error.response?.data || error.message;
  }
};

// Student event fee payment (admin-created events)
export const createStudentEventPaymentOrder = async (eventId, data = {}) => {
  try {
    // Canonical backend route is /api/payment/* (backend also aliases /api/payments/* for compatibility)
    const response = await api.post('/api/payment/create-order-student-event', { eventId, ...data });
    return response.data;
  } catch (error) {
    console.error('Create student event payment order error:', error);
    throw error.response?.data || error.message;
  }
};

// Coordinator/coach event fee payment (event payment for certificate/results workflow)
export const createEventPaymentOrder = async (eventId) => {
  try {
    const response = await api.post('/api/payment/create-order-events', { eventId });
    return response.data;
  } catch (error) {
    console.error('Create event payment order error:', error);
    // Keep error shape consistent with other helpers
    throw error.response?.data || error.message;
  }
};

// Admin APIs
export const adminLogin = async (credentials) => {
  try {
    console.log(`🔐 Attempting admin login at ${api.defaults.baseURL}`);
    const response = await api.post('/api/auth/admin/login', credentials);
    return response.data;
  } catch (error) {
    console.error('❌ Admin login failed:', error.message);

    // Provide user-friendly error messages
    if (error.userMessage) {
      throw { message: error.userMessage };
    } else if (error.response?.data) {
      throw error.response.data;
    } else if (error.message.includes('ERR_CONNECTION_TIMED_OUT')) {
      throw { message: `Cannot connect to server. Please check if the backend server is running at ${api.defaults.baseURL}` };
    } else {
      throw { message: error.message || 'Admin login failed. Please try again.' };
    }
  }
};

export const adminApproveEvent = async (eventId) => {
  try {
    // TODO: Integrate with backend event approval
    const response = await api.post(`/api/admin/events/${eventId}/approve`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const adminRejectEvent = async (eventId, reason) => {
  try {
    // TODO: Integrate with backend event rejection
    const response = await api.post(`/api/admin/events/${eventId}/reject`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdminStats = async () => {
  try {
    // TODO: Integrate with backend admin statistics
    const response = await api.get('/api/admin/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Event Management APIs for Admin
export const getAdminEvents = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/events', { params });
    return response.data;
  } catch (error) {
    console.error('Get admin events error:', error);
    throw error.response?.data || error.message;
  }
};

export const getPendingEvents = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/pending-events', { params });
    return response.data;
  } catch (error) {
    console.error('Get pending events error:', error);
    throw error.response?.data || error.message;
  }
};

export const moderateEvent = async (eventId, action, remarks) => {
  try {
    console.log(`🔄 Sending moderation request: ${action} for event ${eventId}`);

    const response = await api.put(`/api/admin/events/${eventId}/moderate`, {
      action: action.toUpperCase(),
      adminNotes: remarks,
      remarks: remarks // Send both field names for compatibility
    });

    console.log('✅ Moderation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Moderate event API error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);

    // Throw more specific error
    const errorMessage = error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Unknown error occurred';

    throw new Error(errorMessage);
  }
};

export const bulkModerateEvents = async (eventIds, action, remarks) => {
  try {
    const response = await api.put('/api/admin/events/bulk-moderate', {
      eventIds,
      action,
      remarks
    });
    return response.data;
  } catch (error) {
    console.error('Bulk moderate events error:', error);
    throw error.response?.data || error.message;
  }
};

// Update event status (e.g., to COMPLETED for certificate generation)
export const updateEventStatus = async (eventId, status) => {
  try {
    const response = await api.put(`/api/admin/events/${eventId}/status`, {
      status: status.toUpperCase()
    });
    return response.data;
  } catch (error) {
    console.error('Update event status error:', error);
    throw error.response?.data || error.message;
  }
};

export const getEventPayments = async (eventId, params = {}) => {
  if (!eventId) {
    throw new Error('eventId is required');
  }

  const adminPath = `/api/admin/events/${eventId}/payments`;
  const publicPath = `/api/events/${eventId}/payments`; // fallback, if you have a non-admin endpoint

  const normalize = (resData) => {
    // expected server shape: { success: true, data: { payments: [...] } }
    if (!resData) return { success: false, payments: [] };

    if (resData.success && resData.data) {
      return { success: true, payments: resData.data.payments || [] };
    }

    if (Array.isArray(resData)) {
      return { success: true, payments: resData };
    }

    if (resData.payments) {
      return { success: true, payments: resData.payments };
    }

    return { success: false, payments: [], message: resData.message || null };
  };

  try {
    const response = await api.get(adminPath, { params });
    return normalize(response.data);
  } catch (error) {
    const status = error?.response?.status;
    // Try public fallback for non-admin users or missing admin route
    if (status === 404 || status === 403 || status === 401) {
      try {
        const fallback = await api.get(publicPath, { params });
        return normalize(fallback.data);
      } catch (err2) {
        console.error('Get event payments fallback error:', err2);
        return { success: false, payments: [], message: err2?.response?.data?.message || err2.message };
      }
    }

    console.error('Get event payments error:', error);
    return { success: false, payments: [], message: error?.response?.data?.message || error.message || 'Failed to fetch event payments' };
  }
};
// Coach and Institute Approval APIs
export const getPendingCoaches = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/pending-coaches', { params });
    return response.data;
  } catch (error) {
    console.error('Get pending coaches error:', error);
    throw error.response?.data || error.message;
  }
};

export const getPendingInstitutes = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/pending-institutes', { params });
    return response.data;
  } catch (error) {
    console.error('Get pending institutes error:', error);
    throw error.response?.data || error.message;
  }
};

export const approveCoach = async (coachId, action, remarks) => {
  try {
    const response = await api.put(`/api/admin/coaches/${coachId}/approval`, {
      action,
      remarks
    });
    return response.data;
  } catch (error) {
    console.error('Approve coach error:', error);
    throw error.response?.data || error.message;
  }
};

export const approveInstitute = async (instituteId, action, remarks) => {
  try {
    const response = await api.put(`/api/admin/institutes/${instituteId}/approval`, {
      action,
      remarks
    });
    return response.data;
  } catch (error) {
    console.error('Approve institute error:', error);
    throw error.response?.data || error.message;
  }
};

// Coach Event Management APIs
export const getCoachEvents = async (params = {}) => {
  try {
    const response = await api.get('/api/coach/events', { params });
    return response.data;
  } catch (error) {
    console.error('Get coach events error:', error);
    throw error.response?.data || error.message;
  }
};

export const updateEvent = async (eventId, data) => {
  try {
    const response = await api.put(`/api/coach/events/${eventId}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin: Update event details (uses shared /api/events/:eventId route, admin role allowed)
export const adminUpdateEvent = async (eventId, data) => {
  try {
    const response = await api.put(`/api/events/${eventId}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`/api/coach/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Delete event error:', error);
    throw error.response?.data || error.message;
  }
};

// Cancel event
export const cancelEventAPI = async (eventId, reason) => {
  try {
    const response = await api.put(`/api/coach/events/${eventId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    console.error('Cancel event error:', error);
    throw error.response?.data || error.message;
  }
};

// Get event registrations with enhanced data
export const getEventRegistrations = async (eventId, params = {}) => {
  try {
    const response = await api.get(`/api/coach/events/${eventId}/registrations`, { params });
    return response.data;
  } catch (error) {
    console.error('Get event registrations error:', error);
    throw error.response?.data || error.message;
  }
};

// Event participants (event-scoped; supports EVENT_INCHARGE via backend permission checks)
export const getEventParticipants = async (eventId) => {
  try {
    const response = await api.get(`/api/events/${eventId}/participants`);
    return response.data;
  } catch (error) {
    console.error('Get event participants error:', error);
    throw error.response?.data || error.message;
  }
};

// Bulk add/register existing students to an event (EVENT_INCHARGE with studentManagement)
export const bulkAddEventParticipants = async (eventId, identifiers = []) => {
  try {
    const response = await api.post(`/api/events/${eventId}/registrations/bulk`, { identifiers });
    return response.data;
  } catch (error) {
    console.error('Bulk add event participants error:', error);
    throw error.response?.data || error.message;
  }
};

// Utility functions
export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
};

export const setUserRole = (role) => {
  localStorage.setItem('userRole', role);
};

export const getUserRole = () => {
  return localStorage.getItem('userRole');
};

// Event Result Files API
export const uploadEventResults = async (eventId, formData) => {
  try {
    // When uploading files with FormData, axios interceptor will automatically
    // remove Content-Type header to allow browser to set it with proper boundary
    // Check if user is admin and use admin route, otherwise use coach route
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'ADMIN';
    
    const endpoint = isAdmin 
      ? `/api/admin/events/${eventId}/results`
      : `/api/events/${eventId}/results`;
    
    const response = await api.post(endpoint, formData);
    return response.data;
  } catch (error) {
    console.error('Upload event results error:', error);
    throw error.response?.data || error.message;
  }
};

export const getEventResultFiles = async (eventId, params = {}) => {
  try {
    const response = await api.get(`/api/events/${eventId}/results`, { params });
    return response.data;
  } catch (error) {
    console.error('Get event result files error:', error);
    throw error.response?.data || error.message;
  }
};

export const downloadSampleResultSheet = async (eventId, isAdmin = false) => {
  try {
    const endpoint = isAdmin 
      ? `/api/admin/events/${eventId}/results/sample-sheet`
      : `/api/events/${eventId}/results/sample-sheet`;
    
    const response = await api.get(endpoint, {
      responseType: 'blob' // Important for file downloads
    });
    
    // Create blob and download
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'Sample_Result_Sheet.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Sample sheet downloaded successfully' };
  } catch (error) {
    console.error('Download sample sheet error:', error);
    // When responseType is 'blob', server errors may also come as a Blob.
    const blob = error?.response?.data;
    if (blob instanceof Blob) {
      try {
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json?.message || 'Failed to download sample sheet');
        } catch {
          throw new Error(text || 'Failed to download sample sheet');
        }
      } catch (e) {
        throw new Error(e?.message || 'Failed to download sample sheet');
      }
    }

    const msg =
      error?.response?.data?.message ||
      (typeof error?.response?.data === 'string' ? error.response.data : null) ||
      error?.message ||
      'Failed to download sample sheet';
    throw new Error(msg);
  }
};

// Get event result analytics with winner prediction
export const getEventResultAnalytics = async (eventId) => {
  try {
    const response = await api.get(`/api/admin/events/${eventId}/results/analytics`);
    return response.data;
  } catch (error) {
    console.error('Get event result analytics error:', error);
    throw error.response?.data || error.message;
  }
};

export const deleteEventResultFile = async (eventId, fileId = null) => {
  try {
    // If fileId is provided, delete specific file, otherwise delete all files
    const endpoint = fileId
      ? `/api/events/${eventId}/results/${fileId}`
      : `/api/events/${eventId}/results`;

    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error('Delete event result file error:', error);
    throw error.response?.data || error.message;
  }
};

// Download individual event result file
export const downloadIndividualEventResultFile = async (eventId, fileId) => {
  try {
    const response = await api.get(`/api/events/${eventId}/results/${fileId}/download`, {
      responseType: 'blob' // Important for file downloads
    });
    return response;
  } catch (error) {
    console.error('Download individual event result file error:', error);
    throw error.response?.data || error.message;
  }
};

export const getAllEventResultFilesForAdmin = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/event-results', { params });
    return response.data;
  } catch (error) {
    console.error('Get all event result files error:', error);
    throw error.response?.data || error.message;
  }
};

// Coach Event Result Files APIs
export const getCoachEventResultFiles = async (params = {}) => {
  try {
    const response = await api.get('/api/coach/event-results', { params });
    return response.data;
  } catch (error) {
    console.error('Get coach event result files error:', error);
    throw error.response?.data || error.message;
  }
};

export const getEventResultFilesByEventId = async (eventId, params = {}) => {
  try {
    const response = await api.get(`/api/coach/events/${eventId}/results`, { params });
    return response.data;
  } catch (error) {
    console.error('Get event result files by event ID error:', error);
    throw error.response?.data || error.message;
  }
};

export const downloadEventResultFile = async (fileId, isAdmin = false) => {
  try {
    const endpoint = isAdmin ? `/api/admin/event-results/${fileId}/download` : `/api/coach/event-results/${fileId}/download`;
    const response = await api.get(endpoint, {
      responseType: 'blob' // Important for file downloads
    });
    return response;
  } catch (error) {
    console.error('Download event result file error:', error);
    throw error.response?.data || error.message;
  }
};

// Event Orders API
export const createEventOrder = async (eventId, orderData) => {
  try {
    const response = await api.post(`/api/events/${eventId}/orders`, orderData);
    return response.data;
  } catch (error) {
    console.error('Create event order error:', error);
    throw error.response?.data || error.message;
  }
};

export const getEventOrders = async (eventId, params = {}) => {
  try {
    const response = await api.get(`/api/events/${eventId}/orders`, { params });
    return response.data;
  } catch (error) {
    console.error('Get event orders error:', error);
    throw error.response?.data || error.message;
  }
};

export const updateEventOrder = async (eventId, orderId, orderData) => {
  try {
    const response = await api.put(`/api/events/${eventId}/orders/${orderId}`, orderData);
    return response.data;
  } catch (error) {
    console.error('Update event order error:', error);
    throw error.response?.data || error.message;
  }
};

export const deleteEventOrder = async (eventId, orderId) => {
  try {
    const response = await api.delete(`/api/events/${eventId}/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Delete event order error:', error);
    throw error.response?.data || error.message;
  }
};

// Certificate API
export const getEligibleStudents = async (eventId, orderId) => {
  try {
    const response = await api.get(`/api/certificates/event/${eventId}/eligible-students`, {
      params: { orderId }
    });
    return response.data;
  } catch (error) {
    console.error('Get eligible students error:', error);
    throw error.response?.data || error.message;
  }
};

export const issueCertificates = async (certificateData) => {
  try {
    const response = await api.post('/api/certificates/issue', certificateData);
    return response.data;
  } catch (error) {
    console.error('Issue certificates error:', error);
    if (error.response?.status === 402) {
      throw { message: error.response.data.message || 'Payment is pending for this event', paymentPending: true };
    }
    throw error.response?.data || error.message;
  }
};

export const issueWinnerCertificates = async (certificateData) => {
  try {
    const response = await api.post('/api/certificates/issue-winner', certificateData);
    return response.data;
  } catch (error) {
    console.error('Issue winner certificates error:', error);
    if (error.response?.status === 402) {
      throw { message: error.response.data.message || 'Payment is pending for this event', paymentPending: true };
    }
    throw error.response?.data || error.message;
  }
};

export const getEventPaymentStatus = async (eventId) => {
  try {
    // Use coach-accessible endpoint
    const response = await api.get(`/api/payment/event/${eventId}/payment-status`);
    return response.data;
  } catch (error) {
    // Log error but don't throw - return default response to prevent UI crashes
    console.error('Get event payment status error:', error);
    
    // Return a default response instead of throwing to prevent UI errors
    return {
      success: false,
      data: {
        paymentStatus: 'PENDING',
        paymentCompleted: false,
        totalAmount: 0,
        paymentDate: null
      },
      message: error.response?.data?.message || 'Unable to fetch payment status'
    };
  }
};

export const getStudentCertificates = async () => {
  try {
    const response = await api.get('/api/certificates/my-certificates');
    return response.data;
  } catch (error) {
    console.error('Get student certificates error:', error);
    throw error.response?.data || error.message;
  }
};

export const verifyCertificate = async (uid) => {
  try {
    const response = await api.get(`/api/certificates/verify/${uid}`);
    return response.data;
  } catch (error) {
    console.error('Verify certificate error:', error);
    throw error.response?.data || error.message;
  }
};

export const getEventCertificates = async (eventId) => {
  try {
    const response = await api.get(`/api/certificates/event/${eventId}/issued`);
    return response.data;
  } catch (error) {
    console.error('Get event certificates error:', error);
    throw error.response?.data || error.message;
  }
};

// Admin Order Management API
export const getAllOrdersForAdmin = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/orders', { params });
    return response.data;
  } catch (error) {
    console.error('Get all orders for admin error:', error);
    throw error.response?.data || error.message;
  }
};

export const updateOrderByAdmin = async (orderId, updateData) => {
  try {
    const response = await api.put(`/api/admin/orders/${orderId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Update order by admin error:', error);
    throw error.response?.data || error.message;
  }
};

export const getOrderStats = async () => {
  try {
    const response = await api.get('/api/admin/orders/stats');
    return response.data;
  } catch (error) {
    console.error('Get order stats error:', error);
    throw error.response?.data || error.message;
  }
};

export const bulkUpdateOrders = async (orderIds, status, adminRemarks) => {
  try {
    const response = await api.put('/api/admin/orders/bulk-update', {
      orderIds,
      status,
      adminRemarks
    });
    return response.data;
  } catch (error) {
    console.error('Bulk update orders error:', error);
    throw error.response?.data || error.message;
  }
};

// Order Payment APIs
export const createOrderPayment = async (orderId) => {
  try {
    const response = await api.post(`/api/events/orders/${orderId}/create-payment`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const confirmEventOrder = async (eventId, orderId) => {
  try {
    const response = await api.post(`/api/events/${eventId}/orders/${orderId}/confirm`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const verifyOrderPayment = async (orderId, paymentData) => {
  try {
    const response = await api.post(`/api/events/orders/${orderId}/verify-payment`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin Data Cleanup APIs
export const getOrphanedRegistrationsReport = async () => {
  try {
    const response = await api.get('/api/admin/orphaned-registrations-report');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const cleanupOrphanedRegistrations = async () => {
  try {
    const response = await api.post('/api/admin/cleanup-orphaned-registrations');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin Event Participants API
export const getAdminEventParticipants = async (eventId, params = {}) => {
  try {
    const response = await api.get(`/api/admin/events/${eventId}/participants`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Payment API functions
export const getPaymentPlans = async (userType) => {
  try {
    const response = await api.get(`/api/payment/plans/${userType}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllPaymentPlans = async () => {
  try {
    const response = await api.get('/api/payment/plans');
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Health check function for testing backend connectivity
export const healthCheck = async () => {
  try {
    console.log(`🏥 Testing backend health at ${api.defaults.baseURL}`);
    const response = await api.get('/health', { timeout: 5000 });
    console.log('✅ Backend health check passed');
    return response.data;
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    throw error;
  }
};

// Notification API functions
export const getNotifications = async (params = {}) => {
  try {
    const response = await api.get('/api/admin/notifications', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/api/admin/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.patch('/api/admin/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/api/admin/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getNotificationCount = async () => {
  try {
    const response = await api.get('/api/admin/notifications/count');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const clearAllNotifications = async () => {
  try {
    const response = await api.delete('/api/admin/notifications/clear-all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const bulkDeleteNotifications = async (notificationIds) => {
  try {
    const response = await api.delete('/api/admin/notifications/bulk-delete', {
      data: { notificationIds }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Student Registration Management for Events
export const bulkRegisterStudentsForEvent = async (eventId, studentIds, eventFeePerStudent = 0) => {
  try {
    const response = await api.post(`/api/coach/events/${eventId}/registrations/bulk`, {
      studentIds,
      eventFeePerStudent
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getEventRegistrationOrders = async (eventId) => {
  try {
    const response = await api.get(`/api/coach/events/${eventId}/registrations/orders`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const initiateRegistrationPayment = async (eventId, orderId) => {
  try {
    const response = await api.post(`/api/coach/events/${eventId}/registrations/orders/${orderId}/payment`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const verifyRegistrationPayment = async (eventId, orderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const response = await api.post(`/api/coach/events/${eventId}/registrations/orders/${orderId}/payment-success`, {
      razorpayPaymentId,
      razorpaySignature
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin: Certificate Management Endpoints
export const getEventRegistrationOrdersAdmin = async (eventId) => {
  try {
    const response = await api.get(`/api/admin/events/${eventId}/registrations/orders`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const notifyCoordinatorForCompletion = async (eventId, notifyMessage = '') => {
  try {
    const response = await api.post(`/api/admin/events/${eventId}/registrations/notify-completion`, {
      notifyMessage
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const generateCertificates = async (orderId) => {
  try {
    const response = await api.post(`/api/admin/registrations/orders/${orderId}/generate-certificates`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getEventCertificatesAdmin = async (eventId) => {
  try {
    const response = await api.get(`/api/admin/events/${eventId}/certificates`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const generateCertificatesFromRegistrationsAdmin = async (eventId) => {
  try {
    const response = await api.post(`/api/admin/events/${eventId}/certificates/generate-from-registrations`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Expose health check globally for debugging
window.testBackendHealth = healthCheck;

// Get event details by ID
export const getEventById = async (eventId) => {
  try {
    const response = await api.get(`/api/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Get event by ID error:', error);
    throw error.response?.data || error.message;
  }
};

// Get public event by uniqueId (no authentication required)
export const getPublicEventByUniqueId = async (uniqueId) => {
  try {
    const response = await api.get(`/api/events/public/${uniqueId}`);
    return response.data;
  } catch (error) {
    console.error('Get public event error:', error);
    throw error.response?.data || error.message;
  }
};

// Share event via email
export const shareEventViaEmail = async (eventId, emails, message = '') => {
  try {
    const response = await api.post(`/api/events/${eventId}/share`, { emails, message });
    return response.data;
  } catch (error) {
    console.error('Share event error:', error);
    throw error.response?.data || error.message;
  }
};

// Event Fee Management (event-scoped; requires feeManagement permission)
export const getEventFeeSettings = async (eventId) => {
  try {
    const response = await api.get(`/api/events/${eventId}/fees`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateEventFeeSettings = async (eventId, payload) => {
  try {
    const response = await api.put(`/api/events/${eventId}/fees`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export default api;