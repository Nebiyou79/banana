const Company = require('../../../src/models/Company');
const { checkCompanyProfile } = require('../../../src/middleware/companyMiddleware');

function createMocks(overrides = {}) {
  const req = {
    user: { id: '507f1f77bcf86cd799439011', role: 'company' },
    originalUrl: '/api/jobs',
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('companyMiddleware', () => {
  it('skips profile check for non-company users', async () => {
    const { req, res, next } = createMocks({ user: { id: '1', role: 'candidate' } });

    await checkCompanyProfile(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('redirects company users without a profile', async () => {
    const userId = '507f1f77bcf86cd799439012';
    const { req, res, next } = createMocks({ user: { id: userId, role: 'company' } });

    await checkCompanyProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(302);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        redirect: '/dashboard/company/profile',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when company profile exists', async () => {
    const user = await require('../../../src/models/User').create({
      name: 'Company Owner',
      email: `company-owner-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'company',
      isActive: true,
    });

    await Company.create({
      user: user._id,
      name: 'Existing Company',
      industry: 'Technology',
    });

    const { req, res, next } = createMocks({ user: { id: user._id.toString(), role: 'company' } });

    await checkCompanyProfile(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
