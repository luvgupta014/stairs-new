import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/SimpleAuthContext';

// Import only the essential components
import Landing from './pages/Landing';
import StudentRegister from './pages/StudentRegister';
import CoachRegisterPremium from './pages/CoachRegisterPremium';
import InstituteRegisterPremium from './pages/InstituteRegisterPremium';
import ClubRegisterPremium from './pages/ClubRegisterPremium';

// Auth Pages
import StudentLogin from './pages/auth/StudentLogin';
import CoachLogin from './pages/auth/CoachLogin';
import ClubLogin from './pages/auth/ClubLogin';
import InstituteLogin from './pages/auth/InstituteLogin';

function SimplifiedApp() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<Landing />} />
            
            {/* Auth Routes */}
            <Route path="/login/student" element={<StudentLogin />} />
            <Route path="/login/coach" element={<CoachLogin />} />
            <Route path="/login/club" element={<ClubLogin />} />
            <Route path="/login/institute" element={<InstituteLogin />} />
            
            {/* Registration Routes */}
            <Route path="/register/student" element={<StudentRegister />} />
            <Route path="/register/coach/premium" element={<CoachRegisterPremium />} />
            <Route path="/register/institute/premium" element={<InstituteRegisterPremium />} />
            <Route path="/register/club/premium" element={<ClubRegisterPremium />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default SimplifiedApp;