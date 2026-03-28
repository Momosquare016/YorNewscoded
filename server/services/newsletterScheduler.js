const cron = require('node-cron');
const db = require('../db');
const { fetchArticles } = require('./newsApi');
const { fetchHackerNewsArticles } = require('./hackerNews');
const { sendNewsletter } = require('./emailService');

// Run every 15 minutes to check for users due for newsletter
function startNewsletterScheduler() {
  // Skip if SMTP is not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Newsletter scheduler: SMTP not configured, skipping.');
    return;
  }

  console.log('Newsletter scheduler started (checks every 15 minutes)');

  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await processNewsletters();
    } catch (error) {
      console.error('Newsletter scheduler error:', error);
    }
  });
}

async function processNewsletters() {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  const currentDay = now.getUTCDay(); // 0=Sunday

  // Format current time window (15-min window)
  const timeStart = `${String(currentHour).padStart(2, '0')}:${String(currentMinute - (currentMinute % 15)).padStart(2, '0')}`;
  const timeEndMinute = currentMinute - (currentMinute % 15) + 14;
  const timeEnd = `${String(currentHour).padStart(2, '0')}:${String(Math.min(timeEndMinute, 59)).padStart(2, '0')}`;

  // Find users who should receive newsletter now
  // Daily users: match time window, haven't been sent today
  // Weekly users: match time window AND day, haven't been sent this week
  const result = await db.query(
    `SELECT id, email, preferences, newsletter_frequency, newsletter_day,
            newsletter_time, newsletter_unsubscribe_token, newsletter_last_sent_at
     FROM users
     WHERE newsletter_enabled = true
       AND newsletter_time >= $1
       AND newsletter_time <= $2
       AND (
         newsletter_last_sent_at IS NULL
         OR (newsletter_frequency = 'daily' AND newsletter_last_sent_at < NOW() - INTERVAL '20 hours')
         OR (newsletter_frequency = 'weekly' AND newsletter_last_sent_at < NOW() - INTERVAL '6 days')
       )`,
    [timeStart, timeEnd]
  );

  const users = result.rows;

  if (users.length === 0) return;

  console.log(`Newsletter: ${users.length} users due for newsletter`);

  for (const user of users) {
    try {
      // Weekly users: check if today is their preferred day
      if (user.newsletter_frequency === 'weekly' && currentDay !== user.newsletter_day) {
        continue;
      }

      // Fetch articles based on user preferences
      let articles = [];

      if (user.preferences) {
        try {
          articles = await fetchArticles(user.preferences);
        } catch (e) {
          console.error(`Newsletter: Failed to fetch NewsAPI articles for ${user.email}:`, e.message);
        }
      }

      // Also fetch Hacker News top stories
      const hnArticles = await fetchHackerNewsArticles(5);
      articles = [...articles.slice(0, 10), ...hnArticles.slice(0, 5)];

      if (articles.length === 0) {
        console.log(`Newsletter: No articles found for ${user.email}, skipping`);
        continue;
      }

      // Sort by relevance/recency - take top 6 for the email
      const topArticles = articles
        .filter(a => a.title && a.title !== '[Removed]')
        .slice(0, 6);

      if (topArticles.length === 0) continue;

      // Send the email
      await sendNewsletter({
        email: user.email,
        articles: topArticles,
        unsubscribeToken: user.newsletter_unsubscribe_token,
      });

      // Update last sent timestamp
      await db.query(
        'UPDATE users SET newsletter_last_sent_at = NOW() WHERE id = $1',
        [user.id]
      );

      console.log(`Newsletter: Sent to ${user.email}`);
    } catch (error) {
      console.error(`Newsletter: Failed to send to ${user.email}:`, error.message);
    }
  }
}

module.exports = { startNewsletterScheduler };
