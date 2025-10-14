import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentProfile from "./pages/StudentProfile";
import EventParticipants from "./pages/EventParticipants";
import EventEdit from "./pages/EventEdit";

// Landing Page
import Landing from "./pages/Landing";

// Auth Pages
import StudentLogin from "./pages/auth/StudentLogin";
import CoachLogin from "./pages/auth/CoachLogin";
import ClubLogin from "./pages/auth/ClubLogin";
import InstituteLogin from "./pages/auth/InstituteLogin";
import AdminLogin from "./pages/auth/AdminLogin";

// Forgot / Reset Password Pages
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Registration Pages
import StudentRegister from "./pages/StudentRegister";
import CoachRegister from "./pages/CoachRegister";
import InstituteRegister from "./pages/InstituteRegister";
import VerifyOtp from "./pages/VerifyOtp";

// Premium Registration Pages
import CoachRegisterPremium from "./pages/CoachRegisterPremium";
import InstituteRegisterPremium from "./pages/InstituteRegisterPremium";
import ClubRegisterPremium from "./pages/ClubRegisterPremium";
import VerifyOtpPremium from "./pages/VerifyOtpPremium";

// Dashboard Pages
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import CoachDashboard from "./pages/dashboard/CoachDashboard";
import ClubDashboard from "./pages/dashboard/ClubDashboard";
import InstituteDashboard from "./pages/dashboard/InstituteDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Other Pages
import EventCreate from "./pages/EventCreate";
import BulkUpload from "./pages/BulkUpload";
import CoachPayment from "./pages/CoachPayment";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Routes>
            {/* Landing Page Route (no header/footer) */}
            <Route path="/" element={<Landing />} />
            {/* Auth Routes (no header/footer) */}
            <Route path="/login/student" element={<StudentLogin />} />
            <Route path="/login/coach" element={<CoachLogin />} />
            <Route path="/login/club" element={<ClubLogin />} />
            <Route path="/login/institute" element={<InstituteLogin />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            
            {/* Registration Routes (no header/footer) */}
            <Route path="/register/student" element={<StudentRegister />} />
            <Route
              path="/register/coach"
              element={<Navigate to="/register/coach-premium" replace />}
            />
            <Route
              path="/register/institute"
              element={<Navigate to="/register/institute-premium" replace />}
            />
            <Route
              path="/register/club"
              element={<Navigate to="/register/club-premium" replace />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            {/* Premium Registration Routes (no header/footer) */}
            <Route
              path="/register/coach-premium"
              element={<CoachRegisterPremium />}
            />
            <Route
              path="/register/institute-premium"
              element={<InstituteRegisterPremium />}
            />
            <Route
              path="/register/club-premium"
              element={<ClubRegisterPremium />}
            />
            <Route path="/verify-otp-premium" element={<VerifyOtpPremium />} />
            {/* Protected Dashboard Routes with Header and Footer */}
            <Route
              path="/dashboard/student"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="STUDENT">
                      <StudentDashboard />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/dashboard/coach"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="COACH">
                      <CoachDashboard />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/dashboard/club"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="CLUB">
                      <ClubDashboard />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/dashboard/institute"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="INSTITUTE">
                      <InstituteDashboard />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="ADMIN">
                      <AdminDashboard />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            {/* Other Protected Routes with Header and Footer */}
            <Route
              path="/student/profile"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="STUDENT">
                      <StudentProfile />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            
            <Route
              path="/coach/payment"
              element={
                <ProtectedRoute role="COACH">
                  <CoachPayment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach/event/create"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="COACH">
                      <EventCreate />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/coach/bulk-upload"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="COACH">
                      <BulkUpload />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/events/create"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <EventCreate />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/bulk-upload"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <BulkUpload />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/admin"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="ADMIN">
                      <AdminDashboard />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/coach/event/:eventId/participants"
              element={
                <ProtectedRoute allowedRoles={["COACH"]}>
                  <EventParticipants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach/event/edit/:eventId"
              element={
                <ProtectedRoute allowedRoles={["COACH"]}>
                  <EventEdit />
                </ProtectedRoute>
              }
            />
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
