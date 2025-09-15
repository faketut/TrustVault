/**
 * SMS Configuration Manager
 * 
 * Manages SMS provider configuration and selection
 */

const fs = require('fs');
const path = require('path');

class SMSConfig {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.config = null;
  }

  /**
   * Load configuration from environment variables or config file
   */
  loadConfig() {
    // Load from environment variables first
    const envConfig = this.loadFromEnvironment();
    
    // Try to load from config file
    const fileConfig = this.loadFromFile();
    
    // Merge configurations (env takes precedence)
    this.config = { ...fileConfig, ...envConfig };
    
    return this.config;
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnvironment() {
    const config = {
      provider: process.env.SMS_PROVIDER || 'mock',
      providers: {}
    };

    // Twilio configuration
    if (process.env.TWILIO_ACCOUNT_SID) {
      config.providers.twilio = {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
      };
    }

    // AWS SNS configuration
    if (process.env.AWS_ACCESS_KEY_ID) {
      config.providers.aws = {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      };
    }

    // Custom provider configuration
    if (process.env.CUSTOM_SMS_PROVIDER) {
      config.providers.custom = {
        providerPath: process.env.CUSTOM_SMS_PROVIDER,
        config: this.parseCustomConfig(process.env.CUSTOM_SMS_CONFIG)
      };
    }

    return config;
  }

  /**
   * Load configuration from file
   */
  loadFromFile() {
    const configPath = path.join(process.cwd(), 'config', 'sms.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
      } catch (error) {
        console.warn('Failed to load SMS config file:', error.message);
      }
    }
    
    return {};
  }

  /**
   * Parse custom configuration from environment variable
   */
  parseCustomConfig(configString) {
    if (!configString) return {};
    
    try {
      return JSON.parse(configString);
    } catch (error) {
      console.warn('Failed to parse custom SMS config:', error.message);
      return {};
    }
  }

  /**
   * Get active provider configuration
   */
  getActiveProviderConfig() {
    if (!this.config) {
      this.loadConfig();
    }

    const providerName = this.config.provider;
    const providerConfig = this.config.providers[providerName];

    if (!providerConfig) {
      throw new Error(`SMS provider '${providerName}' not configured`);
    }

    return {
      name: providerName,
      config: providerConfig
    };
  }

  /**
   * Register a custom SMS provider
   */
  registerProvider(name, providerClass, config = {}) {
    this.providers.set(name, {
      class: providerClass,
      config
    });
  }

  /**
   * Get provider class by name
   */
  getProviderClass(name) {
    // Check registered providers first
    if (this.providers.has(name)) {
      return this.providers.get(name).class;
    }

    // Try to load from built-in providers
    const builtInProviders = {
      mock: './providers/MockSMSProvider',
      twilio: './providers/TwilioSMSProvider',
      aws: './providers/AWSSMSProvider',
      custom: './providers/CustomSMSProvider'
    };

    if (builtInProviders[name]) {
      return require(builtInProviders[name]);
    }

    throw new Error(`SMS provider '${name}' not found`);
  }

  /**
   * Create provider instance
   */
  async createProvider(name = null) {
    const providerInfo = name ? 
      { name, config: this.config.providers[name] } : 
      this.getActiveProviderConfig();

    const ProviderClass = this.getProviderClass(providerInfo.name);
    const provider = new ProviderClass();

    // Initialize provider with configuration
    await provider.initialize(providerInfo.config);

    return provider;
  }

  /**
   * Get all available providers
   */
  getAvailableProviders() {
    return {
      builtIn: ['mock', 'twilio', 'aws', 'custom'],
      registered: Array.from(this.providers.keys())
    };
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    const errors = [];
    
    if (!this.config) {
      errors.push('SMS configuration not loaded');
      return { valid: false, errors };
    }

    const providerName = this.config.provider;
    if (!providerName) {
      errors.push('No SMS provider specified');
      return { valid: false, errors };
    }

    const providerConfig = this.config.providers[providerName];
    if (!providerConfig) {
      errors.push(`Provider '${providerName}' not configured`);
      return { valid: false, errors };
    }

    try {
      const ProviderClass = this.getProviderClass(providerName);
      const provider = new ProviderClass();
      const validation = provider.validateConfig(providerConfig);
      
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
    } catch (error) {
      errors.push(`Provider validation failed: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = SMSConfig;
