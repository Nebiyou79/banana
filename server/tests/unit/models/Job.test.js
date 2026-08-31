const mongoose = require('mongoose');
const Job = require('../../../src/models/Job');
const Company = require('../../../src/models/Company');
const { createUser } = require('../../helpers/auth');

async function createCompanyJob(overrides = {}) {
  const owner = await createUser({ role: 'company' });
  const company = await Company.create({ name: 'Job Co', user: owner._id });

  return Job.create({
    title: 'Software Developer',
    description: 'Build and maintain web applications',
    category: 'software-developer',
    createdBy: owner._id,
    company: company._id,
    jobType: 'company',
    salary: { min: 10000, max: 20000, currency: 'ETB' },
    status: 'active',
    ...overrides,
  });
}

describe('Job model', () => {
  it('requires company when jobType is company', async () => {
    const owner = await createUser({ role: 'company' });

    await expect(
      Job.create({
        title: 'Missing Company',
        description: 'No company attached',
        category: 'software-developer',
        createdBy: owner._id,
        jobType: 'company',
        salary: { min: 1000, max: 2000, currency: 'ETB' },
      })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves with valid minimal company job data', async () => {
    const job = await createCompanyJob();

    expect(job.status).toBe('active');
    expect(job.salary.currency).toBe('ETB');
  });

  it('canApply returns false when applications are disabled', async () => {
    const job = await createCompanyJob({ isApplyEnabled: false });

    expect(job.canApply()).toBe(false);
  });

  it('incrementApplicationCount persists updated count', async () => {
    const job = await createCompanyJob();

    await job.incrementApplicationCount();

    expect(job.applicationCount).toBe(1);
  });
});
