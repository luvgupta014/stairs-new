import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePaymentStatus = () => {
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPaymentStatus();
  }, [user]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setPaymentStatus(null);
        setShowPaymentPopup(false);
        return;
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setPaymentStatus(null);
        setShowPaymentPopup(false);
        return;
      }

      // Skip payment check for admin users
      if (user.role === 'ADMIN') {
        setPaymentStatus('SUCCESS');
        setShowPaymentPopup(false);
        return;
      }

      // Skip for demo users
      if (authToken && authToken.startsWith('demo-token-')) {
        setPaymentStatus('SUCCESS');
        setShowPaymentPopup(false);
        return;
      }

      let apiEndpoint;
      switch (user.role) {
        case 'COACH':
          apiEndpoint = '/api/coach/dashboard';
          break;
        case 'STUDENT':
          apiEndpoint = '/api/student/dashboard';
          break;
        case 'INSTITUTE':
          apiEndpoint = '/api/institute/dashboard';
          break;
        case 'CLUB':
          apiEndpoint = '/api/club/dashboard';
          break;
        default:
          setPaymentStatus('SUCCESS');
          setShowPaymentPopup(false);
          return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${apiEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          let userProfile = null;
          let currentPaymentStatus = 'SUCCESS'; // Default for students

          switch (user.role) {
            case 'COACH':
              userProfile = data.data.coach;
              currentPaymentStatus = userProfile?.paymentStatus || 'PENDING';
              break;
            case 'STUDENT':
              userProfile = data.data.student;
              currentPaymentStatus = userProfile?.paymentStatus || 'SUCCESS';
              break;
            case 'INSTITUTE':
              userProfile = data.data.institute;
              currentPaymentStatus = userProfile?.paymentStatus || 'PENDING';
              break;
            case 'CLUB':
              userProfile = data.data.club;
              currentPaymentStatus = userProfile?.paymentStatus || 'PENDING';
              break;
          }

          setPaymentStatus(currentPaymentStatus);

          // Show popup if payment is pending and not already dismissed
          const popupDismissed = localStorage.getItem(`paymentPopupDismissed_${user.id}`);
          const shouldShowPopup = currentPaymentStatus === 'PENDING' && 
                                  !userProfile?.isActive && 
                                  !popupDismissed;

          setShowPaymentPopup(shouldShowPopup);
        }
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
      setPaymentStatus(null);
      setShowPaymentPopup(false);
    } finally {
      setLoading(false);
    }
  };

  const dismissPaymentPopup = (permanent = false) => {
    setShowPaymentPopup(false);
    if (permanent) {
      localStorage.setItem(`paymentPopupDismissed_${user?.id}`, 'true');
    }
  };

  const showPaymentPopupManually = () => {
    setShowPaymentPopup(true);
  };

  const onPaymentSuccess = (paymentData) => {
    setPaymentStatus('SUCCESS');
    setShowPaymentPopup(false);
    // Remove dismissal flag so popup can show again if needed
    if (user?.id) {
      localStorage.removeItem(`paymentPopupDismissed_${user.id}`);
    }
  };

  const isPending = paymentStatus === 'PENDING';
  const isSuccess = paymentStatus === 'SUCCESS';

  return {
    paymentStatus,
    isPending,
    isSuccess,
    loading,
    showPaymentPopup,
    dismissPaymentPopup,
    showPaymentPopupManually,
    onPaymentSuccess,
    checkPaymentStatus
  };
};

export default usePaymentStatus;