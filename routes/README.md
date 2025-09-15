# API Routes Documentation

This directory contains all the API route modules for the Sex Consent Contract Management System.

## Route Structure

```
routes/
├── api.js              # Main API router that mounts all sub-routes
├── auth.js             # Authentication routes
├── consentContracts.js # Consent contract management routes
└── README.md           # This documentation
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `PUT /privacy` - Update user privacy status
- `GET /stats` - Get user statistics

### Consent Contracts (`/api/consent-contracts`)
- `POST /` - Create consent contract and generate QR code
- `POST /:id/sign` - Sign contract (supports anonymous signing)
- `POST /:id/revoke` - Revoke contract
- `POST /:id/annotate` - Add lawyer annotation (Lawyer only)
- `GET /my-contracts` - Get user's contracts
- `GET /:id/download` - Download contract (requires authentication)
- `GET /:id/status` - Check contract status (no auth required)

### Health Check (`/api/health`)
- `GET /` - System health check

## Usage

All routes are automatically mounted in the main `server.js` file. The API base URL is `/api` and all endpoints are prefixed accordingly.

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

Some endpoints support anonymous access:
- `POST /api/consent-contracts/:id/sign` - Anonymous contract signing
- `GET /api/consent-contracts/:id/status` - Check contract status

## Error Handling

All routes include proper error handling and return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
