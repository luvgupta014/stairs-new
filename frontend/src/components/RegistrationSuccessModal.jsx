import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaCopy, FaTimes } from 'react-icons/fa';

const RegistrationSuccessModal = ({ 
  isOpen, 
  onClose, 
  uniqueId, 
  role, 
  userName,
  onContinue 
}) => {
  const [copied, setCopied] = React.useState(false);

  const formatUniqueId = (id) => {
    if (!id || id.length !== 12) return id;
    return `${id.substring(0, 2)}-${id.substring(2, 8)}-${id.substring(8, 12)}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uniqueId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleColor = (role) => {
    const colors = {
      STUDENT: 'blue',
      COACH: 'green',
      INSTITUTE: 'purple',
      CLUB: 'orange'
    };
    return colors[role] || 'blue';
  };

  const color = getRoleColor(role);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${
            color === 'blue' ? 'from-blue-500 to-blue-600' :
            color === 'green' ? 'from-green-500 to-green-600' :
            color === 'purple' ? 'from-purple-500 to-purple-600' :
            'from-orange-500 to-orange-600'
          } p-6 text-white relative`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <FaCheckCircle className="w-8 h-8" />
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
              <p className="text-lg opacity-90">
                Welcome to STAIRS, {userName}!
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your Unique STAIRS ID
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This is your unique identification number. Please save it for future reference.
              </p>
              
              {/* Unique ID Display */}
              <div className={`bg-gradient-to-r ${
                color === 'blue' ? 'from-blue-50 to-blue-100 border-blue-200' :
                color === 'green' ? 'from-green-50 to-green-100 border-green-200' :
                color === 'purple' ? 'from-purple-50 to-purple-100 border-purple-200' :
                'from-orange-50 to-orange-100 border-orange-200'
              } border-2 rounded-xl p-4 mb-4`}>
                <div className="font-mono text-2xl font-bold text-gray-900 tracking-wider">
                  {formatUniqueId(uniqueId)}
                </div>
                
                <button
                  onClick={copyToClipboard}
                  className={`mt-3 inline-flex items-center space-x-2 px-4 py-2 ${
                    color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                    color === 'green' ? 'bg-green-500 hover:bg-green-600' :
                    color === 'purple' ? 'bg-purple-500 hover:bg-purple-600' :
                    'bg-orange-500 hover:bg-orange-600'
                  } text-white rounded-lg transition-colors`}
                >
                  <FaCopy className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-gray-900 mb-2">Important Notes:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use this ID for all STAIRS communications</li>
                  <li>• Keep this ID safe and secure</li>
                  <li>• You can find this ID in your profile dashboard</li>
                  <li>• Contact support if you lose this ID</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={onContinue}
                className={`flex-1 px-4 py-3 ${
                  color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                  color === 'green' ? 'bg-green-500 hover:bg-green-600' :
                  color === 'purple' ? 'bg-purple-500 hover:bg-purple-600' :
                  'bg-orange-500 hover:bg-orange-600'
                } text-white rounded-lg transition-colors font-medium`}
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RegistrationSuccessModal;