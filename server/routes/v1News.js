const express = require('express');
const router = express.Router();
const { getNews } = require('../controllers/newsController');
const { authenticateApiKey } = require('../middleware/apiKeyAuth');

// External, API-key-authenticated feed.
// Delegates to the same getNews controller used by the web app — the auth
// middleware populates req.user with { id, uid, email } in the same shape.
router.get('/news', authenticateApiKey, getNews);

module.exports = router;
