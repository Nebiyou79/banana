const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');
const {
  safeParseJSON,
  getTenderDocumentUrl,
  calculateFileHash,
} = require('../../../src/middleware/tenderUploadMiddleware');

describe('tenderUploadMiddleware', () => {
  it('parses JSON strings into objects', () => {
    const parsed = safeParseJSON('{"min":100,"max":200}');
    expect(parsed).toEqual({ min: 100, max: 200 });
  });

  it('returns objects unchanged', () => {
    const value = { min: 50 };
    expect(safeParseJSON(value)).toBe(value);
  });

  it('parses comma-separated strings into arrays', () => {
    const parsed = safeParseJSON('design,development,testing');
    expect(parsed).toEqual(['design', 'development', 'testing']);
  });

  it('parses bracket arrays with single quotes', () => {
    const parsed = safeParseJSON("['design', 'development']");
    expect(parsed).toEqual(['design', 'development']);
  });

  it('parses object-like strings with single quotes', () => {
    const parsed = safeParseJSON("{'min':100,'max':200}");
    expect(parsed).toEqual({ min: 100, max: 200 });
  });

  it('returns default value for empty input', () => {
    expect(safeParseJSON(null, [])).toEqual([]);
    expect(safeParseJSON(undefined, {})).toEqual({});
  });

  it('returns plain strings when JSON parsing fails', () => {
    expect(safeParseJSON('plain-text')).toBe('plain-text');
  });

  it('builds tender document URLs', () => {
    const url = getTenderDocumentUrl('tender-doc.pdf');
    expect(url).toContain('tender-doc.pdf');
    expect(url).toContain('tender');
  });

  it('calculateFileHash returns sha256 hash for existing files', () => {
    const tempFile = path.join(os.tmpdir(), `hash-test-${Date.now()}.txt`);
    fs.writeFileSync(tempFile, 'hash me');

    const hash = calculateFileHash(tempFile);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    fs.unlinkSync(tempFile);
  });

  it('calculateFileHash returns null for missing files', () => {
    expect(calculateFileHash('/nonexistent/file.pdf')).toBeNull();
  });
});
