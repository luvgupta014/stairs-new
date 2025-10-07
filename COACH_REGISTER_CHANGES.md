// COACH REGISTER PREMIUM - KEY CHANGES NEEDED

// 1. ADD TO IMPORTS
import { useState } from 'react'; // if not already there
import api from '../api'; // Import your API instance

// 2. UPDATE formData STATE (add these fields)
const [formData, setFormData] = useState({
  // ... existing fields ...
  
  // ADD THESE NEW FIELDS:
  password: '',
  confirmPassword: '',
  payLater: false
});

// 3. ADD ERROR STATE
const [error, setError] = useState('');

// 4. IN STEP 1 - ADD PASSWORD FIELDS (after dateOfBirth field, around line 282)
// Replace the existing Step 1 content with this updated version:

{currentStep === 1 && (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          First Name *
        </label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Enter your first name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Last Name *
        </label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Enter your last name"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email Address *
      </label>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        placeholder="coach@example.com"
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="+91 9876543210"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date of Birth *
        </label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>
    </div>

    {/* NEW: PASSWORD FIELDS */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password *
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="••••••••"
        />
        <p className="text-xs text-gray-500 mt-1">
          Min. 8 characters with uppercase, lowercase, and number
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password *
        </label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="••••••••"
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>
    </div>
  </div>
)}

// 5. IN STEP 4 - ADD PAY LATER OPTION (after the Launch Special Offer box)
// Add this right before the Navigation Buttons section:

{currentStep === 4 && (
  <div className="space-y-8">
    {/* ... existing plan selection code ... */}
    
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
      <div className="flex items-center space-x-3">
        <FaCrown className="text-yellow-500 text-xl" />
        <div>
          <h4 className="font-semibold text-gray-900">🎉 Launch Special Offer!</h4>
          <p className="text-sm text-gray-600">Get your first month 50% off + 1 month free trial</p>
        </div>
      </div>
    </div>

    {/* NEW: PAY LATER OPTION */}
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      <div className="flex items-start space-x-4">
        <input
          type="checkbox"
          id="payLater"
          checked={formData.payLater}
          onChange={(e) => handleInputChange('payLater', e.target.checked)}
          className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
        />
        <div className="flex-1">
          <label htmlFor="payLater" className="font-semibold text-gray-900 cursor-pointer flex items-center space-x-2">
            <span>💳 Pay Later Option</span>
          </label>
          <p className="text-sm text-gray-600 mt-2">
            Skip payment for now and complete it later from your dashboard. You can start setting up your profile immediately.
          </p>
          <div className="mt-3 bg-orange-50 border-l-4 border-orange-400 p-3 rounded">
            <p className="text-xs text-orange-800 font-medium">
              ⚠️ <strong>Note:</strong> With "Pay Later", some features will be restricted:
            </p>
            <ul className="text-xs text-orange-700 mt-2 space-y-1 ml-4">
              <li>• Cannot add or manage students</li>
              <li>• Cannot create tournaments or events</li>
              <li>• Limited dashboard access</li>
            </ul>
            <p className="text-xs text-orange-800 mt-2">
              Complete payment anytime to unlock all features!
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

// 6. UPDATE THE handleSubmit FUNCTION (replace entire function)
const handleSubmit = async () => {
  try {
    setError('');
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.phone || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Prepare registration data
    const registrationData = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      specialization: formData.sports.join(', ') || 'General Coaching',
      experience: formData.experience || '0-1',
      certifications: formData.certifications,
      bio: formData.trainingStyle,
      location: formData.previousClubs,
      city: '',
      state: '',
      pincode: '',
      payLater: formData.payLater
    };

    console.log('Registering coach:', registrationData);

    // Call API
    const response = await api.post('/auth/coach/register', registrationData);

    if (response.data.success) {
      // Navigate to OTP verification
      navigate('/verify-otp-premium', {
        state: {
          userId: response.data.data.userId,
          email: formData.email,
          role: 'COACH',
          name: `${formData.firstName} ${formData.lastName}`,
          payLater: formData.payLater
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    setError(error.response?.data?.message || 'Registration failed. Please try again.');
  }
};

// 7. ADD ERROR DISPLAY (at the top of the form, inside the p-8 div)
{/* Step Content */}
<div className="p-8">
  {/* NEW: ERROR DISPLAY */}
  {error && (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start space-x-2">
      <span>⚠️</span>
      <span>{error}</span>
    </div>
  )}
  
  {/* Rest of the content ... */}
</div>

// 8. UPDATE THE FINAL BUTTON TEXT
{currentStep === 4 && (
  <button
    onClick={handleSubmit}
    className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
  >
    <FaCrown />
    <span>{formData.payLater ? 'Complete Registration' : 'Launch My Profile'}</span>
  </button>
)}
