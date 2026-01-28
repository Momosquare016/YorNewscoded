import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Loading from '../components/Loading';
import '../styles/Preferences.css';

function Preferences() {
  const [preferenceText, setPreferenceText] = useState('');
  const [currentPreferences, setCurrentPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  // Fetch current preferences on load
  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const data = await api.getPreferences();
      setCurrentPreferences(data.preferences);
      
      if (data.preferences?.raw_input) {
        setPreferenceText(data.preferences.raw_input);
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    setError('');
    setSuccess('');

    if (!preferenceText.trim()) {
      setError('Please describe your news preferences');
      return;
    }

    try {
      setSubmitting(true);
      
      await api.updatePreferences(preferenceText);
      
      setSuccess('Preferences saved successfully!');
      
      setTimeout(() => {
        navigate('/news');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="preferences-container">
      <div className="preferences-card">
        <h1>Set Your News Preferences</h1>
        <p className="preferences-subtitle">
          Tell us what kind of news you're interested in using natural language
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="preferences">What news are you interested in?</label>
            <textarea
              id="preferences"
              value={preferenceText}
              onChange={(e) => setPreferenceText(e.target.value)}
              placeholder="Example: I want to read about AI, startups, and climate technology from the last 7 days"
              rows="6"
              disabled={submitting}
              required
            />
            <small className="help-text">
              Be specific about topics, categories, and timeframe
            </small>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-large"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>

        {currentPreferences && (
          <div className="current-preferences">
            <h3>Current Preferences</h3>
            <p>{currentPreferences.raw_input}</p>
            <small>Last updated: {new Date(currentPreferences.parsed_at).toLocaleDateString()}</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default Preferences;