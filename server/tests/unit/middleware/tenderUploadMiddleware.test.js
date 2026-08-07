const { safeParseJSON, getTenderDocumentUrl } = require('../../../src/middleware/tenderUploadMiddleware');

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

  it('builds tender document URLs', () => {
    const url = getTenderDocumentUrl('tender-doc.pdf');
    expect(url).toContain('tender-doc.pdf');
  });
});
