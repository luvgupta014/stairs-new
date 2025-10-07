import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaUserTie, 
  FaTrophy, 
  FaCrown, 
  FaCheck, 
  FaArrowRight, 
  FaArrowLeft,
  FaCalendarAlt,
  FaMedal,
  FaHandshake,
  FaChartLine
} from 'react-icons/fa';

const ClubRegisterPremium = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Club Info
    clubName: '',
    email: '',
    phone: '',
    website: '',
    foundedYear: '',
    clubType: '',
    
    // Step 2: Management
    presidentName: '',
    presidentContact: '',
    secretaryName: '',
    secretaryContact: '',
    coachName: '',
    coachExperience: '',
    
    // Step 3: Activities & Sports
    primarySports: [],
    competitions: [],
    membershipLevels: [],
    facilities: '',
    
    // Step 4: Payment
    plan: 'premium',
    paymentMethod: 'card'
  });
  
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      title: 'Club Information',
      subtitle: 'Tell us about your club',
      icon: FaUsers,
      color: 'indigo'
    },
    {
      id: 2,
      title: 'Management Team',
      subtitle: 'Who runs the club',
      icon: FaUserTie,
      color: 'blue'
    },
    {
      id: 3,
      title: 'Activities & Sports',
      subtitle: 'What you offer',
      icon: FaTrophy,
      color: 'purple'
    },
    {
      id: 4,
      title: 'Launch Club',
      subtitle: 'Choose your plan',
      icon: FaCrown,
      color: 'gold'
    }
  ];

  const clubTypes = [
    'Sports Club', 'Athletic Club', 'Recreation Club', 'Community Club',
    'Professional Club', 'Youth Club', 'Multi-Sport Club', 'Elite Club'
  ];

  const sportsOptions = [
    'Football', 'Basketball', 'Cricket', 'Tennis', 'Swimming', 
    'Badminton', 'Hockey', 'Athletics', 'Volleyball', 'Boxing',
    'Table Tennis', 'Wrestling', 'Archery', 'Gymnastics', 'Golf',
    'Cycling', 'Marathon', 'Martial Arts'
  ];

  const competitionTypes = [
    'Local Tournaments', 'State Championships', 'National Competitions',
    'International Events', 'Youth Leagues', 'Professional Circuits',
    'Corporate Tournaments', 'Charity Events'
  ];

  const membershipOptions = [
    'Junior Members (Under 18)', 'Senior Members (18+)', 'Premium Members',
    'Life Members', 'Corporate Members', 'Honorary Members'
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
    console.log('Club registration:', formData);
    navigate('/login/club');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl text-gray-900">STAIRS</span>
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
              Club
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="hidden lg:flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.id 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? <FaCheck /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate('/login/club')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Already registered?
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Step Header */}
              <div className={`bg-gradient-to-r ${
                currentStep === 1 ? 'from-indigo-500 to-indigo-600' :
                currentStep === 2 ? 'from-blue-500 to-blue-600' :
                currentStep === 3 ? 'from-purple-500 to-purple-600' :
                'from-yellow-400 to-orange-500'
              } p-8 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      {React.createElement(steps[currentStep - 1].icon, { className: "w-8 h-8" })}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{steps[currentStep - 1].title}</h2>
                      <p className="text-lg opacity-90">{steps[currentStep - 1].subtitle}</p>
                    </div>
                  </div>
                  
                  <div className="text-right hidden md:block">
                    <div className="text-sm opacity-75">Step {currentStep} of {steps.length}</div>
                    <div className="text-lg font-semibold">{Math.round((currentStep / steps.length) * 100)}% Complete</div>
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <div className="p-8">
                {/* Step 1: Club Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Club Name *
                      </label>
                      <input
                        type="text"
                        value={formData.clubName}
                        onChange={(e) => handleInputChange('clubName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Champions Sports Club"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Official Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="info@championsclub.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website/Social Media
                        </label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="https://www.championsclub.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Founded Year *
                        </label>
                        <input
                          type="number"
                          value={formData.foundedYear}
                          onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="2015"
                          min="1900"
                          max="2024"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Club Type *
                      </label>
                      <select
                        value={formData.clubType}
                        onChange={(e) => handleInputChange('clubType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      >
                        <option value="">Select Club Type</option>
                        {clubTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h3 className="font-semibold text-indigo-800 mb-2">🏆 Welcome to STAIRS Club Network</h3>
                      <p className="text-sm text-indigo-700">
                        Join India's premier sports club management platform and connect with athletes, coaches, and other clubs nationwide.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Management Team */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-2">👥 Management Team</h3>
                      <p className="text-sm text-blue-700">
                        Provide details of key management members who will have administrative access.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          President Name *
                        </label>
                        <input
                          type="text"
                          value={formData.presidentName}
                          onChange={(e) => handleInputChange('presidentName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Rajesh Kumar"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          President Contact *
                        </label>
                        <input
                          type="tel"
                          value={formData.presidentContact}
                          onChange={(e) => handleInputChange('presidentContact', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secretary Name *
                        </label>
                        <input
                          type="text"
                          value={formData.secretaryName}
                          onChange={(e) => handleInputChange('secretaryName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Priya Sharma"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secretary Contact
                        </label>
                        <input
                          type="tel"
                          value={formData.secretaryContact}
                          onChange={(e) => handleInputChange('secretaryContact', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Head Coach Information</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Head Coach Name
                          </label>
                          <input
                            type="text"
                            value={formData.coachName}
                            onChange={(e) => handleInputChange('coachName', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Suresh Raina"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Coaching Experience (Years)
                          </label>
                          <select
                            value={formData.coachExperience}
                            onChange={(e) => handleInputChange('coachExperience', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="">Select Experience</option>
                            <option value="1-3">1-3 years</option>
                            <option value="3-5">3-5 years</option>
                            <option value="5-10">5-10 years</option>
                            <option value="10-15">10-15 years</option>
                            <option value="15+">15+ years</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Activities & Sports */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Primary Sports * (Select all that apply)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {sportsOptions.map(sport => (
                          <button
                            key={sport}
                            type="button"
                            onClick={() => handleArrayToggle('primarySports', sport)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              formData.primarySports.includes(sport)
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
                        Competition Types * (Select all that apply)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {competitionTypes.map(comp => (
                          <button
                            key={comp}
                            type="button"
                            onClick={() => handleArrayToggle('competitions', comp)}
                            className={`p-4 rounded-lg border-2 text-sm font-medium transition-all flex items-center space-x-2 ${
                              formData.competitions.includes(comp)
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700'
                            }`}
                          >
                            <FaMedal className="text-lg" />
                            <span>{comp}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Membership Levels * (Select all that apply)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {membershipOptions.map(membership => (
                          <button
                            key={membership}
                            type="button"
                            onClick={() => handleArrayToggle('membershipLevels', membership)}
                            className={`p-4 rounded-lg border-2 text-sm font-medium transition-all flex items-center space-x-2 ${
                              formData.membershipLevels.includes(membership)
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300 text-gray-700'
                            }`}
                          >
                            <FaUsers className="text-lg" />
                            <span>{membership}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Club Facilities & Amenities
                      </label>
                      <textarea
                        value={formData.facilities}
                        onChange={(e) => handleInputChange('facilities', e.target.value)}
                        rows="4"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder="Describe your club facilities, equipment, changing rooms, parking, cafeteria, etc."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <FaCalendarAlt className="mx-auto text-2xl text-purple-600 mb-2" />
                        <h4 className="font-semibold text-purple-800">Event Management</h4>
                        <p className="text-sm text-purple-700">Organize tournaments and events</p>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <FaHandshake className="mx-auto text-2xl text-purple-600 mb-2" />
                        <h4 className="font-semibold text-purple-800">Member Portal</h4>
                        <p className="text-sm text-purple-700">Connect and engage members</p>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <FaChartLine className="mx-auto text-2xl text-purple-600 mb-2" />
                        <h4 className="font-semibold text-purple-800">Analytics</h4>
                        <p className="text-sm text-purple-700">Track performance and growth</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Payment & Launch */}
                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Club Plan</h3>
                      <p className="text-gray-600">Empower your sports club with modern technology</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Standard Plan */}
                      <div className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${
                        formData.plan === 'standard' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('plan', 'standard')}>
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-gray-900">Standard</h4>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">₹2,499</span>
                            <span className="text-gray-500">/month</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li>• Up to 200 members</li>
                            <li>• Basic member management</li>
                            <li>• Event scheduling</li>
                            <li>• Payment collection</li>
                            <li>• Email support</li>
                          </ul>
                        </div>
                      </div>

                      {/* Premium Plan */}
                      <div className={`rounded-xl border-2 p-6 cursor-pointer transition-all relative ${
                        formData.plan === 'premium' 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('plan', 'premium')}>
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Recommended
                          </span>
                        </div>
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-gray-900">Premium</h4>
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-gray-900">₹4,999</span>
                            <span className="text-gray-500">/month</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li>• Up to 1000 members</li>
                            <li>• Advanced analytics</li>
                            <li>• Tournament management</li>
                            <li>• Member portal</li>
                            <li>• Priority support</li>
                            <li>• Coach collaboration</li>
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
                            <span className="text-3xl font-bold text-gray-900">₹9,999</span>
                            <span className="text-gray-500">/month</span>
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-gray-600">
                            <li>• Unlimited members</li>
                            <li>• Custom branding</li>
                            <li>• Multi-location support</li>
                            <li>• API integration</li>
                            <li>• 24/7 support</li>
                            <li>• Dedicated manager</li>
                            <li>• Performance tracking</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                      <div className="flex items-center space-x-3">
                        <FaCrown className="text-indigo-500 text-xl" />
                        <div>
                          <h4 className="font-semibold text-gray-900">🚀 Club Launch Special!</h4>
                          <p className="text-sm text-gray-600">Get 2 months free + premium onboarding support</p>
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
                      className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
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
                      <span>Launch Club</span>
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

export default ClubRegisterPremium;