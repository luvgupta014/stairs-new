import React, { useState, useEffect } from 'react';
import { FaRupeeSign, FaTrophy, FaCertificate, FaMedal, FaChartLine, FaUsers, FaCrown, FaCalendarAlt, FaDownload, FaFilter } from 'react-icons/fa';
import api from '../api';
import BackButton from '../components/BackButton';

const AdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState('90');
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'line'
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [source, setSource] = useState('ALL'); // ALL | PAYMENTS | ORDERS
  const [paymentBucket, setPaymentBucket] = useState('ALL'); // ALL | SUBSCRIPTIONS | COORDINATOR_EVENT_FEES | STUDENT_EVENT_FEES | OTHER
  const [userType, setUserType] = useState('ALL'); // ALL | STUDENT | COACH | INSTITUTE | CLUB | ADMIN
  const [query, setQuery] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  useEffect(() => {
    fetchRevenueDashboard();
  }, [dateRange]);

  // Real-time refresh (polling). Keeps dashboard accurate without manual reload.
  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      fetchRevenueDashboard(true);
    }, 30000); // 30s
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, dateRange]);

  const fetchRevenueDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const bucketToPaymentTypes = (bucket) => {
        const b = String(bucket || '').toUpperCase();
        if (b === 'SUBSCRIPTIONS') return ['REGISTRATION', 'SUBSCRIPTION', 'SUBSCRIPTION_MONTHLY', 'SUBSCRIPTION_ANNUAL'];
        if (b === 'COORDINATOR_EVENT_FEES') return ['EVENT_REGISTRATION', 'EVENT_FEE'];
        if (b === 'STUDENT_EVENT_FEES') return ['EVENT_STUDENT_FEE'];
        return null; // ALL/OTHER handled by backend via q or no filter
      };

      const params = new URLSearchParams();
      params.set('dateRange', String(dateRange));
      if (source && source !== 'ALL') params.set('source', source);

      const types = bucketToPaymentTypes(paymentBucket);
      if (types && types.length) params.set('paymentTypes', types.join(','));
      if (userType && userType !== 'ALL') params.set('userTypes', userType);
      if (query && query.trim()) params.set('q', query.trim());
      if (minAmount !== '') params.set('minAmount', String(minAmount));
      if (maxAmount !== '') params.set('maxAmount', String(maxAmount));

      const response = await api.get(`/api/admin/revenue/dashboard?${params.toString()}`);
      console.log('📊 Revenue Dashboard Data:', response.data.data);
      console.log('📈 Daily Revenue:', response.data.data?.dailyRevenue);
      setDashboardData(response.data.data);
      setLastUpdatedAt(response.data.data?.lastUpdatedAt || new Date().toISOString());
    } catch (err) {
      console.error('Error fetching revenue dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load revenue data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const activeFilterChips = () => {
    const chips = [];
    if (source && source !== 'ALL') chips.push({ key: 'source', label: `Source: ${source}` });
    if (paymentBucket && paymentBucket !== 'ALL') chips.push({ key: 'paymentBucket', label: `Bucket: ${paymentBucket}` });
    if (userType && userType !== 'ALL') chips.push({ key: 'userType', label: `User: ${userType}` });
    if (query && query.trim()) chips.push({ key: 'query', label: `Search: ${query.trim()}` });
    if (minAmount !== '' || maxAmount !== '') {
      const min = minAmount !== '' ? `₹${minAmount}` : '—';
      const max = maxAmount !== '' ? `₹${maxAmount}` : '—';
      chips.push({ key: 'amount', label: `Amount: ${min}–${max}` });
    }
    return chips;
  };

  const clearFilterChip = (key) => {
    if (key === 'source') setSource('ALL');
    if (key === 'paymentBucket') setPaymentBucket('ALL');
    if (key === 'userType') setUserType('ALL');
    if (key === 'query') setQuery('');
    if (key === 'amount') { setMinAmount(''); setMaxAmount(''); }
    // Fetch immediately so the dashboard stays in sync with chips
    setTimeout(() => fetchRevenueDashboard(false), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportData = () => {
    // Convert dashboard data to CSV
    const csv = generateCSV(dashboardData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const generateCSV = (data) => {
    if (!data) return '';
    
    let csv = 'Revenue Report\n\n';
    csv += `Date Range: ${dateRange} days\n`;
    csv += `Total Revenue: ${formatCurrency(data.summary.totalRevenue)}\n\n`;
    
    csv += 'Top Spenders\n';
    csv += 'Name,Email,Phone,Total Spent,Orders\n';
    data.topSpenders.forEach(spender => {
      csv += `${spender.name},${spender.email},${spender.phone},${spender.totalSpent},${spender.orderCount}\n`;
    });
    
    return csv;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading revenue dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchRevenueDashboard}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { summary, membership, orders, payments, premiumMembers, topSpenders, recentTransactions, dailyRevenue } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton />
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
              <p className="text-gray-600 mt-1">Financial insights and transaction overview</p>
            </div>
            <div className="flex gap-4 items-center">
              <label htmlFor="dateRange" className="text-gray-700 font-medium mr-2">Timeline:</label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="1">1 Day</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="180">Last 6 Months</option>
                <option value="365">Last Year</option>
                <option value="ytd">Year to Date (YTD)</option>
                <option value="10000">All Time</option>
              </select>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaDownload />
                Export
              </button>
              <button
                onClick={() => fetchRevenueDashboard(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                title="Refresh now"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50"
                title="Filters"
              >
                <FaFilter />
                Filters
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Last updated: <span className="font-medium text-gray-700">{lastUpdatedAt ? formatDate(lastUpdatedAt) : '—'}</span>
            </div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh (30s)
            </label>
          </div>

          {/* Active filters chips */}
          {activeFilterChips().length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="text-xs text-gray-500 mr-1">Active filters:</div>
              {activeFilterChips().map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => clearFilterChip(c.key)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                  title="Click to remove this filter"
                >
                  <span>{c.label}</span>
                  <span className="text-gray-500">×</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSource('ALL');
                  setPaymentBucket('ALL');
                  setUserType('ALL');
                  setQuery('');
                  setMinAmount('');
                  setMaxAmount('');
                  fetchRevenueDashboard(false);
                }}
                className="ml-1 text-xs font-semibold text-blue-700 hover:underline"
                title="Clear all filters"
              >
                Clear all
              </button>
            </div>
          )}

          {showFilters && (
            <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="ALL">ALL</option>
                    <option value="PAYMENTS">PAYMENTS</option>
                    <option value="ORDERS">ORDERS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Bucket</label>
                  <select
                    value={paymentBucket}
                    onChange={(e) => setPaymentBucket(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="ALL">ALL</option>
                    <option value="SUBSCRIPTIONS">SUBSCRIPTIONS</option>
                    <option value="COORDINATOR_EVENT_FEES">COORDINATOR_EVENT_FEES</option>
                    <option value="STUDENT_EVENT_FEES">STUDENT_EVENT_FEES</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">User Type</label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="ALL">ALL</option>
                    <option value="STUDENT">STUDENT</option>
                    <option value="COACH">COACH</option>
                    <option value="INSTITUTE">INSTITUTE</option>
                    <option value="CLUB">CLUB</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="order#, description, metadata..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min / Max (₹)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="min"
                    />
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="max"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setSource('ALL');
                    setPaymentBucket('ALL');
                    setUserType('ALL');
                    setQuery('');
                    setMinAmount('');
                    setMaxAmount('');
                    fetchRevenueDashboard(false);
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  Reset
                </button>
                <button
                  onClick={() => fetchRevenueDashboard(false)}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary?.totalRevenue)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaRupeeSign className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Premium Members</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary?.premiumMemberCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary?.premiumPercentage}% of coaches
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaCrown className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Order Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary?.orderRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {orders?.totalOrders} orders
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaTrophy className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Payment Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary?.paymentRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {payments?.total} transactions
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FaChartLine className="text-purple-600 text-xl" />
              </div>
            </div>
            {summary?.paymentBuckets && (
              <div className="mt-3 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Subscriptions</span>
                  <span className="font-medium">{formatCurrency(summary.paymentBuckets.subscriptions?.amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Coordinator event fees</span>
                  <span className="font-medium">{formatCurrency(summary.paymentBuckets.coordinatorEventFees?.amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Student event fees</span>
                  <span className="font-medium">{formatCurrency(summary.paymentBuckets.studentEventFees?.amount || 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('premium')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'premium'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Premium Members ({premiumMembers?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('topSpenders')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'topSpenders'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Top Spenders ({topSpenders?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Recent Transactions
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Order Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FaCertificate className="text-blue-600 text-2xl" />
                        <div>
                          <p className="text-gray-600 text-sm">Certificates</p>
                          <p className="text-xl font-bold text-gray-900">{orders?.certificates || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FaMedal className="text-yellow-600 text-2xl" />
                        <div>
                          <p className="text-gray-600 text-sm">Medals</p>
                          <p className="text-xl font-bold text-gray-900">{orders?.medals || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FaTrophy className="text-green-600 text-2xl" />
                        <div>
                          <p className="text-gray-600 text-sm">Trophies</p>
                          <p className="text-xl font-bold text-gray-900">{orders?.trophies || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Membership Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600 text-sm">Coaches</p>
                      <p className="text-xl font-bold text-gray-900">{membership?.coaches || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600 text-sm">Institutes</p>
                      <p className="text-xl font-bold text-gray-900">{membership?.institutes || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600 text-sm">Clubs</p>
                      <p className="text-xl font-bold text-gray-900">{membership?.clubs || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Daily Revenue Chart */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setChartType('bar')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          chartType === 'bar'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Bar Chart
                      </button>
                      <button
                        onClick={() => setChartType('line')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          chartType === 'line'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Line Chart
                      </button>
                    </div>
                  </div>
                  {dailyRevenue && dailyRevenue.length > 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
                      <div className="min-w-[600px]">
                        <div className="relative h-72 flex">
                          {/* Y-axis */}
                          <div className="flex flex-col justify-between h-full text-xs text-gray-500 pr-2" style={{minWidth: '60px'}}>
                            {[5,4,3,2,1,0].map(i => {
                              const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);
                              return (
                                <div key={i} className="text-right">
                                  {i === 5 ? formatCurrency(maxRevenue) : 
                                   i === 0 ? '₹0' : 
                                   formatCurrency((maxRevenue * i) / 5)}
                                </div>
                              );
                            })}
                          </div>
                          {/* Chart Area */}
                          <div className="flex-1 relative border-l border-b border-gray-200">
                            {/* Horizontal grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                              {[0,1,2,3,4,5].map(i => (
                                <div key={i} className="border-t border-gray-100"></div>
                              ))}
                            </div>
                            
                            {chartType === 'bar' ? (
                              /* Bar Chart */
                              <div className="absolute inset-0 flex items-end justify-around px-2">
                                {dailyRevenue.map((day, index) => {
                                  const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);
                                  const heightPercent = (day.revenue / maxRevenue) * 100;
                                  const labelIndexes = [0, Math.floor(dailyRevenue.length/4), Math.floor(dailyRevenue.length/2), Math.floor(3*dailyRevenue.length/4), dailyRevenue.length-1];
                                  const showLabel = labelIndexes.includes(index);
                                  
                                  return (
                                    <div key={index} className="flex flex-col items-center group relative" style={{width: `${100/dailyRevenue.length}%`, maxWidth: '40px'}}>
                                      {/* Tooltip */}
                                      <div className="hidden group-hover:flex absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-20 flex-col items-center shadow-lg">
                                        <div className="font-semibold">{day.label || formatDate(day.date)}</div>
                                        <div className="text-green-300">{formatCurrency(day.revenue)}</div>
                                        <div className="text-gray-300 text-xs">{day.orders} orders, {day.payments} payments</div>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                                      </div>
                                      {/* Bar */}
                                      <div 
                                        className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t hover:from-green-700 hover:to-green-500 transition-all cursor-pointer"
                                        style={{ 
                                          height: `${heightPercent}%`,
                                          minHeight: day.revenue > 0 ? '2px' : '0px'
                                        }}
                                      ></div>
                                      {/* Date Label */}
                                      {showLabel && (
                                        <div className="text-xs text-gray-500 mt-2 whitespace-nowrap transform -rotate-45 origin-top-left">
                                          {day.label || new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              /* Line Chart */
                              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                {/* Line path */}
                                <polyline
                                  fill="none"
                                  stroke="#16a34a"
                                  strokeWidth="3"
                                  points={dailyRevenue.map((day, index) => {
                                    const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);
                                    const x = (index / (dailyRevenue.length - 1)) * 100;
                                    const y = 100 - ((day.revenue / maxRevenue) * 100);
                                    return `${x},${y}`;
                                  }).join(' ')}
                                  vectorEffect="non-scaling-stroke"
                                />
                                {/* Data points */}
                                {dailyRevenue.map((day, index) => {
                                  const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);
                                  const x = (index / (dailyRevenue.length - 1)) * 100;
                                  const y = 100 - ((day.revenue / maxRevenue) * 100);
                                  const labelIndexes = [0, Math.floor(dailyRevenue.length/4), Math.floor(dailyRevenue.length/2), Math.floor(3*dailyRevenue.length/4), dailyRevenue.length-1];
                                  const showLabel = labelIndexes.includes(index);
                                  
                                  return (
                                    <g key={index}>
                                      <circle
                                        cx={`${x}%`}
                                        cy={`${y}%`}
                                        r="4"
                                        fill="#16a34a"
                                        className="hover:r-6 cursor-pointer transition-all"
                                      />
                                      {showLabel && (
                                        <text
                                          x={`${x}%`}
                                          y="102%"
                                          textAnchor="middle"
                                          className="text-xs fill-gray-500"
                                          transform={`rotate(-45 ${x} 102)`}
                                        >
                                          {day.label || new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                        </text>
                                      )}
                                      {/* Tooltip group */}
                                      <g className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                        {(() => {
                                          // Assume SVG height is 200px for calculation, or get dynamically if needed
                                          const svgHeight = 200;
                                          const yPx = (svgHeight * y) / 100;
                                          const xPx = (svgHeight * x) / 100; // If needed for x
                                          return (
                                            <>
                                              <rect
                                                x={xPx - 60}
                                                y={yPx - 50}
                                                width="120"
                                                height="40"
                                                fill="#1f2937"
                                                rx="4"
                                              />
                                              <text
                                                x={xPx}
                                                y={yPx - 35}
                                                textAnchor="middle"
                                                className="text-xs fill-white font-semibold"
                                              >
                                                {day.label || formatDate(day.date)}
                                              </text>
                                              <text
                                                x={xPx}
                                                y={yPx - 20}
                                                textAnchor="middle"
                                                className="text-xs fill-green-300"
                                              >
                                                {formatCurrency(day.revenue)}
                                              </text>
                                            </>
                                          );
                                        })()}
                                      </g>
                                    </g>
                                  );
                                })}
                              </svg>
                            )}
                          </div>
                        </div>
                        {/* X-axis label */}
                        <div className="flex justify-center mt-8 text-xs text-gray-500 font-medium">Date</div>
                      </div>
                      {/* Summary */}
                      <div className="mt-6 pt-4 border-t flex flex-wrap justify-between items-center text-sm gap-4">
                        <div className="text-gray-600">
                          {dateRange === '1' ? '24 Hours (Hourly)' : 
                           dateRange === 'ytd' ? 'Year to Date' : 
                           dateRange === '10000' ? 'All Time' : 
                           `Last ${dateRange} days`} • {dailyRevenue.length} data points
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-600 rounded"></div>
                            <span className="text-gray-600">Revenue</span>
                          </div>
                          <div className="text-gray-600">
                            Max: {formatCurrency(Math.max(...dailyRevenue.map(d => d.revenue)))}
                          </div>
                          <div className="text-gray-600">
                            Avg: {formatCurrency(dailyRevenue.reduce((sum, d) => sum + d.revenue, 0) / dailyRevenue.length)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                      <div className="text-gray-400 mb-2">
                        <FaChartLine className="mx-auto text-4xl" />
                      </div>
                      <p className="text-gray-600">No revenue data available for the selected period</p>
                      <p className="text-sm text-gray-500 mt-1">Try selecting a different time range</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Premium Members Tab */}
            {activeTab === 'premium' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Members</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sport</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {premiumMembers?.length > 0 ? (
                        premiumMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{member.name}</td>
                            <td className="px-4 py-3 text-sm text-blue-600 font-mono">{member.uniqueId || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div>{member.email}</div>
                              <div className="text-xs">{member.phone}</div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                member.subscriptionType === 'ANNUAL' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {member.subscriptionType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div>{formatDate(member.subscriptionExpiresAt)}</div>
                              <div className="text-xs text-gray-500">{member.daysUntilExpiry} days left</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{member.primarySport || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{member.totalStudents || 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                            No premium members found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Spenders Tab */}
            {activeTab === 'topSpenders' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spending Coaches</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topSpenders?.length > 0 ? (
                        topSpenders.map((spender, index) => (
                          <tr key={spender.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <span className={`font-bold ${
                                index === 0 ? 'text-yellow-600' :
                                index === 1 ? 'text-gray-400' :
                                index === 2 ? 'text-orange-600' :
                                'text-gray-600'
                              }`}>
                                #{index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{spender.name}</td>
                            <td className="px-4 py-3 text-sm text-blue-600 font-mono">{spender.uniqueId || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div>{spender.email}</div>
                              <div className="text-xs">{spender.phone}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-green-600 font-bold">
                              {formatCurrency(spender.totalSpent)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{spender.orderCount}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatCurrency(spender.avgOrderValue)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {spender.lastOrderDate ? formatDate(new Date(spender.lastOrderDate)) : 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                            No spending data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Transactions Tab */}
            {activeTab === 'transactions' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {recentTransactions?.length > 0 ? (
                    recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                transaction.type === 'ORDER' ? 'bg-blue-100 text-blue-800' :
                                transaction.type === 'EVENT_PAYMENT' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {transaction.type}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                transaction.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {transaction.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 font-medium">{transaction.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                              <span>{transaction.customer?.name} ({transaction.customer?.type})</span>
                              {transaction.eventName && <span>• {transaction.eventName}</span>}
                              {transaction.sport && <span>• {transaction.sport}</span>}
                              <span>• {formatDate(transaction.date)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No recent transactions found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
