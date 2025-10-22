// Debug script to check student event details functionality
// Run this in browser console when logged in as a student

console.log('=== Student Event Details Debug ===');

// 1. Check current user in localStorage
const authToken = localStorage.getItem('authToken');
const userStr = localStorage.getItem('user');

console.log('🔐 Auth Token:', authToken ? 'Present' : 'Missing');
console.log('👤 User data:', userStr);

if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log('📊 Parsed user role:', user.role);
    console.log('📊 User role type:', typeof user.role);
    console.log('📊 Role comparison:', {
      'student': user.role === 'student',
      'STUDENT': user.role === 'STUDENT',
      'lowercase': user.role?.toLowerCase() === 'student'
    });
  } catch (e) {
    console.error('❌ Error parsing user data:', e);
  }
}

// 2. Check AuthContext
if (window.React && window.ReactDOM) {
  console.log('⚛️ React detected - check AuthContext');
}

// 3. Test event card role checks
console.log('🎯 Testing EventCard role checks...');
const testUserRoles = ['student', 'STUDENT', 'Student'];
testUserRoles.forEach(role => {
  const studentCheck = (role === 'student' || role === 'STUDENT');
  console.log(`Role "${role}" -> Student check: ${studentCheck}`);
});

// 4. Check current page and buttons
const viewDetailsButtons = document.querySelectorAll('button:contains("View Details")');
console.log('🔍 View Details buttons found:', viewDetailsButtons.length);

// Manual button check
const allButtons = document.querySelectorAll('button');
const viewButtons = Array.from(allButtons).filter(btn => 
  btn.textContent.includes('View Details') || btn.textContent.includes('View')
);
console.log('👀 All View buttons:', viewButtons.length);
viewButtons.forEach((btn, i) => {
  console.log(`Button ${i}:`, btn.textContent, btn.disabled ? '(disabled)' : '(enabled)');
});

console.log('=== Debug Complete ===');