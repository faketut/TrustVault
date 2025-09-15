# Models vs Types Consistency Check

## ✅ Field Name Consistency

### User Model (models/index.js) vs User Interface (types.ts)

| Field | Model | TypeScript | Status |
|-------|-------|------------|--------|
| Primary ID | `id` (MongoDB auto) | `id: string` | ✅ |
| Social Media ID | `socialMediaId: String` | `socialMediaId?: string` | ✅ |
| Phone Number | `phoneNumber: String` | `phoneNumber?: string` | ✅ |
| Apple ID | `appleId: String` | `appleId?: string` | ✅ |
| Platform | `platform: { type: String, enum: [...] }` | `platform: 'wechat' \| ...` | ✅ |
| Nickname | `nickname: { type: String, required: true }` | `nickname: string` | ✅ |
| Avatar | `avatar: String` | `avatar?: string` | ✅ |
| Role | `role: { type: String, enum: [...] }` | `role: 'user' \| 'admin' \| 'lawyer'` | ✅ |
| Sign Count | `signCount: { type: Number, default: 0 }` | `signCount?: number` | ✅ |
| Revoke Count | `revokeCount: { type: Number, default: 0 }` | `revokeCount?: number` | ✅ |

### Phone Verification

| Field | Model | TypeScript | Status |
|-------|-------|------------|--------|
| isVerified | `isVerified: { type: Boolean, default: false }` | `isVerified: boolean` | ✅ |
| verificationCode | `verificationCode: String` | `verificationCode?: string` | ✅ |
| codeExpiresAt | `codeExpiresAt: Date` | `codeExpiresAt?: string` | ✅ |
| lastSentAt | `lastSentAt: Date` | `lastSentAt?: string` | ✅ |
| attempts | `attempts: { type: Number, default: 0 }` | `attempts: number` | ✅ |

### Apple Data

| Field | Model | TypeScript | Status |
|-------|-------|------------|--------|
| identityToken | `identityToken: String` | `identityToken?: string` | ✅ |
| authorizationCode | `authorizationCode: String` | `authorizationCode?: string` | ✅ |
| user.id | `user.id: String` | `user.id: string` | ✅ |
| user.email | `user.email: String` | `user.email?: string` | ✅ |
| user.name.firstName | `user.name.firstName: String` | `user.name.firstName?: string` | ✅ |
| user.name.lastName | `user.name.lastName: String` | `user.name.lastName?: string` | ✅ |

### WeChat Data

| Field | Model | TypeScript | Status |
|-------|-------|------------|--------|
| unionid | `unionid: String` | `unionid?: string` | ✅ |
| sex | `sex: Number` | `sex?: number` | ✅ |
| province | `province: String` | `province?: string` | ✅ |
| city | `city: String` | `city?: string` | ✅ |
| country | `country: String` | `country?: string` | ✅ |
| access_token | `access_token: String` | `access_token?: string` | ✅ |
| refresh_token | `refresh_token: String` | `refresh_token?: string` | ✅ |
| expires_at | `expires_at: Date` | `expires_at?: string` | ✅ |

## ✅ Backend Route Consistency

### Auth Routes (routes/auth.js)

| Route | Field Used | Model Field | Status |
|-------|------------|-------------|--------|
| WeChat Callback | `socialMediaId` | `socialMediaId` | ✅ |
| Phone Send Code | `phoneNumber` | `phoneNumber` | ✅ |
| Phone Verify | `phoneNumber` | `phoneNumber` | ✅ |
| Apple Login | `appleId` | `appleId` | ✅ |
| Social Login | `socialMediaId` | `socialMediaId` | ✅ |

## ✅ Frontend Component Consistency

### Components Using User Data

| Component | Field Used | TypeScript Field | Status |
|-----------|------------|------------------|--------|
| Dashboard | `user.signCount` | `signCount?: number` | ✅ |
| Dashboard | `user.revokeCount` | `revokeCount?: number` | ✅ |
| App | `getUserDisplayId(user)` | `socialMediaId \| phoneNumber \| appleId \| id` | ✅ |
| ContractCreator | `getUserDisplayId(user)` | `socialMediaId \| phoneNumber \| appleId \| id` | ✅ |

## ✅ Helper Functions

### getUserDisplayId()
```typescript
// Priority order: socialMediaId, phoneNumber, appleId, id
return user.socialMediaId || user.phoneNumber || user.appleId || user.id;
```
✅ **Consistent with model fields**

### getUserDisplayName()
```typescript
return user.nickname || getUserDisplayId(user);
```
✅ **Uses nickname field from both model and types**

## 🎯 Summary

**All field names are now consistent between:**
- ✅ MongoDB models (models/index.js)
- ✅ TypeScript interfaces (types.ts)
- ✅ Backend routes (routes/auth.js)
- ✅ Frontend components
- ✅ Helper functions

**Key Changes Made:**
1. ✅ Changed `socialId` → `socialMediaId` in models and routes
2. ✅ Added missing `nickname`, `avatar`, `platform` fields to models
3. ✅ Changed `activeNumber` → `signCount` in models
4. ✅ Changed `revokedNumber` → `revokeCount` in models
5. ✅ Updated all auth routes to use correct field names
6. ✅ Verified frontend components use correct field names

**Result: 100% Consistency Achieved! 🎉**
