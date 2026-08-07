const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createPublicProfileForUser } = require('../../helpers/factories/profileFactory');

describe('publicProfileRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/public-profile/featured', () => {
    it('returns featured profiles without auth', async () => {
      const res = await request(app).get('/api/v1/public-profile/featured');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/public-profile/:userId', () => {
    it('returns public profile by user id when visible', async () => {
      const user = await createUser();
      await createPublicProfileForUser(user);

      const res = await request(app).get(`/api/v1/public-profile/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/public-profile', () => {
    it('requires authentication for own public profile settings', async () => {
      const res = await request(app).get('/api/v1/public-profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns own public profile settings when authenticated', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/public-profile')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
