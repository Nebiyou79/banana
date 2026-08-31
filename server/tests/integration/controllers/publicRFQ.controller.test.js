const request = require('supertest');
const { getApp } = require('../../helpers/app');

describe('publicRFQ.controller integration', () => {
  const app = getApp();

  describe('GET /api/v1/professional-tenders/:id/public-rfq', () => {
    it('returns 404 for unknown tender', async () => {
      const res = await request(app).get('/api/v1/professional-tenders/507f1f77bcf86cd799439011/public-rfq');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/professional-tenders/:id/public-rfq/preview', () => {
    it('returns 404 for unknown tender preview', async () => {
      const res = await request(app).get('/api/v1/professional-tenders/507f1f77bcf86cd799439011/public-rfq/preview');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
