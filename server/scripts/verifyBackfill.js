// scripts/verifyBackfill.js
/**
 * Verify that all users have correct referral fields
 * Run with: node scripts/verifyBackfill.js
 */

// Load environment variables FIRST
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const path = require('path');
const mongoose = require('mongoose');

// Simple console colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

// Load models with error handling
let User, PromoCode;

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

try {
    PromoCode = require('../src/models/PromoCode');
    console.log(`${colors.green}✓${colors.reset} Loaded PromoCode model`);
} catch (err) {
    console.error(`${colors.red}✗${colors.reset} Could not load PromoCode model:`, err.message);
    process.exit(1);
}

const verify = async () => {
    try {
        // Get MongoDB URI from environment
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

        if (!mongoUri) {
            console.error(`${colors.red}✗${colors.reset} MongoDB URI not found in environment variables`);
            console.log('\nPlease check your .env file and make sure it contains one of:');
            console.log('  - MONGODB_URI');
            console.log('  - MONGO_URI');
            console.log('  - DATABASE_URL');
            console.log('\nCurrent .env location:', path.join(__dirname, '../.env'));
            process.exit(1);
        }

        console.log(`${colors.cyan}ℹ${colors.reset} Connecting to MongoDB...`);
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`${colors.green}✓${colors.reset} Connected to MongoDB\n`);

        // Check users
        const totalUsers = await User.countDocuments();
        const usersWithReferralCode = await User.countDocuments({
            referralCode: { $exists: true, $ne: null }
        });
        const usersWithReferralStats = await User.countDocuments({
            referralStats: { $exists: true }
        });
        const usersWithRewardPoints = await User.countDocuments({
            rewardPoints: { $exists: true }
        });
        const usersWithReferredBy = await User.countDocuments({
            referredBy: { $exists: true, $ne: null }
        });

        // Check promo codes
        const totalPromoCodes = await PromoCode.countDocuments();
        const referralPromoCodes = await PromoCode.countDocuments({ type: 'referral' });
        const backfilledPromoCodes = await PromoCode.countDocuments({ isBackfilled: true });

        // Find users without code
        const usersWithoutCode = await User.find({
            referralCode: { $exists: false }
        }).select('email').limit(10);

        // Find promo codes without matching user records
        const codesWithoutUserRef = await PromoCode.find({
            type: 'referral',
            userId: { $exists: true }
        }).populate('userId', 'email referralCode').limit(10);

        const mismatched = [];
        for (const code of codesWithoutUserRef) {
            if (code.userId) {
                const user = await User.findById(code.userId);
                if (!user || user.referralCode !== code.code) {
                    mismatched.push({
                        code: code.code,
                        userId: code.userId?._id || code.userId,
                        userEmail: user?.email || 'User not found',
                        userCode: user?.referralCode || 'None'
                    });
                }
            }
        }

        // Print report
        console.log(`${colors.cyan}${colors.bold}📊 VERIFICATION REPORT${colors.reset}`);
        console.log('='.repeat(60));

        console.log(`\n${colors.cyan}👥 USER STATS:${colors.reset}`);
        console.log('─'.repeat(40));
        console.log(`Total users:                 ${totalUsers}`);
        console.log(`With referral code:           ${usersWithReferralCode} (${((usersWithReferralCode / totalUsers) * 100).toFixed(1)}%)`);
        console.log(`With referral stats:          ${usersWithReferralStats} (${((usersWithReferralStats / totalUsers) * 100).toFixed(1)}%)`);
        console.log(`With reward points:           ${usersWithRewardPoints} (${((usersWithRewardPoints / totalUsers) * 100).toFixed(1)}%)`);
        console.log(`With referredBy field:        ${usersWithReferredBy}`);

        console.log(`\n${colors.cyan}🎟️ PROMO CODE STATS:${colors.reset}`);
        console.log('─'.repeat(40));
        console.log(`Total promo codes:            ${totalPromoCodes}`);
        console.log(`Referral codes:               ${referralPromoCodes}`);
        console.log(`Backfilled codes:             ${backfilledPromoCodes}`);

        console.log(`\n${colors.yellow}⚠️  ISSUES FOUND:${colors.reset}`);
        console.log('─'.repeat(40));

        let hasIssues = false;

        if (usersWithoutCode.length > 0) {
            hasIssues = true;
            console.log(`${colors.red}✗${colors.reset} Users without referral code: ${usersWithoutCode.length}`);
            usersWithoutCode.slice(0, 5).forEach(u =>
                console.log(`  - ${u.email}`)
            );
            if (usersWithoutCode.length > 5) {
                console.log(`  ... and ${usersWithoutCode.length - 5} more`);
            }
        } else {
            console.log(`${colors.green}✓${colors.reset} All users have referral codes`);
        }

        if (mismatched.length > 0) {
            hasIssues = true;
            console.log(`\n${colors.red}✗${colors.reset} Mismatched codes: ${mismatched.length}`);
            mismatched.slice(0, 5).forEach(m =>
                console.log(`  - Code: ${m.code}, User: ${m.userEmail}, User code: ${m.userCode}`)
            );
            if (mismatched.length > 5) {
                console.log(`  ... and ${mismatched.length - 5} more`);
            }
        } else {
            console.log(`${colors.green}✓${colors.reset} All codes match users`);
        }

        // Check for missing indexes
        console.log(`\n${colors.cyan}🔍 ADDITIONAL CHECKS:${colors.reset}`);
        console.log('─'.repeat(40));

        if (totalUsers === usersWithReferralCode && totalUsers === usersWithReferralStats) {
            console.log(`${colors.green}✓${colors.reset} All users have complete referral data`);
        } else {
            hasIssues = true;
            console.log(`${colors.yellow}⚠${colors.reset} Some users have incomplete referral data`);
        }

        if (totalPromoCodes === referralPromoCodes) {
            console.log(`${colors.green}✓${colors.reset} All promo codes are referral type`);
        } else {
            console.log(`${colors.yellow}⚠${colors.reset} Some promo codes are not referral type`);
        }

        console.log('\n' + '='.repeat(60));

        if (!hasIssues) {
            console.log(`\n${colors.green}${colors.bold}✅ VERIFICATION PASSED - All systems ready!${colors.reset}\n`);
        } else {
            console.log(`\n${colors.yellow}${colors.bold}⚠️ VERIFICATION COMPLETED WITH ISSUES - Check above${colors.reset}\n`);
        }

    } catch (error) {
        console.error(`${colors.red}✗${colors.reset} Verification failed:`, error.message);
    } finally {
        await mongoose.disconnect();
        console.log(`${colors.cyan}ℹ${colors.reset} Disconnected from MongoDB`);
    }
};

verify();