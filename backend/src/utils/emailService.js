const nodemailer = require('nodemailer');

// Create transporter with safe configuration
const createTransporter = () => {
  try {
    // Check if email credentials are available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Email credentials not configured. Email functionality will be disabled.');
      return null;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration safely
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter error:', error.message);
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

// Create transporter instance
const transporter = createTransporter();

/**
 * Send OTP email for registration
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} name - User name (optional)
 * @returns {Promise<Object>} Email send result
 */
const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    // Check if transporter is available
    if (!transporter) {
      console.warn('⚠️ Email service not available - OTP email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"STAIRS Talent Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - STAIRS Talent Hub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #2563eb;
              margin-bottom: 30px;
            }
            .otp-box {
              background-color: #fff;
              border: 2px dashed #2563eb;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #2563eb;9
              letter-spacing: 5px;
              margin: 10px 0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 10px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏃‍♂️ STAIRS Talent Hub</h1>
            </div>
            
            <h2>Hello ${name}!</h2>
            <p>Thank you for registering with STAIRS Talent Hub. To complete your registration, please verify your email address using the OTP below:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your One-Time Password (OTP)</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; font-size: 12px; color: #666;">Valid for 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Note:</strong> Never share this OTP with anyone. STAIRS Talent Hub will never ask for your OTP via phone or email.
            </div>
            
            <p>If you didn't request this code, please ignore this email or contact our support team.</p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} STAIRS Talent Hub. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!
        
        Thank you for registering with STAIRS Talent Hub.
        
        Your verification OTP is: ${otp}
        
        This OTP is valid for 10 minutes.
        
        If you didn't request this code, please ignore this email.
        
        © ${new Date().getFullYear()} STAIRS Talent Hub
      `
    };

    console.log(`📧 Sending OTP email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Reset token
 * @param {string} name - User name (optional)
 * @returns {Promise<Object>} Email send result
 */
const sendPasswordResetEmail = async (email, resetToken, name = 'User') => {
  try {
    // Check if transporter is available
    if (!transporter) {
      console.warn('⚠️ Email service not available - Password reset email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"STAIRS Talent Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - STAIRS Talent Hub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #dc2626;
              margin-bottom: 30px;
            }
            .token-box {
              background-color: #fff;
              border: 2px solid #dc2626;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .reset-token {
              font-size: 24px;
              font-weight: bold;
              color: #dc2626;
              letter-spacing: 3px;
              margin: 10px 0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #fee;
              border-left: 4px solid #dc2626;
              padding: 10px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            
            <h2>Hello ${name}!</h2>
            <p>We received a request to reset your password for your STAIRS Talent Hub account. Use the token below to reset your password:</p>
            
            <div class="token-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your Password Reset Token</p>
              <div class="reset-token">${resetToken}</div>
              <p style="margin: 0; font-size: 12px; color: #666;">Valid for 15 minutes</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Warning:</strong> If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} STAIRS Talent Hub. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!
        
        We received a request to reset your password.
        
        Your password reset token is: ${resetToken}
        
        This token is valid for 15 minutes.
        
        If you didn't request this, please ignore this email.
        
        © ${new Date().getFullYear()} STAIRS Talent Hub
      `
    };

    console.log(`📧 Sending password reset email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @param {string} role - User role
 * @returns {Promise<Object>} Email send result
 */
const sendWelcomeEmail = async (email, name, role) => {
  try {
    // Check if transporter is available
    if (!transporter) {
      console.warn('⚠️ Email service not available - Welcome email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"STAIRS Talent Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to STAIRS Talent Hub! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #2563eb;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏃‍♂️ Welcome to STAIRS Talent Hub!</h1>
            </div>
            
            <h2>Hello ${name}!</h2>
            <p>Congratulations! Your account has been successfully verified and you're now part of the STAIRS Talent Hub community as a ${role.toLowerCase()}.</p>
            
            <p>Here's what you can do next:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Explore available opportunities</li>
              <li>Connect with other members</li>
              <li>Track your progress</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Go to Dashboard</a>
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} STAIRS Talent Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log(`📧 Sending welcome email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send event moderation notification email
 * @param {string} email - Recipient email
 * @param {string} name - Coach/Coordinator name
 * @param {string} action - Action taken (APPROVED, REJECTED, SUSPENDED, RESTARTED)
 * @param {Object} eventData - Event details
 * @param {string} adminNotes - Admin remarks (optional)
 * @returns {Promise<Object>} Email send result
 */
const sendEventModerationEmail = async (email, name, action, eventData, adminNotes = '') => {
  try {
    // Check if transporter is available
    if (!transporter) {
      console.warn('⚠️ Email service not available - Event moderation email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const actionMessages = {
      APPROVED: {
        title: 'Event Approved! 🎉',
        icon: '✅',
        color: '#10b981',
        message: 'Your event has been approved and is now live!'
      },
      REJECTED: {
        title: 'Event Update Required',
        icon: '❌',
        color: '#ef4444',
        message: 'Your event requires some changes before it can be approved.'
      },
      SUSPENDED: {
        title: 'Event Temporarily Suspended',
        icon: '⏸️',
        color: '#f59e0b',
        message: 'Your event has been temporarily suspended.'
      },
      RESTARTED: {
        title: 'Event Reactivated! 🔄',
        icon: '🔄',
        color: '#3b82f6',
        message: 'Your event has been reactivated and is now live again!'
      }
    };

    const actionInfo = actionMessages[action] || actionMessages.APPROVED;

    const mailOptions = {
      from: `"STAIRS Talent Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${actionInfo.title} - ${eventData.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #2563eb;
              margin-bottom: 30px;
            }
            .status-box {
              background-color: #fff;
              border-left: 4px solid ${actionInfo.color};
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .event-details {
              background-color: #f8fafc;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .admin-notes {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏃‍♂️ STAIRS Talent Hub</h1>
            </div>
            
            <h2>Hello ${name}!</h2>
            
            <div class="status-box">
              <h3 style="color: ${actionInfo.color}; margin-top: 0;">
                ${actionInfo.icon} ${actionInfo.title}
              </h3>
              <p>${actionInfo.message}</p>
            </div>
            
            <div class="event-details">
              <h4 style="margin-top: 0;">Event Details:</h4>
              <p><strong>Event Name:</strong> ${eventData.name}</p>
              <p><strong>Sport:</strong> ${eventData.sport}</p>
              <p><strong>Date:</strong> ${new Date(eventData.startDate).toLocaleDateString()}</p>
              <p><strong>Location:</strong> ${eventData.venue}, ${eventData.city}</p>
              <p><strong>Max Participants:</strong> ${eventData.maxParticipants}</p>
            </div>
            
            ${adminNotes ? `
              <div class="admin-notes">
                <h4 style="margin-top: 0;">Admin Notes:</h4>
                <p>${adminNotes}</p>
              </div>
            ` : ''}
            
            <p>You can view and manage your event in your dashboard.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/coach/dashboard" 
                 style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Go to Dashboard
              </a>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} STAIRS Talent Hub. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!
        
        ${actionInfo.title}
        ${actionInfo.message}
        
        Event Details:
        - Name: ${eventData.name}
        - Sport: ${eventData.sport}
        - Date: ${new Date(eventData.startDate).toLocaleDateString()}
        - Location: ${eventData.venue}, ${eventData.city}
        - Max Participants: ${eventData.maxParticipants}
        
        ${adminNotes ? `Admin Notes: ${adminNotes}` : ''}
        
        You can view and manage your event in your dashboard.
        
        © ${new Date().getFullYear()} STAIRS Talent Hub
      `
    };

    console.log(`📧 Sending event moderation email to: ${email} for action: ${action}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Event moderation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending event moderation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order status update notification email
 * @param {string} email - Recipient email
 * @param {string} name - Coach/Coordinator name
 * @param {string} status - Order status (CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
 * @param {Object} orderData - Order details
 * @param {string} adminRemarks - Admin remarks (optional)
 * @returns {Promise<Object>} Email send result
 */
const sendOrderStatusEmail = async (email, name, status, orderData, adminRemarks = '') => {
  try {
    // Check if transporter is available
    if (!transporter) {
      console.warn('⚠️ Email service not available - Order status email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const statusMessages = {
      CONFIRMED: {
        title: 'Order Confirmed! 📋',
        icon: '✅',
        color: '#10b981',
        message: 'Your order has been confirmed and is ready for payment.'
      },
      IN_PROGRESS: {
        title: 'Order In Progress 🔨',
        icon: '⚙️',
        color: '#3b82f6',
        message: 'Your order is currently being prepared.'
      },
      COMPLETED: {
        title: 'Order Completed! 🎉',
        icon: '🎊',
        color: '#10b981',
        message: 'Your order has been completed and is ready for pickup/delivery.'
      },
      CANCELLED: {
        title: 'Order Cancelled',
        icon: '❌',
        color: '#ef4444',
        message: 'Your order has been cancelled.'
      }
    };

    const statusInfo = statusMessages[status] || statusMessages.CONFIRMED;

    const mailOptions = {
      from: `"STAIRS Talent Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${statusInfo.title} - Order ${orderData.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #2563eb;
              margin-bottom: 30px;
            }
            .status-box {
              background-color: #fff;
              border-left: 4px solid ${statusInfo.color};
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .order-details {
              background-color: #f8fafc;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .admin-notes {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏃‍♂️ STAIRS Talent Hub</h1>
            </div>
            
            <h2>Hello ${name}!</h2>
            
            <div class="status-box">
              <h3 style="color: ${statusInfo.color}; margin-top: 0;">
                ${statusInfo.icon} ${statusInfo.title}
              </h3>
              <p>${statusInfo.message}</p>
            </div>
            
            <div class="order-details">
              <h4 style="margin-top: 0;">Order Details:</h4>
              <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
              <p><strong>Event:</strong> ${orderData.event?.name || 'N/A'}</p>
              <p><strong>Certificates:</strong> ${orderData.certificates}</p>
              <p><strong>Medals:</strong> ${orderData.medals}</p>
              <p><strong>Trophies:</strong> ${orderData.trophies}</p>
              ${orderData.totalAmount ? `<p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>` : ''}
            </div>
            
            ${adminRemarks ? `
              <div class="admin-notes">
                <h4 style="margin-top: 0;">Admin Notes:</h4>
                <p>${adminRemarks}</p>
              </div>
            ` : ''}
            
            <p>You can track your order status in your dashboard.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/coach/dashboard" 
                 style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Go to Dashboard
              </a>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} STAIRS Talent Hub. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!
        
        ${statusInfo.title}
        ${statusInfo.message}
        
        Order Details:
        - Order Number: ${orderData.orderNumber}
        - Event: ${orderData.event?.name || 'N/A'}
        - Certificates: ${orderData.certificates}
        - Medals: ${orderData.medals}
        - Trophies: ${orderData.trophies}
        ${orderData.totalAmount ? `- Total Amount: ₹${orderData.totalAmount}` : ''}
        
        ${adminRemarks ? `Admin Notes: ${adminRemarks}` : ''}
        
        You can track your order status in your dashboard.
        
        © ${new Date().getFullYear()} STAIRS Talent Hub
      `
    };

    console.log(`📧 Sending order status email to: ${email} for order: ${orderData.orderNumber}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Order status email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending order status email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send payment receipt/invoice email
 * @param {Object} receiptData - Receipt information
 * @param {string} receiptData.email - Recipient email
 * @param {string} receiptData.name - User name
 * @param {string} receiptData.paymentId - Razorpay payment ID
 * @param {string} receiptData.orderId - Razorpay order ID
 * @param {string} receiptData.invoiceId - Razorpay invoice ID (optional)
 * @param {string} receiptData.invoiceUrl - Invoice URL (optional)
 * @param {number} receiptData.amount - Payment amount
 * @param {string} receiptData.currency - Currency
 * @param {string} receiptData.description - Payment description
 * @param {string} receiptData.invoiceNumber - Invoice number
 * @param {string} receiptData.paidAt - Payment date
 * @param {Object} receiptData.metadata - Additional metadata
 * @returns {Promise<Object>} Email send result
 */
const sendPaymentReceiptEmail = async (receiptData) => {
  try {
    // Check if transporter is available
    if (!transporter) {
      console.warn('⚠️ Email service not available - Payment receipt email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const {
      email,
      name,
      paymentId,
      orderId,
      invoiceId,
      invoiceUrl,
      amount,
      currency = 'INR',
      description,
      invoiceNumber,
      paidAt,
      metadata = {}
    } = receiptData;

    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);

    const mailOptions = {
      from: `"STAIRS Talent Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Payment Receipt - STAIRS Talent Hub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #2563eb;
              margin-bottom: 30px;
            }
            .receipt-box {
              background-color: #fff;
              border: 2px solid #10b981;
              border-radius: 8px;
              padding: 25px;
              margin: 20px 0;
            }
            .receipt-header {
              text-align: center;
              color: #10b981;
              margin-bottom: 20px;
            }
            .receipt-details {
              background-color: #f8fafc;
              border-radius: 8px;
              padding: 15px;
              margin: 15px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #666;
            }
            .detail-value {
              color: #333;
              font-weight: 500;
            }
            .amount-box {
              background-color: #10b981;
              color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
            }
            .amount-label {
              font-size: 14px;
              opacity: 0.9;
            }
            .amount-value {
              font-size: 32px;
              font-weight: bold;
              margin: 10px 0;
            }
            .invoice-link {
              display: inline-block;
              padding: 12px 30px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .success-badge {
              display: inline-block;
              background-color: #10b981;
              color: white;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏃‍♂️ STAIRS Talent Hub</h1>
            </div>
            
            <div class="receipt-box">
              <div class="receipt-header">
                <span class="success-badge">✅ Payment Successful</span>
                <h2 style="margin: 10px 0;">Payment Receipt</h2>
              </div>
              
              <div class="amount-box">
                <div class="amount-label">Amount Paid</div>
                <div class="amount-value">${formattedAmount}</div>
              </div>
              
              <div class="receipt-details">
                <div class="detail-row">
                  <span class="detail-label">Invoice Number:</span>
                  <span class="detail-value">${invoiceNumber || paymentId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment ID:</span>
                  <span class="detail-value">${paymentId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Order ID:</span>
                  <span class="detail-value">${orderId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Date:</span>
                  <span class="detail-value">${new Date(paidAt).toLocaleString('en-IN', { 
                    dateStyle: 'long', 
                    timeStyle: 'short' 
                  })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Description:</span>
                  <span class="detail-value">${description || 'Payment'}</span>
                </div>
                ${metadata.eventName ? `
                <div class="detail-row">
                  <span class="detail-label">Event:</span>
                  <span class="detail-value">${metadata.eventName}</span>
                </div>
                ` : ''}
                ${metadata.planName ? `
                <div class="detail-row">
                  <span class="detail-label">Plan:</span>
                  <span class="detail-value">${metadata.planName}</span>
                </div>
                ` : ''}
                ${metadata.orderNumber ? `
                <div class="detail-row">
                  <span class="detail-label">Order Number:</span>
                  <span class="detail-value">${metadata.orderNumber}</span>
                </div>
                ` : ''}
              </div>
              
              ${invoiceUrl ? `
              <div style="text-align: center; margin-top: 20px;">
                <a href="${invoiceUrl}" class="invoice-link" target="_blank">
                  View/Download Invoice
                </a>
              </div>
              ` : ''}
            </div>
            
            <p style="text-align: center; color: #666; font-size: 14px;">
              This is an official receipt for your payment. Please keep this email for your records.
            </p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} STAIRS Talent Hub. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
              <p>For any queries, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Payment Receipt - STAIRS Talent Hub
        
        Payment Successful ✅
        
        Amount Paid: ${formattedAmount}
        
        Invoice Number: ${invoiceNumber || paymentId}
        Payment ID: ${paymentId}
        Order ID: ${orderId}
        Payment Date: ${new Date(paidAt).toLocaleString('en-IN')}
        Description: ${description || 'Payment'}
        
        ${metadata.eventName ? `Event: ${metadata.eventName}\n` : ''}
        ${metadata.planName ? `Plan: ${metadata.planName}\n` : ''}
        ${metadata.orderNumber ? `Order Number: ${metadata.orderNumber}\n` : ''}
        
        ${invoiceUrl ? `Invoice URL: ${invoiceUrl}\n` : ''}
        
        This is an official receipt for your payment. Please keep this email for your records.
        
        © ${new Date().getFullYear()} STAIRS Talent Hub
      `
    };

    console.log(`📧 Sending payment receipt email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Payment receipt email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending payment receipt email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEventModerationEmail,
  sendOrderStatusEmail,
  sendPaymentReceiptEmail
};