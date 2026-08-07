const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('promoCodeController integration', () => {
  const app = getApp();

  describe('POST /api/v1/promo-codes/validate', () => {
    it('returns 400 for invalid promo code', async () => {
      const res = await request(app)
        .post('/api/v1/promo-codes/validate')
        .send({ code: 'INVALIDCODE123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/promo-codes/leaderboard', () => {
    it('returns referral leaderboard publicly', async () => {
      const res = await request(app).get('/api/v1/promo-codes/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/promo-codes/my-stats', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/promo-codes/my-stats');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns stats for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/promo-codes/my-stats')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
