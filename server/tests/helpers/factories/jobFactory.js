const Job = require('../../../src/models/Job');
const Company = require('../../../src/models/Company');
const { createUser } = require('../auth');

async function createActiveJob(overrides = {}) {
  let companyId = overrides.company;
  let createdBy = overrides.createdBy;

  if (!companyId || !createdBy) {
    const companyUser = await createUser({ role: 'company' });
    const company = await Company.create({
      user: companyUser._id,
      name: 'Test Job Company',
      industry: 'technology',
    });
    companyId = companyId || company._id;
    createdBy = createdBy || companyUser._id;
  }

  return Job.create({
    title: 'Integration Test Job',
    description: 'This is a detailed job description used for integration testing purposes only.',
    category: 'software-developer',
    status: 'active',
    candidatesNeeded: 1,
    salaryMode: 'negotiable',
    type: 'full-time',
    experienceLevel: 'mid-level',
    jobType: 'company',
    company: companyId,
    createdBy,
    ...overrides,
  });
}

module.exports = { createActiveJob };
