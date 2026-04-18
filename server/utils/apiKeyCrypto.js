const crypto = require('crypto');

const KEY_PREFIX = 'yorn_';
const TOKEN_BYTES = 24; // 48 hex chars

function generateKey() {
  const raw = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const key = `${KEY_PREFIX}${raw}`;
  return {
    key,
    prefix: key.slice(0, 12),
    hash: hashKey(key),
  };
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function looksLikeKey(value) {
  return typeof value === 'string' && value.startsWith(KEY_PREFIX) && value.length >= 16;
}

module.exports = { generateKey, hashKey, looksLikeKey, KEY_PREFIX };
