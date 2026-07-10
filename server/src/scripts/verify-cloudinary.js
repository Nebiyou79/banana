const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🔍 Verifying Cloudinary Configuration...\n');

// Check environment variables
const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing.join(', '));
  console.error('\n📝 Current .env values found:');
  console.error(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET'}`);
  console.error(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
  console.error(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.substring(0, 8) + '...' : 'NOT SET'}`);
  
  console.error('\n💡 Please check your .env file contains:');
  console.error('   CLOUDINARY_CLOUD_NAME=dpdkc9upr');
  console.error('   CLOUDINARY_API_KEY=744337815828186');
  console.error('   CLOUDINARY_API_SECRET=tXe0-jMx33S_D871M-Z0sis2UgY');
  
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY.substring(0, 8)}...`);
console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET.substring(0, 8)}...`);

// Now require cloudinary config AFTER dotenv is loaded
const { cloudinary } = require('../src/config/cloudinary');

// Test Cloudinary connection
try {
  // Simple ping by getting cloud name from config
  const config = cloudinary.config();
  console.log(`\n✅ Cloudinary connected successfully!`);
  console.log(`   Configured Cloud: ${config.cloud_name}`);
  console.log(`   API Key configured: ${config.api_key ? 'Yes' : 'No'}`);
  console.log(`   Secure mode: ${config.secure}`);
  
  // Test upload presets
  console.log('\n📋 Upload Presets Status:');
  console.log(`   Files: ${process.env.CLOUDINARY_UPLOAD_PRESET_FILES || '⚠️ Not set - Create in Cloudinary Dashboard'}`);
  console.log(`   Media: ${process.env.CLOUDINARY_UPLOAD_PRESET_MEDIA || '⚠️ Not set - Create in Cloudinary Dashboard'}`);
  console.log(`   Avatars: ${process.env.CLOUDINARY_UPLOAD_PRESET_AVATARS || '⚠️ Not set - Create in Cloudinary Dashboard'}`);
  console.log(`   Covers: ${process.env.CLOUDINARY_UPLOAD_PRESET_COVERS || '⚠️ Not set - Create in Cloudinary Dashboard'}`);
  
  console.log('\n📊 Upload Limits:');
  console.log(`   Documents: ${(parseInt(process.env.MAX_DOCUMENT_SIZE) / (1024 * 1024)).toFixed(0)}MB`);
  console.log(`   Images: ${(parseInt(process.env.MAX_IMAGE_SIZE) / (1024 * 1024)).toFixed(0)}MB`);
  console.log(`   Videos: ${(parseInt(process.env.MAX_VIDEO_SIZE) / (1024 * 1024)).toFixed(0)}MB`);
  console.log(`   Avatars: ${(parseInt(process.env.MAX_AVATAR_SIZE) / (1024 * 1024)).toFixed(0)}MB`);
  
  console.log('\n✅ Cloudinary setup complete!');
  console.log('\n🚀 Next steps:');
  console.log('1. Create upload presets in Cloudinary Dashboard');
  console.log('2. Restart your server');
  console.log('3. Test file uploads');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Cloudinary connection failed:', error.message);
  
  if (error.message.includes('Invalid cloud_name')) {
    console.error('\n💡 Check your CLOUDINARY_CLOUD_NAME in .env');
  } else if (error.message.includes('Invalid api_key')) {
    console.error('\n💡 Check your CLOUDINARY_API_KEY in .env');
  } else if (error.message.includes('Invalid signature')) {
    console.error('\n💡 Check your CLOUDINARY_API_SECRET in .env');
  }
  
  process.exit(1);
}