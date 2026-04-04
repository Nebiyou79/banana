// server/src/utils/createAdmin.js
require('dotenv').config(); // safe if index.js already loaded dotenv
const mongoose = require('mongoose');
const path = require('path');

const User = require('../models/User'); // adjust if your models path is different

async function ensureMongooseConnected() {
  const mongoUri = process.env.MONGODB;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in .env');
  }

  if (mongoose.connection.readyState === 0) {
    console.log('➡️ Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  } else {
    console.log('✅ Using existing mongoose connection');
  }
}

async function createDefaultAdmin(options = {}) {
  await ensureMongooseConnected();

  const adminEmail = options.email || process.env.ADMIN_EMAIL;
  const adminPassword = options.password || process.env.ADMIN_PASSWORD;
  const adminName = options.name || process.env.ADMIN_NAME || 'Super Admin';

  if (!adminEmail || !adminPassword) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be provided (env or options).');
    return;
  }

  console.log(`Checking for existing admin account: ${adminEmail}`);
  const existing = await User.findOne({ email: adminEmail, role: 'admin' });
  if (existing) {
    console.log('ℹ️ Admin already exists:', existing.email, 'id:', existing._id.toString());
    return existing;
  }

  try {
    // IMPORTANT: your User model hashes passwordHash in pre('save').
    // To play safe, provide the plain password to passwordHash (pre-save will hash).
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      passwordHash: adminPassword, // plain — model will hash it
      role: 'admin',
      profileCompleted: true,
      emailVerified: true,
      verificationStatus: 'full',
      isActive: true
    });

    const saved = await adminUser.save();
    console.log('🎉 Admin created:', saved.email, 'id:', saved._id.toString());
    return saved;
  } catch (err) {
    console.error('❌ Failed creating admin. Validation errors / stack:');
    if (err.name === 'ValidationError') {
      for (const key of Object.keys(err.errors)) {
        console.error(` - ${key}: ${err.errors[key].message}`);
      }
    } else {
      console.error(err);
    }
    throw err;
  }
}

// If required directly from index.js, export the function
module.exports = createDefaultAdmin;

// If run directly: node server/src/utils/createAdmin.js
if (require.main === module) {
  (async () => {
    try {
      await createDefaultAdmin();
      console.log('Done.');
      process.exit(0);
    } catch (err) {
      console.error('Script failed:', err);
      process.exit(1);
    }
  })();
}
