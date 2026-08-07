const mongoose = require('mongoose');
const PasswordReset = require('../../../src/models/PasswordReset');

describe('PasswordReset model', () => {
  it('generateToken returns a 64-character hex string', () => {
    const token = PasswordReset.generateToken();

    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it('isValid returns true for unused non-expired tokens', async () => {
    const reset = await PasswordReset.create({
      email: 'user@test.com',
      token: PasswordReset.generateToken(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    expect(reset.isValid()).toBe(true);
  });

  it('isValid returns false when token is used or expired', async () => {
    const used = await PasswordReset.create({
      email: 'used@test.com',
      token: PasswordReset.generateToken(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      used: true,
    });

    const expired = await PasswordReset.create({
      email: 'expired@test.com',
      token: PasswordReset.generateToken(),
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(used.isValid()).toBe(false);
    expect(expired.isValid()).toBe(false);
  });

  it('rejects duplicate tokens', async () => {
    await PasswordReset.syncIndexes();
    const token = PasswordReset.generateToken();

    await PasswordReset.create({
      email: 'first@test.com',
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    let error;
    try {
      await PasswordReset.create({
        email: 'second@test.com',
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000);
  });
});
