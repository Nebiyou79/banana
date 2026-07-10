// scripts/comprehensiveFix.js
/**
 * Comprehensive fix for missing referral fields
 * Run with: node scripts/comprehensiveFix.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const path = require('path');
const mongoose = require('mongoose');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Load models
let User, PromoCode;

try {
  User = require('../src/models/User');
  PromoCode = require('../src/models/PromoCode');
  console.log(`${colors.green}✓${colors.reset} Models loaded`);
} catch (err) {
  console.error(`${colors.red}✗${colors.reset} Failed to load models:`, err.message);
  process.exit(1);
}

const comprehensiveFix = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error(`${colors.red}✗${colors.reset} MongoDB URI not found`);
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log(`${colors.green}✓${colors.reset} Connected to MongoDB\n`);

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users\n`);

    let updated = 0;
    let fieldStats = {
      referralStats: 0,
      rewardPoints: 0,
      rewardBalance: 0,
      referralBackfilled: 0
    };

    for (const user of users) {
      console.log(`\n${colors.cyan}Processing:${colors.reset} ${user.email} (${user._id})`);
      let changes = [];

      // FORCEFULLY add referralStats if missing or incomplete
      if (!user.referralStats ||
        typeof user.referralStats !== 'object' ||
        !user.referralStats.totalReferrals === undefined) {

        user.referralStats = {
          totalReferrals: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          referralRewards: { points: 0, cashback: 0 },
          lastReferralAt: null
        };
        fieldStats.referralStats++;
        changes.push('Added referralStats');
      } else {
        // Ensure nested objects exist
        if (!user.referralStats.referralRewards) {
          user.referralStats.referralRewards = { points: 0, cashback: 0 };
          changes.push('Added referralRewards');
        }

        // Ensure all fields exist
        if (user.referralStats.totalReferrals === undefined) {
          user.referralStats.totalReferrals = 0;
          changes.push('Set totalReferrals');
        }
        if (user.referralStats.completedReferrals === undefined) {
          user.referralStats.completedReferrals = 0;
          changes.push('Set completedReferrals');
        }
        if (user.referralStats.pendingReferrals === undefined) {
          user.referralStats.pendingReferrals = 0;
          changes.push('Set pendingReferrals');
        }
      }

      // FORCEFULLY add rewardPoints if missing
      if (user.rewardPoints === undefined || user.rewardPoints === null) {
        user.rewardPoints = 0;
        fieldStats.rewardPoints++;
        changes.push('Added rewardPoints');
      }

      // FORCEFULLY add rewardBalance if missing
      if (user.rewardBalance === undefined || user.rewardBalance === null) {
        user.rewardBalance = 0;
        fieldStats.rewardBalance++;
        changes.push('Added rewardBalance');
      }

      // Add referralBackfilled flag
      if (!user.referralBackfilled) {
        user.referralBackfilled = true;
        fieldStats.referralBackfilled++;
        changes.push('Set referralBackfilled');
      }

      // Save if changes were made
      if (changes.length > 0) {
        await user.save();
        updated++;
        console.log(`${colors.green}✓${colors.reset} Updated: ${changes.join(', ')}`);
      } else {
        console.log(`${colors.yellow}⚠${colors.reset} No changes needed`);
      }
    }

    // Also update all promo codes to mark them as backfilled
    const promoUpdate = await PromoCode.updateMany(
      { type: 'referral' },
      { $set: { isBackfilled: true } }
    );

    console.log(`\n${colors.cyan}${colors.bold}📊 FIX COMPLETE${colors.reset}`);
    console.log('─'.repeat(50));
    console.log(`Users processed:     ${users.length}`);
    console.log(`Users updated:       ${updated}`);
    console.log('\nFields added:');
    console.log(`  referralStats:     ${fieldStats.referralStats}`);
    console.log(`  rewardPoints:      ${fieldStats.rewardPoints}`);
    console.log(`  rewardBalance:     ${fieldStats.rewardBalance}`);
    console.log(`  referralBackfilled: ${fieldStats.referralBackfilled}`);
    console.log(`\nPromo codes updated: ${promoUpdate.modifiedCount}`);
    console.log('─'.repeat(50));

  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Error:`, error);
  } finally {
    await mongoose.disconnect();
    console.log(`\n${colors.cyan}ℹ${colors.reset} Disconnected from MongoDB`);
  }
};

comprehensiveFix();