import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import SavedCard from '../components/SavedCard';
import Loading from '../components/Loading';
import '../styles/SavedArticles.css';

function SavedArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSavedArticles();
  }, []);

  async function fetchSavedArticles() {
    try {
      const data = await api.getSaved();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch saved articles');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveArticle(articleId) {
    try {
      await api.removeSaved(articleId);
      setArticles(prev => prev.filter(a => a.id !== articleId));
    } catch (err) {
      throw err;
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="saved-container">
      <div className="saved-header">
        <div>
          <Link to="/news" className="back-link">← Back to Dashboard</Link>
          <h1>Your Saved Articles</h1>
          <p className="saved-subtitle">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'} saved
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {articles.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">🔖</div>
          <h2>No saved articles yet</h2>
          <p>Start saving articles from your news feed to read them later</p>
          <Link to="/news" className="btn btn-primary">
            Browse News
          </Link>
        </div>
      )}

      <div className="saved-grid">
        {articles.map((article) => (
          <SavedCard
            key={article.id}
            article={article}
            savedAt={article.saved_at}
            onRemove={() => handleRemoveArticle(article.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default SavedArticles;