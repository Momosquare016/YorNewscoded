const db = require('../db');
const { fetchArticles } = require('../services/newsApi');
const { fetchHackerNewsArticles } = require('../services/hackerNews');
const { summarizeArticles, rankArticles, isRateLimited } = require('../services/groq');

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

    // Check if preferences were passed directly (to avoid database replication lag)
    let preferences = req.body?.preferences;

    if (!preferences) {
      // Fall back to fetching from database
      const userResult = await db.query(
        'SELECT preferences FROM users WHERE firebase_uid = $1',
        [uid]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      preferences = userResult.rows[0].preferences;
    } else {
      console.log('Using preferences passed directly (bypassing DB)');
    }

    if (!preferences) {
      return res.json({
        message: 'No preferences set. Please set your preferences first.',
        articles: [],
      });
    }

    console.log('User preferences:', preferences);

    // Fetch articles from both News API and Hacker News in parallel
    const [newsApiArticles, hnArticles] = await Promise.all([
      fetchArticles(preferences).catch(err => {
        console.error('NewsAPI fetch failed:', err.message);
        return [];
      }),
      fetchHackerNewsArticles(10).catch(err => {
        console.error('Hacker News fetch failed:', err.message);
        return [];
      }),
    ]);

    // Merge articles - NewsAPI first, then HN
    const articles = [...newsApiArticles, ...hnArticles];

    if (articles.length === 0) {
      return res.json({
        message: 'No articles found. Try adjusting your preferences.',
        articles: [],
      });
    }

    console.log(`Fetched ${newsApiArticles.length} from NewsAPI + ${hnArticles.length} from Hacker News`);

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
    };

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
};
