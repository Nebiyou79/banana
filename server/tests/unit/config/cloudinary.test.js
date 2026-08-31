const mockUploadStreamEnd = jest.fn();
const mockDestroy = jest.fn();
const mockUrl = jest.fn();
const mockResource = jest.fn();

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((options, callback) => ({
        end: (buffer) => {
          mockUploadStreamEnd(buffer);
          callback(null, {
            public_id: 'bananalink/test-file',
            secure_url: 'https://res.cloudinary.com/test/upload/v1/bananalink/test-file.pdf',
            url: 'http://res.cloudinary.com/test/upload/v1/bananalink/test-file.pdf',
            format: 'pdf',
            resource_type: 'raw',
            bytes: buffer?.length || 0,
            created_at: new Date().toISOString(),
            tags: options.tags || [],
          });
        },
      })),
      destroy: (...args) => mockDestroy(...args),
    },
    url: (...args) => mockUrl(...args),
    api: {
      resource: (...args) => mockResource(...args),
    },
  },
}));

const cloudinaryConfig = require('../../../src/config/cloudinary');

describe('cloudinary config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    mockDestroy.mockResolvedValue({ result: 'ok' });
    mockUrl.mockReturnValue('https://res.cloudinary.com/test/optimized.jpg');
    mockResource.mockResolvedValue({ public_id: 'bananalink/test-file' });
  });

  it('exports upload presets and file categories', () => {
    expect(cloudinaryConfig.UPLOAD_PRESETS.DOCUMENT).toBe('bananalink_files');
    expect(cloudinaryConfig.FILE_CATEGORIES.IMAGES.extensions).toContain('.png');
  });

  it('getResourceType detects images by mimetype', () => {
    const result = cloudinaryConfig.getResourceType({
      originalname: 'photo.png',
      mimetype: 'image/png',
    });
    expect(result.resourceType).toBe('image');
    expect(result.category).toBe('IMAGES');
  });

  it('getResourceType detects documents by extension fallback', () => {
    const result = cloudinaryConfig.getResourceType({
      originalname: 'proposal.pdf',
      mimetype: 'application/octet-stream',
    });
    expect(result.resourceType).toBe('raw');
    expect(result.category).toBe('DOCUMENTS');
  });

  it('uploadToCloudinary uploads documents via upload stream', async () => {
    const buffer = Buffer.from('pdf-content');
    const result = await cloudinaryConfig.uploadToCloudinary(buffer, 'proposal.pdf');

    expect(result.success).toBe(true);
    expect(result.data.public_id).toBe('bananalink/test-file');
    expect(mockUploadStreamEnd).toHaveBeenCalledWith(buffer);
  });

  it('uploadToCloudinary uploads images', async () => {
    const buffer = Buffer.from('image-data');
    const result = await cloudinaryConfig.uploadToCloudinary(buffer, 'avatar.jpg', {
      mimeType: 'image/jpeg',
    });

    expect(result.success).toBe(true);
    expect(result.data.resource_type).toBe('raw');
  });

  it('deleteFromCloudinary returns success when destroy succeeds', async () => {
    const result = await cloudinaryConfig.deleteFromCloudinary('bananalink/test-file', 'raw');
    expect(result.success).toBe(true);
    expect(mockDestroy).toHaveBeenCalled();
  });

  it('deleteFromCloudinary returns failure on error', async () => {
    mockDestroy.mockRejectedValueOnce(new Error('Not found'));
    const result = await cloudinaryConfig.deleteFromCloudinary('missing-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('generateOptimizedUrl delegates to cloudinary.url', () => {
    const url = cloudinaryConfig.generateOptimizedUrl('bananalink/photo', { width: 300 });
    expect(mockUrl).toHaveBeenCalledWith('bananalink/photo', expect.objectContaining({ width: 300 }));
    expect(url).toBe('https://res.cloudinary.com/test/optimized.jpg');
  });

  it('getResourceInfo returns resource data or error', async () => {
    const success = await cloudinaryConfig.getResourceInfo('bananalink/test-file');
    expect(success.success).toBe(true);

    mockResource.mockRejectedValueOnce(new Error('missing'));
    const failure = await cloudinaryConfig.getResourceInfo('missing');
    expect(failure.success).toBe(false);
  });

  it('generateDocumentDownloadUrl uses secure_url when versioned', () => {
    const url = cloudinaryConfig.generateDocumentDownloadUrl(
      {
        secure_url: 'https://res.cloudinary.com/test/raw/upload/v123/bananalink/doc.pdf',
        public_id: 'bananalink/doc',
      },
      'doc.pdf'
    );
    expect(url).toContain('fl_attachment');
    expect(url).toContain('filename=');
  });

  it('generateDocumentViewUrl falls back to public_id', () => {
    const url = cloudinaryConfig.generateDocumentViewUrl({ public_id: 'bananalink/doc' });
    expect(url).toContain('test-cloud');
    expect(url).toContain('bananalink/doc');
  });
});
