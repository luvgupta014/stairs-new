import React, { useEffect, useState } from 'react';

const AlertModal = ({ isOpen, onClose, type = 'success', title, message, autoCloseSeconds = 0, onAutoClose }) => {
  const [countdown, setCountdown] = useState(autoCloseSeconds);

  useEffect(() => {
    if (isOpen && autoCloseSeconds > 0) {
      setCountdown(autoCloseSeconds);
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (onAutoClose) {
              onAutoClose();
            } else {
              onClose();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, autoCloseSeconds, onClose, onAutoClose]);

  if (!isOpen) return null;

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      messageColor: 'text-green-700',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      messageColor: 'text-red-700',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      messageColor: 'text-yellow-700',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  };

  const currentStyle = styles[type] || styles.success;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className={`relative ${currentStyle.bg} border ${currentStyle.border} rounded-lg shadow-xl max-w-md w-full p-6`}>
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className={`flex-shrink-0 ${currentStyle.iconBg} rounded-full p-3`}>
              <div className={currentStyle.iconColor}>
                {currentStyle.icon}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <h3 className={`text-lg font-semibold ${currentStyle.titleColor} mb-2`}>
                {title}
              </h3>
              <p className={`text-sm ${currentStyle.messageColor}`}>
                {message}
              </p>
              {countdown > 0 && (
                <p className={`text-xs ${currentStyle.messageColor} mt-2 font-medium`}>
                  Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
              )}
            </div>

            {/* Close button - Only show if not auto-closing */}
            {countdown === 0 && (
              <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Action button - Only show if not auto-closing */}
          {countdown === 0 && (
            <div className="mt-6">
              <button
                onClick={onClose}
                className={`w-full ${currentStyle.buttonBg} text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
