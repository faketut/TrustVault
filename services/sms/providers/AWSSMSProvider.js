/**
 * AWS SNS SMS Provider
 * 
 * SMS provider implementation for AWS Simple Notification Service
 */

const { ISMSProvider, SMSResult, ProviderStatus } = require('../ISMSProvider');

class AWSSMSProvider extends ISMSProvider {
  constructor() {
    super();
    this.name = 'AWS SNS SMS Provider';
    this.sns = null;
    this.initialized = false;
  }

  async initialize(config) {
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid AWS configuration: ${validation.errors.join(', ')}`);
    }

    try {
      // Dynamically require AWS SDK to avoid dependency issues
      const AWS = require('aws-sdk');
      
      // Configure AWS
      AWS.config.update({
        region: config.region,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      });

      this.sns = new AWS.SNS();
      this.config = config;
      this.initialized = true;
      
      console.log(`📱 AWS SNS SMS Provider initialized for region: ${config.region}`);
    } catch (error) {
      throw new Error(`Failed to initialize AWS SNS: ${error.message}`);
    }
  }

  async sendSMS(phoneNumber, message, options = {}) {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      const params = {
        Message: message,
        PhoneNumber: phoneNumber,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          },
          ...options.messageAttributes
        }
      };

      const result = await this.sns.publish(params).promise();
      
      console.log(`📱 AWS SNS SMS sent to ${phoneNumber}: ${result.MessageId}`);
      
      return SMSResult.success(result.MessageId, {
        provider: this.name,
        phoneNumber,
        messageLength: message.length,
        messageId: result.MessageId,
        sequenceNumber: result.SequenceNumber
      });
    } catch (error) {
      console.error(`❌ AWS SNS SMS failed to ${phoneNumber}:`, error.message);
      return SMSResult.error(error, {
        provider: this.name,
        phoneNumber,
        awsError: error.code || 'unknown'
      });
    }
  }

  async getStatus() {
    if (!this.initialized) {
      return ProviderStatus.unhealthy('Provider not initialized');
    }

    try {
      // Test connection by getting account attributes
      const result = await this.sns.getSMSAttributes().promise();
      
      return ProviderStatus.healthy('AWS SNS connection successful', {
        provider: this.name,
        region: this.config.region,
        smsAttributes: result.attributes
      });
    } catch (error) {
      return ProviderStatus.unhealthy(`AWS SNS connection failed: ${error.message}`, {
        provider: this.name,
        error: error.message
      });
    }
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        region: {
          type: 'string',
          description: 'AWS region',
          pattern: '^[a-z0-9-]+$'
        },
        accessKeyId: {
          type: 'string',
          description: 'AWS Access Key ID',
          minLength: 16
        },
        secretAccessKey: {
          type: 'string',
          description: 'AWS Secret Access Key',
          minLength: 32
        }
      },
      required: ['region', 'accessKeyId', 'secretAccessKey']
    };
  }
}

module.exports = AWSSMSProvider;
