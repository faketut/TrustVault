/**
 * Test Utilities
 * 
 * Common utilities and helper functions for all test files
 */

const axios = require('axios');
const config = require('./test-config');

class TestUtils {
  constructor() {
    this.config = config.getConfig();
    this.api = axios.create({
      baseURL: this.config.api.baseUrl,
      timeout: this.config.api.timeout
    });
  }

  /**
   * Log test information
   */
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      debug: '🐛'
    }[type] || 'ℹ️';

    if (type === 'debug' && !this.config.settings.debug) {
      return;
    }

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Test server health
   */
  async checkServerHealth() {
    try {
      this.log('Checking server health...', 'info');
      const response = await this.api.get('/health');
      this.log(`Server is running: ${response.data.message || 'OK'}`, 'success');
      return true;
    } catch (error) {
      this.log(`Server health check failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Make API request with retry logic
   */
  async makeRequest(method, endpoint, data = null, retries = this.config.api.retries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await this.api[method.toLowerCase()](endpoint, data);
        const duration = Date.now() - startTime;
        
        this.log(`API ${method} ${endpoint} - ${response.status} (${duration}ms)`, 'success');
        return response;
      } catch (error) {
        this.log(`API ${method} ${endpoint} - Attempt ${attempt}/${retries} failed: ${error.message}`, 'warning');
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry
        await this.sleep(1000 * attempt);
      }
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate test data
   */
  generateTestData(type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    const generators = {
      phone: () => `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      email: () => `test-${random}@example.com`,
      nickname: () => `TestUser${random}`,
      socialId: () => `social_${random}_${timestamp}`,
      appleId: () => `apple_${random}_${timestamp}`,
      wechatCode: () => `wechat_${random}_${timestamp}`,
      verificationCode: () => Math.floor(100000 + Math.random() * 900000).toString()
    };

    return generators[type] ? generators[type]() : null;
  }

  /**
   * Validate response structure
   */
  validateResponse(response, expectedFields = []) {
    if (!response || !response.data) {
      throw new Error('Invalid response structure');
    }

    for (const field of expectedFields) {
      if (!(field in response.data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return true;
  }

  /**
   * Validate user object
   */
  validateUser(user) {
    const requiredFields = ['id', 'platform', 'nickname', 'role'];
    const validPlatforms = ['wechat', 'qq', 'weibo', 'apple', 'phone', 'other'];
    const validRoles = ['user', 'admin', 'lawyer'];

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in user)) {
        throw new Error(`User missing required field: ${field}`);
      }
    }

    // Validate platform
    if (!validPlatforms.includes(user.platform)) {
      throw new Error(`Invalid platform: ${user.platform}`);
    }

    // Validate role
    if (!validRoles.includes(user.role)) {
      throw new Error(`Invalid role: ${user.role}`);
    }

    return true;
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(userId) {
    if (!this.config.settings.cleanup || !userId) {
      return;
    }

    try {
      // This would typically delete test data from database
      this.log(`Cleaning up test data for user: ${userId}`, 'debug');
      // Implementation depends on your cleanup strategy
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'warning');
    }
  }

  /**
   * Measure test performance
   */
  measurePerformance(testName, testFunction) {
    return async (...args) => {
      const startTime = Date.now();
      try {
        const result = await testFunction(...args);
        const duration = Date.now() - startTime;
        
        this.log(`Test '${testName}' completed in ${duration}ms`, 'success');
        
        // Check if performance is within expected limits
        if (duration > this.config.expectations.responseTime.slow) {
          this.log(`Test '${testName}' was slow (${duration}ms)`, 'warning');
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.log(`Test '${testName}' failed after ${duration}ms: ${error.message}`, 'error');
        throw error;
      }
    };
  }

  /**
   * Run test with error handling
   */
  async runTest(testName, testFunction, ...args) {
    try {
      this.log(`Starting test: ${testName}`, 'info');
      const result = await testFunction(...args);
      this.log(`Test passed: ${testName}`, 'success');
      return { name: testName, status: 'PASSED', result };
    } catch (error) {
      this.log(`Test failed: ${testName} - ${error.message}`, 'error');
      return { name: testName, status: 'FAILED', error: error.message };
    }
  }

  /**
   * Create test summary
   */
  createSummary(results) {
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const total = results.length;
    const successRate = (passed / total * 100).toFixed(1);

    return {
      total,
      passed,
      failed,
      successRate: parseFloat(successRate),
      results
    };
  }

  /**
   * Print test summary
   */
  printSummary(summary) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`📈 Success Rate: ${summary.successRate}%`);
    
    if (summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      summary.results
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
    
    console.log('='.repeat(60));
  }
}

module.exports = TestUtils;
