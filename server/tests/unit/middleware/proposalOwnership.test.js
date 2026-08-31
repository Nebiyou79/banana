const mongoose = require('mongoose');
const Proposal = require('../../../src/models/Proposal');
const User = require('../../../src/models/User');
const { requireProposalOwner, requireTenderOwner } = require('../../../src/middleware/proposalOwnership');

function createMocks(params = {}, user = {}) {
  const req = { params, user };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('proposalOwnership', () => {
  it('returns 404 when proposal does not exist', async () => {
    const { req, res, next } = createMocks(
      { proposalId: new mongoose.Types.ObjectId().toString() },
      { userId: new mongoose.Types.ObjectId().toString() }
    );

    await requireProposalOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PROPOSAL_NOT_FOUND' })
    );
  });

  it('returns 403 when freelancer is not the proposal owner', async () => {
    const owner = await User.create({
      name: 'Owner',
      email: `owner-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'freelancer',
      isActive: true,
    });
    const other = await User.create({
      name: 'Other',
      email: `other-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'freelancer',
      isActive: true,
    });

    const proposal = await Proposal.create({
      freelancer: owner._id,
      tender: new mongoose.Types.ObjectId(),
      coverLetter: 'Cover letter text long enough for validation requirements.',
      bidType: 'fixed',
      proposedAmount: 1000,
      deliveryTime: { value: 2, unit: 'weeks' },
      availability: 'full-time',
      status: 'submitted',
    });

    const { req, res, next } = createMocks(
      { proposalId: proposal._id.toString() },
      { userId: other._id.toString() }
    );

    await requireProposalOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'FORBIDDEN' })
    );
  });

  it('returns 400 for invalid proposal id format', async () => {
    const { req, res, next } = createMocks({ proposalId: 'bad-id' }, { userId: '507f1f77bcf86cd799439011' });

    await requireTenderOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INVALID_ID' })
    );
  });
});
