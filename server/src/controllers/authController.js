const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require("bcrypt");
const PasswordReset = require('../models/PasswordReset');
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const ACCOUNT_LOCK_TIME = parseInt(process.env.ACCOUNT_LOCK_TIME) || 15; // minutes

// Generate OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Register new user with OTP verification
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    console.log('Registration attempt:', { name, email, role });

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
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
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

    // Create new user (not verified yet)
    const newUser = new User({
      name,
      email,
      passwordHash: password,
      role: role || 'candidate',
      emailVerified: false,
    });

    await newUser.save();
    console.log('User created successfully:', newUser._id);

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
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

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
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

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

    const user = await User.findOne({ email }).select('+passwordHash');
    
    // Check if user exists and is active
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(401).json({
        success: false,
        message: `Account locked. Try again in ${lockTimeLeft} minutes.`
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first',
        requiresVerification: true,
        email: user.email
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - (user.loginAttempts + 1);
      
      return res.status(401).json({ 
        success: false, 
        message: `Invalid credentials. ${attemptsLeft > 0 ? `${attemptsLeft} attempts left` : 'Account will be locked'}`
      });
    }

    // Reset login attempts on successful login
    await User.findByIdAndUpdate(user._id, {
      loginAttempts: 0,
      lockUntil: null
    });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
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
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Forgot password - Send OTP instead of token
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

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
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

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
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

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

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
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
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }};
  // Create admin user (protected - only existing admins can create new admins)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
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
      verified: true,
      status: 'active'
    });

    await adminUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: adminUser._id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'CREATE',
      targetModel: 'User',
      targetId: adminUser._id,
      changes: { email, role: 'admin' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      },
      token
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all admin users
exports.getAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const admins = await User.find({ role: 'admin' })
      .select('-passwordHash')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments({ role: 'admin' });
    
    res.json({
      admins,
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};