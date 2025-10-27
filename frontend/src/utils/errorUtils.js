// Utility functions for handling login errors and displaying appropriate messages

export const parseLoginError = (error, role = 'user') => {
  const errorMessage = error?.message || error || 'An unexpected error occurred';
  const lowerMessage = errorMessage.toLowerCase();

  // Authentication-related errors
  if (lowerMessage.includes('invalid credentials') || 
      lowerMessage.includes('incorrect password') ||
      lowerMessage.includes('wrong password') ||
      lowerMessage.includes('authentication failed') ||
      lowerMessage.includes('invalid email') ||
      lowerMessage.includes('invalid login') ||
      lowerMessage.includes('user not found') ||
      lowerMessage.includes('account not found')) {
    return {
      type: 'auth',
      title: 'Authentication Failed',
      message: `The email or password you entered is incorrect. Please check your credentials and try again.`
    };
  }

  // Account status errors
  if (lowerMessage.includes('account not verified') ||
      lowerMessage.includes('please verify') ||
      lowerMessage.includes('verification required') ||
      lowerMessage.includes('not verified')) {
    return {
      type: 'warning',
      title: 'Account Verification Required',
      message: 'Your account is not verified yet. Please check your email for verification instructions.'
    };
  }

  if (lowerMessage.includes('account suspended') ||
      lowerMessage.includes('account disabled') ||
      lowerMessage.includes('account blocked') ||
      lowerMessage.includes('suspended') ||
      lowerMessage.includes('deactivated')) {
    return {
      type: 'error',
      title: 'Account Suspended',
      message: 'Your account has been suspended. Please contact support for assistance.'
    };
  }

  if (lowerMessage.includes('pending approval') ||
      lowerMessage.includes('awaiting approval') ||
      lowerMessage.includes('not approved') ||
      lowerMessage.includes('approval pending')) {
    return {
      type: 'warning',
      title: 'Approval Pending',
      message: 'Your account is awaiting admin approval. You will receive an email once your account is approved.'
    };
  }

  // Network/Server errors
  if (lowerMessage.includes('network error') ||
      lowerMessage.includes('connection failed') ||
      lowerMessage.includes('server error') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('503') ||
      lowerMessage.includes('502') ||
      lowerMessage.includes('500')) {
    return {
      type: 'network',
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.'
    };
  }

  // Rate limiting
  if (lowerMessage.includes('too many attempts') ||
      lowerMessage.includes('rate limit') ||
      lowerMessage.includes('try again later')) {
    return {
      type: 'warning',
      title: 'Too Many Attempts',
      message: 'Too many login attempts. Please wait a few minutes before trying again.'
    };
  }

  // Role-specific errors
  if (lowerMessage.includes('role') || lowerMessage.includes('permission')) {
    const roleMap = {
      'coach': 'Coordinator',
      'student': 'Student', 
      'institute': 'Institute',
      'club': 'Club',
      'admin': 'Administrator'
    };
    const displayRole = roleMap[role] || role;
    
    return {
      type: 'auth',
      title: 'Invalid Account Type',
      message: `This account is not registered as a ${displayRole}. Please use the correct login portal or register as a ${displayRole}.`
    };
  }

  // Payment related errors
  if (lowerMessage.includes('payment') && lowerMessage.includes('required')) {
    return {
      type: 'warning',
      title: 'Payment Required',
      message: 'Your account requires payment activation. Please complete your payment to access all features.'
    };
  }

  // Generic fallback with helpful context
  return {
    type: 'error',
    title: 'Login Failed', 
    message: errorMessage.includes('Please try again') ? 
      errorMessage : 
      `${errorMessage}. Please verify your credentials and try again.`
  };
};

export const getLoginErrorConfig = (errorType, role) => {
  const roleMap = {
    'coach': 'Coordinator',
    'student': 'Student',
    'institute': 'Institute', 
    'club': 'Club'
  };
  
  const displayRole = roleMap[role] || role;
  
  const configs = {
    auth: {
      title: 'Authentication Failed',
      message: `Invalid email or password. Please check your ${displayRole.toLowerCase()} credentials and try again.`,
      suggestions: [
        'Double-check your email address',
        'Ensure your password is correct',
        'Try resetting your password if you forgot it'
      ]
    },
    network: {
      title: 'Connection Problem',
      message: 'Unable to reach the server. Please check your connection.',
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Contact support if the problem persists'
      ]
    },
    verification: {
      title: 'Account Not Verified',
      message: `Your ${displayRole.toLowerCase()} account needs verification.`,
      suggestions: [
        'Check your email for verification link',
        'Look in spam/junk folder',
        'Request a new verification email'
      ]
    }
  };
  
  return configs[errorType] || configs.auth;
};