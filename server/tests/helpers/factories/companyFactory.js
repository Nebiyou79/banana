const { createUser } = require('../auth');
const Company = require('../../../src/models/Company');

async function createCompanyWithUser(overrides = {}) {
  const user = overrides.user || (await createUser({ role: 'company', ...overrides.userOverrides }));
  const company = await Company.create({
    user: user._id,
    name: overrides.name || 'Test Company Ltd',
    industry: overrides.industry || 'technology',
    description: overrides.description || 'Integration test company',
    ...overrides.company,
  });
  if (!user.company) {
    user.company = company._id;
    await user.save();
  }
  return { user, company };
}

module.exports = { createCompanyWithUser };
