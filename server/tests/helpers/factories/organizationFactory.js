const { createUser } = require('../auth');
const Organization = require('../../../src/models/Organization');

async function createOrganizationWithUser(overrides = {}) {
  const user = overrides.user || (await createUser({ role: 'organization', ...overrides.userOverrides }));
  const organization = await Organization.create({
    user: user._id,
    name: overrides.name || 'Test Organization',
    type: overrides.type || 'ngo',
    industry: overrides.industry || 'non-profit',
    description: overrides.description || 'Integration test organization',
    ...overrides.organization,
  });
  return { user, organization };
}

module.exports = { createOrganizationWithUser };
