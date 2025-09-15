# Sample Data Documentation

## ✅ **Updated Collection Initialization with Comprehensive Sample Data**

The backend system now includes comprehensive sample data that covers all authentication methods and user roles.

### 📊 **Sample Users Created**

When the database is initialized (empty collections), the system creates the following sample users:

#### **1. Basic User**
```javascript
{
  socialMediaId: 'sample_user',
  platform: 'other',
  nickname: 'Sample User',
  role: 'user'
}
```

#### **2. WeChat User**
```javascript
{
  socialMediaId: 'sample_wechat_user',
  platform: 'wechat',
  nickname: 'WeChat User',
  role: 'user',
  wechatData: {
    unionid: 'sample_unionid',
    sex: 1,
    province: 'Beijing',
    city: 'Beijing',
    country: 'China',
    access_token: 'mock_wechat_access_token',
    refresh_token: 'mock_wechat_refresh_token',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
}
```

#### **3. Phone User**
```javascript
{
  phoneNumber: '+1234567890',
  platform: 'phone',
  nickname: 'Phone User',
  role: 'user',
  phoneVerification: {
    isVerified: true,
    attempts: 0
  }
}
```

#### **4. Apple ID User** 🍎
```javascript
{
  appleId: 'sample_apple_id_12345',
  platform: 'apple',
  nickname: 'Apple User',
  role: 'user',
  appleData: {
    identityToken: 'mock_identity_token_sample',
    authorizationCode: 'mock_auth_code_sample',
    user: {
      id: 'sample_apple_id_12345',
      email: 'sample@privaterelay.appleid.com',
      name: {
        firstName: 'Apple',
        lastName: 'User'
      }
    }
  }
}
```

#### **5. Admin User**
```javascript
{
  socialMediaId: 'admin_user',
  platform: 'other',
  nickname: 'Admin User',
  role: 'admin'
}
```

#### **6. Lawyer User** (in init-database.js)
```javascript
{
  socialMediaId: 'lawyer_user',
  platform: 'other',
  nickname: 'Lawyer User',
  role: 'lawyer'
}
```

### 🔧 **Apple ID User Features**

The Apple ID user includes comprehensive mock data:

#### **Authentication Data**
- **Apple ID**: `sample_apple_id_12345`
- **Identity Token**: `mock_identity_token_sample`
- **Authorization Code**: `mock_auth_code_sample`

#### **User Information**
- **Email**: `sample@privaterelay.appleid.com` (Apple's privacy relay email)
- **Name**: Apple User (firstName: Apple, lastName: User)
- **Platform**: `apple`

#### **Data Structure**
The Apple user follows the complete `appleData` schema:
```javascript
appleData: {
  identityToken: String,        // JWT token from Apple
  authorizationCode: String,    // Authorization code from Apple
  user: {
    id: String,                 // Apple user ID
    email: String,              // User's email (may be private relay)
    name: {
      firstName: String,        // User's first name
      lastName: String          // User's last name
    }
  }
}
```

### 📋 **Sample Contracts**

The system also creates sample contracts:

#### **Contract 1**
```javascript
{
  contractId: 'sample_contract_1',
  partyAId: 'sample_wechat_user',
  partyBId: 'phone_user',
  startDateTime: new Date(),
  endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  status: 'active'
}
```

#### **Contract 2**
```javascript
{
  contractId: 'sample_contract_2',
  partyAId: 'apple_user',
  partyBId: 'admin_user',
  startDateTime: new Date(),
  endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  status: 'inactive'
}
```

### 📝 **Sample Annotations**

Lawyer annotations are also created:

```javascript
{
  contractId: 'sample_contract_1',
  lawyerId: 'admin_user',
  note: 'This is a sample contract for testing purposes.',
  severity: 'info',
  timestamp: new Date()
}
```

### 🚀 **How to Use Sample Data**

#### **1. Automatic Initialization**
Sample data is automatically created when:
- Starting the server (`npm start`)
- Running database initialization (`npm run init-db`)

#### **2. Manual Testing**
You can test with the sample Apple user:
```javascript
// Login with Apple ID
const appleUser = await User.findOne({ 
  appleId: 'sample_apple_id_12345', 
  platform: 'apple' 
});
```

#### **3. API Testing**
Use the sample data for API testing:
```bash
# Test Apple login endpoint
curl -X POST http://localhost:3000/api/auth/apple/login \
  -H "Content-Type: application/json" \
  -d '{
    "authorizationCode": "mock_auth_code_sample",
    "identityToken": "mock_identity_token_sample",
    "user": {
      "id": "sample_apple_id_12345",
      "email": "sample@privaterelay.appleid.com",
      "name": {
        "firstName": "Apple",
        "lastName": "User"
      }
    }
  }'
```

### 🔍 **Verification Commands**

```bash
# Check if sample data exists
npm run check-db

# Verify startup process includes Apple user
npm run verify-startup

# Initialize database with sample data
npm run init-db
```

### 📊 **Database Statistics After Initialization**

```
📈 Database statistics:
  👤 Users: 5-6 (depending on script)
  📄 Contracts: 2
  📝 Annotations: 2
```

### 🎯 **Benefits of Comprehensive Sample Data**

1. **✅ Complete Testing**: All authentication methods covered
2. **✅ Realistic Data**: Mock data follows real Apple ID structure
3. **✅ Development Ready**: Immediate testing without manual setup
4. **✅ Schema Validation**: All data uses proper Mongoose validation
5. **✅ Role Coverage**: Users, admins, and lawyers included
6. **✅ Platform Coverage**: WeChat, Apple, Phone, and Social platforms

The system now provides comprehensive sample data that includes a fully-featured Apple ID user with all the necessary mock data for testing! 🍎✨
