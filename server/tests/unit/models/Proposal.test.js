const Proposal = require('../../../src/models/Proposal');
const FreelanceTender = require('../../../src/models/FreelanceTender');
const Company = require('../../../src/models/Company');
const { createUser } = require('../../helpers/auth');

async function seedProposalContext() {
  const owner = await createUser({ role: 'company' });
  const freelancer = await createUser({ role: 'freelancer' });
  const company = await Company.create({ name: 'Proposal Co', user: owner._id });

  const tender = await FreelanceTender.create({
    title: 'API Integration',
    description: 'Integrate payment gateway',
    procurementCategory: 'API Integration',
    owner: owner._id,
    ownerRole: 'company',
    ownerEntity: company._id,
    ownerEntityModel: 'Company',
    details: { engagementType: 'fixed_price' },
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  });

  return { owner, freelancer, tender };
}

function validProposal(overrides = {}) {
  return {
    coverLetter: 'A'.repeat(50),
    bidType: 'fixed',
    proposedAmount: 1500,
    deliveryTime: { value: 7, unit: 'days' },
    availability: 'full-time',
    ...overrides,
  };
}

describe('Proposal model', () => {
  it('rejects cover letters shorter than 50 characters', async () => {
    const { freelancer, tender } = await seedProposalContext();

    await expect(
      Proposal.create({
        tender: tender._id,
        freelancer: freelancer._id,
        ...validProposal({ coverLetter: 'Too short' }),
      })
    ).rejects.toThrow();
  });

  it('saves draft proposal with valid minimal data', async () => {
    const { freelancer, tender } = await seedProposalContext();

    const proposal = await Proposal.create({
      tender: tender._id,
      freelancer: freelancer._id,
      ...validProposal(),
    });

    expect(proposal.isDraft).toBe(true);
    expect(proposal.status).toBe('draft');
  });

  it('submitProposal transitions draft to submitted', async () => {
    const { freelancer, tender } = await seedProposalContext();

    const proposal = await Proposal.create({
      tender: tender._id,
      freelancer: freelancer._id,
      ...validProposal(),
    });

    await proposal.submitProposal();

    expect(proposal.isDraft).toBe(false);
    expect(proposal.status).toBe('submitted');
    expect(proposal.submittedAt).toBeInstanceOf(Date);
  });

  it('submitProposal throws when already submitted', async () => {
    const { freelancer, tender } = await seedProposalContext();

    const proposal = await Proposal.create({
      tender: tender._id,
      freelancer: freelancer._id,
      ...validProposal(),
    });

    await proposal.submitProposal();

    expect(() => proposal.submitProposal()).toThrow(/already been submitted/i);
  });
});
