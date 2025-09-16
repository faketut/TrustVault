// models/index.js - Database models for Sex Consent Contract Management System
const mongoose = require('mongoose');

// User Schema - Multi-platform authentication
const userSchema = new mongoose.Schema({

  socialMediaId: String, // WeChat, QQ, Weibo ID
  phoneNumber: String, // Phone number for SMS auth
  appleId: String, // Apple ID for Apple Sign-In
  
  // Authentication platform
  platform: { 
    type: String, 
    enum: ['wechat', 'apple', 'phone'], 
    required: true 
  },
  
  // User profile
  role: { type: String, enum: ['user', 'admin', 'lawyer'], default: 'user' },
  
  // Contract statistics
  signCount: { type: Number, default: 0 },
  revokeCount: { type: Number, default: 0 },
  
  // Phone verification data
  phoneVerification: {
    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    codeExpiresAt: Date,
    lastSentAt: Date,
    attempts: { type: Number, default: 0 }
  },
  
  // Apple Sign-In data
  appleData: {
    identityToken: String,
    authorizationCode: String,
    user: {
      id: String,
      email: String,
      name: {
        firstName: String,
        lastName: String
      }
    }
  },
  
  // WeChat specific data
  wechatData: {
    unionid: String, // WeChat UnionID for cross-platform identification
    sex: Number, // 1: male, 2: female, 0: unknown
    province: String,
    city: String,
    country: String,
    access_token: String,
    refresh_token: String,
    expires_at: Date
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Virtual/computed field: userId (encrypted identifier)
userSchema.add({ userId: { type: String } });

function computeUserId(doc) {
  const concat = `${doc.socialMediaId || ''}|${doc.phoneNumber || ''}|${doc.appleId || ''}`;
  // stoi-like: sum of char codes
  let sum = 0;
  for (let i = 0; i < concat.length; i++) sum += concat.charCodeAt(i);
  // Simple reversible obfuscation (XOR + base36) - placeholder for encryption
  const mixed = (sum ^ 0x5a5a5a5) >>> 0;
  return mixed.toString(36);
}

userSchema.pre('save', function(next) {
  if (!this.userId) {
    this.userId = computeUserId(this);
  }
  next();
});

// Contract Schema - Simplified contract structure
const contractSchema = new mongoose.Schema({
  contractId: { type: String, unique: true, required: true }, // Unique contract identifier
  partyAId: { type: String, required: true }, // Social media ID
  partyBId: { type: String, required: false, default: null }, // Social media ID (optional until party B signs)
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['inactive', 'active', 'revoked', 'invalid'], 
    default: 'inactive' 
  },
  // Lawyer access control
  authorizedLawyers: { type: [String], default: [] }, // list of lawyer user IDs allowed to view/annotate
  authorizedBy: { type: String, default: null }, // user ID of the party who authorized last
  // Direct annotation text stored on the contract
  annotation: { type: String, default: '' }
});

// Create and export models
const User = mongoose.model('User', userSchema);
const Contract = mongoose.model('Contract', contractSchema);

module.exports = {
  User,
  Contract
};
