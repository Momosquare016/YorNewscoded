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
    <Layout style={{ background: '#000', minHeight: 'calc(100vh - 56px)' }}>
      <Content className="saved-content">
        {/* Header */}
        <div className="saved-header">
          <Link to="/news" className="back-link">
            <ArrowLeftOutlined /> Back to Dashboard
          </Link>
          <Title level={1} className="saved-title">
            Your Saved Articles
          </Title>
          <Text style={{ color: '#666', fontSize: 13 }}>
            {articles.length} {articles.length === 1 ? 'article' : 'articles'} saved
          </Text>
          <div className="saved-accent" />
        </div>

        {error && (
          <Alert
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        {articles.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: '#666', fontSize: 13 }}>No saved articles yet</span>
              }
            >
              <Text style={{ color: '#888', display: 'block', marginBottom: 16, fontSize: 13 }}>
                Start saving articles from your news feed
              </Text>
              <Link to="/news">
                <Button
                  type="primary"
                  style={{
                    background: '#f5c518',
                    borderColor: '#f5c518',
                    color: '#000',
                    fontSize: 13
                  }}
                >
                  Browse News
                </Button>
              </Link>
            </Empty>
          </div>
        )}

        {/* Saved Articles Grid */}
        <Row gutter={[12, 12]}>
          {articles.map((article) => {
            const articleData = article.article_data || article;
            return (
              <Col xs={12} sm={12} md={8} lg={6} key={article.id}>
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
                      style={{ height: 100, objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'https://placehold.co/300x180/111/333?text=News'; }}
                    />
                  }
                  styles={{ body: { padding: 10 } }}
                  actions={[
                    <a
                      href={articleData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      key="read"
                    >
                      <Button type="text" size="small" icon={<ReadOutlined />} style={{ color: '#f5c518', fontSize: 11 }}>
                        Read
                      </Button>
                    </a>,
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveArticle(article.id)}
                      style={{ color: '#666', fontSize: 11 }}
                      key="delete"
                    >
                      Remove
                    </Button>
                  ]}
                >
                  <Text className="saved-card-category">
                    {articleData.source?.name || 'NEWS'}
                  </Text>
                  <Text className="saved-card-title">
                    {articleData.title}
                  </Text>
                  <Text className="saved-card-date">
                    Saved {new Date(article.saved_at).toLocaleDateString()}
                  </Text>
                </Card>
              </Col>
            );
          })}
        </Row>

        <style>{`
          .saved-content {
            padding: 20px 16px;
            max-width: 1400px;
            margin: 0 auto;
          }
          .saved-header {
            margin-bottom: 24px;
          }
          .back-link {
            color: #666;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 12px;
            font-size: 13px;
          }
          .saved-title {
            color: #fff !important;
            margin-bottom: 6px !important;
            font-size: 22px !important;
          }
          .saved-accent {
            width: 40px;
            height: 3px;
            background: #f5c518;
            margin-top: 12px;
          }
          .saved-card-category {
            color: #f5c518;
            font-size: 9px;
            letter-spacing: 1px;
            display: block;
            margin-bottom: 6px;
          }
          .saved-card-title {
            color: #fff;
            font-size: 12px;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            word-break: break-word;
          }
          .saved-card-date {
            color: #444;
            font-size: 10px;
            margin-top: 8px;
            display: block;
          }
          @media (min-width: 769px) {
            .saved-content {
              padding: 40px 60px;
            }
            .saved-title {
              font-size: 28px !important;
            }
            .saved-card-category {
              font-size: 11px;
            }
            .saved-card-title {
              font-size: 14px;
            }
            .saved-card-date {
              font-size: 12px;
            }
          }
        `}</style>
      </Content>
    </Layout>
  );
}

export default SavedArticles;
