const multer = require('multer');
const {
  handleUploadError,
  getFileUrl,
  processFileInfo,
} = require('../../../src/middleware/fileUploadMiddleware');

function createMocks() {
  const req = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('fileUploadMiddleware', () => {
  it('returns 400 for invalid file type messages', () => {
    const { req, res, next } = createMocks();
    const err = new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed for avatars.');

    handleUploadError(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: err.message });
  });

  it('returns 400 for LIMIT_FILE_COUNT multer errors', () => {
    const { req, res, next } = createMocks();
    const err = new multer.MulterError('LIMIT_FILE_COUNT');

    handleUploadError(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Maximum 5 files') })
    );
  });

  it('returns null when processing missing file info', () => {
    expect(processFileInfo(null)).toBeNull();
  });

  it('builds portfolio file URLs', () => {
    const url = getFileUrl('portfolio-test.png', 'portfolio');
    expect(url).toContain('portfolio-test.png');
  });
});
