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
});
