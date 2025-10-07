import React, { useState } from 'react';
import { FaCopy, FaIdCard, FaCheck } from 'react-icons/fa';

const ProfileIdCard = ({ uniqueId, role, name }) => {
  const [copied, setCopied] = useState(false);

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

  if (!uniqueId) return null;

  return (
    <div className={`bg-gradient-to-r ${
      color === 'blue' ? 'from-blue-50 to-blue-100 border-blue-200' :
      color === 'green' ? 'from-green-50 to-green-100 border-green-200' :
      color === 'purple' ? 'from-purple-50 to-purple-100 border-purple-200' :
      'from-orange-50 to-orange-100 border-orange-200'
    } border rounded-xl p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 ${
            color === 'blue' ? 'bg-blue-500' :
            color === 'green' ? 'bg-green-500' :
            color === 'purple' ? 'bg-purple-500' :
            'bg-orange-500'
          } rounded-lg flex items-center justify-center`}>
            <FaIdCard className="text-white text-xl" />
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900">STAIRS ID</h3>
            <p className="text-sm text-gray-600">{name}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-lg font-bold text-gray-900 tracking-wider mb-2">
            {formatUniqueId(uniqueId)}
          </div>
          
          <button
            onClick={copyToClipboard}
            className={`inline-flex items-center space-x-1 px-3 py-1 ${
              color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
              color === 'green' ? 'bg-green-500 hover:bg-green-600' :
              color === 'purple' ? 'bg-purple-500 hover:bg-purple-600' :
              'bg-orange-500 hover:bg-orange-600'
            } text-white rounded-lg text-xs transition-colors`}
          >
            {copied ? (
              <>
                <FaCheck className="w-3 h-3" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <FaCopy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Use this ID for all STAIRS communications and support requests
        </p>
      </div>
    </div>
  );
};

export default ProfileIdCard;