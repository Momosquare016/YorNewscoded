const db = require('../db');
const { generateKey } = require('../utils/apiKeyCrypto');

async function resolveUserId(firebaseUid) {
  const r = await db.query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid]);
  return r.rows[0]?.id ?? null;
}

// POST /api/keys — create a new API key. Plaintext is only returned once here.
async function createApiKey(req, res) {
  try {
    const { uid } = req.user;
    const name = String(req.body?.name ?? '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (name.length > 100) return res.status(400).json({ error: 'name too long (max 100)' });

    const userId = await resolveUserId(uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const { key, prefix, hash } = generateKey();

    const result = await db.query(
      `INSERT INTO api_keys (user_id, name, key_prefix, key_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, key_prefix, created_at`,
      [userId, name, prefix, hash]
    );

    res.status(201).json({
      message: 'API key created. Copy it now — it will not be shown again.',
      key, // plaintext, shown once
      record: result.rows[0],
    });
  } catch (error) {
    console.error('createApiKey error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
}

// GET /api/keys — list current user's keys (no plaintext).
async function listApiKeys(req, res) {
  try {
    const { uid } = req.user;
    const userId = await resolveUserId(uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const result = await db.query(
      `SELECT id, name, key_prefix, last_used_at, revoked_at, created_at
         FROM api_keys
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ keys: result.rows });
  } catch (error) {
    console.error('listApiKeys error:', error);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
}

// DELETE /api/keys/:id — revoke a key (soft-delete via revoked_at).
async function revokeApiKey(req, res) {
  try {
    const { uid } = req.user;
    const userId = await resolveUserId(uid);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const { id } = req.params;

    const result = await db.query(
      `UPDATE api_keys
          SET revoked_at = NOW()
        WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
        RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Key not found or already revoked' });
    }

    res.json({ message: 'API key revoked', id: result.rows[0].id });
  } catch (error) {
    console.error('revokeApiKey error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
}

module.exports = { createApiKey, listApiKeys, revokeApiKey };
