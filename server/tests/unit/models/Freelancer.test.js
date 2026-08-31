const FreelancerProfile = require('../../../src/models/Freelancer');
const { createUser } = require('../../helpers/auth');

describe('Freelancer model', () => {
  it('rejects profession not in PROFESSION_LIST', async () => {
    const user = await createUser({ role: 'freelancer' });

    await expect(
      FreelancerProfile.create({
        user: user._id,
        profession: 'Not A Real Profession',
      })
    ).rejects.toThrow();
  });

  it('saves with valid minimal data', async () => {
    const user = await createUser({ role: 'freelancer' });

    const profile = await FreelancerProfile.create({ user: user._id });

    expect(profile.membership).toBe('basic');
    expect(profile.availability).toBe('available');
  });

  it('findByUserId locates profile by user id', async () => {
    const user = await createUser({ role: 'freelancer' });
    await FreelancerProfile.create({
      user: user._id,
      profession: 'Software Engineer',
    });

    const found = await FreelancerProfile.findByUserId(user._id);
    expect(found.profession).toBe('Software Engineer');
  });

  it('calculateProfileCompletion scores populated user fields', async () => {
    const user = await createUser({
      role: 'freelancer',
      headline: 'Full stack dev',
      bio: 'Ten years experience',
      skills: ['Node.js', 'React'],
    });

    const profile = await FreelancerProfile.create({
      user: user._id,
      profession: 'Software Engineer',
      hourlyRate: 50,
    });

    const score = profile.calculateProfileCompletion(user);
    expect(score).toBeGreaterThan(0);
  });
});
