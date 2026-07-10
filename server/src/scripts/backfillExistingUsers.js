// scripts/backfillExistingUsers.js
/**
 * Backfill Script for Existing Users
 * 
 * Run with: node scripts/backfillExistingUsers.js --dry-run --batch=50
 */

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const path = require('path');
const mongoose = require('mongoose');

// Simple console colors without chalk
const colors = {
    reset: '\x1b[0m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bold: '\x1b[1m'
};

// Load models
let User, PromoCode, ReferralHistory, generateReferralCodeForUser;

try {
    User = require('../src/models/User');
    console.log('✅ Loaded User model');
} catch (err) {
    try {
        User = require('../src/models/User');
        console.log('✅ Loaded User from src/models');
    } catch (err2) {
        console.error('❌ Could not load User model:', err2.message);
        process.exit(1);
    }
}

try {
    PromoCode = require('../src/models/PromoCode');
    console.log('✅ Loaded PromoCode model');
} catch (err) {
    console.error('❌ Could not load PromoCode model:', err.message);
    process.exit(1);
}

try {
    ReferralHistory = require('../src/models/ReferralHistory');
    console.log('✅ Loaded ReferralHistory model');
} catch (err) {
    console.log('⚠️ ReferralHistory model not found - will create if needed');
    ReferralHistory = null;
}

// Load promoCodeUtils
try {
    const promoCodeUtils = require('../src/utils/promoCodeUtils');
    generateReferralCodeForUser = promoCodeUtils.generateReferralCodeForUser;
    console.log('✅ Loaded promoCodeUtils');
} catch (err) {
    console.log('⚠️ promoCodeUtils not found - will use internal generator');
    // Fallback generator
    generateReferralCodeForUser = async (userId, userName) => {
        const generateSimpleCode = (name) => {
            const namePart = name
                .replace(/[^a-zA-Z0-9]/g, '')
                .substring(0, 5)
                .toUpperCase();
            const uniquePart = Math.floor(1000 + Math.random() * 9000);
            return `${namePart}${uniquePart}`;
        };

        const code = generateSimpleCode(userName);

        const promoCode = new PromoCode({
            code,
            userId,
            type: 'referral',
            referrerBenefits: {
                discountPercentage: 5,
                rewardPoints: 100,
                cashback: 0,
                freeMonths: 0
            },
            newUserBenefits: {
                discountPercentage: 10,
                rewardPoints: 50,
                cashback: 0,
                freeMonths: 0
            },
            isBackfilled: true
        });

        await promoCode.save();

        await User.findByIdAndUpdate(userId, {
            referralCode: code,
            referralBackfilled: true
        });

        return promoCode;
    };
}

// Parse command line arguments
const args = process.argv.slice(2);
const BATCH_SIZE = parseInt(args.find(arg => arg.startsWith('--batch='))?.split('=')[1] || 50);
const DELAY_MS = parseInt(args.find(arg => arg.startsWith('--delay='))?.split('=')[1] || 500);
const DRY_RUN = args.includes('--dry-run');
const FIX_ERRORS = args.includes('--fix-errors');

// Statistics
const stats = {
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    warnings: []
};

/**
 * Delay function
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Log with colors
 */
const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}`, msg),
    success: (msg) => console.log(`${colors.green}✓${colors.reset}`, msg),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}`, msg),
    error: (msg) => console.log(`${colors.red}✗${colors.reset}`, msg),
    section: (msg) => console.log(`\n${colors.cyan}${colors.bold}=== ${msg} ===${colors.reset}`)
};

/**
 * Validate user data
 */
