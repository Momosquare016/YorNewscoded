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
    return (
      <Layout style={{ background: '#000', minHeight: 'calc(100vh - 64px)' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ background: '#000', minHeight: 'calc(100vh - 64px)' }}>
      <Content style={{ padding: '60px', maxWidth: 700, margin: '0 auto', width: '100%' }}>
        <Card style={{
          background: '#111',
          border: '1px solid #222'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
              Set Your News Preferences
            </Title>
            <Text style={{ color: '#666' }}>
              Tell us what kind of news you're interested in using natural language
            </Text>
            <div style={{ width: 40, height: 3, background: '#f5c518', margin: '20px auto 0' }} />
          </div>

          {error && (
            <Alert
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {success && (
            <Alert
              description={success}
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* Form */}
          <div style={{ marginBottom: 24 }}>
            <Text style={{ color: '#888', display: 'block', marginBottom: 12 }}>
              What news are you interested in?
            </Text>
            <TextArea
              value={preferenceText}
              onChange={(e) => setPreferenceText(e.target.value)}
              placeholder="Example: I want to read about AI, startups, and climate technology from the last 7 days"
              rows={6}
              disabled={submitting}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                color: '#fff',
                resize: 'none'
              }}
            />
            <Text style={{ color: '#444', fontSize: 12, marginTop: 8, display: 'block' }}>
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
              height: 48,
              fontWeight: 500
            }}
          >
            {submitting ? 'Saving...' : 'Save Preferences'}
          </Button>

          {/* Current Preferences */}
          {currentPreferences && currentPreferences.raw_input && (
            <div style={{
              marginTop: 40,
              padding: 20,
              background: '#0a0a0a',
              border: '1px solid #222'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 3, height: 16, background: '#f5c518', marginRight: 10 }} />
                <Text style={{ color: '#888', fontSize: 12, letterSpacing: 1 }}>
                  CURRENT PREFERENCES
                </Text>
              </div>
              <Paragraph style={{ color: '#fff', marginBottom: 8 }}>
                {currentPreferences.raw_input}
              </Paragraph>
              <Text style={{ color: '#444', fontSize: 12 }}>
                Last updated: {new Date(currentPreferences.parsed_at).toLocaleDateString()}
              </Text>
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  );
}

export default Preferences;
