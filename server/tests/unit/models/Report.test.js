const Report = require('../../../src/models/Report');
const { createUser } = require('../../helpers/auth');

describe('Report model', () => {
  it('rejects save when required fields are missing', async () => {
    const report = new Report({ title: 'Monthly Summary' });

    await expect(report.save()).rejects.toThrow();
  });

  it('saves with valid minimal data', async () => {
    const user = await createUser({ role: 'admin' });

    const report = await Report.create({
      title: 'User Growth',
      type: 'analytics',
      generatedBy: user._id,
    });

    expect(report.type).toBe('analytics');
    expect(report.generatedBy.toString()).toBe(user._id.toString());
  });

  it('stores arbitrary filters and data payloads', async () => {
    const user = await createUser({ role: 'admin' });

    const report = await Report.create({
      title: 'Job Stats',
      type: 'jobs',
      generatedBy: user._id,
      filters: { status: 'active' },
      data: { total: 42 },
    });

    expect(report.filters.status).toBe('active');
    expect(report.data.total).toBe(42);
  });
});
