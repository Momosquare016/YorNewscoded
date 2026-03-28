const axios = require('axios');

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

// Fetch top stories from Hacker News
async function fetchHackerNewsArticles(limit = 15) {
  try {
    // Get top story IDs
    const { data: storyIds } = await axios.get(`${HN_API_BASE}/topstories.json`);

    // Fetch details for the top N stories
    const topIds = storyIds.slice(0, limit);
    const storyPromises = topIds.map(id =>
      axios.get(`${HN_API_BASE}/item/${id}.json`).then(res => res.data)
    );

    const stories = await Promise.all(storyPromises);

    // Transform to match NewsAPI article format
    const articles = stories
      .filter(story => story && story.title && story.url)
      .map(story => ({
        title: story.title,
        url: story.url,
        description: story.title,
        source: { name: 'Hacker News' },
        author: story.by || 'Unknown',
        publishedAt: new Date(story.time * 1000).toISOString(),
        urlToImage: null, // HN doesn't provide images
        hnScore: story.score || 0,
        hnComments: story.descendants || 0,
      }));

    return articles;
  } catch (error) {
    console.error('Hacker News API Error:', error.message);
    return [];
  }
}

module.exports = {
  fetchHackerNewsArticles,
};
