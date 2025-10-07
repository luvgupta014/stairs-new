import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBriefcase, FaStar, FaCrown, FaCheck, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const CoachRegisterPremium = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    
    // Step 2: Professional Details
    experience: '',
    education: '',
    certifications: '',
    previousClubs: '',
    
    // Step 3: Specialization
    sports: [],
    ageGroups: [],
    skillLevel: [],
    trainingStyle: '',
    achievements: '',
    
    // Step 4: Payment
    plan: 'professional',
    paymentMethod: 'card'
  });
  
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      title: 'Personal Information',
      subtitle: 'Tell us about yourself',
      icon: FaUser,
      color: 'blue'
    },
    {
      id: 2,
      title: 'Professional Background',
      subtitle: 'Your coaching experience',
      icon: FaBriefcase,
      color: 'green'
    },
    {
      id: 3,
      title: 'Specialization',
      subtitle: 'What makes you unique',
      icon: FaStar,
      color: 'purple'
    },
    {
      id: 4,
      title: 'Launch Your Profile',
      subtitle: 'Choose your plan',
      icon: FaCrown,
      color: 'gold'
    }
  ];

  const sportsOptions = [
    'Football', 'Basketball', 'Cricket', 'Tennis', 'Swimming', 
    'Badminton', 'Hockey', 'Athletics', 'Volleyball', 'Boxing'
  ];

  const ageGroupOptions = [
    'Under 8', '8-12 years', '13-16 years', '17-21 years', 'Adults (21+)', 'Seniors (40+)'
  ];

  const skillLevelOptions = [
    'Beginner', 'Intermediate', 'Advanced', 'Professional', 'Elite'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Handle registration logic here
    console.log('Coach registration:', formData);
    navigate('/login/coach');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl text-gray-900">STAIRS</span>
          </div>
          
          {/* Progress Bar */}
          <div className="hidden md:flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? <FaCheck /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate('/login/coach')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Already have an account?
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Step Header */}
              <div className={`bg-gradient-to-r ${
                currentStep === 1 ? 'from-blue-500 to-blue-600' :
                currentStep === 2 ? 'from-green-500 to-green-600' :
                currentStep === 3 ? 'from-purple-500 to-purple-600' :
                'from-yellow-400 to-orange-500'
              } p-8 text-white`}>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    {React.createElement(steps[currentStep - 1].icon, { className: "w-8 h-8" })}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{steps[currentStep - 1].title}</h2>
                    <p className="text-lg opacity-90">{steps[currentStep - 1].subtitle}</p>
                  </div>
                </div>
                
                {/* Mobile Progress */}
                <div className="md:hidden mt-6">
                  <div className="flex justify-between text-sm opacity-75 mb-2">
                    <span>Step {currentStep} of {steps.length}</span>
                    <span>{Math.round((currentStep / steps.length) * 100)}% Complete</span>
                  </div>
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <div className="p-8">
                {/* Step 1: Personal Information */}
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
                  </div>
                )}

                {/* Step 2: Professional Background */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Years of Experience *
                      </label>
                      <select
                        value={formData.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Select experience level</option>
                        <option value="0-1">0-1 years</option>
                        <option value="2-5">2-5 years</option>
                        <option value="6-10">6-10 years</option>
                        <option value="11-15">11-15 years</option>
                        <option value="15+">15+ years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education Background *
                      </label>
                      <textarea
                        value={formData.education}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="Degree in Sports Science, Physical Education, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certifications & Licenses
                      </label>
                      <textarea
                        value={formData.certifications}
                        onChange={(e) => handleInputChange('certifications', e.target.value)}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="FIFA License, AIFF Certification, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Previous Clubs/Organizations
                      </label>
                      <textarea
                        value={formData.previousClubs}
                        onChange={(e) => handleInputChange('previousClubs', e.target.value)}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="List your previous coaching positions..."
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Specialization */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Sports You Coach * (Select all that apply)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {sportsOptions.map(sport => (
                          <button
                            key={sport}
                            type="button"
                            onClick={() => handleArrayToggle('sports', sport)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              formData.sports.includes(sport)
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700'
                            }`}
                          >
                            {sport}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Age Groups You Train *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {ageGroupOptions.map(age => (
                          <button
                            key={age}
                            type="button"
                            onClick={() => handleArrayToggle('ageGroups', age)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              formData.ageGroups.includes(age)
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700'
                            }`}
                          >
                            {age}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Skill Levels You Handle *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {skillLevelOptions.map(level => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleArrayToggle('skillLevel', level)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              formData.skillLevel.includes(level)
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Training Philosophy & Style
                      </label>
                      <textarea
                        value={formData.trainingStyle}
                        onChange={(e) => handleInputChange('trainingStyle', e.target.value)}
                        rows="4"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder="Describe your coaching philosophy, methods, and what makes your training unique..."
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Payment & Launch */}
                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
                      <p className="text-gray-600">Start building your coaching empire today</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Basic Plan */}
                      <div className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${
                        formData.plan === 'basic' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('plan', 'basic')}>
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-gray-900">Basic</h4>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">₹999</span>
                            <span className="text-gray-500">/month</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li>• Up to 50 students</li>
                            <li>• Basic analytics</li>
                            <li>• Email support</li>
                            <li>• Mobile app access</li>
                          </ul>
                        </div>
                      </div>

                      {/* Professional Plan */}
                      <div className={`rounded-xl border-2 p-6 cursor-pointer transition-all relative ${
                        formData.plan === 'professional' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('plan', 'professional')}>
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Most Popular
                          </span>
                        </div>
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-gray-900">Professional</h4>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">₹1,999</span>
                            <span className="text-gray-500">/month</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li>• Up to 200 students</li>
                            <li>• Advanced analytics</li>
                            <li>• Priority support</li>
                            <li>• Payment processing</li>
                            <li>• Event management</li>
                          </ul>
                        </div>
                      </div>

                      {/* Elite Plan */}
                      <div className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${
                        formData.plan === 'elite' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('plan', 'elite')}>
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-gray-900">Elite</h4>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">₹3,999</span>
                            <span className="text-gray-500">/month</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li>• Unlimited students</li>
                            <li>• Premium analytics</li>
                            <li>• 24/7 support</li>
                            <li>• White-label solution</li>
                            <li>• API access</li>
                            <li>• Custom branding</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                      <div className="flex items-center space-x-3">
                        <FaCrown className="text-yellow-500 text-xl" />
                        <div>
                          <h4 className="font-semibold text-gray-900">🎉 Launch Special Offer!</h4>
                          <p className="text-sm text-gray-600">Get your first month 50% off + 1 month free trial</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      currentStep === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <FaArrowLeft />
                    <span>Previous</span>
                  </button>

                  {currentStep < 4 ? (
                    <button
                      onClick={nextStep}
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                    >
                      <span>Continue</span>
                      <FaArrowRight />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
                    >
                      <FaCrown />
                      <span>Launch My Profile</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CoachRegisterPremium;