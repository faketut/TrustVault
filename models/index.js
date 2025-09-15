// models/index.js - Database models for Sex Consent Contract Management System
const mongoose = require('mongoose');

// User Schema - Multi-platform authentication
const userSchema = new mongoose.Schema({
  // Primary identifier - can be socialMediaId, phoneNumber, or appleId
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

// Contract Schema - Simplified contract structure
const contractSchema = new mongoose.Schema({
  contractId: { type: String, unique: true, required: true }, // Unique contract identifier
  partyAId: { type: String, required: true }, // Social media ID
  partyBId: { type: String, required: true }, // Social media ID
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['inactive', 'active', 'revoked'], 
    default: 'inactive' 
  },
});

// Annotation Schema - Lawyer annotations
const annotationSchema = new mongoose.Schema({
  contractId: { type: String, required: true },
  lawyerId: { type: String, required: true },
  note: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['info', 'warning', 'critical'], 
    default: 'info' 
  },
  timestamp: { type: Date, default: Date.now }
});

// Create and export models
const User = mongoose.model('User', userSchema);
const Contract = mongoose.model('Contract', contractSchema);
const Annotation = mongoose.model('Annotation', annotationSchema);

module.exports = {
  User,
  Contract,
  Annotation
};
