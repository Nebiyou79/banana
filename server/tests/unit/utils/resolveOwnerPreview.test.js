const {
  resolveLogoUrl,
  buildOwnerPreviewFromJob,
  enrichJobsWithOwnerPreview,
} = require('../../../src/utils/resolveOwnerPreview');

describe('resolveOwnerPreview', () => {
  it('returns null when owner is missing', () => {
    expect(resolveLogoUrl(null)).toBeNull();
  });

  it('prefers avatarUrl over other logo fields', () => {
    const url = resolveLogoUrl({
      avatarUrl: 'https://cdn.example.com/avatar.png',
      logoUrl: 'https://cdn.example.com/logo.png',
    });
    expect(url).toBe('https://cdn.example.com/avatar.png');
  });

  it('builds company preview from populated owner fields', async () => {
    const preview = await buildOwnerPreviewFromJob({
      jobType: 'company',
      company: {
        _id: '507f1f77bcf86cd799439011',
        name: 'Acme Corp',
        logoUrl: 'https://cdn.example.com/acme-logo.png',
        verified: true,
      },
    });

    expect(preview).toMatchObject({
      type: 'company',
      name: 'Acme Corp',
      logoUrl: 'https://cdn.example.com/acme-logo.png',
      verified: true,
    });
  });

  it('returns null when job is missing', async () => {
    expect(await buildOwnerPreviewFromJob(null)).toBeNull();
  });
});
