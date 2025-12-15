import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { validateEventInchargeInvite, registerEventInchargeFromInvite } from '../../api';

const EventInchargeRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    designation: '',
    panNumber: '',
    aadhaar: '',

    vendorId: '',
    vendorName: '',
    vendorGstin: '',
    vendorPan: '',
    vendorAddress: '',
    vendorCity: '',
    vendorState: '',
    vendorPincode: '',

    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        if (!token) {
          setError('Missing invite token. Please open the link from your email.');
          setInvite(null);
          return;
        }
        const res = await validateEventInchargeInvite(token);
        if (!res?.success) {
          setError(res?.message || 'Invalid invite token.');
          setInvite(null);
          return;
        }
        setInvite(res.data);
        // If vendor is pre-linked, lock vendor selection; otherwise collect vendor details.
        setForm((prev) => ({
          ...prev,
          vendorId: res.data?.vendor?.id || '',
          vendorName: res.data?.vendor?.name || ''
        }));
      } catch (e) {
        setError(e?.message || 'Failed to validate invite.');
        setInvite(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) return setError('Missing invite token.');
    if (!form.fullName.trim()) return setError('Full name is required.');
    if (!form.password) return setError('Password is required.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    if (!form.vendorId && !form.vendorName.trim()) {
      return setError('Vendor name is required.');
    }

    setSubmitting(true);
    try {
      const payload = {
        token,
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        designation: form.designation.trim() || null,
        panNumber: form.panNumber.trim() || null,
        aadhaar: form.aadhaar.trim() || null,
        vendorId: form.vendorId || null,
        vendorName: form.vendorId ? null : (form.vendorName.trim() || null),
        vendorGstin: form.vendorGstin.trim() || null,
        vendorPan: form.vendorPan.trim() || null,
        vendorAddress: form.vendorAddress.trim() || null,
        vendorCity: form.vendorCity.trim() || null,
        vendorState: form.vendorState.trim() || null,
        vendorPincode: form.vendorPincode.trim() || null
      };

      const res = await registerEventInchargeFromInvite(payload);
      if (!res?.success) {
        setError(res?.message || 'Registration failed.');
        return;
      }

      setSuccess('Registration completed. You can now login as Event Incharge.');
      setTimeout(() => navigate('/login/incharge', { replace: true }), 1200);
    } catch (e2) {
      setError(e2?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                STAIRS
              </span>
            </Link>
            <Link to="/login/incharge" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              Event Incharge Login
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900">Complete Event Incharge Registration</h1>
          <p className="text-sm text-gray-600 mt-1">
            Fill the details below to get your credentials for this event.
          </p>

          {loading && (
            <div className="mt-6 text-sm text-gray-600">Validating invite...</div>
          )}

          {!loading && invite && (
            <div className="mt-6 p-4 rounded-xl border border-indigo-100 bg-indigo-50">
              <div className="text-sm text-indigo-900 font-semibold">Assigned Event</div>
              <div className="text-sm text-indigo-800 mt-1">
                <div><span className="font-medium">Event:</span> {invite.event?.name}</div>
                <div><span className="font-medium">Location:</span> {[invite.event?.venue, invite.event?.city, invite.event?.state].filter(Boolean).join(', ')}</div>
                <div><span className="font-medium">Permissions:</span>{' '}
                  {[
                    invite.permissions?.resultUpload ? 'Result Upload' : null,
                    invite.permissions?.studentManagement ? 'Student Management' : null,
                    invite.permissions?.certificateManagement ? 'Certificate Management' : null,
                    invite.permissions?.feeManagement ? 'Fee Management' : null
                  ].filter(Boolean).join(', ') || 'None'}
                </div>
                {invite.isPointOfContact ? (
                  <div className="mt-1 inline-flex text-xs font-semibold text-indigo-700 bg-white px-2 py-1 rounded-full">
                    Point of Contact
                  </div>
                ) : null}
              </div>
              <div className="text-xs text-indigo-700 mt-2">Email: {invite.email}</div>
            </div>
          )}

          {!loading && error && (
            <div className="mt-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && success && (
            <div className="mt-6 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
              {success}
            </div>
          )}

          {!loading && invite && (
            <form onSubmit={onSubmit} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input value={form.fullName} onChange={onChange('fullName')} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={onChange('phone')} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input value={form.designation} onChange={onChange('designation')} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                  <input value={form.panNumber} onChange={onChange('panNumber')} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar</label>
                  <input value={form.aadhaar} onChange={onChange('aadhaar')} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900">Event Vendor Details</h2>
                <p className="text-sm text-gray-600 mt-1">Not everything is compulsory — fill what’s available.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name {form.vendorId ? '' : '*'}</label>
                    <input
                      value={form.vendorName}
                      onChange={onChange('vendorName')}
                      disabled={!!form.vendorId}
                      className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                    />
                    {form.vendorId ? (
                      <div className="text-xs text-gray-500 mt-1">Vendor is pre-linked by Admin.</div>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                    <input value={form.vendorGstin} onChange={onChange('vendorGstin')} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor PAN</label>
                    <input value={form.vendorPan} onChange={onChange('vendorPan')} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input value={form.vendorAddress} onChange={onChange('vendorAddress')} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input value={form.vendorCity} onChange={onChange('vendorCity')} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input value={form.vendorState} onChange={onChange('vendorState')} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input value={form.vendorPincode} onChange={onChange('vendorPincode')} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900">Set Password</h2>
                <p className="text-sm text-gray-600 mt-1">Use a strong password (min 8 chars, uppercase, lowercase, number).</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input type="password" value={form.password} onChange={onChange('password')} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                    <input type="password" value={form.confirmPassword} onChange={onChange('confirmPassword')} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Link to="/login/incharge" className="px-4 py-2 rounded-lg border text-gray-700">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventInchargeRegister;


