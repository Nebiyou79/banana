const Tender = require('../../../src/models/Tender');

describe('Tender model', () => {
  it('getCategoryLabel resolves known freelance category ids', () => {
    const categories = Tender.getFreelanceCategories();
    const firstGroup = Object.values(categories)[0];
    const firstCategory = firstGroup.subcategories[0];

    const label = Tender.getCategoryLabel(firstCategory.id, 'freelance');

    expect(label).toBe(firstCategory.name);
  });

  it('getCategoryGroup returns group name for a category id', () => {
    const categories = Tender.getFreelanceCategories();
    const [groupName, group] = Object.entries(categories)[0];
    const categoryId = group.subcategories[0].id;

    expect(Tender.getCategoryGroup(categoryId, 'freelance')).toBe(group.name);
  });

  it('getAllFreelanceCategories flattens category ids', () => {
    const all = Tender.getAllFreelanceCategories();

    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
    expect(typeof all[0]).toBe('string');
  });

  it('canUpdate allows draft freelance edits by owner', async () => {
    const owner = { _id: '507f1f77bcf86cd799439011', role: 'company' };
    const tender = new Tender({
      title: 'Draft Tender',
      description: 'Editable while draft',
      tenderCategory: 'freelance',
      workflowType: 'open',
      visibility: 'public',
      owner: owner._id,
      ownerRole: 'company',
      ownerEntity: '507f1f77bcf86cd799439012',
      ownerEntityModel: 'Company',
      procurementCategory: 'Web Development',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'draft',
      freelanceSpecific: { engagementType: 'fixed_price' },
    });

    expect(tender.canUpdate(owner)).toBe(true);
  });
});
