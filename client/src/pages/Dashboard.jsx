import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import NewsCard from '../components/NewsCard';
import Loading from '../components/Loading';
import '../styles/Dashboard.css';

function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedArticleUrls, setSavedArticleUrls] = useState(new Set());

  useEffect(() => {
    fetchNews();
    fetchSavedArticles();
  }, []);

  async function fetchNews() {
    try {
      setLoading(true);
      setError('');
      
      const data = await api.getNews();
      
      if (data.message && data.articles.length === 0) {
        setError(data.message);
      }
      
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError(err.message || 'Failed to fetch news. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSavedArticles() {
    try {
      const data = await api.getSaved();
      const urls = new Set(
        data.articles.map(a => a.article_data?.url || a.url)
      );
      setSavedArticleUrls(urls);
    } catch (err) {
      console.error('Failed to fetch saved articles:', err);
    }
  }

  async function handleSaveArticle(article) {
    try {
      await api.saveArticle(article);
      setSavedArticleUrls(prev => new Set([...prev, article.url]));
    } catch (err) {
      throw err;
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <Loading />
        <p style={{ textAlign: 'center', color: '#64748b', marginTop: '1rem' }}>
          Fetching and analyzing your personalized news...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Your Daily News</h1>
          <p className="dashboard-subtitle">
            Personalized news based on your preferences
          </p>
        </div>
        <div className="dashboard-actions">
          <Link to="/saved" className="btn btn-secondary">
            🔖 Saved Articles ({savedArticleUrls.size})
          </Link>
          <Link to="/preferences" className="btn btn-primary">
            ⚙️ Edit Preferences
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          {error.includes('preferences') && (
            <div style={{ marginTop: '1rem' }}>
              <Link to="/preferences" className="btn btn-primary">
                Set Preferences Now
              </Link>
            </div>
          )}
        </div>
      )}

      {articles.length === 0 && !error && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📰</div>
          <h2>No news available</h2>
          <p>Set your preferences to get personalized news</p>
          <Link to="/preferences" className="btn btn-primary">
            Set Preferences
          </Link>
        </div>
      )}

      {articles.length > 0 && (
        <div className="news-meta">
          <p>
            Showing {articles.length} articles ranked by relevance
          </p>
        </div>
      )}

      <div className="news-grid">
        {articles.map((article, index) => (
          <NewsCard
            key={article.url || index}
            article={article}
            onSave={handleSaveArticle}
            isSaved={savedArticleUrls.has(article.url)}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;