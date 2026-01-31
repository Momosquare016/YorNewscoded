const db = require('../db');
const { parsePreferences } = require('../services/groq');
const { clearUserCache } = require('./newsController');

// GET user preferences
async function getPreferences(req, res) {
  try {
    const { uid } = req.user;

    const result = await db.query(
      'SELECT preferences FROM users WHERE firebase_uid = $1',
      [uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const preferences = result.rows[0].preferences;

    res.json({
      preferences: preferences ? JSON.parse(preferences) : null,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
}

// UPDATE user preferences with AI parsing
async function updatePreferences(req, res) {
  try {
    const { uid } = req.user;
    const { preferenceText } = req.body;

    if (!preferenceText) {
      return res.status(400).json({ error: 'preferenceText is required' });
    }

    console.log('Parsing preferences with Groq AI:', preferenceText);

    // Use Groq AI to parse natural language into structured format
    const parsedPreferences = await parsePreferences(preferenceText);

    console.log('Parsed preferences:', parsedPreferences);

    // Update database
    const result = await db.query(
      'UPDATE users SET preferences = $1 WHERE firebase_uid = $2 RETURNING preferences',
      [JSON.stringify(parsedPreferences), uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear news cache so new preferences take effect immediately
    clearUserCache(uid);

    res.json({
      message: 'Preferences updated successfully',
      preferences: JSON.parse(result.rows[0].preferences),
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
}

module.exports = {
  getPreferences,
  updatePreferences,
};