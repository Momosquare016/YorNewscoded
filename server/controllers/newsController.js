const db = require('../db');
const { fetchArticles } = require('../services/newsApi');
const { summarizeArticles, rankArticles, isRateLimited } = require('../services/groq');

// Simple in-memory cache to avoid repeated API calls
const newsCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

function getCachedNews(uid) {
  const cached = newsCache.get(uid);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached news for user:', uid);
    return cached.data;
  }
  return null;
}

function setCachedNews(uid, data) {
  newsCache.set(uid, {
    data,
    timestamp: Date.now(),
  });
}

// Clear cache for a user (called when preferences are updated)
function clearUserCache(uid) {
  newsCache.delete(uid);
  console.log('Cleared news cache for user:', uid);
}

// GET personalized news feed
async function getNews(req, res) {
  try {
    const { uid } = req.user;

    console.log('Fetching news for user:', uid);

    // Check if rate limited - return error message
    if (isRateLimited()) {
      return res.status(429).json({
        error: 'Daily AI limit reached',
        message: 'AI features are temporarily unavailable. Please try again tomorrow!',
        rateLimited: true,
        articles: [],
      });
    }

    // Check cache first
    const cached = getCachedNews(uid);
    if (cached) {
      return res.json(cached);
    }

    // Get user preferences
    const userResult = await db.query(
      'SELECT preferences FROM users WHERE firebase_uid = $1',
      [uid]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const preferences = userResult.rows[0].preferences;

    if (!preferences) {
      return res.json({
        message: 'No preferences set. Please set your preferences first.',
        articles: [],
      });
    }

    console.log('User preferences:', preferences);

    // Fetch articles from News API
    const articles = await fetchArticles(preferences);

    if (articles.length === 0) {
      return res.json({
        message: 'No articles found. Try adjusting your preferences.',
        articles: [],
      });
    }

    console.log(`Fetched ${articles.length} articles from News API`);

    // Filter out articles without required fields
    const validArticles = articles.filter(article =>
      article.title &&
      article.url &&
      article.title !== '[Removed]'
    );

    console.log(`${validArticles.length} valid articles after filtering`);

    // Process up to 20 articles for AI enrichment
    const articlesToProcess = validArticles.slice(0, 20);

    // Generate summaries with Groq AI
    console.log(`Generating AI summaries for ${articlesToProcess.length} articles...`);
    const summaries = await summarizeArticles(articlesToProcess);

    // Check if we got rate limited during processing
    if (isRateLimited()) {
      return res.status(429).json({
        error: 'Daily AI limit reached',
        message: 'AI features are temporarily unavailable. Please try again tomorrow!',
        rateLimited: true,
        articles: [],
      });
    }

    // Calculate relevance scores with Groq AI
    console.log('Calculating relevance scores...');
    const scores = await rankArticles(articlesToProcess, preferences);

    // Combine articles with summaries and scores
    const enrichedArticles = articlesToProcess.map((article, index) => ({
      ...article,
      summary: summaries[index],
      relevanceScore: scores[index],
    }));

    // Sort by relevance score (highest first)
    enrichedArticles.sort((a, b) => b.relevanceScore - a.relevanceScore);

    console.log(`Returning ${enrichedArticles.length} articles`);

    const response = {
      count: enrichedArticles.length,
      articles: enrichedArticles,
      cached: false,
    };

    // Cache the response
    setCachedNews(uid, { ...response, cached: true });

    res.json(response);
  } catch (error) {
    console.error('Get news error:', error);

    // Check if it's a rate limit error
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Daily AI limit reached',
        message: 'AI features are temporarily unavailable. Please try again tomorrow!',
        rateLimited: true,
        articles: [],
      });
    }

    res.status(500).json({
      error: 'Failed to fetch news',
      details: error.message
    });
  }
}

module.exports = {
  getNews,
  clearUserCache,
};
