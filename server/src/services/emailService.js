const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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

// Update sendOTPEmail function to handle different types
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
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send verification email');
  }
};

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
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};