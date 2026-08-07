const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createProfileForUser } = require('../../helpers/factories/profileFactory');

describe('roleProfileController integration', () => {
  const app = getApp();

  describe('GET /api/v1/role-profile/candidate', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/role-profile/candidate');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns candidate role profile when profile exists', async () => {
      const candidate = await createUser({ role: 'candidate' });
      await createProfileForUser(candidate);

      const res = await request(app)
        .get('/api/v1/role-profile/candidate')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/role-profile/company', () => {
    it('returns 404 when company profile not found', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/role-profile/company')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
