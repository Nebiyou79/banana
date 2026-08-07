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
      files: { file: { name: 'resume.pdf' } },
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
});
