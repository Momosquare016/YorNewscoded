const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} = require('../controllers/apiKeysController');

// All key-management routes require a Firebase session.
router.use(authenticateToken);

router.get('/', listApiKeys);
router.post('/', createApiKey);
router.delete('/:id', revokeApiKey);

module.exports = router;
