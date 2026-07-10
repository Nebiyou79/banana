// server/src/services/firebaseService.js
let firebaseApp = null;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    const admin = require('firebase-admin');
    
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (parseErr) {
        console.warn('⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT_JSON:', parseErr.message);
        return null;
      }
    } else {
      try {
        serviceAccount = require('../config/firebase-service-account.json');
      } catch (fileErr) {
        console.warn('⚠️ Firebase config file not found:', fileErr.message);
        return null;
      }
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase Admin initialized');
    return firebaseApp;
  } catch (err) {
    console.warn('⚠️ Firebase not configured:', err.message);
    return null;
  }
};

exports.send = async (fcmToken, payload) => {
  const app = initFirebase();
  if (!app) return { success: false, error: 'Firebase not configured' };

  try {
    const admin = require('firebase-admin');
    const message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data
        ? Object.entries(payload.data).reduce((acc, [k, v]) => {
            acc[k] = String(v || '');
            return acc;
          }, {})
        : {},
      android: {
        priority: payload.priority === 'critical' ? 'high' : 'normal',
        notification: {
          icon: 'ic_notification',
          color: '#F1BB03',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (err) {
    console.error('Firebase send error:', err.message);
    return { success: false, error: err.message };
  }
};