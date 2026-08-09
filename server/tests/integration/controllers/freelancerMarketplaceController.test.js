const request = require('supertest');
const marketplaceController = require('../../../src/controllers/freelancerMarketplaceController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createFreelancerProfile } = require('../../helpers/factories/freelancerFactory');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { mockReq, mockRes } = require('../../helpers/mockHttp');

describe('freelancerMarketplaceController integration', () => {
  const app = getApp();

  describe('GET /api/v1/freelancers', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/freelancers');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('lists freelancers for authenticated company user', async () => {
      await createFreelancerProfile();
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/freelancers')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/freelancers/professions', () => {
    it('returns profession list', async () => {
      const user = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/freelancers/professions')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.professions.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/freelancers/me', () => {
    it('returns own freelancer marketplace profile', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancers/me')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/freelancers/me/reviews', () => {
    it('returns own reviews', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancers/me/reviews')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/freelancers/:id', () => {
    it('returns public freelancer profile', async () => {
      const { user, profile } = await createFreelancerProfile();
      const viewer = await createUser({ role: 'company' });

      const res = await request(app)
        .get(`/api/v1/freelancers/${profile._id}`)
        .set(authHeader(viewer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/freelancers/:id/reviews', () => {
    it('returns freelancer reviews', async () => {
      const { profile } = await createFreelancerProfile();
      const viewer = await createUser({ role: 'company' });

      const res = await request(app)
        .get(`/api/v1/freelancers/${profile._id}/reviews`)
        .set(authHeader(viewer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/freelancers/:id/reviews', () => {
    it('allows company to submit review', async () => {
      const { profile } = await createFreelancerProfile();
      const { user: companyUser } = await createCompanyWithUser();

      const res = await request(app)
        .post(`/api/v1/freelancers/${profile._id}/reviews`)
        .set(authHeader(companyUser._id))
        .send({
          rating: 5,
          comment: 'Excellent work on the integration test project.',
          breakdown: {
            communication: 5,
            quality: 5,
            deadlines: 5,
            professionalism: 5,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
    });
  });

  describe('company shortlist routes', () => {
    it('toggles freelancer on company shortlist', async () => {
      const { profile } = await createFreelancerProfile();
      const { user: companyUser } = await createCompanyWithUser();

      const toggleRes = await request(app)
        .post(`/api/v1/freelancers/company/shortlist/${profile._id}`)
        .set(authHeader(companyUser._id));

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.success).toBe(true);

      const listRes = await request(app)
        .get('/api/v1/freelancers/company/shortlist')
        .set(authHeader(companyUser._id));

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
    });
  });

  describe('getProfessionList (direct)', () => {
    it('returns profession list via controller', async () => {
      const req = mockReq();
      const res = mockRes();

      await marketplaceController.getProfessionList(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('listFreelancers (direct)', () => {
    it('lists freelancers via controller', async () => {
      await createFreelancerProfile();
      const companyUser = await createUser({ role: 'company' });
      const req = mockReq({
        user: { userId: companyUser._id, role: 'company' },
        query: { page: '1', limit: '10' },
      });
      const res = mockRes();

      await marketplaceController.listFreelancers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
