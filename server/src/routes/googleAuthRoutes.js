// backend/src/routes/googleAuthRoutes.js
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Google token verification endpoint
router.post('/verify', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required'
      });
    }

    let email, name, picture, email_verified;

    // Try to verify as ID token first
    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      email_verified = payload.email_verified;
    } catch (idTokenError) {
      // If ID token verification fails, try as access token
      console.log('ID token verification failed, trying access token...');
      
      try {
        const response = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${credential}` },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch Google user info');
        }

        const userInfo = await response.json();
        email = userInfo.email;
        name = userInfo.name;
        picture = userInfo.picture;
        email_verified = userInfo.email_verified;
      } catch (accessTokenError) {
        console.error('Access token verification also failed:', accessTokenError.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid Google token - could not verify with any configured client'
        });
      }
    }

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Google email not verified. Please verify your email with Google first.'
      });
    }

    // Find or create user (same as before)
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: name || email.split('@')[0],
        email,
        avatar: picture || null,
        emailVerified: true,
        role: 'candidate',
        verificationStatus: 'partial',
        profileCompleted: false,
      });
      await user.save();
      console.log('New Google user created:', user._id, email);
    } else {
      const updates = {};
      if (!user.avatar && picture) updates.avatar = picture;
      if (!user.emailVerified) {
        updates.emailVerified = true;
        if (user.verificationStatus === 'none') {
          updates.verificationStatus = 'partial';
        }
      }
      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(user._id, { $set: updates });
        user = await User.findById(user._id);
      }
      console.log('Existing Google user logged in:', user._id, email);
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          verificationStatus: user.verificationStatus,
          profileCompleted: user.profileCompleted,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          skills: user.skills || [],
          referralCode: user.referralCode,
          rewardPoints: user.rewardPoints || 0,
          rewardBalance: user.rewardBalance || 0,
        },
        token,
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;