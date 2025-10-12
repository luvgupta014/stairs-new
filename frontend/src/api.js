import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  timeout: 10000,
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      window.location.href = '/';
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
    // TODO: Integrate with backend login service
    const response = await api.post(`/api/auth/${role}/login`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Add forgot password API
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Add reset password API
export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', {
      email,
      otp,
      newPassword
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
    const response = await api.post('/api/coach/students/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createEvent = async (data) => {
  try {
    const response = await api.post('/api/coach/events', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const processEventPayment = async (eventId, paymentData) => {
  try {
    const response = await api.post(`/api/coach/events/${eventId}/payment`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

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
    const response = await api.get('/api/coach/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getInstituteDashboard = async () => {
  try {
    // TODO: Integrate with backend dashboard data
    const response = await api.get('/api/institute/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getClubDashboard = async () => {
  try {
    // TODO: Integrate with backend dashboard data
    const response = await api.get('/api/club/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getClubMembers = async () => {
  try {
    // TODO: Integrate with backend club members data
    const response = await api.get('/api/club/members');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdminDashboard = async () => {
  try {
    // TODO: Integrate with backend admin dashboard
    const response = await api.get('/api/admin/dashboard');
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
    // TODO: Integrate with backend connection request
    const response = await api.post('/api/student/coaches/connect', { coachId });
    return response.data;
  } catch (error) {
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

export const getStudentEventRegistrations = async (params = {}) => {
  try {
    const response = await api.get('/api/student/event-registrations', { params });
    return response.data;
  } catch (error) {
    console.error('Get student event registrations error:', error);
    throw error.response?.data || error.message;
  }
};

export const registerForEvent = async (eventId) => {
  try {
    const response = await api.post(`/api/student/events/${eventId}/register`);
    return response.data;
  } catch (error) {
    console.error('Register for event error:', error);
    throw error.response?.data || error.message;
  }
};

// Admin APIs
export const adminLogin = async (credentials) => {
  try {
    // TODO: Integrate with backend admin authentication
    const response = await api.post('/api/auth/admin/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
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
    const response = await api.put(`/api/admin/events/${eventId}/moderate`, {
      action,
      remarks
    });
    return response.data;
  } catch (error) {
    console.error('Moderate event error:', error);
    throw error.response?.data || error.message;
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

export default api;