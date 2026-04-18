const db = require('../db');
const { fetchArticles } = require('../services/newsApi');
const {
  fetchHackerNewsArticles,
  fetchHackerNewsByPreferences,
} = require('../services/hackerNews');
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

    // Fetch articles from both sources in parallel.
    //  · NewsAPI:  mainstream publisher coverage, preference-matched.
    //  · HN:       tech/indie coverage. Algolia search when preferences exist,
    //              front-page top stories as fallback.
    const hasPrefs =
      preferences &&
      ((Array.isArray(preferences.topics) && preferences.topics.length) ||
        (Array.isArray(preferences.categories) && preferences.categories.length) ||
        (preferences.raw_input && String(preferences.raw_input).trim()));

    const [newsApiArticles, hnArticles] = await Promise.all([
      fetchArticles(preferences).catch((err) => {
        console.error('NewsAPI fetch failed:', err.message);
        return [];
      }),
      (hasPrefs
        ? fetchHackerNewsByPreferences(preferences, 12, { rank: 'popularity', minPoints: 15 })
        : fetchHackerNewsArticles(10)
      ).catch((err) => {
        console.error('Hacker News fetch failed:', err.message);
        return [];
      }),
    ]);

    // Merge articles, deduping by URL (HN often links to the same articles
    // NewsAPI already surfaced). NewsAPI first = it wins on tie.
    const seen = new Set();
    const articles = [...newsApiArticles, ...hnArticles].filter((a) => {
      const key = canonicalUrl(a?.url);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

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

// Strip protocol, trailing slash, `www.`, query params, and utm_* so two
// links to the same article dedupe. Good-enough URL canonicalisation.
function canonicalUrl(u) {
  if (!u) return '';
  try {
    const url = new URL(u);
    url.hash = '';
    for (const k of [...url.searchParams.keys()]) {
      if (k.toLowerCase().startsWith('utm_') || k === 'ref' || k === 'source') {
        url.searchParams.delete(k);
      }
    }
    const host = url.host.replace(/^www\./, '');
    const path = url.pathname.replace(/\/+$/, '');
    const q = url.searchParams.toString();
    return `${host}${path}${q ? '?' + q : ''}`.toLowerCase();
  } catch {
    return String(u).toLowerCase();
  }
}

module.exports = {
  getNews,
};
