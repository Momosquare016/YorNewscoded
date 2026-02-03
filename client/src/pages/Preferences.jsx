import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Typography, Card, Button, Input, Alert, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { api } from '../utils/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function Preferences() {
  const [preferenceText, setPreferenceText] = useState('');
  const [currentPreferences, setCurrentPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

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
      setError('');
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
      setError(err.message || 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setError('');
    setSuccess('');

    if (!preferenceText.trim()) {
      setError('Please describe your news preferences');
      return;
    }

    try {
      setSubmitting(true);
      const result = await api.updatePreferences(preferenceText);
      setSuccess('Preferences saved! Fetching your personalized news...');

      // Store preferences locally with the full result for immediate use
      const savedPreferences = result.preferences;
      if (savedPreferences) {
        localStorage.setItem('lastSavedPreferences', JSON.stringify({
          preferences: savedPreferences,
          savedAt: Date.now()
        }));
      }

      // Fetch news immediately using the new preferences (bypasses DB replication lag)
      // Pass preferences directly to the API to ensure we get fresh content
      try {
        // Small delay to let server process
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newsData = await api.getNews(true, savedPreferences);
        if (newsData.articles && newsData.articles.length > 0) {
          // Store prefetched articles in sessionStorage for Dashboard
          sessionStorage.setItem('prefetchedArticles', JSON.stringify(newsData.articles));
          window.location.href = '/news';
          return;
        }
      } catch (newsErr) {
        console.log('News fetch with preferences failed:', newsErr.message);
      }

      // Fallback: signal Dashboard to refresh with new preferences
      sessionStorage.setItem('newPreferences', JSON.stringify(savedPreferences));
      window.location.href = '/news';
    } catch (err) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Layout style={{ background: '#000', minHeight: 'calc(100vh - 64px)' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ background: '#000', minHeight: 'calc(100vh - 56px)' }}>
      <Content className="preferences-content">
        <Card style={{
          background: '#111',
          border: '1px solid #222'
        }}
        styles={{ body: { padding: '20px 16px' } }}
        >
          {/* Header */}
          <div className="preferences-header">
            <Title level={2} className="preferences-title">
              Set Your News Preferences
            </Title>
            <Text className="preferences-subtitle">
              Tell us what kind of news you're interested in
            </Text>
            <div className="preferences-accent" />
          </div>

          {error && (
            <Alert
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}

          {success && (
            <Alert
              description={success}
              type="success"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}

          {/* Form */}
          <div style={{ marginBottom: 20 }}>
            <Text style={{ color: '#888', display: 'block', marginBottom: 10, fontSize: 13 }}>
              What news are you interested in?
            </Text>
            <TextArea
              value={preferenceText}
              onChange={(e) => setPreferenceText(e.target.value)}
              placeholder="Example: AI, startups, and climate technology from the last 7 days"
              rows={5}
              disabled={submitting}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                color: '#fff',
                resize: 'none',
                fontSize: 14
              }}
            />
            <Text style={{ color: '#444', fontSize: 11, marginTop: 6, display: 'block' }}>
              Be specific about topics, categories, and timeframe
            </Text>
          </div>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            block
            size="large"
            style={{
              background: '#f5c518',
              borderColor: '#f5c518',
              color: '#000',
              height: 44,
              fontWeight: 500,
              fontSize: 14
            }}
          >
            {submitting ? 'Saving...' : 'Save Preferences'}
          </Button>

          {/* Current Preferences */}
          {currentPreferences && currentPreferences.raw_input && (
            <div className="current-prefs">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ width: 3, height: 14, background: '#f5c518', marginRight: 8 }} />
                <Text style={{ color: '#888', fontSize: 11, letterSpacing: 1 }}>
                  CURRENT PREFERENCES
                </Text>
              </div>
              <Paragraph style={{ color: '#fff', marginBottom: 6, fontSize: 13, wordBreak: 'break-word' }}>
                {currentPreferences.raw_input}
              </Paragraph>
              <Text style={{ color: '#444', fontSize: 11 }}>
                Last updated: {new Date(currentPreferences.parsed_at).toLocaleDateString()}
              </Text>
            </div>
          )}
        </Card>

        <style>{`
          .preferences-content {
            padding: 20px 16px;
            max-width: 600px;
            margin: 0 auto;
            width: 100%;
          }
          .preferences-header {
            text-align: center;
            margin-bottom: 24px;
          }
          .preferences-title {
            color: #fff !important;
            margin-bottom: 6px !important;
            font-size: 20px !important;
          }
          .preferences-subtitle {
            color: #666;
            font-size: 13px;
          }
          .preferences-accent {
            width: 40px;
            height: 3px;
            background: #f5c518;
            margin: 16px auto 0;
          }
          .current-prefs {
            margin-top: 30px;
            padding: 16px;
            background: #0a0a0a;
            border: 1px solid #222;
          }
          @media (min-width: 769px) {
            .preferences-content {
              padding: 40px 20px;
            }
            .preferences-title {
              font-size: 24px !important;
            }
            .preferences-subtitle {
              font-size: 14px;
            }
          }
        `}</style>
      </Content>
    </Layout>
  );
}

export default Preferences;
