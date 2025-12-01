// Payment plans configuration for different user types
export const paymentPlans = {
  coach: {
    defaultPlan: 'coordinator',
    redirectPath: '/dashboard/coach',
    userDisplayName: 'Coach/Coordinator',
    plans: [
      {
        id: 'coordinator',
        name: 'Coordinator Plan',
        price: 2,
        originalPrice: 2,
        duration: 'month',
        popular: true,
        features: [
          'Unlimited students',
          'Unlimited events',
          'Advanced analytics',
          'Priority support',
          'Mobile app access',
          'Bulk student import',
          'Custom branding',
          'Payment processing',
          'Event management',
          'Student registration',
          'Performance tracking',
          'Certificate generation'
        ],
        notIncluded: []
      }
    ]
  },
  
  club: {
    defaultPlan: 'standard',
    redirectPath: '/dashboard/club',
    userDisplayName: 'Club',
    plans: [
      {
        id: 'standard',
        name: 'Standard Plan',
        price: 2999,
        originalPrice: 4499,
        duration: 'month',
        popular: true,
        features: [
          'Up to 200 members',
          'Event management',
          'Member analytics',
          'Priority support',
          'Mobile app access',
          'Bulk member import',
          'Custom branding',
          'Payment processing',
          'Club dashboard'
        ],
        notIncluded: [
          'White-label solution',
          'API access'
        ]
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 4999,
        originalPrice: 7499,
        duration: 'month',
        popular: false,
        features: [
          'Up to 500 members',
          'Advanced event management',
          'Advanced analytics',
          'Priority support',
          'Mobile app access',
          'Bulk member import',
          'Custom branding',
          'Payment processing',
          'Club dashboard',
          'White-label solution',
          'API access'
        ],
        notIncluded: []
      }
    ]
  },
  
  institute: {
    defaultPlan: 'standard',
    redirectPath: '/dashboard/institute',
    userDisplayName: 'Institute',
    plans: [
      {
        id: 'standard',
        name: 'Standard Plan',
        price: 4999,
        originalPrice: 7499,
        duration: 'month',
        popular: true,
        features: [
          'Up to 500 students',
          'Unlimited coaches',
          'Advanced analytics',
          'Priority support',
          'Mobile app access',
          'Bulk student import',
          'Custom branding',
          'Payment processing',
          'Institute dashboard'
        ],
        notIncluded: [
          'White-label solution',
          'API access'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price: 7999,
        originalPrice: 11999,
        duration: 'month',
        popular: false,
        features: [
          'Unlimited students',
          'Unlimited coaches',
          'Advanced analytics',
          'Priority support',
          'Mobile app access',
          'Bulk student import',
          'Custom branding',
          'Payment processing',
          'Institute dashboard',
          'White-label solution',
          'API access',
          'Dedicated account manager'
        ],
        notIncluded: []
      }
    ]
  },
  
  student: {
    defaultPlan: 'basic',
    redirectPath: '/dashboard/student',
    userDisplayName: 'Student',
    plans: [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 299,
        originalPrice: 499,
        duration: 'month',
        popular: false,
        features: [
          'Event registration',
          'Basic profile',
          'Mobile app access',
          'Email support'
        ],
        notIncluded: [
          'Priority support',
          'Advanced analytics',
          'Custom achievements'
        ]
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 599,
        originalPrice: 899,
        duration: 'month',
        popular: true,
        features: [
          'Unlimited event registration',
          'Advanced profile',
          'Performance analytics',
          'Priority support',
          'Mobile app access',
          'Custom achievements',
          'Coach connections'
        ],
        notIncluded: []
      }
    ]
  }
};

// Get plans for a specific user type
export const getPlansForUserType = (userType) => {
  return paymentPlans[userType] || paymentPlans.student;
};

// Get user type display name
export const getUserTypeDisplayName = (userType) => {
  const displayNames = {
    coach: 'Coach',
    club: 'Club',
    institute: 'Institute',
    student: 'Student'
  };
  return displayNames[userType] || 'User';
};