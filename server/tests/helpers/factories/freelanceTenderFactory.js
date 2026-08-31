const FreelanceTender = require('../../../src/models/FreelanceTender');
const { createCompanyWithUser } = require('./companyFactory');

async function resolveOwnerContext(overrides = {}) {
  if (overrides.owner && overrides.company) {
    return { user: overrides.owner, company: overrides.company };
  }
  if (overrides.owner) {
    return createCompanyWithUser({ user: overrides.owner });
  }
  return createCompanyWithUser();
}

async function createPublishedFreelanceTender(overrides = {}) {
  const { user, company } = await resolveOwnerContext(overrides);

  return FreelanceTender.create({
    title: overrides.title || 'Integration Freelance Tender',
    description: overrides.description || 'Freelance tender description for integration testing.',
    procurementCategory: overrides.procurementCategory || 'Web Development',
    status: overrides.status || 'published',
    owner: user._id,
    ownerRole: 'company',
    ownerEntity: company._id,
    ownerEntityModel: 'Company',
    details: overrides.details || { engagementType: 'fixed_price' },
    deadline: overrides.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    isDeleted: false,
    ...overrides,
    owner: user._id,
    ownerEntity: company._id,
  });
}

module.exports = { createPublishedFreelanceTender };
