const multer = require('multer');
const cloudinaryFileUpload = require('../../../src/middleware/cloudinaryFileUpload');

function createMocks(overrides = {}) {
  const req = {
    files: null,
    file: null,
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('cloudinaryFileUpload', () => {
  it('exports single, multiple, and document handlers', () => {
    expect(typeof cloudinaryFileUpload.single).toBe('function');
    expect(typeof cloudinaryFileUpload.multiple).toBe('function');
    expect(typeof cloudinaryFileUpload.document).toBe('function');
  });

  it('accepts express-fileupload processed single files', () => {
    const { req, res, next } = createMocks({
      files: { file: { name: 'resume.pdf', mimetype: 'application/pdf', size: 1000 } },
    });

    cloudinaryFileUpload.single(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects unsupported express-fileupload file extensions', () => {
    const { req, res, next } = createMocks({
      files: { file: { name: 'malware.exe' } },
    });

    cloudinaryFileUpload.single(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining('Invalid file type') })
    );
  });

  it('document middleware passes when no files are present', () => {
    const { req, res, next } = createMocks();

    cloudinaryFileUpload.document(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('validates multiple express-fileupload files', () => {
    const { req, res, next } = createMocks({
      files: {
        files: [
          { name: 'a.pdf', mimetype: 'application/pdf', size: 100 },
          { name: 'b.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 200 },
        ],
      },
    });

    cloudinaryFileUpload.multiple(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid files in multiple upload mode', () => {
    const { req, res, next } = createMocks({
      files: {
        file: { name: 'bad.exe', mimetype: 'application/octet-stream', size: 100 },
      },
    });

    cloudinaryFileUpload.multiple(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('document middleware rejects unsupported mimetypes and oversized files', () => {
    const invalid = createMocks({
      files: {
        file: { name: 'script.js', mimetype: 'application/javascript', size: 100 },
      },
    });
    cloudinaryFileUpload.document(invalid.req, invalid.res, invalid.next);
    expect(invalid.res.status).toHaveBeenCalledWith(400);

    const oversized = createMocks({
      files: {
        file: { name: 'big.pdf', mimetype: 'application/pdf', size: 51 * 1024 * 1024 },
      },
    });
    cloudinaryFileUpload.document(oversized.req, oversized.res, oversized.next);
    expect(oversized.res.status).toHaveBeenCalledWith(400);
    expect(oversized.res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('too large') })
    );
  });

  it('document middleware accepts valid PDF documents', () => {
    const { req, res, next } = createMocks({
      files: {
        file: { name: 'spec.pdf', mimetype: 'application/pdf', size: 2048 },
      },
    });

    cloudinaryFileUpload.document(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
