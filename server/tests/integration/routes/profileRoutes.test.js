const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createProfileForUser } = require('../../helpers/factories/profileFactory');

describe('profileRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/profile', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('creates default profile on first access', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/profile')
        .set(authHeader(user._id));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe('PROFILE_CREATED');
      assertNoPassword(res.body);
    });

    it('returns existing profile for authenticated user', async () => {
      const user = await createUser();
      await createProfileForUser(user);
      const res = await request(app)
        .get('/api/v1/profile')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe('PROFILE_RETRIEVED');
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/profile/completion', () => {
    it('returns profile completion for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/profile/completion')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/profile/summary', () => {
    it('returns profile summary for authenticated user', async () => {
      const user = await createUser();
      await createProfileForUser(user);
      const res = await request(app)
        .get('/api/v1/profile/summary')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/profile/social-links', () => {
    it('updates social links for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .put('/api/v1/profile/social-links')
        .set(authHeader(user._id))
        .send({
          socialLinks: {
            linkedin: 'https://linkedin.com/in/testuser',
            github: 'https://github.com/testuser',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/profile/health', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/profile/health');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
