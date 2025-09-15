/**
 * Mock SMS Provider
 * 
 * A development/testing SMS provider that logs messages to console
 * instead of actually sending SMS messages.
 */

const { ISMSProvider, SMSResult, ProviderStatus } = require('../ISMSProvider');

class MockSMSProvider extends ISMSProvider {
  constructor() {
    super();
    this.name = 'Mock SMS Provider';
    this.initialized = false;
  }

  async initialize(config = {}) {
    this.config = {
      logToConsole: true,
      simulateDelay: 1000, // 1 second delay
      simulateFailure: false,
      failureRate: 0, // 0-1, probability of failure
      ...config
    };
    this.initialized = true;
    console.log(`📱 Mock SMS Provider initialized with config:`, this.config);
  }

  async sendSMS(phoneNumber, message, options = {}) {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    // Simulate network delay
    if (this.config.simulateDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.simulateDelay));
    }

    // Simulate random failures
    if (this.config.simulateFailure || Math.random() < this.config.failureRate) {
      const error = new Error('Simulated SMS sending failure');
      console.error(`❌ Mock SMS failed to ${phoneNumber}:`, error.message);
      return SMSResult.error(error, { provider: this.name, phoneNumber });
    }

    // Generate mock message ID
    const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log to console
    if (this.config.logToConsole) {
      console.log(`📱 Mock SMS sent to ${phoneNumber}:`);
      console.log(`   Message ID: ${messageId}`);
      console.log(`   Content: ${message}`);
      console.log(`   Timestamp: ${new Date().toISOString()}`);
    }

    return SMSResult.success(messageId, {
      provider: this.name,
      phoneNumber,
      messageLength: message.length,
      simulated: true
    });
  }

  async getStatus() {
    return ProviderStatus.healthy('Mock provider is always healthy', {
      provider: this.name,
      initialized: this.initialized,
      config: this.config
    });
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        logToConsole: {
          type: 'boolean',
          description: 'Whether to log messages to console',
          default: true
        },
        simulateDelay: {
          type: 'number',
          description: 'Simulated network delay in milliseconds',
          default: 1000,
          minimum: 0
        },
        simulateFailure: {
          type: 'boolean',
          description: 'Whether to simulate sending failures',
          default: false
        },
        failureRate: {
          type: 'number',
          description: 'Probability of failure (0-1)',
          default: 0,
          minimum: 0,
          maximum: 1
        }
      },
      required: []
    };
  }
}

module.exports = MockSMSProvider;
