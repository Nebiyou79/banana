const request = require('supertest');
const mongoose = require('mongoose');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createPublishedFreelanceTender } = require('../../helpers/factories/freelanceTenderFactory');
const { runController } = require('../../helpers/runController');
const proposalController = require('../../../src/controllers/proposalController');
const Proposal = require('../../../src/models/Proposal');

function validProposalFields(overrides = {}) {
  return {
    coverLetter: 'A'.repeat(50),
    bidType: 'fixed',
    proposedAmount: 1500,
    deliveryTime: { value: 7, unit: 'days' },
    availability: 'full-time',
    ...overrides,
  };
}

async function seedProposalContext(overrides = {}) {
  const { user: owner, company } = await createCompanyWithUser();
  const freelancer = await createUser({ role: 'freelancer' });
  const tender = await createPublishedFreelanceTender({ owner, company, ...overrides.tender });

  return { owner, company, freelancer, tender };
}

describe('proposalController integration', () => {
  const app = getApp();

  describe('GET /api/v1/proposals/my-proposals', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/proposals/my-proposals');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 for candidate role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/proposals/my-proposals')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns proposals for freelancer', async () => {
      const { freelancer, tender } = await seedProposalContext();
      await Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposalFields(),
      });

      const res = await request(app)
        .get('/api/v1/proposals/my-proposals')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.proposals.length).toBeGreaterThan(0);
      assertNoPassword(res.body);
    });
  });

  describe('POST /api/v1/proposals/create', () => {
    it('returns 403 for candidate role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .post('/api/v1/proposals/create')
        .set(authHeader(candidate._id))
        .send({ tenderId: new mongoose.Types.ObjectId(), title: 'Test Proposal' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when tender does not exist', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const fakeTenderId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post('/api/v1/proposals/create')
        .set(authHeader(freelancer._id))
        .send({ tenderId: fakeTenderId, ...validProposalFields() });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Tender not found', code: 'TENDER_NOT_FOUND' });
    });

    it('returns 400 when tender is not published', async () => {
      const { freelancer, tender } = await seedProposalContext({
        tender: { status: 'draft' },
      });

      const res = await request(app)
        .post('/api/v1/proposals/create')
        .set(authHeader(freelancer._id))
        .send({ tenderId: tender._id, ...validProposalFields() });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, code: 'TENDER_NOT_ACCEPTING' });
    });

    it('creates draft proposal for freelancer', async () => {
      const { freelancer, tender } = await seedProposalContext();

      const res = await request(app)
        .post('/api/v1/proposals/create')
        .set(authHeader(freelancer._id))
        .send({ tenderId: tender._id, ...validProposalFields() });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe('DRAFT_CREATED');

      const saved = await Proposal.findOne({ tender: tender._id, freelancer: freelancer._id });
      expect(saved).not.toBeNull();
      expect(saved.isDraft).toBe(true);
    });
  });

  describe('GET /api/v1/proposals/tenders/:tenderId/my-proposal', () => {
    it('returns null when freelancer has no proposal', async () => {
      const { freelancer, tender } = await seedProposalContext();

      const res = await request(app)
        .get(`/api/v1/proposals/tenders/${tender._id}/my-proposal`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('returns freelancer proposal for tender', async () => {
      const { freelancer, tender } = await seedProposalContext();
      const proposal = await Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposalFields(),
      });

      const res = await request(app)
        .get(`/api/v1/proposals/tenders/${tender._id}/my-proposal`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(proposal._id.toString());
    });
  });

  describe('GET /api/v1/proposals/tenders/:tenderId/proposals', () => {
    it('returns 403 for freelancer', async () => {
      const { freelancer, tender } = await seedProposalContext();

      const res = await request(app)
        .get(`/api/v1/proposals/tenders/${tender._id}/proposals`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when tender not found', async () => {
      const { owner } = await seedProposalContext();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/proposals/tenders/${fakeId}/proposals`)
        .set(authHeader(owner._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, code: 'TENDER_NOT_FOUND' });
    });

    it('returns submitted proposals for tender owner', async () => {
      const { owner, freelancer, tender } = await seedProposalContext();
      const proposal = await Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposalFields(),
      });
      await proposal.submitProposal();

      const res = await request(app)
        .get(`/api/v1/proposals/tenders/${tender._id}/proposals`)
        .set(authHeader(owner._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.proposals.length).toBe(1);
    });
  });

  describe('GET /api/v1/proposals/:proposalId', () => {
    it('returns 404 for unknown proposal', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/proposals/${fakeId}`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, code: 'PROPOSAL_NOT_FOUND' });
    });

    it('returns proposal detail for freelancer owner', async () => {
      const { freelancer, tender } = await seedProposalContext();
      const proposal = await Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposalFields(),
      });

      const res = await request(app)
        .get(`/api/v1/proposals/${proposal._id}`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(proposal._id.toString());
    });
  });

  describe('POST /api/v1/proposals/:proposalId/submit', () => {
    it('returns 400 when draft is incomplete', async () => {
      const { freelancer, tender } = await seedProposalContext();
      const proposal = await Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposalFields(),
      });
      await Proposal.updateOne(
        { _id: proposal._id },
        {
          coverLetter: 'Too short',
          proposedAmount: 0,
          availability: '',
          deliveryTime: { value: null, unit: '' },
        },
        { runValidators: false }
      );

      const res = await request(app)
        .post(`/api/v1/proposals/${proposal._id}/submit`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('submits valid draft proposal', async () => {
      const { freelancer, tender } = await seedProposalContext();
      const proposal = await Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposalFields(),
      });

      const res = await request(app)
        .post(`/api/v1/proposals/${proposal._id}/submit`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe('PROPOSAL_SUBMITTED');

      const submitted = await Proposal.findById(proposal._id);
      expect(submitted.isDraft).toBe(false);
      expect(submitted.status).toBe('submitted');
    });
  });

  describe('POST /api/v1/proposals/:proposalId/withdraw', () => {
    it('returns 400 when proposal cannot be withdrawn', async () => {
      const { freelancer, tender } = await seedProposalContext();
      const proposal = await Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposalFields(),
        isDraft: false,
        status: 'awarded',
      });

      const res = await request(app)
        .post(`/api/v1/proposals/${proposal._id}/withdraw`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CANNOT_WITHDRAW');
    });

    it('withdraws submitted proposal', async () => {
      const { freelancer, tender } = await seedProposalContext();
      const proposal = await Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposalFields(),
      });
      await proposal.submitProposal();

      const res = await request(app)
        .post(`/api/v1/proposals/${proposal._id}/withdraw`)
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe('PROPOSAL_WITHDRAWN');
    });
  });

  describe('PATCH /api/v1/proposals/:proposalId/status', () => {
    it('returns 400 when status is missing', async () => {
      const { owner, freelancer, tender } = await seedProposalContext();
      const proposal = await Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposalFields(),
      });
      await proposal.submitProposal();

      const res = await request(app)
        .patch(`/api/v1/proposals/${proposal._id}/status`)
        .set(authHeader(owner._id))
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_STATUS');
    });

    it('updates proposal status for tender owner', async () => {
      const { owner, freelancer, tender } = await seedProposalContext();
      const proposal = await Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposalFields(),
      });
      await proposal.submitProposal();

      const res = await request(app)
        .patch(`/api/v1/proposals/${proposal._id}/status`)
        .set(authHeader(owner._id))
        .send({ status: 'under_review' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Proposal.findById(proposal._id);
      expect(updated.status).toBe('under_review');
    });
  });

  describe('GET /api/v1/proposals/tenders/:tenderId/proposals/stats', () => {
    it('returns proposal stats for tender owner', async () => {
      const { owner, tender } = await seedProposalContext();

      const res = await request(app)
        .get(`/api/v1/proposals/tenders/${tender._id}/proposals/stats`)
        .set(authHeader(owner._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('proposalController direct calls', () => {
    it('getMyProposals returns paginated list via runController', async () => {
      const { freelancer, tender } = await seedProposalContext();
      await Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposalFields(),
      });

      const { res } = await runController(proposalController.getMyProposals, {
        req: {
          user: { userId: freelancer._id, _id: freelancer._id },
          query: {},
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.proposals.length).toBeGreaterThan(0);
    });
  });
});
