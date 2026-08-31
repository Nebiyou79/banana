const request = require('supertest');
const publicProfileController = require('../../../src/controllers/publicProfileController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createPublicProfileForUser } = require('../../helpers/factories/profileFactory');
const { mockReq, mockRes } = require('../../helpers/mockHttp');

describe('publicProfileController integration', () => {
  const app = getApp();

  describe('GET /api/v1/public-profile/featured', () => {
    it('returns featured profiles without auth', async () => {
      const res = await request(app).get('/api/v1/public-profile/featured');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/public-profile', () => {
    it('requires authentication for own public profile', async () => {
      const res = await request(app).get('/api/v1/public-profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns own public profile when authenticated', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/public-profile')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('PUT /api/v1/public-profile', () => {
    it('updates own public profile', async () => {
      const user = await createUser();
      const res = await request(app)
        .put('/api/v1/public-profile')
        .set(authHeader(user._id))
        .send({
          displayName: 'Updated Public Name',
          bio: 'Updated public bio for integration testing.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/public-profile/visibility', () => {
    it('toggles profile visibility', async () => {
      const user = await createUser();
      const res = await request(app)
        .patch('/api/v1/public-profile/visibility')
        .set(authHeader(user._id))
        .send({ isPubliclyVisible: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/public-profile/sync', () => {
    it('syncs from main profile', async () => {
      const user = await createUser({ name: 'Sync Source User' });
      const res = await request(app)
        .post('/api/v1/public-profile/sync')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/public-profile/search', () => {
    it('searches public profiles', async () => {
      const user = await createUser({ name: 'Searchable Public User' });
      await createPublicProfileForUser(user, { displayName: 'Searchable Public User' });

      const res = await request(app).get('/api/v1/public-profile/search');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
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

  describe('GET /api/v1/public-profile/u/:username', () => {
    it('returns public profile by username', async () => {
      const user = await createUser();
      const profile = await createPublicProfileForUser(user, { username: `user-${Date.now()}` });

      const res = await request(app).get(`/api/v1/public-profile/u/${profile.username}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('getFeaturedProfiles (direct)', () => {
    it('returns featured profiles via controller', async () => {
      const req = mockReq({ query: { limit: '5' } });
      const res = mockRes();

      await publicProfileController.getFeaturedProfiles(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('getMyPublicProfile (direct)', () => {
    it('returns own profile via controller', async () => {
      const user = await createUser();
      const req = mockReq({ user: { userId: user._id } });
      const res = mockRes();

      await publicProfileController.getMyPublicProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
