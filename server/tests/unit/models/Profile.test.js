const mongoose = require('mongoose');
const Profile = require('../../../src/models/Profile');
const { createUser } = require('../../helpers/auth');

describe('Profile model', () => {
  it('rejects duplicate user profiles', async () => {
    const user = await createUser();
    await Profile.create({ user: user._id });

    await expect(Profile.create({ user: user._id })).rejects.toThrow();
  });

  it('saves with valid minimal data', async () => {
    const user = await createUser();

    const profile = await Profile.create({ user: user._id });

    expect(profile.profileCompletion.percentage).toBeGreaterThanOrEqual(0);
    expect(profile.user.toString()).toBe(user._id.toString());
  });

  it('pre-save recalculates completion percentage from filled fields', async () => {
    const user = await createUser();
    const profile = await Profile.create({
      user: user._id,
      headline: 'Software Engineer',
      bio: 'Experienced developer',
      location: 'Addis Ababa',
    });

    expect(profile.profileCompletion.percentage).toBeGreaterThan(0);
  });

  it('findByUserId returns profile for given user', async () => {
    const user = await createUser();
    await Profile.create({ user: user._id, headline: 'Find Me' });

    const found = await Profile.findByUserId(user._id);
    expect(found.headline).toBe('Find Me');
  });
});
