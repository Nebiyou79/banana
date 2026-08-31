const request = require('supertest');
const mongoose = require('mongoose');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createPublishedProfessionalTender } = require('../../helpers/factories/professionalTenderFactory');

function futureDeadline(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

describe('professionalTenderRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/professional-tenders/categories', () => {
    it('returns categories publicly', async () => {
      const res = await request(app).get('/api/v1/professional-tenders/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/professional-tenders', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/professional-tenders');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns tenders for authenticated company user', async () => {
      const company = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/professional-tenders')
        .set(authHeader(company._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/professional-tenders/my-invitations', () => {
    it('returns invitations list', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .get('/api/v1/professional-tenders/my-invitations')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/professional-tenders/create', () => {
    it('creates tender via route', async () => {
      const { user } = await createCompanyWithUser();
      const suffix = Date.now().toString(36).toUpperCase();
      const res = await request(app)
        .post('/api/v1/professional-tenders/create')
        .set(authHeader(user._id))
        .send({
          title: 'Route Pro Tender',
          description: 'Professional tender via routes integration test with sufficient length.',
          procurementCategory: 'Construction',
          tenderType: 'services',
          workflowType: 'open',
          visibilityType: 'public',
          deadline: futureDeadline(),
          referenceNumber: `RPD-${suffix}`.slice(0, 20),
          procurement: JSON.stringify({ procuringEntity: 'Route Test Entity' }),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/professional-tenders/:id', () => {
    it('updates draft tender', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company, status: 'draft' });

      const res = await request(app)
        .put(`/api/v1/professional-tenders/${tender._id}`)
        .set(authHeader(user._id))
        .send({ title: 'Updated Via Route' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/professional-tenders/:id/addendum', () => {
    it('returns addenda list', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company });

      const res = await request(app)
        .get(`/api/v1/professional-tenders/${tender._id}/addendum`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/professional-tenders/:id/reveal-bids', () => {
    it('returns 400 for open workflow', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company, workflowType: 'open' });

      const res = await request(app)
        .post(`/api/v1/professional-tenders/${tender._id}/reveal-bids`)
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
    });
  });

  describe('attachment routes', () => {
    it('GET download returns 404 for missing attachment', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company });
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/professional-tenders/${tender._id}/attachments/${fakeId}/download`)
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
    });

    it('POST attachments upload returns 400 without files', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company, status: 'draft' });

      const res = await request(app)
        .post(`/api/v1/professional-tenders/${tender._id}/attachments/upload`)
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
    });
  });
});
