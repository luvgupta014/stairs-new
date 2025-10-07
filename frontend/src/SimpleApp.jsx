import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Simple test components
const TestLanding = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">🎯 STAIRS Landing Page</h1>
      <p className="text-lg text-gray-600 mb-8">Welcome to the Sports Training Platform</p>
      <div className="space-x-4">
        <a href="/register/student" className="bg-blue-500 text-white px-6 py-3 rounded-lg">Student Register</a>
        <a href="/register/coach/premium" className="bg-green-500 text-white px-6 py-3 rounded-lg">Coach Register</a>
        <a href="/register/institute/premium" className="bg-purple-500 text-white px-6 py-3 rounded-lg">Institute Register</a>
        <a href="/register/club/premium" className="bg-orange-500 text-white px-6 py-3 rounded-lg">Club Register</a>
      </div>
    </div>
  </div>
);

const TestStudentRegister = () => (
  <div className="min-h-screen bg-blue-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-blue-900">🎓 Student Registration</h1>
      <p className="text-blue-600 mt-4">Simple student registration form would go here</p>
      <a href="/" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">Back to Home</a>
    </div>
  </div>
);

const TestCoachRegister = () => (
  <div className="min-h-screen bg-green-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-green-900">🏆 Premium Coach Registration</h1>
      <p className="text-green-600 mt-4">Premium multi-step coach registration would go here</p>
      <a href="/" className="mt-4 inline-block bg-green-500 text-white px-4 py-2 rounded">Back to Home</a>
    </div>
  </div>
);

const TestInstituteRegister = () => (
  <div className="min-h-screen bg-purple-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-purple-900">🏫 Premium Institute Registration</h1>
      <p className="text-purple-600 mt-4">Premium multi-step institute registration would go here</p>
      <a href="/" className="mt-4 inline-block bg-purple-500 text-white px-4 py-2 rounded">Back to Home</a>
    </div>
  </div>
);

const TestClubRegister = () => (
  <div className="min-h-screen bg-orange-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-orange-900">⚽ Premium Club Registration</h1>
      <p className="text-orange-600 mt-4">Premium multi-step club registration would go here</p>
      <a href="/" className="mt-4 inline-block bg-orange-500 text-white px-4 py-2 rounded">Back to Home</a>
    </div>
  </div>
);

function TestApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TestLanding />} />
        <Route path="/register/student" element={<TestStudentRegister />} />
        <Route path="/register/coach/premium" element={<TestCoachRegister />} />
        <Route path="/register/institute/premium" element={<TestInstituteRegister />} />
        <Route path="/register/club/premium" element={<TestClubRegister />} />
        <Route path="*" element={<TestLanding />} />
      </Routes>
    </Router>
  );
}

export default TestApp;