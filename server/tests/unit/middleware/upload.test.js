const multer = require('multer');
const {
  fileSizeLimit,
  validateFileType,
  validateFileSize,
  generateFileUrl,
} = require('../../../src/middleware/upload');

function createMocks(overrides = {}) {
  const req = { file: null, files: null, ...overrides };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('upload middleware', () => {
  it('returns 400 for LIMIT_FILE_SIZE multer errors', () => {
    const { req, res, next } = createMocks();
    const err = new multer.MulterError('LIMIT_FILE_SIZE');

    fileSizeLimit(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('50MB') })
    );
  });

  it('validateFileType rejects unsupported mimetypes', () => {
    const { req, res, next } = createMocks({
      file: { mimetype: 'application/x-msdownload' },
    });
    const middleware = validateFileType(['image/jpeg', 'image/png']);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INVALID_FILE_TYPE' })
    );
  });

  it('validateFileSize rejects oversized files', () => {
    const { req, res, next } = createMocks({
      file: { size: 6 * 1024 * 1024 },
    });
    const middleware = validateFileSize(5);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'FILE_TOO_LARGE' })
    );
  });

  it('builds file URLs through upload config', () => {
    const url = generateFileUrl('avatar.png', 'avatars');
    expect(url).toContain('avatar.png');
  });
});
