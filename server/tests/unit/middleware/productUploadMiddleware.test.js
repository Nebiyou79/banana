const multer = require('multer');
const {
  handleUploadErrors,
  generateImageUrl,
  processImages,
} = require('../../../src/middleware/productUploadMiddleware');

function createMocks(overrides = {}) {
  const req = { files: null, ...overrides };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('productUploadMiddleware', () => {
  it('returns 400 for LIMIT_FILE_COUNT multer errors', () => {
    const { req, res, next } = createMocks();
    const err = new multer.MulterError('LIMIT_FILE_COUNT');

    handleUploadErrors(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('12 images') })
    );
  });

  it('continues when processImages receives no files', async () => {
    const { req, res, next } = createMocks();

    await processImages(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.processedFiles).toBeUndefined();
  });

  it('builds product image URLs', () => {
    const url = generateImageUrl('product-test.jpg');
    expect(url).toContain('product-test.jpg');
  });
});
