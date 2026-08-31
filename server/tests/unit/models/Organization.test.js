const mongoose = require('mongoose');
const Organization = require('../../../src/models/Organization');
const { createUser } = require('../../helpers/auth');

describe('Organization model', () => {
  it('rejects invalid registration number format', async () => {
    const user = await createUser({ role: 'organization' });

    await expect(
      Organization.create({
        name: 'Bad Reg Org',
        user: user._id,
        registrationNumber: '123',
      })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('validates minimal organization fields before save', async () => {
    const user = await createUser({ role: 'organization' });

    const org = new Organization({
      name: 'Hope Foundation',
      user: user._id,
    });

    await expect(org.validate()).resolves.toBeUndefined();
    expect(org.verificationStatus).toBe('pending');
    expect(org.isActive).toBe(true);
  });

  it('canPostJobs requires verified and active status', () => {
    const activeVerified = new Organization({
      name: 'Verified Org',
      user: new mongoose.Types.ObjectId(),
      verified: true,
      isActive: true,
    });

    const inactive = new Organization({
      name: 'Inactive Org',
      user: new mongoose.Types.ObjectId(),
      verified: true,
      isActive: false,
    });

    expect(activeVerified.canPostJobs()).toBe(true);
    expect(inactive.canPostJobs()).toBe(false);
  });
});
