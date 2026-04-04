// test-referral.js
const axios = require('axios');

const API_URL = 'http://localhost:5000/api'; // Adjust port as needed

const testReferralSystem = async () => {
    try {
        // 1. Test public promo code validation
        console.log('1. Testing promo code validation...');
        const validateRes = await axios.post(`${API_URL}/promo-codes/validate`, {
            code: 'BANEG3850' // Use one of your actual codes
        });
        console.log('✅ Validation response:', validateRes.data);

        // 2. Login to get token
        console.log('\n2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'banew249@gmail.com', // Use a test user
            password: 'Neba@123'
        });
        const token = loginRes.data.data.token;
        console.log('✅ Login successful');

        // 3. Get referral stats
        console.log('\n3. Getting referral stats...');
        const statsRes = await axios.get(`${API_URL}/promo-codes/my-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Stats:', JSON.stringify(statsRes.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
};

testReferralSystem();