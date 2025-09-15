# SMS Provider Development Guide

## Overview

The Sex Consent Contract Management System provides an open interface for developers to implement their own SMS providers. This allows you to integrate with any SMS service or create custom solutions for your specific needs.

## Architecture

```
SMS Service Architecture
├── ISMSProvider (Interface)
├── SMSConfig (Configuration Manager)
├── SMSService (Main Service)
├── Built-in Providers
│   ├── MockSMSProvider
│   ├── TwilioSMSProvider
│   ├── AWSSMSProvider
│   └── CustomSMSProvider
└── Your Custom Provider
```

## Quick Start

### 1. Create Your SMS Provider

Create a new file `MySMSProvider.js`:

```javascript
const { ISMSProvider, SMSResult, ProviderStatus } = require('./services/sms/ISMSProvider');

class MySMSProvider extends ISMSProvider {
  constructor() {
    super();
    this.name = 'My Custom SMS Provider';
    this.initialized = false;
  }

  async initialize(config) {
    // Initialize your SMS service here
    // e.g., set up API keys, create clients, etc.
    this.config = config;
    this.initialized = true;
    console.log('My SMS Provider initialized');
  }

  async sendSMS(phoneNumber, message, options = {}) {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      // Implement your SMS sending logic here
      // e.g., call your SMS API
      const messageId = await this.callMySMSAPI(phoneNumber, message);
      
      return SMSResult.success(messageId, {
        provider: this.name,
        phoneNumber,
        messageLength: message.length
      });
    } catch (error) {
      return SMSResult.error(error, {
        provider: this.name,
        phoneNumber
      });
    }
  }

  async getStatus() {
    // Check if your SMS service is healthy
    try {
      const isHealthy = await this.checkMySMSHealth();
      return ProviderStatus.healthy('My provider is working', {
        provider: this.name,
        customStatus: isHealthy
      });
    } catch (error) {
      return ProviderStatus.unhealthy(`My provider error: ${error.message}`);
    }
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          description: 'Your SMS API key',
          minLength: 1
        },
        apiUrl: {
          type: 'string',
          description: 'Your SMS API URL',
          format: 'uri'
        }
      },
      required: ['apiKey', 'apiUrl']
    };
  }

  // Your custom methods
  async callMySMSAPI(phoneNumber, message) {
    // Implement your API call here
    // Return a message ID
  }

  async checkMySMSHealth() {
    // Implement health check here
    // Return true if healthy, false otherwise
  }
}

module.exports = MySMSProvider;
```

### 2. Register Your Provider

In your application startup code:

```javascript
const SMS_SERVICE = require('./services/smsService');
const MySMSProvider = require('./path/to/MySMSProvider');

// Register your provider
SMS_SERVICE.registerProvider('my-provider', MySMSProvider);
```

### 3. Configure Your Provider

Set environment variables:

```env
SMS_PROVIDER=my-provider
CUSTOM_SMS_PROVIDER=./path/to/MySMSProvider.js
CUSTOM_SMS_CONFIG={"apiKey":"your-key","apiUrl":"https://api.example.com"}
```

Or create a config file `config/sms.json`:

```json
{
  "provider": "my-provider",
  "providers": {
    "my-provider": {
      "apiKey": "your-api-key",
      "apiUrl": "https://api.example.com"
    }
  }
}
```

## Interface Reference

### ISMSProvider Interface

All SMS providers must implement the `ISMSProvider` interface:

#### Required Methods

```javascript
// Initialize the provider with configuration
async initialize(config) { }

// Send an SMS message
async sendSMS(phoneNumber, message, options = {}) { }

// Get provider health status
async getStatus() { }

// Get configuration schema
getConfigSchema() { }
```

#### Optional Methods (with defaults)

```javascript
// Send verification code (default implementation provided)
async sendVerificationCode(phoneNumber, code, options = {}) { }

// Send welcome message (default implementation provided)
async sendWelcomeMessage(phoneNumber, nickname, options = {}) { }

// Send login notification (default implementation provided)
async sendLoginNotification(phoneNumber, nickname, options = {}) { }

// Validate configuration (default implementation provided)
validateConfig(config) { }
```

### Helper Classes

#### SMSResult

```javascript
// Success result
SMSResult.success(messageId, metadata = {})

// Error result
SMSResult.error(error, metadata = {})
```

#### ProviderStatus

```javascript
// Healthy status
ProviderStatus.healthy(message, metadata = {})

// Unhealthy status
ProviderStatus.unhealthy(message, metadata = {})
```

## Built-in Providers

### MockSMSProvider

For development and testing:

```javascript
// Configuration
{
  "logToConsole": true,
  "simulateDelay": 1000,
  "simulateFailure": false,
  "failureRate": 0
}
```

### TwilioSMSProvider

For Twilio service:

```javascript
// Configuration
{
  "accountSid": "AC...",
  "authToken": "...",
  "phoneNumber": "+1234567890"
}
```

### AWSSMSProvider

For AWS SNS:

```javascript
// Configuration
{
  "region": "us-east-1",
  "accessKeyId": "...",
  "secretAccessKey": "..."
}
```

## Configuration Methods

### Environment Variables

```env
# Provider selection
SMS_PROVIDER=my-provider

# Built-in provider configs
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Custom provider
CUSTOM_SMS_PROVIDER=./path/to/MyProvider.js
CUSTOM_SMS_CONFIG={"key":"value"}
```

