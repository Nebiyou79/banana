const AppError = require('../../../src/utils/AppError');

describe('AppError', () => {
  it('sets statusCode from constructor', () => {
    const error = new AppError('Not found', 404);
    expect(error.statusCode).toBe(404);
  });

  it('sets status to fail for 4xx codes', () => {
    const error = new AppError('Bad request', 400);
    expect(error.status).toBe('fail');
  });

  it('sets status to error for 5xx codes', () => {
    const error = new AppError('Server error', 500);
    expect(error.status).toBe('error');
  });

  it('marks operational errors', () => {
    const error = new AppError('Forbidden', 403);
    expect(error.isOperational).toBe(true);
    expect(error.message).toBe('Forbidden');
  });
});
