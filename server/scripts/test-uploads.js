const { uploadConfig } = require('../src/config/uploads');

console.log('🧪 Testing Upload Configuration...\n');

// Test 1: Validate configuration
const validation = uploadConfig.validate();
console.log('✅ Configuration Validation:');
console.log(`   Valid: ${validation.valid}`);
if (validation.issues.length > 0) {
  console.log('   Issues:');
  validation.issues.forEach(issue => console.log(`   - ${issue}`));
}
console.log(`   Base Directory: ${validation.config.baseDir}`);
console.log(`   Environment: ${validation.config.environment}\n`);

// Test 2: Check all directories
console.log('📁 Directory Paths:');
Object.keys(uploadConfig.directories).forEach(type => {
  const path = uploadConfig.getPath(type);
  console.log(`   ${type}: ${path}`);
});
console.log('');

// Test 3: Generate URLs
console.log('🔗 URL Generation Test:');
const testFile = 'test-image.jpg';
console.log(`   Development URL: ${uploadConfig.getUrl(testFile, 'avatars')}`);
console.log(`   Production URL (simulated):`);

// Simulate production
process.env.NODE_ENV = 'production';
const prodUrl = uploadConfig.getUrl(testFile, 'avatars');
console.log(`   ${prodUrl}`);

// Reset to development
process.env.NODE_ENV = 'development';
console.log('');

// Test 4: Get stats
console.log('📊 Storage Statistics:');
const stats = uploadConfig.getStats();
console.log(`   Total Files: ${stats.total.files}`);
console.log(`   Total Size: ${stats.total.size}`);
console.log(`   Base Directory: ${stats.baseDirectory}`);

console.log('\n✅ Upload configuration test complete!');