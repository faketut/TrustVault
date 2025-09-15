# Database Setup Guide

## Overview

This guide explains how to set up and initialize the database for the Sex Consent Contract Management System. The system uses MongoDB and automatically creates empty collections when needed.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/sex-consent-system
MONGODB_DB_NAME=sex-consent-system
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
```

### 3. Initialize Database
```bash
# Initialize database with collections and sample data
npm run init-db

# Or check database health
npm run check-db
```

### 4. Start the Server
```bash
npm start
```

## Database Collections

The system automatically creates these collections:

### 1. **Users Collection** (`users`)
Stores user information for all authentication methods:
- **WeChat users**: `socialId`, `platform: 'wechat'`, `wechatData`
- **Apple users**: `appleId`, `platform: 'apple'`, `appleData`
- **Phone users**: `phoneNumber`, `platform: 'phone'`, `phoneVerification`
- **Other users**: `socialId`, `platform: 'other'`

**Indexes:**
- `{ socialId: 1, platform: 1 }`
- `{ phoneNumber: 1 }`
- `{ appleId: 1 }`
- `{ createdAt: 1 }`

### 2. **Contracts Collection** (`contracts`)
Stores consent contracts between parties:
- `contractId` (unique)
- `partyAId`, `partyBId` (user identifiers)
- `startDateTime`, `endDateTime`
- `status` (draft, pending, active, revoked, invalid)
- `initialConsent`, `ongoingConsent`

**Indexes:**
- `{ contractId: 1 }` (unique)
- `{ partyAId: 1 }`
- `{ partyBId: 1 }`
- `{ status: 1 }`
- `{ createdAt: 1 }`

### 3. **Annotations Collection** (`annotations`)
Stores lawyer annotations on contracts:
- `contractId` (reference to contract)
- `lawyerId` (reference to user)
- `note` (annotation text)
- `severity` (info, warning, critical)
- `timestamp`

**Indexes:**
- `{ contractId: 1 }`
- `{ lawyerId: 1 }`
- `{ timestamp: 1 }`

## Automatic Collection Creation

The system automatically creates empty collections when:

1. **Server starts** - Collections are created if they don't exist
2. **First API call** - Collections are created when needed
3. **Manual initialization** - Run `npm run init-db`

## Sample Data

The initialization script creates sample data for testing:

### Sample Users
- **WeChat User**: `sample_wechat_user` (platform: wechat)
- **Phone User**: `+1234567890` (platform: phone)
- **Apple User**: `sample_apple_id` (platform: apple)
- **Admin User**: `admin_user` (platform: other, role: admin)

### Sample Contracts
- **Active Contract**: Between WeChat and Phone users
- **Draft Contract**: Between Apple and Admin users

### Sample Annotations
- **Info Annotation**: General contract information
- **Warning Annotation**: Contract review required

## Database Scripts

### Initialize Database
```bash
npm run init-db
```
Creates collections, indexes, and sample data.

### Check Database Health
```bash
npm run check-db
```
Verifies collections exist and shows data counts.

### Manual Database Operations
```javascript
// Connect to database
const mongoose = require('mongoose');
const { User, Contract, Annotation } = require('./models');

// Create user
const user = new User({
  socialId: 'test_user',
  platform: 'other',
  nickname: 'Test User',
  role: 'user'
});
await user.save();

// Create contract
const contract = new Contract({
  contractId: 'test_contract',
  partyAId: 'test_user',
  partyBId: 'test_user_2',
  startDateTime: new Date(),
  endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  status: 'draft'
});
await contract.save();
```

## Troubleshooting

### Common Issues

#### 1. **"Cannot find module" errors**
```bash
# Install dependencies
npm install
```

#### 2. **MongoDB connection failed**
- Check if MongoDB is running
- Verify `MONGODB_URI` in `.env` file
- Check network connectivity

#### 3. **Collections not created**
```bash
# Manually initialize database
npm run init-db
```

#### 4. **Permission errors**
- Check MongoDB user permissions
- Ensure database user has read/write access

### Database Health Check

Run the health check to diagnose issues:
```bash
npm run check-db
```

This will show:
- ✅ Collection existence
- 📊 Document counts
- 🔍 Index information
- ❌ Any errors

### Reset Database

To completely reset the database:
```bash
# Drop all collections (be careful!)
mongo sex-consent-system --eval "db.dropDatabase()"

# Reinitialize
npm run init-db
```

## Production Setup

### 1. **MongoDB Atlas** (Recommended)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sex-consent-system
```

### 2. **Local MongoDB**
```env
MONGODB_URI=mongodb://localhost:27017/sex-consent-system
```

### 3. **Docker MongoDB**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Security Considerations

### 1. **Environment Variables**
- Never commit `.env` files
- Use strong JWT secrets
- Rotate secrets regularly

### 2. **Database Access**
- Use MongoDB authentication
- Limit network access
- Enable SSL/TLS

### 3. **Data Protection**
- Encrypt sensitive data
- Regular backups
- Access logging

## Monitoring

### 1. **Database Metrics**
- Collection sizes
- Index usage
- Query performance

### 2. **Application Metrics**
- User registrations
- Contract creations
- API response times

### 3. **Health Checks**
```bash
# Check database health
npm run check-db

# Check API health
curl http://localhost:3000/api/health
```

## Backup and Recovery

### 1. **Backup Database**
```bash
mongodump --uri="mongodb://localhost:27017/sex-consent-system" --out=backup/
```

### 2. **Restore Database**
```bash
mongorestore --uri="mongodb://localhost:27017/sex-consent-system" backup/sex-consent-system/
```

### 3. **Automated Backups**
Set up cron jobs for regular backups:
```bash
# Daily backup at 2 AM
0 2 * * * mongodump --uri="mongodb://localhost:27017/sex-consent-system" --out=/backups/$(date +\%Y\%m\%d)/
```

## Support

For database issues:

1. **Check logs**: Server console output
2. **Run health check**: `npm run check-db`
3. **Verify environment**: Check `.env` file
4. **Test connection**: Use MongoDB Compass or CLI

The database system is designed to be self-initializing and should work out of the box with proper configuration!