const validateAndFixUser = async (user) => {
    const fixes = [];
    const issues = [];

    if (!user.name) {
        issues.push('Missing name');
        if (FIX_ERRORS) {
            user.name = user.email?.split('@')[0] || 'User';
            fixes.push('Set name from email');
        }
    }

    if (!user.email || !user.email.includes('@')) {
        issues.push('Invalid email');
    }

    if (user.referralCode) {
        const existing = await User.findOne({
            referralCode: user.referralCode,
            _id: { $ne: user._id }
        });
        if (existing) {
            issues.push('Duplicate referral code');
            if (FIX_ERRORS) {
                user.referralCode = null;
                fixes.push('Cleared duplicate referral code');
            }
        }
    }

    if (!user.referralStats) {
        user.referralStats = {
            totalReferrals: 0,
            completedReferrals: 0,
            pendingReferrals: 0,
            referralRewards: { points: 0, cashback: 0 },
            lastReferralAt: null
        };
        fixes.push('Added referralStats object');
    } else {
        if (!user.referralStats.referralRewards) {
            user.referralStats.referralRewards = { points: 0, cashback: 0 };
            fixes.push('Added referralRewards object');
        }
    }

    if (user.rewardPoints === undefined || user.rewardPoints === null) {
        user.rewardPoints = 0;
        fixes.push('Set rewardPoints to 0');
    }

    if (user.rewardBalance === undefined || user.rewardBalance === null) {
        user.rewardBalance = 0;
        fixes.push('Set rewardBalance to 0');
    }

    if (user.referralStats.lastReferralAt && isNaN(new Date(user.referralStats.lastReferralAt))) {
        user.referralStats.lastReferralAt = null;
        fixes.push('Fixed invalid lastReferralAt date');
    }

    return { fixes, issues };
};

/**
 * Process a single user
 */
