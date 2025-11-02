import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to manage payment status and payment popup for coaches, institutes, and clubs
 * @returns {Object} Payment status utilities
 */
const usePaymentStatus = () => {
  const { user, refreshUser } = useAuth();
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Check payment status from user profile
  useEffect(() => {
    if (!user) {
      setIsPending(false);
      return;
    }

    // Get payment status based on user role
    let paymentStatus = null;
    
    if (user.role === 'COACH' && user.profile) {
      paymentStatus = user.profile.paymentStatus;
    } else if (user.role === 'INSTITUTE' && user.profile) {
      paymentStatus = user.profile.paymentStatus;
    } else if (user.role === 'CLUB' && user.profile) {
      paymentStatus = user.profile.paymentStatus;
    }

    // Set isPending if payment status is PENDING
    const isPendingStatus = paymentStatus === 'PENDING';
    setIsPending(isPendingStatus);

    // Auto-show popup on mount if payment is pending (optional behavior)
    // Uncomment the next line if you want the popup to show automatically
    // if (isPendingStatus) setShowPaymentPopup(true);
  }, [user]);

  // Manually show payment popup
  const showPaymentPopupManually = useCallback(() => {
    setShowPaymentPopup(true);
  }, []);

  // Dismiss payment popup
  const dismissPaymentPopup = useCallback((refresh = false) => {
    setShowPaymentPopup(false);
    if (refresh) {
      // Refresh user context to get updated payment status
      refreshUser();
    }
  }, [refreshUser]);

  // Handle successful payment
  const onPaymentSuccess = useCallback(async () => {
    setShowPaymentPopup(false);
    // Refresh user context to get updated payment status
    await refreshUser();
    // Update isPending state
    setIsPending(false);
  }, [refreshUser]);

  return {
    isPending,
    showPaymentPopup,
    showPaymentPopupManually,
    dismissPaymentPopup,
    onPaymentSuccess
  };
};

export default usePaymentStatus;
