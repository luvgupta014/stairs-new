import React from 'react';
import { HiOutlineIdentification, HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineCurrencyRupee, HiOutlineUsers, HiOutlineStar, HiOutlineAcademicCap } from 'react-icons/hi';
import { FaTrophy } from 'react-icons/fa';

const AdminCoachProfile = ({ user }) => {
  const coach = user.coachProfile;

  if (!coach) {
    return <div className="text-gray-500">No coach profile data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineIdentification className="text-green-600" size={24} />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem label="Full Name" value={coach.name} />
          <InfoItem label="Father's Name" value={coach.fatherName} />
          <InfoItem label="Mother's Name" value={coach.motherName} />
          <InfoItem label="Gender" value={coach.gender} />
          <InfoItem label="Date of Birth" value={coach.dateOfBirth ? new Date(coach.dateOfBirth).toLocaleDateString() : 'N/A'} />
          <InfoItem label="Aadhaar" value={coach.aadhaar ? `****${coach.aadhaar.slice(-4)}` : 'N/A'} />
          <InfoItem label="PAN Number" value={coach.panNumber ? `****${coach.panNumber.slice(-4)}` : 'N/A'} />
          <InfoItem label="UTR Number" value={coach.utrNumber} />
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineLocationMarker className="text-blue-600" size={24} />
          Location Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem label="Address" value={coach.address} />
          <InfoItem label="City" value={coach.city} />
          <InfoItem label="District" value={coach.district} />
          <InfoItem label="State" value={coach.state} />
          <InfoItem label="Pincode" value={coach.pincode} />
          <InfoItem label="Location" value={coach.location} />
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaTrophy className="text-orange-600" size={24} />
          Professional Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem label="Primary Sport" value={coach.primarySport} />
          <InfoItem label="Other Sports" value={coach.otherSports} />
          <InfoItem label="Specialization" value={coach.specialization} />
          <InfoItem label="Experience (Years)" value={coach.experience} />
          <InfoItem label="Applying As" value={coach.applyingAs} />
          <InfoItem label="Membership Status" value={coach.membershipStatus} />
        </div>
        {coach.certifications && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <HiOutlineAcademicCap className="text-orange-600" size={20} />
              Certifications
            </label>
            <p className="text-gray-800 bg-white rounded-lg p-4 border border-orange-200">
              {Array.isArray(coach.certifications)
                ? coach.certifications.filter(Boolean).join(', ')
                : coach.certifications}
            </p>
          </div>
        )}
        {coach.bio && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <p className="text-gray-800 bg-white rounded-lg p-4 border border-orange-200">{coach.bio}</p>
          </div>
        )}
      </div>

      {/* Stats & Rating */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineStar className="text-purple-600" size={24} />
          Performance & Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Rating" value={coach.rating ? `${coach.rating.toFixed(1)} ⭐` : 'N/A'} color="text-yellow-600" />
          <StatCard label="Total Students" value={coach.totalStudents || 0} color="text-blue-600" />
          <StatCard label="Active" value={coach.isActive ? 'Yes' : 'No'} color={coach.isActive ? 'text-green-600' : 'text-red-600'} />
          <StatCard label="Events Created" value={coach.events?.length || 0} color="text-purple-600" />
        </div>
      </div>

      {/* Payment & Subscription */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineCurrencyRupee className="text-cyan-600" size={24} />
          Payment & Subscription
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem 
            label="Payment Status" 
            value={
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                coach.paymentStatus === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                coach.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {coach.paymentStatus}
              </span>
            } 
          />
          <InfoItem 
            label="Subscription Type" 
            value={
              coach.subscriptionType === 'ANNUAL' 
                ? 'Annual (Financial Year: Apr 1 - Mar 31)' 
                : coach.subscriptionType || 'N/A'
            } 
          />
          <InfoItem 
            label="Subscription Expires" 
            value={coach.subscriptionExpiresAt ? new Date(coach.subscriptionExpiresAt).toLocaleDateString() : 'N/A'} 
          />
        </div>
        {coach.payments && coach.payments.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Recent Payments</label>
            <div className="space-y-2">
              {coach.payments.slice(0, 3).map((payment, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-cyan-200 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{payment.type}</div>
                    <div className="text-xs text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">₹{payment.amount}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      payment.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                      payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Events Created */}
      {coach.events && coach.events.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineCalendar className="text-indigo-600" size={24} />
            Events Created ({coach.events.length})
          </h3>
          <div className="space-y-3">
            {coach.events.slice(0, 5).map((event, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-indigo-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{event.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {event.sport && <span className="mr-3">🏆 {event.sport}</span>}
                      {event.city && <span className="mr-3">📍 {event.city}</span>}
                      {event.startDate && <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Participants: {event.currentParticipants || 0}/{event.maxParticipants}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    event.status === 'APPROVED' || event.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    event.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    event.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Students */}
      {coach.studentConnections && coach.studentConnections.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineUsers className="text-rose-600" size={24} />
            Connected Students ({coach.studentConnections.length})
          </h3>
          <div className="space-y-3">
            {coach.studentConnections.slice(0, 5).map((conn, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-rose-200 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-900">{conn.student?.name}</div>
                  <div className="text-sm text-gray-600">{conn.student?.sport || 'Athlete'}</div>
                  {conn.student?.user?.uniqueId && (
                    <div className="text-xs text-gray-500 font-mono mt-1">UID: {conn.student.user.uniqueId}</div>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  conn.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                  conn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {conn.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{label}</label>
    <div className="text-gray-900 font-medium">{typeof value === 'object' ? value : (value || 'N/A')}</div>
  </div>
);

const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
    <div className="text-xs text-gray-500 uppercase mb-1">{label}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);

export default AdminCoachProfile;
