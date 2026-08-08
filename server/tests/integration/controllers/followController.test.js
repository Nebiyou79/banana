const request = require('supertest');
const followController = require('../../../src/controllers/followController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { mockReq, mockRes } = require('../../helpers/mockHttp');
const Follow = require('../../../src/models/Follow');

describe('followController integration', () => {
  const app = getApp();

  describe('toggleFollow (direct)', () => {
    it('returns 400 for invalid targetId', async () => {
      const user = await createUser();
      const req = mockReq({
        user: { userId: user._id },
        params: { targetId: 'not-a-valid-id' },
        body: { targetType: 'User' },
      });
      const res = mockRes();

      await followController.toggleFollow(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        message: 'Invalid targetId',
      });
    });

    it('returns 400 when following yourself', async () => {
      const user = await createUser();
      const req = mockReq({
        user: { userId: user._id.toString() },
        params: { targetId: user._id.toString() },
        body: { targetType: 'User' },
      });
      const res = mockRes();

      await followController.toggleFollow(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cannot follow yourself/i);
    });
  });

  describe('POST /api/v1/follow/:targetId', () => {
    it('requires authentication', async () => {
      const target = await createUser();
      const res = await request(app)
        .post(`/api/v1/follow/${target._id}`)
        .send({ targetType: 'User' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('follows and unfollows a user', async () => {
      const follower = await createUser();
      const target = await createUser();

      const followRes = await request(app)
        .post(`/api/v1/follow/${target._id}`)
        .set(authHeader(follower._id))
        .send({ targetType: 'User' });

      expect(followRes.status).toBe(201);
      expect(followRes.body.success).toBe(true);

      const unfollowRes = await request(app)
        .post(`/api/v1/follow/${target._id}`)
        .set(authHeader(follower._id))
        .send({ targetType: 'User' });

      expect(unfollowRes.status).toBe(200);
      expect(unfollowRes.body.data.following).toBe(false);
    });
  });

  describe('GET /api/v1/follow/stats', () => {
    it('returns follow stats for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/follow/stats')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/follow/followers and /following', () => {
    it('returns followers and following lists', async () => {
      const user = await createUser();
      const other = await createUser();

      await Follow.create({
        follower: other._id,
        targetId: user._id,
        targetType: 'User',
        status: 'active',
      });

      const followersRes = await request(app)
        .get('/api/v1/follow/followers')
        .set(authHeader(user._id));

      expect(followersRes.status).toBe(200);
      expect(followersRes.body.success).toBe(true);

      const followingRes = await request(app)
        .get('/api/v1/follow/following')
        .set(authHeader(other._id));

      expect(followingRes.status).toBe(200);
      expect(followingRes.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/follow/connections', () => {
    it('returns connections list', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/follow/connections')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/follow/suggestions', () => {
    it('returns follow suggestions', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/follow/suggestions')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/follow/pending', () => {
    it('returns pending follow requests', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/follow/pending')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/follow/bulk-status', () => {
    it('returns bulk follow status', async () => {
      const user = await createUser();
      const target = await createUser();
      const res = await request(app)
        .post('/api/v1/follow/bulk-status')
        .set(authHeader(user._id))
        .send({ targetIds: [target._id.toString()], targetType: 'User' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/follow/:targetId/status', () => {
    it('returns follow status for target', async () => {
      const user = await createUser();
      const target = await createUser();
      const res = await request(app)
        .get(`/api/v1/follow/${target._id}/status`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/follow/:userId/is-connected', () => {
    it('returns connection status', async () => {
      const user = await createUser();
      const other = await createUser();
      const res = await request(app)
        .get(`/api/v1/follow/${other._id}/is-connected`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/follow/:targetId/block', () => {
    it('blocks a user', async () => {
      const user = await createUser();
      const target = await createUser();
      const res = await request(app)
        .post(`/api/v1/follow/${target._id}/block`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/follow/public/followers/:targetId', () => {
    it('returns public followers without auth', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/v1/follow/public/followers/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/follow/public/following/:targetId', () => {
    it('returns public following without auth', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/v1/follow/public/following/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('acceptFollowRequest and rejectFollowRequest (direct)', () => {
    it('returns legacy no-op responses', async () => {
      const user = await createUser();
      const req = mockReq({ user: { userId: user._id }, params: { followId: '507f1f77bcf86cd799439011' } });
      const res = mockRes();

      await followController.acceptFollowRequest(req, res);
      expect(res.statusCode).toBe(200);

      const rejectRes = mockRes();
      await followController.rejectFollowRequest(req, rejectRes);
      expect(rejectRes.statusCode).toBe(200);
    });
  });
});
