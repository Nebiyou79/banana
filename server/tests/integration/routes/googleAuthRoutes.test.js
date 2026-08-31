const request = require('supertest');
const { getApp } = require('../../helpers/app');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

const { OAuth2Client } = require('google-auth-library');

describe('googleAuthRoutes integration', () => {
  const app = getApp();
  let mockVerifyIdToken;

  beforeEach(() => {
    mockVerifyIdToken = jest.fn();
    OAuth2Client.mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    }));
  });

  describe('POST /api/v1/auth/google/verify', () => {
    it('returns 400 when credential is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google/verify')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        message: 'Google credential token is required',
      });
    });

    it('returns 401 for invalid Google credential', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const res = await request(app)
        .post('/api/v1/auth/google/verify')
        .send({ credential: 'invalid-google-token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid google token/i);
      expect(res.body.message).toContain('could not verify');
    });
  });
});
