const multer = require('multer');
const localFileUpload = require('../../../src/middleware/localFileUpload');

function createMocks(overrides = {}) {
  const req = {
    body: {},
    file: null,
    files: null,
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

describe('localFileUpload', () => {
  it('exports upload helper functions', () => {
    expect(typeof localFileUpload.single).toBe('function');
    expect(typeof localFileUpload.multiple).toBe('function');
    expect(typeof localFileUpload.fields).toBe('function');
    expect(typeof localFileUpload.cv).toBe('function');
  });

  it('continues when single upload receives no file', () => {
    const middleware = localFileUpload.single('document', 'documents');
    const { req, res, next } = createMocks();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.uploadedFile).toBeUndefined();
  });

  it('exposes specialized upload shortcuts', () => {
    expect(typeof localFileUpload.applicationWithFiles()).toBe('function');
    expect(typeof localFileUpload.tender()).toBe('function');
    expect(typeof localFileUpload.proposal()).toBe('function');
    expect(typeof localFileUpload.cv()).toBe('function');
    expect(typeof localFileUpload.application()).toBe('function');
    expect(typeof localFileUpload.custom({ fieldName: 'doc', folder: 'docs' })).toBe('function');
  });

  it('continues when multiple upload receives no files', () => {
    const middleware = localFileUpload.multiple('documents', 3, 'documents');
    const { req, res, next } = createMocks();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.uploadedFiles).toBeUndefined();
  });

  it('continues when fields upload receives no files', () => {
    const middleware = localFileUpload.fields([{ name: 'cv', maxCount: 1 }], 'applications');
    const { req, res, next } = createMocks();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.uploadedFilesByField).toEqual({});
  });
});
