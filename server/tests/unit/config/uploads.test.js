const fs = require('fs');
const path = require('path');
const {
  uploadConfig,
  UploadConfig,
  getPath,
  getUrl,
  getRelativePath,
  generateFileInfo,
  fileExists,
  deleteFile,
  listFiles,
  getStats,
  validate,
  UPLOAD_TYPES,
  ALLOWED_MIME_TYPES,
} = require('../../../src/config/uploads');

describe('uploads config', () => {
  const testFilename = `test-upload-${Date.now()}.txt`;
  let testFilePath;

  beforeAll(() => {
    testFilePath = path.join(getPath('general'), testFilename);
    fs.writeFileSync(testFilePath, 'upload config test');
  });

  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('exposes upload type constants', () => {
    expect(UPLOAD_TYPES).toContain('avatars');
    expect(UPLOAD_TYPES).toContain('tender');
    expect(ALLOWED_MIME_TYPES.images).toContain('image/jpeg');
  });

  it('creates and returns paths for upload types', () => {
    const avatarPath = getPath('avatars');
    expect(fs.existsSync(avatarPath)).toBe(true);
    expect(avatarPath).toContain('avatars');
  });

  it('builds URLs for development and production', () => {
    process.env.NODE_ENV = 'development';
    process.env.BACKEND_URL = 'http://localhost:4000';
    const devUrl = getUrl('photo.jpg', 'avatars');
    expect(devUrl).toContain('http://localhost:4000/uploads/avatars/photo.jpg');

    process.env.NODE_ENV = 'production';
    const prodUrl = getUrl('photo.jpg', 'avatars');
    expect(prodUrl).toContain('https://getbananalink.com/uploads/avatars/photo.jpg');
    process.env.NODE_ENV = 'development';
  });

  it('generates relative paths and file info', () => {
    const relative = getRelativePath('doc.pdf', 'cv');
    expect(relative).toContain('uploads');
    expect(relative).toContain('doc.pdf');

    const info = generateFileInfo(
      {
        filename: 'avatar.png',
        originalname: 'My Avatar.png',
        mimetype: 'image/png',
        size: 1024,
        path: '/tmp/avatar.png',
      },
      'avatars'
    );

    expect(info.filename).toBe('avatar.png');
    expect(info.type).toBe('avatars');
    expect(info.url).toContain('avatar.png');
  });

  it('throws when generateFileInfo receives invalid file object', () => {
    expect(() => generateFileInfo(null, 'general')).toThrow('Invalid file object');
  });

  it('checks file existence, lists files, and deletes files', () => {
    expect(fileExists(testFilename, 'general')).toBe(true);

    const files = listFiles('general');
    expect(files).toContain(testFilename);

    expect(deleteFile(testFilename, 'general')).toBe(true);
    expect(fileExists(testFilename, 'general')).toBe(false);
    expect(deleteFile(testFilename, 'general')).toBe(false);

    fs.writeFileSync(testFilePath, 'restored');
  });

  it('returns storage stats and validates configuration', () => {
    const stats = getStats();
    expect(stats.baseDirectory).toBeTruthy();
    expect(stats.total).toBeDefined();
    expect(stats.total.files).toBeGreaterThanOrEqual(0);

    const validation = validate();
    expect(validation.valid).toBe(true);
    expect(validation.issues).toEqual([]);
    expect(validation.config.baseDir).toBeTruthy();
  });

  it('allows constructing a fresh UploadConfig instance', () => {
    const config = new UploadConfig();
    expect(config.directories.general).toBe('general');
    expect(config.getPath('portfolio')).toContain('portfolio');
  });
});
