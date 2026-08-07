const SystemSettings = require('../../../src/models/SystemSettings');

describe('SystemSettings model', () => {
  it('saves with defaults when no fields are provided', async () => {
    const settings = await SystemSettings.create({});

    expect(settings.siteName).toBe('Banana Platform');
    expect(settings.allowRegistrations).toBe(true);
    expect(settings.currency).toBe('USD');
  });

  it('persists custom fee overrides', async () => {
    const settings = await SystemSettings.create({
      jobPostingFee: 29.99,
      featuredJobFee: 59.99,
    });

    expect(settings.jobPostingFee).toBe(29.99);
    expect(settings.featuredJobFee).toBe(59.99);
  });

  it('stores nested smtpConfig defaults', async () => {
    const settings = await SystemSettings.create({});

    expect(settings.smtpConfig.port).toBe(587);
    expect(settings.smtpConfig.secure).toBe(false);
  });
});
