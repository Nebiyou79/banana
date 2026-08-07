const Organization = require('../../../src/models/Organization');
const { checkOrganizationProfile } = require('../../../src/middleware/organizationMiddleware');

function createMocks(overrides = {}) {
  const req = {
    user: { id: '507f1f77bcf86cd799439011', role: 'organization' },
    originalUrl: '/api/tenders',
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('organizationMiddleware', () => {
  it('skips profile check for non-organization users', async () => {
    const { req, res, next } = createMocks({ user: { id: '1', role: 'company' } });

    await checkOrganizationProfile(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('redirects organization users without a profile', async () => {
    const { req, res, next } = createMocks({
      user: { id: '507f1f77bcf86cd799439013', role: 'organization' },
    });

    await checkOrganizationProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(302);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        redirect: '/dashboard/organization/profile',
      })
    );
  });

  it('calls next when organization profile exists', async () => {
    const userId = '507f1f77bcf86cd799439014';
    jest.spyOn(Organization, 'findOne').mockResolvedValue({
      _id: '507f1f77bcf86cd799439015',
      user: userId,
      name: 'Test Organization',
    });

    const { req, res, next } = createMocks({ user: { id: userId, role: 'organization' } });

    await checkOrganizationProfile(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();

    Organization.findOne.mockRestore();
  });
});
