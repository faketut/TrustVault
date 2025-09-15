// SMS Service for phone verification
// This now uses the new provider interface system

const smsService = require('./sms/SMSService');

// Legacy wrapper for backward compatibility
const SMS_SERVICE = {
  // Send SMS message
  async sendSMS(phoneNumber, message) {
    try {
      const result = await smsService.sendSMS(phoneNumber, message);
      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw new Error('Failed to send SMS');
    }
  },

  // Send verification code
  async sendVerificationCode(phoneNumber, code) {
    try {
      const result = await smsService.sendVerificationCode(phoneNumber, code);
      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error('Verification code sending error:', error);
      throw new Error('Failed to send verification code');
    }
  },

  // Send welcome message
  async sendWelcomeMessage(phoneNumber, nickname) {
    try {
      const result = await smsService.sendWelcomeMessage(phoneNumber, nickname);
      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error('Welcome message sending error:', error);
      throw new Error('Failed to send welcome message');
    }
  },

  // Send login notification
  async sendLoginNotification(phoneNumber, nickname) {
    try {
      const result = await smsService.sendLoginNotification(phoneNumber, nickname);
      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      console.error('Login notification sending error:', error);
      throw new Error('Failed to send login notification');
    }
  },

  // Get service status
  async getStatus() {
    return await smsService.getStatus();
  },

  // Get available providers
  getAvailableProviders() {
    return smsService.getAvailableProviders();
  },

  // Register custom provider
  registerProvider(name, providerClass, config = {}) {
    smsService.registerProvider(name, providerClass, config);
  },

  // Switch provider
  async switchProvider(providerName) {
    return await smsService.switchProvider(providerName);
  }
};

module.exports = SMS_SERVICE;
