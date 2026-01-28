const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Parse natural language preferences into structured format
async function parsePreferences(preferenceText) {
  try {
    const prompt = `
You are a news preference parser. Convert the user's natural language input into a structured JSON format.

User Input: "${preferenceText}"

Extract:
1. Topics: Specific subjects they want news about (e.g., AI, startups, climate change)
2. Categories: General news categories (e.g., technology, business, science, health, sports)
3. Timeframe: How recent the news should be (e.g., "7 days", "1 week", "1 month")

Return ONLY valid JSON in this exact format:
{
  "topics": ["topic1", "topic2"],
  "categories": ["category1", "category2"],
  "timeframe": "7 days"
}

If no timeframe is specified, default to "7 days".
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that parses news preferences into structured JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
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
    console.error('OpenAI Preference Parsing Error:', error.message);
    
    // Fallback: return basic structure
    return {
      topics: [],
      categories: [],
      timeframe: '7 days',
      raw_input: preferenceText,
      parsed_at: new Date().toISOString(),
      error: 'Failed to parse preferences with AI',
    };
  }
}

// Summarize an article into 2-3 sentences
async function summarizeArticle(article) {
  try {
    const content = article.description || article.content || article.title;
    
    if (!content) {
      return 'No summary available.';
    }

    const prompt = `
Summarize this news article in exactly 2 sentences. Be concise and informative.

Title: ${article.title}
Content: ${content}

Summary:
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a news summarization assistant. Provide concise 2-sentence summaries.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI Summarization Error:', error.message);
    
    // Fallback to description
    return article.description || 'Summary not available.';
  }
}

// Summarize multiple articles (batch processing)
async function summarizeArticles(articles) {
  const summaries = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    
    const batchPromises = batch.map(article => 
      summarizeArticle(article).catch(err => {
        console.error('Summary failed for article:', article.title);
        return article.description || 'Summary not available.';
      })
    );
    
    const batchSummaries = await Promise.all(batchPromises);
    summaries.push(...batchSummaries);
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return summaries;
}

// Calculate relevance score for an article based on preferences
async function calculateRelevanceScore(article, preferences) {
  try {
    const parsedPrefs = typeof preferences === 'string' 
      ? JSON.parse(preferences) 
      : preferences;

    const topics = parsedPrefs.topics || [];
    const categories = parsedPrefs.categories || [];

    if (topics.length === 0 && categories.length === 0) {
      return 0.5; // Neutral score if no preferences
    }

    const prompt = `
Rate how relevant this article is to the user's interests on a scale of 0.0 to 1.0.

User Interests:
- Topics: ${topics.join(', ') || 'None'}
- Categories: ${categories.join(', ') || 'None'}

Article:
- Title: ${article.title}
- Description: ${article.description || 'N/A'}

Return ONLY a number between 0.0 and 1.0 (e.g., 0.85)
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a relevance scoring assistant. Return only a decimal number.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const scoreText = response.choices[0].message.content.trim();
    const score = parseFloat(scoreText);

    return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
  } catch (error) {
    console.error('OpenAI Relevance Scoring Error:', error.message);
    return 0.5; // Default neutral score
  }
}

// Calculate relevance scores for multiple articles (batch)
async function rankArticles(articles, preferences) {
  const scores = [];
  
  // Process in batches
  const batchSize = 3;
  
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    
    const batchPromises = batch.map(article => 
      calculateRelevanceScore(article, preferences).catch(err => {
        console.error('Scoring failed for article:', article.title);
        return 0.5;
      })
    );
    
    const batchScores = await Promise.all(batchPromises);
    scores.push(...batchScores);
    
    // Small delay between batches
    if (i + batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return scores;
}

module.exports = {
  parsePreferences,
  summarizeArticle,
  summarizeArticles,
  calculateRelevanceScore,
  rankArticles,
};