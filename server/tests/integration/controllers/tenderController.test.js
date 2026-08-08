const request = require('supertest');
const mongoose = require('mongoose');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createPublishedTender, createDraftTender } = require('../../helpers/factories/tenderFactory');
const { runController } = require('../../helpers/runController');
const tenderController = require('../../../src/controllers/tenderController');
const Tender = require('../../../src/models/Tender');

describe('tenderController integration', () => {
  const app = getApp();

  describe('GET /api/v1/tender/categories', () => {
    it('returns tender categories without auth', async () => {
      const res = await request(app).get('/api/v1/tender/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('returns freelance categories when type=freelance via controller', async () => {
      const { res } = await runController(tenderController.getCategories, {
        req: { query: { type: 'freelance' } },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.groups).toBeDefined();
    });
  });

  describe('GET /api/v1/tender/categories/label/:categoryId', () => {
    it('returns 200 with fallback label for unknown category', async () => {
      const res = await request(app).get('/api/v1/tender/categories/label/unknown-category-id');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('unknown-category-id');
    });

    it('returns label for valid freelance category via controller', async () => {
      const categories = Tender.getAllFreelanceCategories();
      const categoryId = categories[0];
      expect(categoryId).toBeDefined();

      const { res } = await runController(tenderController.getCategoryLabel, {
        req: { params: { categoryId }, query: { type: 'freelance' } },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(categoryId);
    });
  });

  describe('GET /api/v1/tender', () => {
    it('returns tenders publicly', async () => {
      await createPublishedTender({ title: 'Public Tender Listing Test' });

      const res = await request(app).get('/api/v1/tender');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/tender/:id', () => {
    it('returns 401 when unauthenticated for non-public tender', async () => {
      const tender = await createPublishedTender({
        tenderCategory: 'professional',
        visibility: { visibilityType: 'companies_only' },
      });

      const res = await request(app).get(`/api/v1/tender/${tender._id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when tender does not exist', async () => {
      const user = await createUser({ role: 'company' });
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/tender/${fakeId}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Tender not found' });
    });

    it('returns tender for owner with full access', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        createdBy: user._id,
        title: 'Owner View Tender',
      });

      const res = await request(app)
        .get(`/api/v1/tender/${tender._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isOwner).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/tender/user/my-tenders', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/v1/tender/user/my-tenders');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns owned tenders for authenticated user', async () => {
      const { user, company } = await createCompanyWithUser();
      await createPublishedTender({
        owner: user._id,
        company: company._id,
        createdBy: user._id,
        title: 'My Tender Item',
      });

      const res = await request(app)
        .get('/api/v1/tender/user/my-tenders')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenders.some((t) => t.title === 'My Tender Item')).toBe(true);
    });
  });

  describe('GET /api/v1/tender/user/owned', () => {
    it('returns paginated owned tenders', async () => {
      const { user, company } = await createCompanyWithUser();
      await createPublishedTender({
        owner: user._id,
        company: company._id,
        createdBy: user._id,
      });

      const res = await request(app)
        .get('/api/v1/tender/user/owned')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/v1/tender/user/saved', () => {
    it('returns saved tenders list', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/tender/user/saved')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenders).toBeDefined();
    });
  });

  describe('GET /api/v1/tender/freelance', () => {
    it('returns 403 for company user', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/tender/freelance')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns freelance tenders for freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/tender/freelance')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/tender/professional', () => {
    it('returns 403 for freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/tender/professional')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns professional tenders for company user', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/tender/professional')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/tender/owner/:id', () => {
    it('returns 404 for unknown tender', async () => {
      const { user } = await createCompanyWithUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/tender/owner/${fakeId}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns owner tender data for owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        createdBy: user._id,
      });

      const res = await request(app)
        .get(`/api/v1/tender/owner/${tender._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('DELETE /api/v1/tender/:id', () => {
    it('returns 403 when non-owner tries to delete', async () => {
      const { user, company } = await createCompanyWithUser();
      const otherUser = await createUser({ role: 'company' });
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        createdBy: user._id,
        status: 'draft',
      });

      const res = await request(app)
        .delete(`/api/v1/tender/${tender._id}`)
        .set(authHeader(otherUser._id));

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, message: 'Not authorized to delete this tender' });
    });

    it('soft-deletes draft tender for owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        createdBy: user._id,
        status: 'draft',
      });

      const res = await request(app)
        .delete(`/api/v1/tender/${tender._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, message: 'Tender deleted successfully' });

      const deleted = await Tender.findById(tender._id);
      expect(deleted.isDeleted).toBe(true);
    });
  });

  describe('POST /api/v1/tender/:id/publish', () => {
    it('returns 400 when publishing non-draft tender', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        createdBy: user._id,
        status: 'published',
      });

      const res = await request(app)
        .post(`/api/v1/tender/${tender._id}/publish`)
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, message: 'Only draft tenders can be published' });
    });

    it('publishes draft freelance tender for owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        createdBy: user._id,
        status: 'draft',
        tenderCategory: 'freelance',
      });

      const res = await request(app)
        .post(`/api/v1/tender/${tender._id}/publish`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const published = await Tender.findById(tender._id);
      expect(published.status).toBe('published');
    });
  });

  describe('POST /api/v1/tender/:id/toggle-save', () => {
    it('returns 404 for unknown tender', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/v1/tender/${fakeId}/toggle-save`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Tender not found' });
    });

    it('saves published tender for authorized freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const tender = await createPublishedTender({
        status: 'published',
        visibility: { visibilityType: 'freelancers_only' },
      });

      const res = await request(app)
        .post(`/api/v1/tender/${tender._id}/toggle-save`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.saved).toBe(true);

      const updated = await Tender.findById(tender._id);
      expect(updated.metadata.savedBy.map(String)).toContain(freelancer._id.toString());
    });
  });

  describe('POST /api/v1/tender/freelance/create', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/tender/freelance/create')
        .send({ title: 'Unauthorized Tender' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 for candidate role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .post('/api/v1/tender/freelance/create')
        .set(authHeader(candidate._id))
        .send({ title: 'Candidate Tender' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when required fields are missing', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .post('/api/v1/tender/freelance/create')
        .set(authHeader(user._id))
        .send({ title: 'Incomplete Tender' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Missing required fields|Engagement type is required/);
    });
  });

  describe('tenderController direct calls', () => {
    function authUser(user) {
      return { _id: user._id, role: user.role, email: user.email };
    }

    function futureDeadline(days = 30) {
      return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    function validFreelanceBody(overrides = {}) {
      return {
        title: 'Test Freelance Tender',
        description: 'Detailed description for integration testing of freelance tender creation.',
        procurementCategory: 'Web Development',
        deadline: futureDeadline(),
        workflowType: 'open',
        freelanceSpecific: {
          engagementType: 'fixed_price',
          budget: { min: 1000, max: 5000, currency: 'ETB' },
        },
        ...overrides,
      };
    }

    it('getCategories returns both freelance and professional categories', async () => {
      const { res } = await runController(tenderController.getCategories, {
        req: { query: {} },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.freelance).toBeDefined();
      expect(res.body.data.professional).toBeDefined();
    });

    it('createFreelanceTender returns 400 when deadline is in the past', async () => {
      const { user } = await createCompanyWithUser();
      const { res } = await runController(tenderController.createFreelanceTender, {
        req: {
          user: authUser(user),
          body: validFreelanceBody({ deadline: new Date(Date.now() - 86400000).toISOString() }),
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/future/i);
    });

    it('updateTender returns 403 for non-owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const other = await createUser({ role: 'company' });
      const tender = await createDraftTender({ owner: user._id, company: company._id });
      const { res } = await runController(tenderController.updateTender, {
        req: { params: { id: tender._id.toString() }, user: authUser(other), body: { title: 'Hijack' } },
      });
      expect(res.statusCode).toBe(403);
    });

    it('getTenderStats returns 403 for unauthorized viewer', async () => {
      const { user, company } = await createCompanyWithUser();
      const stranger = await createUser({ role: 'freelancer' });
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        visibility: { visibilityType: 'companies_only' },
        tenderCategory: 'professional',
      });
      const { res } = await runController(tenderController.getTenderStats, {
        req: { params: { id: tender._id.toString() }, user: authUser(stranger) },
      });
      expect(res.statusCode).toBe(403);
    });

    it('toggleSaveTender unsaves previously saved tender', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const tender = await createPublishedTender({
        metadata: { savedBy: [freelancer._id] },
      });
      const { res } = await runController(tenderController.toggleSaveTender, {
        req: { params: { id: tender._id.toString() }, user: authUser(freelancer) },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.saved).toBe(false);
    });

    it('revealProposals returns 400 for open workflow tender', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        workflowType: 'open',
      });
      const { res } = await runController(tenderController.revealProposals, {
        req: { params: { id: tender._id.toString() }, user: authUser(user) },
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/closed workflow/i);
    });

    it('downloadAttachment returns 404 when attachment not found', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({ owner: user._id, company: company._id });
      const { res } = await runController(tenderController.downloadAttachment, {
        req: {
          params: {
            id: tender._id.toString(),
            attachmentId: new mongoose.Types.ObjectId().toString(),
          },
          user: authUser(user),
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('previewAttachment returns 404 when attachment not found', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({ owner: user._id, company: company._id });
      const { res } = await runController(tenderController.previewAttachment, {
        req: {
          params: {
            id: tender._id.toString(),
            attachmentId: new mongoose.Types.ObjectId().toString(),
          },
          user: authUser(user),
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('inviteUsersToTender returns 404 for unknown tender', async () => {
      const { user } = await createCompanyWithUser();
      const { res } = await runController(tenderController.inviteUsersToTender, {
        req: {
          params: { id: new mongoose.Types.ObjectId().toString() },
          user: authUser(user),
          body: { users: [] },
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('inviteUsersToTender returns 400 for non invite-only tender', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        tenderCategory: 'professional',
        visibility: { visibilityType: 'public' },
      });
      const { res } = await runController(tenderController.inviteUsersToTender, {
        req: {
          params: { id: tender._id.toString() },
          user: authUser(user),
          body: { users: [] },
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('inviteUsersToTender returns 403 for non-owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const { user: other } = await createCompanyWithUser();
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        tenderCategory: 'professional',
        visibility: { visibilityType: 'invite_only' },
      });
      const { res } = await runController(tenderController.inviteUsersToTender, {
        req: {
          params: { id: tender._id.toString() },
          user: authUser(other),
          body: { users: [] },
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('getMyInvitations returns empty list for freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const { res } = await runController(tenderController.getMyInvitations, {
        req: { user: authUser(freelancer), query: {} },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.tenders).toEqual([]);
    });

    it('respondToInvitation returns 404 for unknown tender', async () => {
      const { user } = await createCompanyWithUser();
      const { res } = await runController(tenderController.respondToInvitation, {
        req: {
          params: {
            id: new mongoose.Types.ObjectId().toString(),
            inviteId: new mongoose.Types.ObjectId().toString(),
          },
          user: authUser(user),
          body: { status: 'accepted' },
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('getTenderForEditing returns 404 for unknown tender', async () => {
      const { user } = await createCompanyWithUser();
      const { res } = await runController(tenderController.getTenderForEditing, {
        req: {
          params: { id: new mongoose.Types.ObjectId().toString() },
          user: authUser(user),
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('getTenderForEditing returns 403 for non-owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const { user: other } = await createCompanyWithUser();
      const tender = await createDraftTender({ owner: user, company, createdBy: user._id });
      const { res } = await runController(tenderController.getTenderForEditing, {
        req: { params: { id: tender._id.toString() }, user: authUser(other) },
      });
      expect(res.statusCode).toBe(403);
    });

    it('getMyTenders returns owned tenders for user', async () => {
      const { user, company } = await createCompanyWithUser();
      await createPublishedTender({ owner: user._id, company: company._id });
      const { res } = await runController(tenderController.getMyTenders, {
        req: { user: authUser(user), query: { page: 1, limit: 10 } },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('getTenderStats returns stats for tender owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createPublishedTender({
        owner: user._id,
        company: company._id,
        tenderCategory: 'freelance',
      });
      const { res } = await runController(tenderController.getTenderStats, {
        req: { params: { id: tender._id.toString() }, user: authUser(user) },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.stats).toBeDefined();
    });

    it('createProfessionalTender returns 403 for freelancer role', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const { res } = await runController(tenderController.createProfessionalTender, {
        req: {
          user: authUser(freelancer),
          body: { title: 'Pro', description: 'Desc', procurementCategory: 'IT', deadline: futureDeadline() },
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('createProfessionalTender returns 400 when reference number missing', async () => {
      const { user } = await createCompanyWithUser();
      const { res } = await runController(tenderController.createProfessionalTender, {
        req: {
          user: authUser(user),
          body: {
            title: 'Pro Tender',
            description: 'Professional tender description for validation testing.',
            procurementCategory: 'Construction',
            deadline: futureDeadline(),
            professionalSpecific: { procuringEntity: 'Entity' },
          },
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('updateTender updates draft tender for owner', async () => {
      const { user, company } = await createCompanyWithUser();
      const tender = await createDraftTender({ owner: user, company, createdBy: user._id });
      const { res } = await runController(tenderController.updateTender, {
        req: {
          params: { id: tender._id.toString() },
          user: authUser(user),
          body: { title: 'Updated Tender Title' },
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.tender.title).toBe('Updated Tender Title');
    });

    it('getTenders supports search query filter', async () => {
      await createPublishedTender({ title: 'UniqueSearchTenderXYZ' });
      const { res } = await runController(tenderController.getTenders, {
        req: { query: { search: 'UniqueSearchTenderXYZ', page: 1, limit: 10 } },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((t) => t.title.includes('UniqueSearchTenderXYZ'))).toBe(true);
    });
  });
});
