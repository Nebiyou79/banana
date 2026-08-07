const ErrorResponse = require('../../../src/utils/errorResponse');

describe('ErrorResponse', () => {
  it('sets statusCode from constructor', () => {
    const error = new ErrorResponse('Unauthorized', 401);
    expect(error.statusCode).toBe(401);
  });

  it('preserves the error message', () => {
    const error = new ErrorResponse('Validation failed', 422);
    expect(error.message).toBe('Validation failed');
  });

  it('is an instance of Error', () => {
    const error = new ErrorResponse('Not found', 404);
    expect(error).toBeInstanceOf(Error);
  });
});
