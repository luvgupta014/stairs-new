import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCreditCard, FaCheck, FaInfoCircle, FaLock } from 'react-icons/fa';

const CheckoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  paymentData,
  loading = false
}) => {
  if (!isOpen) return null;

  const {
    title = 'Payment Summary',
    description = 'Review your payment details before proceeding',
    items = [],
    subtotal = 0,
    tax = 0,
    discount = 0,
    total = 0,
    currency = 'INR',
    paymentType = 'subscription', // 'subscription', 'event', 'order', 'registration'
    orderDetails = null,
    planDetails = null,
    eventDetails = null
  } = paymentData || {};

  // Debug logging for event payments
  if (paymentType === 'event' && eventDetails) {
    console.log('CheckoutModal Event Details:', {
      perStudentFee: eventDetails.perStudentFee,
      participants: eventDetails.participants,
      name: eventDetails.name
    });
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentTypeLabel = () => {
    switch (paymentType) {
      case 'subscription':
        return 'Subscription Payment';
      case 'event':
        return 'Event Fee Payment';
      case 'order':
        return 'Order Payment';
      case 'registration':
        return 'Registration Payment';
      default:
        return 'Payment';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{title}</h3>
                  <p className="text-emerald-100 text-sm">{description}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-emerald-100 focus:outline-none focus:text-emerald-100 p-2 rounded-full hover:bg-emerald-700 transition-colors"
                  disabled={loading}
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Payment Type Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  <FaCreditCard className="mr-1" />
                  {getPaymentTypeLabel()}
                </span>
              </div>

              {/* Order/Plan/Event Details */}
              {orderDetails && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
                  <div className="space-y-2 text-sm">
                    {orderDetails.orderNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Number:</span>
                        <span className="font-medium text-gray-900">{orderDetails.orderNumber}</span>
                      </div>
                    )}
                    {orderDetails.certificates > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Certificates:</span>
                        <span className="font-medium text-gray-900">{orderDetails.certificates}</span>
                      </div>
                    )}
                    {orderDetails.medals > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Medals:</span>
                        <span className="font-medium text-gray-900">{orderDetails.medals}</span>
                      </div>
                    )}
                    {orderDetails.trophies > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trophies:</span>
                        <span className="font-medium text-gray-900">{orderDetails.trophies}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {planDetails && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 mb-6 border border-emerald-200">
                  <h4 className="font-semibold text-emerald-900 mb-2">{planDetails.name}</h4>
                  <p className="text-sm text-emerald-700">
                    {planDetails.duration} subscription plan
                  </p>
                  {planDetails.features && planDetails.features.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {planDetails.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-emerald-800">
                          <FaCheck className="text-emerald-600 mr-2 text-xs" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {planDetails.features.length > 3 && (
                        <div className="text-xs text-emerald-700 font-medium mt-1">
                          +{planDetails.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {eventDetails && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">{eventDetails.name}</h4>
                  {eventDetails.participants !== undefined && (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-700">
                        <strong>Number of Participants:</strong> {eventDetails.participants}
                      </p>
                      {eventDetails.perStudentFee && eventDetails.perStudentFee > 0 && (
                        <>
                          <p className="text-sm text-blue-700">
                            <strong>Per Student Fee:</strong> ₹{eventDetails.perStudentFee.toFixed(2)}
                          </p>
                          <div className="pt-2 border-t border-blue-300">
                            <p className="text-sm font-semibold text-blue-900">
                              Calculation: {eventDetails.participants} participants × ₹{eventDetails.perStudentFee.toFixed(2)} = ₹{(eventDetails.participants * eventDetails.perStudentFee).toFixed(2)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Digital Certificate Message for Event Payments */}
              {paymentType === 'event' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-900 mb-1">Digital Certificate Issuance</p>
                      <p className="text-xs text-green-700">
                        Digital certificate issuance is provided at no additional cost. Continue to pay event fees only.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Breakdown */}
              <div className="border-t border-b border-gray-200 py-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Payment Breakdown</h4>
                
                {/* Items List */}
                {items && items.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                          )}
                          {item.quantity && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Quantity: {item.quantity}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 ml-4">
                          {formatAmount(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 mb-4">
                    {paymentType === 'subscription' && planDetails && (
                      <div className="flex justify-between">
                        <span>Subscription Fee:</span>
                        <span className="font-medium">{formatAmount(subtotal)}</span>
                      </div>
                    )}
                    {paymentType === 'event' && eventDetails && (
                      <div className="space-y-3">
                        {(() => {
                          const participants = Number(eventDetails.participants) || 0;
                          let perStudentFee = null;
                          
                          // Try to get perStudentFee from eventDetails
                          if (eventDetails.perStudentFee != null && eventDetails.perStudentFee !== 0) {
                            perStudentFee = Number(eventDetails.perStudentFee);
                          }
                          
                          // If perStudentFee is not provided or is 0, calculate it from subtotal
                          if ((perStudentFee == null || perStudentFee === 0) && participants > 0 && subtotal > 0) {
                            perStudentFee = subtotal / participants;
                          }
                          
                          // Always show detailed breakdown if we have participants and any amount
                          if (participants > 0 && (subtotal > 0 || total > 0)) {
                            // Use calculated perStudentFee or calculate from total/subtotal
                            if (!perStudentFee || perStudentFee === 0) {
                              perStudentFee = (subtotal > 0 ? subtotal : total) / participants;
                            }
                            return (
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">Per Student Fee:</span>
                                    <span className="text-base font-semibold text-gray-900">₹{perStudentFee.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">Number of Participants:</span>
                                    <span className="text-base font-semibold text-gray-900">{participants}</span>
                                  </div>
                                  <div className="pt-3 border-t-2 border-gray-300">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm text-gray-600">Calculation:</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-base font-semibold text-gray-900">
                                        {participants} × ₹{perStudentFee.toFixed(2)}
                                      </span>
                                      <span className="text-lg font-bold text-blue-600">
                                        = ₹{(participants * perStudentFee).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex justify-between">
                                <span>Event Fee:</span>
                                <span className="font-medium">{formatAmount(subtotal)}</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}
                    {paymentType === 'event' && !eventDetails && (
                      <div className="flex justify-between">
                        <span>Event Fee:</span>
                        <span className="font-medium">{formatAmount(subtotal)}</span>
                      </div>
                    )}
                    {paymentType === 'order' && (
                      <div className="flex justify-between">
                        <span>Order Total:</span>
                        <span className="font-medium">{formatAmount(subtotal)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Calculations */}
                {!(paymentType === 'event' && eventDetails?.perStudentFee && eventDetails.perStudentFee > 0) && (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    {subtotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-gray-900">{formatAmount(subtotal)}</span>
                      </div>
                    )}
                    {tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span className="text-gray-900">{formatAmount(tax)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Discount:</span>
                        <span>-{formatAmount(discount)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Total Amount */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 mb-6 border-2 border-emerald-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    {paymentType === 'event' && eventDetails && (() => {
                      const participants = Number(eventDetails.participants) || 0;
                      let perStudentFee = null;
                      
                      // Try to get perStudentFee from eventDetails
                      if (eventDetails.perStudentFee != null) {
                        perStudentFee = Number(eventDetails.perStudentFee);
                      }
                      
                      // If perStudentFee is not provided or is 0, calculate it from total
                      if ((perStudentFee == null || perStudentFee === 0) && participants > 0 && total > 0) {
                        perStudentFee = total / participants;
                      }
                      
                      if (perStudentFee != null && perStudentFee > 0 && participants > 0) {
                        return (
                          <p className="text-xs text-gray-600 mt-1">
                            ({participants} participants × ₹{perStudentFee.toFixed(2)})
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <span className="text-3xl font-bold text-emerald-600">
                    {formatAmount(total)}
                  </span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <FaLock className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Secure Payment</p>
                    <p className="text-xs text-blue-700">
                      Your payment will be processed securely through Razorpay. We do not store your card details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCreditCard className="mr-2" />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>

              {/* Info Notice */}
              <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
                <FaInfoCircle className="mr-1" />
                <span>Clicking "Confirm Payment" will redirect you to Razorpay checkout</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default CheckoutModal;

