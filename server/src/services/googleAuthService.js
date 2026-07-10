// backend/src/services/googleAuthService.js
const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // Redirect URI for web flow (if needed later)
  process.env.GOOGLE_CALLBACK_URL
);

/**
 * Verify Google ID token and return user info
 * @param {string} idToken - Google ID token from frontend
 * @returns {Object} Verified user data
 */
async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: [
        process.env.GOOGLE_CLIENT_ID,
        // Add mobile client IDs here if different
        process.env.GOOGLE_IOS_CLIENT_ID, // For iOS
        process.env.GOOGLE_ANDROID_CLIENT_ID, // For Android
      ].filter(Boolean),
    });

    const payload = ticket.getPayload();

    // Return standardized user data
    return {
      success: true,
      data: {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified,
        givenName: payload.given_name,
        familyName: payload.family_name,
        locale: payload.locale,
      },
    };
  } catch (error) {
    console.error('Google token verification failed:', error.message);
    return {
      success: false,
      message: 'Invalid Google token',
      error: error.message,
    };
  }
}

/**
 * Get Google user info using access token (for mobile flow)
 * @param {string} accessToken - Google access token
 * @returns {Object} User profile data
 */
async function getGoogleUserInfo(accessToken) {
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google user info');
    }

    const userInfo = await response.json();

    return {
      success: true,
      data: {
        googleId: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        emailVerified: userInfo.email_verified,
        givenName: userInfo.given_name,
        familyName: userInfo.family_name,
        locale: userInfo.locale,
      },
    };
  } catch (error) {
    console.error('Google user info fetch failed:', error.message);
    return {
      success: false,
      message: 'Failed to get Google user info',
      error: error.message,
    };
  }
}

module.exports = {
  verifyGoogleToken,
  getGoogleUserInfo,
};