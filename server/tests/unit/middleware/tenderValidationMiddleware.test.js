const mongoose = require('mongoose');
const Tender = require('../../../src/models/Tender');
const User = require('../../../src/models/User');
const {
  validateClosedTenderEdit,
  validateTenderCreation,
  validateCanApplyToTender,
} = require('../../../src/middleware/tenderValidationMiddleware');

function createMocks(overrides = {}) {
  const req = {
    method: 'PUT',
    params: {},
    body: {},
    parsedBody: {},
    user: { _id: new mongoose.Types.ObjectId(), role: 'company' },
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('tenderValidationMiddleware', () => {
  it('blocks editing locked closed tenders', async () => {
    jest.spyOn(Tender, 'findById').mockResolvedValue({
      workflowType: 'closed',
      status: 'locked',
    });

    const { req, res, next } = createMocks({ params: { id: new mongoose.Types.ObjectId().toString() } });

    await validateClosedTenderEdit(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'CLOSED_TENDER_LOCKED' })
    );

    Tender.findById.mockRestore();
  });

  it('rejects tender creation for freelancers', async () => {
    const { req, res, next } = createMocks({
      user: { role: 'freelancer' },
      parsedBody: { tenderCategory: 'freelance' },
    });

    await validateTenderCreation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ROLE_NO_CREATE_PERMISSION' })
    );
  });

  it('returns 400 when apply validation is missing tender id', async () => {
    const { req, res, next } = createMocks({ params: {}, body: {} });

    await validateCanApplyToTender(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Tender ID is required' })
    );
  });
});
