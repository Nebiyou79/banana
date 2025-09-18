require('dotenv').config();
const { sendOTPEmail } = require('./services/emailService');

async function testEmail() {
  try {
    // FIXED: Remove the double .com
    await sendOTPEmail('nebawale1111@gmail.com', 'Test User', '123456');
    console.log('✅ Email test successful!');
    console.log('📧 Check your:');
    console.log('   - Inbox');
    console.log('   - Spam folder'); 
    console.log('   - Promotions tab');
    console.log('   - All Mail');
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testEmail();