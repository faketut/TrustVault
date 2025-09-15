/**
 * SMS Provider Interface
 * 
 * This interface defines the contract that all SMS providers must implement.
 * Open source developers can create their own implementations by extending this interface.
 * 
 * @interface ISMSProvider
 */
class ISMSProvider {
  /**
   * Initialize the SMS provider with configuration
   * @param {Object} config - Provider-specific configuration
   * @returns {Promise<void>}
   */
  async initialize(config) {
    throw new Error('initialize() method must be implemented by SMS provider');
  }

  /**
   * Send an SMS message
   * @param {string} phoneNumber - Recipient phone number (international format)
   * @param {string} message - Message content
   * @param {Object} options - Additional options (optional)
   * @returns {Promise<SMSResult>}
   */
  async sendSMS(phoneNumber, message, options = {}) {
    throw new Error('sendSMS() method must be implemented by SMS provider');
  }

  /**
   * Send a verification code SMS
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} code - 6-digit verification code
   * @param {Object} options - Additional options (optional)
   * @returns {Promise<SMSResult>}
   */
  async sendVerificationCode(phoneNumber, code, options = {}) {
    const message = `Your verification code is: ${code}. This code will expire in 5 minutes.`;
    return await this.sendSMS(phoneNumber, message, options);
  }

  /**
   * Send a welcome message
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} nickname - User's nickname
   * @param {Object} options - Additional options (optional)
   * @returns {Promise<SMSResult>}
   */
  async sendWelcomeMessage(phoneNumber, nickname, options = {}) {
    const message = `Welcome to Sex Consent Contract Management System, ${nickname}! Your account has been successfully created.`;
    return await this.sendSMS(phoneNumber, message, options);
  }

  /**
   * Send a login notification
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} nickname - User's nickname
   * @param {Object} options - Additional options (optional)
   * @returns {Promise<SMSResult>}
   */
  async sendLoginNotification(phoneNumber, nickname, options = {}) {
    const message = `Hello ${nickname}, you have successfully logged in to your account.`;
    return await this.sendSMS(phoneNumber, message, options);
  }

  /**
   * Get provider status and health
   * @returns {Promise<ProviderStatus>}
   */
  async getStatus() {
    throw new Error('getStatus() method must be implemented by SMS provider');
  }

  /**
   * Get provider configuration schema
   * @returns {Object} Configuration schema for validation
   */
  getConfigSchema() {
    return {
      type: 'object',
      properties: {},
      required: []
    };
  }

  /**
   * Validate configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const schema = this.getConfigSchema();
    // Basic validation - can be enhanced with JSON schema validator
    const errors = [];
    
    for (const field of schema.required) {
      if (!config[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * SMS Result class
 * @class SMSResult
 */
class SMSResult {
  constructor(success, messageId = null, error = null, metadata = {}) {
    this.success = success;
    this.messageId = messageId;
    this.error = error;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }

  static success(messageId, metadata = {}) {
    return new SMSResult(true, messageId, null, metadata);
  }

  static error(error, metadata = {}) {
    return new SMSResult(false, null, error, metadata);
  }
}

/**
 * Provider Status class
 * @class ProviderStatus
 */
class ProviderStatus {
  constructor(healthy, message = '', metadata = {}) {
    this.healthy = healthy;
    this.message = message;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }

  static healthy(message = 'Provider is healthy', metadata = {}) {
    return new ProviderStatus(true, message, metadata);
  }

  static unhealthy(message = 'Provider is unhealthy', metadata = {}) {
    return new ProviderStatus(false, message, metadata);
  }
}

module.exports = {
  ISMSProvider,
  SMSResult,
  ProviderStatus
};
