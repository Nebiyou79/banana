const mongoose = require('mongoose');
const User = require('../../../src/models/User');

describe('User model', () => {
  it('rejects invalid email addresses', async () => {
    const user = new User({
      name: 'Test User',
      email: 'not-an-email',
      passwordHash: 'secret123',
    });

    await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('hashes passwordHash on save', async () => {
    const user = await User.create({
      name: 'Hash Test',
      email: `hash-${Date.now()}@test.com`,
      passwordHash: 'plainpass',
    });

    const withHash = await User.findById(user._id).select('+passwordHash');
    expect(withHash.passwordHash).not.toBe('plainpass');
    expect(withHash.passwordHash.length).toBeGreaterThan(20);
  });

  it('comparePassword returns true for matching password', async () => {
    const user = await User.create({
      name: 'Compare Test',
      email: `compare-${Date.now()}@test.com`,
      passwordHash: 'mypassword',
    });

    const withHash = await User.findById(user._id).select('+passwordHash');
    await expect(withHash.comparePassword('mypassword')).resolves.toBe(true);
    await expect(withHash.comparePassword('wrong')).resolves.toBe(false);
  });

  it('toJSON strips passwordHash', async () => {
    const user = await User.create({
      name: 'JSON Test',
      email: `json-${Date.now()}@test.com`,
      passwordHash: 'secret123',
    });

    const json = user.toJSON();
    expect(json.passwordHash).toBeUndefined();
  });
});
