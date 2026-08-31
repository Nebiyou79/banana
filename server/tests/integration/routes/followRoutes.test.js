const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('followRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/follow/public/followers/:targetId', () => {
    it('returns public followers without auth', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/v1/follow/public/followers/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
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
});
