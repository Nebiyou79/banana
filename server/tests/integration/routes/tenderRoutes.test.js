const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createPublishedTender, createDraftTender } = require('../../helpers/factories/tenderFactory');

function futureDeadline(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

describe('tenderRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/tender/categories', () => {
    it('returns tender categories without auth', async () => {
      const res = await request(app).get('/api/v1/tender/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/tender/categories/label/:categoryId', () => {
    it('returns category label publicly', async () => {
      const categoriesRes = await request(app).get('/api/v1/tender/categories');
      const categoryId = categoriesRes.body.data?.[0]?.id || 'web-development';

      const res = await request(app).get(`/api/v1/tender/categories/label/${categoryId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/tender', () => {
    it('returns tenders publicly', async () => {
      await createPublishedTender({ title: 'Public Route Tender' });

      const res = await request(app).get('/api/v1/tender');

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
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/tender/user/saved', () => {
    it('returns saved tenders for authenticated user', async () => {
      const user = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/tender/user/saved')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tenders)).toBe(true);
    });
  });

  describe('GET /api/v1/tender/:id', () => {
    it('returns 404 for unknown tender when authenticated', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/tender/507f1f77bcf86cd799439011')
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/tender with filters', () => {
    it('filters by tenderCategory and search', async () => {
      await createPublishedTender({ title: 'RouteFilterTender', tenderCategory: 'freelance' });
      const res = await request(app)
        .get('/api/v1/tender')
        .query({ tenderCategory: 'freelance', search: 'RouteFilter', status: 'all', page: 1, limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/tender/freelance/create', () => {
    it('creates freelance tender via route', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .post('/api/v1/tender/freelance/create')
        .set(authHeader(user._id))
        .send({
          title: 'Route Created Freelance Tender',
          description: 'Created via tender routes integration test with enough detail.',
          procurementCategory: 'Web Development',
          deadline: futureDeadline(),
          workflowType: 'open',
          freelanceSpecific: JSON.stringify({
            engagementType: 'fixed_price',
            budget: { min: 2000, max: 8000, currency: 'ETB' },
          }),
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/tender/:id', () => {
    it('updates draft tender via route', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createDraftTender({ owner: user._id, company: company._id });

      const res = await request(app)
        .put(`/api/v1/tender/${tender._id}`)
        .set(authHeader(user._id))
        .send({ title: 'Route Updated Tender Title' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/tender/:id/stats', () => {
    it('returns stats for owner via route', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({ owner: user._id, company: company._id });

      const res = await request(app)
        .get(`/api/v1/tender/${tender._id}/stats`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.data.stats).toBeDefined();
    });
  });

  describe('GET /api/v1/tender/user/invitations', () => {
    it('returns invitations for company', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .get('/api/v1/tender/user/invitations')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/tender/:id/reveal-proposals', () => {
    it('returns 400 for open workflow', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        workflowType: 'open',
      });

      const res = await request(app)
        .post(`/api/v1/tender/${tender._id}/reveal-proposals`)
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
    });
  });

  describe('attachment route handlers', () => {
    it('POST attachments returns 400 when no files uploaded', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createDraftTender({ owner: user._id, company: company._id });

      const res = await request(app)
        .post(`/api/v1/tender/${tender._id}/attachments/upload`)
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
    });

    it('DELETE attachment returns 404 for missing attachment', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createDraftTender({ owner: user._id, company: company._id });
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/v1/tender/${tender._id}/attachments/${fakeId}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
    });
  });
});
