import React, { useState, useEffect } from 'react';
import { 
  getAllOrdersForAdmin, 
  updateOrderByAdmin, 
  getOrderStats,
  bulkUpdateOrders 
} from '../api';
import { 
  FaSearch,
  FaFilter,
  FaCertificate,
  FaMedal,
  FaTrophy,
  FaExclamationTriangle,
  FaClock,
  FaCheck,
  FaSpinner,
  FaEye,
  FaEdit,
  FaDownload,
  FaCreditCard,
  FaMoneyBillWave,
  FaBell
} from 'react-icons/fa';
import Spinner from '../components/Spinner';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [paidOrders, setPaidOrders] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    urgentOnly: false
  });

  // Order update form
  const [orderUpdate, setOrderUpdate] = useState({
    status: '',
    adminRemarks: '',
    certificatePrice: '',
    medalPrice: '',
    trophyPrice: '',
    totalAmount: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrdersForAdmin(filters);
      
      if (response.success) {
        const newOrders = response.data.orders || [];
        
        // Check for newly paid orders to show notifications
        if (orders.length > 0) {
          const newlyPaidOrders = newOrders.filter(newOrder => 
            newOrder.status === 'PAID' && 
            !orders.find(oldOrder => 
              oldOrder.id === newOrder.id && oldOrder.status === 'PAID'
            )
          );
          
          if (newlyPaidOrders.length > 0) {
            setPaidOrders(prev => [...prev, ...newlyPaidOrders]);
            newlyPaidOrders.forEach(order => {
              showMessage('success', `🎉 Payment received for order ${order.orderNumber}! Ready to process.`);
            });
          }
        }
        
        setOrders(newOrders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      showMessage('error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getOrderStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 8000); // Extended for payment notifications
  };

  const dismissPaidOrderNotification = (orderId) => {
    setPaidOrders(prev => prev.filter(order => order.id !== orderId));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const openOrderModal = (order) => {
    setEditingOrder(order);
    setOrderUpdate({
      status: order.status,
      adminRemarks: order.adminRemarks || '',
      certificatePrice: order.certificatePrice || '',
      medalPrice: order.medalPrice || '',
      trophyPrice: order.trophyPrice || '',
      totalAmount: order.totalAmount || ''
    });
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setEditingOrder(null);
  };

  // Calculate total amount based on quantities and prices
  const calculateTotalAmount = (certificatePrice, medalPrice, trophyPrice) => {
    if (!editingOrder) return 0;
    
    const certPrice = parseFloat(certificatePrice || 0);
    const medPrice = parseFloat(medalPrice || 0);
    const tropPrice = parseFloat(trophyPrice || 0);
    
    const total = 
      (editingOrder.certificates * certPrice) + 
      (editingOrder.medals * medPrice) + 
      (editingOrder.trophies * tropPrice);
    
    return total.toFixed(2);
  };

  // Handle price field changes and auto-calculate total
  const handlePriceChange = (field, value) => {
    const updatedPrices = { ...orderUpdate, [field]: value };
    
    // Auto-calculate total when any price changes
    if (field === 'certificatePrice' || field === 'medalPrice' || field === 'trophyPrice') {
      const calculatedTotal = calculateTotalAmount(
        updatedPrices.certificatePrice,
        updatedPrices.medalPrice,
        updatedPrices.trophyPrice
      );
      updatedPrices.totalAmount = calculatedTotal;
    }
    
    setOrderUpdate(updatedPrices);
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      await updateOrderByAdmin(editingOrder.id, orderUpdate);
      showMessage('success', 'Order updated successfully');
      closeOrderModal();
      loadOrders();
      loadStats();
    } catch (error) {
      console.error('Update order failed:', error);
      showMessage('error', error.message || 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpdate = async (status) => {
    if (selectedOrders.length === 0) {
      showMessage('error', 'Please select orders to update');
      return;
    }

    if (!confirm(`Are you sure you want to update ${selectedOrders.length} orders to ${status}?`)) {
      return;
    }

    try {
      await bulkUpdateOrders(selectedOrders, status);
      showMessage('success', `${selectedOrders.length} orders updated successfully`);
      setSelectedOrders([]);
      loadOrders();
      loadStats();
    } catch (error) {
      console.error('Bulk update failed:', error);
      showMessage('error', error.message || 'Failed to update orders');
    }
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    setSelectedOrders(orders.map(order => order.id));
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PAYMENT_PENDING': return 'bg-orange-100 text-orange-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <FaClock className="w-4 h-4" />;
      case 'CONFIRMED': return <FaCheck className="w-4 h-4" />;
      case 'PAYMENT_PENDING': return <FaCreditCard className="w-4 h-4" />;
      case 'PAID': return <FaMoneyBillWave className="w-4 h-4" />;
      case 'IN_PROGRESS': return <FaSpinner className="w-4 h-4 animate-spin" />;
      case 'COMPLETED': return <FaCheck className="w-4 h-4" />;
      case 'CANCELLED': return <FaExclamationTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading && !orders.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Orders Management</h1>
          <p className="text-gray-600">Manage certificate, medal, and trophy orders from coaches</p>
        </div>

        {/* Payment Notifications */}
        {paidOrders.length > 0 && (
          <div className="mb-6 space-y-2">
            {paidOrders.map((order) => (
              <div key={order.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-green-100 mr-3">
                      <FaBell className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-green-800 font-medium">
                        💰 Payment Received - Order {order.orderNumber}
                      </p>
                      <p className="text-green-600 text-sm">
                        {order.event.name} • ₹{order.totalAmount?.toLocaleString()} • 
                        Coach: {order.coach.name}
                      </p>
                      {order.paymentDate && (
                        <p className="text-green-500 text-xs">
                          Paid on: {new Date(order.paymentDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openOrderModal(order)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Process Order
                    </button>
                    <button
                      onClick={() => dismissPaidOrderNotification(order.id)}
                      className="text-green-600 hover:text-green-800 px-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-yellow-50 border border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <button 
                onClick={() => setMessage({ type: '', text: '' })}
                className="text-current opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <FaClock className="text-yellow-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <FaCheck className="text-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.confirmedOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <FaSpinner className="text-purple-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgressOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-100">
                  <FaExclamationTriangle className="text-red-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.urgentOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <FaTrophy className="text-green-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders, events, coaches..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PAYMENT_PENDING">Payment Pending</option>
                <option value="PAID">Paid</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  id="urgentOnly"
                  checked={filters.urgentOnly}
                  onChange={(e) => handleFilterChange('urgentOnly', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="urgentOnly" className="ml-2 block text-sm text-gray-700">
                  Urgent Orders Only
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
              <button
                onClick={loadOrders}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">
                {selectedOrders.length} order(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkUpdate('CONFIRMED')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Confirm Selected
                </button>
                <button
                  onClick={() => handleBulkUpdate('IN_PROGRESS')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleBulkUpdate('COMPLETED')}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Mark Completed
                </button>
                <button
                  onClick={clearSelection}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Orders ({orders.length})
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={selectAllOrders}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                Clear All
              </button>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <FaTrophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600">
                No orders match your current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === orders.length}
                        onChange={selectedOrders.length === orders.length ? clearSelection : selectAllOrders}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event & Coach
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                          {order.urgentDelivery && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                              <FaExclamationTriangle className="w-3 h-3 mr-1" />
                              URGENT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.event.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.coach.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.event.sport}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {order.certificates > 0 && (
                            <div className="flex items-center text-sm">
                              <FaCertificate className="text-yellow-500 mr-1" />
                              {order.certificates} Certificates
                            </div>
                          )}
                          {order.medals > 0 && (
                            <div className="flex items-center text-sm">
                              <FaMedal className="text-yellow-500 mr-1" />
                              {order.medals} Medals
                            </div>
                          )}
                          {order.trophies > 0 && (
                            <div className="flex items-center text-sm">
                              <FaTrophy className="text-yellow-600 mr-1" />
                              {order.trophies} Trophies
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                        {order.paymentStatus && order.status === 'PAID' && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FaMoneyBillWave className="w-3 h-3 mr-1" />
                              Payment Complete
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.totalAmount ? `₹${order.totalAmount.toLocaleString()}` : 'Not set'}
                        </div>
                        {order.paymentDate && (
                          <div className="text-xs text-green-600">
                            Paid: {new Date(order.paymentDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openOrderModal(order)}
                          className={`px-3 py-1 rounded text-sm inline-flex items-center ${
                            order.status === 'PAID' 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <FaEdit className="mr-1" />
                          {order.status === 'PAID' ? 'Process' : 'Manage'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Management Modal */}
      {showOrderModal && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Manage Order: {editingOrder.orderNumber}
            </h3>
            
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={orderUpdate.status}
                    onChange={(e) => setOrderUpdate(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    {/* <option value="PAYMENT_PENDING">Payment Pending</option> */}
                    <option value="PAID">Paid</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificate Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderUpdate.certificatePrice}
                    onChange={(e) => handlePriceChange('certificatePrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter price per certificate"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medal Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderUpdate.medalPrice}
                    onChange={(e) => handlePriceChange('medalPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter price per medal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trophy Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderUpdate.trophyPrice}
                    onChange={(e) => handlePriceChange('trophyPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter price per trophy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount (₹) - Auto Calculated
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium">
                  ₹{orderUpdate.totalAmount || '0.00'}
                </div>
                {editingOrder && (orderUpdate.certificatePrice || orderUpdate.medalPrice || orderUpdate.trophyPrice) && (
                  <div className="mt-2 text-xs text-gray-600">
                    Calculation: {editingOrder.certificates} × ₹{orderUpdate.certificatePrice || '0'} + {editingOrder.medals} × ₹{orderUpdate.medalPrice || '0'} + {editingOrder.trophies} × ₹{orderUpdate.trophyPrice || '0'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Remarks
                </label>
                <textarea
                  value={orderUpdate.adminRemarks}
                  onChange={(e) => setOrderUpdate(prev => ({ ...prev, adminRemarks: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add notes, instructions, or comments..."
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Order Details:</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>Certificates: {editingOrder.certificates}</div>
                  <div>Medals: {editingOrder.medals}</div>
                  <div>Trophies: {editingOrder.trophies}</div>
                </div>
                {editingOrder.specialInstructions && (
                  <div className="mt-2 text-sm">
                    <strong>Special Instructions:</strong> {editingOrder.specialInstructions}
                  </div>
                )}
                {editingOrder.paymentStatus === 'SUCCESS' && editingOrder.paymentDate && (
                  <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                    <div className="flex items-center text-green-800">
                      <FaMoneyBillWave className="mr-2" />
                      <strong>Payment Completed</strong>
                    </div>
                    <div className="text-green-600 mt-1">
                      Paid on: {new Date(editingOrder.paymentDate).toLocaleString()}
                    </div>
                    {editingOrder.razorpayPaymentId && (
                      <div className="text-green-600 text-xs mt-1">
                        Payment ID: {editingOrder.razorpayPaymentId}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeOrderModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Order'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;