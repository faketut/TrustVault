# Phone Authentication Setup Guide

## Overview
This guide helps you set up and troubleshoot phone number authentication in the Sex Consent Contract Management System.

## Quick Setup

### 1. Environment Variables
Make sure your `.env` file contains the required variables:

```env
# Database
MONGODB_URI=mongodb://localhost/sex-consent-system
JWT_SECRET=your-super-secret-jwt-key-here

# SMS Service (choose one)
# For development (mock SMS)
NODE_ENV=development

# For production with Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# For production with AWS SNS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
```

### 2. Start the Server
```bash
# Install dependencies
npm install

# Start the server
npm start
```

### 3. Test Phone Authentication
```bash
# Run the test script
node test-phone-auth.js
```

## Troubleshooting

### Common Issues

#### 1. "Failed to send verification code"
**Possible causes:**
- Server not running
- Database connection failed
- SMS service not configured
- Missing environment variables

**Solutions:**
1. Check server console for error messages
2. Verify database connection
3. Ensure all required environment variables are set
4. In development mode, check console for verification code

#### 2. "Phone number not found" during verification
**Possible causes:**
- User record not created during send-code
- Database save failed
- Phone number format mismatch

**Solutions:**
1. Check database for user record
2. Verify phone number format consistency
3. Check server logs for database errors

#### 3. "Invalid or expired verification code"
**Possible causes:**
- Code expired (5 minutes)
- Wrong code entered
- Too many attempts (max 3)

**Solutions:**
1. Request a new code
2. Check code format (6 digits)
3. Wait for cooldown period

### Debug Mode

In development mode (`NODE_ENV=development`):
- Verification codes are logged to console
- SMS service errors are logged
- Debug information is shown in UI

### Testing Steps

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open the application:**
   - Go to http://localhost:3001
   - Click on "Phone" tab
   - Enter a phone number (e.g., +1234567890)

3. **Check console logs:**
   - Server console: Look for SMS service logs
   - Browser console: Look for API response logs

4. **Verify the code:**
   - Use the code from server console (development mode)
   - Enter a nickname
   - Complete verification

### Production Setup

For production, configure a real SMS service:

#### Twilio Setup
1. Create Twilio account
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Set environment variables
5. Update `services/smsService.js` to use Twilio

#### AWS SNS Setup
1. Create AWS account
2. Set up IAM user with SNS permissions
3. Get access keys
4. Set environment variables
5. Update `services/smsService.js` to use AWS SNS

### API Endpoints

- `POST /api/auth/phone/send-code` - Send verification code
- `POST /api/auth/phone/verify` - Verify code and login

### Response Format

**Send Code Success:**
```json
{
  "message": "Verification code sent successfully",
  "code": "123456"  // Only in development
}
```

**Verify Code Success:**
```json
{
  "user": {
    "id": "user_id",
    "phoneNumber": "+1234567890",
    "platform": "phone",
    "nickname": "User Name",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

### Security Notes

- Verification codes expire in 5 minutes
- Maximum 3 verification attempts
- Rate limiting prevents spam
- Phone numbers are validated for international format
- All data is encrypted in transit and at rest
