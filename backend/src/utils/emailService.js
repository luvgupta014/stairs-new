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

// Generic email sender
const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    console.warn('⚠️ Email service not available - email not sent');
    return { success: false, error: 'Email service not configured' };
  }
  const mailOptions = {
    from: `"STAIRS Talent Hub" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  };
  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};

const sendAssignmentEmail = async ({ to, role, eventName, eventLink }) => {
  const subject = `You have been assigned to event: ${eventName}`;
  const text = `You have been assigned as ${role} for event ${eventName}. Open: ${eventLink}`;
  const html = `
    <p>You have been assigned as <strong>${role}</strong> for event <strong>${eventName}</strong>.</p>
    <p><a href="${eventLink}">Open Event</a></p>
  `;
  return sendEmail({ to, subject, text, html });
};

/**
 * Send event incharge invite email with registration link
 */
const sendEventInchargeInviteEmail = async ({
  to,
  event,
  registrationLink,
  permissions,
  isPointOfContact = false
}) => {
  const subject = `Event assigned: ${event?.name || 'Event'} — Complete registration`;
  const permissionList = [
    permissions?.resultUpload ? 'Result Upload' : null,
    permissions?.studentManagement ? 'Student Management' : null,
    permissions?.certificateManagement ? 'Certificate Management' : null,
    permissions?.feeManagement ? 'Fee Management' : null,
    permissions?.editDetails ? 'Edit Details' : null
  ].filter(Boolean);

  const text = [
    `You have been assigned as Event Incharge${isPointOfContact ? ' (Point of Contact)' : ''} for event: ${event?.name || ''}.`,
    `Event: ${event?.name || ''}`,
    `Sport: ${event?.sport || ''}`,
    `Venue: ${event?.venue || ''}, ${event?.city || ''}, ${event?.state || ''}`,
    `Start: ${event?.startDate ? new Date(event.startDate).toLocaleString('en-IN') : ''}`,
    permissionList.length ? `Permissions: ${permissionList.join(', ')}` : `Permissions: None`,
    `Complete registration: ${registrationLink}`
  ].filter(Boolean).join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; }
          .container { max-width: 640px; margin: 0 auto; padding: 24px; }
          .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
          .title { font-size: 20px; font-weight: 700; margin: 0 0 12px 0; }
          .muted { color: #6b7280; font-size: 14px; margin: 0 0 16px 0; }
          .details { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 16px 0; }
          .row { margin: 6px 0; }
          .label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
          .value { font-weight: 600; }
          .pill { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #eef2ff; color: #3730a3; font-size: 12px; margin: 4px 6px 0 0; }
          .button { display: inline-block; margin-top: 14px; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700; }
          .warning { margin-top: 18px; background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 8px; font-size: 14px; }
          .footer { margin-top: 18px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <p class="title">Event assigned — complete your Event Incharge registration</p>
            <p class="muted">
              You have been assigned as <strong>Event Incharge</strong>${isPointOfContact ? ' <strong>(Point of Contact)</strong>' : ''}.
              Please complete registration to get access for this event.
            </p>

            <div class="details">
              <div class="row"><span class="label">Event</span><div class="value">${event?.name || '-'}</div></div>
              <div class="row"><span class="label">Sport</span><div class="value">${event?.sport || '-'}</div></div>
              <div class="row"><span class="label">Venue</span><div class="value">${[event?.venue, event?.city, event?.state].filter(Boolean).join(', ') || '-'}</div></div>
              <div class="row"><span class="label">Start</span><div class="value">${event?.startDate ? new Date(event.startDate).toLocaleString('en-IN') : '-'}</div></div>
            </div>

            <div>
              <div class="label">Granted permissions</div>
              ${(permissionList.length ? permissionList : ['None']).map(p => `<span class="pill">${p}</span>`).join('')}
            </div>

            <a class="button" href="${registrationLink}">Complete registration</a>

            <div class="warning">
              <strong>Security note:</strong> This link is intended only for you. If you did not expect this email, please ignore it.
            </div>

            <div class="footer">© ${new Date().getFullYear()} STAIRS Talent Hub</div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, text, html });
};

/**
 * Send event share email
 */
const sendEventShareEmail = async ({ to, eventName, eventLink, senderName = 'STAIRS Talent Hub', eventDetails = null }) => {
  const subject = `🏆 You're Invited: ${eventName}`;
  
  // Build event details if available
  let eventInfoHtml = '';
  let eventInfoText = '';
  
  if (eventDetails) {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    const eventInfo = [];
    if (eventDetails.sport) {
      eventInfo.push(`<div style="margin: 8px 0;"><strong style="color: #4f46e5;">Sport:</strong> <span style="color: #111827;">${eventDetails.sport}</span></div>`);
      eventInfoText += `Sport: ${eventDetails.sport}\n`;
    }
    if (eventDetails.level) {
      eventInfo.push(`<div style="margin: 8px 0;"><strong style="color: #4f46e5;">Level:</strong> <span style="color: #111827;">${eventDetails.level}</span></div>`);
      eventInfoText += `Level: ${eventDetails.level}\n`;
    }
    if (eventDetails.startDate) {
      const startDate = formatDate(eventDetails.startDate);
      eventInfo.push(`<div style="margin: 8px 0;"><strong style="color: #4f46e5;">📅 Start Date:</strong> <span style="color: #111827;">${startDate}</span></div>`);
      eventInfoText += `Start Date: ${startDate}\n`;
    }
    if (eventDetails.endDate) {
      // Only show end date if it's different from start date
      const startDateStr = eventDetails.startDate ? new Date(eventDetails.startDate).toISOString().split('T')[0] : null;
      const endDateStr = new Date(eventDetails.endDate).toISOString().split('T')[0];
      if (startDateStr !== endDateStr) {
        const endDate = formatDate(eventDetails.endDate);
        eventInfo.push(`<div style="margin: 8px 0;"><strong style="color: #4f46e5;">📅 End Date:</strong> <span style="color: #111827;">${endDate}</span></div>`);
        eventInfoText += `End Date: ${endDate}\n`;
      }
    }
    if (eventDetails.venue || eventDetails.city || eventDetails.state) {
      const venue = [eventDetails.venue, eventDetails.city, eventDetails.state].filter(Boolean).join(', ');
      eventInfo.push(`<div style="margin: 8px 0;"><strong style="color: #4f46e5;">📍 Venue:</strong> <span style="color: #111827;">${venue}</span></div>`);
      eventInfoText += `Venue: ${venue}\n`;
    }
    if (eventDetails.maxParticipants) {
      const current = eventDetails.currentParticipants || 0;
      eventInfo.push(`<div style="margin: 8px 0;"><strong style="color: #4f46e5;">👥 Participants:</strong> <span style="color: #111827;">${current} / ${eventDetails.maxParticipants}</span></div>`);
      eventInfoText += `Participants: ${current} / ${eventDetails.maxParticipants}\n`;
    }
    if (eventDetails.studentFeeEnabled && eventDetails.studentFeeAmount > 0) {
      eventInfo.push(`<div style="margin: 8px 0;"><strong style="color: #4f46e5;">💰 Registration Fee:</strong> <span style="color: #111827;">₹${eventDetails.studentFeeAmount}</span></div>`);
      eventInfoText += `Registration Fee: ₹${eventDetails.studentFeeAmount}\n`;
    }
    
    if (eventInfo.length > 0) {
      eventInfoHtml = `
        <div style="background: #ffffff; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 700;">Event Details</h3>
          ${eventInfo.join('')}
        </div>
      `;
    }
    
    if (eventDetails.description) {
      const cleanDescription = eventDetails.description.replace(/\n/g, '<br>').substring(0, 300);
      eventInfoHtml += `
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #374151; line-height: 1.6;">${cleanDescription}${eventDetails.description.length > 300 ? '...' : ''}</p>
        </div>
      `;
      eventInfoText += `\nDescription: ${eventDetails.description.substring(0, 300)}${eventDetails.description.length > 300 ? '...' : ''}\n`;
    }
  }
  
  const text = `You have been invited to register for the event: ${eventName}\n\n${eventInfoText}\nEvent Link: ${eventLink}\n\nInvited by: ${senderName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #111827; 
            margin: 0; 
            padding: 0; 
            background-color: #f3f4f6;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            border-radius: 12px 12px 0 0;
            padding: 30px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header p {
            margin: 8px 0 0 0;
            font-size: 14px;
            opacity: 0.95;
          }
          .card { 
            background: #ffffff; 
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .card-content {
            padding: 30px;
          }
          .invitation-message {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
            border-left: 4px solid #4f46e5;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .invitation-message p {
            margin: 0;
            color: #1e40af;
            font-size: 16px;
            line-height: 1.6;
          }
          .event-title {
            font-size: 26px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 20px 0;
            line-height: 1.3;
          }
          .cta-button {
            display: inline-block;
            margin: 24px 0;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(79, 70, 229, 0.4);
          }
          .footer { 
            margin-top: 32px; 
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280; 
            font-size: 12px; 
            text-align: center;
          }
          .footer p {
            margin: 4px 0;
          }
          .powered-by {
            margin-top: 16px;
            padding: 12px;
            background: #f9fafb;
            border-radius: 8px;
            font-size: 11px;
            color: #9ca3af;
          }
          @media only screen and (max-width: 600px) {
            .email-container {
              padding: 10px;
            }
            .card-content {
              padding: 20px;
            }
            .event-title {
              font-size: 22px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🏆 Event Invitation</h1>
            <p>You've been invited to join an exciting event!</p>
          </div>
          <div class="card">
            <div class="card-content">
              <div class="invitation-message">
                <p>👋 You have been invited by <strong>${senderName}</strong> to register for this amazing event!</p>
              </div>
              
              <h2 class="event-title">${eventName}</h2>
              
              ${eventInfoHtml}
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${eventLink}" class="cta-button">🚀 View Event & Register Now</a>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>💡 Tip:</strong> Click the button above to view full event details and register. Don't miss this opportunity!
                </p>
              </div>
              
              <div class="footer">
                <p><strong>STAIRS Talent Hub</strong></p>
                <p>Empowering Athletes, Connecting Talent</p>
                <div class="powered-by">
                  <p>© ${new Date().getFullYear()} STAIRS Talent Hub. All rights reserved.</p>
                  <p>This is an automated invitation email. Please do not reply directly to this email.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
  return sendEmail({ to, subject, text, html });
};

/**
 * Send tournament registration confirmation email (ONLINE events)
 */
const sendTournamentRegistrationEmail = async ({
  to,
  athleteName,
  athleteAlias = null,
  event,
  selectedCategory = null,
  registrationContact = null
}) => {
  const eventName = event?.name || 'Event';
  const fmt = (event?.eventFormat || 'ONLINE').toString().toUpperCase();
  const fmtLabel = fmt === 'HYBRID' ? 'Hybrid' : 'Online';
  const subject = `✅ Registration Confirmed: ${eventName} (${fmtLabel})`;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const bracketUrl = event?.tournamentBracketUrl || '';
  const commsUrl = event?.tournamentCommsUrl || '';

  const athleteLine = athleteAlias
    ? `${athleteName} (Alias: ${athleteAlias})`
    : athleteName;

  const detailsRows = [
    ['Event', eventName],
    ['Start', formatDateTime(event?.startDate)],
    ['End', event?.endDate ? formatDateTime(event?.endDate) : '—'],
    ['Sport', event?.sport || '—'],
    ['Level', event?.level || '—'],
    ['Venue', [event?.venue, event?.city, event?.state].filter(Boolean).join(', ') || '—'],
    selectedCategory ? ['Category', selectedCategory] : null,
  ].filter(Boolean);

  const contactRows = registrationContact ? [
    registrationContact.email ? ['Email', registrationContact.email] : null,
    registrationContact.phone ? ['Phone', registrationContact.phone] : null,
    registrationContact.playstationId ? ['PlayStation ID', registrationContact.playstationId] : null,
    registrationContact.eaId ? ['EA ID', registrationContact.eaId] : null,
    registrationContact.instagramHandle ? ['Instagram', registrationContact.instagramHandle] : null,
  ].filter(Boolean) : [];

  const textParts = [];
  textParts.push(`Hi ${athleteLine},`);
  textParts.push('');
  textParts.push(`You are successfully registered for: ${eventName}`);
  textParts.push('');
  detailsRows.forEach(([k, v]) => textParts.push(`${k}: ${v}`));
  textParts.push('');
  if (bracketUrl) textParts.push(`Tournament Bracket / Platform: ${bracketUrl}`);
  if (commsUrl) textParts.push(`Tournament Communications: ${commsUrl}`);
  if (contactRows.length) {
    textParts.push('');
    textParts.push('Your registration details:');
    contactRows.forEach(([k, v]) => textParts.push(`${k}: ${v}`));
  }
  textParts.push('');
  textParts.push('Good luck and see you in the tournament!');

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#f6f7fb; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#4f46e5,#2563eb); padding:20px 24px; color:#fff;">
          <div style="font-size:14px; opacity:0.9;">STAIRS Talent Hub</div>
          <div style="font-size:22px; font-weight:800; margin-top:6px;">Registration confirmed</div>
          <div style="margin-top:6px; font-size:14px; opacity:0.95;">${eventName} • Online Tournament</div>
        </div>

        <div style="padding:24px;">
          <div style="font-size:16px; color:#111827; font-weight:700;">Hi ${athleteLine},</div>
          <div style="margin-top:6px; color:#374151; line-height:1.6;">
            You’re successfully registered. Please keep this email for tournament info and links.
          </div>

          <div style="margin-top:18px; border:1px solid #e5e7eb; border-radius:12px; padding:14px 16px;">
            <div style="font-weight:800; color:#111827; margin-bottom:10px;">Event details</div>
            ${detailsRows.map(([k, v]) => `
              <div style="display:flex; gap:12px; padding:6px 0; border-top:1px dashed #eef2ff;">
                <div style="min-width:120px; color:#6b7280; font-size:13px; font-weight:700;">${k}</div>
                <div style="color:#111827; font-size:13px; font-weight:600;">${v}</div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top:16px; display:grid; grid-template-columns:1fr; gap:10px;">
            <div style="border:1px solid #e0e7ff; background:#eef2ff; border-radius:12px; padding:14px 16px;">
              <div style="font-weight:800; color:#1e3a8a;">Tournament Bracket / Platform</div>
              <div style="margin-top:6px; color:#1f2937; font-size:13px;">
                ${bracketUrl ? `<a href="${bracketUrl}" style="color:#1d4ed8; font-weight:700; text-decoration:none;">Open bracket/platform link →</a>` : 'Link will be shared soon.'}
              </div>
            </div>
            <div style="border:1px solid #dcfce7; background:#f0fdf4; border-radius:12px; padding:14px 16px;">
              <div style="font-weight:800; color:#065f46;">Tournament Communications</div>
              <div style="margin-top:6px; color:#1f2937; font-size:13px;">
                ${commsUrl ? `<a href="${commsUrl}" style="color:#047857; font-weight:800; text-decoration:none;">Join the group →</a>` : 'Link will be shared soon.'}
              </div>
            </div>
          </div>

          ${contactRows.length ? `
            <div style="margin-top:16px; border:1px solid #e5e7eb; border-radius:12px; padding:14px 16px;">
              <div style="font-weight:800; color:#111827; margin-bottom:10px;">Your registration details</div>
              ${contactRows.map(([k, v]) => `
                <div style="display:flex; gap:12px; padding:6px 0; border-top:1px dashed #f3f4f6;">
                  <div style="min-width:140px; color:#6b7280; font-size:13px; font-weight:700;">${k}</div>
                  <div style="color:#111827; font-size:13px; font-weight:600;">${v}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div style="margin-top:18px; color:#6b7280; font-size:12px;">
            If any link doesn’t open, copy & paste it into your browser. See you in the tournament.
          </div>
        </div>
      </div>
      <div style="max-width:640px; margin:12px auto 0; color:#9ca3af; font-size:12px; text-align:center;">
        © ${new Date().getFullYear()} STAIRS Talent Hub
      </div>
    </div>
  `;

  const text = textParts.join('\n');
  return sendEmail({ to, subject, text, html });
};

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
 * Send event completion notification email to coordinator/coach
 * @param {string} email - Coach/Coordinator email
 * @param {string} name - Coach/Coordinator name
 * @param {string} eventName - Event name
 * @param {number} studentCount - Number of students
 * @param {number} totalAmount - Total payment amount (optional)
 * @param {string} customMessage - Custom message from admin (optional)
 * @returns {Promise<Object>} Email send result
 */
const sendEventCompletionEmail = async (email, name, eventName, studentCount, totalAmount = null, customMessage = '') => {
  try {
    if (!transporter) {
      console.warn('⚠️ Email service not available - Event completion email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"STAIRS Talent Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Event Completed - Certificates Ready: ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
            .highlight { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Event Completed!</h1>
              <p>Certificates Ready for Generation</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Great news! Your event <strong>"${eventName}"</strong> has been completed successfully.</p>
              
              ${customMessage ? `<div class="info-box"><p><strong>Message from Admin:</strong></p><p>${customMessage}</p></div>` : ''}
              
              <div class="info-box">
                <h3 style="margin-top: 0;">📊 Event Summary</h3>
                <p><strong>Event Name:</strong> ${eventName}</p>
                <p><strong>Students Registered:</strong> <span class="highlight">${studentCount}</span></p>
                ${totalAmount ? `<p><strong>Total Payment:</strong> <span class="highlight">₹${totalAmount.toLocaleString()}</span></p>` : ''}
                <p><strong>Status:</strong> <span class="highlight">Certificates Ready for Generation</span></p>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">📋 Next Steps</h3>
                <ol>
                  <li>Log in to your STAIRS Talent Hub dashboard</li>
                  <li>Navigate to the event details page</li>
                  <li>Review the certificate issuance section</li>
                  <li>Certificates will be generated and issued to your students</li>
                </ol>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'https://stairs-talent-hub.com'}/coach/dashboard" class="button">View Dashboard</a>
              </p>

              <p>If you have any questions or need assistance, please contact our support team.</p>

              <div class="footer">
                <p>© ${new Date().getFullYear()} STAIRS Talent Hub. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name}!

        Great news! Your event "${eventName}" has been completed successfully.

        ${customMessage ? `Message from Admin: ${customMessage}\n\n` : ''}
        
        Event Summary:
        - Event Name: ${eventName}
        - Students Registered: ${studentCount}
        ${totalAmount ? `- Total Payment: ₹${totalAmount.toLocaleString()}\n` : ''}
        - Status: Certificates Ready for Generation

        Next Steps:
        1. Log in to your STAIRS Talent Hub dashboard
        2. Navigate to the event details page
        3. Review the certificate issuance section
        4. Certificates will be generated and issued to your students

        View Dashboard: ${process.env.FRONTEND_URL || 'https://stairs-talent-hub.com'}/coach/dashboard

        If you have any questions, please contact our support team.

        © ${new Date().getFullYear()} STAIRS Talent Hub
      `
    };

    console.log(`📧 Sending event completion email to: ${email} for event: ${eventName}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Event completion email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending event completion email:', error);
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

/**
 * Certificate issuance emails (participation + winner)
 * Failures should not block certificate generation.
 */
const sendCertificateIssuedEmail = async ({ to, athleteName, eventName, sportName, certificateUrl }) => {
  try {
    if (!to) return { success: false, error: 'Missing recipient' };
    const subject = `Your e-certificate is ready - ${eventName}`;
    const base = process.env.FRONTEND_URL || '';
    const safeUrl = certificateUrl ? (String(certificateUrl).startsWith('http') ? certificateUrl : `${base}${certificateUrl}`) : '';

    const text = `Hi ${athleteName || 'Athlete'},\n\nYour participation certificate for ${eventName}${sportName ? ` (${sportName})` : ''} has been issued.\n${safeUrl ? `Download: ${safeUrl}\n` : ''}\n`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2 style="margin:0 0 8px 0;">🎓 Your certificate is ready</h2>
        <p style="margin:0 0 12px 0;">Hi <b>${athleteName || 'Athlete'}</b>,</p>
        <p style="margin:0 0 12px 0;">Your participation certificate for <b>${eventName}</b>${sportName ? ` (${sportName})` : ''} has been issued.</p>
        ${safeUrl ? `<p style="margin:0 0 12px 0;"><a href="${safeUrl}" target="_blank" rel="noreferrer">Download your certificate</a></p>` : ''}
        <p style="margin:0;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} STAIRS Talent Hub</p>
      </div>
    `;
    return await sendEmail({ to, subject, text, html });
  } catch (e) {
    console.warn('⚠️ sendCertificateIssuedEmail failed:', e?.message || e);
    return { success: false, error: e?.message || 'Failed to send' };
  }
};

