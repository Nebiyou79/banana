const mongoose = require('mongoose');
const Product = require('../../../src/models/Product');
const Company = require('../../../src/models/Company');
const { createUser } = require('../../helpers/auth');

describe('Product model', () => {
  it('rejects negative prices', async () => {
    const owner = await createUser({ role: 'company' });
    const company = await Company.create({ name: 'Product Co', user: owner._id });

    await expect(
      Product.create({
        companyId: company._id,
        name: 'Bad Price',
        description: 'Invalid product',
        price: { amount: -10 },
        category: 'electronics',
      })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves with valid minimal data', async () => {
    const owner = await createUser({ role: 'company' });
    const company = await Company.create({ name: 'Shop Co', user: owner._id });

    const product = await Product.create({
      companyId: company._id,
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse',
      price: { amount: 29.99, currency: 'USD' },
      category: 'electronics',
    });

    expect(product.status).toBe('draft');
    expect(product.price.displayPrice).toBeDefined();
  });

  it('pre-save syncs savedCount from savedBy length', async () => {
    const owner = await createUser({ role: 'company' });
    const saver = await createUser();
    const company = await Company.create({ name: 'Save Co', user: owner._id });

    const product = await Product.create({
      companyId: company._id,
      name: 'Saved Item',
      description: 'Track saves',
      price: { amount: 10 },
      category: 'general',
      savedBy: [saver._id],
    });

    expect(product.savedCount).toBe(1);
  });

  it('incrementViews increases view counter', async () => {
    const owner = await createUser({ role: 'company' });
    const company = await Company.create({ name: 'Views Co', user: owner._id });

    const product = await Product.create({
      companyId: company._id,
      name: 'Popular Item',
      description: 'Gets views',
      price: { amount: 15 },
      category: 'general',
    });

    await product.incrementViews();

    expect(product.views).toBe(1);
  });
});
