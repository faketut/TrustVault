/**
 * Login Logic Test Script
 * 
 * Tests all authentication methods to ensure they work correctly
 * Run with: node test-login-logic.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testServerHealth() {
  console.log('🏥 Testing server health...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Server is running:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return false;
  }
}

async function testPhoneAuthentication() {
  console.log('\n📱 Testing Phone Authentication...');
  
  try {
    // Test 1: Send verification code
    console.log('  📤 Sending verification code...');
    const phoneNumber = '+1234567890';
    const sendResponse = await axios.post(`${API_BASE_URL}/auth/phone/send-code`, {
      phoneNumber
    });
    
    console.log('  ✅ Verification code sent:', sendResponse.data.message);
    
    // Test 2: Verify code (if we have one)
    if (sendResponse.data.code) {
      console.log('  🔐 Verifying code...');
      const verifyResponse = await axios.post(`${API_BASE_URL}/auth/phone/verify`, {
        phoneNumber,
        verificationCode: sendResponse.data.code,
        nickname: 'Test Phone User'
      });
      
      console.log('  ✅ Phone authentication successful!');
      console.log('  User:', verifyResponse.data.user);
      return verifyResponse.data.token;
    } else {
      console.log('  ⚠️  No verification code received (check SMS service)');
      return null;
    }
    
  } catch (error) {
    console.error('  ❌ Phone authentication failed:', error.response?.data || error.message);
    return null;
  }
}

async function testAppleAuthentication() {
  console.log('\n🍎 Testing Apple Authentication...');
  
  try {
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
    
    console.log('  📤 Sending Apple login data...');
    const response = await axios.post(`${API_BASE_URL}/auth/apple/login`, appleData);
    
    console.log('  ✅ Apple authentication successful!');
    console.log('  User:', response.data.user);
    return response.data.token;
    
  } catch (error) {
    console.error('  ❌ Apple authentication failed:', error.response?.data || error.message);
    return null;
  }
}

async function testWeChatAuthentication() {
  console.log('\n💬 Testing WeChat Authentication...');
  
  try {
    const wechatData = {
      code: 'mock_wechat_code_' + Date.now(),
      state: 'test_state'
    };
    
    console.log('  📤 Sending WeChat callback data...');
    const response = await axios.post(`${API_BASE_URL}/auth/wechat/callback`, wechatData);
    
    console.log('  ✅ WeChat authentication successful!');
    console.log('  User:', response.data.user);
    return response.data.token;
    
  } catch (error) {
    console.error('  ❌ WeChat authentication failed:', error.response?.data || error.message);
    return null;
  }
}

async function testSocialAuthentication() {
  console.log('\n👤 Testing Social Authentication...');
  
  try {
    const socialData = {
      socialId: 'test_social_id_' + Date.now(),
      platform: 'other',
      nickname: 'Test Social User',
      avatar: 'https://via.placeholder.com/50'
    };
    
    console.log('  📤 Sending social login data...');
    const response = await axios.post(`${API_BASE_URL}/auth/social-login`, socialData);
    
    console.log('  ✅ Social authentication successful!');
    console.log('  User:', response.data.user);
    return response.data.token;
    
  } catch (error) {
    console.error('  ❌ Social authentication failed:', error.response?.data || error.message);
    return null;
  }
}

async function testTokenValidation(token) {
  if (!token) {
    console.log('\n🔐 Skipping token validation (no token available)');
    return false;
  }
  
  console.log('\n🔐 Testing Token Validation...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('  ✅ Token validation successful!');
    console.log('  Profile:', response.data);
    return true;
    
  } catch (error) {
    console.error('  ❌ Token validation failed:', error.response?.data || error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  const errorTests = [
    {
      name: 'Invalid phone number',
      endpoint: '/auth/phone/send-code',
      data: { phoneNumber: 'invalid' },
      expectedStatus: 400
    },
    {
      name: 'Missing Apple authorization code',
      endpoint: '/auth/apple/login',
      data: { user: {} },
      expectedStatus: 400
    },
    {
      name: 'Invalid verification code format',
      endpoint: '/auth/phone/verify',
      data: { phoneNumber: '+1234567890', verificationCode: '123', nickname: 'Test' },
      expectedStatus: 400
    },
    {
      name: 'Missing required fields',
      endpoint: '/auth/social-login',
      data: { socialId: 'test' },
      expectedStatus: 400
    }
  ];
  
  for (const test of errorTests) {
    try {
      console.log(`  🧪 Testing: ${test.name}`);
      await axios.post(`${API_BASE_URL}${test.endpoint}`, test.data);
      console.log(`  ❌ Expected error but got success`);
    } catch (error) {
      if (error.response?.status === test.expectedStatus) {
        console.log(`  ✅ Correctly returned ${test.expectedStatus} error`);
      } else {
        console.log(`  ❌ Expected ${test.expectedStatus} but got ${error.response?.status}`);
      }
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting Login Logic Tests...\n');
  
  // Test server health first
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ Server is not running. Please start the server first.');
    return;
  }
  
  // Test all authentication methods
  const results = {
    phone: false,
    apple: false,
    wechat: false,
    social: false,
    tokenValidation: false
  };
  
  // Test phone authentication
  const phoneToken = await testPhoneAuthentication();
  results.phone = !!phoneToken;
  
  // Test Apple authentication
  const appleToken = await testAppleAuthentication();
  results.apple = !!appleToken;
  
  // Test WeChat authentication
  const wechatToken = await testWeChatAuthentication();
  results.wechat = !!wechatToken;
  
  // Test social authentication
  const socialToken = await testSocialAuthentication();
  results.social = !!socialToken;
  
  // Test token validation with any available token
  const testToken = phoneToken || appleToken || wechatToken || socialToken;
  results.tokenValidation = await testTokenValidation(testToken);
  
  // Test error handling
  await testErrorHandling();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  
  console.log(`📱 Phone Authentication: ${results.phone ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🍎 Apple Authentication: ${results.apple ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`💬 WeChat Authentication: ${results.wechat ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`👤 Social Authentication: ${results.social ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🔐 Token Validation: ${results.tokenValidation ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All login logic tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
  
  console.log('\n📋 Troubleshooting Tips:');
  console.log('1. Make sure the server is running: npm start');
  console.log('2. Check database connection and collections');
  console.log('3. Verify environment variables are set');
  console.log('4. Check server console for error messages');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testServerHealth,
  testPhoneAuthentication,
  testAppleAuthentication,
  testWeChatAuthentication,
  testSocialAuthentication,
  testTokenValidation,
  testErrorHandling,
  runAllTests
};
