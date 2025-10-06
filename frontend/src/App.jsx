import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import StudentLogin from './pages/auth/StudentLogin';
import CoachLogin from './pages/auth/CoachLogin';
import ClubLogin from './pages/auth/ClubLogin';
import InstituteLogin from './pages/auth/InstituteLogin';

// Registration Pages
import StudentRegister from './pages/StudentRegister';
import CoachRegister from './pages/CoachRegister';
import InstituteRegister from './pages/InstituteRegister';
import VerifyOtp from './pages/VerifyOtp';

// Dashboard Pages
import StudentDashboard from './pages/dashboard/StudentDashboard';
import CoachDashboard from './pages/dashboard/CoachDashboard';
import ClubDashboard from './pages/dashboard/ClubDashboard';
import InstituteDashboard from './pages/dashboard/InstituteDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Other Pages
import EventCreate from './pages/EventCreate';
import BulkUpload from './pages/BulkUpload';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Home Route */}
              <Route path="/" element={<Navigate to="/login/student" replace />} />
              
              {/* Auth Routes */}
              <Route path="/login/student" element={<StudentLogin />} />
              <Route path="/login/coach" element={<CoachLogin />} />
              <Route path="/login/club" element={<ClubLogin />} />
              <Route path="/login/institute" element={<InstituteLogin />} />
              
              {/* Registration Routes */}
              <Route path="/register/student" element={<StudentRegister />} />
              <Route path="/register/coach" element={<CoachRegister />} />
              <Route path="/register/institute" element={<InstituteRegister />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              
              {/* Protected Dashboard Routes */}
              <Route path="/dashboard/student" element={
                <ProtectedRoute role="STUDENT">
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/coach" element={
                <ProtectedRoute role="COACH">
                  <CoachDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/club" element={
                <ProtectedRoute role="CLUB">
                  <ClubDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/institute" element={
                <ProtectedRoute role="INSTITUTE">
                  <InstituteDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin" element={
                <ProtectedRoute role="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              {/* Protected Coach Specific Routes */}
              <Route path="/coach/event/create" element={
                <ProtectedRoute role="COACH">
                  <EventCreate />
                </ProtectedRoute>
              } />
              <Route path="/coach/bulk-upload" element={
                <ProtectedRoute role="COACH">
                  <BulkUpload />
                </ProtectedRoute>
              } />
              
              {/* Other Protected Routes */}
              <Route path="/events/create" element={
                <ProtectedRoute>
                  <EventCreate />
                </ProtectedRoute>
              } />
              <Route path="/bulk-upload" element={
                <ProtectedRoute>
                  <BulkUpload />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute role="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/login/student" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
