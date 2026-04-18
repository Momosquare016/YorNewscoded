const db = require('../db');
const { hashKey, looksLikeKey } = require('../utils/apiKeyCrypto');

// Authenticates external requests (e.g. Matteca) via Bearer <yorn_...>.
// On success attaches req.user = { id, uid, email } and req.apiKey = { id }.
async function authenticateApiKey(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token || !looksLikeKey(token)) {
      return res.status(401).json({ error: 'Missing or malformed API key' });
    }

    const keyHash = hashKey(token);

    const result = await db.query(
      `SELECT k.id AS key_id, k.revoked_at, u.id AS user_id, u.firebase_uid, u.email
         FROM api_keys k
         JOIN users u ON u.id = k.user_id
        WHERE k.key_hash = $1
        LIMIT 1`,
      [keyHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const row = result.rows[0];
    if (row.revoked_at) {
      return res.status(401).json({ error: 'API key has been revoked' });
    }

    // fire-and-forget last_used_at update
    db.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [row.key_id]).catch(
      (err) => console.error('last_used_at update failed:', err.message)
    );

    req.user = {
      id: row.user_id,
      uid: row.firebase_uid,
      email: row.email,
    };
    req.apiKey = { id: row.key_id };
    next();
  } catch (error) {
    console.error('API key auth failed:', error);
    return res.status(500).json({ error: 'Auth check failed' });
  }
}

module.exports = { authenticateApiKey };
