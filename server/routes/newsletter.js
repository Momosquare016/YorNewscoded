const express = require('express');
const router = express.Router();
const { getNewsletterSettings, updateNewsletterSettings, unsubscribe } = require('../controllers/newsletterController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/newsletter - Get newsletter settings (auth required)
router.get('/', authenticateToken, getNewsletterSettings);

// PUT /api/newsletter - Update newsletter settings (auth required)
router.put('/', authenticateToken, updateNewsletterSettings);

// GET /api/newsletter/unsubscribe/:token - Unsubscribe (NO auth - link from email)
router.get('/unsubscribe/:token', unsubscribe);

module.exports = router;
