const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const PromoCode = require('../../../src/models/PromoCode');
const {
  validatePromoCode,
  generateReferralCodeForUser,
} = require('../../../src/utils/promoCodeUtils');

describe('promoCodeUtils', () => {
  it('returns invalid when code is empty', async () => {
    const result = await validatePromoCode('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Promo code is required');
  });

  it('returns invalid for unknown promo codes', async () => {
    const result = await validatePromoCode('UNKNOWNCODE123');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Invalid promo code');
  });

  it('generates and reuses referral code for the same user', async () => {
    const user = await User.create({
      name: 'Referrer User',
      email: `referrer-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    const first = await generateReferralCodeForUser(user._id, user.name);
    const second = await generateReferralCodeForUser(user._id, user.name);

    expect(first.code).toBe(second.code);
    const count = await PromoCode.countDocuments({ userId: user._id, type: 'referral' });
    expect(count).toBe(1);
  });
});
