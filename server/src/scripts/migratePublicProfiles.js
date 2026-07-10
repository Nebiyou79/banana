/**
 * server/src/scripts/migratePublicProfiles.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time migration: creates a PublicProfile document for every existing User
 * who doesn't have one yet. Safe to re-run — uses upsert.
 *
 * Usage:
 *   node server/src/scripts/migratePublicProfiles.js
 *   NODE_ENV=production node server/src/scripts/migratePublicProfiles.js
 *
 * Environment:
 *   Reads MONGODB_URI from process.env (same as the main app).
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path   = require('path');
const dotenv = require('dotenv');

// Load env — try .env.production first, then fall back to .env
const envProd = path.join(__dirname, '..', '..', '.env.production');
const envDev  = path.join(__dirname, '..', '..', '.env');
const fs      = require('fs');

if (fs.existsSync(envProd)) {
  dotenv.config({ path: envProd });
} else {
  dotenv.config({ path: envDev });
}

const mongoose      = require('mongoose');
const User          = require('../models/User');
const Profile       = require('../models/Profile');
const PublicProfile = require('../models/PublicProfile');

// Re-use the same build logic as the controller
function buildSyncPayload(user, mainProfile) {
  const role = user.role;
  const rs   = mainProfile?.roleSpecific || {};

  const payload = {
    role,
    displayName:  user.name,
    headline:     mainProfile?.headline || user.headline || '',
    bio:          mainProfile?.bio      || user.bio      || '',
    location:     mainProfile?.location || user.location || '',
    phone:        user.phone   || '',
    email:        user.email   || '',
    website:      mainProfile?.website  || user.website  || '',
    lastSyncedAt: new Date(),
  };

  if (mainProfile?.avatar?.secure_url) {
    payload.avatar = {
      public_id:   mainProfile.avatar.public_id,
      secure_url:  mainProfile.avatar.secure_url,
      uploaded_at: mainProfile.avatar.uploaded_at,
    };
  } else if (user.avatar) {
    payload.avatar = { secure_url: user.avatar };
  }

  if (mainProfile?.cover?.secure_url) {
    payload.cover = {
      public_id:   mainProfile.cover.public_id,
      secure_url:  mainProfile.cover.secure_url,
      uploaded_at: mainProfile.cover.uploaded_at,
    };
  }

  if (mainProfile?.socialLinks || user.socialLinks) {
    payload.socialLinks = {
      ...(user.socialLinks || {}),
      ...(mainProfile?.socialLinks || {}),
    };
  }

  if (['candidate', 'freelancer'].includes(role)) {
    payload.skills         = rs.skills         || user.skills        || [];
    payload.education      = rs.education      || user.education     || [];
    payload.experience     = rs.experience     || user.experience    || [];
    payload.certifications = rs.certifications || user.certifications|| [];
    payload.languages      = mainProfile?.languages || [];
    payload.interests      = mainProfile?.interests || [];
  }

  if (role === 'freelancer') {
    payload.portfolio = rs.portfolio || user.portfolio || [];
  }

  if (['company', 'organization'].includes(role)) {
    payload.companyInfo = {
      size:        rs.companyInfo?.size,
      foundedYear: rs.companyInfo?.foundedYear,
      companyType: rs.companyInfo?.companyType,
      industry:    rs.companyInfo?.industry,
      mission:     rs.companyInfo?.mission,
      values:      rs.companyInfo?.values      || [],
      culture:     rs.companyInfo?.culture,
      specialties: rs.companyInfo?.specialties || [],
    };
  }

  payload.verificationStatus =
    mainProfile?.verificationStatus || user.verificationStatus || 'none';

  if (mainProfile?.socialStats) {
    payload.socialStats = {
      followerCount:   mainProfile.socialStats.followerCount   || 0,
      followingCount:  mainProfile.socialStats.followingCount  || 0,
      postCount:       mainProfile.socialStats.postCount       || 0,
      profileViews:    mainProfile.socialStats.profileViews    || 0,
      connectionCount: mainProfile.socialStats.connectionCount || 0,
    };
  }

  return payload;
}

async function migrate() {
  const MONGO_URI = process.env.MONGODB_URI;
  if (!MONGO_URI) {
    console.error('❌  MONGODB_URI is not set. Aborting migration.');
    process.exit(1);
  }

  console.log('🔗  Connecting to MongoDB …');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log('✅  Connected.\n');

  const BATCH_SIZE = 100;
  let skip       = 0;
  let created    = 0;
  let skipped    = 0;
  let errors     = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const users = await User.find({})
      .skip(skip)
      .limit(BATCH_SIZE)
      .lean();

    if (users.length === 0) break;

    console.log(`📦  Processing batch: users ${skip + 1}–${skip + users.length}`);

    const userIds = users.map((u) => u._id);
    const profiles = await Profile.find({ user: { $in: userIds } }).lean();
    const profileMap = {};
    profiles.forEach((p) => { profileMap[String(p.user)] = p; });

    // Check which users already have a PublicProfile
    const existing = await PublicProfile.find({ user: { $in: userIds } }, 'user').lean();
    const existingSet = new Set(existing.map((p) => String(p.user)));

    for (const user of users) {
      const uid = String(user._id);
      if (existingSet.has(uid)) {
        skipped++;
        continue;
      }

      try {
        const payload = buildSyncPayload(user, profileMap[uid] || null);
        await PublicProfile.create({ user: user._id, ...payload });
        created++;
        process.stdout.write('.');
      } catch (err) {
        errors++;
        console.error(`\n❌  Failed for user ${uid}:`, err.message);
      }
    }

    skip += users.length;
    process.stdout.write('\n');
  }

  console.log('\n────────────────────────────────');
  console.log(`✅  Created : ${created}`);
  console.log(`⏭️   Skipped : ${skipped} (already existed)`);
  console.log(`❌  Errors  : ${errors}`);
  console.log('────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('🔌  Disconnected from MongoDB.');
  process.exit(errors > 0 ? 1 : 0);
}

migrate().catch((err) => {
  console.error('💥  Migration crashed:', err);
  process.exit(1);
});