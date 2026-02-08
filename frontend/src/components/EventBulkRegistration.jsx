import React, { useState, useEffect } from 'react';
import { bulkRegisterStudentsForEvent, getEventRegistrationOrders, initiateRegistrationPayment, verifyRegistrationPayment } from '../api';
import Spinner from './Spinner';
import { FaUsers, FaCheckCircle, FaTimesCircle, FaCoins, FaDownload } from 'react-icons/fa';

const EventBulkRegistration = ({ event, coachStudents, onSuccess }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [eventFeePerStudent, setEventFeePerStudent] = useState(0);
  const [registrationOrders, setRegistrationOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('select'); // select, orders, payment
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRegistrationOrders();
  }, []);

  const loadRegistrationOrders = async () => {
    try {
      setLoading(true);
      const response = await getEventRegistrationOrders(event.id);
      if (response.success) {
        setRegistrationOrders(response.data);
      }
    } catch (err) {
      console.error('Failed to load registration orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
    setError('');
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(coachStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const totalFee = selectedStudents.length * eventFeePerStudent;

  const handleRegisterStudents = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student.');
      return;
    }

    if (eventFeePerStudent < 0) {
      setError('Event fee cannot be negative.');
      return;
    }

    try {
      setRegistering(true);
      setError('');
      const response = await bulkRegisterStudentsForEvent(
        event.id,
        selectedStudents,
        eventFeePerStudent
      );

      if (response.success) {
        setSuccess('Registration created! Proceed to payment.');
        setSelectedStudents([]);
        setEventFeePerStudent(0);
        setActiveTab('orders');
        await loadRegistrationOrders();
      } else {
        setError(response.message || 'Failed to create registration');
      }
    } catch (err) {
      setError(err.message || 'Failed to register students');
    } finally {
      setRegistering(false);
    }
  };

  const handlePayment = async (order) => {
    if (order.paymentStatus === 'PAID') {
      setError('This order has already been paid.');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      
      // Initiate payment
      const paymentResponse = await initiateRegistrationPayment(event.id, order.id);
      
      if (paymentResponse.success) {
        const razorpayOrderId = paymentResponse.data.razorpayOrderId;
        
        // Open Razorpay payment modal
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          order_id: razorpayOrderId,
          amount: Math.round(order.totalFeeAmount * 100),
          currency: 'INR',
          name: 'Stairs Event Registration',
          description: `Register ${order.totalStudents} students for ${event.name}`,
          handler: async (response) => {
            try {
              // Verify payment
              const verifyResponse = await verifyRegistrationPayment(
                event.id,
                order.id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );

              if (verifyResponse.success) {
                setSuccess(`✅ Payment successful! ${order.totalStudents} students registered for the event.`);
                setSelectedOrder(null);
                await loadRegistrationOrders();
                if (onSuccess) onSuccess();
              } else {
                setError('Payment verification failed. Please contact support.');
              }
            } catch (err) {
              setError('Payment verification failed: ' + err.message);
            }
          },
          prefill: {
            name: 'Coach',
            email: 'coach@stairs.com'
          },
          theme: {
            color: '#10b981'
          }
        };

        const Razorpay = window.Razorpay;
        const razorpay = new Razorpay(options);
        razorpay.open();
      } else {
        setError(paymentResponse.message || 'Failed to initiate payment');
      }
    } catch (err) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          <FaUsers className="inline mr-2" />
          Bulk Student Registration
        </h3>
        <p className="text-gray-600">
          Register multiple students for this event and collect fees via Razorpay
        </p>
      </div>

      {/* Error and Success Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <FaTimesCircle className="text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-600 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('select')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'select'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Select Students
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Orders ({registrationOrders.length})
          </button>
        </nav>
      </div>

      {/* Select Students Tab */}
      {activeTab === 'select' && (
        <div>
          {/* Fee Configuration */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Fee Per Student (₹)
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={eventFeePerStudent}
              onChange={(e) => setEventFeePerStudent(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 500"
            />
            <p className="text-sm text-blue-600 mt-2">
              💡 Example: ₹500 per student × 50 students = ₹25,000 total
            </p>
          </div>

          {/* Student Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Select Students</h4>
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === coachStudents.length && coachStudents.length > 0}
                  onChange={handleSelectAll}
                  className="mr-2"
                />
                Select All
              </label>
            </div>

            {coachStudents.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No students connected to you yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {coachStudents.map(student => (
                  <div key={student.id} className="border border-gray-200 rounded-lg p-3">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelection(student.id)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">
                          {student.sport} • {student.level || 'No level'}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary and Submit */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Students Selected</p>
                <p className="text-2xl font-bold text-gray-900">{selectedStudents.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fee per Student</p>
                <p className="text-2xl font-bold text-gray-900">₹{eventFeePerStudent}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Fee</p>
                <p className="text-2xl font-bold text-green-600">₹{totalFee.toLocaleString()}</p>
              </div>
            </div>

            <button
              onClick={handleRegisterStudents}
              disabled={selectedStudents.length === 0 || registering}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center"
            >
              {registering ? (
                <>
                  <Spinner size="sm" color="white" />
                  <span className="ml-2">Creating Registration...</span>
                </>
              ) : (
                <>
                  <FaUsers className="mr-2" />
                  Create Registration Order
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <Spinner size="lg" />
            </div>
          ) : registrationOrders.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FaUsers className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No registration orders yet. Create one from the "Select Students" tab.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {registrationOrders.map(order => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'PAYMENT_PENDING'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.paymentStatus === 'PAID' ? '✅ Paid' : 'Pending Payment'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Students</p>
                      <p className="font-bold text-gray-900">{order.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fee per Student</p>
                      <p className="font-bold text-gray-900">₹{order.eventFeePerStudent}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-bold text-green-600">₹{order.totalFeeAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Student List */}
                  {selectedOrder === order.id && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="font-medium text-gray-900 mb-2">Registered Students:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {order.registrationItems.map(item => (
                          <div key={item.id} className="text-sm text-gray-600">
                            • {item.student.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      {selectedOrder === order.id ? 'Hide' : 'View'} Students
                    </button>

                    {order.paymentStatus !== 'PAID' && (
                      <button
                        onClick={() => handlePayment(order)}
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center"
                      >
                        {processing ? (
                          <>
                            <Spinner size="sm" color="white" />
                            <span className="ml-2">Processing...</span>
                          </>
                        ) : (
                          <>
                            <FaCoins className="mr-2" />
                            Pay Now
                          </>
                        )}
                      </button>
                    )}

                    {order.paymentStatus === 'PAID' && (
                      <button
                        disabled
                        className="flex-1 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm cursor-default inline-flex items-center justify-center"
                      >
                        <FaCheckCircle className="mr-2" />
                        Payment Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventBulkRegistration;
