const mockUploadToCloudinary = jest.fn();
const mockUploadDocumentToCloudinary = jest.fn();
const mockDeleteFromCloudinary = jest.fn();
const mockGenerateDocumentDownloadUrl = jest.fn();
const mockGenerateDocumentViewUrl = jest.fn();

jest.mock('../../../src/config/cloudinary', () => ({
  uploadToCloudinary: (...args) => mockUploadToCloudinary(...args),
  uploadDocumentToCloudinary: (...args) => mockUploadDocumentToCloudinary(...args),
  deleteFromCloudinary: (...args) => mockDeleteFromCloudinary(...args),
  getResourceType: jest.fn(),
  generateDocumentDownloadUrl: (...args) => mockGenerateDocumentDownloadUrl(...args),
  generateDocumentViewUrl: (...args) => mockGenerateDocumentViewUrl(...args),
}));

const cloudinaryStorageService = require('../../../src/services/cloudinaryStorageService');

describe('cloudinaryStorageService', () => {
  const imageBuffer = Buffer.from('fake-image-data');

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateDocumentDownloadUrl.mockReturnValue('https://cloudinary.test/download');
    mockGenerateDocumentViewUrl.mockReturnValue('https://cloudinary.test/view');
  });

  it('uploadFile uploads images via uploadToCloudinary and returns metadata', async () => {
    mockUploadToCloudinary.mockResolvedValue({
      success: true,
      data: {
        public_id: 'bananalink/images/photo',
        secure_url: 'https://res.cloudinary.com/test/photo.jpg',
        resource_type: 'image',
        format: 'jpg',
        bytes: imageBuffer.length,
      },
    });

    const result = await cloudinaryStorageService.uploadFile(imageBuffer, 'avatar.jpg');

    expect(mockUploadToCloudinary).toHaveBeenCalledWith(imageBuffer, 'avatar.jpg', {});
    expect(result.success).toBe(true);
    expect(result.data.cloudinary.public_id).toBe('bananalink/images/photo');
    expect(result.data.metadata.originalName).toBe('avatar.jpg');
    expect(result.data.metadata.downloadUrl).toBe('https://res.cloudinary.com/test/photo.jpg');
  });

  it('uploadFile routes documents to uploadDocumentToCloudinary', async () => {
    mockUploadDocumentToCloudinary.mockResolvedValue({
      success: true,
      data: {
        public_id: 'bananalink/docs/proposal',
        secure_url: 'https://res.cloudinary.com/test/proposal.pdf',
        resource_type: 'raw',
        format: 'pdf',
        bytes: 1024,
      },
    });

    const docBuffer = Buffer.from('pdf-content');
    const result = await cloudinaryStorageService.uploadFile(docBuffer, 'proposal.pdf');

    expect(mockUploadDocumentToCloudinary).toHaveBeenCalledWith(docBuffer, 'proposal.pdf', {});
    expect(mockGenerateDocumentDownloadUrl).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data.metadata.downloadUrl).toBe('https://cloudinary.test/download');
  });

  it('uploadFile returns failure when Cloudinary upload fails', async () => {
    mockUploadToCloudinary.mockResolvedValue({
      success: false,
      error: 'Cloudinary quota exceeded',
    });

    const result = await cloudinaryStorageService.uploadFile(imageBuffer, 'photo.jpg');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Cloudinary quota exceeded');
    expect(result.details.originalName).toBe('photo.jpg');
  });

  it('uploadDocument returns document metadata with URLs', async () => {
    mockUploadDocumentToCloudinary.mockResolvedValue({
      success: true,
      data: {
        public_id: 'bananalink/docs/cv',
        secure_url: 'https://res.cloudinary.com/test/cv.pdf',
        resource_type: 'raw',
        format: 'pdf',
        bytes: 512,
      },
    });

    const result = await cloudinaryStorageService.uploadDocument(Buffer.from('cv'), 'cv.pdf');

    expect(result.success).toBe(true);
    expect(result.data.metadata.downloadUrl).toBe('https://cloudinary.test/download');
    expect(result.data.metadata.viewUrl).toBe('https://cloudinary.test/view');
  });

  it('uploadAvatar returns thumbnail URL on success', async () => {
    mockUploadToCloudinary.mockResolvedValue({
      success: true,
      data: {
        public_id: 'bananalink/images/avatars/user1',
        secure_url: 'https://res.cloudinary.com/test/upload/v1/avatar.jpg',
        resource_type: 'image',
        format: 'jpg',
        bytes: imageBuffer.length,
      },
    });

    const result = await cloudinaryStorageService.uploadAvatar(imageBuffer, 'avatar.jpg', 'user1');

    expect(result.success).toBe(true);
    expect(result.avatar.thumbnailUrl).toContain('w_150');
  });

  it('generateBackupFilename produces a unique deterministic filename', () => {
    const filename = cloudinaryStorageService.generateBackupFilename(
      'report.pdf',
      'bananalink/docs/report'
    );

    expect(filename).toMatch(/^report_[a-f0-9]{8}_/);
    expect(filename.endsWith('.pdf')).toBe(true);
  });

  it('deleteFile removes file from Cloudinary', async () => {
    mockDeleteFromCloudinary.mockResolvedValue({ success: true });

    const result = await cloudinaryStorageService.deleteFile('bananalink/images/missing');

    expect(mockDeleteFromCloudinary).toHaveBeenCalledWith('bananalink/images/missing', 'auto');
    expect(result.success).toBe(true);
    expect(result.message).toBe('File deleted successfully');
  });

  it('getStatistics returns upload stats snapshot', () => {
    const stats = cloudinaryStorageService.getStatistics();
    expect(stats.developmentMode).toBe(true);
    expect(stats.totalUploads).toBeGreaterThanOrEqual(0);
  });

  it('listFiles returns mapped uploads', () => {
    const files = cloudinaryStorageService.listFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  it('cleanupOldBackups skips in development mode by default', async () => {
    const result = await cloudinaryStorageService.cleanupOldBackups(30);
    expect(result.success).toBe(true);
    expect(result.message).toContain('skipped');
  });

  it('uploadCoverPhoto returns thumbnail URL on success', async () => {
    mockUploadToCloudinary.mockResolvedValue({
      success: true,
      data: {
        public_id: 'bananalink/images/covers/user1',
        secure_url: 'https://res.cloudinary.com/test/upload/v1/cover.jpg',
        resource_type: 'image',
        format: 'jpg',
        bytes: imageBuffer.length,
      },
    });

    const result = await cloudinaryStorageService.uploadCoverPhoto(
      imageBuffer,
      'cover.jpg',
      'user1'
    );

    expect(result.success).toBe(true);
    expect(result.cover.thumbnailUrl).toContain('w_400');
  });

  it('uploadCoverPhoto returns failure when upload fails', async () => {
    mockUploadToCloudinary.mockResolvedValue({
      success: false,
      error: 'Cover upload rejected',
    });

    const result = await cloudinaryStorageService.uploadCoverPhoto(
      imageBuffer,
      'cover.jpg',
      'user1'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cover upload rejected');
  });

  it('uploadAvatar returns failure when upload fails', async () => {
    mockUploadToCloudinary.mockResolvedValue({
      success: false,
      error: 'Avatar upload rejected',
    });

    const result = await cloudinaryStorageService.uploadAvatar(
      imageBuffer,
      'avatar.jpg',
      'user1'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Avatar upload rejected');
  });

  it('getFileInfo returns null for unknown public id', () => {
    expect(cloudinaryStorageService.getFileInfo('bananalink/images/missing')).toBeNull();
  });

  it('getFileInfo returns mapping details when file exists', () => {
    cloudinaryStorageService.fileMapping['bananalink/images/test-file'] = {
      originalName: 'test.jpg',
      fileType: 'image',
      size: 100,
      uploadedAt: new Date().toISOString(),
    };

    const info = cloudinaryStorageService.getFileInfo('bananalink/images/test-file');

    expect(info.originalName).toBe('test.jpg');
    expect(info.backupExists).toBe(false);
  });

  it('deleteFile returns failure when Cloudinary delete fails', async () => {
    mockDeleteFromCloudinary.mockResolvedValue({ success: false });

    const result = await cloudinaryStorageService.deleteFile('bananalink/images/fail');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('listFiles filters by fileType', () => {
    cloudinaryStorageService.fileMapping = {
      'bananalink/images/a': {
        originalName: 'a.jpg',
        fileType: 'image',
        uploadedAt: new Date().toISOString(),
      },
      'bananalink/docs/b': {
        originalName: 'b.pdf',
        fileType: 'document',
        uploadedAt: new Date().toISOString(),
      },
    };

    const images = cloudinaryStorageService.listFiles({ fileType: 'image' });
    expect(images).toHaveLength(1);
    expect(images[0].originalName).toBe('a.jpg');
  });
});
