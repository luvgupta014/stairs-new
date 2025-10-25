import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
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
    const response = await api.post('/api/coach/students/bulk-upload', formData);
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

export const registerForEvent = async (eventId) => {
  try {
    const response = await api.post(`/api/events/${eventId}/register`);
    return response.data;
  } catch (error) {
    console.error('Register for event error:', error);
    throw error.response?.data || error.message;
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
    const response = await api.post(`/api/events/${eventId}/results`, formData);
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
    const response = await api.post(`/api/coach/events/${eventId}/orders`, orderData);
    return response.data;
  } catch (error) {
    console.error('Create event order error:', error);
    throw error.response?.data || error.message;
  }
};

export const getEventOrders = async (eventId, params = {}) => {
  try {
    const response = await api.get(`/api/coach/events/${eventId}/orders`, { params });
    return response.data;
  } catch (error) {
    console.error('Get event orders error:', error);
    throw error.response?.data || error.message;
  }
};

export const updateEventOrder = async (eventId, orderId, orderData) => {
  try {
    const response = await api.put(`/api/coach/events/${eventId}/orders/${orderId}`, orderData);
    return response.data;
  } catch (error) {
    console.error('Update event order error:', error);
    throw error.response?.data || error.message;
  }
};

export const deleteEventOrder = async (eventId, orderId) => {
  try {
    const response = await api.delete(`/api/coach/events/${eventId}/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Delete event order error:', error);
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
    const response = await api.post(`/api/coach/orders/${orderId}/create-payment`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const verifyOrderPayment = async (orderId, paymentData) => {
  try {
    const response = await api.post(`/api/coach/orders/${orderId}/verify-payment`, paymentData);
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
export const getEventParticipants = async (eventId, params = {}) => {
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

export default api;