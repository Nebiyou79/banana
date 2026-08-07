const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('freelancerMarketplaceController integration', () => {
  const app = getApp();

  describe('GET /api/v1/freelancers', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/freelancers');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('lists freelancers for authenticated company user', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/freelancers')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/freelancers/professions', () => {
    it('returns profession list', async () => {
      const user = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/freelancers/professions')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
