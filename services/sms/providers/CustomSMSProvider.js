/**
 * Custom SMS Provider
 * 
 * Allows developers to load their own SMS provider implementation
 */

const { ISMSProvider, SMSResult, ProviderStatus } = require('../ISMSProvider');
const path = require('path');

class CustomSMSProvider extends ISMSProvider {
  constructor() {
    super();
    this.name = 'Custom SMS Provider';
    this.provider = null;
    this.initialized = false;
  }

  async initialize(config) {
    if (!config.providerPath) {
      throw new Error('Custom provider path not specified');
    }

    try {
      // Load custom provider
      const providerPath = path.resolve(config.providerPath);
      const CustomProvider = require(providerPath);
      
      // Validate that it extends ISMSProvider
      if (!(CustomProvider.prototype instanceof ISMSProvider)) {
        throw new Error('Custom provider must extend ISMSProvider');
      }

      this.provider = new CustomProvider();
      await this.provider.initialize(config.config || {});
      
      this.config = config;
      this.initialized = true;
      
      console.log(`📱 Custom SMS Provider loaded from: ${providerPath}`);
    } catch (error) {
      throw new Error(`Failed to load custom provider: ${error.message}`);
    }
  }

  async sendSMS(phoneNumber, message, options = {}) {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.provider.sendSMS(phoneNumber, message, options);
    } catch (error) {
      console.error(`❌ Custom SMS failed to ${phoneNumber}:`, error.message);
      return SMSResult.error(error, {
        provider: this.name,
        phoneNumber,
        customProvider: this.config.providerPath
      });
    }
  }

  async sendVerificationCode(phoneNumber, code, options = {}) {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.provider.sendVerificationCode(phoneNumber, code, options);
    } catch (error) {
      console.error(`❌ Custom verification code failed to ${phoneNumber}:`, error.message);
      return SMSResult.error(error, {
        provider: this.name,
        phoneNumber,
        customProvider: this.config.providerPath
      });
    }
  }

  async sendWelcomeMessage(phoneNumber, nickname, options = {}) {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.provider.sendWelcomeMessage(phoneNumber, nickname, options);
    } catch (error) {
      console.error(`❌ Custom welcome message failed to ${phoneNumber}:`, error.message);
      return SMSResult.error(error, {
        provider: this.name,
        phoneNumber,
        customProvider: this.config.providerPath
      });
    }
  }

  async sendLoginNotification(phoneNumber, nickname, options = {}) {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.provider.sendLoginNotification(phoneNumber, nickname, options);
    } catch (error) {
      console.error(`❌ Custom login notification failed to ${phoneNumber}:`, error.message);
      return SMSResult.error(error, {
        provider: this.name,
        phoneNumber,
        customProvider: this.config.providerPath
      });
    }
  }

  async getStatus() {
    if (!this.initialized) {
      return ProviderStatus.unhealthy('Provider not initialized');
    }

    try {
      const status = await this.provider.getStatus();
      return ProviderStatus.healthy(`Custom provider: ${status.message}`, {
        provider: this.name,
        customProvider: this.config.providerPath,
        customStatus: status
      });
    } catch (error) {
      return ProviderStatus.unhealthy(`Custom provider status check failed: ${error.message}`, {
        provider: this.name,
        customProvider: this.config.providerPath,
        error: error.message
      });
    }
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        providerPath: {
          type: 'string',
          description: 'Path to custom SMS provider implementation',
          minLength: 1
        },
        config: {
          type: 'object',
          description: 'Custom provider configuration',
          default: {}
        }
      },
      required: ['providerPath']
    };
  }
}

module.exports = CustomSMSProvider;
