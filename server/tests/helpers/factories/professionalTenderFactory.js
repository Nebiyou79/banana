const ProfessionalTender = require('../../../src/models/ProfessionalTender');
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

async function createPublishedProfessionalTender(overrides = {}) {
  const { user, company } = await resolveOwnerContext(overrides);
  const suffix = Date.now().toString(36).toUpperCase();

  return ProfessionalTender.create({
    title: overrides.title || 'Integration Professional Tender',
    description: overrides.description || 'Professional tender description for integration testing.',
    procurementCategory: overrides.procurementCategory || 'Construction',
    tenderType: overrides.tenderType || 'services',
    workflowType: overrides.workflowType || 'open',
    visibilityType: overrides.visibilityType || 'public',
    status: overrides.status || 'published',
    owner: user._id,
    ownerRole: 'company',
    ownerEntity: company._id,
    ownerEntityModel: 'Company',
    referenceNumber: overrides.referenceNumber || `PRO-${suffix}`.slice(0, 20),
    procurement: {
      procuringEntity: 'Test Procuring Entity',
      ...(overrides.procurement || {}),
    },
    deadline: overrides.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    isDeleted: false,
    ...overrides,
    owner: user._id,
    ownerEntity: company._id,
  });
}

module.exports = { createPublishedProfessionalTender };
