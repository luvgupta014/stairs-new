
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineUserCircle, HiOutlineMail, HiOutlineIdentification, HiOutlineUserGroup, HiOutlineCalendar, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineCheck, HiOutlineX, HiOutlineAcademicCap, HiOutlineCurrencyRupee, HiOutlineUsers } from 'react-icons/hi';
import AdminStudentProfile from './AdminStudentProfile';
import AdminCoachProfile from './AdminCoachProfile';
import AdminInstituteProfile from './AdminInstituteProfile';
import AdminClubProfile from './AdminClubProfile';
import AdminAdminProfile from './AdminAdminProfile';
import { getUserByUniqueId } from '../../api';

const roleLabels = {
  STUDENT: 'Student',
  COACH: 'Coach',
  INSTITUTE: 'Institute',
  CLUB: 'Club',
  ADMIN: 'Admin',
};

// Theme configurations for each role
const roleThemes = {
  STUDENT: {
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    bgGradient: 'from-blue-50 via-cyan-50 to-teal-50',
    accentColor: 'blue',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',
    iconColor: 'text-blue-600',
    hoverColor: 'hover:text-blue-600'
  },
  COACH: {
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    bgGradient: 'from-green-50 via-emerald-50 to-teal-50',
    accentColor: 'green',
    badgeClass: 'bg-green-100 text-green-700 border-green-300',
    iconColor: 'text-green-600',
    hoverColor: 'hover:text-green-600'
  },
  INSTITUTE: {
    gradient: 'from-purple-500 via-violet-500 to-indigo-500',
    bgGradient: 'from-purple-50 via-violet-50 to-indigo-50',
    accentColor: 'purple',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-300',
    iconColor: 'text-purple-600',
    hoverColor: 'hover:text-purple-600'
  },
  CLUB: {
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    bgGradient: 'from-orange-50 via-amber-50 to-yellow-50',
    accentColor: 'orange',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-300',
    iconColor: 'text-orange-600',
    hoverColor: 'hover:text-orange-600'
  },
  ADMIN: {
    gradient: 'from-red-500 via-rose-500 to-pink-500',
    bgGradient: 'from-red-50 via-rose-50 to-pink-50',
    accentColor: 'red',
    badgeClass: 'bg-red-100 text-red-700 border-red-300',
    iconColor: 'text-red-600',
    hoverColor: 'hover:text-red-600'
  },
};

const roleProfileComponent = {
  STUDENT: AdminStudentProfile,
  COACH: AdminCoachProfile,
  INSTITUTE: AdminInstituteProfile,
  CLUB: AdminClubProfile,
  ADMIN: AdminAdminProfile,
};

const AdminUserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getUserByUniqueId(userId)
      .then((data) => {
        setUser(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load user');
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-10 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-10 px-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-red-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiOutlineX className="text-red-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested user could not be found.'}</p>
          <Link to="/admin/users" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all hover:shadow-lg transform hover:-translate-y-0.5">
            ← Back to All Users
          </Link>
        </div>
      </div>
    );
  }

  const profile = user.studentProfile || user.coachProfile || user.instituteProfile || user.clubProfile || user.adminProfile;
  const ProfileComponent = user.role && roleProfileComponent[user.role];
  const theme = roleThemes[user.role] || roleThemes.STUDENT;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} py-10 px-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/admin/users" className={`inline-flex items-center ${theme.iconColor} ${theme.hoverColor} font-semibold text-lg transition-all hover:gap-3 gap-2`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Users
          </Link>
        </div>

        {/* Main Profile Card with Dynamic Theme */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100 mb-8 transform transition-all hover:shadow-3xl">
          {/* Animated Header Banner with Role Theme */}
          <div className={`h-48 bg-gradient-to-r ${theme.gradient} relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
              <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>
          </div>
          
          {/* Profile Content */}
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col lg:flex-row gap-8 -mt-20">
              {/* Avatar Section */}
              <div className="flex-shrink-0 lg:w-1/4">
                <div className="relative">
                  <div className="rounded-3xl bg-white p-3 shadow-2xl border-4 border-white">
                    <div className={`rounded-2xl bg-gradient-to-br ${theme.gradient} p-6 flex items-center justify-center`}>
                      <HiOutlineUserCircle className="text-white" size={120} />
                    </div>
                  </div>
                  {/* Status Badge Overlay */}
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {user.isActive && (
                      <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-green-500 text-white shadow-lg flex items-center gap-1">
                        <HiOutlineCheck size={14} /> Active
                      </span>
                    )}
                    {user.isVerified && (
                      <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-blue-500 text-white shadow-lg flex items-center gap-1">
                        <HiOutlineCheck size={14} /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* User Info Section */}
              <div className="flex-1 pt-4">
                <div className="mb-6">
                  <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">
                    {profile?.name || user.email}
                  </h1>
                  <div className="flex flex-wrap gap-3">
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${theme.badgeClass} shadow-sm`}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </div>
                </div>

                {/* Contact Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoCard icon={HiOutlineIdentification} label="User ID" value={user.uniqueId || 'N/A'} theme={theme} />
                  <InfoCard icon={HiOutlineMail} label="Email" value={user.email || 'N/A'} theme={theme} />
                  <InfoCard icon={HiOutlinePhone} label="Phone" value={user.phone || 'N/A'} theme={theme} />
                  <InfoCard icon={HiOutlineCalendar} label="Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} theme={theme} />
                  {profile?.state && (
                    <InfoCard 
                      icon={HiOutlineLocationMarker} 
                      label="Location" 
                      value={`${profile.city || profile.district || ''} ${profile.city || profile.district ? ',' : ''} ${profile.state}`} 
                      theme={theme} 
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role-Specific Details Card */}
        {ProfileComponent && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-100">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg`}>
                <HiOutlineUserGroup className="text-white" size={24} />
              </div>
              <h2 className="text-3xl font-black text-gray-900">
                {roleLabels[user.role]} Profile Details
              </h2>
            </div>
            <ProfileComponent user={user} theme={theme} />
          </div>
        )}
      </div>
    </div>
  );
};

// Info Card Component
const InfoCard = ({ icon: Icon, label, value, theme }) => (
  <div className="group bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg transform hover:-translate-y-1">
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
        <Icon className="text-white" size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-sm font-bold text-gray-900 break-words">{value}</div>
      </div>
    </div>
  </div>
);

export default AdminUserProfile;
