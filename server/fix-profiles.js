// fix-profiles.js
const mongoose = require('mongoose');
require('dotenv').config();

async function fixProfiles() {
    console.log('🔧 Fixing profile data...');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get direct MongoDB connection to bypass mongoose validation
        const db = mongoose.connection.db;

        // Fix all profiles with invalid education data
        const result = await db.collection('profiles').updateMany(
            {},
            {
                $set: {
                    "roleSpecific.education": []  // Clear all education records
                }
            }
        );

        console.log(`✅ Fixed ${result.modifiedCount} profiles`);

        // Also fix any null startDate in user education
        await db.collection('users').updateMany(
            { "education.startDate": { $in: [null, undefined, "Invalid Date"] } },
            { $set: { "education": [] } }
        );

        console.log('✅ Fixed user education records');

        await mongoose.disconnect();
        console.log('🎉 All profiles fixed! Restart your server.');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixProfiles();