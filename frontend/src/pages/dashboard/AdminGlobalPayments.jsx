import React, { useEffect, useState } from 'react';
import { getGlobalPaymentSettings, updateGlobalPaymentSettings } from '../../api';
import Spinner from '../../components/Spinner';

const AdminGlobalPayments = () => {
  const [form, setForm] = useState({
    perStudentBaseCharge: '',
    defaultEventFee: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await getGlobalPaymentSettings();
      if (res?.success) {
        const data = res.data || {};
        setForm({
          perStudentBaseCharge: data.perStudentBaseCharge ?? '',
          defaultEventFee: data.defaultEventFee ?? ''
        });
      }
    } catch (err) {
      console.error('Failed to load global payment settings:', err);
      setError(err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      setError('');
      const payload = {
        perStudentBaseCharge: Number(form.perStudentBaseCharge) || 0,
        defaultEventFee: Number(form.defaultEventFee) || 0
      };
      const res = await updateGlobalPaymentSettings(payload);
      if (res?.success) {
        setMessage('Global payment settings saved.');
      } else {
        setError(res?.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Failed to save global payment settings:', err);
      setError(err?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Global Payment Settings</h1>
        <p className="text-sm text-gray-600 mb-6">
          Set the default per-student base charge and default event fee used when an event uses GLOBAL fee mode.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Per-Student Base Charge (₹)
            </label>
            <input
              type="number"
              name="perStudentBaseCharge"
              value={form.perStudentBaseCharge}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Event Fee (₹) — fallback when participant count is zero or base charge not applicable
            </label>
            <input
              type="number"
              name="defaultEventFee"
              value={form.defaultEventFee}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex items-center space-x-3 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {message && <span className="text-green-600 text-sm">{message}</span>}
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminGlobalPayments;

