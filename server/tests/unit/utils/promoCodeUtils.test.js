const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const PromoCode = require('../../../src/models/PromoCode');
const ReferralHistory = require('../../../src/models/ReferralHistory');
const {
  validatePromoCode,
  generateReferralCodeForUser,
  applyPromoCodeToRegistration,
  completeReferralAfterVerification,
  backfillExistingUsers,
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

  it('validates an active promo code and returns benefits', async () => {
    const referrer = await User.create({
      name: 'Promo Owner',
      email: `owner-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    const promo = await generateReferralCodeForUser(referrer._id, referrer.name);
    const newUser = await User.create({
      name: 'New User',
      email: `new-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    const result = await validatePromoCode(promo.code, newUser._id);

    expect(result.valid).toBe(true);
    expect(result.referrer.id.toString()).toBe(referrer._id.toString());
    expect(result.benefits.newUser.discountPercentage).toBe(10);
  });

  it('returns invalid for inactive promo codes', async () => {
    const user = await User.create({
      name: 'Inactive Owner',
      email: `inactive-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    const promo = await generateReferralCodeForUser(user._id, user.name);
    await PromoCode.findByIdAndUpdate(promo._id, { isActive: false });

    const result = await validatePromoCode(promo.code);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('This promo code is inactive');
  });

  it('returns invalid for expired promo codes', async () => {
    const referrer = await User.create({
      name: 'Expired Owner',
      email: `expired-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    const promo = await generateReferralCodeForUser(referrer._id, referrer.name);
    await PromoCode.findByIdAndUpdate(promo._id, {
      validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    const result = await validatePromoCode(promo.code);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('This promo code has expired');
  });

  it('applyPromoCodeToRegistration creates referral history and updates stats', async () => {
    const referrer = await User.create({
      name: 'Apply Referrer',
      email: `apply-ref-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });
    const newUser = await User.create({
      name: 'Apply New User',
      email: `apply-new-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    const promo = await generateReferralCodeForUser(referrer._id, referrer.name);
    const populatedPromo = await PromoCode.findById(promo._id).populate('userId');

    const history = await applyPromoCodeToRegistration(populatedPromo, newUser._id, { source: 'test' });

    expect(history).toBeTruthy();
    expect(history.referredUserId.toString()).toBe(newUser._id.toString());
    expect(history.status).toBe('pending');

    const updatedReferrer = await User.findById(referrer._id);
    expect(updatedReferrer.referralStats.totalReferrals).toBe(1);
    expect(updatedReferrer.referralStats.pendingReferrals).toBe(1);
  });

  it('completeReferralAfterVerification updates referral and promo usage', async () => {
    const referrer = await User.create({
      name: 'Complete Referrer',
      email: `complete-ref-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
      rewardPoints: 0,
    });
    const newUser = await User.create({
      name: 'Complete New User',
      email: `complete-new-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
      rewardPoints: 0,
    });

    const promo = await generateReferralCodeForUser(referrer._id, referrer.name);
    const populatedPromo = await PromoCode.findById(promo._id).populate('userId');
    await applyPromoCodeToRegistration(populatedPromo, newUser._id);

    const completed = await completeReferralAfterVerification(newUser._id);

    expect(completed).toBeTruthy();
    expect(completed.status).toBe('completed');

    const updatedReferrer = await User.findById(referrer._id);
    expect(updatedReferrer.referralStats.completedReferrals).toBe(1);
    expect(updatedReferrer.rewardPoints).toBeGreaterThan(0);
  });

  it('backfillExistingUsers generates codes for users without referral codes', async () => {
    await User.create({
      name: 'Backfill User',
      email: `backfill-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    const result = await backfillExistingUsers();

    expect(result.processed).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeGreaterThanOrEqual(1);
  });
});
