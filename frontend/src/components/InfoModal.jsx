import React from 'react';
import { FaTimes, FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const InfoModal = ({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  type = 'info', // 'info', 'success', 'warning', 'error'
  data = null,
  showCloseButton = true 
}) => {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: FaCheckCircle,
          iconColor: 'text-green-500',
          borderColor: 'border-green-200',
          bgColor: 'bg-green-50'
        };
      case 'warning':
        return {
          icon: FaExclamationTriangle,
          iconColor: 'text-amber-500',
          borderColor: 'border-amber-200',
          bgColor: 'bg-amber-50'
        };
      case 'error':
        return {
          icon: FaTimesCircle,
          iconColor: 'text-red-500',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50'
        };
      default:
        return {
          icon: FaInfoCircle,
          iconColor: 'text-blue-500',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50'
        };
    }
  };

  const { icon: Icon, iconColor, borderColor, bgColor } = getTypeConfig();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`${bgColor} ${borderColor} border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Icon className={`${iconColor} w-6 h-6 mr-3`} />
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {typeof content === 'string' ? (
            <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
          ) : (
            content
          )}
          
          {/* Additional data display */}
          {data && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Details:</h4>
              <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                {typeof data === 'object' ? JSON.stringify(data, null, 2) : data}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;