const sendWinnerCertificateIssuedEmail = async ({ to, athleteName, eventName, sportName, positionText, points, certificateUrl }) => {
  try {
    if (!to) return { success: false, error: 'Missing recipient' };
    const pos = positionText || 'Winner';
    const subject = `🏆 ${pos} certificate - ${eventName}`;
    const base = process.env.FRONTEND_URL || '';
    const safeUrl = certificateUrl ? (String(certificateUrl).startsWith('http') ? certificateUrl : `${base}${certificateUrl}`) : '';

    const text = `Hi ${athleteName || 'Athlete'},\n\nCongratulations! Your ${pos} certificate for ${eventName}${sportName ? ` (${sportName})` : ''} has been issued.\n${points !== null && points !== undefined ? `Points: ${points}\n` : ''}${safeUrl ? `Download: ${safeUrl}\n` : ''}\n`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2 style="margin:0 0 8px 0;">🏆 Congratulations!</h2>
        <p style="margin:0 0 12px 0;">Hi <b>${athleteName || 'Athlete'}</b>,</p>
        <p style="margin:0 0 12px 0;">Your <b>${pos}</b> certificate for <b>${eventName}</b>${sportName ? ` (${sportName})` : ''} has been issued.</p>
        ${points !== null && points !== undefined ? `<p style="margin:0 0 12px 0;"><b>Points:</b> ${points}</p>` : ''}
        ${safeUrl ? `<p style="margin:0 0 12px 0;"><a href="${safeUrl}" target="_blank" rel="noreferrer">Download your certificate</a></p>` : ''}
        <p style="margin:0;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} STAIRS Talent Hub</p>
      </div>
    `;
    return await sendEmail({ to, subject, text, html });
  } catch (e) {
    console.warn('⚠️ sendWinnerCertificateIssuedEmail failed:', e?.message || e);
    return { success: false, error: e?.message || 'Failed to send' };
  }
};

module.exports = {
  sendEventShareEmail,
  sendTournamentRegistrationEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEventModerationEmail,
  sendOrderStatusEmail,
  sendPaymentReceiptEmail,
  sendEventCompletionEmail,
  sendAssignmentEmail,
  sendEventInchargeInviteEmail,
  sendCertificateIssuedEmail,
  sendWinnerCertificateIssuedEmail,
  sendEmail
};