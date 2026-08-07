const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('jobTemplateController integration', () => {
  const app = getApp();

  describe('GET /api/v1/admin/templates', () => {
    it('requires admin authentication', async () => {
      const user = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/admin/templates')
        .set(authHeader(user._id));

      expect(res.status).toBe(403);
    });

    it('returns templates for admin', async () => {
      const admin = await createUser({ role: 'admin' });
      const res = await request(app)
        .get('/api/v1/admin/templates')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.templates)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/admin/templates/:id', () => {
    it('returns 404 for unknown template', async () => {
      const admin = await createUser({ role: 'admin' });
      const res = await request(app)
        .get('/api/v1/admin/templates/507f1f77bcf86cd799439011')
        .set(authHeader(admin._id));

      expect(res.status).toBe(404);
    });
  });
});
