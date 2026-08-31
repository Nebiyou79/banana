const mongoose = require('mongoose');
const Application = require('../../../src/models/Application');
const Job = require('../../../src/models/Job');
const Company = require('../../../src/models/Company');
const { createUser } = require('../../helpers/auth');

async function seedApplication() {
  const owner = await createUser({ role: 'company' });
  const candidate = await createUser({ role: 'candidate' });
  const company = await Company.create({ name: 'App Co', user: owner._id });

  const job = await Job.create({
    title: 'Frontend Developer',
    description: 'React experience required',
    category: 'frontend-developer',
    createdBy: owner._id,
    company: company._id,
    jobType: 'company',
    salary: { min: 8000, max: 15000, currency: 'ETB' },
  });

  const application = await Application.create({
    job: job._id,
    candidate: candidate._id,
    userInfo: { name: candidate.name, email: candidate.email },
    coverLetter: 'I would love to join your team.',
    skills: ['React'],
    contactInfo: { email: candidate.email, phone: '0911223344' },
  });

  return { application, candidate, owner, job };
}

describe('Application model', () => {
  it('rejects duplicate applications for same job and candidate', async () => {
    const { application, candidate, job } = await seedApplication();

    await expect(
      Application.create({
        job: job._id,
        candidate: candidate._id,
        userInfo: { name: candidate.name, email: candidate.email },
        coverLetter: 'Duplicate application',
        skills: ['React'],
        contactInfo: { email: candidate.email, phone: '0911223344' },
      })
    ).rejects.toThrow();

    expect(application.status).toBe('applied');
  });

  it('updateStatus appends history and updates current status', async () => {
    const { application, owner } = await seedApplication();

    await application.updateStatus('shortlisted', owner._id, 'Strong candidate');

    expect(application.status).toBe('shortlisted');
    expect(application.statusHistory).toHaveLength(1);
    expect(application.statusHistory[0].status).toBe('shortlisted');
  });

  it('pre-save strips _tempId from references', async () => {
    const { application } = await seedApplication();
    application.references = [{
      _tempId: 'temp-123',
      name: 'Ref Person',
      email: 'ref@test.com',
    }];

    await application.save();

    expect(application.references[0]._tempId).toBeUndefined();
    expect(application.references[0].name).toBe('Ref Person');
  });
});
