import React, { useState, useEffect } from 'react';
import { healthCheck } from '../api';

const BackendStatus = () => {
  const [status, setStatus] = useState('checking'); // 'checking', 'connected', 'disconnected'
  const [backendUrl, setBackendUrl] = useState('');

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        setBackendUrl(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
        await healthCheck();
        setStatus('connected');
      } catch (error) {
        setStatus('disconnected');
        console.error('Backend status check failed:', error);
      }
    };

    checkBackendStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (status === 'connected') {
    return (
      <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg text-xs z-50">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Backend Connected
        </div>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-xs z-50 max-w-xs">
        <div className="flex items-start">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 mt-1"></div>
          <div>
            <div className="font-semibold">Backend Disconnected</div>
            <div className="text-xs opacity-75">
              Cannot reach: {backendUrl}
            </div>
            <button 
              onClick={() => window.debugBackendConnection && window.debugBackendConnection()}
              className="mt-1 text-xs underline hover:no-underline"
            >
              Debug Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg text-xs z-50">
      <div className="flex items-center">
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-spin"></div>
        Checking Backend...
      </div>
    </div>
  );
};

export default BackendStatus;