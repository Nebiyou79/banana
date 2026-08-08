const request = require('supertest');
const mongoose = require('mongoose');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createPublishedProfessionalTender } = require('../../helpers/factories/professionalTenderFactory');
const { runController } = require('../../helpers/runController');
const bidController = require('../../../src/controllers/bidController');
const Bid = require('../../../src/models/Bid');

function validCoverSheet(overrides = {}) {
  return {
    companyName: 'Bidder Co',
    authorizedRepresentative: 'Jane Doe',
    companyEmail: 'bidder@test.com',
    companyPhone: '0911223344',
    totalBidValue: 250000,
    declarationAccepted: true,
    ...overrides,
  };
}

async function seedBid(overrides = {}) {
  const { user: owner, company } = await createCompanyWithUser();
  const { user: bidder, company: bidderCompany } = await createCompanyWithUser();
  const tender = await createPublishedProfessionalTender({ owner, company, ...overrides.tender });

  const bid = await Bid.create({
    tender: tender._id,
    bidder: bidder._id,
    bidderCompany: bidderCompany._id,
    bidAmount: overrides.bidAmount || 250000,
    coverSheet: validCoverSheet(),
    status: overrides.status || 'submitted',
    ...overrides.bid,
  });

  return { owner, bidder, bidderCompany, tender, bid };
}

