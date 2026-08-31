const ReferralHistory = require('../../../src/models/ReferralHistory');
const PromoCode = require('../../../src/models/PromoCode');
const { createUser } = require('../../helpers/auth');

describe('ReferralHistory model', () => {
  async function seedReferral() {
    const referrer = await createUser();
    const referred = await createUser();
    const promo = await PromoCode.create({
      code: `HIST${Date.now()}`,
      userId: referrer._id,
    });

    return { referrer, referred, promo };
  }

  it('saves with valid minimal data', async () => {
    const { referrer, referred, promo } = await seedReferral();

    const history = await ReferralHistory.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      promoCodeId: promo._id,
      promoCode: promo.code,
      stages: { registration: new Date() },
    });

    expect(history.status).toBe('pending');
  });

  it('rejects duplicate referredUserId entries', async () => {
    const { referrer, referred, promo } = await seedReferral();

    await ReferralHistory.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      promoCodeId: promo._id,
      promoCode: promo.code,
      stages: { registration: new Date() },
    });

    await expect(
      ReferralHistory.create({
        referrerId: referrer._id,
        referredUserId: referred._id,
        promoCodeId: promo._id,
        promoCode: promo.code,
        stages: { registration: new Date() },
      })
    ).rejects.toThrow();
  });

  it('defaults reward statuses to pending', async () => {
    const { referrer, referred, promo } = await seedReferral();

    const history = await ReferralHistory.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      promoCodeId: promo._id,
      promoCode: promo.code,
      stages: { registration: new Date() },
    });

    expect(history.rewardDetails.referrerReward.status).toBe('pending');
    expect(history.rewardDetails.newUserReward.status).toBe('pending');
  });
});
