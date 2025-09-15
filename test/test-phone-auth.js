// Test script for phone authentication
// Run with: node test-phone-auth.js

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testPhoneAuthentication() {
  console.log('🧪 Testing Phone Authentication...\n');
  
  try {
    // Test 1: Send verification code
    console.log('📱 Step 1: Sending verification code...');
    const phoneNumber = '+1234567890';
    
    const sendResponse = await axios.post(`${API_BASE_URL}/auth/phone/send-code`, {
      phoneNumber
    });
    
    console.log('✅ Send code response:', sendResponse.data);
    
    if (sendResponse.data.code) {
      console.log(`🔐 Verification code: ${sendResponse.data.code}`);
    }
    
    // Test 2: Verify code (if we have one)
    if (sendResponse.data.code) {
      console.log('\n📱 Step 2: Verifying code...');
      
      const verifyResponse = await axios.post(`${API_BASE_URL}/auth/phone/verify`, {
        phoneNumber,
        verificationCode: sendResponse.data.code,
        nickname: 'Test Phone User'
      });
      
      console.log('✅ Verify code response:', verifyResponse.data);
      
      if (verifyResponse.data.token) {
        console.log('🎉 Phone authentication successful!');
        console.log(`Token: ${verifyResponse.data.token.substring(0, 20)}...`);
      }
    } else {
      console.log('⚠️  No verification code received - check SMS service configuration');
    }
    
  } catch (error) {
    console.error('❌ Phone authentication test failed:');
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.error('\n🔍 Possible issues:');
      console.error('1. Database connection not established');
      console.error('2. SMS service configuration missing');
      console.error('3. Server not running on port 3000');
      console.error('4. Missing environment variables');
    }
  }
}

async function testServerHealth() {
  console.log('🏥 Testing server health...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Server is running:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    console.error('Make sure the server is running with: npm start');
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Phone Authentication Tests...\n');
  
  // First check if server is running
  const serverHealthy = await testServerHealth();
  
  if (!serverHealthy) {
    console.log('\n❌ Server is not running. Please start the server first.');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test phone authentication
  await testPhoneAuthentication();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 Test Summary:');
  console.log('1. Check server console for SMS service logs');
  console.log('2. Check browser console for frontend logs');
  console.log('3. Verify database connection in server logs');
  console.log('4. Check environment variables are set correctly');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testPhoneAuthentication, testServerHealth, runTests };
