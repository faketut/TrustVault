// routes/auth.js - WeChat OAuth2.0 authentication routes
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const SMS_SERVICE = require('../services/smsService');

const router = express.Router();


// WeChat OAuth2.0 Step 2: Exchange code for access_token
router.post('/wechat/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    
    // Exchange code for access_token
    const tokenResponse = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_APPSECRET,
        code: code,
        grant_type: 'authorization_code'
      }
    });
    
    const { access_token, expires_in, refresh_token, openid, scope, unionid } = tokenResponse.data;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Failed to get access token from WeChat' });
    }
    
    // Get user info from WeChat
    const userInfoResponse = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
      params: {
        access_token: access_token,
        openid: openid,
        lang: 'zh_CN'
      }
    });
    
    const { nickname, headimgurl, sex, province, city, country } = userInfoResponse.data;
    
    // Check if user already exists
    let user = await User.findOne({ socialMediaId: openid, platform: 'wechat' });
    
    if (!user) {
      // Create new user
      user = new User({
        socialMediaId: openid,
        platform: 'wechat',
        nickname: nickname,
        avatar: headimgurl,
        role: 'user',
        wechatData: {
          unionid: unionid,
          sex: sex,
          province: province,
          city: city,
          country: country,
          access_token: access_token,
          refresh_token: refresh_token,
          expires_at: new Date(Date.now() + expires_in * 1000)
        }
      });
      await user.save();
    } else {
      // Update existing user info
      user.nickname = nickname;
      user.avatar = headimgurl;
      user.wechatData = {
        unionid: unionid,
        sex: sex,
        province: province,
        city: city,
        country: country,
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: new Date(Date.now() + expires_in * 1000)
      };
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    });
    
    res.json({
      user: { 
        id: user._id, 
        userId: user._id, // prefer DB id for matching
        socialMediaId: user.socialMediaId,
        phoneNumber: user.phoneNumber,
        appleId: user.appleId,
        platform: user.platform,
        nickname: user.nickname, 
        avatar: user.avatar,
        role: user.role 
      },
      token
    });
  } catch (error) {
    console.error('WeChat callback error:', error.response?.data || error.message);
    res.status(500).json({ error: 'WeChat authentication failed' });
  }
});

// Refresh WeChat access_token
router.post('/wechat/refresh-token', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || user.platform !== 'wechat' || !user.wechatData?.refresh_token) {
      return res.status(400).json({ error: 'No WeChat refresh token available' });
    }
    
    // Check if access_token is expired
    if (user.wechatData.expires_at && new Date() < user.wechatData.expires_at) {
      return res.json({ message: 'Access token is still valid' });
    }
    
    // Refresh access_token
    const refreshResponse = await axios.get('https://api.weixin.qq.com/sns/oauth2/refresh_token', {
      params: {
        appid: process.env.WECHAT_APPID,
        grant_type: 'refresh_token',
        refresh_token: user.wechatData.refresh_token
      }
    });
    
    const { access_token, expires_in, refresh_token } = refreshResponse.data;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Failed to refresh WeChat access token' });
    }
    
    // Update user's WeChat data
    user.wechatData.access_token = access_token;
    user.wechatData.refresh_token = refresh_token || user.wechatData.refresh_token;
    user.wechatData.expires_at = new Date(Date.now() + expires_in * 1000);
    await user.save();
    
    res.json({ message: 'WeChat access token refreshed successfully' });
  } catch (error) {
    console.error('WeChat refresh token error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to refresh WeChat access token' });
  }
});

