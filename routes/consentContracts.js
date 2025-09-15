// routes/consentContracts.js - Contract management routes
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Contract, User, Annotation } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Create contract
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { partyAId, startDateTime, endDateTime } = req.body;
    
    // Validate required fields
    if (!startDateTime || !endDateTime) {
      return res.status(400).json({ error: 'Missing required fields: startDateTime and endDateTime are required' });
    }
    
    // Generate unique contract ID
    const contractId = uuidv4();
    
    const contract = new Contract({
      contractId,
      partyAId: partyAId || req.user.socialMediaId, // Use provided partyAId or fallback to user's socialMediaId
      partyBId: 'pending', // Will be set when party B signs the contract
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      status: 'inactive'
    });
    
    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

// Give initial consent
router.post('/:contractId/initial-consent', authMiddleware, async (req, res) => {
  try {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Check if user is a party to the contract
    const validPartyIds = [contract.partyAId].filter(id => id !== 'pending');
    if (!validPartyIds.includes(req.user.socialMediaId)) {
      return res.status(403).json({ error: 'Not a party to this contract' });
    }
    
    // Update initial consent - only party A can give initial consent
    if (contract.partyAId === req.user.socialMediaId) {
      contract.initialConsent = {
        partyId: req.user.socialMediaId,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        socialPlatform: req.user.platform
      };
    } else {
      // If this is party B, update partyBId and give initial consent
      contract.partyBId = req.user.socialMediaId;
      contract.initialConsent = {
        partyId: req.user.socialMediaId,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        socialPlatform: req.user.platform
      };
    }
    
    // Check if both parties have given initial consent
    if (contract.initialConsent.partyId && contract.ongoingConsent.partyId) {
      contract.status = 'pending'; // Ready for ongoing consent
    }
    
    contract.updatedAt = new Date();
    await contract.save();
    
    res.json({ success: true, contract });
  } catch (error) {
    res.status(500).json({ error: 'Failed to give initial consent' });
  }
});

// Give ongoing consent
router.post('/:contractId/ongoing-consent', authMiddleware, async (req, res) => {
  try {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Check if user is a party to the contract
    const validPartyIds = [contract.partyAId, contract.partyBId].filter(id => id !== 'pending');
    if (!validPartyIds.includes(req.user.socialMediaId)) {
      return res.status(403).json({ error: 'Not a party to this contract' });
    }
    
    // Check if contract is in pending status (both initial consents given)
    if (contract.status !== 'pending') {
      return res.status(400).json({ error: 'Contract not ready for ongoing consent' });
    }
    
    // Update ongoing consent
    if (contract.partyAId === req.user.socialMediaId) {
      contract.ongoingConsent = {
        partyId: req.user.socialMediaId,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        socialPlatform: req.user.platform
      };
    } else {
      // Party B giving ongoing consent
      contract.ongoingConsent = {
        partyId: req.user.socialMediaId,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        socialPlatform: req.user.platform
      };
    }
    
    // Check if both parties have given ongoing consent
    if (contract.ongoingConsent.partyId && contract.ongoingConsent.partyId !== contract.initialConsent.partyId) {
      contract.status = 'active';
    }
    
    contract.updatedAt = new Date();
    await contract.save();
    
    res.json({ success: true, contract });
  } catch (error) {
    res.status(500).json({ error: 'Failed to give ongoing consent' });
  }
});

// Revoke contract
router.post('/:contractId/revoke', authMiddleware, async (req, res) => {
  try {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Check if user is a party to the contract
    const validPartyIds = [contract.partyAId, contract.partyBId].filter(id => id !== 'pending');
    if (!validPartyIds.includes(req.user.socialMediaId)) {
      return res.status(403).json({ error: 'Not a party to this contract' });
    }
    
    // Only allow revocation if contract is active
    if (contract.status !== 'active') {
      return res.status(400).json({ error: 'Only active contracts can be revoked' });
    }
    
    contract.status = 'revoked';
    contract.updatedAt = new Date();
    await contract.save();
    
    res.json({ success: true, contract });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke contract' });
  }
});

// Add lawyer annotation
router.post('/:contractId/annotate', authMiddleware, requireRole(['lawyer']), async (req, res) => {
  try {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    const { note, severity = 'info' } = req.body;
    
    const annotation = new Annotation({
      contractId: contract.contractId,
      lawyerId: req.user.socialMediaId,
      note,
      severity
    });
    
    await annotation.save();
    
    // If critical annotation, mark contract as invalid
    if (severity === 'critical') {
      contract.status = 'invalid';
      contract.updatedAt = new Date();
      await contract.save();
    }
    
    res.json({ success: true, annotation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add annotation' });
  }
});

// Get user's contracts
router.get('/my-contracts', authMiddleware, async (req, res) => {
  try {
    const contracts = await Contract.find({
      $or: [
        { partyAId: req.user.socialMediaId }, 
        { partyBId: req.user.socialMediaId },
        { partyBId: 'pending', partyAId: req.user.socialMediaId } // Include contracts where user is party A and party B is pending
      ]
    }).sort({ createdAt: -1 });
    
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Get contract details
router.get('/:contractId', authMiddleware, async (req, res) => {
  try {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Check if user is a party to the contract or has admin/lawyer role
    const validPartyIds = [contract.partyAId, contract.partyBId].filter(id => id !== 'pending');
    const isParty = validPartyIds.includes(req.user.socialMediaId);
    const isAdminOrLawyer = ['admin', 'lawyer'].includes(req.user.role);
    
    if (!isParty && !isAdminOrLawyer) {
      return res.status(403).json({ error: 'Not authorized to view this contract' });
    }
    
    // Get annotations for this contract
    const annotations = await Annotation.find({ contractId: contract.contractId });
    
    res.json({ contract, annotations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// Check contract status
router.get('/:contractId/status', async (req, res) => {
  try {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    const signaturesCount = (contract.initialConsent.partyId ? 1 : 0) + 
                           (contract.ongoingConsent.partyId ? 1 : 0);
    
    res.json({
      status: contract.status,
      canSign: contract.status === 'pending' || contract.status === 'draft',
      message: getStatusMessage(contract.status),
      signaturesCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contract status' });
  }
});

// Helper function to get status message
function getStatusMessage(status) {
  switch (status) {
    case 'draft':
      return 'Contract is in draft. Both parties need to give initial consent.';
    case 'pending':
      return 'Initial consent given. Both parties need to give ongoing consent.';
    case 'active':
      return 'Contract is active and legally binding.';
    case 'revoked':
      return 'Contract has been revoked by one of the parties.';
    case 'invalid':
      return 'Contract has been marked as invalid by legal review.';
    default:
      return 'Unknown contract status.';
  }
}

module.exports = router;
