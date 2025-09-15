// routes/api.js - Main API routes
const express = require('express');
const authRoutes = require('./auth');
const consentContractRoutes = require('./consentContracts');

const router = express.Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/consent-contracts', consentContractRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Sex Consent Contract Management System'
  });
});

module.exports = router;
