import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const StudentRegister = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    aadhaar: '',
    gender: '',
    dateOfBirth: '',
    state: '',
    district: '',
    address: '',
    pincode: '',
    mobileNumber: '',
    emailId: '',
    game: '',
    game2: '',
    game3: '',
    school: '',
    club: '',
    coachName: '',
    coachMobile: '',
    password: '',
    confirmPassword: '',
    level: 'BEGINNER'
  });

  const totalSteps = 5;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setApiError('');
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.fullName || !formData.fatherName || !formData.aadhaar || !formData.gender || !formData.dateOfBirth) {
          setModalMessage('Please fill in all personal information fields.');
          setShowModal(true);
          return false;
        }
        break;
      case 2:
        if (!formData.state || !formData.district || !formData.address || !formData.pincode) {
          setModalMessage('Please fill in all location details.');
          setShowModal(true);
          return false;
        }
        break;
      case 3:
        if (!formData.mobileNumber || !formData.emailId) {
          setModalMessage('Please provide your contact information.');
          setShowModal(true);
          return false;
        }
        break;
      case 4:
        if (!formData.game || !formData.school) {
          setModalMessage('Please fill in your sports and training information.');
          setShowModal(true);
          return false;
        }
        break;
      case 5:
        if (!formData.password || formData.password !== formData.confirmPassword) {
          setModalMessage('Please set up your password correctly.');
          setShowModal(true);
          return false;
        }
        if (formData.password.length < 6) {
          setModalMessage('Password must be at least 6 characters long.');
          setShowModal(true);
          return false;
        }
        break;
    }
    return true;
  };

  const getStepTitle = () => {
    const titles = {
      1: "Let's Get to Know You! 🌟",
      2: "Tell Us Where You're From 📍",
      3: "How Can We Reach You? 📱",
      4: "Your Athletic Journey 🏃‍♀️",
      5: "Secure Your Account 🔒"
    };
    return titles[currentStep];
  };

  const getStepSubtitle = () => {
    const subtitles = {
      1: "Welcome, future champion! Let's start with your basic information.",
      2: "Help us understand your location for better local opportunities.",
      3: "Your contact info helps us keep you updated on exciting events!",
      4: "Time to showcase your sporting talents and interests!",
      5: "Almost there! Create a secure password to protect your profile."
    };
    return subtitles[currentStep];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) return;

    const studentData = {
      name: formData.fullName,
      fatherName: formData.fatherName,
      aadhaar: formData.aadhaar,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      state: formData.state,
      district: formData.district,
      address: formData.address,
      pincode: formData.pincode,
      phone: formData.mobileNumber,
      email: formData.emailId,
      sport: formData.game,
      sport2: formData.game2 || null,
      sport3: formData.game3 || null,
      school: formData.school,
      club: formData.club || null,
      coachName: formData.coachName || null,
      coachMobile: formData.coachMobile || null,
      level: formData.level,
      password: formData.password
    };

    const result = await register(studentData, 'student');
    
    if (result.success) {
      setApiError('');
      setModalMessage('🎉 Registration successful! Please check your email for the OTP.');
      setShowModal(true);
      setTimeout(() => {
        navigate('/verify-otp', { 
          state: { 
            userId: result.data.userId,
            email: formData.emailId,
            role: 'student'
          } 
        });
      }, 2000);
    } else {
      setApiError(result.message || 'Registration failed. Please try again.');
    }
  };

  const sports = [
    'Football', 'Cricket', 'Basketball', 'Volleyball', 'Tennis', 'Badminton',
    'Athletics', 'Swimming', 'Wrestling', 'Boxing', 'Hockey', 'Table Tennis',
    'Kabaddi', 'Chess', 'Carrom', 'Weightlifting', 'Gymnastics', 'Other'
  ];

  const levels = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'PROFESSIONAL', label: 'Professional' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">👋</div>
              <p className="text-gray-600">Tell us about yourself so we can personalize your experience!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Father's Name *
                </label>
                <input
                  name="fatherName"
                  type="text"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your father's name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhaar Number *
                </label>
                <input
                  name="aadhaar"
                  type="text"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your Aadhaar number"
                  maxLength="12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🏠</div>
              <p className="text-gray-600">Where are you located? This helps us find opportunities near you!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select State...</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Delhi">Delhi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District *
                </label>
                <input
                  name="district"
                  type="text"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your district"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your complete address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pin Code *
              </label>
              <input
                name="pincode"
                type="text"
                value={formData.pincode}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your pin code"
                maxLength="6"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📞</div>
              <p className="text-gray-600">How can we reach you with exciting opportunities and updates?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <input
                name="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your mobile number"
                maxLength="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email ID *
              </label>
              <input
                name="emailId"
                type="email"
                value={formData.emailId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email address"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-blue-500 text-xl">💡</div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Why do we need this?</h4>
                  <p className="text-sm text-blue-700">
                    We'll use your contact information to send you notifications about:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Tournament registrations in your area</li>
                    <li>• Training opportunities and coaching sessions</li>
                    <li>• Important updates about your athletic journey</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-gray-600">Time to shine! Tell us about your sports and training background.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Sport *
                </label>
                <select
                  name="game"
                  value={formData.game}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select your main sport...</option>
                  {sports.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {levels.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Sport (Optional)
                </label>
                <select
                  name="game2"
                  value={formData.game2}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Choose another sport...</option>
                  {sports.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Third Sport (Optional)
                </label>
                <select
                  name="game3"
                  value={formData.game3}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Choose another sport...</option>
                  {sports.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School/College *
              </label>
              <input
                name="school"
                type="text"
                value={formData.school}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your school or college name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Club (Optional)
                </label>
                <input
                  name="club"
                  type="text"
                  value={formData.club}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your club name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coach Name (Optional)
                </label>
                <input
                  name="coachName"
                  type="text"
                  value={formData.coachName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your coach's name"
                />
              </div>
            </div>

            {formData.coachName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coach Mobile (Optional)
                </label>
                <input
                  name="coachMobile"
                  type="tel"
                  value={formData.coachMobile}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your coach's mobile number"
                  maxLength="10"
                />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-slide-in-right">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔐</div>
              <p className="text-gray-600">Almost done! Create a secure password to protect your athletic profile.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Create a strong password"
              />
              <p className="text-sm text-gray-500 mt-1">
                At least 6 characters with a mix of letters and numbers
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Confirm your password"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="text-green-500 text-2xl">🎉</div>
                <div>
                  <h4 className="font-bold text-green-900 mb-2">You're Almost There!</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Once you complete registration, you'll get access to:
                  </p>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Personalized athlete dashboard</li>
                    <li>• Local tournament notifications</li>
                    <li>• Training opportunities in your area</li>
                    <li>• Connect with coaches and other athletes</li>
                    <li>• Track your athletic progress</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🌟 Join STAIRS as an Athlete! 🏆
          </h1>
          <p className="text-gray-600 text-lg">Your journey to athletic excellence starts here</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Step Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">{getStepTitle()}</h2>
              <p className="text-blue-100">{getStepSubtitle()}</p>
            </div>

            {/* Form Content */}
            <div className="p-8">
              {/* Show API error if exists */}
              {apiError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start space-x-2">
                  <span>⚠️</span>
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
                {/* Step Content */}
                <div className="min-h-[400px]">
                  {renderStepContent()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-8 border-t mt-8">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>←</span>
                      <span>Previous</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {currentStep < totalSteps ? (
                    <button
                      type="submit"
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
                    >
                      <span>Continue</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>🚀</span>
                          <span>Launch My Profile!</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

              {/* Login Link */}
              {currentStep === 1 && (
                <div className="text-center mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login/student" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                      Login here
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Registration Status"
          message={modalMessage}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StudentRegister;