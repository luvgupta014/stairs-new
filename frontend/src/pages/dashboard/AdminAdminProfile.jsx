import React from 'react';
import { HiOutlineIdentification, HiOutlineShieldCheck, HiOutlineCalendar } from 'react-icons/hi';

const AdminAdminProfile = ({ user }) => {
  const admin = user.adminProfile;

  if (!admin) {
    return <div className="text-gray-500">No admin profile data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Admin Information */}
      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineIdentification className="text-red-600" size={24} />
          Administrator Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Name" value={admin.name} />
          <InfoItem 
            label="Admin Role" 
            value={
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                admin.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                admin.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' :
                admin.role === 'AUTHORIZER' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {admin.role}
              </span>
            } 
          />
          <InfoItem label="Permissions" value={admin.permissions || 'Full Access'} />
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineShieldCheck className="text-blue-600" size={24} />
          Account Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem 
            label="Account Status" 
            value={
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            } 
          />
          <InfoItem 
            label="Verified" 
            value={
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                user.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {user.isVerified ? 'Yes' : 'No'}
              </span>
            } 
          />
        </div>
      </div>

      {/* Timestamps */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineCalendar className="text-gray-600" size={24} />
          Timestamps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Admin Since" value={admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} />
          <InfoItem label="Last Updated" value={admin.updatedAt ? new Date(admin.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} />
        </div>
      </div>

      {/* Admin Privileges Notice */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <HiOutlineShieldCheck className="text-amber-600" size={32} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Administrator Privileges</h4>
            <p className="text-sm text-gray-700">
              This user has administrative access to the system with {admin.role === 'SUPER_ADMIN' ? 'full super admin' : admin.role === 'ADMIN' ? 'admin' : 'limited'} privileges. 
              They can manage users, approve events, handle orders, and access all system features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{label}</label>
    <div className="text-gray-900 font-medium">{typeof value === 'object' ? value : (value || 'N/A')}</div>
  </div>
);

export default AdminAdminProfile;
