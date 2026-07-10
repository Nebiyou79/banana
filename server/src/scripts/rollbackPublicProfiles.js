/**
 * server/scripts/rollbackPublicProfiles.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Emergency rollback: drops the entire PublicProfile collection.
 *
 * Usage (destructive — use with caution):
 *   node server/src/scripts/rollbackPublicProfiles.js
 *   NODE_ENV=production node server/src/scripts/rollbackPublicProfiles.js --confirm
 *
 * Requires --confirm flag in production to prevent accidental data loss.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path   = require('path');
const dotenv = require('dotenv');
const fs     = require('fs');

const envProd = path.join(__dirname, '..', '..', '.env.production');
const envDev  = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envProd)) {
  dotenv.config({ path: envProd });
} else {
  dotenv.config({ path: envDev });
}

const mongoose = require('mongoose');

async function rollback() {
  const isProduction = process.env.NODE_ENV === 'production';
  const confirmed    = process.argv.includes('--confirm');

  if (isProduction && !confirmed) {
    console.error(
      '❌  Refusing to rollback in production without --confirm flag.\n' +
      '    Run: NODE_ENV=production node rollbackPublicProfiles.js --confirm'
    );
    process.exit(1);
  }

  const MONGO_URI = process.env.MONGODB_URI;
  if (!MONGO_URI) {
    console.error('❌  MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }

  console.log('🔗  Connecting to MongoDB …');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log('✅  Connected.\n');

  const db         = mongoose.connection.db;
  const collection = db.collection('publicprofiles');
  const count      = await collection.countDocuments();

  console.log(`⚠️   About to drop ${count} PublicProfile document(s)…`);

  await collection.drop().catch((err) => {
    if (err.codeName === 'NamespaceNotFound') {
      console.log('ℹ️   Collection does not exist — nothing to drop.');
    } else {
      throw err;
    }
  });

  console.log('✅  PublicProfile collection dropped.');

  await mongoose.disconnect();
  console.log('🔌  Disconnected from MongoDB.');
  process.exit(0);
}

rollback().catch((err) => {
  console.error('💥  Rollback crashed:', err);
  process.exit(1);
});