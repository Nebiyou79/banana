const multer = require('multer');
const { handleUploadErrors } = require('../../../src/middleware/organizationUploadMiddleware');

function createMocks() {
  const req = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('organizationUploadMiddleware', () => {
  it('returns 400 for LIMIT_FILE_SIZE multer errors', () => {
    const { req, res, next } = createMocks();
    const err = new multer.MulterError('LIMIT_FILE_SIZE');

    handleUploadErrors(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'File too large. Maximum size is 5MB.',
    });
  });

  it('returns 400 for custom upload errors', () => {
    const { req, res, next } = createMocks();
    const err = new Error('Invalid file type for logo');

    handleUploadErrors(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid file type for logo',
    });
  });

  it('calls next when no error is provided', () => {
    const { req, res, next } = createMocks();

    handleUploadErrors(null, req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
