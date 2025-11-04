
import React from 'react';
import { HiOutlineIdentification, HiOutlineLocationMarker, HiOutlineUsers, HiOutlineCurrencyRupee, HiOutlineUserCircle, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';
import { FaTrophy } from 'react-icons/fa';

const AdminClubProfile = ({ user, theme }) => {
  const club = user.clubProfile;

  if (!club) {
    return <div className="text-gray-500">No club profile data available.</div>;
  }

  // Helper to render arrays as comma-separated text
  const renderArray = (arr) => Array.isArray(arr) ? arr.filter(Boolean).join(', ') : (typeof arr === 'string' && arr.startsWith('[') && arr.endsWith(']')) ? arr.replace(/\[|\]|"/g, '').split(',').map(s => s.trim()).join(', ') : (arr || 'N/A');

  return (
    <div className="space-y-8">
      {/* Club & President Details */}
      <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-8 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
            <HiOutlineIdentification className="text-white" size={24} />
          </div>
          Club Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <InfoItem label="Name" value={club.name} theme={theme} />
          <InfoItem label="Type" value={club.type} theme={theme} />
          <InfoItem label="Established" value={club.established} theme={theme} />
          <InfoItem label="Facilities" value={renderArray(club.facilities)} theme={theme} />
          <InfoItem label="Membership Types" value={renderArray(club.membershipTypes)} theme={theme} />
          <InfoItem 
            label="Payment Status" 
            value={
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                club.paymentStatus === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                club.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {club.paymentStatus}
              </span>
            }
            theme={theme}
          />
        </div>
        {/* President Details */}
        {(club.presidentName || club.presidentPhone || club.presidentEmail) && (
          <div className="mt-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <HiOutlineUserCircle className="text-orange-600" size={22} />
              President Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoItem label="President Name" value={club.presidentName} theme={theme} />
              <InfoItem label="President Phone" value={club.presidentPhone} theme={theme} />
              <InfoItem label="President Email" value={club.presidentEmail} theme={theme} />
            </div>
          </div>
        )}
      </div>

      {/* Location Information */}
      <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-8 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
            <HiOutlineLocationMarker className="text-white" size={24} />
          </div>
          Location Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Location" value={club.location} theme={theme} />
          <InfoItem label="City" value={club.city} theme={theme} />
          <InfoItem label="State" value={club.state} theme={theme} />
        </div>
      </div>

      {/* Stats */}
      <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-8 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
            <HiOutlineUsers className="text-white" size={24} />
          </div>
          Membership Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total Members" value={club.membersCount || 0} color="text-blue-600" />
          <StatCard label="Active Members" value={club.members?.filter(m => m.status === 'ACTIVE').length || 0} color="text-green-600" />
          <StatCard label="Enrolled" value={club.members?.length || 0} color="text-purple-600" />
        </div>
      </div>

      {/* Members List */}
      {club.members && club.members.length > 0 && (
        <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-8 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
              <FaTrophy className="text-white" size={24} />
            </div>
            Club Members ({club.members.length})
          </h3>
          <div className="space-y-3">
            {club.members.slice(0, 15).map((membership, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{membership.student?.name}</div>
                  <div className="text-sm text-gray-600">
                    {membership.student?.sport || 'Member'}
                    {membership.membershipType && <span className="ml-2">• {membership.membershipType}</span>}
                  </div>
                  {membership.student?.user?.uniqueId && (
                    <div className="text-xs text-gray-500 font-mono mt-1">UID: {membership.student.user.uniqueId}</div>
                  )}
                  {membership.joinedAt && (
                    <div className="text-xs text-gray-500 mt-1">Joined: {new Date(membership.joinedAt).toLocaleDateString()}</div>
                  )}
                </div>
                <span className={`px-4 py-2 rounded-xl text-xs font-bold border-2 ${
                  membership.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-300' :
                  membership.status === 'INACTIVE' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                  'bg-red-100 text-red-700 border-red-300'
                }`}>
                  {membership.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ label, value, theme }) => (
  <div className="group bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-md">
    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme?.iconColor || ''}`}>{label}</label>
    <div className="text-base font-black text-gray-900">{typeof value === 'object' && !React.isValidElement(value) ? (Array.isArray(value) ? value.filter(Boolean).join(', ') : JSON.stringify(value)) : (value || 'N/A')}</div>
  </div>
);

const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
    <div className="text-xs text-gray-500 uppercase mb-1">{label}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);

export default AdminClubProfile;
