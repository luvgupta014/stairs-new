// Environment Configuration
// This file dynamically determines the correct backend URL based on environment

/**
 * Determines the backend URL based on the current environment
 * Priority: Environment Variable > Auto-detection > Fallback
 */
function getBackendUrl() {
  // 1. Check environment variable first (highest priority)
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // 2. Auto-detect based on current domain (for production)
  const currentDomain = window.location.hostname;
  const currentProtocol = window.location.protocol;
  
  // Auto-detection rules
  if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
    // Development environment
    return 'http://localhost:5000';
  }
  
  if (currentDomain === '160.187.22.41') {
    // Production environment - same server, different port
    return `${currentProtocol}//${currentDomain}:5000`;
  }
  
  // For custom domains, assume backend is on same domain with /api path
  if (!currentDomain.includes('localhost')) {
    return `${currentProtocol}//${currentDomain}/api`;
  }
  
  // 3. Fallback to localhost (development default)
  return 'http://localhost:5000';
}

/**
 * Get the appropriate frontend URL for CORS and redirects
 */
function getFrontendUrl() {
  if (import.meta.env.VITE_FRONTEND_URL) {
    return import.meta.env.VITE_FRONTEND_URL;
  }
  
  return window.location.origin;
}

/**
 * Check if we're in development mode
 */
function isDevelopment() {
  return import.meta.env.MODE === 'development' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

/**
 * Check if we're in production mode
 */
function isProduction() {
  return import.meta.env.MODE === 'production' && !isDevelopment();
}

/**
 * Get environment-specific configuration
 */
function getEnvironmentConfig() {
  const config = {
    backendUrl: getBackendUrl(),
    frontendUrl: getFrontendUrl(),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    environment: import.meta.env.MODE || 'development',
    
    // API Configuration
    apiTimeout: isDevelopment() ? 10000 : 30000, // Longer timeout in production
    retryAttempts: isDevelopment() ? 2 : 3,
    
    // Debug Configuration  
    enableDebugLogs: isDevelopment(),
    enableNetworkLogs: isDevelopment(),
    
    // Feature Flags
    enableBackendStatusIndicator: true,
    enableConnectionDiagnostics: isDevelopment(),
    
    // External Services
    razorpayKey: import.meta.env.VITE_RAZORPAY_KEY_ID,
    googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  };
  
  // Log configuration in development
  if (config.enableDebugLogs) {
    console.log('🔧 Environment Configuration:', config);
  }
  
  return config;
}

// Export the configuration
export const config = getEnvironmentConfig();

// Export individual functions for testing
export {
  getBackendUrl,
  getFrontendUrl,
  isDevelopment,
  isProduction,
  getEnvironmentConfig
};

// Global debug function
window.debugEnvironmentConfig = () => {
  console.log('🔧 Current Environment Configuration:');
  console.table(config);
  
  // Test backend connectivity
  fetch(`${config.backendUrl}/health`)
    .then(response => {
      if (response.ok) {
        console.log('✅ Backend is reachable');
        return response.json();
      } else {
        console.log('⚠️ Backend responded but with error:', response.status);
      }
    })
    .then(data => {
      if (data) {
        console.log('📊 Backend Health:', data);
      }
    })
    .catch(error => {
      console.log('❌ Backend is not reachable:', error.message);
      console.log('🔧 Suggestions:');
      console.log('  - Check if backend server is running');
      console.log('  - Verify VITE_BACKEND_URL environment variable');
      console.log('  - Check network connectivity');
    });
};

// Validate configuration on load
if (config.enableDebugLogs) {
  console.log('🚀 STAIRS Frontend initialized');
  console.log(`📡 Backend URL: ${config.backendUrl}`);
  console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
  console.log(`🏗️ Environment: ${config.environment}`);
}