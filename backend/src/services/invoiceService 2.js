const Razorpay = require('razorpay');
const { sendPaymentReceiptEmail } = require('../utils/emailService');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay invoice and send receipt email
 * @param {Object} paymentData - Payment information
 * @param {string} paymentData.razorpayPaymentId - Razorpay payment ID
 * @param {string} paymentData.razorpayOrderId - Razorpay order ID
 * @param {string} paymentData.userEmail - User email address
 * @param {string} paymentData.userName - User name
 * @param {number} paymentData.amount - Payment amount (in rupees)
 * @param {string} paymentData.currency - Currency (default: INR)
 * @param {string} paymentData.description - Payment description
 * @param {Object} paymentData.metadata - Additional metadata
 * @returns {Promise<Object>} Invoice creation result
 */
async function createInvoiceAndSendEmail(paymentData) {
  try {
    const {
      razorpayPaymentId,
      razorpayOrderId,
      userEmail,
      userName,
      amount,
      currency = 'INR',
      description,
      metadata = {}
    } = paymentData;

    console.log(`📄 Creating invoice for payment ${razorpayPaymentId}`);

    // Create Razorpay invoice
    const invoiceData = {
      type: 'invoice', // or 'link' for payment links
      description: description || 'Payment Receipt',
      customer: {
        name: userName,
        email: userEmail,
        contact: metadata.phone || null
      },
      line_items: [
        {
          name: description || 'Payment',
          description: description || 'Payment Receipt',
          amount: Math.round(amount * 100), // Convert to paise
          currency: currency,
          quantity: 1
        }
      ],
      email_notify: 1, // Enable email notification from Razorpay
      sms_notify: 0,
      currency: currency,
      notes: {
        payment_id: razorpayPaymentId,
        order_id: razorpayOrderId,
        ...metadata
      }
    };

    // Create invoice
    const invoice = await razorpay.invoices.create(invoiceData);
    console.log(`✅ Razorpay invoice created: ${invoice.id}`);

    // Issue the invoice (mark as issued)
    try {
      await razorpay.invoices.issue(invoice.id);
      console.log(`✅ Invoice issued: ${invoice.id}`);
    } catch (issueError) {
      // Invoice might already be issued or auto-issued
      console.log(`ℹ️ Invoice issue status: ${issueError.message}`);
    }

    // Send custom receipt email with invoice details
    const emailResult = await sendPaymentReceiptEmail({
      email: userEmail,
      name: userName,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      invoiceId: invoice.id,
      invoiceUrl: invoice.short_url || invoice.url || null,
      amount: amount,
      currency: currency,
      description: description,
      invoiceNumber: invoice.invoice_number || invoice.id,
      paidAt: new Date().toISOString(),
      metadata: metadata
    });

    if (emailResult.success) {
      console.log(`✅ Receipt email sent to ${userEmail}`);
    } else {
      console.warn(`⚠️ Failed to send receipt email: ${emailResult.error}`);
    }

    return {
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number || invoice.id,
      invoiceUrl: invoice.short_url || invoice.url,
      emailSent: emailResult.success,
      emailError: emailResult.error || null
    };

  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    
    // Try to send email even if invoice creation fails
    try {
      await sendPaymentReceiptEmail({
        email: paymentData.userEmail,
        name: paymentData.userName,
        paymentId: paymentData.razorpayPaymentId,
        orderId: paymentData.razorpayOrderId,
        invoiceId: null,
        invoiceUrl: null,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        description: paymentData.description,
        invoiceNumber: paymentData.razorpayPaymentId,
        paidAt: new Date().toISOString(),
        metadata: paymentData.metadata || {}
      });
    } catch (emailError) {
      console.error('❌ Failed to send receipt email as fallback:', emailError);
    }

    // Return error but don't fail the payment verification
    return {
      success: false,
      error: error.message,
      emailSent: false
    };
  }
}

/**
 * Create invoice for subscription payment
 */
async function createSubscriptionInvoice(paymentData) {
  return createInvoiceAndSendEmail({
    ...paymentData,
    description: paymentData.description || `${paymentData.planName} Subscription`
  });
}

/**
 * Create invoice for event payment
 */
async function createEventPaymentInvoice(paymentData) {
  return createInvoiceAndSendEmail({
    ...paymentData,
    description: paymentData.description || `Event Registration: ${paymentData.eventName || 'Event'}`
  });
}

/**
 * Create invoice for order payment
 */
async function createOrderInvoice(paymentData) {
  return createInvoiceAndSendEmail({
    ...paymentData,
    description: paymentData.description || `Order ${paymentData.orderNumber || ''}`
  });
}

module.exports = {
  createInvoiceAndSendEmail,
  createSubscriptionInvoice,
  createEventPaymentInvoice,
  createOrderInvoice
};

