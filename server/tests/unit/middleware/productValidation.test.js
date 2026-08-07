const { validateCreateProduct, validateProductId } = require('../../../src/middleware/productValidation');

function createMocks(body = {}, params = {}, query = {}) {
  const req = { body, params, query };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('productValidation', () => {
  it('passes valid product creation payload', async () => {
    const { req, res, next } = createMocks({
      name: 'Test Product',
      description: 'A valid product description for testing.',
      price: { amount: 19.99, currency: 'USD' },
      category: 'electronics',
    });

    await validateCreateProduct(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects missing product name', async () => {
    const { req, res, next } = createMocks({
      description: 'A valid product description for testing.',
      price: { amount: 19.99 },
      category: 'electronics',
    });

    await validateCreateProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
  });

  it('rejects invalid product id param', async () => {
    const { req, res, next } = createMocks({}, { id: 'not-a-mongo-id' });

    await validateProductId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' })
    );
  });
});
