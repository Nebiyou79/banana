const { validateCreatePost, validateFeedQuery } = require('../../../src/middleware/postValidation');

function createMocks(body = {}, query = {}, params = {}) {
  const req = { body, query, params, files: null };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('postValidation', () => {
  it('passes valid post creation payload', async () => {
    const { req, res, next } = createMocks({
      content: 'Hello world',
      type: 'text',
      visibility: 'public',
    });

    await validateCreatePost(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects invalid post type', async () => {
    const { req, res, next } = createMocks({ type: 'audio' });

    await validateCreatePost(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
  });

  it('rejects invalid feed sort option', async () => {
    const { req, res, next } = createMocks({}, { sortBy: 'random' });

    await validateFeedQuery(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' })
    );
  });
});
