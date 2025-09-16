// routes/consentContracts.js - Contract management routes
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Contract, User } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// Small async wrapper to reduce try/catch boilerplate
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Helper: the ONLY identifier is the database id string
function getUserId(user) {
  return user?._id?.toString?.() || '';
}


// Create contract
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
    const { startDateTime, endDateTime } = req.body;
    
    // Validate required fields
    if (!startDateTime || !endDateTime) {
      return res.status(400).json({ error: 'Missing required fields: startDateTime and endDateTime are required' });
    }
    
    // Generate unique contract ID
    const contractId = uuidv4();
    
    const contract = new Contract({
      contractId,
      partyAId: getUserId(req.user), // Always store Party A as user's DB id string
      partyBId: 'pending', // Will be set when party B signs the contract
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      status: 'inactive',
      updatedAt: new Date()
    });
    
    await contract.save();
    res.json(contract);
}));

// List contracts - users can only view contracts where they are Party A
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
    const uid = getUserId(req.user);
    const contracts = await Contract.find({
      $or: [
        { partyAId: uid },
        { partyBId: uid },
        { authorizedBy: uid }
      ]
    }).sort({ updatedAt: -1 });
    res.json(contracts);
}));

// Give consent
router.post('/:contractId/consent', authMiddleware, asyncHandler(async (req, res) => {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Allow Party A, existing Party B, or assign Party B if pending
    const uid = getUserId(req.user);
    contract.partyBId = uid; 
    contract.status = 'active';
    contract.updatedAt = new Date();
    await contract.save();
    
    res.json({ success: true, contract });
}));

// Revoke contract
router.post('/:contractId/revoke', authMiddleware, asyncHandler(async (req, res) => {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Check if user is a party to the contract
    const validPartyIds = [contract.partyAId, contract.partyBId];
    const uid = getUserId(req.user);
    if (!validPartyIds.includes(uid)) {
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
}));

// Delete contract 
router.delete('/:contractId', authMiddleware, asyncHandler(async (req, res) => {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Only allow deletion if contract is NOT active
    if (contract.status === 'active') {
      return res.status(400).json({ error: 'Active contracts cannot be deleted' });
    }

    const uid = getUserId(req.user);
    const canDelete = contract.partyAId === uid || contract.partyBId === uid || contract.authorizedBy === uid;
    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this contract' });
    }

    await Contract.deleteOne({ contractId: req.params.contractId });
    res.json({ success: true });
}));

// Bulk delete contracts
router.post('/bulk-delete', authMiddleware, asyncHandler(async (req, res) => {
    const { contractIds } = req.body || {};
    if (!Array.isArray(contractIds) || contractIds.length === 0) {
      return res.status(400).json({ error: 'contractIds must be a non-empty array' });
    }

    const uid = getUserId(req.user);
    const succeeded = [];
    const failed = [];

    for (const id of contractIds) {
      try {
        const contract = await Contract.findOne({ contractId: id });
        if (!contract) {
          failed.push({ id, error: 'not_found' });
          continue;
        }
        if (contract.status === 'active') {
          failed.push({ id, error: 'active_not_deletable' });
          continue;
        }
        const canDelete = contract.partyAId === uid || contract.partyBId === uid || contract.authorizedBy === uid;
        if (!canDelete) {
          failed.push({ id, error: 'forbidden' });
          continue;
        }
        await Contract.deleteOne({ contractId: id });
        succeeded.push(id);
      } catch (e) {
        failed.push({ id, error: 'server_error' });
      }
    }

    res.json({ succeeded, failed });
}));

// Authorize a lawyer to view/annotate 
router.post('/:contractId/authorize-lawyer', authMiddleware, asyncHandler(async (req, res) => {
    const { lawyerId } = req.body;
    if (!lawyerId) return res.status(400).json({ error: 'lawyerId is required' });

    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    const requesterId = getUserId(req.user);
    if (contract.partyAId !== requesterId && contract.partyBId !== requesterId) {
      return res.status(403).json({ error: 'Only Party A or Party B can authorize lawyers' });
    }

    contract.authorizedLawyers = Array.from(new Set([...(contract.authorizedLawyers || []), lawyerId]));
    contract.authorizedBy = requesterId;
    contract.updatedAt = new Date();
    await contract.save();
    res.json({ success: true, authorizedLawyers: contract.authorizedLawyers });
}));

// Add lawyer annotation - writes directly onto the contract and marks invalid
router.post('/:contractId/annotate', authMiddleware, requireRole(['lawyer']), asyncHandler(async (req, res) => {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    // Only assigned lawyers can annotate
    const uid = getUserId(req.user);
    if (!(contract.authorizedLawyers || []).includes(uid)) {
      return res.status(403).json({ error: 'Not authorized to annotate this contract' });
    }

    const { note } = req.body;
    // Persist annotation directly on the contract and invalidate it
    contract.annotation = note || '';
    contract.status = 'invalid';
    contract.updatedAt = new Date();
    await contract.save();
    
    res.json({ success: true, contract });
}));

// Get user's contracts
router.get('/my-contracts', authMiddleware, asyncHandler(async (req, res) => {
    const uid = getUserId(req.user);
    const contracts = await Contract.find({
      $or: [
        { partyAId: uid },
        { partyBId: uid },
        { authorizedBy: uid }
      ]
    }).sort({ updatedAt: -1 });
    res.json(contracts);
}));

// Get contract details
router.get('/:contractId', authMiddleware, asyncHandler(async (req, res) => {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Allow either party (A or B), admin, or assigned lawyer.
    // If Party B is not yet set (pending), allow any authenticated user to view.
    const isAdminOrLawyer = ['admin', 'lawyer'].includes(req.user.role);
    const uid = getUserId(req.user);
    const isParty = contract.partyAId === uid || contract.partyBId === uid;
    const isAssignedLawyer = (contract.authorizedLawyers || []).includes(uid);
    const partyBOpenToView = !contract.partyBId || contract.partyBId === 'pending';
    if (!isParty && !isAssignedLawyer && !isAdminOrLawyer && !partyBOpenToView) {
      return res.status(403).json({ error: 'Not authorized to view this contract' });
    }
    
    // Return contract only; annotations are stored directly on it
    res.json({ contract });
}));

// Check contract status
router.get('/:contractId/status', asyncHandler(async (req, res) => {
    const contract = await Contract.findOne({ contractId: req.params.contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    res.json({
      status: contract.status,
      canSign: contract.status !== 'active',
      message: getStatusMessage(contract.status)
    });
}));

// Helper function to get status message
function getStatusMessage(status) {
  switch (status) {
    case 'inactive':
      return 'Awaiting consent. A party can consent to activate this contract.';
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

// QR code endpoint removed: QR is generated client-side

module.exports = router;