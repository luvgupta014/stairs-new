
import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../../api';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineExternalLink, HiOutlineDownload } from 'react-icons/hi';

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'STUDENT', label: 'Athletes' },
  { value: 'COACH', label: 'Coaches' },
  { value: 'COORDINATOR', label: 'Coordinators' },
  { value: 'INSTITUTE', label: 'Institutes' },
  { value: 'CLUB', label: 'Clubs' },
  { value: 'ADMIN', label: 'Admins' },
  { value: 'EVENT_INCHARGE', label: 'Event Incharge' },
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
];

const getRoleColor = (role) => {
  const colors = {
    STUDENT: 'bg-blue-100 text-blue-800 border border-blue-300',
    COACH: 'bg-green-100 text-green-800 border border-green-300',
    INSTITUTE: 'bg-purple-100 text-purple-800 border border-purple-300',
    CLUB: 'bg-orange-100 text-orange-800 border border-orange-300',
    ADMIN: 'bg-red-100 text-red-800 border border-red-300',
    EVENT_INCHARGE: 'bg-indigo-100 text-indigo-800 border border-indigo-300'
  };
  return colors[role] || 'bg-gray-100 text-gray-800 border border-gray-300';
};

const PAGE_SIZE = 10;

const AllUsers = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchUsers = async (page = 1, filtersOverride = null) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...((filtersOverride || filters).role && { role: (filtersOverride || filters).role }),
        ...((filtersOverride || filters).status && { status: (filtersOverride || filters).status }),
        ...((filtersOverride || filters).search && { search: (filtersOverride || filters).search }),
      };
      const res = await getAllUsers(params);
      setUsers(res.data.users || []);
      setPagination({ ...res.data.pagination });
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const exportUsers = async () => {
    setExporting(true);
    try {
      // Fetch all users without pagination
      const params = {
        page: 1,
        limit: 10000, // Large limit to get all users
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      };
      const res = await getAllUsers(params);
      const allUsers = res.data.users || [];

      // Convert to CSV with complete profile details
      const headers = [
        'Name', 'Email', 'UID', 'Phone', 'Role', 'Status', 'Verified', 'Joined',
        'Date of Birth', 'Gender', 'Sport', 'Level', 'Address', 'City', 'State', 'District', 'Pincode',
        'Father Name', 'Aadhaar', 'School', 'Club', 'Coach Name', 'Achievements'
      ];
      const rows = allUsers.map(user => {
        const profile = user.studentProfile || user.coachProfile || user.instituteProfile || user.clubProfile || user.adminProfile || {};
        const name = profile.name || user.email || 'N/A';
        
        return [
          name,
          user.email || 'N/A',
          user.uniqueId || 'N/A',
          user.phone || 'N/A',
          user.role || 'N/A',
          user.isActive ? 'Active' : 'Inactive',
          user.isVerified ? 'Yes' : 'No',
          user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
          // Student profile details
          profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A',
          profile.gender || 'N/A',
          profile.sport || 'N/A',
          profile.level || 'N/A',
          profile.address || 'N/A',
          profile.city || 'N/A',
          profile.state || 'N/A',
          profile.district || 'N/A',
          profile.pincode || 'N/A',
          profile.fatherName || 'N/A',
          profile.aadhaar || 'N/A',
          profile.school || 'N/A',
          profile.club || 'N/A',
          profile.coachName || 'N/A',
          profile.achievements || 'N/A'
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err.message || 'Failed to export users');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    // Read query parameters from URL
    const searchParams = new URLSearchParams(location.search);
    const roleParam = searchParams.get('role');
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');
    
    // Set initial filters from URL if present
    const initialFilters = {
      role: roleParam || '',
      status: statusParam || '',
      search: searchParam || ''
    };
    
    setFilters(initialFilters);
    fetchUsers(1, initialFilters);
    // eslint-disable-next-line
  }, [location.search]);


  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchUsers(1, newFilters);
  };

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1, filters);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUsers(newPage);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Users</h1>
        <button
          onClick={exportUsers}
          disabled={exporting || loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <HiOutlineDownload size={20} />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
      <form className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleSearchSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={filters.role}
            onChange={e => handleFilterChange('role', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by name, email or uid..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            disabled={loading}
          >
            Search
          </button>
        </div>
      </form>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">UID</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No users found.</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <Link
                    to={`/admin/users/${user.uniqueId}`}
                    className="group inline-flex items-center gap-1 text-gray-900 font-semibold transition-colors hover:text-blue-600 focus:text-blue-700 focus:outline-none"
                  >
                    {user.studentProfile?.name || user.coachProfile?.name || user.instituteProfile?.name || user.clubProfile?.name || user.adminProfile?.name || user.email}
                    <HiOutlineExternalLink className="ml-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 text-blue-400 transition-opacity" size={16} />
                  </Link>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  <Link
                    to={`/admin/users/${user.uniqueId}`}
                    className="group inline-flex items-center gap-1 text-gray-700 font-mono text-xs font-medium transition-colors hover:text-blue-600 focus:text-blue-700 focus:outline-none"
                  >
                    {user.email}
                    <HiOutlineExternalLink className="ml-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 text-blue-400 transition-opacity" size={14} />
                  </Link>
                </td>
                <td className="py-3 px-4 text-blue-600 font-mono text-xs font-medium">
                  <Link
                    to={`/admin/users/${user.uniqueId}`}
                    className="group inline-flex items-center gap-1 text-blue-700 font-mono text-xs font-medium transition-colors hover:text-blue-800 focus:text-blue-900 focus:outline-none"
                  >
                    {user.uniqueId}
                    <HiOutlineExternalLink className="ml-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 text-blue-400 transition-opacity" size={13} />
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>{user.role}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive && user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {user.isActive && user.isVerified ? 'Active' : 'Pending'}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1 || loading}
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
        </span>
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AllUsers;
