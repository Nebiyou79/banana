const request = require('supertest');
const socialSearchController = require('../../../src/controllers/socialSearchController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createPublicProfileForUser } = require('../../helpers/factories/profileFactory');
const Post = require('../../../src/models/Post');
const { mockReq, mockRes } = require('../../helpers/mockHttp');

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

    it('finds profile by searchable name', async () => {
      const user = await createUser({ name: 'Unique Social Search Name' });
      await createPublicProfileForUser(user, { displayName: 'Unique Social Search Name' });

      const res = await request(app)
        .get('/api/v1/social-search/profiles')
        .query({ q: 'Unique Social Search' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/social-search/posts', () => {
    it('returns post search results', async () => {
      const author = await createUser();
      await Post.create({
        author: author._id,
        content: 'Unique searchable post content for social search',
        status: 'active',
      });

      const res = await request(app)
        .get('/api/v1/social-search/posts')
        .query({ q: 'Unique searchable post' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/social-search/hashtags', () => {
    it('returns hashtag search results', async () => {
      const res = await request(app)
        .get('/api/v1/social-search/hashtags')
        .query({ q: 'dev' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
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

  describe('advanced search routes', () => {
    it('returns advanced user search results', async () => {
      const res = await request(app)
        .get('/api/v1/social-search/advanced/users')
        .query({ q: 'test' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns advanced company search results', async () => {
      const res = await request(app)
        .get('/api/v1/social-search/advanced/companies')
        .query({ q: 'test' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns advanced freelancer search results', async () => {
      const res = await request(app)
        .get('/api/v1/social-search/advanced/freelancers')
        .query({ q: 'engineer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('getTrendingHashtags (direct)', () => {
    it('returns trending data via controller', async () => {
      const req = mockReq({ query: { limit: '5' } });
      const res = mockRes();

      await socialSearchController.getTrendingHashtags(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('getSearchSuggestions (direct)', () => {
    it('returns suggestions via controller', async () => {
      const req = mockReq({ query: { q: 'te' } });
      const res = mockRes();

      await socialSearchController.getSearchSuggestions(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
