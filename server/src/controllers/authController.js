// controllers/authController.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require("bcrypt");
const PasswordReset = require('../models/PasswordReset');
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// NEW: Import promo code utilities and models
const {
  validatePromoCode,
  applyPromoCodeToRegistration,
  completeReferralAfterVerification,
  generateReferralCodeForUser
} = require('../utils/promoCodeUtils');
const PromoCode = require('../models/PromoCode');
const ReferralHistory = require('../models/ReferralHistory');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const MAX_LOGIN_ATTEMPTS = process.env.MAX_LOGIN_ATTEMPTS ? parseInt(process.env.MAX_LOGIN_ATTEMPTS) : 5;

// Generate OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Validation middleware (to be used in routes)
exports.validateRegistration = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Register new user with OTP verification and promo code support
exports.registerUser = async (req, res, next) => {
  try {
    // ADDED: promoCode to destructuring
    const { name, email, password, confirmPassword, role, promoCode } = req.body;

    console.log('Registration attempt:', { name, email, role, hasPromoCode: !!promoCode });

    // Validate confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Validate role
    const validRoles = ['candidate', 'freelancer', 'company', 'organization'];
    if (role && !validRoles.includes(role)) {
      console.log('Invalid role:', role);
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing required fields:', { name, email, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // NEW: Validate promo code if provided
    let validatedPromo = null;
    if (promoCode) {
      const result = await validatePromoCode(promoCode);
      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: `Invalid promo code: ${result.message}`
        });
      }
      validatedPromo = result.promoCode;
    }

    // Create new user (not verified yet) - ADDED referral fields
    const newUser = new User({
      name,
      email,
      passwordHash: password,
      role: role || 'candidate',
      emailVerified: false,
      // NEW: Add referral info if promo code was provided
      referredViaCode: validatedPromo ? validatedPromo.code : null,
      referredBy: validatedPromo ? validatedPromo.userId : null
    });

    await newUser.save();
    console.log('User created successfully:', newUser._id);

    // NEW: If promo code was used, create referral history
    if (validatedPromo) {
      try {
        await applyPromoCodeToRegistration(
          validatedPromo,
          newUser._id,
          {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            registrationSource: 'web',
            browser: req.get('User-Agent'),
            device: req.headers['sec-ch-ua-platform'] || 'unknown'
          }
        );
        console.log('Promo code applied successfully for user:', newUser._id);
      } catch (referralError) {
        console.error('Error applying promo code:', referralError);
        // Don't fail registration if referral fails
      }
    }

    // Generate and send OTP
    const otp = generateOTP();
    const otpRecord = new OTP({
      email,
      otp,
      type: 'register',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await otpRecord.save();
    await sendOTPEmail(email, name, otp, 'register');

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      data: {
        email,
        requiresVerification: true,
        // NEW: Return promo code info if used
        promoCodeApplied: validatedPromo ? {
          code: validatedPromo.code,
          benefits: validatedPromo.newUserBenefits
        } : null
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify OTP with referral completion
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const otpRecord = await OTP.findOne({ email, otp, type: 'register' });
    if (!otpRecord || !otpRecord.isValid()) {
      await otpRecord?.incrementAttempt();
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark email as verified
    await User.findOneAndUpdate({ email }, {
      emailVerified: true,
      verificationStatus: 'partial' // Update verification status
    });

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Get user and generate token
    const user = await User.findOne({ email });

    // NEW: If user was referred, complete the referral
    if (user.referredBy) {
      try {
        await completeReferralAfterVerification(user._id);
        console.log('Referral completed for user:', user._id);
      } catch (referralError) {
        console.error('Error completing referral:', referralError);
        // Don't fail verification
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: true,
          verificationStatus: user.verificationStatus,
          profileCompleted: user.profileCompleted,
          // NEW: Include referral info
          referralCode: user.referralCode,
          referredBy: user.referredBy,
          rewardPoints: user.rewardPoints || 0,
          rewardBalance: user.rewardBalance || 0
        },
        token,
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Resend OTP
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Delete any existing OTPs
    await OTP.deleteMany({ email, type: 'register' });

    // Generate new OTP
    const otp = generateOTP();
    const otpRecord = new OTP({
      email,
      otp,
      type: 'register',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await otpRecord.save();
    await sendOTPEmail(email, user.name, otp, 'register');

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
};

// Enhanced Login with security features
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked. Try again later.'
      });
    }

    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'EMAIL_VERIFICATION_REQUIRED',
        requiresVerification: true,
        email: user.email
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await user.incrementLoginAttempts();

      const attemptsLeft = MAX_LOGIN_ATTEMPTS - (user.loginAttempts + 1);

      return res.status(401).json({
        success: false,
        message: `Invalid credentials. ${attemptsLeft > 0
            ? `${attemptsLeft} attempts left`
            : 'Account will be locked'
          }`
      });
    }

    // SAFE UPDATE (no validation)
    await User.updateOne(
      { _id: user._id },
      {
        $set: { lastLogin: new Date(), loginAttempts: 0 },
        $unset: { lockUntil: 1 }
      }
    );

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          verificationStatus: user.verificationStatus,
          profileCompleted: user.profileCompleted,
          // NEW: Include referral info in login response
          referralCode: user.referralCode,
          rewardPoints: user.rewardPoints || 0,
          rewardBalance: user.rewardBalance || 0
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// NEW: Generate referral code for authenticated user
exports.generateReferralCode = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user already has a code
    const existingPromo = await PromoCode.findOne({ userId, type: 'referral' });
    if (existingPromo) {
      return res.json({
        success: true,
        message: 'You already have a referral code',
        data: {
          code: existingPromo.code,
          usedCount: existingPromo.usedCount,
          maxUses: existingPromo.maxUses,
          shareableLink: `${process.env.FRONTEND_URL}/register?ref=${existingPromo.code}`
        }
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new code
    const promoCode = await generateReferralCodeForUser(userId, user.name);

    res.status(201).json({
      success: true,
      message: 'Referral code generated successfully',
      data: {
        code: promoCode.code,
        usedCount: promoCode.usedCount,
        maxUses: promoCode.maxUses,
        shareableLink: `${process.env.FRONTEND_URL}/register?ref=${promoCode.code}`
      }
    });
  } catch (error) {
    console.error('Error generating referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate referral code'
    });
  }
};

// NEW: Get referral statistics for authenticated user
exports.getMyReferralStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .select('name email referralCode referralStats rewardPoints rewardBalance');

    const promoCode = await PromoCode.findOne({ userId, type: 'referral' });

    // Get referral history
    const referrals = await ReferralHistory.find({ referrerId: userId })
      .populate('referredUserId', 'name email createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    const totalReferrals = await ReferralHistory.countDocuments({ referrerId: userId });
    const completedReferrals = await ReferralHistory.countDocuments({
      referrerId: userId,
      status: 'completed'
    });

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode || promoCode?.code,
        stats: {
          totalReferrals: user.referralStats?.totalReferrals || 0,
          completedReferrals: user.referralStats?.completedReferrals || 0,
          pendingReferrals: user.referralStats?.pendingReferrals || 0,
          successRate: totalReferrals > 0
            ? ((completedReferrals / totalReferrals) * 100).toFixed(1)
            : 0,
          rewardPoints: user.rewardPoints || 0,
          rewardBalance: user.rewardBalance || 0,
          promoUsedCount: promoCode?.usedCount || 0,
          promoMaxUses: promoCode?.maxUses || 100
        },
        recentReferrals: referrals.map(ref => ({
          id: ref._id,
          user: ref.referredUserId?.name || 'Unknown',
          email: ref.referredUserId?.email,
          status: ref.status,
          date: ref.createdAt,
          rewardEarned: ref.rewardDetails?.referrerReward?.points || 0
        })),
        shareableLink: `${process.env.FRONTEND_URL}/register?ref=${user.referralCode || promoCode?.code}`
      }
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referral statistics'
    });
  }
};

