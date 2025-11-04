import React from 'react';
import { HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineIdentification, HiOutlineUsers } from 'react-icons/hi';
import { FaTrophy } from 'react-icons/fa';

const AdminStudentProfile = ({ user, theme }) => {
  const student = user.studentProfile;

  if (!student) {
    return <div className="text-gray-500">No student profile data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-6 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
            <HiOutlineIdentification className="text-white" size={24} />
          </div>
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem label="Full Name" value={student.name} theme={theme} />
          <InfoItem label="Father's Name" value={student.fatherName} theme={theme} />
          <InfoItem label="Gender" value={student.gender} theme={theme} />
          <InfoItem label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'} theme={theme} />
          <InfoItem label="Aadhaar" value={student.aadhaar ? `****${student.aadhaar.slice(-4)}` : 'N/A'} theme={theme} />
        </div>
      </div>

      {/* Address Information */}
      <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-6 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
            <HiOutlineLocationMarker className="text-white" size={24} />
          </div>
          Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Address" value={student.address} theme={theme} />
          <InfoItem label="District" value={student.district} theme={theme} />
          <InfoItem label="State" value={student.state} theme={theme} />
          <InfoItem label="Pincode" value={student.pincode} theme={theme} />
        </div>
      </div>

      {/* Sports Information */}
      <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-6 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
            <FaTrophy className="text-white" size={24} />
          </div>
          Sports & Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem label="Primary Sport" value={student.sport} theme={theme} />
          <InfoItem label="Secondary Sport" value={student.sport2} theme={theme} />
          <InfoItem label="Tertiary Sport" value={student.sport3} theme={theme} />
          <InfoItem label="Level" value={student.level} theme={theme} />
          <InfoItem label="School" value={student.school} theme={theme} />
          <InfoItem label="Club" value={student.club} theme={theme} />
        </div>
        {student.achievements && (
          <div className="mt-4">
            <label className={`block text-sm font-bold uppercase ${theme.iconColor} mb-2`}>Achievements</label>
            <p className="text-gray-800 bg-white rounded-xl p-4 border-2 border-gray-200">
              {Array.isArray(student.achievements)
                ? student.achievements.filter(Boolean).join(', ')
                : student.achievements}
            </p>
          </div>
        )}
      </div>

      {/* Coach Information */}
      {(student.coachName || student.coachMobile) && (
        <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-6 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
              <HiOutlineUserGroup className="text-white" size={24} />
            </div>
            Coach Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Coach Name" value={student.coachName} theme={theme} />
            <InfoItem label="Coach Mobile" value={student.coachMobile} theme={theme} />
          </div>
        </div>
      )}

      {/* Event Registrations */}
      {student.eventRegistrations && student.eventRegistrations.length > 0 && (
        <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-6 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
              <HiOutlineCalendar className="text-white" size={24} />
            </div>
            Event Registrations ({student.eventRegistrations.length})
          </h3>
          <div className="space-y-3">
            {student.eventRegistrations.slice(0, 5).map((reg, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{reg.event?.name || 'Event'}</div>
                  <div className="text-sm text-gray-600 mt-2 flex flex-wrap gap-3">
                    {reg.event?.sport && <span className="flex items-center gap-1">🏆 {reg.event.sport}</span>}
                    {reg.event?.city && <span className="flex items-center gap-1">📍 {reg.event.city}</span>}
                    {reg.event?.startDate && <span className="flex items-center gap-1">📅 {new Date(reg.event.startDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-xl text-xs font-bold border-2 ${
                  reg.status === 'REGISTERED' ? 'bg-green-100 text-green-700 border-green-300' :
                  reg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                  'bg-gray-100 text-gray-700 border-gray-300'
                }`}>
                  {reg.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach Connections */}
      {student.coachConnections && student.coachConnections.length > 0 && (
        <div className={`bg-gradient-to-br ${theme.bgGradient} rounded-2xl p-6 border-2 ${theme.badgeClass.split(' ')[0].replace('bg-', 'border-')}`}>
          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
              <HiOutlineUsers className="text-white" size={24} />
            </div>
            Connected Coaches ({student.coachConnections.length})
          </h3>
          <div className="space-y-3">
            {student.coachConnections.map((conn, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{conn.coach?.name}</div>
                  <div className="text-sm text-gray-600">{conn.coach?.specialization || 'Coach'}</div>
                  {conn.coach?.user?.uniqueId && (
                    <div className="text-xs text-gray-500 font-mono mt-1">UID: {conn.coach.user.uniqueId}</div>
                  )}
                </div>
                <span className={`px-4 py-2 rounded-xl text-xs font-bold border-2 ${
                  conn.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 border-green-300' :
                  conn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                  'bg-gray-100 text-gray-700 border-gray-300'
                }`}>
                  {conn.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Completion */}
      <div className={`bg-gradient-to-br ${theme.gradient} rounded-2xl p-6 text-white shadow-2xl border-4 border-white`}>
        <h3 className="text-2xl font-black mb-4">Profile Completion</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-white/20 rounded-full h-4 backdrop-blur-sm">
              <div 
                className="bg-white h-4 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${student.profileCompletion || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="text-4xl font-black">{student.profileCompletion || 0}%</div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, theme }) => (
  <div className="group bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-md">
    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme.iconColor}`}>{label}</label>
    <div className="text-base font-black text-gray-900">{value || 'N/A'}</div>
  </div>
);

export default AdminStudentProfile;