describe('bidController integration', () => {
  const app = getApp();

  describe('GET /api/v1/bids/my-bids', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/bids/my-bids');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 for freelancer role', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/bids/my-bids')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns bids list for company user', async () => {
      const { bidder } = await seedBid();
      const res = await request(app)
        .get('/api/v1/bids/my-bids')
        .set(authHeader(bidder._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/bids/:tenderId', () => {
    it('returns 404 for unknown tender', async () => {
      const { bidder } = await seedBid();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/bids/${fakeId}`)
        .set(authHeader(bidder._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, error: 'Tender not found.' });
    });

    it('returns bids for tender owner', async () => {
      const { owner, tender, bid } = await seedBid();

      const res = await request(app)
        .get(`/api/v1/bids/${tender._id}`)
        .set(authHeader(owner._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalBids).toBeGreaterThanOrEqual(1);
      expect(res.body.data.bids.some((b) => b._id.toString() === bid._id.toString())).toBe(true);
    });
  });

  describe('GET /api/v1/bids/:tenderId/my-bid', () => {
    it('returns null when user has not bid', async () => {
      const { owner, tender } = await seedBid();

      const res = await request(app)
        .get(`/api/v1/bids/${tender._id}/my-bid`)
        .set(authHeader(owner._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('returns current user bid', async () => {
      const { bidder, tender, bid } = await seedBid();

      const res = await request(app)
        .get(`/api/v1/bids/${tender._id}/my-bid`)
        .set(authHeader(bidder._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(bid._id.toString());
    });
  });

  describe('POST /api/v1/bids/:tenderId', () => {
    it('returns 403 for freelancer role', async () => {
      const { tender } = await seedBid();
      const freelancer = await createUser({ role: 'freelancer' });

      const res = await request(app)
        .post(`/api/v1/bids/${tender._id}`)
        .set(authHeader(freelancer._id))
        .send({ bidAmount: 100000 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when tender does not exist', async () => {
      const { user: bidder } = await createCompanyWithUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/v1/bids/${fakeId}`)
        .set(authHeader(bidder._id))
        .send({ bidAmount: 100000 });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, error: 'Tender not found.' });
    });

    it('returns 400 when bid amount is invalid', async () => {
      const { owner, tender } = await seedBid();
      const { user: bidder } = await createCompanyWithUser();

      const res = await request(app)
        .post(`/api/v1/bids/${tender._id}`)
        .set(authHeader(bidder._id))
        .send({ bidAmount: -100 });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, error: 'A valid bid amount greater than 0 is required.' });
    });

    it('submits bid for published open tender', async () => {
      const { owner, tender } = await seedBid({ tender: { workflowType: 'open' } });
      const { user: bidder } = await createCompanyWithUser();

      const res = await request(app)
        .post(`/api/v1/bids/${tender._id}`)
        .set(authHeader(bidder._id))
        .send({ bidAmount: 180000, currency: 'ETB' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Bid submitted successfully');

      const saved = await Bid.findOne({ tender: tender._id, bidder: bidder._id, isDeleted: false });
      expect(saved).not.toBeNull();
      expect(saved.bidAmount).toBe(180000);
    });
  });

  describe('PUT /api/v1/bids/:tenderId/:bidId', () => {
    it('returns 404 when bid not found for user', async () => {
      const { owner, tender } = await seedBid();
      const { user: otherBidder } = await createCompanyWithUser();
      const fakeBidId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/v1/bids/${tender._id}/${fakeBidId}`)
        .set(authHeader(otherBidder._id))
        .send({ bidAmount: 200000 });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, error: 'Bid not found or you are not the owner.' });
    });

    it('updates bid amount for bidder', async () => {
      const { bidder, tender, bid } = await seedBid();

      const res = await request(app)
        .put(`/api/v1/bids/${tender._id}/${bid._id}`)
        .set(authHeader(bidder._id))
        .send({ bidAmount: 275000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Bid.findById(bid._id);
      expect(updated.bidAmount).toBe(275000);
    });
  });

  describe('DELETE /api/v1/bids/:tenderId/:bidId', () => {
    it('returns 404 when bid not found', async () => {
      const { bidder, tender } = await seedBid();
      const fakeBidId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/v1/bids/${tender._id}/${fakeBidId}`)
        .set(authHeader(bidder._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, error: 'Bid not found.' });
    });

    it('withdraws bid for owner', async () => {
      const { bidder, tender, bid } = await seedBid();

      const res = await request(app)
        .delete(`/api/v1/bids/${tender._id}/${bid._id}`)
        .set(authHeader(bidder._id));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, message: 'Bid withdrawn successfully.' });

      const withdrawn = await Bid.findById(bid._id);
      expect(withdrawn.status).toBe('withdrawn');
      expect(withdrawn.isDeleted).toBe(true);
    });
  });

  describe('PATCH /api/v1/bids/:tenderId/:bidId/status', () => {
    it('returns 403 when non-owner updates status', async () => {
      const { bidder, tender, bid } = await seedBid();

      const res = await request(app)
        .patch(`/api/v1/bids/${tender._id}/${bid._id}/status`)
        .set(authHeader(bidder._id))
        .send({ status: 'under_review' });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, error: 'Only the tender owner can update bid status.' });
    });

    it('returns 400 for invalid status transition', async () => {
      const { owner, tender, bid } = await seedBid({ status: 'submitted' });

      const res = await request(app)
        .patch(`/api/v1/bids/${tender._id}/${bid._id}/status`)
        .set(authHeader(owner._id))
        .send({ status: 'awarded' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Cannot transition/);
    });

    it('updates bid status for tender owner', async () => {
      const { owner, tender, bid } = await seedBid({ status: 'submitted' });

      const res = await request(app)
        .patch(`/api/v1/bids/${tender._id}/${bid._id}/status`)
        .set(authHeader(owner._id))
        .send({ status: 'under_review' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Bid.findById(bid._id);
      expect(updated.status).toBe('under_review');
    });
  });

  describe('PATCH /api/v1/bids/:tenderId/:bidId/compliance', () => {
    it('returns 404 when bid not found', async () => {
      const { owner, tender } = await seedBid();
      const fakeBidId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .patch(`/api/v1/bids/${tender._id}/${fakeBidId}/compliance`)
        .set(authHeader(owner._id))
        .send({ complianceChecklist: [] });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('bidController direct calls', () => {
    it('getMyAllBids returns paginated bids via runController', async () => {
      const { bidder } = await seedBid();

      const { res } = await runController(bidController.getMyAllBids, {
        req: {
          user: { _id: bidder._id, role: 'company' },
          query: { page: 1, limit: 10 },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('getMyAllBids supports status filter', async () => {
      const { bidder } = await seedBid();
      const { res } = await runController(bidController.getMyAllBids, {
        req: {
          user: { _id: bidder._id, role: 'company' },
          query: { status: 'submitted', page: 1, limit: 10 },
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('submitBid returns 400 when tender is not published', async () => {
      const { tender } = await seedBid({ tender: { status: 'draft' } });
      const { user: newBidder } = await createCompanyWithUser();
      const { res } = await runController(bidController.submitBid, {
        req: {
          params: { tenderId: tender._id.toString() },
          user: { _id: newBidder._id, role: newBidder.role },
          body: { bidAmount: 100000 },
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('submitEvaluationScore returns 400 for non-owner', async () => {
      const { bidder, tender, bid } = await seedBid();
      const { res } = await runController(bidController.submitEvaluationScore, {
        req: {
          params: { tenderId: tender._id.toString(), bidId: bid._id.toString() },
          user: { _id: bidder._id, role: bidder.role },
          body: { score: 85, criteria: 'technical' },
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('verifyCPOReturn returns 400 when bid not found', async () => {
      const { owner, tender } = await seedBid();
      const { res } = await runController(bidController.verifyCPOReturn, {
        req: {
          params: { tenderId: tender._id.toString(), bidId: new mongoose.Types.ObjectId().toString() },
          user: { _id: owner._id, role: owner.role },
          body: { verified: true },
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('updateComplianceChecklist allows bidder to update compliance', async () => {
      const { bidder, tender, bid } = await seedBid();
      const { res } = await runController(bidController.updateComplianceChecklist, {
        req: {
          params: { tenderId: tender._id.toString(), bidId: bid._id.toString() },
          user: { _id: bidder._id, role: bidder.role },
          body: { complianceChecklist: [{ item: 'License', met: true }] },
        },
      });
      expect(res.statusCode).toBe(200);
    });

    it('getMyBid returns null data when user has no bid on tender', async () => {
      const { tender } = await seedBid();
      const { user: outsider } = await createCompanyWithUser();
      const { res } = await runController(bidController.getMyBid, {
        req: {
          params: { tenderId: tender._id.toString() },
          user: { _id: outsider._id, role: outsider.role },
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('updateBid returns 404 when tender owner tries to update bidder bid', async () => {
      const { owner, tender, bid } = await seedBid();
      const { res } = await runController(bidController.updateBid, {
        req: {
          params: { tenderId: tender._id.toString(), bidId: bid._id.toString() },
          user: { _id: owner._id, role: owner.role },
          body: { bidAmount: 999999 },
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('withdrawBid returns 404 for unknown bid', async () => {
      const { bidder, tender } = await seedBid();
      const { res } = await runController(bidController.withdrawBid, {
        req: {
          params: { tenderId: tender._id.toString(), bidId: new mongoose.Types.ObjectId().toString() },
          user: { _id: bidder._id, role: bidder.role },
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('updateBidStatus returns 403 for non-owner', async () => {
      const { bidder, tender, bid } = await seedBid();
      const { res } = await runController(bidController.updateBidStatus, {
        req: {
          params: { tenderId: tender._id.toString(), bidId: bid._id.toString() },
          user: { _id: bidder._id, role: bidder.role },
          body: { status: 'under_review' },
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('getBids returns bids list for any authenticated company', async () => {
      const { tender } = await seedBid();
      const { user: outsider } = await createCompanyWithUser();
      const { res } = await runController(bidController.getBids, {
        req: {
          params: { tenderId: tender._id.toString() },
          user: { _id: outsider._id, role: outsider.role },
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalBids).toBeGreaterThanOrEqual(1);
    });
  });
});
