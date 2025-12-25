import AdminUserProfile from "./pages/dashboard/AdminUserProfile";
import AllUsers from "./pages/dashboard/AllUsers";
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
import CoachProfile from "./pages/CoachProfile";
import InstituteProfile from "./pages/InstituteProfile";
import ClubProfile from "./pages/ClubProfile";
import EventParticipants from "./pages/events/EventParticipants";
import EventEdit from "./pages/events/EventEdit";

// Landing Page
import Landing from "./pages/Landing";

// Auth Pages
import StudentLogin from "./pages/auth/StudentLogin";
import CoachLogin from "./pages/auth/CoachLogin";
import ClubLogin from "./pages/auth/ClubLogin";
import InstituteLogin from "./pages/auth/InstituteLogin";
import AdminLogin from "./pages/auth/AdminLogin";
import EventInchargeLogin from "./pages/auth/EventInchargeLogin";
import EventInchargeRegister from "./pages/auth/EventInchargeRegister";

// Forgot / Reset Password Pages
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Registration Pages
import StudentRegister from "./pages/StudentRegister";
import CoachRegister from "./pages/CoachRegister";
import InstituteRegister from "./pages/InstituteRegister";
import VerifyOtp from "./pages/auth/VerifyOtp";

// Registration Pages
import ClubRegister from "./pages/ClubRegister";

// Dashboard Pages
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import CoachDashboard from "./pages/dashboard/CoachDashboard";
import ClubDashboard from "./pages/dashboard/ClubDashboard";
import InstituteDashboard from "./pages/dashboard/InstituteDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminEventsManagement from "./pages/dashboard/AdminEventsManagement";

// Other Pages
import Events from "./pages/events/Events";
import EventDetails from "./pages/events/EventDetails";
import PublicEventDetails from "./pages/events/PublicEventDetails";
import EventCreate from "./pages/events/EventCreate";
import BulkUpload from "./pages/BulkUpload";
import Payment from "./components/Payment";
import AdminEventResults from "./components/AdminEventResults";
import EventResultUpload from "./pages/events/EventResultUpload";
import EventOrders from "./pages/events/EventOrders";
import IssueCertificates from "./pages/IssueCertificates";
import AdminOrders from "./components/AdminOrders";
import AdminRevenue from "./pages/AdminRevenue";
import BrowseCoaches from "./pages/student/BrowseCoaches";
import EventInchargeDashboard from "./pages/dashboard/EventInchargeDashboard";
import AdminGlobalPayments from "./pages/dashboard/AdminGlobalPayments";
import CoordinatorLogin from "./pages/auth/CoordinatorLogin";
import CoordinatorDashboard from "./pages/dashboard/CoordinatorDashboard";
import Terms from "./pages/Terms";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Routes>
            {/* Landing Page Route (no header/footer) */}
            <Route path="/" element={<Landing />} />
            {/* Public policy routes */}
            <Route
              path="/terms"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <Terms />
                  </main>
                  <Footer />
                </>
              }
            />
            {/* Auth Routes (no header/footer) */}
            <Route path="/login/student" element={<StudentLogin />} />
            <Route path="/login/coach" element={<CoachLogin />} />
            <Route path="/login/club" element={<ClubLogin />} />
            <Route path="/login/institute" element={<InstituteLogin />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route path="/login/incharge" element={<EventInchargeLogin />} />
            <Route path="/login/coordinator" element={<CoordinatorLogin />} />
            <Route path="/register/incharge" element={<EventInchargeRegister />} />
            
            {/* Registration Routes (no header/footer) */}
            <Route path="/register/student" element={<StudentRegister />} />
            <Route
              path="/register/coach"
              element={<CoachRegister />}
            />
            <Route
              path="/register/institute"
              element={<InstituteRegister />}
            />
            <Route
              path="/register/club"
              element={<ClubRegister />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            {/* Legacy Premium Registration Routes - Redirect to new routes */}
            <Route
              path="/register/coach-premium"
              element={<Navigate to="/register/coach" replace />}
            />
            <Route
              path="/register/institute-premium"
              element={<Navigate to="/register/institute" replace />}
            />
            <Route
              path="/register/club-premium"
              element={<Navigate to="/register/club" replace />}
            />
            {/* Legacy OTP route for backward compatibility */}
            <Route path="/verify-otp-premium" element={<Navigate to="/verify-otp" replace />} />
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
              path="/dashboard/coordinator"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute allowedRoles={["COACH"]}>
                      <CoordinatorDashboard />
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
            <Route
              path="/admin/settings/global-payments"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="ADMIN">
                      <AdminGlobalPayments />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/dashboard/event_incharge"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="EVENT_INCHARGE">
                      <EventInchargeDashboard />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/admin/events"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="ADMIN">
                      <AdminEventsManagement />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/admin/event/create"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="ADMIN">
                      <EventCreate adminMode={true} />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/admin/event-results"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="ADMIN">
                      <AdminEventResults />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            {/* Other Protected Routes with Header and Footer */}
            <Route
              path="/admin/users/:userId"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="ADMIN">
                      <AdminUserProfile />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />

            <Route
              path="/admin/users"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="ADMIN">
                      <AllUsers />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
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
              path="/coach/profile"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="COACH">
                      <CoachProfile />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />

            <Route
              path="/institute/profile"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="INSTITUTE">
                      <InstituteProfile />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />

            <Route
              path="/club/profile"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="CLUB">
                      <ClubProfile />
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
                  <Payment userType="coach" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/institute/payment"
              element={
                <ProtectedRoute role="INSTITUTE">
                  <Payment userType="institute" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/club/payment"
              element={
                <ProtectedRoute role="CLUB">
                  <Payment userType="club" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/payment"
              element={
                <ProtectedRoute role="STUDENT">
                  <Payment userType="student" />
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
            {/* Public Event Route (no authentication required) */}
            <Route
              path="/event/:uniqueId"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <PublicEventDetails />
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/events"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <Events />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/events/:eventId"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <EventDetails />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/events/:eventId/edit"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <EventEdit />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/events/:eventId/participants"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <EventParticipants />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/events/:eventId/results"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <EventResultUpload />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/events/:eventId/certificates"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <IssueCertificates />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/events/:eventId/orders"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <EventOrders />
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
            <Route
              path="/coach/event/:eventId/results"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="COACH">
                      <EventResultUpload />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/coach/event/:eventId/orders"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="COACH">
                      <EventOrders />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/admin/event/:eventId/certificates"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="ADMIN">
                      <IssueCertificates />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="ADMIN">
                      <AdminOrders />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/student/browse-coaches"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="STUDENT">
                      <BrowseCoaches />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              }
            />
            <Route
              path="/admin/revenue"
              element={
                <>
                  <Header />
                  <main className="flex-grow">
                    <ProtectedRoute role="ADMIN">
                      <AdminRevenue />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
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
