const multer = require('multer');
const {
  handleAttachmentUploadError,
  processUploadedFiles,
  getFileUrl,
} = require('../../../src/middleware/attachmentUploadMiddleware');

function createMocks() {
  const req = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('attachmentUploadMiddleware', () => {
  it('returns 400 for LIMIT_FILE_SIZE multer errors', () => {
    const { req, res, next } = createMocks();
    const err = new multer.MulterError('LIMIT_FILE_SIZE');

    handleAttachmentUploadError(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining('15MB') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('processes uploaded reference and experience files', () => {
    const processed = processUploadedFiles({
      referencePdfs: [{
        originalname: 'ref.pdf',
        filename: 'attachment-ref-1.pdf',
        mimetype: 'application/pdf',
        size: 100,
        path: '/tmp/ref.pdf',
      }],
      experiencePdfs: [{
        originalname: 'exp.pdf',
        filename: 'attachment-exp-1.pdf',
        mimetype: 'application/pdf',
        size: 200,
        path: '/tmp/exp.pdf',
      }],
    });

    expect(processed.referencePdfs).toHaveLength(1);
    expect(processed.experiencePdfs).toHaveLength(1);
    expect(processed.referencePdfs[0].originalname).toBe('ref.pdf');
  });

  it('returns empty buckets when no files are provided', () => {
    const processed = processUploadedFiles(null);
    expect(processed.referencePdfs).toEqual([]);
    expect(processed.experiencePdfs).toEqual([]);
  });

  it('builds file URLs through upload config', () => {
    const url = getFileUrl('attachment-test.pdf', 'applications');
    expect(typeof url).toBe('string');
    expect(url).toContain('attachment-test.pdf');
  });
});