// Phone number authentication - Send verification code
router.post('/phone/send-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Check if user already exists
    let user = await User.findOne({ phoneNumber, platform: 'phone' });
    
    if (!user) {
      // Create new user with unverified phone
      user = new User({
        phoneNumber,
        platform: 'phone',
        nickname: 'Phone User', // Will be updated during verification
        phoneVerification: {
          verificationCode,
          codeExpiresAt,
          lastSentAt: new Date(),
          attempts: 0
        }
      });
    } else {
      // Update verification code for existing user
      user.phoneVerification = {
        verificationCode,
        codeExpiresAt,
        lastSentAt: new Date(),
        attempts: 0
      };
    }
    
    await user.save();

    // Send SMS verification code
    try {
      console.log(`Sending SMS to ${phoneNumber} with code: ${verificationCode}`);
      await SMS_SERVICE.sendVerificationCode(phoneNumber, verificationCode);
      
      res.json({ 
        message: 'Verification code sent successfully',
        // Remove this in production - only for development
        code: process.env.NODE_ENV === 'development' ? verificationCode : undefined
      });
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      // Still save the user and code, but inform about SMS failure
      res.json({ 
        message: 'Verification code generated. SMS delivery may have failed.',
        code: process.env.NODE_ENV === 'development' ? verificationCode : undefined,
        warning: 'SMS delivery failed. Please try again or contact support.',
        debug: process.env.NODE_ENV === 'development' ? smsError.message : undefined
      });
    }
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Phone number authentication - Verify code and login
router.post('/phone/verify', async (req, res) => {
  try {
    const { phoneNumber, verificationCode, nickname } = req.body;
    
    if (!phoneNumber || !verificationCode) {
      return res.status(400).json({ error: 'Phone number and verification code are required' });
    }

    // Validate verification code format
    if (!/^\d{6}$/.test(verificationCode)) {
      return res.status(400).json({ error: 'Verification code must be 6 digits' });
    }

    // Nickname no longer required

    // Find user by phone number
    const user = await User.findOne({ phoneNumber, platform: 'phone' });
    
    if (!user) {
      return res.status(400).json({ error: 'Phone number not found' });
    }

    // Check if verification code is valid and not expired
    if (!user.phoneVerification || 
        user.phoneVerification.verificationCode !== verificationCode ||
        new Date() > user.phoneVerification.codeExpiresAt) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Check attempt limit
    if (user.phoneVerification.attempts >= 3) {
      return res.status(400).json({ error: 'Too many verification attempts. Please request a new code.' });
    }

    // Update user with verified status and nickname
    if (nickname) user.nickname = nickname;
    user.phoneVerification.isVerified = true;
    user.phoneVerification.verificationCode = undefined; // Clear the code
    user.phoneVerification.attempts = 0;
    await user.save();

    // Send welcome SMS (optional, don't fail if SMS fails)
    try {
      await SMS_SERVICE.sendWelcomeMessage(phoneNumber, nickname);
    } catch (smsError) {
      console.error('Welcome SMS failed:', smsError);
      // Don't fail the login process if welcome SMS fails
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    });
    
    res.json({
      user: { 
        id: user._id, 
        userId: user._id,
        phoneNumber: user.phoneNumber,
        socialMediaId: user.socialMediaId,
        appleId: user.appleId,
        platform: user.platform,
        nickname: user.nickname, 
        avatar: user.avatar,
        role: user.role 
      },
      token
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ error: 'Phone verification failed' });
  }
});

