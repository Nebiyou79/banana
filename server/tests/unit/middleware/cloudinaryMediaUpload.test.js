jest.mock('../../../src/services/cloudinaryStorageService', () => ({
  uploadFile: jest.fn(),
}));

const cloudinaryStorageService = require('../../../src/services/cloudinaryStorageService');
const cloudinaryMediaUpload = require('../../../src/middleware/cloudinaryMediaUpload');

function createMocks(overrides = {}) {
  const req = {
    file: null,
    files: null,
    user: { id: 'user-123' },
    body: {},
    headers: {},
    method: 'POST',
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('cloudinaryMediaUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cloudinaryStorageService.uploadFile.mockResolvedValue({
      success: true,
      data: {
        cloudinary: {
          public_id: 'bananalink/images/test',
          secure_url: 'https://res.cloudinary.com/test/image.jpg',
        },
        localBackup: null,
        metadata: { originalName: 'photo.jpg' },
      },
    });
  });

  it('exports media upload handlers', () => {
    expect(typeof cloudinaryMediaUpload.single).toBe('function');
    expect(typeof cloudinaryMediaUpload.avatar).toBe('function');
    expect(typeof cloudinaryMediaUpload.cover).toBe('function');
    expect(typeof cloudinaryMediaUpload.multiple).toBe('function');
  });

  it('continues when single upload receives no file', () => {
    const { req, res, next } = createMocks();

    cloudinaryMediaUpload.single(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(cloudinaryStorageService.uploadFile).not.toHaveBeenCalled();
  });

  it('sets req.cloudinaryAvatar when avatar upload receives no file', () => {
    const { req, res, next } = createMocks();

    cloudinaryMediaUpload.avatar(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.cloudinaryAvatar.success).toBe(false);
    expect(req.cloudinaryAvatar.error).toBe('No file provided');
  });

  it('sets req.cloudinaryCover when cover upload receives no file', () => {
    const { req, res, next } = createMocks();

    cloudinaryMediaUpload.cover(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.cloudinaryCover.success).toBe(false);
  });

  it('continues when multiple upload receives no files', () => {
    const { req, res, next } = createMocks();

    cloudinaryMediaUpload.multiple(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(cloudinaryStorageService.uploadFile).not.toHaveBeenCalled();
  });

});
