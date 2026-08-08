const request = require('supertest');
const mongoose = require('mongoose');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createPublishedFreelanceTender } = require('../../helpers/factories/freelanceTenderFactory');
const { runController } = require('../../helpers/runController');
const freelanceTenderController = require('../../../src/controllers/freelanceTenderController');
const FreelanceTender = require('../../../src/models/FreelanceTender');

describe('freelanceTenderController integration', () => {
  const app = getApp();

  describe('GET /api/v1/freelance-tenders/categories', () => {
    it('returns categories without authentication', async () => {
      const res = await request(app).get('/api/v1/freelance-tenders/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('returns grouped categories via controller', async () => {
      const { res } = await runController(freelanceTenderController.getCategories, {
        req: { query: {} },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/freelance-tenders', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/freelance-tenders');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 for company user', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/freelance-tenders')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns published tenders for freelancer', async () => {
      const { user: owner, company } = await createCompanyWithUser();
      const freelancer = await createUser({ role: 'freelancer' });
      await createPublishedFreelanceTender({ owner, company, title: 'Browse Freelance Tender' });

      const res = await request(app)
        .get('/api/v1/freelance-tenders')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenders.some((t) => t.title === 'Browse Freelance Tender')).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/freelance-tenders/saved', () => {
    it('returns saved tenders for freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/freelance-tenders/saved')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tenders)).toBe(true);
    });
  });

  describe('GET /api/v1/freelance-tenders/my-tenders', () => {
    it('returns posted tenders for company owner', async () => {
      const { user, company } = await createCompanyWithUser();
      await createPublishedFreelanceTender({ owner: user, company, title: 'My Posted Freelance Tender' });

      const res = await request(app)
        .get('/api/v1/freelance-tenders/my-tenders')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenders.some((t) => t.title === 'My Posted Freelance Tender')).toBe(true);
    });
  });

  describe('GET /api/v1/freelance-tenders/:id', () => {
    it('returns 404 for unknown tender', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/freelance-tenders/${fakeId}`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Freelance tender not found' });
    });

    it('returns tender details for freelancer viewer', async () => {
      const { user: owner, company } = await createCompanyWithUser();
      const freelancer = await createUser({ role: 'freelancer' });
      const tender = await createPublishedFreelanceTender({ owner, company, title: 'Single Freelance Tender' });

      const res = await request(app)
        .get(`/api/v1/freelance-tenders/${tender._id}`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Single Freelance Tender');
      expect(res.body.isOwner).toBe(false);
    });
  });

  describe('DELETE /api/v1/freelance-tenders/:id', () => {
    it('returns 403 when non-owner deletes', async () => {
      const { user: owner, company } = await createCompanyWithUser();
      const { user: other } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({ owner, company, status: 'draft' });

      const res = await request(app)
        .delete(`/api/v1/freelance-tenders/${tender._id}`)
        .set(authHeader(other._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('soft-deletes draft tender for owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({ owner: user, company, status: 'draft' });

      const res = await request(app)
        .delete(`/api/v1/freelance-tenders/${tender._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, message: 'Freelance tender deleted successfully' });

      const deleted = await FreelanceTender.findById(tender._id);
      expect(deleted.isDeleted).toBe(true);
    });
  });

  describe('POST /api/v1/freelance-tenders/:id/publish', () => {
    it('returns 400 when tender is not draft', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({ owner: user, company, status: 'published' });

      const res = await request(app)
        .post(`/api/v1/freelance-tenders/${tender._id}/publish`)
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('publishes draft tender for owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({
        owner: user,
        company,
        status: 'draft',
        details: {
          engagementType: 'fixed_price',
          budget: { min: 1000, max: 5000, currency: 'ETB' },
        },
      });

      const res = await request(app)
        .post(`/api/v1/freelance-tenders/${tender._id}/publish`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const published = await FreelanceTender.findById(tender._id);
      expect(published.status).toBe('published');
    });
  });

  describe('POST /api/v1/freelance-tenders/create', () => {
    it('returns 403 for freelancer role', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .post('/api/v1/freelance-tenders/create')
        .set(authHeader(freelancer._id))
        .send({ title: 'Invalid Create' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when required fields are missing', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .post('/api/v1/freelance-tenders/create')
        .set(authHeader(user._id))
        .send({ title: 'Incomplete Tender' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/freelance-tenders/:id/apply', () => {
    it('returns 403 for company user', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({ owner: user, company });

      const res = await request(app)
        .post(`/api/v1/freelance-tenders/${tender._id}/apply`)
        .set(authHeader(user._id))
        .send({ coverLetter: 'I want this job', proposedRate: 5000 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when cover letter is missing', async () => {
      const { user: owner, company } = await createCompanyWithUser();
      const freelancer = await createUser({ role: 'freelancer' });
      const tender = await createPublishedFreelanceTender({ owner, company });

      const res = await request(app)
        .post(`/api/v1/freelance-tenders/${tender._id}/apply`)
        .set(authHeader(freelancer._id))
        .send({ proposedRate: 5000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('submits application for published tender', async () => {
      const { user: owner, company } = await createCompanyWithUser();
      const freelancer = await createUser({ role: 'freelancer' });
      const tender = await createPublishedFreelanceTender({ owner, company });

      const res = await request(app)
        .post(`/api/v1/freelance-tenders/${tender._id}/apply`)
        .set(authHeader(freelancer._id))
        .send({
          coverLetter: 'I have extensive experience building freelance marketplace features.',
          proposedRate: 7500,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const updated = await FreelanceTender.findById(tender._id);
      expect(updated.applications.some((a) => a.applicant.toString() === freelancer._id.toString())).toBe(true);
    });
  });

  describe('POST /api/v1/freelance-tenders/:id/toggle-save', () => {
    it('returns 404 for unknown tender', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/v1/freelance-tenders/${fakeId}/toggle-save`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/freelance-tenders/:id/stats', () => {
    it('returns stats for tender owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({ owner: user, company });

      const res = await request(app)
        .get(`/api/v1/freelance-tenders/${tender._id}/stats`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('freelanceTenderController direct calls', () => {
    function authUser(user) {
      return { _id: user._id, role: user.role, email: user.email };
    }

    function futureDeadline(days = 30) {
      return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    function validCreateBody(overrides = {}) {
      return {
        title: 'Freelance Tender Create',
        description: 'Freelance tender test description with sufficient detail.',
        procurementCategory: 'Web Development',
        deadline: futureDeadline(),
        details: {
          engagementType: 'fixed_price',
          budget: { min: 1000, max: 5000, currency: 'ETB' },
        },
        ...overrides,
      };
    }

    it('getTenderApplications returns 403 for non-owner', async () => {
      const { user: owner, company } = await createCompanyWithUser();
      const freelancer = await createUser({ role: 'freelancer' });
      const tender = await createPublishedFreelanceTender({ owner, company });
      const { res } = await runController(freelanceTenderController.getTenderApplications, {
        req: { params: { id: tender._id.toString() }, user: authUser(freelancer) },
      });
      expect(res.statusCode).toBe(403);
    });

    it('updateApplicationStatus returns 404 when application not found', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({ owner: user, company });
      const { res } = await runController(freelanceTenderController.updateApplicationStatus, {
        req: {
          params: { id: tender._id.toString(), applicationId: new mongoose.Types.ObjectId().toString() },
          user: authUser(user),
          body: { status: 'shortlisted' },
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('downloadAttachment returns 404 for missing attachment', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({ owner: user, company });
      const { res } = await runController(freelanceTenderController.downloadAttachment, {
        req: {
          params: { id: tender._id.toString(), attachmentId: new mongoose.Types.ObjectId().toString() },
          user: authUser(user),
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('previewAttachment returns 404 for missing attachment', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({ owner: user, company });
      const { res } = await runController(freelanceTenderController.previewAttachment, {
        req: {
          params: { id: tender._id.toString(), attachmentId: new mongoose.Types.ObjectId().toString() },
          user: authUser(user),
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('deleteAttachment returns 404 for missing attachment', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({ owner: user, company });
      const { res } = await runController(freelanceTenderController.deleteAttachment, {
        req: {
          params: { id: tender._id.toString(), attachmentId: new mongoose.Types.ObjectId().toString() },
          user: authUser(user),
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('toggleSaveFreelanceTender returns 404 for unknown tender', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const { res } = await runController(freelanceTenderController.toggleSaveFreelanceTender, {
        req: { params: { id: new mongoose.Types.ObjectId().toString() }, user: authUser(freelancer) },
      });
      expect(res.statusCode).toBe(404);
    });

    it('getSavedFreelanceTenders returns list for freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const { res } = await runController(freelanceTenderController.getSavedFreelanceTenders, {
        req: { user: authUser(freelancer), query: { page: 1, limit: 10 } },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('getMyPostedTenders returns tenders for owner', async () => {
      const { user, company } = await createCompanyWithUser();
      await createPublishedFreelanceTender({ owner: user, company });
      const { res } = await runController(freelanceTenderController.getMyPostedTenders, {
        req: { user: authUser(user), query: { page: 1, limit: 10 } },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.tenders)).toBe(true);
    });

    it('publishFreelanceTender returns 400 for already published tender', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({
        owner: user,
        company,
        status: 'published',
      });
      const { res } = await runController(freelanceTenderController.publishFreelanceTender, {
        req: { params: { id: tender._id.toString() }, user: authUser(user) },
      });
      expect(res.statusCode).toBe(400);
    });

    it('updateFreelanceTender returns 403 for non-owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const { user: other } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({ owner: user, company, status: 'draft' });
      const { res } = await runController(freelanceTenderController.updateFreelanceTender, {
        req: {
          params: { id: tender._id.toString() },
          user: authUser(other),
          body: { title: 'Hijacked' },
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('getFreelanceTenderStats returns 403 for unauthorized viewer', async () => {
      const { user, company } = await createCompanyWithUser();
      const stranger = await createUser({ role: 'freelancer' });
      const tender = await createPublishedFreelanceTender({ owner: user, company });
      const { res } = await runController(freelanceTenderController.getFreelanceTenderStats, {
        req: { params: { id: tender._id.toString() }, user: authUser(stranger) },
      });
      expect(res.statusCode).toBe(403);
    });

    it('submitApplication returns 403 for company role', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedFreelanceTender({ owner: user, company });
      const { res } = await runController(freelanceTenderController.submitApplication, {
        req: {
          params: { id: tender._id.toString() },
          user: authUser(user),
          body: { coverLetter: 'Should not apply as company owner' },
        },
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
