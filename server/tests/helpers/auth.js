const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');

async function createUser(overrides = {}) {
  const suffix = Date.now() + Math.random().toString(36).slice(2, 8);
  const user = await User.create({
    name: overrides.name || 'Test User',
    email: overrides.email || `user-${suffix}@test.com`,
    passwordHash: overrides.passwordHash || 'password123',
    role: overrides.role || 'candidate',
    emailVerified: overrides.emailVerified !== undefined ? overrides.emailVerified : true,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    ...overrides,
  });
  return user;
}

function signToken(userId, extra = {}) {
  return jwt.sign({ userId: userId.toString(), ...extra }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
}

function authHeader(userId, extra = {}) {
  return { Authorization: `Bearer ${signToken(userId, extra)}` };
}

function assertNoPassword(body) {
  const json = JSON.stringify(body);
  expect(json).not.toMatch(/passwordHash/i);
  expect(json).not.toMatch(/"password"\s*:/);
}

module.exports = { createUser, signToken, authHeader, assertNoPassword };
