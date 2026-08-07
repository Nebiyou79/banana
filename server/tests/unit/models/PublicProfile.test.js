const PublicProfile = require('../../../src/models/PublicProfile');
const { createUser } = require('../../helpers/auth');

describe('PublicProfile model', () => {
  it('rejects save when user or role is missing', async () => {
    const profile = new PublicProfile({ role: 'candidate' });

    await expect(profile.save()).rejects.toThrow();
  });

  it('saves with valid minimal data', async () => {
    const user = await createUser();

    const profile = await PublicProfile.create({
      user: user._id,
      role: 'candidate',
      displayName: user.name,
    });

    expect(profile.isPubliclyVisible).toBe(true);
  });

  it('getPublicData hides email from non-owners when visibility is off', () => {
    const profile = new PublicProfile({
      user: '507f1f77bcf86cd799439011',
      role: 'candidate',
      email: 'hidden@test.com',
      visibility: { email: false },
    });

    const publicView = profile.getPublicData(false);
    expect(publicView.email).toBeUndefined();
  });

  it('incrementViews bumps analytics counter', async () => {
    const user = await createUser();
    const profile = await PublicProfile.create({
      user: user._id,
      role: 'freelancer',
    });

    await profile.incrementViews();

    expect(profile.socialStats.profileViews).toBe(1);
  });
});