// Forgot password - Send OTP instead of token
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If the email exists, a reset OTP has been sent'
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpRecord = new OTP({
      email,
      otp,
      type: 'reset-password',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await otpRecord.save();

    // Send OTP email for password reset
    await sendOTPEmail(email, user.name, otp, 'reset');

    res.json({
      success: true,
      message: 'If the email exists, a reset OTP has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset'
    });
  }
};

// Verify OTP for password reset
exports.verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'reset-password'
    });

    if (!otpRecord || !otpRecord.isValid()) {
      await otpRecord?.incrementAttempt();
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Generate a reset token for the frontend to use
    const resetToken = PasswordReset.generateToken();
    const resetRecord = new PasswordReset({
      email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    await resetRecord.save();

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        resetToken,
        email
      }
    });

  } catch (error) {
    console.error('Reset OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, password, and confirmation are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const resetRecord = await PasswordReset.findOne({ token });
    if (!resetRecord || !resetRecord.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update user password
    const user = await User.findOne({ email: resetRecord.email });
    user.passwordHash = password;
    await user.save();

    // Mark token as used
    resetRecord.used = true;
    await resetRecord.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// Logout
exports.logoutUser = (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
};

// Get current user (UPDATED with referral fields)
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get referral code if exists
    let referralCode = user.referralCode;
    if (!referralCode) {
      const promoCode = await PromoCode.findOne({ userId: user._id, type: 'referral' });
      referralCode = promoCode?.code;
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          verificationStatus: user.verificationStatus,
          profileCompleted: user.profileCompleted,
          lastLogin: user.lastLogin,
          // NEW: Referral fields
          referralCode: referralCode,
          referredBy: user.referredBy,
          rewardPoints: user.rewardPoints || 0,
          rewardBalance: user.rewardBalance || 0,
          referralStats: user.referralStats || {
            totalReferrals: 0,
            completedReferrals: 0,
            pendingReferrals: 0
          }
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create admin user (protected - only existing admins can create new admins)
exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const adminUser = new User({
      name,
      email,
      passwordHash,
      role: 'admin',
      profileCompleted: true,
      emailVerified: true,
      isActive: true
    });

    await adminUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: adminUser._id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all admin users
exports.getAdmins = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const admins = await User.find({ role: 'admin' })
      .select('-passwordHash')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ role: 'admin' });

    res.json({
      success: true,
      data: admins,
      pagination: {
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        total,
        hasNext: Number(page) < Math.ceil(total / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error getting admins:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};