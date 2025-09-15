// server.js - Node.js/Express API for Sex Consent Contract Management System
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import configurations and middleware
const connectDB = require('./config/database');
const { errorHandler, handleUnhandledRejection } = require('./middleware/errorHandler');

// Import routes
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 3000;

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
    message: 'Sex Consent Contract Management System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      consentContracts: '/api/consent-contracts',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle unhandled promise rejections
handleUnhandledRejection();

// Start server
app.listen(port, () => {
  console.log(`Sex Consent Contract Management System`);
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB Database: ${process.env.MONGODB_DB_NAME || 'sex-consent-system'}`);
  console.log(`API Documentation: http://localhost:${port}/api/health`);
});