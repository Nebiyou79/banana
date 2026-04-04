// scripts/createIndexes.js
/**
 * Run this script to create all necessary indexes
 * node scripts/createIndexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get collections
    const db = mongoose.connection.db;

    // PromoCodes indexes
    await db.collection('promocodes').createIndexes([
      { key: { code: 1 }, unique: true },
      { key: { userId: 1 } },
      { key: { userId: 1, type: 1 } },
      { key: { isActive: 1, validUntil: 1 } },
      { key: { 'usedBy.userId': 1 } },
      { key: { type: 1, createdAt: -1 } }
    ]);

    // ReferralHistories indexes
    await db.collection('referralhistories').createIndexes([
      { key: { referrerId: 1, createdAt: -1 } },
      { key: { referredUserId: 1 }, unique: true },
      { key: { promoCode: 1 } },
      { key: { status: 1 } },
      { key: { referrerId: 1, status: 1 } }
    ]);

    // Users indexes (update existing)
    await db.collection('users').createIndexes([
      { key: { referralCode: 1 }, unique: true, sparse: true },
      { key: { referredBy: 1 } },
      { key: { 'referralStats.totalReferrals': -1 } },
      { key: { referredViaCode: 1 } }
    ]);

    console.log('All indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
};

createIndexes();