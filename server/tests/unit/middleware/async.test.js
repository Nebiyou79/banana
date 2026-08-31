const asyncHandler = require('../../../src/middleware/async');

function createMocks() {
  const req = {};
  const res = {};
  const next = jest.fn();
  return { req, res, next };
}

describe('async middleware', () => {
  it('forwards resolved async handlers to next on success', async () => {
    const { req, res, next } = createMocks();
    const handler = asyncHandler(async (_req, _res, nextFn) => {
      nextFn();
    });

    handler(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith();
  });

  it('forwards async errors to next', async () => {
    const { req, res, next } = createMocks();
    const error = new Error('async failure');
    const handler = asyncHandler(async () => {
      throw error;
    });

    handler(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(error);
  });

  it('forwards rejected promises to next', async () => {
    const { req, res, next } = createMocks();
    const error = new Error('rejected');
    const handler = asyncHandler(() => Promise.reject(error));

    handler(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(error);
  });
});
