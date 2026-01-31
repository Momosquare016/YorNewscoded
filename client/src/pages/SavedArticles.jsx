import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Typography, Row, Col, Card, Button, Spin, Alert, Empty } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, ReadOutlined } from '@ant-design/icons';
import { api } from '../utils/api';

const { Content } = Layout;
const { Title, Text } = Typography;

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
      console.error('Failed to remove article:', err);
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
      <Content style={{ padding: '40px 60px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <Link to="/news" style={{ color: '#666', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ArrowLeftOutlined /> Back to Dashboard
          </Link>
          <Title level={1} style={{ color: '#fff', marginBottom: 8 }}>
            Your Saved Articles
          </Title>
          <Text style={{ color: '#666' }}>
            {articles.length} {articles.length === 1 ? 'article' : 'articles'} saved
          </Text>
          <div style={{ width: 40, height: 3, background: '#f5c518', marginTop: 16 }} />
        </div>

        {error && (
          <Alert
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {articles.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: '#666' }}>No saved articles yet</span>
              }
            >
              <Text style={{ color: '#888', display: 'block', marginBottom: 20 }}>
                Start saving articles from your news feed to read them later
              </Text>
              <Link to="/news">
                <Button
                  type="primary"
                  style={{
                    background: '#f5c518',
                    borderColor: '#f5c518',
                    color: '#000'
                  }}
                >
                  Browse News
                </Button>
              </Link>
            </Empty>
          </div>
        )}

        {/* Saved Articles Grid */}
        <Row gutter={[24, 24]}>
          {articles.map((article) => {
            const articleData = article.article_data || article;
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={article.id}>
                <Card
                  style={{
                    background: '#111',
                    border: '1px solid #222',
                    height: '100%'
                  }}
                  cover={
                    <img
                      alt={articleData.title}
                      src={articleData.urlToImage || 'https://placehold.co/300x180/111/333?text=News'}
                      style={{ height: 180, objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'https://placehold.co/300x180/111/333?text=News'; }}
                    />
                  }
                  styles={{ body: { padding: 16 } }}
                  actions={[
                    <a
                      href={articleData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      key="read"
                    >
                      <Button type="text" icon={<ReadOutlined />} style={{ color: '#f5c518' }}>
                        Read
                      </Button>
                    </a>,
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveArticle(article.id)}
                      style={{ color: '#666' }}
                      key="delete"
                    >
                      Remove
                    </Button>
                  ]}
                >
                  <Text style={{
                    color: '#f5c518',
                    fontSize: 11,
                    letterSpacing: 1,
                    display: 'block',
                    marginBottom: 8
                  }}>
                    {articleData.source?.name || 'NEWS'}
                  </Text>
                  <Text style={{
                    color: '#fff',
                    fontSize: 14,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {articleData.title}
                  </Text>
                  <Text style={{
                    color: '#444',
                    fontSize: 12,
                    marginTop: 12,
                    display: 'block'
                  }}>
                    Saved {new Date(article.saved_at).toLocaleDateString()}
                  </Text>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Content>
    </Layout>
  );
}

export default SavedArticles;
