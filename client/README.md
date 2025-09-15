# Sex Consent Contract Management System - Frontend

This is the React frontend application for the Sex Consent Contract Management System.

## Features

- **User Authentication**: Login, registration, and profile management
- **Contract Management**: Create, sign, and manage consent contracts
- **QR Code Integration**: Generate and scan QR codes for contract signing
- **Privacy Controls**: User privacy settings and data protection
- **Mobile Responsive**: Works on desktop and mobile devices

## Technology Stack

- **React 18** with TypeScript
- **Material-UI** for UI components
- **React Router** for navigation
- **Axios** for API communication
- **QR Code React** for QR code generation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. The app will open at [http://localhost:3001](http://localhost:3001)

## Environment Variables

Create a `.env` file in the client directory:

```env
REACT_APP_API_URL=http://localhost:3000/api
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Project Structure

```
client/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── utils/         # Utility functions and types
│   ├── App.tsx        # Main app component
│   ├── index.tsx      # Entry point
│   └── index.css      # Global styles
└── package.json
```

## Development Notes

- The frontend communicates with the backend API running on port 3000
- Authentication is handled via JWT tokens stored in localStorage
- All API calls are made through the centralized `api.ts` service
- TypeScript types are defined in `utils/types.ts`
