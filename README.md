# TrustVault

> **⚠️ Disclaimer**: This system is for educational and research purposes only. Please consult legal professionals and ensure compliance with local laws before any practical application.

## 🚀 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd TrustVault
npm install

# Configure environment
cp env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start backend
npm start

# Start frontend (new terminal)
cd client
npm install
npm start
```

## 🏗️ Architecture

**Frontend**: React 18 + TypeScript + Material-UI  
**Backend**: Node.js + Express + MongoDB  
**Auth**: JWT + Multi-platform login (WeChat, Apple, Phone, Social)

```
Frontend (React) ←→ Backend (Express) ←→ Database (MongoDB)
     ↓                    ↓
  QR Scanner         RESTful API
  Contract UI        JWT Auth
  Privacy Mgmt       SMS Service
```

## ✨ Key Features

### 🔐 Multi-Platform Authentication
- **WeChat Login**: OAuth2.0 integration
- **Apple Sign-In**: Privacy-focused authentication  
- **Phone Login**: SMS verification with rate limiting
- **Social Login**: QQ, Weibo, Google, Facebook

### 📋 Contract Management
- Create custom consent forms
- QR code sharing for anonymous signing
- Dual-party asynchronous signing
- Contract status tracking
- Revocation support

### 🛡️ Privacy & Security
- Encrypted data storage (bcrypt)
- JWT token authentication
- Privacy state controls
- Access logging
- Legal annotation support

## 🔄 Workflow

1. **Admin Setup**: Register → Create form templates
2. **Contract Creation**: User A creates contract → Invites User B
3. **QR Signing**: Generate QR code → User B scans and signs
4. **Dual Signing**: Both parties sign via mobile/web
5. **Contract Active**: System records timestamps and IPs
6. **Management**: Revoke, annotate, or query contracts

## 📁 Project Structure

```
-consent-app/
├─ server.js              # Backend API server
├─ client/                # React frontend
│  ├─ src/components/     # React components
│  ├─ src/pages/         # Page components
│  └─ src/services/      # API services
├─ routes/               # API routes
├─ models/               # Database models
├─ services/             # Business logic
└─ middleware/           # Auth & error handling
```

## 🔧 Environment Setup

```env
# Core
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost/TrustVault
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=http://localhost:3001

# WeChat
WECHAT_APPID=your-wechat-appid
WECHAT_APPSECRET=your-wechat-appsecret

# Apple
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id

# SMS (choose one)
TWILIO_ACCOUNT_SID=your-twilio-sid
AWS_ACCESS_KEY_ID=your-aws-key
SMS_PROVIDER=twilio  # or aws, sendgrid, etc.
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/wechat/callback` - WeChat OAuth callback
- `POST /api/auth/apple/login` - Apple Sign-In
- `POST /api/auth/phone/send-code` - Send SMS code
- `POST /api/auth/phone/verify` - Verify SMS code

### Contracts
- `POST /api/consent-contracts` - Create contract
- `POST /api/consent-contracts/:id/sign` - Sign contract
- `GET /api/consent-contracts/:id/status` - Check status
- `POST /api/consent-contracts/:id/revoke` - Revoke contract
- `GET /api/consent-contracts/my-contracts` - List user contracts

## 🛡️ Security Features

- **Data Protection**: bcrypt password hashing, JWT tokens
- **Privacy Controls**: User privacy state management
- **Access Logging**: Complete audit trail
- **Legal Compliance**: Contract revocation, lawyer annotations
- **Rate Limiting**: SMS verification protection

## 🚀 Development

```bash
# Development mode
npm run dev

# Database initialization
node scripts/init-database.js

# Run tests
npm test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure code follows project standards
5. Submit a pull request

---

**⚠️ Legal Notice**: This system is for educational purposes only. Always consult legal professionals and ensure compliance with applicable laws before any real-world implementation.
