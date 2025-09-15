// Test script for authentication methods
// Run with: node test-auth.js

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testPhoneAuth() {
  console.log('🧪 Testing Phone Authentication...');
  
  try {
    // Test sending verification code
    const phoneNumber = '+1234567890';
    console.log(`📱 Sending verification code to ${phoneNumber}`);
    
    const sendResponse = await axios.post(`${API_BASE_URL}/auth/phone/send-code`, {
      phoneNumber
    });
    
    console.log('✅ Send code response:', sendResponse.data);
    
    // In development, the code is returned for testing
    const verificationCode = sendResponse.data.code || '123456';
    console.log(`🔐 Using verification code: ${verificationCode}`);
    
    // Test verifying code
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/phone/verify`, {
      phoneNumber,
      verificationCode,
      nickname: 'Test User'
    });
    
    console.log('✅ Verify code response:', verifyResponse.data);
    return verifyResponse.data.token;
    
  } catch (error) {
    console.error('❌ Phone auth test failed:', error.response?.data || error.message);
    return null;
  }
}

async function testAppleAuth() {
  console.log('🧪 Testing Apple Authentication...');
  
  try {
    // Test Apple login with mock data
    const appleData = {
      authorizationCode: 'mock_apple_code_' + Date.now(),
      identityToken: 'mock_identity_token',
      user: {
        id: 'mock_apple_id_' + Date.now(),
        email: 'test@privaterelay.appleid.com',
        name: {
          firstName: 'Test',
          lastName: 'User'
        }
      }
    };
    
    console.log('🍎 Sending Apple login data...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/apple/login`, appleData);
    
    console.log('✅ Apple auth response:', response.data);
    return response.data.token;
    
  } catch (error) {
    console.error('❌ Apple auth test failed:', error.response?.data || error.message);
    return null;
  }
}

async function testWeChatAuth() {
  console.log('🧪 Testing WeChat Authentication...');
  
  try {
    // Test WeChat callback with mock data
    const wechatData = {
      code: 'mock_wechat_code_' + Date.now(),
      state: 'test_state'
    };
    
    console.log('💬 Sending WeChat callback data...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/wechat/callback`, wechatData);
    
    console.log('✅ WeChat auth response:', response.data);
    return response.data.token;
    
  } catch (error) {
    console.error('❌ WeChat auth test failed:', error.response?.data || error.message);
    return null;
  }
}

async function testSocialAuth() {
  console.log('🧪 Testing Social Authentication...');
  
  try {
    // Test social login with mock data
    const socialData = {
      socialMediaId: 'test_social_id_' + Date.now(),
      platform: 'other',
      nickname: 'Test Social User',
      avatar: 'https://via.placeholder.com/50'
    };
    
    console.log('👤 Sending social login data...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/social-login`, socialData);
    
    console.log('✅ Social auth response:', response.data);
    return response.data.token;
    
  } catch (error) {
    console.error('❌ Social auth test failed:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Authentication Tests...\n');
  
  const results = {
    phone: false,
    apple: false,
    wechat: false,
    social: false
  };
  
  // Test each authentication method
  const phoneToken = await testPhoneAuth();
  results.phone = !!phoneToken;
  console.log('');
  
  const appleToken = await testAppleAuth();
  results.apple = !!appleToken;
  console.log('');
  
  const wechatToken = await testWeChatAuth();
  results.wechat = !!wechatToken;
  console.log('');
  
  const socialToken = await testSocialAuth();
  results.social = !!socialToken;
  console.log('');
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log(`Phone Authentication: ${results.phone ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Apple Authentication: ${results.apple ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WeChat Authentication: ${results.wechat ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Social Authentication: ${results.social ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All authentication methods are working correctly!');
  } else {
    console.log('⚠️  Some authentication methods need attention.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testPhoneAuth, testAppleAuth, testWeChatAuth, testSocialAuth, runTests };
