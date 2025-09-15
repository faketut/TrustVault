/**
 * File SMS Provider Example
 * 
 * This is an example custom SMS provider that writes SMS messages to files.
 * Developers can use this as a template for their own implementations.
 */

const { ISMSProvider, SMSResult, ProviderStatus } = require('../ISMSProvider');
const fs = require('fs').promises;
const path = require('path');

class FileSMSProvider extends ISMSProvider {
  constructor() {
    super();
    this.name = 'File SMS Provider';
    this.initialized = false;
  }

  async initialize(config) {
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid File SMS configuration: ${validation.errors.join(', ')}`);
    }

    this.config = {
      outputDir: './sms_logs',
      filenameFormat: 'sms_{timestamp}_{phone}.txt',
      includeMetadata: true,
      ...config
    };

    // Create output directory if it doesn't exist
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
      this.initialized = true;
      console.log(`📱 File SMS Provider initialized. Output directory: ${this.config.outputDir}`);
    } catch (error) {
      throw new Error(`Failed to create output directory: ${error.message}`);
    }
  }

  async sendSMS(phoneNumber, message, options = {}) {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
      const filename = this.config.filenameFormat
        .replace('{timestamp}', timestamp)
        .replace('{phone}', cleanPhone);

      const filePath = path.join(this.config.outputDir, filename);
      
      const smsData = {
        timestamp: new Date().toISOString(),
        phoneNumber,
        message,
        options,
        metadata: {
          provider: this.name,
          messageLength: message.length,
          filename
        }
      };

      const content = this.config.includeMetadata 
        ? JSON.stringify(smsData, null, 2)
        : message;

      await fs.writeFile(filePath, content, 'utf8');
      
      console.log(`📱 File SMS saved to: ${filePath}`);
      
      return SMSResult.success(filename, {
        provider: this.name,
        phoneNumber,
        messageLength: message.length,
        filePath,
        filename
      });
    } catch (error) {
      console.error(`❌ File SMS failed to ${phoneNumber}:`, error.message);
      return SMSResult.error(error, {
        provider: this.name,
        phoneNumber
      });
    }
  }

  async getStatus() {
    if (!this.initialized) {
      return ProviderStatus.unhealthy('Provider not initialized');
    }

    try {
      // Check if output directory is writable
      const testFile = path.join(this.config.outputDir, 'test.tmp');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);

      return ProviderStatus.healthy('File provider is healthy', {
        provider: this.name,
        outputDir: this.config.outputDir,
        writable: true
      });
    } catch (error) {
      return ProviderStatus.unhealthy(`File provider check failed: ${error.message}`, {
        provider: this.name,
        error: error.message
      });
    }
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        outputDir: {
          type: 'string',
          description: 'Directory to save SMS files',
          default: './sms_logs'
        },
        filenameFormat: {
          type: 'string',
          description: 'Filename format for SMS files',
          default: 'sms_{timestamp}_{phone}.txt'
        },
        includeMetadata: {
          type: 'boolean',
          description: 'Whether to include metadata in files',
          default: true
        }
      },
      required: []
    };
  }
}

module.exports = FileSMSProvider;
