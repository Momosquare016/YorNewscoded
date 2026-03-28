const db = require('../db');

// REGISTER USER
// This runs AFTER Firebase creates the user
async function register(req, res) {
  try {
    const { firebase_uid, email } = req.body;

    // Validate input
    if (!firebase_uid || !email) {
      return res.status(400).json({ error: 'firebase_uid and email are required' });
    }

    // Check if user already exists in our database
    const existingUser = await db.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Newsletter settings from registration (optional)
    const {
      newsletter_enabled = false,
      newsletter_frequency = 'daily',
      newsletter_day = 1,
      newsletter_time = '08:00'
    } = req.body;

    // Insert new user into database
    const result = await db.query(
      `INSERT INTO users (firebase_uid, email, created_at, newsletter_enabled, newsletter_frequency, newsletter_day, newsletter_time, newsletter_unsubscribe_token)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6, gen_random_uuid()) RETURNING *`,
      [firebase_uid, email, newsletter_enabled, newsletter_frequency, newsletter_day, newsletter_time]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// GET USER PROFILE
async function getProfile(req, res) {
  try {
    //from middleware auth.js
    const { uid } = req.user;

    // Get user from database
    const result = await db.query(
      'SELECT id, firebase_uid, email, preferences, profile_image_url, created_at, newsletter_enabled, newsletter_frequency, newsletter_day, newsletter_time FROM users WHERE firebase_uid = $1',
      [uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        preferences: user.preferences ? JSON.parse(user.preferences) : null,
        profile_image_url: user.profile_image_url,
        created_at: user.created_at,
        newsletter_enabled: user.newsletter_enabled || false,
        newsletter_frequency: user.newsletter_frequency || 'daily',
        newsletter_day: user.newsletter_day ?? 1,
        newsletter_time: user.newsletter_time || '08:00',
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
}

// UPDATE PROFILE IMAGE
async function updateProfileImage(req, res) {
  try {
    const { uid } = req.user;
    const { profile_image_url } = req.body;

    if (!profile_image_url) {
      return res.status(400).json({ error: 'profile_image_url is required' });
    }

    // Update user's profile image URL
    const result = await db.query(
      'UPDATE users SET profile_image_url = $1 WHERE firebase_uid = $2 RETURNING id, email, profile_image_url',
      [profile_image_url, uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile image updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({ error: 'Failed to update profile image' });
  }
}

module.exports = {
  register,
  getProfile,
  updateProfileImage,
};