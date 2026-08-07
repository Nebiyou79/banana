const mongoose = require('mongoose');
const FreelancerReview = require('../../../src/models/FreelancerReview');
const FreelancerProfile = require('../../../src/models/Freelancer');
const Company = require('../../../src/models/Company');
const { createUser } = require('../../helpers/auth');

async function seedReviewContext() {
  const companyUser = await createUser({ role: 'company' });
  const freelancerUser = await createUser({ role: 'freelancer' });
  const company = await Company.create({ name: 'Review Co', user: companyUser._id });
  const freelancer = await FreelancerProfile.create({ user: freelancerUser._id });

  return { companyUser, company, freelancer, freelancerUser };
}

describe('FreelancerReview model', () => {
  it('rejects ratings outside 1-5 range', async () => {
    const { companyUser, company, freelancer } = await seedReviewContext();

    await expect(
      FreelancerReview.create({
        freelancerId: freelancer._id,
        freelancerUserId: freelancer.user,
        companyId: company._id,
        companyUserId: companyUser._id,
        rating: 6,
      })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves with valid minimal data', async () => {
    const { companyUser, company, freelancer } = await seedReviewContext();

    const review = await FreelancerReview.create({
      freelancerId: freelancer._id,
      freelancerUserId: freelancer.user,
      companyId: company._id,
      companyUserId: companyUser._id,
      rating: 4,
    });

    expect(review.isVisible).toBe(true);
  });

  it('rejects duplicate company reviews for same freelancer', async () => {
    const { companyUser, company, freelancer } = await seedReviewContext();

    await FreelancerReview.create({
      freelancerId: freelancer._id,
      freelancerUserId: freelancer.user,
      companyId: company._id,
      companyUserId: companyUser._id,
      rating: 5,
    });

    await expect(
      FreelancerReview.create({
        freelancerId: freelancer._id,
        freelancerUserId: freelancer.user,
        companyId: company._id,
        companyUserId: companyUser._id,
        rating: 3,
      })
    ).rejects.toThrow();
  });

  it('recalculateRatings updates freelancer aggregate scores', async () => {
    const { companyUser, company, freelancer } = await seedReviewContext();

    await FreelancerReview.create({
      freelancerId: freelancer._id,
      freelancerUserId: freelancer.user,
      companyId: company._id,
      companyUserId: companyUser._id,
      rating: 4,
      subRatings: { communication: 5, quality: 4 },
    });

    await FreelancerReview.recalculateRatings(freelancer._id);

    const updated = await FreelancerProfile.findById(freelancer._id);
    expect(updated.ratings.count).toBe(1);
    expect(updated.ratings.average).toBe(4);
  });
});
