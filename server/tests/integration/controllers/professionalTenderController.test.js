const request = require('supertest');
const mongoose = require('mongoose');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createPublishedProfessionalTender } = require('../../helpers/factories/professionalTenderFactory');
const { runController } = require('../../helpers/runController');
const professionalTenderController = require('../../../src/controllers/professionalTenderController');
const ProfessionalTender = require('../../../src/models/ProfessionalTender');

describe('professionalTenderController integration', () => {
  const app = getApp();

  describe('GET /api/v1/professional-tenders/categories', () => {
    it('returns categories without auth', async () => {
      const res = await request(app).get('/api/v1/professional-tenders/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('returns grouped categories via controller', async () => {
      const { res } = await runController(professionalTenderController.getCategories, {
        req: { query: {} },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data).toBe('object');
    });
  });

  describe('GET /api/v1/professional-tenders/generate-ref', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/v1/professional-tenders/generate-ref');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('generates reference number for company user', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .get('/api/v1/professional-tenders/generate-ref')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.referenceNumber).toMatch(/^BANANA\/PROC\//);
    });
  });

  describe('GET /api/v1/professional-tenders', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/professional-tenders');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 for freelancer role', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/professional-tenders')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns published tenders for company user', async () => {
      const { user: owner, company } = await createCompanyWithUser();
      const { user: bidder } = await createCompanyWithUser();
      await createPublishedProfessionalTender({ owner, company, title: 'Browse Pro Tender' });

      const res = await request(app)
        .get('/api/v1/professional-tenders')
        .set(authHeader(bidder._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenders.some((t) => t.title === 'Browse Pro Tender')).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/professional-tenders/my-tenders', () => {
    it('returns posted tenders for owner', async () => {
      const { user, company } = await createCompanyWithUser();
      await createPublishedProfessionalTender({ owner: user, company, title: 'My Posted Pro Tender' });

      const res = await request(app)
        .get('/api/v1/professional-tenders/my-tenders')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenders.some((t) => t.title === 'My Posted Pro Tender')).toBe(true);
    });
  });

  describe('GET /api/v1/professional-tenders/saved', () => {
    it('returns saved tenders list for company', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .get('/api/v1/professional-tenders/saved')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tenders)).toBe(true);
    });
  });

  describe('GET /api/v1/professional-tenders/:id', () => {
    it('returns 404 for unknown tender', async () => {
      const { user } = await createCompanyWithUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/professional-tenders/${fakeId}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Professional tender not found' });
    });

    it('returns tender for owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company });

      const res = await request(app)
        .get(`/api/v1/professional-tenders/${tender._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isOwner).toBe(true);
    });
  });

  describe('DELETE /api/v1/professional-tenders/:id', () => {
    it('returns 403 when non-owner deletes', async () => {
      const { user: owner, company } = await createCompanyWithUser();
      const { user: other } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner, company, status: 'draft' });

      const res = await request(app)
        .delete(`/api/v1/professional-tenders/${tender._id}`)
        .set(authHeader(other._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('soft-deletes draft tender for owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company, status: 'draft' });

      const res = await request(app)
        .delete(`/api/v1/professional-tenders/${tender._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, message: 'Professional tender deleted successfully' });

      const deleted = await ProfessionalTender.findById(tender._id);
      expect(deleted.isDeleted).toBe(true);
    });
  });

  describe('POST /api/v1/professional-tenders/:id/publish', () => {
    it('returns 400 when tender is not draft', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company, status: 'published' });

      const res = await request(app)
        .post(`/api/v1/professional-tenders/${tender._id}/publish`)
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('publishes draft tender for owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company, status: 'draft' });

      const res = await request(app)
        .post(`/api/v1/professional-tenders/${tender._id}/publish`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const published = await ProfessionalTender.findById(tender._id);
      expect(published.status).toBe('published');
    });
  });

  describe('POST /api/v1/professional-tenders/create', () => {
    it('returns 403 for freelancer role', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .post('/api/v1/professional-tenders/create')
        .set(authHeader(freelancer._id))
        .send({ title: 'Invalid Create' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when required fields are missing', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .post('/api/v1/professional-tenders/create')
        .set(authHeader(user._id))
        .send({ title: 'Incomplete Tender' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/professional-tenders/:id/toggle-save', () => {
    it('returns 404 for unknown tender', async () => {
      const { user } = await createCompanyWithUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/v1/professional-tenders/${fakeId}/toggle-save`)
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/professional-tenders/:id/stats', () => {
    it('returns stats for tender owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company });

      const res = await request(app)
        .get(`/api/v1/professional-tenders/${tender._id}/stats`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/professional-tenders/companies/list', () => {
    it('returns companies list for invitation', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .get('/api/v1/professional-tenders/companies/list')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.companies)).toBe(true);
    });
  });

  describe('professionalTenderController direct calls', () => {
    function authUser(user) {
      return { _id: user._id, role: user.role, email: user.email };
    }

    it('revealBids returns 400 for open workflow', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({
        owner: user,
        company,
        workflowType: 'open',
      });
      const { res } = await runController(professionalTenderController.revealBids, {
        req: { params: { id: tender._id.toString() }, user: authUser(user) },
      });
      expect(res.statusCode).toBe(400);
    });

    it('inviteCompanies returns 400 for non invite-only tender', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({
        owner: user,
        company,
        visibilityType: 'public',
      });
      const { res } = await runController(professionalTenderController.inviteCompanies, {
        req: { params: { id: tender._id.toString() }, user: authUser(user), body: { companies: [] } },
      });
      expect(res.statusCode).toBe(400);
    });

    it('getProfessionalTenderStats returns 403 for non-owner without access', async () => {
      const { user: owner, company } = await createCompanyWithUser();
      const { user: other } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({
        owner,
        company,
        visibilityType: 'invite_only',
      });
      const { res } = await runController(professionalTenderController.getProfessionalTenderStats, {
        req: { params: { id: tender._id.toString() }, user: authUser(other) },
      });
      expect(res.statusCode).toBe(403);
    });

    it('downloadAttachment returns 404 when attachment not found', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company });
      const { res } = await runController(professionalTenderController.downloadAttachment, {
        req: {
          params: { id: tender._id.toString(), attachmentId: new mongoose.Types.ObjectId().toString() },
          user: authUser(user),
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('previewAttachment returns 404 when attachment not found', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company });
      const { res } = await runController(professionalTenderController.previewAttachment, {
        req: {
          params: { id: tender._id.toString(), attachmentId: new mongoose.Types.ObjectId().toString() },
          user: authUser(user),
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('getMyInvitations returns list for company user', async () => {
      const { user } = await createCompanyWithUser();
      const { res } = await runController(professionalTenderController.getMyInvitations, {
        req: { user: authUser(user), query: { page: 1, limit: 10 } },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('getSavedProfessionalTenders returns saved list', async () => {
      const { user } = await createCompanyWithUser();
      const { res } = await runController(professionalTenderController.getSavedProfessionalTenders, {
        req: { user: authUser(user), query: { page: 1, limit: 10 } },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('toggleSaveProfessionalTender returns 404 for unknown tender', async () => {
      const { user } = await createCompanyWithUser();
      const { res } = await runController(professionalTenderController.toggleSaveProfessionalTender, {
        req: { params: { id: new mongoose.Types.ObjectId().toString() }, user: authUser(user) },
      });
      expect(res.statusCode).toBe(404);
    });

    it('submitCPO returns 400 when tender does not require CPO', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company });
      const { res } = await runController(professionalTenderController.submitCPO, {
        req: { params: { id: tender._id.toString() }, user: authUser(user), body: {} },
      });
      expect(res.statusCode).toBe(400);
    });

    it('getCPOSubmissions returns empty array for company without submission', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company });
      const { user: bidder } = await createCompanyWithUser();
      const { res } = await runController(professionalTenderController.getCPOSubmissions, {
        req: { params: { id: tender._id.toString() }, user: authUser(bidder) },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('getCPOSubmissions returns all for tender owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company });
      const { res } = await runController(professionalTenderController.getCPOSubmissions, {
        req: { params: { id: tender._id.toString() }, user: authUser(user) },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('publishProfessionalTender returns 400 for already published tender', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({
        owner: user,
        company,
        status: 'published',
      });
      const { res } = await runController(professionalTenderController.publishProfessionalTender, {
        req: { params: { id: tender._id.toString() }, user: authUser(user) },
      });
      expect(res.statusCode).toBe(400);
    });

    it('getAddenda returns empty list for tender without addenda', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedProfessionalTender({ owner: user, company });
      const { res } = await runController(professionalTenderController.getAddenda, {
        req: { params: { id: tender._id.toString() }, user: authUser(user) },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('respondToInvitation returns 400 when response missing', async () => {
      const { user } = await createCompanyWithUser();
      const { res } = await runController(professionalTenderController.respondToInvitation, {
        req: {
          params: {
            id: new mongoose.Types.ObjectId().toString(),
            inviteId: new mongoose.Types.ObjectId().toString(),
          },
          user: authUser(user),
          body: {},
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('respondToInvitation returns 404 for unknown tender', async () => {
      const { user } = await createCompanyWithUser();
      const { res } = await runController(professionalTenderController.respondToInvitation, {
        req: {
          params: {
            id: new mongoose.Types.ObjectId().toString(),
            inviteId: new mongoose.Types.ObjectId().toString(),
          },
          user: authUser(user),
          body: { response: 'accepted' },
        },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
