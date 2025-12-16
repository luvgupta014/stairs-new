import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  createEventOrder, 
  getEventOrders, 
  updateEventOrder, 
  deleteEventOrder,
  createOrderPayment,
  verifyOrderPayment,
  verifyEventPermission
} from '../../api';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaCertificate,
  FaMedal,
  FaTrophy,
  FaExclamationTriangle,
  FaClock,
  FaCheck,
  FaSpinner,
  FaCreditCard,
  FaMoneyBillWave
} from 'react-icons/fa';
import Spinner from '../../components/Spinner';
import BackButton from '../../components/BackButton';
import CheckoutModal from '../../components/CheckoutModal';
import { useAuth } from '../../contexts/AuthContext';

const EventOrders = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [eventData, setEventData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dismissedMessageAt, setDismissedMessageAt] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [razorpayOrderData, setRazorpayOrderData] = useState(null);
  const [canSetMedalPricing, setCanSetMedalPricing] = useState(false);
  
  // Order form state
  const [orderForm, setOrderForm] = useState({
    certificates: 0,
    medals: 0, // computed total (Gold+Silver+Bronze); kept for backwards compatibility
    medalGold: 0,
    medalSilver: 0,
    medalBronze: 0,
    trophies: 0,
    medalPrice: '', // ₹ per medal (based on dimension, not color)
    specialInstructions: '',
    urgentDelivery: false
  });
  const [submitting, setSubmitting] = useState(false);

  const getSuggestedMedalPrice = (level) => {
    const lvl = String(level || '').toUpperCase().trim();
    if (lvl === 'DISTRICT') return 30;
    if (lvl === 'STATE') return 55;
    return '';
  };

  const medalsTotal =
    (parseInt(orderForm.medalGold) || 0) +
    (parseInt(orderForm.medalSilver) || 0) +
    (parseInt(orderForm.medalBronze) || 0);

  // Requirement: do NOT show medal pricing to coordinator/coach; only show to EVENT_INCHARGE with feeManagement permission
  const showMedalPricing = user?.role === 'EVENT_INCHARGE' && !!canSetMedalPricing;

  const computedTotalAmount = (() => {
    const cert = parseInt(orderForm.certificates) || 0;
    const trop = parseInt(orderForm.trophies) || 0;
    const medalUnit = showMedalPricing ? (parseFloat(orderForm.medalPrice || 0) || 0) : 0;
    // Only compute/show medal pricing for permitted incharges.
    const total = medalsTotal * medalUnit;
    // keep stable number formatting
    return { total, cert, trop, medalUnit };
  })();

  useEffect(() => {
    loadOrders();
  }, [eventId]);

  useEffect(() => {
    const loadPricingPermission = async () => {
      try {
        if (user?.role !== 'EVENT_INCHARGE') {
          setCanSetMedalPricing(false);
          return;
        }
        const res = await verifyEventPermission(eventId, 'feeManagement');
        setCanSetMedalPricing(!!res?.data?.hasPermission);
      } catch {
        // fail closed
        setCanSetMedalPricing(false);
      }
    };
    if (eventId && user?.role) loadPricingPermission();
  }, [eventId, user?.role]);

  const getApiErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
    // We sometimes throw error.response.data (object) or error.message (string)
    const raw = err?.response?.data || err;
    if (typeof raw === 'string') return raw;
    const msg =
      raw?.message ||
      raw?.error ||
      raw?.details ||
      err?.message;
    return msg || fallback;
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading orders for event:', eventId);
      const response = await getEventOrders(eventId);
      
      console.log('📦 Orders response:', response);
      
      if (response.success) {
        setEventData(response.data.event);
        setOrders(response.data.orders || []);
        console.log('✅ Orders loaded:', response.data.orders?.length || 0);
      }
    } catch (error) {
      console.error('❌ Failed to load orders:', error);
      showMessage('error', getApiErrorMessage(error, 'Failed to load orders.'));
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setDismissedMessageAt(0);
    window.clearTimeout(showMessage._t);
    showMessage._t = window.setTimeout(() => setMessage({ type: '', text: '' }), type === 'error' ? 8000 : 5000);
  };

  const openOrderModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      const mg = parseInt(order.medalGold ?? 0) || 0;
      const ms = parseInt(order.medalSilver ?? 0) || 0;
      const mb = parseInt(order.medalBronze ?? 0) || 0;
      const hasBreakdown = (mg + ms + mb) > 0;
      const fallbackGold = hasBreakdown ? mg : (parseInt(order.medals ?? 0) || 0);
      setOrderForm({
        certificates: order.certificates,
        medals: order.medals,
        medalGold: hasBreakdown ? mg : fallbackGold,
        medalSilver: hasBreakdown ? ms : 0,
        medalBronze: hasBreakdown ? mb : 0,
        trophies: order.trophies,
        medalPrice: showMedalPricing && order.medalPrice !== null && order.medalPrice !== undefined ? String(order.medalPrice) : '',
        specialInstructions: order.specialInstructions || '',
        urgentDelivery: order.urgentDelivery
      });
    } else {
      setEditingOrder(null);
      setOrderForm({
        certificates: 0,
        medals: 0,
        medalGold: 0,
        medalSilver: 0,
        medalBronze: 0,
        trophies: 0,
        medalPrice: showMedalPricing ? String(getSuggestedMedalPrice(eventData?.level) || '') : '',
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

    const payload = {
      ...orderForm,
      medals: medalsTotal,
      ...(showMedalPricing ? { medalPrice: orderForm.medalPrice } : {})
    };

    if (payload.certificates === 0 && payload.medals === 0 && payload.trophies === 0) {
      showMessage('error', 'Please specify at least one item to order');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingOrder) {
        console.log('🔄 Updating order:', editingOrder.id, payload);
        await updateEventOrder(eventId, editingOrder.id, payload);
        showMessage('success', 'Order updated successfully');
      } else {
        console.log('🔄 Creating new order:', payload);
        const result = await createEventOrder(eventId, payload);
        console.log('✅ Order created:', result);
        showMessage('success', 'Order created successfully');
      }
      
      closeOrderModal();
      loadOrders();
    } catch (error) {
      console.error('Submit order failed:', error);
      const msg = getApiErrorMessage(error, 'Failed to submit order.');
      // Add permission/pricing hints for common cases
      if (String(msg).toLowerCase().includes('fee management')) {
        showMessage('error', `${msg} (Ask admin to enable Fee Management for your event assignment.)`);
      } else if (String(msg).toLowerCase().includes('certificate management')) {
        showMessage('error', `${msg} (Ask admin to enable Certificate Management for your event assignment.)`);
      } else {
        showMessage('error', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!confirm(`Are you sure you want to delete order "${orderNumber}"?`)) {
      return;
    }

    try {
      await deleteEventOrder(eventId, orderId);
      showMessage('success', 'Order deleted successfully');
      loadOrders();
    } catch (error) {
      console.error('Delete failed:', error);
      showMessage('error', getApiErrorMessage(error, 'Failed to delete order.'));
    }
  };

  const handlePayment = async (order) => {
    if (!order.totalAmount || order.totalAmount <= 0) {
      showMessage('error', 'Order total amount is required for payment');
      return;
    }

    try {
      setPaymentLoading(true);
      
      // Create payment order using the API function
      const result = await createOrderPayment(order.id);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create payment order');
      }

      const paymentData = result.data;
      
      // Store order and payment data for checkout modal
      setSelectedOrderForPayment(order);
      setRazorpayOrderData(paymentData);
      setShowCheckout(true);
      setPaymentLoading(false);
    } catch (error) {
      console.error('Payment initiation failed:', error);
      const msg = getApiErrorMessage(error, 'Failed to initiate payment.');
      if (String(msg).toLowerCase().includes('confirmed') || String(msg).toLowerCase().includes('priced')) {
        showMessage('error', `${msg} (Set medal price / wait for admin to price, then try again.)`);
      } else {
        showMessage('error', msg);
      }
      setPaymentLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrderForPayment || !razorpayOrderData) {
      return;
    }

    try {
      setPaymentLoading(true);
      const order = selectedOrderForPayment;
      const paymentData = razorpayOrderData;

      const keyFromBackend = paymentData?.razorpayKeyId;
      const keyFromEnv = import.meta.env.VITE_RAZORPAY_KEY_ID;
      const razorpayKey = keyFromBackend || keyFromEnv;

      // Validate key format early to avoid opaque Razorpay 400s
      if (!razorpayKey || !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(String(razorpayKey))) {
        throw new Error(
          `Razorpay key is misconfigured. Expected something like rzp_test_xxx / rzp_live_xxx, got: "${String(razorpayKey)}".`
        );
      }

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Configure Razorpay options
      const options = {
        key: razorpayKey,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Event Order Payment',
        description: `Payment for Order: ${paymentData.orderDetails.orderNumber}`,
        order_id: paymentData.orderId,
        prefill: {
          name: 'Coach', // You can get this from auth context
          email: '', // You can get this from auth context
        },
        theme: {
          color: '#2563eb'
        },
        handler: async function (response) {
          try {
            setPaymentLoading(true);
            
            // Verify payment using API function
            const verifyResult = await verifyOrderPayment(order.id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            if (verifyResult.success) {
              showMessage('success', 'Payment completed successfully! Admin has been notified.');
              loadOrders(); // Refresh orders to show updated payment status
            } else {
              throw new Error(verifyResult.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            showMessage('error', error.message || 'Payment verification failed');
          } finally {
            setPaymentLoading(false);
            setShowCheckout(false);
            setSelectedOrderForPayment(null);
            setRazorpayOrderData(null);
          }
        },
        modal: {
          ondismiss: function() {
            setPaymentLoading(false);
            setShowCheckout(false);
            setSelectedOrderForPayment(null);
            setRazorpayOrderData(null);
            showMessage('info', 'Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setShowCheckout(false);

    } catch (error) {
      console.error('Payment initiation failed:', error);
      showMessage('error', error.message || 'Failed to initiate payment');
      setPaymentLoading(false);
    }
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
              <div className="mr-4">
                <BackButton 
                  to="/dashboard/coach" 
                  label="Back to Dashboard" 
                  variant="minimal"
                  className="text-white hover:text-blue-200"
                />
              </div>
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
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">
                  {message.type === 'success' ? '✅' : message.type === 'error' ? '⚠️' : 'ℹ️'}
                </span>
                <div>
                  <div className="font-semibold">
                    {message.type === 'success' ? 'Success' : message.type === 'error' ? 'Action needed' : 'Heads up'}
                  </div>
                  <div className="text-sm mt-1">{message.text}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDismissedMessageAt(Date.now());
                  setMessage({ type: '', text: '' });
                }}
                className="text-current opacity-70 hover:opacity-100 font-semibold px-2"
                aria-label="Dismiss"
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
                            {(order.medalGold || order.medalSilver || order.medalBronze) ? (
                              <span className="ml-2 text-xs text-gray-500">
                                (G:{order.medalGold || 0} / S:{order.medalSilver || 0} / B:{order.medalBronze || 0})
                              </span>
                            ) : null}
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
                          Total Payable: ₹{Number(order.totalAmount).toLocaleString()}
                          {showMedalPricing && order.medalPrice ? (
                            <span className="ml-2 text-xs text-gray-600 font-normal">
                              (₹{order.medalPrice}/medal × {order.medals || 0} medals)
                            </span>
                          ) : null}
                          {order.paymentStatus && (
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              order.paymentStatus === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                              order.paymentStatus === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              Payment: {order.paymentStatus}
                            </span>
                          )}
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
                        {order.paymentDate && (
                          <span className="ml-4 text-green-600">
                            Paid: {new Date(order.paymentDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {['CONFIRMED', 'PAYMENT_PENDING'].includes(order.status) && order.paymentStatus !== 'SUCCESS' && (
                        <button
                          onClick={() => handlePayment(order)}
                          disabled={paymentLoading || !(Number(order.totalAmount) > 0)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors inline-flex items-center disabled:opacity-50 ${
                            Number(order.totalAmount) > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-700'
                          }`}
                          title={Number(order.totalAmount) > 0 ? 'Pay this order via Razorpay' : 'Awaiting pricing: admin must set total amount'}
                        >
                          {paymentLoading ? (
                            <>
                              <FaSpinner className="animate-spin mr-1" />
                              Processing...
                            </>
                          ) : Number(order.totalAmount) > 0 ? (
                            <>
                              <FaCreditCard className="mr-1" />
                              Pay Now
                            </>
                          ) : (
                            <>
                              <FaClock className="mr-1" />
                              Awaiting Pricing
                            </>
                          )}
                        </button>
                      )}
                      
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
                  Medals (Gold / Silver / Bronze)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Gold</div>
                    <input
                      type="number"
                      min="0"
                      value={orderForm.medalGold}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, medalGold: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Silver</div>
                    <input
                      type="number"
                      min="0"
                      value={orderForm.medalSilver}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, medalSilver: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Bronze</div>
                    <input
                      type="number"
                      min="0"
                      value={orderForm.medalBronze}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, medalBronze: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Total medals: <strong>{medalsTotal}</strong> (price is calculated on total medals, not color)
                </div>

                {showMedalPricing ? (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medal Price (₹ per medal)
                      {eventData?.level ? (
                        <span className="ml-2 text-xs text-gray-500">
                          Suggested for {eventData.level}: ₹{getSuggestedMedalPrice(eventData.level) || '—'}
                        </span>
                      ) : null}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={orderForm.medalPrice}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, medalPrice: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={getSuggestedMedalPrice(eventData?.level) ? String(getSuggestedMedalPrice(eventData?.level)) : 'e.g. 30'}
                      />
                      {getSuggestedMedalPrice(eventData?.level) ? (
                        <button
                          type="button"
                          onClick={() => setOrderForm(prev => ({ ...prev, medalPrice: String(getSuggestedMedalPrice(eventData?.level)) }))}
                          className="px-3 py-2 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                        >
                          Use ₹{getSuggestedMedalPrice(eventData?.level)}
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2">
                      Payable (medals only): <strong>₹{computedTotalAmount.total.toFixed(2)}</strong>
                      <div className="mt-1 text-gray-500">
                        Example: 100 Gold + 120 Silver + 140 Bronze = 360 medals × ₹{computedTotalAmount.medalUnit || 0} = ₹{(medalsTotal * (computedTotalAmount.medalUnit || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ) : null}
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

      {/* Checkout Modal */}
      {showCheckout && selectedOrderForPayment && razorpayOrderData && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => {
            setShowCheckout(false);
            setSelectedOrderForPayment(null);
            setRazorpayOrderData(null);
          }}
          onConfirm={handleConfirmPayment}
          loading={paymentLoading}
          paymentData={{
            title: 'Review Your Order Payment',
            description: 'Please review the payment details before proceeding to Razorpay',
            paymentType: 'order',
            orderDetails: {
              orderNumber: razorpayOrderData.orderDetails.orderNumber,
              certificates: razorpayOrderData.orderDetails.certificates || 0,
              medals: razorpayOrderData.orderDetails.medals || 0,
              trophies: razorpayOrderData.orderDetails.trophies || 0
            },
            items: [
              ...(razorpayOrderData.orderDetails.certificates > 0 ? [{
                name: 'Certificates',
                quantity: razorpayOrderData.orderDetails.certificates,
                amount: 0 // Price breakdown would come from backend if available
              }] : []),
              ...(razorpayOrderData.orderDetails.medals > 0 ? [{
                name: 'Medals',
                quantity: razorpayOrderData.orderDetails.medals,
                amount: 0
              }] : []),
              ...(razorpayOrderData.orderDetails.trophies > 0 ? [{
                name: 'Trophies',
                quantity: razorpayOrderData.orderDetails.trophies,
                amount: 0
              }] : [])
            ],
            subtotal: selectedOrderForPayment.totalAmount || 0,
            tax: 0,
            discount: 0,
            total: selectedOrderForPayment.totalAmount || 0,
            currency: razorpayOrderData.currency || 'INR'
          }}
        />
      )}
    </div>
  );
};

export default EventOrders;