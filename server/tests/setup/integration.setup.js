jest.mock('../../src/middleware/rateLimiter', () => {
  const pass = (_req, _res, next) => next();
  return {
    generalLimiter: pass,
    authLimiter: pass,
    adminLimiter: pass,
    socialLimiter: pass,
    followListLimiter: pass,
    followStatusLimiter: pass,
  };
});

jest.mock('../../src/services/emailService', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendProposalEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../src/services/pushService', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true }),
  sendToUser: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../src/services/firebaseService', () => ({
  sendMulticast: jest.fn().mockResolvedValue({ successCount: 1 }),
  initializeFirebase: jest.fn(),
}));

require('./unit.setup');
