const FreelanceTender = require('../../../src/models/FreelanceTender');
const Company = require('../../../src/models/Company');
const { createUser } = require('../../helpers/auth');

async function seedFreelanceTender(overrides = {}) {
  const owner = await createUser({ role: 'company' });
  const company = await Company.create({ name: 'Freelance Co', user: owner._id });

  return FreelanceTender.create({
    title: 'Build a landing page',
    description: 'Need a responsive marketing site',
    procurementCategory: 'Web Development',
    owner: owner._id,
    ownerRole: 'company',
    ownerEntity: company._id,
    ownerEntityModel: 'Company',
    details: { engagementType: 'fixed_price' },
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    ...overrides,
  });
}

describe('FreelanceTender model', () => {
  it('rejects save when required owner fields are missing', async () => {
    await expect(
      FreelanceTender.create({
        title: 'Incomplete',
        description: 'Missing owner',
        procurementCategory: 'Design',
        details: { engagementType: 'hourly' },
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    ).rejects.toThrow();
  });

  it('saves draft tender with valid minimal data', async () => {
    const tender = await seedFreelanceTender();

    expect(tender.status).toBe('draft');
    expect(tender.details.engagementType).toBe('fixed_price');
  });

  it('canUserApply rejects non-freelancers', async () => {
    const tender = await seedFreelanceTender({ status: 'published' });
    const companyUser = await createUser({ role: 'company' });

    expect(tender.canUserApply(companyUser)).toBe(false);
  });

  it('isActive virtual is true for published future tenders', async () => {
    const tender = await seedFreelanceTender({ status: 'published' });

    expect(tender.isActive).toBe(true);
    expect(tender.isExpired).toBe(false);
  });
});
