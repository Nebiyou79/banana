const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ==================== OTP EMAIL TEMPLATES ====================

// OTP Email Template for registration
const generateOTPTemplate = (otp, name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #0A2540 0%, #F1BB03 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 30px; background: #f9f9f9; }
        .otp-code { font-size: 32px; font-weight: bold; color: #0A2540; text-align: center; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; border: 2px dashed #0A2540; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; background: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Banana</h1>
          <p>Your Career Journey Starts Here</p>
        </div>
        <div class="content">
          <h2>Email Verification</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with Banana. Use the OTP code below to verify your email address:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2024 Banana. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// OTP template for password reset
const generateResetPasswordOTPTemplate = (otp, name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0A2540 0%, #F1BB03 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #0A2540; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Banana</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="content">
          <h2>Password Reset</h2>
          <p>Hello ${name},</p>
          <p>You requested to reset your password. Use the OTP code below to verify your identity:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          
          <div class="footer">
            <p>© 2024 Banana. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ==================== PASSWORD RESET TEMPLATES ====================

// Password reset template with link
const getPasswordResetTemplate = (name, resetLink) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #0A2540 0%, #F1BB03 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #0A2540; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; background: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Banana</h1>
          <p>Your Career Journey Starts Here</p>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2024 Banana. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ==================== TENDER EMAIL TEMPLATES ====================

// Tender invitation for registered users
const generateTenderInvitationTemplate = (userName, tender, invitingUser) => {
  const accessLink = `${process.env.FRONTEND_URL}/tender/${tender._id}`;
  const tenderType = tender.tenderCategory === 'freelance' ? 'Freelance Project' : 'Professional Tender';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #0A2540 0%, #F1BB03 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 30px; background: #f9f9f9; }
        .tender-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e0e0e0; }
        .button { display: inline-block; padding: 12px 24px; background: #0A2540; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; background: #f5f5f5; }
        .badge { display: inline-block; background: #F1BB03; color: #0A2540; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 10px; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .info-label { font-weight: bold; color: #666; }
        .info-value { color: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Banana</h1>
          <p>Tender & Procurement Platform</p>
        </div>
        <div class="content">
          <h2>You've Been Invited to Submit a Proposal!</h2>
          <p>Hello ${userName},</p>
          <p>${invitingUser.name || invitingUser.company?.name || 'A company'} has invited you to submit a proposal for their ${tenderType.toLowerCase()}.</p>
          
          <div class="tender-card">
            <h3>${tender.title}</h3>
            
            <div style="margin: 15px 0;">
              <span class="badge">${tenderType}</span>
              <span class="badge">${tender.workflowType === 'closed' ? 'Sealed Bid' : 'Open Tender'}</span>
              <span class="badge">Invite Only</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Tender ID:</span>
              <span class="info-value">${tender.tenderId || tender._id}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Reference Number:</span>
              <span class="info-value">${tender.professionalSpecific?.referenceNumber || 'N/A'}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Deadline:</span>
              <span class="info-value">${new Date(tender.deadline).toLocaleDateString()} ${new Date(tender.deadline).toLocaleTimeString()}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Days Remaining:</span>
              <span class="info-value">${tender.metadata?.daysRemaining || 'Unknown'} days</span>
            </div>
            
            <p style="margin-top: 15px; font-style: italic;">
              ${tender.workflowType === 'closed' 
                ? 'This is a sealed bid tender. Proposals will remain confidential until the deadline.' 
                : 'This is an open tender. You can view other proposals after submission.'}
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${accessLink}" class="button">View Tender Details & Submit Proposal</a>
          </div>
          
          <h3>Important Information:</h3>
          <ul>
            <li>This invitation expires with the tender deadline</li>
            <li>You must be logged into your Banana account to submit a proposal</li>
            <li>Prepare all required documents before starting your submission</li>
            <li>Contact ${invitingUser.name || invitingUser.company?.name || 'the tender owner'} if you have any questions</li>
          </ul>
          
          <p>Best regards,<br>The Banana Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Banana. All rights reserved.</p>
          <p>This is an automated invitation, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Tender invitation for non-registered users
const generateTenderEmailInvitationTemplate = (email, tender, invitingUser, token) => {
  const registerLink = `${process.env.FRONTEND_URL}/register?invitation_token=${token}&tender_id=${tender._id}`;
  const tenderType = tender.tenderCategory === 'freelance' ? 'Freelance Project' : 'Professional Tender';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #0A2540 0%, #F1BB03 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 30px; background: #f9f9f9; }
        .tender-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e0e0e0; }
        .button { display: inline-block; padding: 12px 24px; background: #0A2540; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; background: #f5f5f5; }
        .badge { display: inline-block; background: #F1BB03; color: #0A2540; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 10px; }
        .token-box { background: #f8f9fa; border: 2px dashed #0A2540; padding: 15px; border-radius: 5px; font-family: monospace; margin: 15px 0; text-align: center; font-size: 18px; letter-spacing: 2px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Banana</h1>
          <p>Tender & Procurement Platform</p>
        </div>
        <div class="content">
          <h2>Exclusive Tender Invitation</h2>
          <p>Hello,</p>
          <p>You have been invited by ${invitingUser.name || invitingUser.company?.name || 'a company'} to participate in an exclusive ${tenderType.toLowerCase()} on Banana platform!</p>
          
          <div class="tender-card">
            <h3>${tender.title}</h3>
            
            <div style="margin: 15px 0;">
              <span class="badge">${tenderType}</span>
              <span class="badge">Exclusive Invitation</span>
              <span class="badge">${tender.workflowType === 'closed' ? 'Sealed Bid' : 'Open'}</span>
            </div>
            
            <p><strong>Tender ID:</strong> ${tender.tenderId || tender._id}</p>
            <p><strong>Deadline:</strong> ${new Date(tender.deadline).toLocaleDateString()}</p>
            <p><strong>Invited by:</strong> ${invitingUser.name || invitingUser.company?.name || 'A company'}</p>
            
            <p style="margin-top: 15px; font-style: italic;">
              This is a private invitation. You need to register on Banana to access this opportunity.
            </p>
          </div>
          
          <h3>How to Participate:</h3>
          <ol>
            <li><strong>Register on Banana</strong> using the button below</li>
            <li><strong>Complete your profile</strong> (as ${tender.tenderCategory === 'freelance' ? 'Freelancer' : 'Company'})</li>
            <li><strong>Use this invitation code</strong> during registration:</li>
          </ol>
          
          <div class="token-box">
            ${token}
          </div>
          
          <p>This code will automatically link your account to this tender invitation.</p>
          
          <div style="text-align: center;">
            <a href="${registerLink}" class="button">Register Now & Access Tender</a>
          </div>
          
          <h3>Why Join Banana?</h3>
          <ul>
            <li>Access exclusive tender opportunities</li>
            <li>Connect with verified companies and organizations</li>
            <li>${tender.tenderCategory === 'freelance' ? 'Find freelance projects and build your portfolio' : 'Grow your business with procurement contracts'}</li>
            <li>Secure, transparent, and fair bidding process</li>
            <li>Professional tools for proposal management</li>
          </ul>
          
          <p><strong>Important:</strong> This invitation expires in 7 days. Register soon to secure your spot!</p>
          
          <p>Best regards,<br>The Banana Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Banana. All rights reserved.</p>
          <p>This invitation was sent by ${invitingUser.name || invitingUser.company?.name || 'a company'} via Banana platform.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Invitation accepted notification
const generateInvitationAcceptedTemplate = (ownerName, acceptedUserName, tender) => {
  const tenderLink = `${process.env.FRONTEND_URL}/tender/${tender._id}/proposals`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #0A2540 0%, #F1BB03 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 30px; background: #f9f9f9; }
        .info-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e0e0e0; }
        .button { display: inline-block; padding: 12px 24px; background: #0A2540; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding: 20px; background: #f5f5f5; }
        .success-badge { display: inline-block; background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Banana</h1>
          <p>Tender Notification</p>
        </div>
        <div class="content">
          <h2>Invitation Accepted! 🎉</h2>
          <p>Hello ${ownerName},</p>
          <p>Great news! ${acceptedUserName} has accepted your invitation to participate in your tender.</p>
          
          <div class="info-card">
            <h3>${tender.title}</h3>
            <p><strong>Tender ID:</strong> ${tender.tenderId || tender._id}</p>
            <p><strong>Accepted by:</strong> ${acceptedUserName}</p>
            <p><strong>Accepted at:</strong> ${new Date().toLocaleString()}</p>
            <div style="margin-top: 10px;">
              <span class="success-badge">INVITATION ACCEPTED</span>
            </div>
          </div>
          
          <p>${acceptedUserName} can now view the tender details and submit a proposal before the deadline.</p>
          
          <div style="text-align: center;">
            <a href="${tenderLink}" class="button">View Tender & Applications</a>
          </div>
          
          <h3>Next Steps:</h3>
          <ul>
            <li>Monitor proposal submissions</li>
            <li>Communicate with bidders if needed</li>
            <li>Evaluate proposals after the deadline</li>
            <li>Award the contract to the best bidder</li>
          </ul>
          
          <p>Best regards,<br>The Banana Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Banana. All rights reserved.</p>
          <p>This is an automated notification, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ============ EMAIL SERVICE FUNCTIONS ============

// Send tender invitation to registered users
exports.sendTenderInvitationEmail = async (email, userName, tender, invitingUser) => {
  try {
    const mailOptions = {
      from: `Banana Tenders <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎯 Invitation: ${tender.title} - ${tender.tenderId || 'New Tender'}`,
      html: generateTenderInvitationTemplate(userName, tender, invitingUser),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Tender invitation email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending tender invitation email:', error);
    throw new Error('Failed to send tender invitation email');
  }
};

// Send tender invitation to non-registered users
exports.sendTenderEmailInvitation = async (email, tender, invitingUser, token) => {
  try {
    const mailOptions = {
      from: `Banana Tenders <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🌟 Join Banana: Exclusive Tender Invitation - ${tender.title}`,
      html: generateTenderEmailInvitationTemplate(email, tender, invitingUser, token),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Tender email invitation sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending tender email invitation:', error);
    throw new Error('Failed to send tender email invitation');
  }
};

// Send invitation accepted notification
exports.sendInvitationAcceptedEmail = async (email, ownerName, acceptedUserName, tender) => {
  try {
    const mailOptions = {
      from: `Banana Notifications <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Invitation Accepted: ${acceptedUserName} for ${tender.title}`,
      html: generateInvitationAcceptedTemplate(ownerName, acceptedUserName, tender),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Invitation accepted notification sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending invitation accepted email:', error);
    throw new Error('Failed to send invitation accepted email');
  }
};

// ==================== APPOINTMENT TEMPLATES ====================

// Appointment confirmation template
const generateAppointmentConfirmationTemplate = (data) => {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1>Appointment Confirmed!</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear ${data.fullName},</p>
          
          <p>Your ${data.verificationType} verification appointment has been confirmed.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Appointment Details:</h3>
            <p><strong>Date:</strong> ${data.appointmentDate}</p>
            <p><strong>Time:</strong> ${data.appointmentTime}</p>
            <p><strong>Location:</strong> ${data.officeLocation}</p>
            <p><strong>Verification Type:</strong> ${data.verificationType}</p>
          </div>
          
          <h3>Required Documents:</h3>
          <ul>
            ${data.documentsRequired.map(doc => `<li>${doc}</li>`).join('')}
          </ul>
          
          ${data.additionalNotes ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Additional Notes:</h4>
              <p>${data.additionalNotes}</p>
            </div>
          ` : ''}
          
          <h3>Important Instructions:</h3>
          <ul>
            <li>Arrive 15 minutes before your appointment</li>
            <li>Bring original documents and photocopies</li>
            <li>Bring valid photo ID</li>
            <li>Dress appropriately for verification</li>
          </ul>
          
          <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
          
          <p>Best regards,<br>
          BananaLink Verification Team</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} BananaLink. All rights reserved.</p>
          <p>22 Meklit Building, Addis Ababa, Ethiopia</p>
        </div>
      </div>
    `,
    text: `
      Appointment Confirmed!
      
      Dear ${data.fullName},
      
      Your ${data.verificationType} verification appointment has been confirmed.
      
      Appointment Details:
      Date: ${data.appointmentDate}
      Time: ${data.appointmentTime}
      Location: ${data.officeLocation}
      Verification Type: ${data.verificationType}
      
      Required Documents:
      ${data.documentsRequired.map(doc => `- ${doc}`).join('\n')}
      
      ${data.additionalNotes ? `Additional Notes: ${data.additionalNotes}` : ''}
      
      Important Instructions:
      - Arrive 15 minutes before your appointment
      - Bring original documents and photocopies
      - Bring valid photo ID
      - Dress appropriately for verification
      
      If you need to reschedule or cancel, please contact us at least 24 hours in advance.
      
      Best regards,
      BananaLink Verification Team
    `
  };
};

// Appointment status update template
const generateAppointmentStatusUpdateTemplate = (data) => {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${data.status === 'confirmed' ? '#10b981' : data.status === 'completed' ? '#3b82f6' : '#ef4444'}; color: white; padding: 20px; text-align: center;">
          <h1>Appointment ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear ${data.fullName},</p>
          
          <p>Your ${data.verificationType} verification appointment has been <strong>${data.status}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Appointment Details:</h3>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Date:</strong> ${data.appointmentDate}</p>
            <p><strong>Time:</strong> ${data.appointmentTime}</p>
            <p><strong>Location:</strong> ${data.officeLocation}</p>
            <p><strong>Verification Type:</strong> ${data.verificationType}</p>
          </div>
          
          ${data.adminNotes ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Administrator Notes:</h4>
              <p>${data.adminNotes}</p>
            </div>
          ` : ''}
          
          ${data.status === 'completed' ? `
            <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Verification Complete!</h4>
              <p>Your verification has been completed successfully. You can now access all verified features on our platform.</p>
            </div>
          ` : ''}
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>
          BananaLink Verification Team</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© ${new Date().getFullYear()} BananaLink. All rights reserved.</p>
          <p>22 Meklit Building, Addis Ababa, Ethiopia</p>
        </div>
      </div>
    `,
    text: `
      Appointment ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}
      
      Dear ${data.fullName},
      
      Your ${data.verificationType} verification appointment has been ${data.status}.
      
      Appointment Details:
      Status: ${data.status}
      Date: ${data.appointmentDate}
      Time: ${data.appointmentTime}
      Location: ${data.officeLocation}
      Verification Type: ${data.verificationType}
      
      ${data.adminNotes ? `Administrator Notes: ${data.adminNotes}` : ''}
      
      ${data.status === 'completed' ? 'Your verification has been completed successfully. You can now access all verified features on our platform.' : ''}
      
      If you have any questions, please contact our support team.
      
      Best regards,
      BananaLink Verification Team
    `
  };
};

// ==================== EMAIL SERVICE FUNCTIONS ====================

// Send OTP Email
exports.sendOTPEmail = async (email, name, otp, type = 'register') => {
  try {
    const subject = type === 'reset'
      ? 'Reset Your Banana Password'
      : 'Verify Your Banana Account';

    const html = type === 'reset'
      ? generateResetPasswordOTPTemplate(otp, name)
      : generateOTPTemplate(otp, name);

    const mailOptions = {
      from: `Banana <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send Password Reset Email
exports.sendPasswordResetEmail = async (email, name, resetToken) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: `Banana <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Banana Password',
      html: getPasswordResetTemplate(name, resetLink),
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Tender invitation functions
exports.sendTenderInvitationEmail = async (email, userName, tender, invitingUser) => {
  try {
    const accessLink = `${process.env.FRONTEND_URL}/tender/${tender._id}`;

    const mailOptions = {
      from: `Banana Tenders <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎯 Exclusive Invitation: ${tender.title} - ${tender.tenderId}`,
      html: generateTenderInvitationTemplate(
        userName,
        tender.title,
        tender.tenderId || tender._id,
        invitingUser.name || invitingUser.company?.name || 'A Company',
        accessLink
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log('Tender invitation email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending tender invitation email:', error);
    throw new Error('Failed to send tender invitation email');
  }
};

exports.sendTenderEmailInvitation = async (email, tender, invitingUser, token) => {
  try {
    const registerLink = `${process.env.FRONTEND_URL}/register?invitation=email&token=${token}&tender=${tender._id}`;

    const mailOptions = {
      from: `Banana Tenders <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🌟 Join Banana: Exclusive Tender Invitation - ${tender.title}`,
      html: generateTenderEmailInvitationTemplate(
        email,
        tender.title,
        tender.tenderId || tender._id,
        invitingUser.name || invitingUser.company?.name || 'A Company',
        registerLink,
        token
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log('Tender email invitation sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending tender email invitation:', error);
    throw new Error('Failed to send tender email invitation');
  }
};

exports.sendTenderShareLinkEmail = async (email, tender, invitingUser, shareLink) => {
  try {
    const mailOptions = {
      from: `Banana Tenders <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔗 Shared Tender: ${tender.title} - ${tender.tenderId}`,
      html: generateTenderShareLinkTemplate(
        email,
        tender.title,
        tender.tenderId || tender._id,
        invitingUser.name || invitingUser.company?.name || 'A Company',
        shareLink
      ),
    };

    await transporter.sendMail(mailOptions);
    console.log('Tender share link email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending tender share link email:', error);
    throw new Error('Failed to send tender share link email');
  }
};

// Appointment email functions
exports.sendAppointmentConfirmationEmail = async (emailData) => {
  try {
    const { html, text } = generateAppointmentConfirmationTemplate(emailData.data);

    const mailOptions = {
      from: `"BananaLink Verification" <${process.env.EMAIL_USER}>`,
      to: emailData.to,
      subject: emailData.subject || 'Appointment Confirmation - BananaLink',
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Appointment confirmation email sent to:', emailData.to);
    return info;
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    throw error;
  }
};

exports.sendAppointmentStatusUpdateEmail = async (emailData) => {
  try {
    const { html, text } = generateAppointmentStatusUpdateTemplate(emailData.data);

    const mailOptions = {
      from: `"BananaLink Verification" <${process.env.EMAIL_USER}>`,
      to: emailData.to,
      subject: emailData.subject || 'Appointment Status Update - BananaLink',
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Appointment status update email sent to:', emailData.to);
    return info;
  } catch (error) {
    console.error('Error sending appointment status update email:', error);
    throw error;
  }
};

// Generic email sending function
exports.sendEmail = async (emailData) => {
  try {
    // Map template names to generator functions
    const templateGenerators = {
      appointmentConfirmation: generateAppointmentConfirmationTemplate,
      appointmentStatusUpdate: generateAppointmentStatusUpdateTemplate,
      // Add more template mappings as needed
    };

    const generator = templateGenerators[emailData.template];
    if (!generator) {
      throw new Error(`Email template "${emailData.template}" not found`);
    }

    const { html, text } = generator(emailData.data);

    const mailOptions = {
      from: `"BananaLink Verification" <${process.env.EMAIL_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
// =====================================================================
// BID SYSTEM EMAIL FUNCTIONS
// Append these 7 exports to the BOTTOM of emailService.js
// =====================================================================

// ── Shared template helper ────────────────────────────────────────────
const bananaEmailWrapper = (subject, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #0A2540 0%, #1a3a5c 100%); padding: 28px 30px; text-align: center; color: white; }
    .header .logo { font-size: 28px; font-weight: bold; color: #F1BB03; letter-spacing: 1px; }
    .header .tagline { font-size: 13px; color: #ccd9e8; margin-top: 4px; }
    .body { padding: 30px; }
    .card { background: #f8f9fb; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .card h3 { margin-top: 0; color: #0A2540; }
    .label { font-weight: bold; color: #555; min-width: 150px; display: inline-block; }
    .value { color: #222; }
    .row { margin: 8px 0; }
    .btn { display: inline-block; padding: 13px 28px; background: #0A2540; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .badge { display: inline-block; background: #F1BB03; color: #0A2540; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .badge-success { background: #22c55e; color: #fff; }
    .badge-warning { background: #f59e0b; color: #fff; }
    .badge-danger  { background: #ef4444; color: #fff; }
    .badge-info    { background: #3b82f6; color: #fff; }
    .alert { border-left: 4px solid #F1BB03; background: #fffbeb; padding: 14px 18px; border-radius: 0 6px 6px 0; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 30px; background: #f0f4f8; color: #6b7280; font-size: 12px; }
    .footer a { color: #0A2540; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🍌 Banana</div>
      <div class="tagline">Professional Tender & Procurement Platform</div>
    </div>
    <div class="body">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Banana · Ethiopian Tender Marketplace</p>
      <p>This is an automated notification — please do not reply to this email.</p>
      <p style="margin-top:8px;font-size:11px;color:#9ca3af;">
        If you no longer wish to receive these notifications, you can update your preferences in your account settings.
      </p>
    </div>
  </div>
</body>
</html>
`;

// ── 1. sendBidReceivedEmail ───────────────────────────────────────────
/**
 * Sent to the TENDER OWNER when a new bid arrives.
 */
exports.sendBidReceivedEmail = async (
    ownerEmail,
    ownerName,
    bidderCompanyName,
    tenderTitle,
    tenderId,
    bidAmount,
    currency
) => {
    try {
        const tenderLink = `${process.env.FRONTEND_URL}/dashboard/company/tenders/tenders/${tenderId}`;
        const amountDisplay = bidAmount != null
            ? `${Number(bidAmount).toLocaleString()} ${currency || 'ETB'}`
            : '(Sealed — visible after reveal)';

        const html = bananaEmailWrapper(
            `New Bid Received: ${tenderTitle}`,
            `
            <h2 style="color:#0A2540;">📥 New Bid Received</h2>
            <p>Hello ${ownerName},</p>
            <p>A new bid has been submitted for your tender. Review it in your dashboard.</p>

            <div class="card">
              <h3>${tenderTitle}</h3>
              <div class="row"><span class="label">Bidder Company:</span> <span class="value">${bidderCompanyName}</span></div>
              <div class="row"><span class="label">Bid Amount:</span> <span class="value">${amountDisplay}</span></div>
              <div class="row"><span class="label">Submitted At:</span> <span class="value">${new Date().toLocaleString('en-GB')}</span></div>
            </div>

            <div style="text-align:center;">
              <a href="${tenderLink}" class="btn">View Bid in Dashboard</a>
            </div>
            `
        );

        await transporter.sendMail({
            from: `Banana Tenders <${process.env.EMAIL_USER}>`,
            to: ownerEmail,
            subject: `📥 New Bid Received: ${tenderTitle}`,
            html
        });
        console.log(`✅ Bid received email sent to: ${ownerEmail}`);
        return true;
    } catch (error) {
        console.error('❌ sendBidReceivedEmail error:', error);
        throw new Error('Failed to send bid received email');
    }
};

// ── 2. sendBidUnderReviewEmail ────────────────────────────────────────
/**
 * Sent to the BIDDER when the owner marks their bid as under review.
 */
exports.sendBidUnderReviewEmail = async (
    bidderEmail,
    bidderName,
    tenderTitle,
    tenderId
) => {
    try {
        const tenderLink = `${process.env.FRONTEND_URL}/dashboard/company/tenders/tenders/${tenderId}`;

        const html = bananaEmailWrapper(
            `Bid Under Review: ${tenderTitle}`,
            `
            <h2 style="color:#0A2540;">🔍 Your Bid Is Under Review</h2>
            <p>Hello ${bidderName},</p>
            <p>The tender owner has started reviewing your bid for the following tender:</p>

            <div class="card">
              <h3>${tenderTitle}</h3>
              <div class="row"><span class="label">Status:</span> <span class="badge badge-info">Under Review</span></div>
              <div class="row"><span class="label">Updated At:</span> <span class="value">${new Date().toLocaleString('en-GB')}</span></div>
            </div>

            <div class="alert">
              <strong>What this means:</strong> Your bid has passed the initial screening and is now under formal evaluation. You will be notified of the final decision.
            </div>

            <div style="text-align:center;">
              <a href="${tenderLink}" class="btn">View Tender Details</a>
            </div>
            `
        );

        await transporter.sendMail({
            from: `Banana Tenders <${process.env.EMAIL_USER}>`,
            to: bidderEmail,
            subject: `🔍 Your Bid Is Under Review: ${tenderTitle}`,
            html
        });
        console.log(`✅ Bid under review email sent to: ${bidderEmail}`);
        return true;
    } catch (error) {
        console.error('❌ sendBidUnderReviewEmail error:', error);
        throw new Error('Failed to send bid under review email');
    }
};

// ── 3. sendBidShortlistedEmail ────────────────────────────────────────
/**
 * Sent to the BIDDER when they are shortlisted.
 */
exports.sendBidShortlistedEmail = async (
    bidderEmail,
    bidderName,
    tenderTitle,
    tenderId
) => {
    try {
        const tenderLink = `${process.env.FRONTEND_URL}/dashboard/company/tenders/tenders/${tenderId}`;

        const html = bananaEmailWrapper(
            `Bid Shortlisted: ${tenderTitle}`,
            `
            <h2 style="color:#0A2540;">⭐ Your Bid Has Been Shortlisted!</h2>
            <p>Hello ${bidderName},</p>
            <p>Congratulations! Your bid for the tender below has been shortlisted for final evaluation.</p>

            <div class="card">
              <h3>${tenderTitle}</h3>
              <div class="row"><span class="label">Status:</span> <span class="badge badge-warning">Shortlisted</span></div>
              <div class="row"><span class="label">Updated At:</span> <span class="value">${new Date().toLocaleString('en-GB')}</span></div>
            </div>

            <div class="alert">
              <strong>Next Steps:</strong> You are now in the final shortlist. The tender owner may contact you for further discussions or clarifications. Stay available and responsive.
            </div>

            <div style="text-align:center;">
              <a href="${tenderLink}" class="btn">View Tender Details</a>
            </div>
            `
        );

        await transporter.sendMail({
            from: `Banana Tenders <${process.env.EMAIL_USER}>`,
            to: bidderEmail,
            subject: `⭐ Your Bid Has Been Shortlisted: ${tenderTitle}`,
            html
        });
        console.log(`✅ Bid shortlisted email sent to: ${bidderEmail}`);
        return true;
    } catch (error) {
        console.error('❌ sendBidShortlistedEmail error:', error);
        throw new Error('Failed to send bid shortlisted email');
    }
};

// ── 4. sendBidAwardedEmail ────────────────────────────────────────────
/**
 * Sent to the BIDDER when they are awarded the contract.
 */
exports.sendBidAwardedEmail = async (
    bidderEmail,
    bidderName,
    tenderTitle,
    tenderId,
    bidAmount,
    currency,
    performanceBondRequired = false,
    performanceBondPercentage = null
) => {
    try {
        const tenderLink = `${process.env.FRONTEND_URL}/dashboard/company/tenders/tenders/${tenderId}`;
        const amountDisplay = `${Number(bidAmount).toLocaleString()} ${currency || 'ETB'}`;

        const bondSection = performanceBondRequired
            ? `
            <div class="alert" style="border-left-color:#ef4444;">
              <strong>⚠️ Performance Bond Required</strong><br>
              This contract requires a performance bond of 
              <strong>${performanceBondPercentage != null ? performanceBondPercentage + '%' : 'the agreed percentage'}</strong> 
              of the contract value. Please arrange this with your bank promptly and submit the bond document through the platform.
            </div>
            `
            : '';

        const html = bananaEmailWrapper(
            `Contract Awarded: ${tenderTitle}`,
            `
            <h2 style="color:#0A2540;">🏆 Congratulations — You've Been Awarded the Contract!</h2>
            <p>Hello ${bidderName},</p>
            <p>We are delighted to inform you that your bid for the following tender has been selected for contract award.</p>

            <div class="card">
              <h3>${tenderTitle}</h3>
              <div class="row"><span class="label">Status:</span> <span class="badge badge-success">Awarded</span></div>
              <div class="row"><span class="label">Awarded Amount:</span> <span class="value">${amountDisplay}</span></div>
              <div class="row"><span class="label">Awarded At:</span> <span class="value">${new Date().toLocaleString('en-GB')}</span></div>
            </div>

            ${bondSection}

            <div class="alert">
              <strong>Next Steps:</strong> The tender owner will contact you to finalise the contract terms. Please review the tender documentation and be prepared to sign within the required timeframe.
            </div>

            <div style="text-align:center;">
              <a href="${tenderLink}" class="btn">View Contract Details</a>
            </div>
            `
        );

        await transporter.sendMail({
            from: `Banana Tenders <${process.env.EMAIL_USER}>`,
            to: bidderEmail,
            subject: `🏆 Contract Awarded: ${tenderTitle}`,
            html
        });
        console.log(`✅ Bid awarded email sent to: ${bidderEmail}`);
        return true;
    } catch (error) {
        console.error('❌ sendBidAwardedEmail error:', error);
        throw new Error('Failed to send bid awarded email');
    }
};

// ── 5. sendBidRejectedEmail ───────────────────────────────────────────
/**
 * Sent to the BIDDER when their bid is rejected.
 */
exports.sendBidRejectedEmail = async (
    bidderEmail,
    bidderName,
    tenderTitle,
    tenderId,
    ownerNotes = ''
) => {
    try {
        const tenderLink = `${process.env.FRONTEND_URL}/dashboard/company/tenders/tenders/${tenderId}`;

        const notesSection = ownerNotes
            ? `
            <div class="card" style="background:#fff5f5; border-color:#fecaca;">
              <h3 style="color:#b91c1c;">Feedback from the Tender Owner</h3>
              <p style="color:#555;">${ownerNotes}</p>
            </div>
            `
            : '';

        const html = bananaEmailWrapper(
            `Bid Outcome: ${tenderTitle}`,
            `
            <h2 style="color:#0A2540;">Bid Evaluation Outcome</h2>
            <p>Hello ${bidderName},</p>
            <p>Thank you for participating in the tender below. After careful evaluation, we regret to inform you that your bid was not selected on this occasion.</p>

            <div class="card">
              <h3>${tenderTitle}</h3>
              <div class="row"><span class="label">Status:</span> <span class="badge badge-danger">Not Selected</span></div>
              <div class="row"><span class="label">Decision At:</span> <span class="value">${new Date().toLocaleString('en-GB')}</span></div>
            </div>

            ${notesSection}

            <div class="alert">
              We encourage you to continue participating in future tenders on Banana. Experience and feedback help you improve future proposals.
            </div>

            <div style="text-align:center;">
              <a href="${process.env.FRONTEND_URL}/dashboard/company/tenders/tenders" class="btn">Browse New Tenders</a>
            </div>
            `
        );

        await transporter.sendMail({
            from: `Banana Tenders <${process.env.EMAIL_USER}>`,
            to: bidderEmail,
            subject: `Bid Evaluation Outcome: ${tenderTitle}`,
            html
        });
        console.log(`✅ Bid rejected email sent to: ${bidderEmail}`);
        return true;
    } catch (error) {
        console.error('❌ sendBidRejectedEmail error:', error);
        throw new Error('Failed to send bid rejected email');
    }
};

// ── 6. sendBidWithdrawnEmail ──────────────────────────────────────────
/**
 * Sent to the TENDER OWNER when a bidder withdraws their bid.
 */
exports.sendBidWithdrawnEmail = async (
    ownerEmail,
    ownerName,
    bidderCompanyName,
    tenderTitle,
    tenderId
) => {
    try {
        const tenderLink = `${process.env.FRONTEND_URL}/dashboard/company/tenders/tenders/${tenderId}`;

        const html = bananaEmailWrapper(
            `Bid Withdrawn: ${tenderTitle}`,
            `
            <h2 style="color:#0A2540;">📤 A Bid Has Been Withdrawn</h2>
            <p>Hello ${ownerName},</p>
            <p>A bidder has withdrawn their bid for your tender. The bid count has been updated accordingly.</p>

            <div class="card">
              <h3>${tenderTitle}</h3>
              <div class="row"><span class="label">Withdrawn By:</span> <span class="value">${bidderCompanyName}</span></div>
              <div class="row"><span class="label">Withdrawn At:</span> <span class="value">${new Date().toLocaleString('en-GB')}</span></div>
            </div>

            <div style="text-align:center;">
              <a href="${tenderLink}" class="btn">View Tender Dashboard</a>
            </div>
            `
        );

        await transporter.sendMail({
            from: `Banana Tenders <${process.env.EMAIL_USER}>`,
            to: ownerEmail,
            subject: `📤 Bid Withdrawn: ${tenderTitle}`,
            html
        });
        console.log(`✅ Bid withdrawn email sent to: ${ownerEmail}`);
        return true;
    } catch (error) {
        console.error('❌ sendBidWithdrawnEmail error:', error);
        throw new Error('Failed to send bid withdrawn email');
    }
};

// ── 7. sendBidsRevealedEmail ──────────────────────────────────────────
/**
 * Sent to ALL BIDDERS when the tender owner reveals sealed bids.
 * Call this once per bidder after the reveal operation completes.
 */
exports.sendBidsRevealedEmail = async (
    bidderEmail,
    bidderName,
    tenderTitle,
    tenderId,
    bidStatus,
    bidAmount,
    currency
) => {
    try {
        const tenderLink = `${process.env.FRONTEND_URL}/dashboard/company/tenders/tenders/${tenderId}`;
        const amountDisplay = bidAmount != null
            ? `${Number(bidAmount).toLocaleString()} ${currency || 'ETB'}`
            : 'N/A';

        const statusBadges = {
            submitted:    '<span class="badge badge-info">Submitted</span>',
            under_review: '<span class="badge badge-info">Under Review</span>',
            shortlisted:  '<span class="badge badge-warning">Shortlisted</span>',
            awarded:      '<span class="badge badge-success">Awarded</span>',
            rejected:     '<span class="badge badge-danger">Not Selected</span>',
            withdrawn:    '<span class="badge">Withdrawn</span>'
        };

        const statusDisplay = statusBadges[bidStatus] || `<span class="badge">${bidStatus}</span>`;

        const html = bananaEmailWrapper(
            `Bids Have Been Revealed: ${tenderTitle}`,
            `
            <h2 style="color:#0A2540;">🔓 Sealed Bids Have Been Revealed</h2>
            <p>Hello ${bidderName},</p>
            <p>The sealed bids for the following tender have now been revealed by the tender owner. You can view all bid results in your dashboard.</p>

            <div class="card">
              <h3>${tenderTitle}</h3>
              <div class="row"><span class="label">Your Bid Amount:</span> <span class="value">${amountDisplay}</span></div>
              <div class="row"><span class="label">Your Bid Status:</span> <span class="value">${statusDisplay}</span></div>
              <div class="row"><span class="label">Revealed At:</span> <span class="value">${new Date().toLocaleString('en-GB')}</span></div>
            </div>

            <div class="alert">
              All participating bidders can now see the submitted bid amounts. The tender owner will communicate further decisions regarding award or rejection.
            </div>

            <div style="text-align:center;">
              <a href="${tenderLink}" class="btn">View Bid Results</a>
            </div>
            `
        );

        await transporter.sendMail({
            from: `Banana Tenders <${process.env.EMAIL_USER}>`,
            to: bidderEmail,
            subject: `🔓 Bids Revealed: ${tenderTitle}`,
            html
        });
        console.log(`✅ Bids revealed email sent to: ${bidderEmail}`);
        return true;
    } catch (error) {
        console.error('❌ sendBidsRevealedEmail error:', error);
        throw new Error('Failed to send bids revealed email');
    }
};
