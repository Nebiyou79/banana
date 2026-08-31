const { validateProfileUpdate, validateCandidateProfile } = require('../../../src/middleware/profileValidation');

function createMocks(body = {}) {
  const req = { body, params: {}, query: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

async function runMiddleware(middleware, req, res, next) {
  const validators = middleware.slice(0, -1);
  const handler = middleware[middleware.length - 1];
  await Promise.all(validators.map((validator) => validator.run(req)));
  handler(req, res, next);
}

describe('profileValidation', () => {
  it('passes valid profile update payload', async () => {
    const { req, res, next } = createMocks({
      headline: 'Software Engineer',
      bio: 'Short bio',
      website: 'https://example.com',
    });

    await runMiddleware(validateProfileUpdate, req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects invalid website URL', async () => {
    const { req, res, next } = createMocks({ website: 'not-a-url' });

    await runMiddleware(validateProfileUpdate, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
  });

  it('rejects bio longer than 2000 characters', async () => {
    const { req, res, next } = createMocks({ bio: 'x'.repeat(2001) });

    await runMiddleware(validateCandidateProfile, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' })
    );
  });
});
