const { restrictTo, isOwnerOrAdmin } = require('../../../src/middleware/roleMiddleware');

function createMocks(overrides = {}) {
  const req = {
    user: null,
    params: {},
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('roleMiddleware', () => {
  it('returns 401 when user is missing', () => {
    const { req, res, next } = createMocks();
    const middleware = restrictTo('admin');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication required',
    });
  });

  it('returns 403 when role is not allowed', () => {
    const { req, res, next } = createMocks({ user: { role: 'candidate' } });
    const middleware = restrictTo('admin', 'company');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'You do not have permission to perform this action',
    });
  });

  it('allows admin to bypass ownership checks', () => {
    const { req, res, next } = createMocks({
      user: { role: 'admin', userId: 'admin-id' },
      params: { id: 'someone-else' },
    });
    const middleware = isOwnerOrAdmin('params.id');

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when non-admin user is not the owner', () => {
    const { req, res, next } = createMocks({
      user: { role: 'candidate', userId: 'user-1' },
      params: { id: 'user-2' },
    });
    const middleware = isOwnerOrAdmin('params.id');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'You can only access your own resources',
    });
  });
});
