const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('adminPromoController integration', () => {
  const app = getApp();

  describe('GET /api/v1/promo-codes/admin/all', () => {
    it('requires admin authentication', async () => {
      const user = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/promo-codes/admin/all')
        .set(authHeader(user._id));

      expect(res.status).toBe(403);
    });

    it('returns promo codes for admin', async () => {
      const admin = await createUser({ role: 'admin' });
      const res = await request(app)
        .get('/api/v1/promo-codes/admin/all')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('POST /api/v1/promo-codes/admin/create', () => {
    it('creates campaign promo code as admin', async () => {
      const admin = await createUser({ role: 'admin' });
      const code = `PROMO${Date.now()}`;

      const res = await request(app)
        .post('/api/v1/promo-codes/admin/create')
        .set(authHeader(admin._id))
        .send({
          code,
          type: 'campaign',
          maxUses: 10,
          newUserBenefits: { discountPercent: 10 },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(code);
    });
  });
});
