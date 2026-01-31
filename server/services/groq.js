const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Track rate limit status
let dailyLimitExceeded = false;
let dailyLimitResetTime = null;

// Helper to delay execution
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkDailyLimit() {
  if (dailyLimitExceeded && dailyLimitResetTime) {
    if (Date.now() > dailyLimitResetTime) {
      dailyLimitExceeded = false;
      dailyLimitResetTime = null;
      console.log('Daily limit reset, resuming AI calls');
    }
  }
  return dailyLimitExceeded;
}

// Parse the retry-after from error or default to 3 seconds
function getRetryDelay(error) {
  // Check if error message contains "try again in Xs"
  const match = error.message?.match(/try again in (\d+)s/i);
  if (match) {
    return parseInt(match[1]) * 1000 + 500; // Add 500ms buffer
  }
  return 3000; // Default 3 seconds
}

function handleRateLimitError(error) {
  if (error.status === 429 || error.message?.includes('rate_limit')) {
    // Check if it's a daily/token limit vs per-minute limit
    if (error.message?.includes('tokens per day') || error.message?.includes('daily')) {
      dailyLimitExceeded = true;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      dailyLimitResetTime = tomorrow.getTime();
      console.log('Daily token limit exceeded - will reset tomorrow');
      return { isDaily: true, retryDelay: 0 };
    }
    // Per-minute rate limit - just need to wait
    const retryDelay = getRetryDelay(error);
    console.log(`Per-minute rate limit hit, waiting ${retryDelay}ms...`);
    return { isDaily: false, retryDelay };
  }
  return null;
}

// Check if daily limit is exceeded (for frontend to show message)
function isRateLimited() {
  return dailyLimitExceeded;
}

