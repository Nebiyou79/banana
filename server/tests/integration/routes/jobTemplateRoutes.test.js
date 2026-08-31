const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createAdmin } = require('../../helpers/factories/userFactory');

describe('jobTemplateRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/admin/templates', () => {
    it('returns 401 without admin token', async () => {
      const res = await request(app).get('/api/v1/admin/templates');

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/token/i);
    });

    it('returns 403 for non-admin user', async () => {
      const user = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/admin/templates')
        .set(authHeader(user._id));

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Admin access required');
    });

    it('returns templates for admin user', async () => {
      const admin = await createAdmin();
      const res = await request(app)
        .get('/api/v1/admin/templates')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.templates)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });
});
