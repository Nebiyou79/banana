const mongoose = require('mongoose');
const ProfileSyncService = require('../../../src/services/profileSyncService');
const User = require('../../../src/models/User');
const Profile = require('../../../src/models/Profile');
const Company = require('../../../src/models/Company');
const { createUser } = require('../../helpers/auth');

function mockUserFindById(result) {
  const query = {
    populate: jest.fn(function populate() {
      return query;
    }),
    then(onFulfilled, onRejected) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };
  return query;
}

describe('profileSyncService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('syncAvatarToEntity returns not synced when user has no avatar', async () => {
    const userId = new mongoose.Types.ObjectId();
    jest.spyOn(User, 'findById').mockReturnValue(
      mockUserFindById({
        _id: userId,
        role: 'company',
        profile: { _id: new mongoose.Types.ObjectId() },
        company: null,
      })
    );

    const result = await ProfileSyncService.syncAvatarToEntity(userId);

    expect(result).toEqual({
      synced: false,
      message: 'No avatar found',
    });
  });

  it('syncAvatarToEntity links company userProfile when avatar exists', async () => {
    const user = await createUser({ role: 'company', email: 'company-sync@test.com' });
    const profile = await Profile.create({
      user: user._id,
      avatar: { secure_url: 'https://cdn.test/avatar.jpg', public_id: 'avatars/1' },
    });
    const company = await Company.create({
      name: 'Sync Test Co',
      user: user._id,
    });

    jest.spyOn(User, 'findById').mockReturnValue(
      mockUserFindById({
        _id: user._id,
        role: 'company',
        profile: { _id: profile._id, avatar: profile.avatar },
        company: { _id: company._id },
      })
    );

    const result = await ProfileSyncService.syncAvatarToEntity(user._id);

    expect(result.synced).toBe(true);
    expect(result.entities).toContain('company');
    expect(result.avatarUrl).toBe('https://cdn.test/avatar.jpg');

    const updatedCompany = await Company.findById(company._id);
    expect(updatedCompany.userProfile.toString()).toBe(profile._id.toString());
  });

  it('getLogoUrl returns profile avatar for company entity', async () => {
    const user = await createUser({ role: 'company', email: 'logo-co@test.com' });
    const profile = await Profile.create({
      user: user._id,
      avatar: { secure_url: 'https://cdn.test/logo.jpg', public_id: 'avatars/2' },
    });
    const company = await Company.create({
      name: 'Logo Test Co',
      user: user._id,
      userProfile: profile._id,
    });

    const logoUrl = await ProfileSyncService.getLogoUrl(company._id, 'company');

    expect(logoUrl).toBe('https://cdn.test/logo.jpg');
  });

  it('getLogoUrl falls back to legacy logoUrl when profile avatar is missing', async () => {
    const user = await createUser({ role: 'company', email: 'legacy-co@test.com' });
    const company = await Company.create({
      name: 'Legacy Logo Co',
      user: user._id,
      logoUrl: 'https://legacy.test/old-logo.png',
    });

    const logoUrl = await ProfileSyncService.getLogoUrl(company._id, 'company');

    expect(logoUrl).toBe('https://legacy.test/old-logo.png');
  });

  it('batchSyncProfiles returns zero counts when nothing needs syncing', async () => {
    const result = await ProfileSyncService.batchSyncProfiles();

    expect(result).toEqual({
      companiesSynced: 0,
      organizationsSynced: 0,
    });
  });

  it('syncAvatarToEntity throws when user does not exist', async () => {
    const missingId = new mongoose.Types.ObjectId();

    await expect(ProfileSyncService.syncAvatarToEntity(missingId)).rejects.toThrow(
      'User not found'
    );
  });
});
