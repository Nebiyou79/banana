const mongoose = require('mongoose');
const Tender = require('../../../src/models/Tender');
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

function buildFreelanceSpecific(overrides = {}) {
  return {
    engagementType: 'fixed_price',
    budget: { min: 1000, max: 5000, currency: 'ETB' },
    ...overrides,
  };
}

function buildProfessionalSpecific(overrides = {}) {
  const suffix = Date.now().toString(36).toUpperCase();
  return {
    referenceNumber: `REF-${suffix}`.slice(0, 20),
    procuringEntity: 'Test Procuring Entity',
    ...overrides,
  };
}

async function createPublishedTender(overrides = {}) {
  const { user, company } = await resolveOwnerContext(overrides);
  const tenderCategory = overrides.tenderCategory || 'freelance';
  const deadline = overrides.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const payload = {
    title: overrides.title || 'Integration Test Tender',
    description: overrides.description || 'Detailed tender description for integration testing purposes.',
    tenderCategory,
    workflowType: overrides.workflowType || 'open',
    status: overrides.status || 'published',
    owner: user._id,
    ownerRole: overrides.ownerRole || 'company',
    ownerEntity: company._id,
    ownerEntityModel: overrides.ownerEntityModel || 'Company',
    procurementCategory: overrides.procurementCategory || 'Web Development',
    deadline,
    visibility: overrides.visibility || {
      visibilityType: tenderCategory === 'freelance' ? 'freelancers_only' : 'public',
    },
    isDeleted: false,
    ...overrides,
  };

  delete payload.owner;
  delete payload.company;
  if (!overrides.owner) payload.owner = user._id;
  else payload.owner = overrides.owner._id || overrides.owner;

  if (tenderCategory === 'freelance') {
    payload.freelanceSpecific = buildFreelanceSpecific(overrides.freelanceSpecific);
    payload.professionalSpecific = undefined;
  } else {
    payload.professionalSpecific = buildProfessionalSpecific(overrides.professionalSpecific);
    payload.freelanceSpecific = undefined;
  }

  return Tender.create(payload);
}

async function createDraftTender(overrides = {}) {
  return createPublishedTender({ status: 'draft', ...overrides });
}

function fakeObjectId() {
  return new mongoose.Types.ObjectId();
}

module.exports = {
  createPublishedTender,
  createDraftTender,
  fakeObjectId,
  buildFreelanceSpecific,
  buildProfessionalSpecific,
};
