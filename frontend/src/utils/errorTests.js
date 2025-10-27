// Test utility for error popup functionality
import { parseLoginError } from '../utils/errorUtils';

export const testErrorMessages = () => {
  const testCases = [
    {
      input: 'Invalid credentials.',
      role: 'coach',
      expected: 'auth'
    },
    {
      input: 'No account found with this email address.',
      role: 'student', 
      expected: 'auth'
    },
    {
      input: 'Incorrect password. Please check your password and try again.',
      role: 'coach',
      expected: 'auth'
    },
    {
      input: 'Account not verified. Please check your email for verification instructions.',
      role: 'student',
      expected: 'warning'
    },
    {
      input: 'This account is registered as Student, not Coach/Coordinator.',
      role: 'coach',
      expected: 'auth'
    },
    {
      input: 'Network error occurred.',
      role: 'coach',
      expected: 'network'
    },
    {
      input: 'Too many login attempts.',
      role: 'student',
      expected: 'warning'
    },
    {
      input: 'Account is deactivated.',
      role: 'coach',
      expected: 'error'
    }
  ];

  console.group('🧪 Error Message Parsing Tests');
  
  testCases.forEach((testCase, index) => {
    const result = parseLoginError(testCase.input, testCase.role);
    const passed = result.type === testCase.expected;
    
    console.log(`Test ${index + 1}: ${passed ? '✅' : '❌'}`, {
      input: testCase.input,
      role: testCase.role,
      expected: testCase.expected,
      actual: result.type,
      title: result.title,
      message: result.message
    });
  });
  
  console.groupEnd();
};

// Call this in development to test
if (import.meta.env.DEV) {
  // Uncomment to run tests in console
  // testErrorMessages();
}