### Configuration File

Create `config/sms.json`:

```json
{
  "provider": "my-provider",
  "providers": {
    "mock": {
      "logToConsole": true,
      "simulateDelay": 1000
    },
    "twilio": {
      "accountSid": "AC...",
      "authToken": "...",
      "phoneNumber": "+1234567890"
    },
    "my-provider": {
      "apiKey": "your-key",
      "apiUrl": "https://api.example.com"
    }
  }
}
```

## Examples

### Example 1: Simple HTTP API Provider

```javascript
const axios = require('axios');
const { ISMSProvider, SMSResult, ProviderStatus } = require('./services/sms/ISMSProvider');

class HTTPAPISMSProvider extends ISMSProvider {
  async initialize(config) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
    this.initialized = true;
  }

  async sendSMS(phoneNumber, message, options = {}) {
    try {
      const response = await axios.post(this.apiUrl, {
        phone: phoneNumber,
        message: message,
        apiKey: this.apiKey,
        ...options
      });

      return SMSResult.success(response.data.messageId, {
        provider: this.name,
        phoneNumber,
        status: response.data.status
      });
    } catch (error) {
      return SMSResult.error(error, { provider: this.name, phoneNumber });
    }
  }

  async getStatus() {
    try {
      const response = await axios.get(`${this.apiUrl}/health`);
      return ProviderStatus.healthy('API is healthy', { status: response.data });
    } catch (error) {
      return ProviderStatus.unhealthy(`API check failed: ${error.message}`);
    }
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        apiKey: { type: 'string', minLength: 1 },
        apiUrl: { type: 'string', format: 'uri' }
      },
      required: ['apiKey', 'apiUrl']
    };
  }
}
```

### Example 2: Database Logging Provider

```javascript
const { ISMSProvider, SMSResult, ProviderStatus } = require('./services/sms/ISMSProvider');

class DatabaseSMSProvider extends ISMSProvider {
  async initialize(config) {
    this.db = config.database;
    this.table = config.table || 'sms_logs';
    this.initialized = true;
  }

  async sendSMS(phoneNumber, message, options = {}) {
    try {
      const messageId = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.db(this.table).insert({
        id: messageId,
        phone_number: phoneNumber,
        message: message,
        options: JSON.stringify(options),
        created_at: new Date()
      });

      return SMSResult.success(messageId, {
        provider: this.name,
        phoneNumber,
        stored: true
      });
    } catch (error) {
      return SMSResult.error(error, { provider: this.name, phoneNumber });
    }
  }

  async getStatus() {
    try {
      const count = await this.db(this.table).count('* as total').first();
      return ProviderStatus.healthy('Database provider is healthy', {
        totalMessages: count.total
      });
    } catch (error) {
      return ProviderStatus.unhealthy(`Database check failed: ${error.message}`);
    }
  }
}
```

## Testing Your Provider

### Unit Testing

```javascript
const MySMSProvider = require('./MySMSProvider');

describe('MySMSProvider', () => {
  let provider;

  beforeEach(async () => {
    provider = new MySMSProvider();
    await provider.initialize({
      apiKey: 'test-key',
      apiUrl: 'https://test-api.com'
    });
  });

  test('should send SMS successfully', async () => {
    const result = await provider.sendSMS('+1234567890', 'Test message');
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test('should handle errors gracefully', async () => {
    // Mock your API to throw an error
    const result = await provider.sendSMS('+1234567890', 'Test message');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Integration Testing

```javascript
const SMS_SERVICE = require('./services/smsService');

test('should work with registered provider', async () => {
  SMS_SERVICE.registerProvider('test', MySMSProvider);
  
  const result = await SMS_SERVICE.sendSMS('+1234567890', 'Test message');
  expect(result.success).toBe(true);
});
```

## Best Practices

### 1. Error Handling

- Always wrap API calls in try-catch blocks
- Return meaningful error messages
- Log errors for debugging
- Handle network timeouts gracefully

### 2. Configuration Validation

- Validate all required configuration parameters
- Provide clear error messages for missing config
- Use the built-in `validateConfig` method

### 3. Status Monitoring

- Implement proper health checks
- Monitor API quotas and limits
- Provide detailed status information

### 4. Performance

- Use connection pooling for HTTP clients
- Implement retry logic for transient failures
- Cache configuration when possible

### 5. Security

- Never log sensitive information (API keys, phone numbers)
- Validate phone number formats
- Sanitize message content if needed

## Troubleshooting

### Common Issues

1. **Provider not found**: Check registration and configuration
2. **Initialization failed**: Verify configuration parameters
3. **SMS sending failed**: Check API credentials and network connectivity
4. **Status check failed**: Implement proper health check logic

### Debug Mode

Enable debug logging:

```javascript
// In your provider
console.log('Debug info:', { phoneNumber, message, config: this.config });
```

### Testing Tools

Use the built-in test script:

```bash
node test-phone-auth.js
```

## Support

For questions and support:

1. Check the example providers in `services/sms/examples/`
2. Review the built-in provider implementations
3. Test with the MockSMSProvider first
4. Use the configuration validation tools

## License

This SMS provider interface is part of the Sex Consent Contract Management System and follows the same license terms.
