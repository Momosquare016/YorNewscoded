import { useState } from 'react';
import '../styles/NewsCard.css';

function NewsCard({ article, onSave, isSaved }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved || false);

  async function handleSave() {
    if (saved) return;

    try {
      setSaving(true);
      await onSave(article);
      setSaved(true);
    } catch (err) {
      console.error('Failed to save article:', err);
      alert('Failed to save article');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="news-card">
      {article.urlToImage && (
        <div className="news-card-image">
          <img 
            src={article.urlToImage} 
            alt={article.title}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="news-card-content">
        <div className="news-card-source">
          {article.source?.name || 'Unknown Source'}
        </div>

        <h3 className="news-card-title">{article.title}</h3>

        <p className="news-card-summary">
          {article.summary || article.description || 'No summary available'}
        </p>

        <div className="news-card-footer">
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-secondary btn-small"
          >
            Read Full Article →
          </a>

          <button 
            onClick={handleSave}
            className={`btn btn-small ${saved ? 'btn-saved' : 'btn-primary'}`}
            disabled={saving || saved}
          >
            {saved ? '✓ Saved' : saving ? 'Saving...' : '🔖 Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewsCard;