const mongoose = require('mongoose');
const Company = require('../../../src/models/Company');
const { createUser } = require('../../helpers/auth');

describe('Company model', () => {
  it('rejects invalid TIN format', async () => {
    const user = await createUser({ role: 'company' });

    await expect(
      Company.create({ name: 'Bad TIN Co', user: user._id, tin: 'ABC' })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves with valid minimal data', async () => {
    const user = await createUser({ role: 'company' });

    const company = await Company.create({
      name: 'Acme Corp',
      user: user._id,
    });

    expect(company.verified).toBe(false);
    expect(company.user.toString()).toBe(user._id.toString());
  });

  it('rejects duplicate user references', async () => {
    const user = await createUser({ role: 'company' });
    await Company.create({ name: 'First Co', user: user._id });

    await expect(
      Company.create({ name: 'Second Co', user: user._id })
    ).rejects.toThrow();
  });

  it('logo virtual falls back through profile and legacy fields', () => {
    const company = new Company({
      name: 'Virtual Co',
      user: new mongoose.Types.ObjectId(),
      logoUrl: 'https://example.com/logo.png',
    });

    expect(company.logo).toBe('https://example.com/logo.png');
  });
});
