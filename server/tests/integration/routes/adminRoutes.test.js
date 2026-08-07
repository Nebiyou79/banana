const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createAdmin } = require('../../helpers/factories/userFactory');

describe('adminRoutes integration', () => {
  const app = getApp();

  describe('POST /api/v1/admin/login', () => {
    it('returns 200 with token for valid credentials', async () => {
      const admin = await createAdmin({
        email: 'admin-route-login@test.com',
        passwordHash: 'password123',
      });

      const res = await request(app)
        .post('/api/v1/admin/login')
        .send({ email: admin.email, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/admin/me', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/admin/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns current user when authenticated', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/admin/me')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/admin/admin/users', () => {
    it('returns 401 without admin token', async () => {
      const res = await request(app).get('/api/v1/admin/admin/users');

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/token/i);
    });

    it('returns 403 for non-admin user', async () => {
      const user = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/admin/admin/users')
        .set(authHeader(user._id));

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Admin access required');
    });
  });

  describe('GET /api/v1/admin/referral-stats', () => {
    it('returns referral stats for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/admin/referral-stats')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
