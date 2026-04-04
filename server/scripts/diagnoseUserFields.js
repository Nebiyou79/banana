// scripts/diagnoseUserFields.js
/**
 * Diagnose what fields actually exist in user documents
 * Run with: node scripts/diagnoseUserFields.js
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

// Load User model
let User;
try {
  User = require('../src/models/User');
  console.log(`${colors.green}✓${colors.reset} Loaded User model`);
} catch (err) {
  try {
    User = require('../src/models/User');
    console.log(`${colors.green}✓${colors.reset} Loaded User from src/models`);
  } catch (err2) {
    console.error(`${colors.red}✗${colors.reset} Could not load User model:`, err2.message);
    process.exit(1);
  }
}

const diagnose = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error(`${colors.red}✗${colors.reset} MongoDB URI not found`);
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log(`${colors.green}✓${colors.reset} Connected to MongoDB\n`);

    // Get the raw collection to bypass Mongoose schema
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get a sample user to see actual structure
    const sampleUser = await usersCollection.findOne({});

    console.log(`${colors.cyan}${colors.bold}📋 SAMPLE USER RAW DATA:${colors.reset}`);
    console.log('='.repeat(60));
    console.log(JSON.stringify(sampleUser, null, 2));
    console.log('='.repeat(60));

    // Check all users for specific fields
    const users = await usersCollection.find({}).toArray();

    console.log(`\n${colors.cyan}${colors.bold}📊 FIELD PRESENCE ANALYSIS:${colors.reset}`);
    console.log('─'.repeat(60));

    const stats = {
      total: users.length,
      hasReferralCode: 0,
      hasReferralStats: 0,
      hasRewardPoints: 0,
      hasRewardBalance: 0,
      hasReferredBy: 0,
      hasReferralBackfilled: 0
    };

    // Check each field's exact path in the documents
    for (const user of users) {
      if (user.referralCode) stats.hasReferralCode++;
      if (user.referralStats) stats.hasReferralStats++;
      if (user.rewardPoints !== undefined) stats.hasRewardPoints++;
      if (user.rewardBalance !== undefined) stats.hasRewardBalance++;
      if (user.referredBy) stats.hasReferredBy++;
      if (user.referralBackfilled) stats.hasReferralBackfilled++;
    }

    console.log(`Total users: ${stats.total}`);
    console.log(`\n${colors.yellow}Field Presence:${colors.reset}`);
    console.log(`  referralCode:        ${stats.hasReferralCode}/${stats.total} (${((stats.hasReferralCode / stats.total) * 100).toFixed(1)}%)`);
    console.log(`  referralStats:       ${stats.hasReferralStats}/${stats.total} (${((stats.hasReferralStats / stats.total) * 100).toFixed(1)}%)`);
    console.log(`  rewardPoints:        ${stats.hasRewardPoints}/${stats.total} (${((stats.hasRewardPoints / stats.total) * 100).toFixed(1)}%)`);
    console.log(`  rewardBalance:       ${stats.hasRewardBalance}/${stats.total} (${((stats.hasRewardBalance / stats.total) * 100).toFixed(1)}%)`);
    console.log(`  referredBy:          ${stats.hasReferredBy}/${stats.total} (${((stats.hasReferredBy / stats.total) * 100).toFixed(1)}%)`);
    console.log(`  referralBackfilled:  ${stats.hasReferralBackfilled}/${stats.total} (${((stats.hasReferralBackfilled / stats.total) * 100).toFixed(1)}%)`);

    // Show users missing specific fields
    const missingFields = await usersCollection.find({
      $or: [
        { referralStats: { $exists: false } },
        { rewardPoints: { $exists: false } },
        { rewardBalance: { $exists: false } }
      ]
    }).limit(5).toArray();

    if (missingFields.length > 0) {
      console.log(`\n${colors.yellow}Sample users missing fields:${colors.reset}`);
      missingFields.forEach(user => {
        console.log(`  ${user.email}:`);
        console.log(`    has referralStats: ${!!user.referralStats}`);
        console.log(`    has rewardPoints: ${user.rewardPoints !== undefined}`);
        console.log(`    has rewardBalance: ${user.rewardBalance !== undefined}`);
      });
    }

    // Try a direct update to see if it works
    console.log(`\n${colors.cyan}${colors.bold}🔧 Attempting Direct Update:${colors.reset}`);

    const updateResult = await usersCollection.updateMany(
      { referralStats: { $exists: false } },
      {
        $set: {
          "referralStats": {
            "totalReferrals": 0,
            "completedReferrals": 0,
            "pendingReferrals": 0,
            "referralRewards": { "points": 0, "cashback": 0 },
            "lastReferralAt": null
          },
          "rewardPoints": 0,
          "rewardBalance": 0,
          "referralBackfilled": true
        }
      }
    );

    console.log(`Direct update result:`);
    console.log(`  Matched: ${updateResult.matchedCount}`);
    console.log(`  Modified: ${updateResult.modifiedCount}`);

    // Verify after direct update
    if (updateResult.modifiedCount > 0) {
      const afterUpdate = await usersCollection.find({
        referralStats: { $exists: false }
      }).count();

      console.log(`\n${colors.green}After update, still missing referralStats: ${afterUpdate} users${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Error:`, error);
  } finally {
    await mongoose.disconnect();
    console.log(`\n${colors.cyan}ℹ${colors.reset} Disconnected from MongoDB`);
  }
};

diagnose();