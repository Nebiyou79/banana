const request = require('supertest');
const promoCodeController = require('../../../src/controllers/promoCodeController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { mockReq, mockRes } = require('../../helpers/mockHttp');
const PromoCode = require('../../../src/models/PromoCode');

describe('promoCodeController integration', () => {
  const app = getApp();

  describe('POST /api/v1/promo-codes/validate', () => {
    it('returns 400 when code missing', async () => {
      const res = await request(app).post('/api/v1/promo-codes/validate').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    it('returns 400 for invalid promo code', async () => {
      const res = await request(app)
        .post('/api/v1/promo-codes/validate')
        .send({ code: 'INVALIDCODE123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('validates active promo code', async () => {
      const owner = await createUser();
      const promo = await PromoCode.create({
        code: `VALID${Date.now()}`.slice(0, 12).toUpperCase(),
        userId: owner._id,
        type: 'referral',
        isActive: true,
        validFrom: new Date(Date.now() - 86400000),
        validUntil: new Date(Date.now() + 86400000 * 30),
      });

      const res = await request(app)
        .post('/api/v1/promo-codes/validate')
        .send({ code: promo.code });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(promo.code);
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

  describe('POST /api/v1/promo-codes/generate', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/promo-codes/generate');
      expect(res.status).toBe(401);
    });

    it('generates referral code for authenticated user on first request', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/promo-codes/generate')
        .set(authHeader(user._id));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBeTruthy();
    });

    it('returns existing referral code on subsequent requests', async () => {
      const user = await createUser();
      const first = await request(app)
        .post('/api/v1/promo-codes/generate')
        .set(authHeader(user._id));

      const res = await request(app)
        .post('/api/v1/promo-codes/generate')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(first.body.data.code);
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
      expect(res.body.data.stats).toBeDefined();
    });
  });

  describe('generateMyReferralCode (direct)', () => {
    it('returns existing code when already generated', async () => {
      const user = await createUser();
      const promo = await PromoCode.create({
        code: `EXIST${Date.now()}`.slice(0, 12).toUpperCase(),
        userId: user._id,
        type: 'referral',
      });

      const req = mockReq({ user: { userId: user._id } });
      const res = mockRes();

      await promoCodeController.generateMyReferralCode(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.code).toBe(promo.code);
    });
  });

  describe('getMyReferralStats (direct)', () => {
    it('returns referral stats via controller', async () => {
      const user = await createUser();
      const req = mockReq({ user: { userId: user._id }, query: {} });
      const res = mockRes();

      await promoCodeController.getMyReferralStats(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('admin promo routes', () => {
    it('requires admin for admin listing', async () => {
      const user = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/promo-codes/admin/all')
        .set(authHeader(user._id));

      expect(res.status).toBe(403);
    });

    it('returns all promo codes for admin', async () => {
      const admin = await createUser({ role: 'admin' });
      const res = await request(app)
        .get('/api/v1/promo-codes/admin/all')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
