/**
 * Test Configuration
 * 
 * Centralized configuration for all test files
 */

module.exports = {
  // API Configuration
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 30000, // 30 seconds
    retries: 3
  },

  // Test Data
  testData: {
    // Phone numbers for testing
    phoneNumbers: {
      valid: '+1234567890',
      invalid: 'invalid-phone',
      international: '+8613800138000'
    },

    // Apple Sign-In test data
    apple: {
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
    },

    // WeChat test data
    wechat: {
      code: 'mock_wechat_code_' + Date.now(),
      state: 'test_state'
    },

    // Social media test data
    social: {
      socialMediaId: 'test_social_id_' + Date.now(),
      platform: 'other',
      nickname: 'Test Social User',
      avatar: 'https://via.placeholder.com/50'
    }
  },

  // Test Settings
  settings: {
    // Enable debug logging
    debug: process.env.DEBUG === 'true',
    
    // Test timeout
    timeout: parseInt(process.env.TEST_TIMEOUT) || 30000,
    
    // Skip specific tests
    skipTests: process.env.SKIP_TESTS ? process.env.SKIP_TESTS.split(',') : [],
    
    // Clean up test data
    cleanup: process.env.CLEANUP !== 'false',
    
    // Parallel test execution
    parallel: process.env.PARALLEL_TESTS === 'true'
  },

  // Expected Results
  expectations: {
    // Response time limits (ms)
    responseTime: {
      fast: 1000,    // < 1 second
      normal: 5000,  // < 5 seconds
      slow: 10000    // < 10 seconds
    },

    // Success rates
    successRate: {
      minimum: 0.95, // 95% minimum success rate
      target: 1.0    // 100% target success rate
    }
  },

  // Test Categories
  categories: {
    authentication: ['login', 'logout', 'token-validation'],
    sms: ['send-code', 'verify-code', 'providers'],
    wechat: ['oauth', 'callback', 'refresh'],
    apple: ['signin', 'verification'],
    phone: ['verification', 'validation'],
    social: ['login', 'registration']
  },

  // Environment-specific settings
  environments: {
    development: {
      baseUrl: 'http://localhost:3000/api',
      debug: true,
      cleanup: true
    },
    staging: {
      baseUrl: 'https://staging-api.example.com/api',
      debug: false,
      cleanup: false
    },
    production: {
      baseUrl: 'https://api.example.com/api',
      debug: false,
      cleanup: false
    }
  },

  // Get current environment settings
  getCurrentEnvironment() {
    const env = process.env.NODE_ENV || 'development';
    return this.environments[env] || this.environments.development;
  },

  // Get test configuration
  getConfig() {
    const envConfig = this.getCurrentEnvironment();
    return {
      ...this,
      ...envConfig,
      api: { ...this.api, ...envConfig.api },
      settings: { ...this.settings, ...envConfig.settings }
    };
  }
};
