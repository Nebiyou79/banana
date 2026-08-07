const ProfessionalTender = require('../../../src/models/ProfessionalTender');
const Company = require('../../../src/models/Company');
const { createUser } = require('../../helpers/auth');

async function seedProfessionalTender(overrides = {}) {
  const owner = await createUser({ role: 'company' });
  const company = await Company.create({ name: 'Pro Tender Co', user: owner._id });

  return ProfessionalTender.create({
    referenceNumber: `REF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
    title: 'Office Renovation',
    description: 'Renovate headquarters building',
    procurementCategory: 'Construction',
    tenderType: 'works',
    workflowType: 'closed',
    owner: owner._id,
    ownerRole: 'company',
    ownerEntity: company._id,
    ownerEntityModel: 'Company',
    procurement: { procuringEntity: 'HQ Authority' },
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    ...overrides,
  });
}

describe('ProfessionalTender model', () => {
  it('saves draft tender with valid minimal data', async () => {
    const tender = await seedProfessionalTender();

    expect(tender.status).toBe('draft');
    expect(tender.canEdit).toBe(true);
  });

  it('canEdit is false after leaving draft status', async () => {
    const tender = await seedProfessionalTender({ status: 'published' });

    expect(tender.canEdit).toBe(false);
  });

  it('lockForSealedBid throws for open workflow tenders', async () => {
    const tender = await seedProfessionalTender({ workflowType: 'open' });
    const owner = await createUser({ role: 'company' });

    await expect(tender.lockForSealedBid(owner._id)).rejects.toThrow(
      'Cannot lock: not a sealed bid tender'
    );
  });

  it('getCategories returns grouped category map', () => {
    const categories = ProfessionalTender.getCategories();

    expect(typeof categories).toBe('object');
    expect(Object.keys(categories).length).toBeGreaterThan(0);
  });
});
