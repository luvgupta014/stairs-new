import React, { useState, useEffect } from 'react';
import {
  getEventRegistrationOrdersAdmin,
  notifyCoordinatorForCompletion,
  generateCertificates,
  getEventCertificatesAdmin,
  updateEventStatus,
  getEventParticipants,
  generateCertificatesFromRegistrationsAdmin
} from '../api';
import Spinner from './Spinner';
import {
  FaCertificate,
  FaCheckCircle,
  FaTimesCircle,
  FaBell,
  FaDownload,
  FaFileAlt
} from 'react-icons/fa';

const AdminCertificateIssuance = ({ event, onSuccess }) => {
  const [registrationOrders, setRegistrationOrders] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // orders, certificates
  const [notifyMessage, setNotifyMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersResponse, certsResponse, participantsResponse] = await Promise.allSettled([
        getEventRegistrationOrdersAdmin(event.id),
        getEventCertificatesAdmin(event.id),
        getEventParticipants(event.id, { page: 1, limit: 1000 })
      ]);

      if (ordersResponse.status === 'fulfilled' && ordersResponse.value?.success) {
        setRegistrationOrders(ordersResponse.value.data.orders || []);
      } else {
        setRegistrationOrders([]);
      }

      if (certsResponse.status === 'fulfilled' && certsResponse.value?.success) {
        setCertificates(certsResponse.value.data.certificates || []);
      } else {
        setCertificates([]);
      }

      if (participantsResponse.status === 'fulfilled' && participantsResponse.value?.success) {
        // Backend shape: { success: true, data: { event, participants } }
        const pv = participantsResponse.value;
        const list =
          pv?.data?.participants ||
          pv?.data?.registrations ||
          pv?.participants ||
          pv?.registrations ||
          [];
        setParticipants(Array.isArray(list) ? list : []);
      } else {
        setParticipants([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      const msg = err?.message || err?.response?.data?.message || 'Failed to load certificate issuance data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyCompletion = async () => {
    // Message is optional - if empty, use default message
    const messageToSend = notifyMessage.trim() || `Your event "${event.name}" has been completed. Certificates are ready for generation. Please check your dashboard for details.`;

    try {
      setNotifying(true);
      setError('');
      const response = await notifyCoordinatorForCompletion(event.id, messageToSend);
      if (response.success) {
        const data = response.data;
        setSuccess(
          `✅ Notification sent! ${data.notificationsCreated || 0} dashboard notification(s), ${data.emailsSent || 0} email(s). ${data.totalStudentsForCertificates || 0} certificate(s) eligible.`
        );
        setNotifyMessage('');
        await loadData();
      } else {
        setError(response.message || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Notification error:', err);
      setError(err.message || 'Failed to send notification. Please try again.');
    } finally {
      setNotifying(false);
    }
  };

  const handleMarkEventCompleted = async () => {
    try {
      setProcessing(true);
      setError('');
      const response = await updateEventStatus(event.id, 'COMPLETED');
      if (response.success) {
        setSuccess('✅ Event marked as COMPLETED! Coordinators can now be notified.');
        await loadData();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to mark event as completed');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateCertificates = async (orderId) => {
    try {
      setProcessing(true);
      setError('');
      const response = await generateCertificates(orderId);
      if (response.success) {
        setSuccess(`✅ ${response.data.certificatesGenerated} certificates generated successfully!`);
        await loadData();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate certificates');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateCertificatesFromRegistrations = async () => {
    try {
      setProcessing(true);
      setError('');
      const response = await generateCertificatesFromRegistrationsAdmin(event.id);
      if (response.success) {
        const d = response.data || {};
        setSuccess(`✅ ${d.certificatesGenerated || 0} certificates generated successfully! (Skipped existing: ${d.skippedExisting || 0})`);
        await loadData();
      } else {
        setError(response.message || 'Failed to generate certificates');
      }
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || 'Failed to generate certificates';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          <FaCertificate className="inline mr-2" />
          Certificate Issuance Management
        </h3>
        <p className="text-gray-600">
          For Event: <span className="font-semibold">{event.name}</span>
        </p>
      </div>

      {/* Alerts */}
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
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Registration Orders ({registrationOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'certificates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Issued Certificates ({certificates.length})
          </button>
        </nav>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {/* Mark Event as Completed Section */}
          {event.status !== 'COMPLETED' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-900 mb-3">Step 1: Mark Event as Completed</h4>
              <p className="text-sm text-yellow-800 mb-4">
                Before sending notifications and generating certificates, mark this event as completed.
              </p>
              <button
                onClick={handleMarkEventCompleted}
                disabled={processing || event.status === 'COMPLETED'}
                className="w-full bg-yellow-600 text-white py-2 rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center"
              >
                {processing ? (
                  <>
                    <Spinner size="sm" color="white" />
                    <span className="ml-2">Marking as Completed...</span>
                  </>
                ) : (
                  '✓ Mark Event as Completed'
                )}
              </button>
            </div>
          )}

          {/* Notification Section - Always show, but warn if not completed */}
          <div className={event.status === 'COMPLETED' ? 'bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6' : 'bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6'}>
              <h4 className={`font-semibold mb-3 flex items-center ${event.status === 'COMPLETED' ? 'text-blue-900' : 'text-orange-900'}`}>
                <FaBell className="mr-2" />
                Step 2: Notify Coordinators for Final Payment & Certificates
              </h4>
              {event.status !== 'COMPLETED' && (
                <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 mb-3">
                  <p className="text-sm text-orange-800 font-medium">
                    ⚠️ Note: Event is not marked as COMPLETED. You can still send notifications, but it's recommended to mark the event as completed first.
                  </p>
                </div>
              )}
              <p className={`text-sm mb-3 ${event.status === 'COMPLETED' ? 'text-blue-800' : 'text-orange-800'}`}>
                Send notifications to all coaches/coordinators who have <strong>paid</strong> registration orders for this event. They will receive both in-app notifications and email notifications.
              </p>
              {(() => {
                const paidOrders = registrationOrders.filter(order => order.paymentStatus === 'PAID');
                if (paidOrders.length === 0) {
                  return (
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-3">
                      <p className="text-sm text-gray-700 font-medium">
                        ⚠️ No paid registration orders found for this event. Coaches must complete payment before notifications can be sent.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-3">
                    <p className="text-sm text-green-800 font-medium">
                      ✅ Found {paidOrders.length} paid registration order(s) ready for notification. {paidOrders.reduce((sum, o) => sum + (o.totalStudents || o.registrationItems?.length || 0), 0)} student certificate(s) will be ready.
                    </p>
                  </div>
                );
              })()}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message (Optional)
                  </label>
                  <textarea
                    value={notifyMessage}
                    onChange={(e) => setNotifyMessage(e.target.value)}
                    placeholder="Enter a custom message for coordinators (optional). If left empty, a default message will be sent."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use default message, or customize to include payment details, certificate information, etc.
                  </p>
                </div>
                <button
                  onClick={handleNotifyCompletion}
                  disabled={notifying || registrationOrders.filter(order => order.paymentStatus === 'PAID').length === 0}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
                >
                  {notifying ? (
                    <>
                      <Spinner size="sm" color="white" />
                      <span className="ml-2">Notifying...</span>
                    </>
                  ) : (
                    <>
                      <FaBell className="mr-2" />
                      Send Notification to All Coordinators
                    </>
                  )}
                </button>
              </div>
          </div>

          {/* Orders List */}
          {registrationOrders.length === 0 ? (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FaFileAlt className="text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">No Registration Orders</p>
                    <p className="text-sm text-gray-700 mt-1">
                      This event has no coordinator registration orders. If this is an admin-created / student-fee event, generate certificates from participant registrations instead.
                    </p>
                  </div>
                </div>
              </div>

              {/* Generate from registrations (admin-created events) */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-900 mb-2">Generate Certificates from Participants</h4>
                <p className="text-sm text-emerald-800 mb-3">
                  Eligible participants: {participants.length}. For paid admin-created events, only APPROVED participants are eligible.
                </p>
                <button
                  onClick={handleGenerateCertificatesFromRegistrations}
                  disabled={processing || event.status !== 'COMPLETED' || participants.length === 0}
                  className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <Spinner size="sm" color="white" />
                      <span className="ml-2">Generating...</span>
                    </>
                  ) : (
                    <>
                      <FaCertificate className="mr-2" />
                      Generate Certificates ({participants.length})
                    </>
                  )}
                </button>
                {event.status !== 'COMPLETED' && (
                  <p className="text-xs text-emerald-800 mt-2">
                    Mark the event as COMPLETED first.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {registrationOrders.map(order => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        Coach: <span className="font-medium">{order.coach.name}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium block mb-2 ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {order.paymentStatus === 'PAID' ? '✅ Paid' : '⏳ Pending'}
                      </span>
                      {order.adminNotified && (
                        <span className="inline-flex items-center text-xs text-blue-600">
                          <FaBell className="mr-1" /> Notified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Students</p>
                      <p className="font-bold text-gray-900">{order.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Fee per Student</p>
                      <p className="font-bold text-gray-900">₹{order.eventFeePerStudent}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="font-bold text-green-600">₹{order.totalFeeAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-bold">
                        {order.certificateGenerated ? '✅ Certs Generated' : '⏳ Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Student List Toggle */}
                  <div className="mb-3">
                    <button
                      onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {selectedOrder === order.id ? '▼' : '▶'} View {order.totalStudents} Students
                    </button>

                    {selectedOrder === order.id && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-2 max-h-48 overflow-y-auto">
                        <div className="space-y-2">
                          {order.registrationItems.map(item => (
                            <div key={item.id} className="text-sm text-gray-700 flex items-center">
                              <span className="text-green-600 mr-2">✓</span>
                              {item.student.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {order.paymentStatus === 'PAID' && !order.certificateGenerated && (
                    <button
                      onClick={() => handleGenerateCertificates(order.id)}
                      disabled={processing}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center"
                    >
                      {processing ? (
                        <>
                          <Spinner size="sm" color="white" />
                          <span className="ml-2">Generating...</span>
                        </>
                      ) : (
                        <>
                          <FaCertificate className="mr-2" />
                          Generate Certificates ({order.totalStudents})
                        </>
                      )}
                    </button>
                  )}

                  {order.certificateGenerated && (
                    <div className="text-center py-2 bg-green-50 rounded-lg text-green-700 font-medium flex items-center justify-center">
                      <FaCheckCircle className="mr-2" />
                      {order.totalStudents} Certificates Generated
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <div>
          {certificates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FaCertificate className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold mb-2">No Certificates Generated Yet</p>
              <p className="text-gray-600">Generate certificates from the "Registration Orders" tab.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Student Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Sport</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Certificate ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Issued Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map(cert => (
                    <tr key={cert.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{cert.participantName}</td>
                      <td className="py-3 px-4 text-gray-600">{cert.sportName}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-sm">{cert.uniqueId}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                          <FaDownload className="mr-1" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCertificateIssuance;
