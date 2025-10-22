import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  createEventOrder, 
  getEventOrders, 
  updateEventOrder, 
  deleteEventOrder 
} from '../api';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaCertificate,
  FaMedal,
  FaTrophy,
  FaArrowLeft,
  FaExclamationTriangle,
  FaClock,
  FaCheck,
  FaSpinner
} from 'react-icons/fa';
import Spinner from '../components/Spinner';

const EventOrders = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [eventData, setEventData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Order form state
  const [orderForm, setOrderForm] = useState({
    certificates: 0,
    medals: 0,
    trophies: 0,
    specialInstructions: '',
    urgentDelivery: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [eventId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getEventOrders(eventId);
      
      if (response.success) {
        setEventData(response.data.event);
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      showMessage('error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const openOrderModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setOrderForm({
        certificates: order.certificates,
        medals: order.medals,
        trophies: order.trophies,
        specialInstructions: order.specialInstructions || '',
        urgentDelivery: order.urgentDelivery
      });
    } else {
      setEditingOrder(null);
      setOrderForm({
        certificates: 0,
        medals: 0,
        trophies: 0,
        specialInstructions: '',
        urgentDelivery: false
      });
    }
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setEditingOrder(null);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (orderForm.certificates === 0 && orderForm.medals === 0 && orderForm.trophies === 0) {
      showMessage('error', 'Please specify at least one item to order');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingOrder) {
        await updateEventOrder(editingOrder.id, orderForm);
        showMessage('success', 'Order updated successfully');
      } else {
        await createEventOrder(eventId, orderForm);
        showMessage('success', 'Order created successfully');
      }
      
      closeOrderModal();
      loadOrders();
    } catch (error) {
      console.error('Submit order failed:', error);
      showMessage('error', error.message || 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!confirm(`Are you sure you want to delete order "${orderNumber}"?`)) {
      return;
    }

    try {
      await deleteEventOrder(orderId);
      showMessage('success', 'Order deleted successfully');
      loadOrders();
    } catch (error) {
      console.error('Delete failed:', error);
      showMessage('error', error.message || 'Failed to delete order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
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
      case 'IN_PROGRESS': return <FaSpinner className="w-4 h-4 animate-spin" />;
      case 'COMPLETED': return <FaCheck className="w-4 h-4" />;
      case 'CANCELLED': return <FaExclamationTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard/coach')}
                className="mr-4 text-white hover:text-blue-200 transition-colors"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">Event Orders</h1>
                <p className="text-blue-100 text-lg">
                  {eventData ? `Manage orders for: ${eventData.name}` : 'Manage your event orders'}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-white">
              <FaTrophy className="text-2xl" />
              <span className="text-lg font-medium">Orders Management</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Create Order Button */}
        <div className="mb-6">
          <button
            onClick={() => openOrderModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
          >
            <FaPlus className="mr-2" />
            Create New Order
          </button>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Event Orders ({orders.length})
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <FaTrophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first order for certificates, medals, or trophies.
              </p>
              <button
                onClick={() => openOrderModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Create First Order
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">
                          {order.orderNumber}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                        {order.urgentDelivery && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <FaExclamationTriangle className="w-3 h-3 mr-1" />
                            URGENT
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                        {order.certificates > 0 && (
                          <div className="flex items-center">
                            <FaCertificate className="text-yellow-500 mr-1" />
                            {order.certificates} Certificates
                          </div>
                        )}
                        {order.medals > 0 && (
                          <div className="flex items-center">
                            <FaMedal className="text-yellow-500 mr-1" />
                            {order.medals} Medals
                          </div>
                        )}
                        {order.trophies > 0 && (
                          <div className="flex items-center">
                            <FaTrophy className="text-yellow-600 mr-1" />
                            {order.trophies} Trophies
                          </div>
                        )}
                      </div>

                      {order.totalAmount && (
                        <div className="text-sm font-medium text-green-600 mb-2">
                          Total: ₹{order.totalAmount.toLocaleString()}
                        </div>
                      )}

                      {order.specialInstructions && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Instructions:</strong> {order.specialInstructions}
                        </p>
                      )}

                      {order.adminRemarks && (
                        <p className="text-sm text-blue-600 mb-2">
                          <strong>Admin Notes:</strong> {order.adminRemarks}
                        </p>
                      )}

                      <div className="text-xs text-gray-500">
                        Created: {new Date(order.createdAt).toLocaleDateString()}
                        {order.processedAt && (
                          <span className="ml-4">
                            Processed: {new Date(order.processedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => openOrderModal(order)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors inline-flex items-center"
                          >
                            <FaEdit className="mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors inline-flex items-center"
                          >
                            <FaTrash className="mr-1" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingOrder ? 'Edit Order' : 'Create New Order'}
            </h3>
            
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificates
                </label>
                <input
                  type="number"
                  min="0"
                  value={orderForm.certificates}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, certificates: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medals
                </label>
                <input
                  type="number"
                  min="0"
                  value={orderForm.medals}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, medals: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trophies
                </label>
                <input
                  type="number"
                  min="0"
                  value={orderForm.trophies}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, trophies: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={orderForm.specialInstructions}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requirements or custom designs..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="urgentDelivery"
                  checked={orderForm.urgentDelivery}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, urgentDelivery: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="urgentDelivery" className="ml-2 block text-sm text-gray-700">
                  Urgent Delivery Required
                </label>
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
                      {editingOrder ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingOrder ? 'Update Order' : 'Create Order'
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

export default EventOrders;