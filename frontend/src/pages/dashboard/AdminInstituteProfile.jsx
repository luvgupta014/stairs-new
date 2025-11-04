
import React from 'react';
import { HiOutlineIdentification, HiOutlineLocationMarker, HiOutlineUsers, HiOutlineAcademicCap, HiOutlineCurrencyRupee, HiOutlineUserCircle, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';

const AdminInstituteProfile = ({ user, theme }) => {
  const institute = user.instituteProfile;

  if (!institute) {
    return <div className="text-gray-500">No institute profile data available.</div>;
  }

  // Helper to render arrays as comma-separated text
  const renderArray = (arr) => Array.isArray(arr) ? arr.filter(Boolean).join(', ') : (typeof arr === 'string' && arr.startsWith('[') && arr.endsWith(']')) ? arr.replace(/\[|\]|"/g, '').split(',').map(s => s.trim()).join(', ') : (arr || 'N/A');

  return (
    <div className="space-y-8">
      {/* Institute & Principal Details */}
      <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-8 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
            <HiOutlineIdentification className="text-white" size={24} />
          </div>
          Institute Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <InfoItem label="Name" value={institute.name} theme={theme} />
          <InfoItem label="Type" value={institute.type} theme={theme} />
          <InfoItem label="Established" value={institute.established} theme={theme} />
          <InfoItem label="Sports Offered" value={renderArray(institute.sportsOffered)} theme={theme} />
          <InfoItem 
            label="Payment Status" 
            value={
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                institute.paymentStatus === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                institute.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {institute.paymentStatus}
              </span>
            }
            theme={theme}
          />
        </div>
        {/* Principal Details */}
        {(institute.principalName || institute.principalPhone || institute.principalEmail) && (
          <div className="mt-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <HiOutlineUserCircle className="text-purple-600" size={22} />
              Principal Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoItem label="Principal Name" value={institute.principalName} theme={theme} />
              <InfoItem label="Principal Phone" value={institute.principalPhone} theme={theme} />
              <InfoItem label="Principal Email" value={institute.principalEmail} theme={theme} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem label="Location" value={institute.location} theme={theme} />
          <InfoItem label="City" value={institute.city} theme={theme} />
          <InfoItem label="State" value={institute.state} theme={theme} />
          <InfoItem label="Pincode" value={institute.pincode} theme={theme} />
        </div>
      </div>

      {/* Stats */}
      <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-8 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
            <HiOutlineUsers className="text-white" size={24} />
          </div>
          Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Students" value={institute.studentsCount || 0} color="text-blue-600" />
          <StatCard label="Coaches" value={institute.coachesCount || 0} color="text-green-600" />
          <StatCard label="Enrolled" value={institute.students?.length || 0} color="text-purple-600" />
          <StatCard label="Staff" value={institute.coaches?.length || 0} color="text-orange-600" />
        </div>
      </div>

      {/* Students */}
      {institute.students && institute.students.length > 0 && (
        <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-8 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
              <HiOutlineAcademicCap className="text-white" size={24} />
            </div>
            Students ({institute.students.length})
          </h3>
          <div className="space-y-3">
            {institute.students.slice(0, 10).map((enrollment, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{enrollment.student?.name}</div>
                  <div className="text-sm text-gray-600">{enrollment.student?.sport || 'Sport not specified'}</div>
                  {enrollment.student?.user?.uniqueId && (
                    <div className="text-xs text-gray-500 font-mono mt-1">UID: {enrollment.student.user.uniqueId}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coaches */}
      {institute.coaches && institute.coaches.length > 0 && (
        <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-8 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
              <HiOutlineUsers className="text-white" size={24} />
            </div>
            Coaches ({institute.coaches.length})
          </h3>
          <div className="space-y-3">
            {institute.coaches.map((enrollment, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{enrollment.coach?.name}</div>
                  <div className="text-sm text-gray-600">{enrollment.coach?.specialization || 'Coach'}</div>
                  {enrollment.coach?.user?.uniqueId && (
                    <div className="text-xs text-gray-500 font-mono mt-1">UID: {enrollment.coach.user.uniqueId}</div>
                  )}
                </div>
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

export default AdminInstituteProfile;
