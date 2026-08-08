const Freelancer = require('../../../src/models/Freelancer');
const { createUser } = require('../auth');

async function createFreelancerProfile(overrides = {}) {
  const user =
    overrides.user ||
    (await createUser({ role: 'freelancer', ...(overrides.userOverrides || {}) }));

  const profile = await Freelancer.create({
    user: user._id,
    profession: 'Software Engineer',
    headline: 'Integration test freelancer',
    bio: 'Freelancer profile used in integration tests.',
    hourlyRate: 50,
    availability: 'available',
    experienceLevel: 'intermediate',
    profileVisibility: 'public',
    ...(overrides.profile || {}),
  });

  return { user, profile };
}

module.exports = { createFreelancerProfile };
