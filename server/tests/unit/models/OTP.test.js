const mongoose = require('mongoose');
const OTP = require('../../../src/models/OTP');

describe('OTP model', () => {
  it('saves with valid minimal data', async () => {
    const otp = await OTP.create({
      email: 'verify@test.com',
      otp: '123456',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    expect(otp.type).toBe('register');
    expect(otp.maxAttempts).toBe(5);
  });

  it('isValid returns true when attempts are below max and not expired', async () => {
    const otp = await OTP.create({
      email: 'valid@test.com',
      otp: '654321',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 2,
    });

    expect(otp.isValid()).toBe(true);
  });

  it('isValid returns false after max attempts or expiry', async () => {
    const maxed = await OTP.create({
      email: 'maxed@test.com',
      otp: '111111',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 5,
    });

    const expired = await OTP.create({
      email: 'expired@test.com',
      otp: '222222',
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(maxed.isValid()).toBe(false);
    expect(expired.isValid()).toBe(false);
  });

  it('incrementAttempt persists increased attempt count', async () => {
    const otp = await OTP.create({
      email: 'attempt@test.com',
      otp: '333333',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await otp.incrementAttempt();

    const refreshed = await OTP.findById(otp._id);
    expect(refreshed.attempts).toBe(1);
  });
});