// Apple Sign-In authentication
router.post('/apple/login', async (req, res) => {
  try {
    const { authorizationCode, identityToken, user: appleUser } = req.body;
    
    if (!authorizationCode) {
      return res.status(400).json({ error: 'Apple authorization code is required' });
    }

    // Validate authorization code format (basic check)
    if (authorizationCode.length < 10) {
      return res.status(400).json({ error: 'Invalid Apple authorization code format' });
    }

    // In a real application, you would verify the Apple identity token here
    // For now, we'll create/update user based on the provided data
    
    const appleId = appleUser?.id || `apple_${Date.now()}`;
    const email = appleUser?.email || `${appleId}@privaterelay.appleid.com`;
    const firstName = appleUser?.name?.firstName || 'Apple';
    const lastName = appleUser?.name?.lastName || 'User';
    const fullName = `${firstName} ${lastName}`.trim();

    // Check if user already exists
    let user = await User.findOne({ appleId, platform: 'apple' });
    
    if (!user) {
      // Create new user
      user = new User({
        appleId,
        platform: 'apple',
        nickname: fullName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=000000&color=ffffff`,
        appleData: {
          identityToken,
          authorizationCode,
          user: {
            id: appleId,
            email,
            name: {
              firstName,
              lastName
            }
          }
        }
      });
    } else {
      // Update existing user
      user.nickname = fullName;
      user.appleData = {
        identityToken,
        authorizationCode,
        user: {
          id: appleId,
          email,
          name: {
            firstName,
            lastName
          }
        }
      };
    }
    
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    });
    
    res.json({
      user: { 
        id: user._id, 
        userId: user._id,
        appleId: user.appleId,
        socialMediaId: user.socialMediaId,
        phoneNumber: user.phoneNumber,
        platform: user.platform,
        nickname: user.nickname, 
        avatar: user.avatar,
        role: user.role 
      },
      token
    });
  } catch (error) {
    console.error('Apple login error:', error);
    res.status(500).json({ error: 'Apple authentication failed' });
  }
});

// Fallback social media login/register (for other platforms)
router.post('/social-login', async (req, res) => {
  try {
    const { socialMediaId, platform, nickname, avatar, role = 'user' } = req.body;
    
    // Validate required fields
    if (!socialMediaId || !platform) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user already exists
    let user = await User.findOne({ socialMediaId, platform });
    
    if (!user) {
      // Create new user
      user = new User({
        socialMediaId,
        platform,
        nickname,
        avatar,
        role
      });
      await user.save();
    } else {
      // Update existing user info
      user.nickname = nickname;
      user.avatar = avatar;
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    });
    
    res.json({
      user: { 
        id: user._id, 
        userId: user._id,
        socialMediaId: user.socialMediaId,
        phoneNumber: user.phoneNumber,
        appleId: user.appleId,
        platform: user.platform,
        nickname: user.nickname, 
        avatar: user.avatar,
        role: user.role 
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Social login failed' });
  }
});

// WeChat signature for JS-SDK
router.post('/wechat/signature', async (req, res) => {
  try {
    const crypto = require('crypto');
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Generate signature for WeChat JS-SDK
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = Math.random().toString(36).substr(2, 15);
    const jsapi_ticket = process.env.WECHAT_JSAPI_TICKET || 'your_jsapi_ticket';
    
    // Create signature string
    const signatureString = `jsapi_ticket=${jsapi_ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');
    
    res.json({
      appId: process.env.WECHAT_APPID,
      timestamp: timestamp,
      nonceStr: nonceStr,
      signature: signature
    });
  } catch (error) {
    console.error('WeChat signature error:', error);
    res.status(500).json({ error: 'Failed to generate WeChat signature' });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});


// Get user contracts count
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { Contract } = require('../models');
    const uid = (req.user?._id || req.user.userId)?.toString();
    const totalContracts = await Contract.countDocuments({
      $or: [{ partyAId: uid }, { partyBId: uid }, { authorizedBy: uid }]
    });
    const activeContracts = await Contract.countDocuments({
      $or: [{ partyAId: uid }, { partyBId: uid }, { authorizedBy: uid }],
      status: 'active'
    });
    const revokedContracts = await Contract.countDocuments({
      $or: [{ partyAId: uid }, { partyBId: uid }, { authorizedBy: uid }],
      status: 'revoked'
    });
    const invalidContracts = await Contract.countDocuments({
      $or: [{ partyAId: uid }, { partyBId: uid }, { authorizedBy: uid }],
      status: 'invalid'
    });
    
    res.json({
      totalContracts,
      activeContracts,
      revokedContracts,
      invalidContracts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

module.exports = router;
