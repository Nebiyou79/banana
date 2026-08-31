const Profile = require('../../../src/models/Profile');
const PublicProfile = require('../../../src/models/PublicProfile');

async function createProfileForUser(user, overrides = {}) {
  return Profile.create({
    user: user._id,
    headline: 'Test headline',
    bio: 'Test bio',
    ...overrides,
  });
}

async function createPublicProfileForUser(user, overrides = {}) {
  const suffix = Date.now();
  return PublicProfile.create({
    user: user._id,
    role: user.role || 'candidate',
    username: overrides.username || `user-${suffix}`,
    displayName: user.name || 'Test User',
    isPubliclyVisible: true,
    ...overrides,
  });
}

module.exports = { createProfileForUser, createPublicProfileForUser };
