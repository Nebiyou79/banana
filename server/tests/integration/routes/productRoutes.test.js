const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('productRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/products', () => {
    it('returns 200 with product list publicly', async () => {
      const res = await request(app).get('/api/v1/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/products/categories', () => {
    it('returns product categories publicly', async () => {
      const res = await request(app).get('/api/v1/products/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('POST /api/v1/products', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send({ name: 'Unauthorized Product' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('requires company role to create product', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .post('/api/v1/products')
        .set(authHeader(candidate._id))
        .send({ name: 'Candidate Product', category: 'software' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
