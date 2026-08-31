const { validationResult } = require('express-validator');
const { validateTender, validateTenderUpdate } = require('../../../src/middleware/validationMiddleware');

async function runValidators(validators, body = {}) {
  const req = { body };
  await Promise.all(validators.map((validator) => validator.run(req)));
  return validationResult(req);
}

describe('validationMiddleware', () => {
  it('exports tender validation rule arrays', () => {
    expect(Array.isArray(validateTender)).toBe(true);
    expect(Array.isArray(validateTenderUpdate)).toBe(true);
    expect(validateTender.length).toBeGreaterThan(0);
  });

  it('accepts valid tender creation payload', async () => {
    const result = await runValidators(validateTender, {
      title: 'Valid Tender Title',
      description: 'A'.repeat(60),
      category: 'web_development',
      budget: { min: 100, max: 500 },
      deadline: new Date(Date.now() + 86400000).toISOString(),
      duration: 30,
      visibility: 'public',
      skillsRequired: ['Node.js'],
    });

    expect(result.isEmpty()).toBe(true);
  });

  it('rejects tender title that is too short', async () => {
    const result = await runValidators(validateTender, {
      title: 'Hi',
      description: 'A'.repeat(60),
      category: 'web_development',
      budget: { min: 100, max: 500 },
      deadline: new Date(Date.now() + 86400000).toISOString(),
      duration: 30,
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array()[0].msg).toContain('Title must be between 5 and 200 characters');
  });

  it('accepts optional status on tender update', async () => {
    const result = await runValidators(validateTenderUpdate, {
      status: 'published',
    });

    expect(result.isEmpty()).toBe(true);
  });
});
