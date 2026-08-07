const request = require('supertest');
const followController = require('../../../src/controllers/followController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { mockReq, mockRes } = require('../../helpers/mockHttp');

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

  describe('GET /api/v1/follow/public/followers/:targetId', () => {
    it('returns public followers without auth', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/v1/follow/public/followers/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
