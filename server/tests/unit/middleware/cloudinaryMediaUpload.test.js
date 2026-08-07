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
  });

  it('exports media upload handlers', () => {
    expect(typeof cloudinaryMediaUpload.single).toBe('function');
    expect(typeof cloudinaryMediaUpload.avatar).toBe('function');
    expect(typeof cloudinaryMediaUpload.cover).toBe('function');
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
});
