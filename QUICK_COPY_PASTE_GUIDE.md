# 🚀 Quick Copy-Paste Code Snippets

## For CoachRegisterPremium.jsx / InstituteRegisterPremium.jsx / ClubRegisterPremium.jsx

### 1. Add to imports (top of file)
```javascript
import api from '../api';
```

### 2. Add to state initialization
```javascript
const [formData, setFormData] = useState({
  // ... existing fields ...
  password: '',
  confirmPassword: '',
  payLater: false
});

const [error, setError] = useState('');
```

### 3. Password Fields (Add to Step 1, after phone/DOB fields)
```jsx
{/* Password Fields */}
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
```

### 4. Error Display (Add at top of form content, inside p-8 div)
```jsx
{error && (
  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start space-x-2">
    <span>⚠️</span>
    <span>{error}</span>
  </div>
)}
```

### 5. Pay Later Option (Add in payment step, after special offer box)
```jsx
{/* Pay Later Option */}
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
```

### 6. handleSubmit Function - FOR COACH
```javascript
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
```

### 7. handleSubmit Function - FOR INSTITUTE
```javascript
const handleSubmit = async () => {
  try {
    setError('');
    
    // Validation
    if (!formData.instituteName || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const registrationData = {
      name: formData.instituteName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      address: formData.address,
      website: formData.website,
      sportsOffered: formData.sportsOffered,
      contactPerson: formData.principalName,
      licenseNumber: formData.registrationNumber,
      payLater: formData.payLater
    };

    const response = await api.post('/auth/institute/register', registrationData);

    if (response.data.success) {
      navigate('/verify-otp-premium', {
        state: {
          userId: response.data.data.userId,
          email: formData.email,
          role: 'INSTITUTE',
          name: formData.instituteName,
          payLater: formData.payLater
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    setError(error.response?.data?.message || 'Registration failed. Please try again.');
  }
};
```

### 8. handleSubmit Function - FOR CLUB
```javascript
const handleSubmit = async () => {
  try {
    setError('');
    
    // Validation
    if (!formData.clubName || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const registrationData = {
      name: formData.clubName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      address: formData.address,
      website: formData.website,
      sportsOffered: formData.primarySports,
      contactPerson: formData.presidentName,
      establishedYear: formData.foundedYear,
      payLater: formData.payLater
    };

    const response = await api.post('/auth/club/register', registrationData);

    if (response.data.success) {
      navigate('/verify-otp-premium', {
        state: {
          userId: response.data.data.userId,
          email: formData.email,
          role: 'CLUB',
          name: formData.clubName,
          payLater: formData.payLater
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    setError(error.response?.data?.message || 'Registration failed. Please try again.');
  }
};
```

### 9. Update Final Button Text
```jsx
<button
  onClick={handleSubmit}
  className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
>
  <FaCrown />
  <span>{formData.payLater ? 'Complete Registration' : 'Launch My Profile'}</span>
</button>
```

---

## Router Configuration (App.jsx or routes file)

```javascript
import VerifyOtpPremium from './pages/VerifyOtpPremium';

// Add to routes
<Route path="/verify-otp-premium" element={<VerifyOtpPremium />} />
```

---

## Testing the Flow

### 1. Test Coach Registration:
```
1. Go to /coach/register-premium
2. Fill Step 1 with password
3. Fill Steps 2-3
4. In Step 4, check "Pay Later" checkbox
5. Click "Complete Registration"
6. Should redirect to /verify-otp-premium
7. Check email for OTP
8. Enter OTP
9. Should redirect to /coach/dashboard
```

### 2. Test Payment Restriction:
```
1. Login as coach who selected "Pay Later"
2. Try to add a student
3. Should see error: "Please complete payment..."
4. Try to create an event
5. Should see error: "Please complete payment..."
```

### 3. Test After Payment:
```
1. Complete payment from dashboard
2. Try to add student - should work
3. Try to create event - should work
```

---

## Quick Debug Checklist

- [ ] Is api imported?
- [ ] Is password in formData?
- [ ] Is confirmPassword in formData?
- [ ] Is payLater in formData?
- [ ] Is error state added?
- [ ] Are password fields visible in Step 1?
- [ ] Is "Pay Later" checkbox visible in payment step?
- [ ] Does handleSubmit validate passwords?
- [ ] Does handleSubmit call correct API endpoint?
- [ ] Does handleSubmit navigate with correct role?
- [ ] Is /verify-otp-premium route added?
- [ ] Does backend email service work?

---

**Pro Tip:** Copy each section one at a time, test, then move to the next!
