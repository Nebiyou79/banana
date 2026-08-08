const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  fileSizeLimit,
  validateFileType,
  validateFileSize,
  generateFileUrl,
  cleanupUploadedFiles,
  uploadConfig,
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

  it('returns 400 for other multer limit errors', () => {
    const cases = [
      ['LIMIT_FILE_COUNT', 'Too many files'],
      ['LIMIT_UNEXPECTED_FILE', 'Unexpected file field'],
      ['LIMIT_PART_COUNT', 'Too many parts'],
      ['LIMIT_FIELD_KEY', 'Field name too long'],
      ['LIMIT_FIELD_VALUE', 'Field value too long'],
      ['LIMIT_FIELD_COUNT', 'Too many fields'],
    ];

    cases.forEach(([code, messagePart]) => {
      const { req, res, next } = createMocks();
      fileSizeLimit(new multer.MulterError(code), req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining(messagePart) })
      );
    });
  });

  it('returns 400 for generic upload errors', () => {
    const { req, res, next } = createMocks();
    fileSizeLimit(new Error('Invalid file type'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid file type' })
    );
  });

  it('passes errors without message to next', () => {
    const { req, res, next } = createMocks();
    const err = {};
    fileSizeLimit(err, req, res, next);
    expect(next).toHaveBeenCalledWith(err);
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

  it('validateFileType passes allowed mimetypes', () => {
    const { req, res, next } = createMocks({
      file: { mimetype: 'image/png' },
    });
    const middleware = validateFileType(['image/jpeg', 'image/png']);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('validateFileType skips when no file is present', () => {
    const { req, res, next } = createMocks();
    validateFileType()(req, res, next);
    expect(next).toHaveBeenCalled();
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

  it('validateFileSize passes acceptable files', () => {
    const { req, res, next } = createMocks({
      file: { size: 1024 },
    });
    validateFileSize(5)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('builds file URLs through upload config', () => {
    const url = generateFileUrl('avatar.png', 'avatars');
    expect(url).toContain('avatar.png');
  });

  it('cleanupUploadedFiles deletes uploaded files safely', async () => {
    const filename = `cleanup-${Date.now()}.txt`;
    const filePath = path.join(uploadConfig.getPath('general'), filename);
    fs.writeFileSync(filePath, 'cleanup test');

    const req = {
      file: { filename, fieldname: 'media' },
      files: [{ filename, fieldname: 'media' }],
    };

    await cleanupUploadedFiles(req);

    expect(fs.existsSync(filePath)).toBe(false);
  });
});
