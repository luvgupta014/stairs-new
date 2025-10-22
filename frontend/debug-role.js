// Debug script to check user role format
console.log('🔍 Checking user role format in localStorage...\n');

// Check what's stored in localStorage
const authToken = localStorage.getItem('authToken');
const userRole = localStorage.getItem('userRole');
const user = localStorage.getItem('user');

console.log('Auth Token exists:', !!authToken);
console.log('User Role in localStorage:', userRole);

if (user) {
  try {
    const parsedUser = JSON.parse(user);
    console.log('Parsed User Object:', {
      role: parsedUser.role,
      id: parsedUser.id,
      email: parsedUser.email
    });
    
    console.log('\n📝 Role Comparison:');
    console.log('  user.role === "STUDENT":', parsedUser.role === 'STUDENT');
    console.log('  user.role === "student":', parsedUser.role === 'student');
    console.log('  Actual role value:', `"${parsedUser.role}"`);
    
    if (parsedUser.role === 'STUDENT') {
      console.log('\n✅ Role is uppercase "STUDENT" - EventCard fixes should work');
    } else if (parsedUser.role === 'student') {
      console.log('\n✅ Role is lowercase "student" - EventCard fixes should work');
    } else {
      console.log('\n❓ Unexpected role format:', parsedUser.role);
    }
    
  } catch (error) {
    console.log('❌ Error parsing user object:', error.message);
  }
} else {
  console.log('❌ No user object found in localStorage');
}

console.log('\n💡 If you see this in browser console after login:');
console.log('   1. The EventCard should now show "View Details" button');
console.log('   2. Clicking it should navigate to event details page');
console.log('   3. The EventDetails page should load properly for students');