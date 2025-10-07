# Frontend Registration Updates - Implementation Guide

## Changes Required for Coach/Institute/Club Premium Registration Pages

### Common Changes for All Three Pages:

#### 1. Add Password Field (Step 1)
Add password and confirm password fields in the first step of each registration.

#### 2. Add Pay Later Option (Step 4/5 - Payment Step)
Add a toggle or checkbox for "Pay Later" option below the plan selection.

#### 3. Handle OTP Verification
After successful registration, redirect to `/verify-otp-premium` with userId, email, role, and name.

#### 4. API Integration
Call the appropriate `/auth/{role}/register` endpoint with all form data including password and payLater flag.

---

## Implementation Details:

### For: CoachRegisterPremium.jsx

**Step 1 - Add Password Fields (after phone field):**
```jsx
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
    <p className="text-xs text-gray-500 mt-1">Min. 8 characters, uppercase, lowercase, number</p>
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
  </div>
</div>
```

**Step 4 - Add Pay Later Option (after plans):**
```jsx
{/* Pay Later Option */}
<div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
  <div className="flex items-start space-x-3">
    <input
      type="checkbox"
      id="payLater"
      checked={formData.payLater}
      onChange={(e) => handleInputChange('payLater', e.target.checked)}
      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <div className="flex-1">
      <label htmlFor="payLater" className="font-semibold text-gray-900 cursor-pointer">
        💳 Pay Later
      </label>
      <p className="text-sm text-gray-600 mt-1">
        Skip payment for now and complete it later. Note: Some features will be restricted until payment is completed.
      </p>
      <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
        ⚠️ With "Pay Later", you won't be able to add students or create events until payment is completed.
      </div>
    </div>
  </div>
</div>
```

**Update formData initial state:**
```jsx
const [formData, setFormData] = useState({
  // ... existing fields
  password: '',
  confirmPassword: '',
  payLater: false
});
```

**Update handleSubmit:**
```jsx
const handleSubmit = async () => {
  try {
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const registrationData = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      specialization: formData.sports.join(', '),
      experience: formData.experience,
      certifications: formData.certifications,
      bio: formData.trainingStyle,
      location: formData.previousClubs,
      payLater: formData.payLater
    };

    const response = await api.post('/auth/coach/register', registrationData);

    if (response.data.success) {
      // Navigate to OTP verification
      navigate('/verify-otp-premium', {
        state: {
          userId: response.data.data.userId,
          email: formData.email,
          role: 'COACH',
          name: `${formData.firstName} ${formData.lastName}`
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    setError(error.response?.data?.message || 'Registration failed');
  }
};
```

---

### For: InstituteRegisterPremium.jsx

**Similar Changes:**
1. Add password fields in Step 1
2. Add payLater checkbox in Step 5 (payment step)
3. Update formData to include password, confirmPassword, payLater
4. Update handleSubmit to call `/auth/institute/register`
5. Navigate to `/verify-otp-premium` with role='INSTITUTE'

---

### For: ClubRegisterPremium.jsx

**Similar Changes:**
1. Add password fields in Step 1  
2. Add payLater checkbox in Step 4 (payment step)
3. Update formData to include password, confirmPassword, payLater
4. Update handleSubmit to call `/auth/club/register`
5. Navigate to `/verify-otp-premium` with role='CLUB'

---

## Route Configuration

Add to your router configuration:
```jsx
import VerifyOtpPremium from './pages/VerifyOtpPremium';

// Add route
<Route path="/verify-otp-premium" element={<VerifyOtpPremium />} />
```

---

## Backend Changes Summary (Already Implemented):

✅ Coach registration now sends OTP via email
✅ Institute registration now sends OTP via email
✅ Club registration now sends OTP via email
✅ All registrations support password field
✅ All registrations support payLater flag
✅ Coach routes check payment status before allowing student/event creation
✅ Payment status PENDING restricts coach features
✅ OTP verification activates user account

---

## Testing Checklist:

- [ ] Coach registration with password works
- [ ] Institute registration with password works
- [ ] Club registration with password works
- [ ] OTP email is received
- [ ] OTP verification redirects to correct dashboard
- [ ] "Pay Later" option is saved correctly
- [ ] Coach with PENDING payment cannot add students
- [ ] Coach with PENDING payment cannot create events
- [ ] After payment, coach can access all features
- [ ] Resend OTP functionality works
- [ ] Password validation works (8+ chars, uppercase, lowercase, number)
