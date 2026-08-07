const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { assertNoPassword } = require('../../helpers/auth');
const { createActiveJob } = require('../../helpers/factories/jobFactory');

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
  });
});