const processUser = async (user) => {
    try {
        if (user.isActive === false) {
            stats.skipped++;
            log.warning(`Skipping inactive user: ${user.email} (${user._id})`);
            return { status: 'skipped', reason: 'inactive' };
        }

        const { fixes, issues } = await validateAndFixUser(user);

        if (issues.length > 0) {
            stats.warnings.push({ userId: user._id, email: user.email, issues });
            log.warning(`User ${user.email} has issues: ${issues.join(', ')}`);
        }

        if (fixes.length > 0 && !DRY_RUN) {
            log.info(`Fixing user ${user.email}: ${fixes.join(', ')}`);
        }

        if (user.referralCode) {
            const existingPromo = await PromoCode.findOne({
                userId: user._id,
                type: 'referral'
            });

            if (!existingPromo) {
                if (!DRY_RUN) {
                    const promoCode = new PromoCode({
                        code: user.referralCode,
                        userId: user._id,
                        type: 'referral',
                        referrerBenefits: {
                            discountPercentage: 5,
                            rewardPoints: 100,
                            cashback: 0,
                            freeMonths: 0
                        },
                        newUserBenefits: {
                            discountPercentage: 10,
                            rewardPoints: 50,
                            cashback: 0,
                            freeMonths: 0
                        },
                        isBackfilled: true
                    });
                    await promoCode.save();
                    log.success(`Created missing PromoCode record for ${user.email}: ${user.referralCode}`);
                }
                stats.succeeded++;
                return { status: 'fixed', action: 'created promo code' };
            }

            stats.skipped++;
            return { status: 'skipped', reason: 'already has code' };
        }

        const existingPromo = await PromoCode.findOne({ userId: user._id, type: 'referral' });

        if (existingPromo) {
            if (!DRY_RUN) {
                user.referralCode = existingPromo.code;
                await user.save();
                log.success(`Updated user ${user.email} with existing promo code: ${existingPromo.code}`);
            }
            stats.succeeded++;
            return { status: 'updated', action: 'synced promo code' };
        }

        if (!DRY_RUN) {
            try {
                const promoCode = await generateReferralCodeForUser(user._id, user.name);
                log.success(`Generated new referral code for ${user.email}: ${promoCode.code}`);
                stats.succeeded++;
                return { status: 'created', action: 'generated new code' };
            } catch (genError) {
                if (genError.code === 11000) {
                    const uniqueSuffix = Math.floor(Math.random() * 10000);
                    const fallbackCode = `${user.name.substring(0, 3).toUpperCase()}${uniqueSuffix}`;

                    const promoCode = new PromoCode({
                        code: fallbackCode,
                        userId: user._id,
                        type: 'referral',
                        referrerBenefits: {
                            discountPercentage: 5,
                            rewardPoints: 100,
                            cashback: 0
                        },
                        newUserBenefits: {
                            discountPercentage: 10,
                            rewardPoints: 50,
                            cashback: 0
                        },
                        isBackfilled: true
                    });
                    await promoCode.save();

                    user.referralCode = fallbackCode;
                    await user.save();

                    log.success(`Generated fallback code for ${user.email}: ${fallbackCode}`);
                    stats.succeeded++;
                    return { status: 'created', action: 'generated fallback code' };
                }
                throw genError;
            }
        } else {
            const mockCode = `${user.name.substring(0, 5).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
            log.info(`[DRY RUN] Would generate code for ${user.email}: ${mockCode}`);
            stats.succeeded++;
            return { status: 'would create', action: 'dry run' };
        }

    } catch (error) {
        stats.failed++;
        stats.errors.push({
            userId: user._id,
            email: user.email,
            error: error.message,
            stack: error.stack
        });
        log.error(`Failed for ${user.email}: ${error.message}`);
        return { status: 'failed', error: error.message };
    }
};

/**
 * Main backfill function
 */
const backfillExistingUsers = async () => {
    log.section('STARTING BACKFILL PROCESS');
    log.info(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
    log.info(`Batch size: ${BATCH_SIZE}`);
    log.info(`Delay between batches: ${DELAY_MS}ms`);
    log.info(`Fix errors: ${FIX_ERRORS ? 'YES' : 'NO'}`);

    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            log.error('MongoDB URI not found in environment variables');
            log.info('Please set MONGODB_URI or MONGO_URI in your .env file');
            process.exit(1);
        }

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        log.success('Connected to MongoDB');

        stats.total = await User.countDocuments({});
        log.info(`Total users in database: ${stats.total}`);

        const usersNeedingUpdate = await User.find({
            $or: [
                { referralCode: { $exists: false } },
                { referralCode: null },
                { referralStats: { $exists: false } },
                { rewardPoints: { $exists: false } },
                { rewardBalance: { $exists: false } }
            ]
        });

        log.info(`Users needing updates: ${usersNeedingUpdate.length}`);

        if (usersNeedingUpdate.length === 0) {
            log.success('All users already have referral codes!');
            return;
        }

        for (let i = 0; i < usersNeedingUpdate.length; i += BATCH_SIZE) {
            const batch = usersNeedingUpdate.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(usersNeedingUpdate.length / BATCH_SIZE);

            log.section(`Processing Batch ${batchNum}/${totalBatches}`);
            log.info(`Users ${i + 1} to ${Math.min(i + BATCH_SIZE, usersNeedingUpdate.length)}`);

            for (const user of batch) {
                stats.processed++;
                const result = await processUser(user);

                const progress = `${stats.processed}/${usersNeedingUpdate.length}`;
                switch (result.status) {
                    case 'created':
                    case 'updated':
                    case 'fixed':
                        log.success(`[${progress}] ${user.email}: ${result.action}`);
                        break;
                    case 'skipped':
                        log.warning(`[${progress}] ${user.email}: ${result.reason}`);
                        break;
                    case 'failed':
                        log.error(`[${progress}] ${user.email}: ${result.error}`);
                        break;
                }
            }

            if (i + BATCH_SIZE < usersNeedingUpdate.length) {
                log.info(`Waiting ${DELAY_MS}ms before next batch...`);
                await delay(DELAY_MS);
            }
        }

        log.section('BACKFILL COMPLETE');
        console.log('\n📊 FINAL STATISTICS:');
        console.log('─'.repeat(50));
        console.log(`Total users:          ${stats.total}`);
        console.log(`Successfully updated: ${stats.succeeded}`);
        console.log(`Skipped:              ${stats.skipped}`);
        console.log(`Failed:               ${stats.failed}`);
        console.log(`Warnings:             ${stats.warnings.length}`);

        if (stats.warnings.length > 0) {
            console.log('\n⚠ WARNINGS:');
            stats.warnings.forEach(w => {
                console.log(`  ${w.email}: ${w.issues.join(', ')}`);
            });
        }

        if (stats.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            stats.errors.forEach(e => {
                console.log(`  ${e.email}: ${e.error}`);
            });
        }

        console.log('─'.repeat(50));

    } catch (error) {
        log.error('Fatal error during backfill:');
        console.error(error);
    } finally {
        await mongoose.disconnect();
        log.info('Disconnected from MongoDB');
    }
};

// Run the script
if (require.main === module) {
    backfillExistingUsers().catch(console.error);
}

module.exports = { backfillExistingUsers }; 1