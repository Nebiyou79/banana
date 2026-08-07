const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('tenderController integration', () => {
  const app = getApp();

  describe('GET /api/v1/tender/categories', () => {
    it('returns tender categories without auth', async () => {
      const res = await request(app).get('/api/v1/tender/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/tender', () => {
    it('returns tenders publicly', async () => {
      const res = await request(app).get('/api/v1/tender');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });

    it('returns tenders for authenticated user', async () => {
      const user = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/tender')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/tender/user/my-tenders', () => {
    it('returns my tenders for authenticated user', async () => {
      const user = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/tender/user/my-tenders')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
