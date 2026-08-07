const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const createDefaultAdmin = require('../../../src/utils/createAdmin');

describe('createDefaultAdmin', () => {
  let savedAdminEmail;
  let savedAdminPassword;

  beforeAll(() => {
    process.env.MONGODB = process.env.MONGODB_URI;
  });

  beforeEach(() => {
    savedAdminEmail = process.env.ADMIN_EMAIL;
    savedAdminPassword = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
  });

  afterEach(() => {
    if (savedAdminEmail !== undefined) process.env.ADMIN_EMAIL = savedAdminEmail;
    else delete process.env.ADMIN_EMAIL;
    if (savedAdminPassword !== undefined) process.env.ADMIN_PASSWORD = savedAdminPassword;
    else delete process.env.ADMIN_PASSWORD;
  });

  it('returns early when email and password are missing', async () => {
    const result = await createDefaultAdmin({ email: '', password: '' });
    expect(result).toBeUndefined();
  });

  it('creates a new admin when none exists', async () => {
    const email = `admin-${Date.now()}@test.com`;
    const saved = await createDefaultAdmin({
      email,
      password: 'AdminPass123!',
      name: 'Test Admin',
    });

    expect(saved).toBeTruthy();
    expect(saved.email).toBe(email);
    expect(saved.role).toBe('admin');
  });

  it('returns existing admin without creating duplicate', async () => {
    const email = `existing-admin-${Date.now()}@test.com`;
    const first = await createDefaultAdmin({
      email,
      password: 'AdminPass123!',
      name: 'Existing Admin',
    });

    const second = await createDefaultAdmin({
      email,
      password: 'AdminPass123!',
      name: 'Existing Admin',
    });

    expect(second._id.toString()).toBe(first._id.toString());
    const count = await User.countDocuments({ email, role: 'admin' });
    expect(count).toBe(1);
  });
});
