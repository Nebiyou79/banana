const mongoose = require('mongoose');
const JobTemplate = require('../../../src/models/JobTemplate');
const { createUser } = require('../../helpers/auth');

describe('JobTemplate model', () => {
  it('rejects save when required fields are missing', async () => {
    const template = new JobTemplate({ title: 'Backend Engineer' });

    await expect(template.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves with valid minimal data', async () => {
    const user = await createUser();

    const template = await JobTemplate.create({
      title: 'Backend Engineer',
      description: 'Build APIs and services',
      salaryRange: { min: 50000, max: 80000 },
      location: 'Addis Ababa',
      category: 'engineering',
      createdBy: user._id,
    });

    expect(template.isActive).toBe(true);
    expect(template.salaryRange.currency).toBe('USD');
  });

  it('requires both salary range bounds', async () => {
    const user = await createUser();

    await expect(
      JobTemplate.create({
        title: 'Incomplete',
        description: 'Missing salary max',
        salaryRange: { min: 1000 },
        location: 'Remote',
        category: 'other',
        createdBy: user._id,
      })
    ).rejects.toThrow();
  });
});
