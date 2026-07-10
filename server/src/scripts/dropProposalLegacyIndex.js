/**
 * scripts/dropProposalLegacyIndex.js
 *
 * One-time migration script.
 * Run this ONCE to drop the stale index left over from an earlier schema version:
 *   Index name: tenderId_1_freelancerId_1
 *   Fields:     { tenderId: 1, freelancerId: 1 }
 *
 * The current schema uses { tender: 1, freelancer: 1 } (correct ObjectId field names).
 * The old index used wrong field names (tenderId / freelancerId) and had unique:true
 * with no partialFilterExpression, causing E11000 on every second draft created
 * because both null values collide on the unique constraint.
 *
 * USAGE (run from your server root):
 *   node scripts/dropProposalLegacyIndex.js
 *
 * Safe to run multiple times — exits cleanly if the index doesn't exist.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.production') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in environment. Aborting.');
    process.exit(1);
}

const LEGACY_INDEX_NAMES = [
    'tenderId_1_freelancerId_1',        // the bad one causing your E11000
    'tender_1_freelancer_1',            // in case an unnamed version also exists
];

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('proposals');

        // List current indexes
        const indexes = await collection.indexes();
        console.log('\n📋 Current indexes on proposals collection:');
        indexes.forEach(idx => console.log(`  - ${idx.name}:`, JSON.stringify(idx.key)));

        let droppedAny = false;

        for (const indexName of LEGACY_INDEX_NAMES) {
            const exists = indexes.some(idx => idx.name === indexName);
            if (exists) {
                await collection.dropIndex(indexName);
                console.log(`\n✅ Dropped legacy index: "${indexName}"`);
                droppedAny = true;
            } else {
                console.log(`\n⚪ Index "${indexName}" not found — skipping`);
            }
        }

        if (!droppedAny) {
            console.log('\n✅ No legacy indexes found. Collection is clean.');
        }

        // List indexes after cleanup
        const updatedIndexes = await collection.indexes();
        console.log('\n📋 Indexes after migration:');
        updatedIndexes.forEach(idx => console.log(`  - ${idx.name}:`, JSON.stringify(idx.key)));

        console.log('\n✅ Migration complete. Restart your server so Mongoose re-syncs indexes.');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
