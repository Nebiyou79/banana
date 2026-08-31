const jwt = require('jsonwebtoken');
const { verifyToken, restrictTo, optionalAuth } = require('../../../src/middleware/authMiddleware');

function createMocks(overrides = {}) {
  const req = {
    header: jest.fn(),
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

describe('authMiddleware', () => {
  it('returns 401 when no token is provided', async () => {
    const { req, res, next } = createMocks();
    req.header.mockReturnValue(undefined);

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Access denied. No token provided.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid token with mock req/res', async () => {
    const { req, res, next } = createMocks();
    req.header.mockReturnValue('Bearer invalid-token');

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('optionalAuth continues without user when token is invalid', async () => {
    const { req, res, next } = createMocks();
    req.header.mockReturnValue('Bearer invalid-token');

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('restrictTo returns 403 when role is not allowed', () => {
    const { req, res, next } = createMocks({ user: { role: 'candidate' } });
    const middleware = restrictTo('admin');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'You do not have permission to perform this action',
    });
  });
});
