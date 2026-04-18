const axios = require('axios');

// Two Hacker News APIs — both free, no key.
//
//   1. Firebase  (https://hacker-news.firebaseio.com/v0/)
//      The canonical source. Has /topstories, /newstories, /beststories,
//      /askstories, /showstories, /jobstories. No search. We use it for
//      the "unfiltered top of the front page" fallback.
//
//   2. Algolia   (https://hn.algolia.com/api/v1/)
//      Algolia's hosted search over HN, sourced from the Firebase API.
//      Supports `query=` against titles/authors/comments, tag filters,
//      and numeric filters (points, date). We use it for preference-
//      matched search so the feed reflects what the user actually cares
//      about — matches what NewsAPI does for mainstream news.
//
// Both have no rate limit. Firebase docs explicitly say so, and Algolia's
// public endpoint is free. Good to request in parallel.

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0';
const HN_ALGOLIA_BASE = 'https://hn.algolia.com/api/v1';

/**
 * Back-compat: pull the top N front-page stories (unfiltered).
 * Used when the user has no preferences set yet.
 */
async function fetchHackerNewsArticles(limit = 15) {
  try {
    const { data: storyIds } = await axios.get(`${HN_FIREBASE_BASE}/topstories.json`, {
      timeout: 8000,
    });

    const topIds = storyIds.slice(0, limit);
    const stories = await Promise.all(
      topIds.map((id) =>
        axios
          .get(`${HN_FIREBASE_BASE}/item/${id}.json`, { timeout: 8000 })
          .then((r) => r.data)
          .catch(() => null),
      ),
    );

    return stories
      .filter((s) => s && s.title && s.url && !s.deleted && !s.dead)
      .map(firebaseStoryToArticle);
  } catch (error) {
    console.error('Hacker News (Firebase) error:', error.message);
    return [];
  }
}

/**
 * Preference-aware HN search via Algolia. Builds the same query we'd use
 * against NewsAPI from the parsed preferences, then pulls matching
 * front-page-worthy stories. Hits are pre-filtered to stories with a URL
 * and a minimum score so we don't surface low-signal posts.
 *
 * @param {object} preferences - parsed preferences (topics, categories, raw_input, timeframe)
 * @param {number} limit - max articles to return (default 15)
 * @param {object} opts
 * @param {'popularity'|'date'} opts.rank - relevance vs. recency
 * @param {number} opts.minPoints - filter out HN posts under this score
 */
async function fetchHackerNewsByPreferences(preferences, limit = 15, opts = {}) {
  const { rank = 'popularity', minPoints = 10 } = opts;
  try {
    const parsed =
      typeof preferences === 'string' ? JSON.parse(preferences) : preferences;
    const query = buildQuery(parsed);

    // Empty query → fall back to the unfiltered front page.
    if (!query) return fetchHackerNewsArticles(limit);

    // /search is relevance-ranked; /search_by_date is chronological.
    const endpoint =
      rank === 'date' ? 'search_by_date' : 'search';

    // numericFilters lets us add both a minimum score and an optional
    // timeframe window.
    const numericFilters = [`points>=${minPoints}`];
    const cutoff = timeframeCutoffUnix(parsed.timeframe);
    if (cutoff) numericFilters.push(`created_at_i>${cutoff}`);

    const { data } = await axios.get(`${HN_ALGOLIA_BASE}/${endpoint}`, {
      timeout: 8000,
      params: {
        query,
        tags: 'story', // exclude comments, poll options, Ask/Show unless URL
        hitsPerPage: Math.min(limit * 2, 50), // oversample — we'll filter out URL-less
        numericFilters: numericFilters.join(','),
      },
    });

    return (data?.hits ?? [])
      .filter((h) => h.url && h.title)
      .slice(0, limit)
      .map(algoliaHitToArticle);
  } catch (error) {
    console.error('Hacker News (Algolia) error:', error.message);
    // Graceful degrade to unfiltered top if Algolia errors.
    return fetchHackerNewsArticles(limit);
  }
}

// ──────────────────────────────────────────────────────────────────
// helpers

function buildQuery(prefs) {
  if (!prefs) return '';
  const parts = [];
  if (Array.isArray(prefs.topics)) parts.push(...prefs.topics);
  if (Array.isArray(prefs.categories)) parts.push(...prefs.categories);
  if (!parts.length && prefs.raw_input) return String(prefs.raw_input).slice(0, 300);
  return parts.filter(Boolean).join(' ').slice(0, 300);
}

function timeframeCutoffUnix(timeframe) {
  if (!timeframe) return null;
  const m = String(timeframe).match(/(\d+)\s*(day|week|month)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const seconds =
    unit === 'day' ? 86400 : unit === 'week' ? 86400 * 7 : 86400 * 30;
  return Math.floor(Date.now() / 1000) - n * seconds;
}

// Normalise a Firebase /item/<id> story into the NewsAPI-shaped article.
function firebaseStoryToArticle(story) {
  return {
    title: story.title,
    url: story.url,
    description: story.title,
    source: { name: 'Hacker News' },
    author: story.by || 'Unknown',
    publishedAt: new Date(story.time * 1000).toISOString(),
    urlToImage: null,
    hnItemId: story.id,
    hnScore: story.score || 0,
    hnComments: story.descendants || 0,
  };
}

// Normalise an Algolia search hit into the same shape.
function algoliaHitToArticle(hit) {
  return {
    title: hit.title,
    url: hit.url,
    description: hit.title,
    source: { name: 'Hacker News' },
    author: hit.author || 'Unknown',
    publishedAt: hit.created_at || null,
    urlToImage: null,
    hnItemId: hit.story_id ?? hit.objectID,
    hnScore: hit.points || 0,
    hnComments: hit.num_comments || 0,
  };
}

module.exports = {
  fetchHackerNewsArticles,
  fetchHackerNewsByPreferences,
};
