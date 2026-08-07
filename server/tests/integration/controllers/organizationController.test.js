const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('organizationController integration', () => {
  const app = getApp();

  describe('GET /api/v1/organization/public/:id', () => {
    it('returns 404 for unknown organization', async () => {
      const res = await request(app).get('/api/v1/organization/public/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/organization', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/organization');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns success with null data when organization profile not found', async () => {
      const user = await createUser({ role: 'organization' });
      const res = await request(app)
        .get('/api/v1/organization')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });
  });
});