// Parse natural language preferences
async function parsePreferences(preferenceText, retryCount = 0) {
  if (checkDailyLimit()) {
    return parsePreferencesSimple(preferenceText);
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a news preference parser. Convert user input into JSON with topics, categories, and timeframe. Return ONLY valid JSON.'
        },
        {
          role: 'user',
          content: `Parse this into JSON format {"topics": [], "categories": [], "timeframe": "7 days"}: "${preferenceText}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content.trim();
    const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonString);

    return {
      topics: parsed.topics || [],
      categories: parsed.categories || [],
      timeframe: parsed.timeframe || '7 days',
      raw_input: preferenceText,
      parsed_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Groq Preference Parsing Error:', error.message);
    const rateLimitInfo = handleRateLimitError(error);
    if (rateLimitInfo) {
      if (rateLimitInfo.isDaily) {
        return { ...parsePreferencesSimple(preferenceText), rateLimited: true };
      }
      // Per-minute limit - wait and retry (max 2 retries)
      if (retryCount < 2) {
        await delay(rateLimitInfo.retryDelay);
        return parsePreferences(preferenceText, retryCount + 1);
      }
    }
    return parsePreferencesSimple(preferenceText);
  }
}

// Simple keyword-based preference parsing fallback
function parsePreferencesSimple(preferenceText) {
  const text = preferenceText.toLowerCase();
  const categoryKeywords = {
    technology: ['tech', 'technology', 'software', 'ai', 'programming', 'coding'],
    business: ['business', 'finance', 'economy', 'market', 'startup'],
    science: ['science', 'research', 'space', 'physics'],
    health: ['health', 'medical', 'fitness', 'wellness'],
    sports: ['sports', 'football', 'basketball', 'soccer'],
    entertainment: ['entertainment', 'movie', 'music', 'celebrity'],
  };

  const categories = [];
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      categories.push(category);
    }
  }

  const words = text.split(/\s+/).filter(word => word.length > 3);

  return {
    topics: words.slice(0, 5),
    categories: categories.length > 0 ? categories : ['general'],
    timeframe: '7 days',
    raw_input: preferenceText,
    parsed_at: new Date().toISOString(),
  };
}

// Summarize multiple articles in ONE API call (batch of 10)
async function summarizeBatch(articles, retryCount = 0) {
  if (checkDailyLimit() || articles.length === 0) {
    return articles.map(a => a.description || 'Summary not available.');
  }

  try {
    // Build a prompt with all articles numbered
    const articlesText = articles.map((a, i) =>
      `${i + 1}. "${a.title}" - ${(a.description || '').slice(0, 200)}`
    ).join('\n');

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Summarize each news article in 1 sentence. Return ONLY numbered summaries matching the input numbers, one per line. Format: "1. Summary here\\n2. Summary here"'
        },
        {
          role: 'user',
          content: `Summarize each article:\n${articlesText}`
        }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content.trim();
    const lines = content.split('\n').filter(l => l.trim());

    // Parse numbered responses back to array
    const summaries = articles.map((article, i) => {
      const line = lines.find(l => l.startsWith(`${i + 1}.`) || l.startsWith(`${i + 1}:`));
      if (line) {
        return line.replace(/^\d+[\.\:]\s*/, '').trim();
      }
      return article.description || 'Summary not available.';
    });

    return summaries;
  } catch (error) {
    console.error('Groq Batch Summary Error:', error.message);
    const rateLimitInfo = handleRateLimitError(error);
    if (rateLimitInfo && !rateLimitInfo.isDaily && retryCount < 2) {
      await delay(rateLimitInfo.retryDelay);
      return summarizeBatch(articles, retryCount + 1);
    }
    return articles.map(a => a.description || 'Summary not available.');
  }
}

// Summarize all articles with just 2 API calls
async function summarizeArticles(articles) {
  if (checkDailyLimit()) {
    console.log('Daily limit reached - using descriptions as summaries');
    return articles.map(a => a.description || 'Summary not available.');
  }

  // Split into 2 batches of 10 = only 2 API calls total
  const batchSize = 10;
  const summaries = [];

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    console.log(`Summarizing batch ${Math.floor(i/batchSize) + 1}...`);
    const batchSummaries = await summarizeBatch(batch);
    summaries.push(...batchSummaries);

    // Small delay between batches
    if (i + batchSize < articles.length) {
      await delay(1000);
    }
  }

  return summaries;
}

// Score multiple articles in ONE API call (batch of 10)
async function scoreBatch(articles, preferences, retryCount = 0) {
  if (checkDailyLimit() || articles.length === 0) {
    return articles.map(a => calculateSimpleRelevance(a, preferences));
  }

  try {
    const parsedPrefs = typeof preferences === 'string'
      ? JSON.parse(preferences)
      : preferences;

    const topics = parsedPrefs.topics || [];
    const rawInput = parsedPrefs.raw_input || '';

    if (topics.length === 0 && !rawInput) {
      return articles.map(() => 0.5);
    }

    // Build a prompt with all articles numbered
    const articlesText = articles.map((a, i) =>
      `${i + 1}. "${a.title}"`
    ).join('\n');

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Rate each article\'s relevance to user interests from 0.0 to 1.0. Return ONLY numbered scores, one per line. Format: "1. 0.8\\n2. 0.5"'
        },
        {
          role: 'user',
          content: `User interests: ${rawInput || topics.join(', ')}\n\nRate each article:\n${articlesText}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content.trim();
    const lines = content.split('\n').filter(l => l.trim());

    // Parse numbered scores back to array
    const scores = articles.map((article, i) => {
      const line = lines.find(l => l.startsWith(`${i + 1}.`) || l.startsWith(`${i + 1}:`));
      if (line) {
        const scoreMatch = line.match(/(\d+\.?\d*)/g);
        if (scoreMatch && scoreMatch.length > 1) {
          const score = parseFloat(scoreMatch[1]);
          if (!isNaN(score)) return Math.max(0, Math.min(1, score));
        }
      }
      return calculateSimpleRelevance(article, preferences);
    });

    return scores;
  } catch (error) {
    console.error('Groq Batch Scoring Error:', error.message);
    const rateLimitInfo = handleRateLimitError(error);
    if (rateLimitInfo && !rateLimitInfo.isDaily && retryCount < 2) {
      await delay(rateLimitInfo.retryDelay);
      return scoreBatch(articles, preferences, retryCount + 1);
    }
    return articles.map(a => calculateSimpleRelevance(a, preferences));
  }
}

// Simple keyword-based relevance scoring fallback
function calculateSimpleRelevance(article, preferences) {
  const parsedPrefs = typeof preferences === 'string'
    ? JSON.parse(preferences)
    : preferences;

  const topics = parsedPrefs.topics || [];
  const rawInput = (parsedPrefs.raw_input || '').toLowerCase();
  const articleText = `${article.title} ${article.description || ''}`.toLowerCase();

  let score = 0.3;

  for (const topic of topics) {
    if (articleText.includes(topic.toLowerCase())) {
      score += 0.15;
    }
  }

  const inputWords = rawInput.split(/\s+/).filter(w => w.length > 3);
  for (const word of inputWords) {
    if (articleText.includes(word)) {
      score += 0.1;
    }
  }

  return Math.min(1, score);
}

// Rank all articles with just 2 API calls
async function rankArticles(articles, preferences) {
  if (checkDailyLimit()) {
    console.log('Daily limit reached - using keyword-based ranking');
    return articles.map(article => calculateSimpleRelevance(article, preferences));
  }

  // Split into 2 batches of 10 = only 2 API calls total
  const batchSize = 10;
  const scores = [];

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    console.log(`Scoring batch ${Math.floor(i/batchSize) + 1}...`);
    const batchScores = await scoreBatch(batch, preferences);
    scores.push(...batchScores);

    // Small delay between batches
    if (i + batchSize < articles.length) {
      await delay(1000);
    }
  }

  return scores;
}

module.exports = {
  parsePreferences,
  summarizeArticles,
  rankArticles,
  isRateLimited,
};
