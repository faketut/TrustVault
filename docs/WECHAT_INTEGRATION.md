# WeChat Integration Guide

This document explains how to integrate WeChat OAuth2.0 login with the Sex Consent Contract Management System, following the [official WeChat development guide](https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_Login/Development_Guide.html).

## Overview

The system implements WeChat's OAuth2.0 authorization flow to allow users to log in using their WeChat accounts. This provides a secure, user-friendly authentication method that's popular in China.

## Implementation Details

### 1. WeChat OAuth2.0 Flow

The implementation follows WeChat's standard OAuth2.0 flow:

1. **Authorization Request**: User clicks WeChat login button
2. **Code Exchange**: Backend exchanges authorization code for access_token
3. **User Info Retrieval**: Backend fetches user information from WeChat
4. **Token Management**: System manages access_token refresh automatically

### 2. Backend Implementation

#### Environment Variables Required

```env
WECHAT_APPID=your_wechat_appid
WECHAT_APPSECRET=your_wechat_appsecret
WECHAT_JSAPI_TICKET=your_jsapi_ticket
```

#### API Endpoints

- `POST /auth/wechat/callback` - Exchange code for access_token and user info
- `POST /auth/wechat/refresh-token` - Refresh expired access_token
- `POST /auth/wechat/signature` - Generate JS-SDK signature

#### User Model Updates

The User model now includes WeChat-specific data:

```javascript
wechatData: {
  unionid: String, // Cross-platform identification
  sex: Number, // 1: male, 2: female, 0: unknown
  province: String,
  city: String,
  country: String,
  access_token: String,
  refresh_token: String,
  expires_at: Date
}
```

### 3. Frontend Implementation

#### WeChat SDK Integration

The frontend includes a custom WeChat SDK wrapper (`wechat-sdk.js`) that:

- Loads the official WeChat JS-SDK
- Handles SDK initialization with proper signatures
- Provides helper functions for authentication
- Manages WeChat app detection

#### Components

- `WeChatLogin.tsx` - Dedicated WeChat login component
- `LoginForm.tsx` - Updated to support both WeChat and manual login
- WeChat SDK integration in `index.html`

### 4. Security Considerations

#### Access Token Management

- Access tokens are stored securely on the backend
- Automatic refresh before expiration
- Tokens are never exposed to the frontend

#### Signature Verification

- All WeChat API calls use proper signatures
- Timestamps and nonce strings prevent replay attacks
- URL-based signature validation

#### Data Privacy

- Only essential user data is stored (nickname, avatar)
- WeChat access tokens are encrypted and stored securely
- User consent is obtained before data collection

## Setup Instructions

### 1. WeChat Open Platform Setup

1. Register at [WeChat Open Platform](https://developers.weixin.qq.com/)
2. Create a mobile application
3. Configure app information and get AppID/AppSecret
4. Enable WeChat login functionality
5. Set up JS-SDK domain whitelist

### 2. Backend Configuration

1. Install dependencies:
   ```bash
   npm install axios
   ```

2. Set environment variables:
   ```bash
   cp env.example .env
   # Edit .env with your WeChat credentials
   ```

3. Start the server:
   ```bash
   npm start
   ```

### 3. Frontend Configuration

1. The WeChat SDK is automatically loaded from `public/wechat-sdk.js`
2. Update `REACT_APP_WECHAT_APPID` in your environment
3. Ensure your domain is whitelisted in WeChat Open Platform

## Usage

### For Users

1. Click "Login with WeChat" button
2. WeChat app opens (if installed) or redirects to web login
3. Authorize the application
4. User is automatically logged in

### For Developers

#### Testing WeChat Login

1. Use the manual login option for development
2. Simulate WeChat responses for testing
3. Test with actual WeChat accounts in production

#### Error Handling

The system handles common WeChat errors:

- User cancellation
- Network failures
- Invalid credentials
- Token expiration

## API Reference

### WeChat Callback

```javascript
POST /auth/wechat/callback
{
  "code": "authorization_code",
  "state": "optional_state"
}
```

Response:
```javascript
{
  "user": {
    "id": "user_id",
    "socialMediaId": "wechat_openid",
    "platform": "wechat",
    "nickname": "User Name",
    "avatar": "avatar_url",
    "role": "user"
  },
  "token": "jwt_token"
}
```

### Refresh Token

```javascript
POST /auth/wechat/refresh-token
Authorization: Bearer jwt_token
```

### Get Signature

```javascript
POST /auth/wechat/signature
{
  "url": "https://yourdomain.com/page"
}
```

## Troubleshooting

### Common Issues

1. **SDK not loading**: Check domain whitelist in WeChat Open Platform
2. **Signature invalid**: Verify AppID and AppSecret configuration
3. **Access token expired**: System automatically refreshes, check logs
4. **User not found**: Check if user exists in database after WeChat callback

### Debug Mode

Enable WeChat SDK debug mode by setting `debug: true` in the SDK configuration.

## Compliance

This implementation follows:

- WeChat Open Platform terms of service
- Chinese data protection regulations
- OAuth2.0 security best practices
- GDPR principles for international users

## Support

For WeChat-specific issues, refer to:
- [WeChat Open Platform Documentation](https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_Login/Development_Guide.html)
- [WeChat JS-SDK Documentation](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html)

For application-specific issues, check the main project documentation.
