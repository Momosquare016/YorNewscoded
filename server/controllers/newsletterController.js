const db = require('../db');

// GET newsletter settings for current user
async function getNewsletterSettings(req, res) {
  try {
    const { uid } = req.user;

    const result = await db.query(
      `SELECT newsletter_enabled, newsletter_frequency, newsletter_day, newsletter_time
       FROM users WHERE firebase_uid = $1`,
      [uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      newsletter_enabled: user.newsletter_enabled || false,
      newsletter_frequency: user.newsletter_frequency || 'daily',
      newsletter_day: user.newsletter_day ?? 1,
      newsletter_time: user.newsletter_time || '08:00',
    });
  } catch (error) {
    console.error('Get newsletter settings error:', error);
    res.status(500).json({ error: 'Failed to get newsletter settings' });
  }
}

// UPDATE newsletter settings for current user
async function updateNewsletterSettings(req, res) {
  try {
    const { uid } = req.user;
    const { newsletter_enabled, newsletter_frequency, newsletter_day, newsletter_time } = req.body;

    // Validate frequency
    if (newsletter_frequency && !['daily', 'weekly'].includes(newsletter_frequency)) {
      return res.status(400).json({ error: 'Frequency must be "daily" or "weekly"' });
    }

    // Validate day (0-6)
    if (newsletter_day !== undefined && (newsletter_day < 0 || newsletter_day > 6)) {
      return res.status(400).json({ error: 'Day must be between 0 (Sunday) and 6 (Saturday)' });
    }

    // Validate time format HH:MM
    if (newsletter_time && !/^\d{2}:\d{2}$/.test(newsletter_time)) {
      return res.status(400).json({ error: 'Time must be in HH:MM format' });
    }

    const result = await db.query(
      `UPDATE users SET
        newsletter_enabled = COALESCE($1, newsletter_enabled),
        newsletter_frequency = COALESCE($2, newsletter_frequency),
        newsletter_day = COALESCE($3, newsletter_day),
        newsletter_time = COALESCE($4, newsletter_time)
       WHERE firebase_uid = $5
       RETURNING newsletter_enabled, newsletter_frequency, newsletter_day, newsletter_time`,
      [newsletter_enabled, newsletter_frequency, newsletter_day, newsletter_time, uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Newsletter settings updated',
      ...result.rows[0],
    });
  } catch (error) {
    console.error('Update newsletter settings error:', error);
    res.status(500).json({ error: 'Failed to update newsletter settings' });
  }
}

// UNSUBSCRIBE via token (no auth required - clickable from email)
async function unsubscribe(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send(unsubscribePage('Invalid unsubscribe link.', false));
    }

    const result = await db.query(
      'UPDATE users SET newsletter_enabled = false WHERE newsletter_unsubscribe_token = $1 RETURNING email',
      [token]
    );

    if (result.rows.length === 0) {
      return res.send(unsubscribePage('Invalid or expired unsubscribe link.', false));
    }

    res.send(unsubscribePage(`You've been unsubscribed successfully. You will no longer receive YorNews newsletters.`, true));
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).send(unsubscribePage('Something went wrong. Please try again.', false));
  }
}

// Simple HTML page for unsubscribe result
function unsubscribePage(message, success) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YorNews - Unsubscribe</title>
</head>
<body style="margin: 0; padding: 0; background: #000; font-family: Georgia, serif; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
  <div style="text-align: center; padding: 40px 20px; max-width: 500px;">
    <h1 style="color: #fff; font-size: 28px; font-weight: 400; letter-spacing: 2px;">YORNEWS</h1>
    <div style="width: 40px; height: 3px; background: ${success ? '#f5c518' : '#ff4d4f'}; margin: 16px auto 24px;"></div>
    <p style="color: ${success ? '#fff' : '#ff4d4f'}; font-size: 16px; line-height: 1.5;">${message}</p>
    <a href="${process.env.FRONTEND_URL || 'https://yornews.vercel.app'}"
       style="display: inline-block; margin-top: 20px; color: #f5c518; font-size: 14px; text-decoration: underline;">
      Go to YorNews
    </a>
  </div>
</body>
</html>`;
}

module.exports = {
  getNewsletterSettings,
  updateNewsletterSettings,
  unsubscribe,
};
