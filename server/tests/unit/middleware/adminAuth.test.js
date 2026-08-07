const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const adminAuth = require('../../../src/middleware/adminAuth');
const User = require('../../../src/models/User');

function createMocks(overrides = {}) {
  const req = {
    header: jest.fn(),
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('adminAuth', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const { req, res, next } = createMocks();
    req.header.mockReturnValue(undefined);

    await adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided or invalid format' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid token', async () => {
    const { req, res, next } = createMocks();
    req.header.mockReturnValue('Bearer not-a-valid-token');

    await adminAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and attaches user for valid admin token', async () => {
    const admin = await User.create({
      name: 'Admin User',
      email: `admin-auth-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'admin',
      isActive: true,
    });

    const token = jwt.sign({ userId: admin._id.toString() }, process.env.JWT_SECRET);
    const { req, res, next } = createMocks();
    req.header.mockReturnValue(`Bearer ${token}`);

    await adminAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user._id.toString()).toBe(admin._id.toString());
    expect(res.status).not.toHaveBeenCalled();
  });
});
