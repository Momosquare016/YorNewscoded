const axios = require('axios');

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Fetch articles from News API based on user preferences
async function fetchArticles(preferences) {
  try {
    // Parse preferences
    const parsedPrefs = typeof preferences === 'string' 
      ? JSON.parse(preferences) 
      : preferences;

    // Build search query
    const query = buildSearchQuery(parsedPrefs);
    
    // Calculate date range
    const timeframe = parsedPrefs.timeframe || '7 days';
    const fromDate = calculateFromDate(timeframe);

    // Make API request
    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
      params: {
        q: query,
        from: fromDate,
        sortBy: 'relevancy',
        language: 'en',
        pageSize: 100, // Max articles to fetch
        apiKey: NEWS_API_KEY,
      },
    });

    if (response.data.status !== 'ok') {
      throw new Error('News API request failed');
    }

    return response.data.articles;
  } catch (error) {
    console.error('News API Error:', error.message);
    
    // Return empty array instead of throwing to prevent complete failure
    if (error.response?.status === 429) {
      console.error('News API rate limit exceeded');
      return [];
    }
    
    throw error;
  }
}

// Build search query from parsed preferences
function buildSearchQuery(preferences) {
  const parts = [];

  // Add topics
  if (preferences.topics && preferences.topics.length > 0) {
    parts.push(...preferences.topics);
  }

  // Add categories
  if (preferences.categories && preferences.categories.length > 0) {
    parts.push(...preferences.categories);
  }

  // If no specific preferences, use raw input
  if (parts.length === 0 && preferences.raw_input) {
    return preferences.raw_input.substring(0, 500); // News API query limit
  }

  // Join with OR operator
  return parts.join(' OR ');
}

// Calculate from date based on timeframe
function calculateFromDate(timeframe) {
  const now = new Date();
  
  // Extract number from timeframe (e.g., "7 days" -> 7)
  const match = timeframe.match(/(\d+)\s*(day|week|month)/i);
  
  if (!match) {
    // Default to 7 days
    now.setDate(now.getDate() - 7);
    return now.toISOString().split('T')[0];
  }

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'day':
      now.setDate(now.getDate() - amount);
      break;
    case 'week':
      now.setDate(now.getDate() - (amount * 7));
      break;
    case 'month':
      now.setMonth(now.getMonth() - amount);
      break;
  }

  return now.toISOString().split('T')[0];
}

// Fetch top headlines (optional - for homepage/trending)
async function fetchTopHeadlines(category = 'technology', country = 'us') {
  try {
    const response = await axios.get(`${NEWS_API_BASE_URL}/top-headlines`, {
      params: {
        category,
        country,
        pageSize: 20,
        apiKey: NEWS_API_KEY,
      },
    });

    if (response.data.status !== 'ok') {
      throw new Error('News API request failed');
    }

    return response.data.articles;
  } catch (error) {
    console.error('News API Error:', error.message);
    return [];
  }
}

module.exports = {
  fetchArticles,
  fetchTopHeadlines,
};