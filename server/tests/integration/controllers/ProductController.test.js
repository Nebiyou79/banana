const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createCandidate } = require('../../helpers/factories/userFactory');
const Product = require('../../../src/models/Product');

async function createTestProduct(company, overrides = {}) {
  const image = {
    public_id: `test_img_${Date.now()}`,
    secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    isPrimary: true,
    order: 0,
  };

  return Product.create({
    companyId: company._id,
    name: overrides.name || 'Integration Test Product',
    description: overrides.description || 'Product description for integration testing purposes only.',
    price: { amount: 49.99, currency: 'USD', unit: 'unit' },
    category: 'electronics',
    subcategory: 'accessories',
    images: [image],
    thumbnail: { public_id: image.public_id, secure_url: image.secure_url },
    ownerSnapshot: { name: company.name, verified: false },
    status: 'active',
    ...overrides,
  });
}

describe('ProductController integration', () => {
  const app = getApp();

  describe('GET /api/v1/products', () => {
    it('returns 200 with success true and product list', async () => {
      const res = await request(app).get('/api/v1/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      assertNoPassword(res.body);
    });

    it('filters products by category', async () => {
      const { company } = await createCompanyWithUser();
      await createTestProduct(company, { name: 'Electronics Filter Product', category: 'electronics' });

      const res = await request(app).get('/api/v1/products?category=electronics');

      expect(res.status).toBe(200);
      expect(res.body.data.products.every((p) => p.category === 'electronics')).toBe(true);
    });
  });

  describe('GET /api/v1/products/categories', () => {
    it('returns product categories', async () => {
      const res = await request(app).get('/api/v1/products/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/products/featured', () => {
    it('returns featured products list', async () => {
      const { company } = await createCompanyWithUser();
      await createTestProduct(company, { featured: true, name: 'Featured Product' });

      const res = await request(app).get('/api/v1/products/featured');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('returns 404 for unknown product', async () => {
      const res = await request(app).get('/api/v1/products/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('returns product by id', async () => {
      const { company } = await createCompanyWithUser();
      const product = await createTestProduct(company, { name: 'Single Product Lookup' });

      const res = await request(app).get(`/api/v1/products/${product._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.name).toBe('Single Product Lookup');
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/products/company/:companyId', () => {
    it('returns 404 for unknown company', async () => {
      const res = await request(app).get('/api/v1/products/company/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('COMPANY_NOT_FOUND');
    });

    it('returns products for a company', async () => {
      const { company } = await createCompanyWithUser();
      await createTestProduct(company, { name: 'Company Catalog Product' });

      const res = await request(app).get(`/api/v1/products/company/${company._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThanOrEqual(1);
      assertNoPassword(res.body);
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
      const candidate = await createCandidate();
      const res = await request(app)
        .post('/api/v1/products')
        .set(authHeader(candidate._id))
        .send({ name: 'Test Product', category: 'electronics' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/products/:id/status', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .patch('/api/v1/products/507f1f77bcf86cd799439011/status')
        .send({ status: 'inactive' });

      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid status', async () => {
      const { user, company } = await createCompanyWithUser();
      const product = await createTestProduct(company);

      const res = await request(app)
        .patch(`/api/v1/products/${product._id}/status`)
        .set(authHeader(user._id))
        .send({ status: 'invalid-status' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATUS');
    });

    it('updates product status as company owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const product = await createTestProduct(company);

      const res = await request(app)
        .patch(`/api/v1/products/${product._id}/status`)
        .set(authHeader(user._id))
        .send({ status: 'inactive' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.status).toBe('inactive');

      const updated = await Product.findById(product._id);
      expect(updated.status).toBe('inactive');
    });

    it('returns 403 when non-owner tries to update status', async () => {
      const { company } = await createCompanyWithUser();
      const product = await createTestProduct(company);
      const otherCompany = await createUser({ role: 'company' });

      const res = await request(app)
        .patch(`/api/v1/products/${product._id}/status`)
        .set(authHeader(otherCompany._id))
        .send({ status: 'inactive' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ACCESS_DENIED');
    });
  });

  describe('POST /api/v1/products/:id/save', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/products/507f1f77bcf86cd799439011/save');

      expect(res.status).toBe(401);
    });

    it('saves product and persists to database', async () => {
      const candidate = await createCandidate();
      const { company } = await createCompanyWithUser();
      const product = await createTestProduct(company);

      const res = await request(app)
        .post(`/api/v1/products/${product._id}/save`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe('PRODUCT_SAVED');

      const updated = await Product.findById(product._id);
      expect(updated.savedBy.map((id) => id.toString())).toContain(candidate._id.toString());
    });

    it('returns 400 when product already saved', async () => {
      const candidate = await createCandidate();
      const { company } = await createCompanyWithUser();
      const product = await createTestProduct(company, { savedBy: [candidate._id], savedCount: 1 });

      const res = await request(app)
        .post(`/api/v1/products/${product._id}/save`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('ALREADY_SAVED');
    });
  });

  describe('DELETE /api/v1/products/:id/save', () => {
    it('unsaves product and updates database', async () => {
      const candidate = await createCandidate();
      const { company } = await createCompanyWithUser();
      const product = await createTestProduct(company, { savedBy: [candidate._id], savedCount: 1 });

      const res = await request(app)
        .delete(`/api/v1/products/${product._id}/save`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe('PRODUCT_UNSAVED');

      const updated = await Product.findById(product._id);
      expect(updated.savedBy.length).toBe(0);
    });
  });
});
