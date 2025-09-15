/**
 * Twilio SMS Provider
 * 
 * SMS provider implementation for Twilio service
 */

const { ISMSProvider, SMSResult, ProviderStatus } = require('../ISMSProvider');

class TwilioSMSProvider extends ISMSProvider {
  constructor() {
    super();
    this.name = 'Twilio SMS Provider';
    this.client = null;
    this.initialized = false;
  }

  async initialize(config) {
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid Twilio configuration: ${validation.errors.join(', ')}`);
    }

    try {
      // Dynamically require Twilio to avoid dependency issues
      const twilio = require('twilio');
      this.client = twilio(config.accountSid, config.authToken);
      this.config = config;
      this.initialized = true;
      
      console.log(`📱 Twilio SMS Provider initialized for account: ${config.accountSid}`);
    } catch (error) {
      throw new Error(`Failed to initialize Twilio: ${error.message}`);
    }
  }

  async sendSMS(phoneNumber, message, options = {}) {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      const messageOptions = {
        body: message,
        from: this.config.phoneNumber,
        to: phoneNumber,
        ...options
      };

      const result = await this.client.messages.create(messageOptions);
      
      console.log(`📱 Twilio SMS sent to ${phoneNumber}: ${result.sid}`);
      
      return SMSResult.success(result.sid, {
        provider: this.name,
        phoneNumber,
        messageLength: message.length,
        twilioSid: result.sid,
        status: result.status,
        price: result.price,
        priceUnit: result.priceUnit
      });
    } catch (error) {
      console.error(`❌ Twilio SMS failed to ${phoneNumber}:`, error.message);
      return SMSResult.error(error, {
        provider: this.name,
        phoneNumber,
        twilioError: error.code || 'unknown'
      });
    }
  }

  async getStatus() {
    if (!this.initialized) {
      return ProviderStatus.unhealthy('Provider not initialized');
    }

    try {
      // Test connection by getting account info
      const account = await this.client.api.accounts(this.config.accountSid).fetch();
      
      return ProviderStatus.healthy('Twilio connection successful', {
        provider: this.name,
        accountSid: account.sid,
        accountStatus: account.status,
        accountType: account.type
      });
    } catch (error) {
      return ProviderStatus.unhealthy(`Twilio connection failed: ${error.message}`, {
        provider: this.name,
        error: error.message
      });
    }
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        accountSid: {
          type: 'string',
          description: 'Twilio Account SID',
          pattern: '^AC[a-f0-9]{32}$'
        },
        authToken: {
          type: 'string',
          description: 'Twilio Auth Token',
          minLength: 32
        },
        phoneNumber: {
          type: 'string',
          description: 'Twilio phone number (E.164 format)',
          pattern: '^\\+[1-9]\\d{1,14}$'
        }
      },
      required: ['accountSid', 'authToken', 'phoneNumber']
    };
  }
}

module.exports = TwilioSMSProvider;
