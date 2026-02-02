import React, { useState, useEffect } from 'react';
import { FaRupeeSign, FaTrophy, FaCertificate, FaMedal, FaChartLine, FaUsers, FaCrown, FaCalendarAlt, FaDownload, FaFilter } from 'react-icons/fa';
import api from '../api';
import BackButton from '../components/BackButton';
import { useNavigate } from 'react-router-dom';

const AdminRevenue = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState('90');
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'line'
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedTrendPoint, setSelectedTrendPoint] = useState(null); // { date, label, revenue, orders, payments }
  const [hoverTrendPoint, setHoverTrendPoint] = useState(null); // { xPct, yPct, day }
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

  // Close export menu when clicking outside
  useEffect(() => {
    if (!showExportMenu) return;
    const onClick = (e) => {
      if (!e.target.closest('[data-export-menu]')) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showExportMenu]);

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
    // Convert dashboard data to a company-ready CSV
    const csv = generateCSV(dashboardData);
    // Add UTF-8 BOM for Excel compatibility
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STAIRS-Revenue-Report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    if (!dashboardData) return;

    // Lazy-load xlsx only when exporting (keeps bundle smaller)
    const XLSX = await import('xlsx');

    const title = 'STAIRS Talent Hub';
    const subtitle = 'Revenue Dashboard Export';
    const generatedAt = new Date().toLocaleString('en-IN');
    const dateRangeLabel = dateRange === 'ytd' ? 'Year to Date (YTD)' : `${dateRange} days`;

    const toIsoDate = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return '';
      return dt.toISOString().split('T')[0];
    };
    const num = (n) => {
      const v = Number(n);
      return Number.isFinite(v) ? Number(v.toFixed(2)) : null;
    };

    const wb = XLSX.utils.book_new();

    // Sheet: Metadata
    const metadataAoA = [
      [title, ''],
      [subtitle, ''],
      [],
      ['Generated At (IST)', generatedAt],
      ['Date Range', dateRangeLabel],
      ['Last Updated At', dashboardData.lastUpdatedAt ? new Date(dashboardData.lastUpdatedAt).toLocaleString('en-IN') : ''],
      [],
      ['Applied Filters', ''],
      ['Source', source || 'ALL'],
      ['Bucket', paymentBucket || 'ALL'],
      ['User Type', userType || 'ALL'],
      ['Search', (query || '').trim()],
      ['Min Amount (INR)', minAmount === '' ? '' : String(minAmount)],
      ['Max Amount (INR)', maxAmount === '' ? '' : String(maxAmount)]
    ];
    const wsMeta = XLSX.utils.aoa_to_sheet(metadataAoA);
    wsMeta['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } }
    ];
    wsMeta['!cols'] = [{ wch: 28 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadata');

    // Sheet: Summary
    const s = dashboardData.summary || {};
    const wsSummary = XLSX.utils.aoa_to_sheet([
      [title, ''],
      [subtitle, ''],
      ['Generated At (IST)', generatedAt],
      ['Date Range', dateRangeLabel],
      [],
      ['Metric', 'Value (INR) / Count'],
      ['Total Revenue (Gross)', num(s.totalRevenue || 0)],
      ['Razorpay Commission', s.razorpayCommission ? num(s.razorpayCommission.totalCommission || 0) : null],
      ['Net Revenue (After Commission)', s.razorpayCommission ? num(s.razorpayCommission.totalNet || 0) : null],
      ['Order Revenue', num(s.orderRevenue || 0)],
      ['Payment Revenue', num(s.paymentRevenue || 0)],
      ['Premium Members (count)', Number(s.premiumMemberCount || 0)]
    ]);
    wsSummary['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }
    ];
    wsSummary['!cols'] = [{ wch: 34 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet: Revenue by Category
    const b = s.paymentBuckets || {};
    const wsBuckets = XLSX.utils.aoa_to_sheet([
      [title, '', ''],
      [subtitle, '', ''],
      ['Generated At (IST)', generatedAt, ''],
      ['Date Range', dateRangeLabel, ''],
      [],
      ['Category', 'Count', 'Amount (INR)'],
      ['Subscriptions', Number(b.subscriptions?.count || 0), num(b.subscriptions?.amount || 0)],
      ['Coordinator Event Fees', Number(b.coordinatorEventFees?.count || 0), num(b.coordinatorEventFees?.amount || 0)],
      ['Student Event Fees', Number(b.studentEventFees?.count || 0), num(b.studentEventFees?.amount || 0)],
      ['Other', Number(b.other?.count || 0), num(b.other?.amount || 0)]
    ]);
    wsBuckets['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }
    ];
    wsBuckets['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsBuckets, 'By Category');

    // Sheet: Subscriptions by User
    const subs = dashboardData.individualBreakdowns?.subscriptionsByUser || [];
    const subsRows = [
      [title, '', '', '', ''],
      [subtitle, '', '', '', ''],
      ['Generated At (IST)', generatedAt, '', '', ''],
      ['Date Range', dateRangeLabel, '', '', ''],
      [],
      ['User Name', 'User Type', 'Email', 'Transactions', 'Total (INR)'],
      ...subs.map((x) => [
        x.userName || 'Unknown',
        x.userType || 'UNKNOWN',
        x.userEmail || '',
        Number(x.count || 0),
        num(x.totalAmount || 0)
      ])
    ];
    const wsSubs = XLSX.utils.aoa_to_sheet(subsRows);
    wsSubs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
    ];
    wsSubs['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 32 }, { wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsSubs, 'Subscriptions');

    // Sheet: Coordinator Event Fees
    const coordFees = dashboardData.individualBreakdowns?.coordinatorFeesByCoordinator || [];
    const coordRows = [
      [title, '', '', '', ''],
      [subtitle, '', '', '', ''],
      ['Generated At (IST)', generatedAt, '', '', ''],
      ['Date Range', dateRangeLabel, '', '', ''],
      [],
      ['Coordinator Name', 'Email', 'Event Name', 'Transactions', 'Total (INR)'],
      ...coordFees.map((x) => [
        x.coordinatorName || 'Unknown',
        x.coordinatorEmail || '',
        x.eventName || 'N/A',
        Number(x.count || 0),
        num(x.totalAmount || 0)
      ])
    ];
    const wsCoord = XLSX.utils.aoa_to_sheet(coordRows);
    wsCoord['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
    ];
    wsCoord['!cols'] = [{ wch: 28 }, { wch: 32 }, { wch: 36 }, { wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsCoord, 'Coord Event Fees');

    // Sheet: Athlete Event Fees
    const athleteFees = dashboardData.individualBreakdowns?.athleteFeesByAthlete || [];
    const athleteRows = [
      [title, '', '', '', '', '', ''],
      [subtitle, '', '', '', '', '', ''],
      ['Generated At (IST)', generatedAt, '', '', '', '', ''],
      ['Date Range', dateRangeLabel, '', '', '', '', ''],
      [],
      ['Athlete Name', 'Unique ID', 'Email', 'Event Name', 'Sport', 'Transactions', 'Total (INR)'],
      ...athleteFees.map((x) => [
        x.studentName || 'Unknown',
        x.studentUniqueId || '',
        x.studentEmail || '',
        x.eventName || 'N/A',
        x.studentSport || '',
        Number(x.count || 0),
        num(x.totalAmount || 0)
      ])
    ];
    const wsAthlete = XLSX.utils.aoa_to_sheet(athleteRows);
    wsAthlete['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
    ];
    wsAthlete['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 32 }, { wch: 36 }, { wch: 18 }, { wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsAthlete, 'Athlete Event Fees');

    // Sheet: Event-wise Revenue
    const eventWise = dashboardData.eventWiseRevenue || [];
    const eventRows = [
      [title, '', '', '', '', '', ''],
      [subtitle, '', '', '', '', '', ''],
      ['Generated At (IST)', generatedAt, '', '', '', '', ''],
      ['Date Range', dateRangeLabel, '', '', '', '', ''],
      [],
      ['Event Name', 'Sport', 'Orders', 'Payments', 'Gross (INR)', 'Commission (INR)', 'Net (INR)'],
      ...eventWise.map((x) => [
        x.eventName || 'Unknown',
        x.sport || '',
        Number(x.orderCount || 0),
        Number(x.paymentCount || 0),
        num(x.totalRevenue || 0),
        num(x.totalCommission || 0),
        num(x.netRevenue || ((Number(x.totalRevenue || 0)) - Number(x.totalCommission || 0)))
      ])
    ];
    const wsEvent = XLSX.utils.aoa_to_sheet(eventRows);
    wsEvent['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
    ];
    wsEvent['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsEvent, 'Event-wise');

    // Sheet: Top Spenders
    const spenders = dashboardData.topSpenders || [];
    const spenderRows = [
      [title, '', '', '', '', '', ''],
      [subtitle, '', '', '', '', '', ''],
      ['Generated At (IST)', generatedAt, '', '', '', '', ''],
      ['Date Range', dateRangeLabel, '', '', '', '', ''],
      [],
      ['Rank', 'Name', 'Email', 'Phone', 'Orders', 'Total Spent (INR)', 'Avg Order (INR)'],
      ...spenders.map((x, idx) => [
        idx + 1,
        x.name || 'Unknown',
        x.email || '',
        x.phone || '',
        Number(x.orderCount || 0),
        num(x.totalSpent || 0),
        num(x.avgOrderValue || 0)
      ])
    ];
    const wsSpenders = XLSX.utils.aoa_to_sheet(spenderRows);
    wsSpenders['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
    ];
    wsSpenders['!cols'] = [{ wch: 8 }, { wch: 26 }, { wch: 32 }, { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsSpenders, 'Top Spenders');

    // Sheet: Transactions
    const txns = dashboardData.recentTransactions || [];
    const commissionRate = 0.025;
    const txnRows = [
      [title, '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [subtitle, '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Generated At (IST)', generatedAt, '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Date Range', dateRangeLabel, '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [],
      ['Date', 'Source', 'Type', 'Status', 'Description', 'Customer Name', 'Customer Type', 'Customer Email', 'Customer UID', 'Event Name', 'Sport', 'Amount (INR)', 'Commission Rate', 'Commission (INR)', 'Net (INR)'],
      ...txns.map((t) => {
        const amt = Number(t.amount || 0);
        const commission = amt * commissionRate;
        const net = amt - commission;
        return [
          toIsoDate(t.date),
          t.type === 'ORDER' ? 'ORDERS' : 'PAYMENTS',
          t.type || '',
          t.status || '',
          t.description || '',
          t.customer?.name || 'Unknown',
          t.customer?.type || '',
          t.customer?.email || '',
          t.customer?.uniqueId || '',
          t.eventName || '',
          t.sport || '',
          num(amt),
          `${(commissionRate * 100).toFixed(2)}%`,
          num(commission),
          num(net)
        ];
      })
    ];
    const wsTxns = XLSX.utils.aoa_to_sheet(txnRows);
    wsTxns['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } }
    ];
    wsTxns['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 10 }, { wch: 50 },
      { wch: 26 }, { wch: 16 }, { wch: 32 }, { wch: 14 }, { wch: 36 },
      { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTxns, 'Transactions');

    const filename = `STAIRS-Revenue-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
    const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (data) => {
    if (!data) return '';

    // CSV helpers (Excel-friendly, proper escaping)
    const csvEscape = (value) => {
      if (value === null || value === undefined) return '';
      const s = String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      if (/[",\n]/.test(s) || /^\s|\s$/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const addRow = (rows, cells) => rows.push(cells.map(csvEscape).join(','));
    const addBlank = (rows) => rows.push('');
    const asNumber = (n) => {
      const v = Number(n);
      if (!Number.isFinite(v)) return '';
      // Keep 2 decimals for finance exports
      return v.toFixed(2);
    };
    const asISODate = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return '';
      return dt.toISOString().split('T')[0];
    };

    // Build rows
    const rows = [];
    rows.push('sep=,'); // Excel hint for separator
    addRow(rows, ['STAIRS Talent Hub - Revenue Dashboard Export']);
    addBlank(rows);

    // Report metadata
    addRow(rows, ['SECTION', 'METADATA']);
    addRow(rows, ['Generated At (IST)', new Date().toLocaleString('en-IN')]);
    addRow(rows, ['Date Range', dateRange === 'ytd' ? 'Year to Date (YTD)' : `${dateRange} days`]);
    addRow(rows, ['Last Updated At', data.lastUpdatedAt ? new Date(data.lastUpdatedAt).toLocaleString('en-IN') : '']);
    // Filters
    addRow(rows, ['Filter: Source', source || 'ALL']);
    addRow(rows, ['Filter: Bucket', paymentBucket || 'ALL']);
    addRow(rows, ['Filter: User Type', userType || 'ALL']);
    addRow(rows, ['Filter: Search', (query || '').trim()]);
    addRow(rows, ['Filter: Min Amount (INR)', minAmount === '' ? '' : String(minAmount)]);
    addRow(rows, ['Filter: Max Amount (INR)', maxAmount === '' ? '' : String(maxAmount)]);
    addBlank(rows);

    // Summary (numbers are plain INR, no currency symbol)
    addRow(rows, ['SECTION', 'SUMMARY']);
    addRow(rows, ['Metric', 'Value']);
    addRow(rows, ['Total Revenue (Gross) INR', asNumber(data.summary?.totalRevenue || 0)]);
    if (data.summary?.razorpayCommission) {
      addRow(rows, ['Razorpay Commission INR', asNumber(data.summary.razorpayCommission.totalCommission || 0)]);
      addRow(rows, ['Net Revenue (After Commission) INR', asNumber(data.summary.razorpayCommission.totalNet || 0)]);
    }
    addRow(rows, ['Order Revenue INR', asNumber(data.summary?.orderRevenue || 0)]);
    addRow(rows, ['Payment Revenue INR', asNumber(data.summary?.paymentRevenue || 0)]);
    addRow(rows, ['Premium Members (count)', String(data.summary?.premiumMemberCount || 0)]);
    addBlank(rows);

    // Revenue by category
    if (data.summary?.paymentBuckets) {
      const buckets = data.summary.paymentBuckets;
      addRow(rows, ['SECTION', 'REVENUE BY CATEGORY']);
      addRow(rows, ['Category', 'Count', 'Amount INR']);
      addRow(rows, ['Subscriptions', String(buckets.subscriptions?.count || 0), asNumber(buckets.subscriptions?.amount || 0)]);
      addRow(rows, ['Coordinator Event Fees', String(buckets.coordinatorEventFees?.count || 0), asNumber(buckets.coordinatorEventFees?.amount || 0)]);
      addRow(rows, ['Student Event Fees', String(buckets.studentEventFees?.count || 0), asNumber(buckets.studentEventFees?.amount || 0)]);
      addRow(rows, ['Other', String(buckets.other?.count || 0), asNumber(buckets.other?.amount || 0)]);
      addBlank(rows);
    }

    // Individual Breakdowns
    if (data.individualBreakdowns) {
      const breakdowns = data.individualBreakdowns;

      if (Array.isArray(breakdowns.subscriptionsByUser) && breakdowns.subscriptionsByUser.length > 0) {
        addRow(rows, ['SECTION', 'SUBSCRIPTIONS BY USER']);
        addRow(rows, ['User Name', 'User Type', 'Email', 'Transactions', 'Total INR']);
        breakdowns.subscriptionsByUser.forEach((sub) => {
          addRow(rows, [
            sub.userName || 'Unknown',
            sub.userType || 'UNKNOWN',
            sub.userEmail || '',
            String(sub.count || 0),
            asNumber(sub.totalAmount || 0)
          ]);
        });
        addBlank(rows);
      }

      if (Array.isArray(breakdowns.coordinatorFeesByCoordinator) && breakdowns.coordinatorFeesByCoordinator.length > 0) {
        addRow(rows, ['SECTION', 'COORDINATOR EVENT FEES BY COORDINATOR']);
        addRow(rows, ['Coordinator Name', 'Email', 'Event Name', 'Transactions', 'Total INR']);
        breakdowns.coordinatorFeesByCoordinator.forEach((fee) => {
          addRow(rows, [
            fee.coordinatorName || 'Unknown',
            fee.coordinatorEmail || '',
            fee.eventName || 'N/A',
            String(fee.count || 0),
            asNumber(fee.totalAmount || 0)
          ]);
        });
        addBlank(rows);
      }

      if (Array.isArray(breakdowns.athleteFeesByAthlete) && breakdowns.athleteFeesByAthlete.length > 0) {
        addRow(rows, ['SECTION', 'ATHLETE EVENT FEES BY ATHLETE']);
        addRow(rows, ['Athlete Name', 'Unique ID', 'Email', 'Event Name', 'Sport', 'Transactions', 'Total INR']);
        breakdowns.athleteFeesByAthlete.forEach((fee) => {
          addRow(rows, [
            fee.studentName || 'Unknown',
            fee.studentUniqueId || '',
            fee.studentEmail || '',
            fee.eventName || 'N/A',
            fee.studentSport || '',
            String(fee.count || 0),
            asNumber(fee.totalAmount || 0)
          ]);
        });
        addBlank(rows);
      }
    }

    // Event-wise Revenue
    if (Array.isArray(data.eventWiseRevenue) && data.eventWiseRevenue.length > 0) {
      addRow(rows, ['SECTION', 'EVENT-WISE REVENUE']);
      addRow(rows, ['Event Name', 'Sport', 'Orders', 'Payments', 'Gross INR', 'Commission INR', 'Net INR']);
      data.eventWiseRevenue.forEach((event) => {
        const commission = Number(event.totalCommission || 0);
        const gross = Number(event.totalRevenue || 0);
        const net = Number(event.netRevenue || (gross - commission));
        addRow(rows, [
          event.eventName || 'Unknown',
          event.sport || '',
          String(event.orderCount || 0),
          String(event.paymentCount || 0),
          asNumber(gross),
          asNumber(commission),
          asNumber(net)
        ]);
      });
      addBlank(rows);
    }

    // Top Spenders
    if (Array.isArray(data.topSpenders) && data.topSpenders.length > 0) {
      addRow(rows, ['SECTION', 'TOP SPENDERS']);
      addRow(rows, ['Rank', 'Name', 'Email', 'Phone', 'Orders', 'Total Spent INR', 'Avg Order INR']);
      data.topSpenders.forEach((spender, index) => {
        addRow(rows, [
          String(index + 1),
          spender.name || 'Unknown',
          spender.email || '',
          spender.phone || '',
          String(spender.orderCount || 0),
          asNumber(spender.totalSpent || 0),
          asNumber(spender.avgOrderValue || 0)
        ]);
      });
      addBlank(rows);
    }

    // Recent Transactions
    if (Array.isArray(data.recentTransactions) && data.recentTransactions.length > 0) {
      const commissionRate = 0.025; // Razorpay approx. 2.5% (fallback when backend doesn't provide commission)
      addRow(rows, ['SECTION', 'RECENT TRANSACTIONS (last 20)']);
      addRow(rows, [
        'Date',
        'Source',
        'Type',
        'Status',
        'Description',
        'Customer Name',
        'Customer Type',
        'Customer Email',
        'Customer UID',
        'Event Name',
        'Sport',
        'Amount INR',
        'Commission Rate',
        'Commission INR (est.)',
        'Net INR (est.)'
      ]);
      data.recentTransactions.forEach((txn) => {
        const amt = Number(txn.amount || 0);
        const commission = amt * commissionRate;
        const net = amt - commission;
        addRow(rows, [
          asISODate(txn.date),
          txn.type === 'ORDER' ? 'ORDERS' : 'PAYMENTS',
          txn.type || '',
          txn.status || '',
          txn.description || '',
          txn.customer?.name || 'Unknown',
          txn.customer?.type || '',
          txn.customer?.email || '',
          txn.customer?.uniqueId || '',
          txn.eventName || '',
          txn.sport || '',
          asNumber(amt),
          `${(commissionRate * 100).toFixed(2)}%`,
          asNumber(commission),
          asNumber(net)
        ]);
      });
      addBlank(rows);
    }

    // Use CRLF for maximum Excel compatibility
    return rows.join('\r\n');
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
              <div className="relative" data-export-menu>
                <button
                  onClick={() => setShowExportMenu(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  title="Export"
                  aria-haspopup="menu"
                  aria-expanded={showExportMenu ? 'true' : 'false'}
                >
                  <FaDownload />
                  Export
                  <span className="text-white/90">▾</span>
                </button>
                {showExportMenu && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
                    role="menu"
                  >
                    <button
                      onClick={() => { setShowExportMenu(false); exportExcel(); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                      role="menuitem"
                    >
                      Export Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => { setShowExportMenu(false); exportData(); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-t border-gray-100"
                      role="menuitem"
                    >
                      Export CSV (.csv)
                    </button>
                  </div>
                )}
              </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
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

          {/* Razorpay Commission Card */}
          {summary?.razorpayCommission && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Razorpay Commission</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(summary.razorpayCommission.totalCommission)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.razorpayCommission.commissionRate}% of {formatCurrency(summary.razorpayCommission.totalGross)}
                  </p>
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Net: {formatCurrency(summary.razorpayCommission.totalNet)}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <FaRupeeSign className="text-orange-600 text-xl" />
                </div>
              </div>
            </div>
          )}
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
              <button
                onClick={() => setActiveTab('breakdowns')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'breakdowns'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Individual Breakdowns
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Event-Wise Revenue ({dashboardData?.eventWiseRevenue?.length || 0})
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

                            {/* Single tooltip for both chart types */}
                            {hoverTrendPoint?.day && (
                              <div
                                className="absolute z-30 bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg pointer-events-none"
                                style={{
                                  left: `calc(${hoverTrendPoint.xPct}% )`,
                                  top: `calc(${hoverTrendPoint.yPct}% - 56px)`,
                                  transform: 'translateX(-50%)'
                                }}
                              >
                                <div className="font-semibold">
                                  {hoverTrendPoint.day.label || formatDate(hoverTrendPoint.day.date)}
                                </div>
                                <div className="text-green-300">{formatCurrency(hoverTrendPoint.day.revenue)}</div>
                                <div className="text-gray-300 text-xs">
                                  {hoverTrendPoint.day.orders} orders, {hoverTrendPoint.day.payments} payments
                                </div>
                              </div>
                            )}
                            
                            {chartType === 'bar' ? (
                              /* Bar Chart */
                              <div className="absolute inset-0 flex items-end justify-around px-2">
                                {dailyRevenue.map((day, index) => {
                                  const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);
                                  const heightPercent = (day.revenue / maxRevenue) * 100;
                                  const labelIndexes = [0, Math.floor(dailyRevenue.length/4), Math.floor(dailyRevenue.length/2), Math.floor(3*dailyRevenue.length/4), dailyRevenue.length-1];
                                  const showLabel = labelIndexes.includes(index);
                                  const xPct = (index / Math.max(1, dailyRevenue.length - 1)) * 100;
                                  const yPct = 100 - ((day.revenue / maxRevenue) * 100);
                                  
                                  return (
                                    <div
                                      key={index}
                                      className="flex flex-col items-center relative"
                                      style={{width: `${100/dailyRevenue.length}%`, maxWidth: '40px'}}
                                      onMouseEnter={() => setHoverTrendPoint({ xPct, yPct, day })}
                                      onMouseLeave={() => setHoverTrendPoint(null)}
                                    >
                                      {/* Bar */}
                                      <div 
                                        className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t hover:from-green-700 hover:to-green-500 transition-all cursor-pointer"
                                        style={{ 
                                          height: `${heightPercent}%`,
                                          minHeight: day.revenue > 0 ? '2px' : '0px'
                                        }}
                                        onClick={() => {
                                          setSelectedTrendPoint(prev =>
                                            prev?.date === day.date ? null : day
                                          );
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
                                        onMouseEnter={() => setHoverTrendPoint({ xPct: x, yPct: y, day })}
                                        onMouseLeave={() => setHoverTrendPoint(null)}
                                        onClick={() => {
                                          setSelectedTrendPoint(prev =>
                                            prev?.date === day.date ? null : day
                                          );
                                        }}
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
                                    </g>
                                  );
                                })}
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Drill-down panel (interactive) */}
                        {selectedTrendPoint && (
                          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  Selected: {selectedTrendPoint.label || formatDate(selectedTrendPoint.date)}
                                </div>
                                <div className="text-sm text-gray-700">
                                  Revenue: <span className="font-semibold text-green-700">{formatCurrency(selectedTrendPoint.revenue)}</span>
                                  {' '}• Orders: <span className="font-semibold">{selectedTrendPoint.orders}</span>
                                  {' '}• Payments: <span className="font-semibold">{selectedTrendPoint.payments}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setSelectedTrendPoint(null); }}
                                  className="px-3 py-2 text-sm rounded-lg bg-white border border-green-300 text-green-700 hover:bg-green-100"
                                >
                                  Clear selection
                                </button>
                                <button
                                  onClick={() => setActiveTab('transactions')}
                                  className="px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
                                >
                                  View recent transactions
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
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

            {/* Individual Breakdowns Tab */}
            {activeTab === 'breakdowns' && (
              <div className="space-y-6">
                {/* Subscriptions by User */}
                {dashboardData?.individualBreakdowns?.subscriptionsByUser?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriptions by User</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dashboardData.individualBreakdowns.subscriptionsByUser.map((sub, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{sub.userName || 'Unknown'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{sub.userType || 'UNKNOWN'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{sub.userEmail || ''}</td>
                              <td className="px-4 py-3 text-sm text-green-600 font-medium">{formatCurrency(sub.totalAmount || 0)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{sub.count || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Coordinator Fees by Coordinator */}
                {dashboardData?.individualBreakdowns?.coordinatorFeesByCoordinator?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Coordinator Event Fees by Coordinator</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coordinator</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dashboardData.individualBreakdowns.coordinatorFeesByCoordinator.map((fee, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{fee.coordinatorName || 'Unknown'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{fee.coordinatorEmail || ''}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{fee.eventName || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-green-600 font-medium">{formatCurrency(fee.totalAmount || 0)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{fee.count || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Athlete Fees by Athlete */}
                {dashboardData?.individualBreakdowns?.athleteFeesByAthlete?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Athlete Event Fees by Athlete</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Athlete Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sport</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dashboardData.individualBreakdowns.athleteFeesByAthlete.map((fee, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{fee.studentName || 'Unknown'}</td>
                              <td className="px-4 py-3 text-sm text-blue-600 font-mono">{fee.studentUniqueId || ''}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{fee.studentEmail || ''}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{fee.eventName || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{fee.studentSport || ''}</td>
                              <td className="px-4 py-3 text-sm text-green-600 font-medium">{formatCurrency(fee.totalAmount || 0)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{fee.count || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Event-Wise Revenue Tab */}
            {activeTab === 'events' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event-Wise Revenue</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sport</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Revenue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payments</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData?.eventWiseRevenue?.length > 0 ? (
                        dashboardData.eventWiseRevenue.map((event) => (
                          <tr
                            key={event.eventId}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              if (event.eventId && event.eventId !== 'unknown') {
                                navigate(`/events/${event.eventId}`);
                              }
                            }}
                            title={event.eventId && event.eventId !== 'unknown' ? 'Open event details' : 'Event ID missing'}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {event.eventName && event.eventName !== 'Unknown Event' ? event.eventName : 'Unknown Event'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{event.sport || ''}</td>
                            <td className="px-4 py-3 text-sm text-green-600 font-medium">{formatCurrency(event.totalRevenue || 0)}</td>
                            <td className="px-4 py-3 text-sm text-orange-600">{formatCurrency(event.totalCommission || 0)}</td>
                            <td className="px-4 py-3 text-sm text-blue-600 font-medium">{formatCurrency(event.netRevenue || 0)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{event.orderCount || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{event.paymentCount || 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                            No event revenue data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
