const nodemailer = require('nodemailer');
const { decodePassword } = require('./passwordEncoder');

// Create transporter with safe configuration
const createTransporter = () => {
  try {
    // Check if email credentials are available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Email credentials not configured. Email functionality will be disabled.');
      return null;
    }

    // Decode password if it's base64 encoded (optional security measure)
    let emailPass = process.env.EMAIL_PASS;
    if (process.env.EMAIL_PASS_ENCODED === 'true') {
      emailPass = decodePassword(process.env.EMAIL_PASS);
    }

    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: emailPass
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
              color: #2563eb;
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

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};