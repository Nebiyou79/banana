const multer = require('multer');
const {
  handleUploadError,
  processUploadedCV,
  getCVUrl,
} = require('../../../src/middleware/cvUploadMiddleware');

function createMocks() {
  const req = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('cvUploadMiddleware', () => {
  it('returns 400 for invalid file type errors', () => {
    const { req, res, next } = createMocks();
    const err = new Error('Invalid file type. Please upload only PDF, DOC, or DOCX files.');

    handleUploadError(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: err.message,
    });
  });

  it('returns 400 for LIMIT_FILE_SIZE multer errors', () => {
    const { req, res, next } = createMocks();
    const err = new multer.MulterError('LIMIT_FILE_SIZE');

    handleUploadError(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('5MB') })
    );
  });

  it('returns null when processing missing file', () => {
    expect(processUploadedCV(null)).toBeNull();
  });

  it('builds CV URLs through upload config', () => {
    const url = getCVUrl('cv-test.pdf');
    expect(url).toContain('cv-test.pdf');
  });
});
