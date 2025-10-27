import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationCircle, FaTimes, FaLock, FaUserTimes, FaWifi, FaExclamationTriangle } from 'react-icons/fa';

const ErrorPopup = ({ 
  isOpen, 
  onClose, 
  title = "Error", 
  message, 
  type = "error" // error, warning, network, auth
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Auto close after 5 seconds unless it's a critical error
      if (type !== 'auth') {
        const timer = setTimeout(() => {
          onClose();
        }, 5000);
        return () => {
          document.removeEventListener('keydown', handleEscape);
          clearTimeout(timer);
        };
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, type]);

  const getIconAndColor = () => {
    switch (type) {
      case 'auth':
        return {
          icon: <FaLock className="text-3xl" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-500',
          titleColor: 'text-red-900',
          messageColor: 'text-red-700',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'network':
        return {
          icon: <FaWifi className="text-3xl" />,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-500',
          titleColor: 'text-orange-900',
          messageColor: 'text-orange-700',
          buttonColor: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'warning':
        return {
          icon: <FaExclamationTriangle className="text-3xl" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-500',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-700',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          icon: <FaExclamationCircle className="text-3xl" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-500',
          titleColor: 'text-red-900',
          messageColor: 'text-red-700',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
    }
  };

  const { icon, bgColor, borderColor, iconColor, titleColor, messageColor, buttonColor } = getIconAndColor();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 ${bgColor} border ${borderColor}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className={`${iconColor} mr-3`}>
                  {icon}
                </div>
                <h3 className={`text-xl font-semibold ${titleColor}`}>
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className={`text-sm ${messageColor} leading-relaxed mb-4`}>
                {message}
              </p>

              {/* Helpful suggestions based on error type */}
              {type === 'auth' && (
                <div className={`${bgColor} border-l-4 border-red-400 p-3 mb-4`}>
                  <div className="text-xs">
                    <p className={`font-medium ${titleColor} mb-1`}>Quick Tips:</p>
                    <ul className={`${messageColor} space-y-1`}>
                      <li>• Double-check your email address</li>
                      <li>• Ensure Caps Lock is off when typing password</li>
                      <li>• Try resetting your password if forgotten</li>
                    </ul>
                  </div>
                </div>
              )}

              {type === 'network' && (
                <div className={`${bgColor} border-l-4 border-orange-400 p-3 mb-4`}>
                  <div className="text-xs">
                    <p className={`font-medium ${titleColor} mb-1`}>Troubleshooting:</p>
                    <ul className={`${messageColor} space-y-1`}>
                      <li>• Check your internet connection</li>
                      <li>• Try refreshing the page</li>
                      <li>• Contact support if issue persists</li>
                    </ul>
                  </div>
                </div>
              )}

              {type === 'warning' && (
                <div className={`${bgColor} border-l-4 border-yellow-400 p-3 mb-4`}>
                  <div className="text-xs">
                    <p className={`font-medium ${titleColor} mb-1`}>Next Steps:</p>
                    <ul className={`${messageColor} space-y-1`}>
                      <li>• Check your email inbox (including spam)</li>
                      <li>• Wait a few minutes before retrying</li>
                      <li>• Contact support if you need help</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className={`px-6 py-2 ${buttonColor} text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                >
                  {type === 'auth' ? 'Try Again' : type === 'network' ? 'Retry' : 'Understood'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ErrorPopup;