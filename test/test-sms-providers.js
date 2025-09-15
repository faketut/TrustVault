/**
 * SMS Provider Test Script
 * 
 * Tests all available SMS providers to ensure they work correctly
 */

const SMS_SERVICE = require('./services/smsService');

async function testProvider(providerName, config = {}) {
  console.log(`\n🧪 Testing ${providerName} provider...`);
  
  try {
    // Switch to the provider
    await SMS_SERVICE.switchProvider(providerName);
    
    // Test status
    const status = await SMS_SERVICE.getStatus();
    console.log(`   Status: ${status.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    if (!status.healthy) {
      console.log(`   Message: ${status.message}`);
    }
    
    // Test sending SMS
    const phoneNumber = '+1234567890';
    const message = `Test message from ${providerName} provider at ${new Date().toISOString()}`;
    
    console.log(`   Sending SMS to ${phoneNumber}...`);
    const result = await SMS_SERVICE.sendSMS(phoneNumber, message);
    
    if (result.success) {
      console.log(`   ✅ SMS sent successfully`);
      console.log(`   Message ID: ${result.messageId}`);
    } else {
      console.log(`   ❌ SMS failed: ${result.error}`);
    }
    
    // Test verification code
    console.log(`   Testing verification code...`);
    const codeResult = await SMS_SERVICE.sendVerificationCode(phoneNumber, '123456');
    
    if (codeResult.success) {
      console.log(`   ✅ Verification code sent successfully`);
    } else {
      console.log(`   ❌ Verification code failed: ${codeResult.error}`);
    }
    
    return {
      provider: providerName,
      status: status.healthy,
      sms: result.success,
      verification: codeResult.success
    };
    
  } catch (error) {
    console.log(`   ❌ Provider test failed: ${error.message}`);
    return {
      provider: providerName,
      status: false,
      sms: false,
      verification: false,
      error: error.message
    };
  }
}

async function testAllProviders() {
  console.log('🚀 Starting SMS Provider Tests...\n');
  
  const results = [];
  
  // Test built-in providers
  const providers = ['mock', 'twilio', 'aws', 'custom'];
  
  for (const provider of providers) {
    try {
      const result = await testProvider(provider);
      results.push(result);
    } catch (error) {
      console.log(`❌ Failed to test ${provider}: ${error.message}`);
      results.push({
        provider,
        status: false,
        sms: false,
        verification: false,
        error: error.message
      });
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const status = result.status ? '✅' : '❌';
    const sms = result.sms ? '✅' : '❌';
    const verification = result.verification ? '✅' : '❌';
    
    console.log(`${status} ${result.provider.padEnd(15)} | Status: ${status} | SMS: ${sms} | Verification: ${verification}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successful = results.filter(r => r.status && r.sms && r.verification).length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 Overall: ${successful}/${total} providers working correctly`);
  
  if (successful === total) {
    console.log('🎉 All SMS providers are working correctly!');
  } else {
    console.log('⚠️  Some providers need attention. Check configuration and dependencies.');
  }
  
  return results;
}

async function testCustomProvider(providerPath, config = {}) {
  console.log(`\n🧪 Testing custom provider from ${providerPath}...`);
  
  try {
    // Register custom provider
    const CustomProvider = require(providerPath);
    SMS_SERVICE.registerProvider('test-custom', CustomProvider);
    
    // Test the custom provider
    const result = await testProvider('test-custom', config);
    
    console.log(`\n📋 Custom Provider Test Results:`);
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Status: ${result.status ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`   SMS: ${result.sms ? '✅ Working' : '❌ Failed'}`);
    console.log(`   Verification: ${result.verification ? '✅ Working' : '❌ Failed'}`);
    
    return result;
    
  } catch (error) {
    console.log(`❌ Custom provider test failed: ${error.message}`);
    return {
      provider: 'test-custom',
      status: false,
      sms: false,
      verification: false,
      error: error.message
    };
  }
}

async function runTests() {
  try {
    // Test all built-in providers
    await testAllProviders();
    
    // Test custom provider if specified
    const customProviderPath = process.argv[2];
    if (customProviderPath) {
      console.log(`\n🔧 Testing custom provider: ${customProviderPath}`);
      await testCustomProvider(customProviderPath);
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testProvider,
  testAllProviders,
  testCustomProvider,
  runTests
};
