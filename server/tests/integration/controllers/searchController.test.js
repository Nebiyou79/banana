const request = require('supertest');
const searchController = require('../../../src/controllers/searchController');
const { getApp } = require('../../helpers/app');
const { assertNoPassword } = require('../../helpers/auth');
const { createActiveJob } = require('../../helpers/factories/jobFactory');
const { mockReq, mockRes } = require('../../helpers/mockHttp');

describe('searchController integration', () => {
  const app = getApp();

  describe('GET /api/v1/search/jobs', () => {
    it('returns 200 with matching active jobs', async () => {
      await createActiveJob({
        title: 'Unique Searchable Developer Role',
        status: 'active',
      });

      const res = await request(app)
        .get('/api/v1/search/jobs')
        .query({ query: 'Unique Searchable' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((j) => j.title.includes('Unique Searchable'))).toBe(true);
      expect(res.body.pagination).toBeDefined();
      assertNoPassword(res.body);
    });

    it('returns empty results for non-matching query', async () => {
      const res = await request(app)
        .get('/api/v1/search/jobs')
        .query({ query: 'xyznonexistentquery999' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });

    it('filters by category and location', async () => {
      await createActiveJob({
        title: 'Filtered Search Job',
        category: 'software-developer',
        location: 'Addis Ababa',
      });

      const res = await request(app)
        .get('/api/v1/search/jobs')
        .query({ query: 'Filtered Search', category: 'software-developer', location: 'Addis' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('supports pagination parameters', async () => {
      await createActiveJob({ title: 'Paginated Job One' });
      await createActiveJob({ title: 'Paginated Job Two' });

      const res = await request(app)
        .get('/api/v1/search/jobs')
        .query({ query: 'Paginated Job', page: 1, limit: 1 });

      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('searchJobs (direct)', () => {
    it('returns active jobs through controller', async () => {
      await createActiveJob({ title: 'Direct Search Job' });
      const req = mockReq({ query: { query: 'Direct Search' } });
      const res = mockRes();
      const next = jest.fn();

      await searchController.searchJobs(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
