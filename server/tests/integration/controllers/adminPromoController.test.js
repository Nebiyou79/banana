const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createAdmin, createCandidate } = require('../../helpers/factories/userFactory');
const PromoCode = require('../../../src/models/PromoCode');

describe('adminPromoController integration', () => {
  const app = getApp();

  describe('GET /api/v1/promo-codes/admin/all', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/promo-codes/admin/all');
      expect(res.status).toBe(401);
    });

    it('requires admin authentication', async () => {
      const user = await createCandidate();
      const res = await request(app)
        .get('/api/v1/promo-codes/admin/all')
        .set(authHeader(user._id));

      expect(res.status).toBe(403);
    });

    it('returns promo codes for admin', async () => {
      const admin = await createAdmin();
      const res = await request(app)
        .get('/api/v1/promo-codes/admin/all')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      assertNoPassword(res.body);
    });

    it('filters promo codes by search query', async () => {
      const admin = await createAdmin();
      const code = `SEARCH${Date.now()}`;
      await PromoCode.create({
        code,
        userId: admin._id,
        type: 'campaign',
        createdBy: admin._id,
      });

      const res = await request(app)
        .get(`/api/v1/promo-codes/admin/all?search=${code}`)
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.data.some((p) => p.code === code)).toBe(true);
    });
  });

  describe('POST /api/v1/promo-codes/admin/create', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/promo-codes/admin/create')
        .send({ code: 'NOAUTH' });

      expect(res.status).toBe(401);
    });

    it('requires admin role', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .post('/api/v1/promo-codes/admin/create')
        .set(authHeader(candidate._id))
        .send({ code: 'CANDIDATE' });

      expect(res.status).toBe(403);
    });

    it('returns 400 when code is missing', async () => {
      const admin = await createAdmin();
      const res = await request(app)
        .post('/api/v1/promo-codes/admin/create')
        .set(authHeader(admin._id))
        .send({ type: 'campaign' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Code is required');
    });

    it('returns 409 when promo code already exists', async () => {
      const admin = await createAdmin();
      const code = `DUPE${Date.now()}`;
      await PromoCode.create({
        code,
        userId: admin._id,
        type: 'campaign',
        createdBy: admin._id,
      });

      const res = await request(app)
        .post('/api/v1/promo-codes/admin/create')
        .set(authHeader(admin._id))
        .send({ code, type: 'campaign' });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Promo code already exists');
    });

    it('creates campaign promo code as admin and persists to database', async () => {
      const admin = await createAdmin();
      const code = `PROMO${Date.now()}`;

      const res = await request(app)
        .post('/api/v1/promo-codes/admin/create')
        .set(authHeader(admin._id))
        .send({
          code,
          type: 'campaign',
          maxUses: 10,
          newUserBenefits: { discountPercentage: 10 },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(code);

      const saved = await PromoCode.findOne({ code });
      expect(saved).not.toBeNull();
      expect(saved.maxUses).toBe(10);
    });
  });

  describe('GET /api/v1/promo-codes/admin/stats', () => {
    it('requires admin role', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .get('/api/v1/promo-codes/admin/stats')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/promo-codes/admin/:id', () => {
    it('returns 404 for unknown promo code', async () => {
      const admin = await createAdmin();
      const res = await request(app)
        .get('/api/v1/promo-codes/admin/507f1f77bcf86cd799439011')
        .set(authHeader(admin._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns promo code details for admin', async () => {
      const admin = await createAdmin();
      const promo = await PromoCode.create({
        code: `DETAIL${Date.now()}`,
        userId: admin._id,
        type: 'campaign',
        createdBy: admin._id,
      });

      const res = await request(app)
        .get(`/api/v1/promo-codes/admin/${promo._id}`)
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.usageStats).toBeDefined();
      assertNoPassword(res.body);
    });
  });

  describe('PUT /api/v1/promo-codes/admin/:id', () => {
    it('updates promo code maxUses in database', async () => {
      const admin = await createAdmin();
      const promo = await PromoCode.create({
        code: `UPDATE${Date.now()}`,
        userId: admin._id,
        type: 'campaign',
        maxUses: 50,
        createdBy: admin._id,
      });

      const res = await request(app)
        .put(`/api/v1/promo-codes/admin/${promo._id}`)
        .set(authHeader(admin._id))
        .send({ maxUses: 200 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.maxUses).toBe(200);

      const updated = await PromoCode.findById(promo._id);
      expect(updated.maxUses).toBe(200);
    });
  });

  describe('POST /api/v1/promo-codes/admin/bulk-create', () => {
    it('requires admin role', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .post('/api/v1/promo-codes/admin/bulk-create')
        .set(authHeader(candidate._id))
        .send({ count: 2 });

      expect(res.status).toBe(403);
    });

    it('bulk creates promo codes and persists to database', async () => {
      const admin = await createAdmin();
      const prefix = `BULK${Date.now()}`;

      const res = await request(app)
        .post('/api/v1/promo-codes/admin/bulk-create')
        .set(authHeader(admin._id))
        .send({ count: 2, prefix, campaignName: 'Integration Bulk' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);

      const count = await PromoCode.countDocuments({ code: { $regex: `^${prefix}` } });
      expect(count).toBe(2);
    }, 60000);
  });
});
