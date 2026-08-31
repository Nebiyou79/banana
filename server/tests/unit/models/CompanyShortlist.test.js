const mongoose = require('mongoose');
const CompanyShortlist = require('../../../src/models/CompanyShortlist');
const Company = require('../../../src/models/Company');
const FreelancerProfile = require('../../../src/models/Freelancer');
const { createUser } = require('../../helpers/auth');

async function seedShortlistContext() {
  const companyUser = await createUser({ role: 'company' });
  const freelancerUser = await createUser({ role: 'freelancer' });
  const company = await Company.create({ name: 'Shortlist Co', user: companyUser._id });
  const freelancer = await FreelancerProfile.create({ user: freelancerUser._id });

  return { companyUser, company, freelancer };
}

describe('CompanyShortlist model', () => {
  it('saves with valid minimal data', async () => {
    const { companyUser, company } = await seedShortlistContext();

    const shortlist = await CompanyShortlist.create({
      companyId: company._id,
      companyUserId: companyUser._id,
    });

    expect(shortlist.freelancers).toHaveLength(0);
  });

  it('toggle adds then removes a freelancer', async () => {
    const { companyUser, company, freelancer } = await seedShortlistContext();

    const added = await CompanyShortlist.toggle(
      company._id,
      companyUser._id,
      freelancer._id
    );

    expect(added.saved).toBe(true);
    expect(added.shortlistCount).toBe(1);

    const removed = await CompanyShortlist.toggle(
      company._id,
      companyUser._id,
      freelancer._id
    );

    expect(removed.saved).toBe(false);
    expect(removed.shortlistCount).toBe(0);
  });

  it('isSaved reflects freelancer membership', async () => {
    const { companyUser, company, freelancer } = await seedShortlistContext();

    expect(await CompanyShortlist.isSaved(company._id, freelancer._id)).toBe(false);

    await CompanyShortlist.toggle(company._id, companyUser._id, freelancer._id);

    expect(await CompanyShortlist.isSaved(company._id, freelancer._id)).toBe(true);
  });

  it('rejects duplicate companyId documents', async () => {
    const { companyUser, company } = await seedShortlistContext();
    await CompanyShortlist.create({ companyId: company._id, companyUserId: companyUser._id });

    await expect(
      CompanyShortlist.create({ companyId: company._id, companyUserId: companyUser._id })
    ).rejects.toThrow();
  });
});
