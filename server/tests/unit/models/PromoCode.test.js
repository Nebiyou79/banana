const PromoCode = require('../../../src/models/PromoCode');
const { createUser } = require('../../helpers/auth');

describe('PromoCode model', () => {
  it('saves with valid minimal data', async () => {
    const owner = await createUser();

    const promo = await PromoCode.create({
      code: `REF${Date.now()}`,
      userId: owner._id,
    });

    expect(promo.type).toBe('referral');
    expect(promo.isActive).toBe(true);
  });

  it('isValid returns false when inactive or exhausted', async () => {
    const owner = await createUser();
    const promo = await PromoCode.create({
      code: `EXPIRED${Date.now()}`,
      userId: owner._id,
      isActive: false,
    });

    expect(promo.isValid()).toBe(false);

    promo.isActive = true;
    promo.usedCount = promo.maxUses;
    expect(promo.isValid()).toBe(false);
  });

  it('canBeUsedBy blocks self-referral', async () => {
    const owner = await createUser();
    const promo = await PromoCode.create({
      code: `SELF${Date.now()}`,
      userId: owner._id,
    });

    const result = promo.canBeUsedBy(owner._id);

    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/own referral code/i);
  });

  it('incrementUsage records usage for another user', async () => {
    const owner = await createUser();
    const newcomer = await createUser();
    const promo = await PromoCode.create({
      code: `USE${Date.now()}`,
      userId: owner._id,
    });

    await promo.incrementUsage(newcomer._id, true);

    expect(promo.usedCount).toBe(1);
    expect(promo.usedBy[0].userId.toString()).toBe(newcomer._id.toString());
  });
});
