const rateLimiter = require('../../../src/middleware/rateLimiter');

describe('rateLimiter', () => {
  it('exports all configured limiters', () => {
    expect(rateLimiter).toHaveProperty('generalLimiter');
    expect(rateLimiter).toHaveProperty('authLimiter');
    expect(rateLimiter).toHaveProperty('adminLimiter');
    expect(rateLimiter).toHaveProperty('socialLimiter');
    expect(rateLimiter).toHaveProperty('followListLimiter');
    expect(rateLimiter).toHaveProperty('followStatusLimiter');
  });

  it('exports limiters as functions', () => {
    expect(typeof rateLimiter.generalLimiter).toBe('function');
    expect(typeof rateLimiter.authLimiter).toBe('function');
    expect(typeof rateLimiter.adminLimiter).toBe('function');
    expect(typeof rateLimiter.socialLimiter).toBe('function');
    expect(typeof rateLimiter.followListLimiter).toBe('function');
    expect(typeof rateLimiter.followStatusLimiter).toBe('function');
  });
});
