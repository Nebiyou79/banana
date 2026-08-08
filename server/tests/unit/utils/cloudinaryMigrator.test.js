const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const cloudinaryMigrator = require('../../../src/utils/cloudinaryMigrator');

describe('cloudinaryMigrator', () => {
  beforeEach(async () => {
    try {
      await fs.unlink(cloudinaryMigrator.migrationLogPath);
    } catch {
      // ignore missing file
    }
  });
  it('classifies image extensions', () => {
    expect(cloudinaryMigrator.getFileType('.png')).toBe('image');
    expect(cloudinaryMigrator.getFileType('.jpg')).toBe('image');
  });

  it('classifies video and document extensions', () => {
    expect(cloudinaryMigrator.getFileType('.mp4')).toBe('video');
    expect(cloudinaryMigrator.getFileType('.pdf')).toBe('document');
    expect(cloudinaryMigrator.getFileType('.docx')).toBe('document');
  });

  it('returns other for unknown extensions', () => {
    expect(cloudinaryMigrator.getFileType('.exe')).toBe('other');
  });

  it('formats byte sizes for humans', () => {
    expect(cloudinaryMigrator.formatBytes(0)).toBe('0 Bytes');
    expect(cloudinaryMigrator.formatBytes(1024)).toBe('1 KB');
    expect(cloudinaryMigrator.formatBytes(1024 * 1024)).toBe('1 MB');
  });

  it('returns default migration log when file is missing', async () => {
    const log = await cloudinaryMigrator.loadMigrationLog();
    expect(log.status).toBe('not_started');
    expect(log.migrations).toEqual([]);
  });

  it('saves and reloads migration log', async () => {
    const log = {
      migrations: [{ id: 'test-1', status: 'completed' }],
      totalFiles: 1,
      totalSize: 100,
      startDate: new Date().toISOString(),
      status: 'in_progress',
    };

    await cloudinaryMigrator.saveMigrationLog(log);
    const loaded = await cloudinaryMigrator.loadMigrationLog();

    expect(loaded.migrations).toHaveLength(1);
    expect(loaded.status).toBe('in_progress');
    expect(loaded.lastUpdated).toBeTruthy();
  });

  it('analyzes local uploads in a temporary directory', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'migrator-test-'));
    const sampleFile = path.join(tempDir, 'sample.pdf');
    await fs.writeFile(sampleFile, 'sample pdf content');

    const analysis = await cloudinaryMigrator.analyzeLocalUploads([tempDir]);

    expect(analysis.summary.totalFiles).toBe(1);
    expect(analysis.summary.byType.document).toBe(1);
    expect(analysis.directories[tempDir]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'sample.pdf', type: 'document' }),
      ])
    );

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('scanDirectory returns file metadata recursively', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scan-test-'));
    const nestedDir = path.join(tempDir, 'nested');
    await fs.mkdir(nestedDir);
    await fs.writeFile(path.join(nestedDir, 'image.png'), 'png');

    const files = await cloudinaryMigrator.scanDirectory(tempDir);

    expect(files).toHaveLength(1);
    expect(files[0].extension).toBe('.png');
    expect(files[0].type).toBe('image');

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('generateMigrationPlan builds plan from analysis', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'migrator-plan-'));
    await fs.writeFile(path.join(tempDir, 'doc.pdf'), 'pdf content');

    const analysis = await cloudinaryMigrator.analyzeLocalUploads([tempDir]);
    const plan = await cloudinaryMigrator.generateMigrationPlan(analysis, {
      batchSize: 10,
      preserveStructure: true,
    });

    expect(plan.files.length).toBe(1);
    expect(plan.estimated.totalFiles).toBe(1);
    expect(plan.steps.length).toBeGreaterThan(0);

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('generateCloudinaryFolder preserves structure when enabled', () => {
    const folder = cloudinaryMigrator.generateCloudinaryFolder(
      { path: '/uploads/cv/test.pdf', type: 'document', relativePath: 'cv/test.pdf' },
      true
    );
    expect(typeof folder).toBe('string');
    expect(folder.length).toBeGreaterThan(0);
    expect(folder).toContain('cv/test.pdf');
  });

  it('getUploadPreset returns preset by file type', () => {
    expect(cloudinaryMigrator.getUploadPreset('image')).toBeDefined();
    expect(cloudinaryMigrator.getUploadPreset('document')).toBeDefined();
    expect(cloudinaryMigrator.getUploadPreset('video')).toBeDefined();
  });

  it('ensureMigrationStructure creates directories', async () => {
    await cloudinaryMigrator.ensureMigrationStructure();
    const stat = await fs.stat(cloudinaryMigrator.migrationBasePath);
    expect(stat.isDirectory()).toBe(true);
  });

  it('analyzeLocalUploads handles empty directory', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'migrator-empty-'));
    const analysis = await cloudinaryMigrator.analyzeLocalUploads([tempDir]);
    expect(analysis.summary.totalFiles).toBe(0);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('classifies audio extensions as other', () => {
    expect(cloudinaryMigrator.getFileType('.mp3')).toBe('other');
  });
});
