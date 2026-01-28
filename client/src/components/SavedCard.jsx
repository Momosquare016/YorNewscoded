import { useState } from 'react';
import '../styles/SavedCard.css';

function SavedCard({ article, savedAt, onRemove }) {
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!window.confirm('Are you sure you want to remove this article?')) {
      return;
    }

    try {
      setRemoving(true);
      await onRemove();
    } catch (err) {
      console.error('Failed to remove article:', err);
      alert('Failed to remove article');
      setRemoving(false);
    }
  }

  // Extract article data
  const data = article.article_data || article;

  return (
    <div className="saved-card">
      {data.urlToImage && (
        <div className="saved-card-image">
          <img 
            src={data.urlToImage} 
            alt={data.title}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="saved-card-content">
        <div className="saved-card-header">
          <div className="saved-card-source">
            {data.source?.name || 'Unknown Source'}
          </div>
          <div className="saved-card-date">
            Saved {new Date(savedAt || article.saved_at).toLocaleDateString()}
          </div>
        </div>

        <h3 className="saved-card-title">{data.title}</h3>

        <p className="saved-card-summary">
          {data.summary || data.description || 'No summary available'}
        </p>

        <div className="saved-card-footer">
          <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-secondary btn-small"
          >
            Read Full Article →
          </a>

          <button 
            onClick={handleRemove}
            className="btn btn-danger btn-small"
            disabled={removing}
          >
            {removing ? 'Removing...' : '🗑️ Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SavedCard;