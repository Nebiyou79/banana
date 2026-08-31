const { validateFreelancerProfile, validatePortfolioItem } = require('../../../src/middleware/freelancerValidation');

function createMocks(body = {}, query = {}) {
  const req = { body, query, params: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('freelancerValidation', () => {
  it('passes valid freelancer profile updates', async () => {
    const { req, res, next } = createMocks({
      name: 'Jane Freelancer',
      bio: 'Available for remote work',
      hourlyRate: 45,
      experienceLevel: 'expert',
    });

    await validateFreelancerProfile(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects invalid experience level', async () => {
    const { req, res, next } = createMocks({ experienceLevel: 'legendary' });

    await validateFreelancerProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, code: 'VALIDATION_ERROR' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('requires portfolio title and description', async () => {
    const { req, res, next } = createMocks({ title: 'A', description: 'Too short' });

    await validatePortfolioItem(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' })
    );
  });
});
