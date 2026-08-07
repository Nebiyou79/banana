const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { assertNoPassword } = require('../../helpers/auth');

describe('socialSearchController integration', () => {
  const app = getApp();

  describe('GET /api/v1/social-search/profiles', () => {
    it('returns profile search results', async () => {
      const res = await request(app)
        .get('/api/v1/social-search/profiles')
        .query({ q: 'test' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/social-search/trending', () => {
    it('returns trending hashtags', async () => {
      const res = await request(app).get('/api/v1/social-search/trending');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.hashtags)).toBe(true);
    });
  });

  describe('GET /api/v1/social-search/suggestions', () => {
    it('returns search suggestions', async () => {
      const res = await request(app)
        .get('/api/v1/social-search/suggestions')
        .query({ q: 'dev' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
