/**
 * SMS Service
 * 
 * Main SMS service that manages different SMS providers
 */

const SMSConfig = require('./SMSConfig');
const { ISMSProvider } = require('./ISMSProvider');

class SMSService {
  constructor() {
    this.config = new SMSConfig();
    this.provider = null;
    this.initialized = false;
  }

  /**
   * Initialize the SMS service
   */
  async initialize() {
    try {
      // Load configuration
      this.config.loadConfig();
      
      // Validate configuration
      const validation = this.config.validateConfig();
      if (!validation.valid) {
        throw new Error(`SMS configuration invalid: ${validation.errors.join(', ')}`);
      }

      // Create provider instance
      this.provider = await this.config.createProvider();
      this.initialized = true;
      
      console.log(`📱 SMS Service initialized with provider: ${this.provider.name}`);
      
      // Test provider status
      const status = await this.getStatus();
      if (!status.healthy) {
        console.warn(`⚠️  SMS Provider status: ${status.message}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize SMS service:', error.message);
      throw error;
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(phoneNumber, message, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await this.provider.sendSMS(phoneNumber, message, options);
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(phoneNumber, code, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await this.provider.sendVerificationCode(phoneNumber, code, options);
    } catch (error) {
      console.error('Verification code sending failed:', error);
      throw error;
    }
  }

  /**
   * Send welcome message
   */
  async sendWelcomeMessage(phoneNumber, nickname, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await this.provider.sendWelcomeMessage(phoneNumber, nickname, options);
    } catch (error) {
      console.error('Welcome message sending failed:', error);
      throw error;
    }
  }

  /**
   * Send login notification
   */
  async sendLoginNotification(phoneNumber, nickname, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await this.provider.sendLoginNotification(phoneNumber, nickname, options);
    } catch (error) {
      console.error('Login notification sending failed:', error);
      throw error;
    }
  }

  /**
   * Get provider status
   */
  async getStatus() {
    if (!this.initialized) {
      return {
        healthy: false,
        message: 'SMS service not initialized',
        timestamp: new Date().toISOString()
      };
    }

    try {
      return await this.provider.getStatus();
    } catch (error) {
      return {
        healthy: false,
        message: `Status check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return this.config.getAvailableProviders();
  }

  /**
   * Register custom provider
   */
  registerProvider(name, providerClass, config = {}) {
    this.config.registerProvider(name, providerClass, config);
  }

  /**
   * Switch provider at runtime
   */
  async switchProvider(providerName) {
    try {
      this.provider = await this.config.createProvider(providerName);
      console.log(`📱 Switched to SMS provider: ${this.provider.name}`);
    } catch (error) {
      console.error(`Failed to switch to provider ${providerName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get current provider info
   */
  getCurrentProvider() {
    if (!this.initialized || !this.provider) {
      return null;
    }

    return {
      name: this.provider.name,
      initialized: this.initialized
    };
  }
}

// Create singleton instance
const smsService = new SMSService();

module.exports = smsService;
