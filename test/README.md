# Test Directory

This directory contains all test files for the Sex Consent Contract Management System.

## 📁 Test Files

| File | Description | Command |
|------|-------------|---------|
| `test-login-logic.js` | Comprehensive login logic tests for all authentication methods | `npm run test-login` |
| `test-auth.js` | Authentication system tests | `npm run test-auth` |
| `test-phone-auth.js` | Phone number authentication tests | `npm run test-phone` |
| `test-sms-providers.js` | SMS provider integration tests | `npm run test-sms` |

## 🚀 Running Tests

### Individual Tests
```bash
# Test login logic (comprehensive)
npm run test-login

# Test authentication system
npm run test-auth

# Test phone authentication
npm run test-phone

# Test SMS providers
npm run test-sms
```

### All Tests
```bash
# Run all tests in sequence
npm run test-all

# Run default test (login logic)
npm test
```

## 📋 Test Coverage

### Authentication Methods
- ✅ WeChat OAuth2.0 authentication
- ✅ Apple Sign-In authentication
- ✅ Phone number + SMS verification
- ✅ Social media authentication (fallback)

### SMS Providers
- ✅ Mock SMS provider (development)
- ✅ Twilio SMS provider
- ✅ AWS SNS provider
- ✅ Custom SMS provider

### Error Handling
- ✅ Invalid input validation
- ✅ Network error handling
- ✅ Token validation
- ✅ Rate limiting

### Database Operations
- ✅ User creation and updates
- ✅ Contract management
- ✅ Data consistency

## 🔧 Test Configuration

### Environment Variables
Tests use the same environment variables as the main application:
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - JWT signing secret
- `SMS_PROVIDER` - SMS provider selection
- Provider-specific credentials (Twilio, AWS, etc.)

### Test Data
- Uses mock data for development
- Cleans up test data after completion
- Uses separate test database (if configured)

## 📊 Test Results

Each test provides detailed output:
- ✅ **PASS** - Test completed successfully
- ❌ **FAIL** - Test failed with error details
- ⚠️ **WARN** - Test completed with warnings

## 🐛 Troubleshooting

### Common Issues
1. **Server not running**: Start server with `npm start`
2. **Database connection**: Check MongoDB connection
3. **Environment variables**: Verify all required variables are set
4. **Port conflicts**: Ensure port 3000 is available

### Debug Mode
Set `DEBUG=true` environment variable for verbose logging:
```bash
DEBUG=true npm run test-login
```

## 📝 Adding New Tests

1. Create new test file in this directory
2. Follow naming convention: `test-*.js`
3. Add script to `package.json`
4. Update this README
5. Test the new test file

### Test File Template
```javascript
/**
 * Test: [Test Name]
 * Description: [What this test does]
 * Run with: npm run test-[name]
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function runTest() {
  console.log('🧪 Running [Test Name]...');
  
  try {
    // Test implementation
    console.log('✅ Test passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { runTest };
```

## 🎯 Best Practices

1. **Isolated tests**: Each test should be independent
2. **Clean up**: Remove test data after completion
3. **Error handling**: Provide clear error messages
4. **Documentation**: Document what each test does
5. **Consistent output**: Use emojis and clear formatting
