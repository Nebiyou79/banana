const cloudinaryMigrator = require('../../../src/utils/cloudinaryMigrator');

describe('cloudinaryMigrator', () => {
  it('classifies image extensions', () => {
    expect(cloudinaryMigrator.getFileType('.png')).toBe('image');
  });

  it('classifies document extensions', () => {
    expect(cloudinaryMigrator.getFileType('.pdf')).toBe('document');
  });

  it('formats byte sizes for humans', () => {
    expect(cloudinaryMigrator.formatBytes(0)).toBe('0 Bytes');
    expect(cloudinaryMigrator.formatBytes(1024)).toBe('1 KB');
  });

  it('returns default migration log when file is missing', async () => {
    const log = await cloudinaryMigrator.loadMigrationLog();
    expect(log.status).toBe('not_started');
    expect(log.migrations).toEqual([]);
  });
});
