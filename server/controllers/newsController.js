const db = require('../db');
const { fetchArticles } = require('../services/newsApi');
const { summarizeArticles, rankArticles } = require('../services/openai');

// GET personalized news feed
async function getNews(req, res) {
  try {
    const { uid } = req.user;

    console.log('Fetching news for user:', uid);

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

    // Take top 30 for processing (to save on API costs)
    const articlesToProcess = validArticles.slice(0, 30);

    // Generate summaries with OpenAI
    console.log('Generating AI summaries...');
    const summaries = await summarizeArticles(articlesToProcess);

    // Calculate relevance scores with OpenAI
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

    // Return top 20 articles
    const topArticles = enrichedArticles.slice(0, 20);

    console.log(`Returning ${topArticles.length} articles`);

    res.json({
      count: topArticles.length,
      articles: topArticles,
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      details: error.message 
    });
  }
}

module.exports = {
  getNews,
};