import React from 'react';
import { FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const ActionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  type, // 'approve', 'reject', 'suspend', 'restart'
  eventName,
  loading = false
}) => {
  const [remarks, setRemarks] = React.useState('');
  
  if (!isOpen) return null;

  const getModalConfig = () => {
    switch (type) {
      case 'approve':
        return {
          title: 'Approve Event',
          message: `Are you sure you want to approve "${eventName}"?`,
          confirmText: 'Approve Event',
          confirmClass: 'bg-green-600 hover:bg-green-700',
          icon: FaCheck,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          remarksLabel: 'Approval notes (optional)',
          remarksPlaceholder: 'Add any notes about this approval...'
        };
      case 'reject':
        return {
          title: 'Reject Event',
          message: `Are you sure you want to reject "${eventName}"?`,
          confirmText: 'Reject Event',
          confirmClass: 'bg-red-600 hover:bg-red-700',
          icon: FaExclamationTriangle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          remarksLabel: 'Rejection reason (required)',
          remarksPlaceholder: 'Please provide a reason for rejection...',
          required: true
        };
      case 'suspend':
        return {
          title: 'Suspend Event',
          message: `Are you sure you want to suspend "${eventName}"?`,
          confirmText: 'Suspend Event',
          confirmClass: 'bg-orange-600 hover:bg-orange-700',
          icon: FaExclamationTriangle,
          iconColor: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          remarksLabel: 'Suspension reason (optional)',
          remarksPlaceholder: 'Enter reason for suspension...'
        };
      case 'restart':
        return {
          title: 'Restart Event',
          message: `Are you sure you want to restart "${eventName}"?`,
          confirmText: 'Restart Event',
          confirmClass: 'bg-blue-600 hover:bg-blue-700',
          icon: FaCheck,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          remarksLabel: 'Restart notes (optional)',
          remarksPlaceholder: 'Add any notes about restarting this event...'
        };
      default:
        return {};
    }
  };

  const config = getModalConfig();

  const handleConfirm = () => {
    if (config.required && !remarks.trim()) {
      alert('Please provide a reason for this action');
      return;
    }
    onConfirm(remarks);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className={`${config.bgColor} ${config.borderColor} border-b px-6 py-4`}>
          <div className="flex items-center">
            <config.icon className={`${config.iconColor} w-6 h-6 mr-3`} />
            <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">{config.message}</p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {config.remarksLabel}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={config.remarksPlaceholder}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (config.required && !remarks.trim())}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center ${config.confirmClass}`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              config.confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;