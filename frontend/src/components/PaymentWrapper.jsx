import { useEffect } from 'react';
import PaymentPopup from './PaymentPopup';
import usePaymentStatus from '../hooks/usePaymentStatus';
import { useAuth } from '../contexts/AuthContext';

const PaymentWrapper = ({ children }) => {
  const { user } = useAuth();
  const {
    showPaymentPopup,
    dismissPaymentPopup,
    onPaymentSuccess
  } = usePaymentStatus();

  // Only show for coach users
  const shouldShowForUser = user && user.role === 'COACH';

  if (!shouldShowForUser) {
    return children;
  }

  return (
    <>
      {children}
      
      {/* Global Payment Popup for Coaches */}
      <PaymentPopup
        isOpen={showPaymentPopup}
        onClose={() => dismissPaymentPopup(false)}
        userType="coach"
        userProfile={user?.profile}
        onPaymentSuccess={onPaymentSuccess}
      />
    </>
  );
};

export default PaymentWrapper;