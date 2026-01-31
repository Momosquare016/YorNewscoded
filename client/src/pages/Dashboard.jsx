import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Typography, Row, Col, Card, Tag, Button, Spin, Alert, ConfigProvider, theme } from 'antd';
import { SettingOutlined, BookOutlined, ReadOutlined } from '@ant-design/icons';
import { api } from '../utils/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [savedArticleUrls, setSavedArticleUrls] = useState(new Set());

  useEffect(() => {
    fetchNews();
    fetchSavedArticles();
  }, []);

  async function fetchNews() {
    try {
      setLoading(true);
      setError('');
      setRateLimited(false);

      const data = await api.getNews();

      if (data.rateLimited) {
        setRateLimited(true);
        setError(data.message || 'Daily limit reached. Please try again tomorrow!');
        return;
      }

      if (data.message && data.articles.length === 0) {
        setError(data.message);
      }

      setArticles(data.articles || []);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      if (err.message?.includes('limit') || err.message?.includes('tomorrow')) {
        setRateLimited(true);
      }
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

  function getCategory(article) {
    const source = article.source?.name || '';
    if (source.toLowerCase().includes('tech')) return 'TECHNOLOGY';
    if (source.toLowerCase().includes('sport')) return 'SPORTS';
    if (source.toLowerCase().includes('business')) return 'BUSINESS';
    if (source.toLowerCase().includes('health')) return 'HEALTH';
    return 'NEWS';
  }

  const featuredArticle = articles.find(a => a.urlToImage) || articles[0];
  const sideArticles = articles.filter(a => a !== featuredArticle).slice(0, 4);
  const gridArticles = articles.filter(a => a !== featuredArticle && !sideArticles.includes(a));

  const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#f5c518',
      colorBgBase: '#000000',
      colorBgContainer: '#111111',
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
      colorTextSecondary: '#888888',
      borderRadius: 2,
      fontFamily: "'Georgia', serif",
    },
  };

  return (
    <ConfigProvider theme={darkTheme}>
      <Layout style={{ minHeight: '100vh', background: '#000' }}>
        <Content style={{ padding: '40px 60px', maxWidth: 1400, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <Title level={1} style={{
              color: '#fff',
              fontSize: 42,
              fontWeight: 400,
              letterSpacing: 4,
              marginBottom: 16
            }}>
              LATEST STORIES
            </Title>
            <Text style={{ color: '#888', fontSize: 16 }}>
              <Link to="/preferences" style={{ color: '#f5c518', textDecoration: 'underline' }}>
                Set preferences
              </Link>
              {' '}for personalized news from YorNews
            </Text>
            <div style={{
              width: 40,
              height: 3,
              background: '#f5c518',
              margin: '20px auto 0'
            }} />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginBottom: 40 }}>
            <Link to="/saved">
              <Button
                icon={<BookOutlined />}
                style={{
                  background: 'transparent',
                  borderColor: '#333',
                  color: '#fff'
                }}
              >
                Saved ({savedArticleUrls.size})
              </Button>
            </Link>
            <Link to="/preferences">
              <Button
                type="primary"
                icon={<SettingOutlined />}
                style={{ background: '#f5c518', borderColor: '#f5c518', color: '#000' }}
              >
                Preferences
              </Button>
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 100 }}>
              <Spin size="large" />
              <Paragraph style={{ color: '#888', marginTop: 20 }}>
                Fetching your personalized news...
              </Paragraph>
            </div>
          )}

          {/* Rate Limited */}
          {rateLimited && (
            <Alert
              message="Daily Limit Reached"
              description="Our AI features have reached their daily limit. Please try again tomorrow!"
              type="warning"
              showIcon
              style={{ marginBottom: 40, background: '#1a1a1a', border: '1px solid #f5c518' }}
            />
          )}

          {/* Error */}
          {error && !rateLimited && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 40 }}
              action={
                error.includes('preferences') && (
                  <Link to="/preferences">
                    <Button size="small" type="primary">Set Preferences</Button>
                  </Link>
                )
              }
            />
          )}

          {/* Empty State */}
          {articles.length === 0 && !error && !loading && (
            <div style={{ textAlign: 'center', padding: 100 }}>
              <Title level={3} style={{ color: '#fff' }}>No news available</Title>
              <Text style={{ color: '#888' }}>Set your preferences to get personalized news</Text>
              <div style={{ marginTop: 20 }}>
                <Link to="/preferences">
                  <Button type="primary" style={{ background: '#f5c518', borderColor: '#f5c518', color: '#000' }}>
                    Set Preferences
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Main Content */}
          {articles.length > 0 && !loading && (
            <>
              {/* Section Header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
                <div style={{ width: 4, height: 24, background: '#f5c518', marginRight: 12 }} />
                <Title level={4} style={{ color: '#fff', margin: 0, letterSpacing: 2 }}>
                  TODAY'S PICKS
                </Title>
              </div>

              {/* Featured Layout */}
              <Row gutter={[24, 24]}>
                {/* Left Side - Small Cards */}
                <Col xs={24} md={8}>
                  {sideArticles.map((article, index) => (
                    <a
                      key={article.url || index}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        display: 'flex',
                        gap: 16,
                        marginBottom: 24,
                        cursor: 'pointer'
                      }}>
                        <img
                          src={article.urlToImage || 'https://placehold.co/100x70/111/333?text=News'}
                          alt={article.title}
                          style={{
                            width: 100,
                            height: 70,
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                          onError={(e) => { e.target.src = 'https://placehold.co/100x70/111/333?text=News'; }}
                        />
                        <div>
                          <Text style={{
                            color: '#f5c518',
                            fontSize: 11,
                            letterSpacing: 1,
                            display: 'block',
                            marginBottom: 4
                          }}>
                            {getCategory(article)}
                          </Text>
                          <Text style={{
                            color: '#fff',
                            fontSize: 14,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {article.title}
                          </Text>
                        </div>
                      </div>
                    </a>
                  ))}
                </Col>

                {/* Right Side - Featured Card */}
                <Col xs={24} md={16}>
                  {featuredArticle && (
                    <a
                      href={featuredArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{ position: 'relative', height: '100%', minHeight: 350 }}>
                        <img
                          src={featuredArticle.urlToImage || 'https://placehold.co/800x400/111/333?text=Featured'}
                          alt={featuredArticle.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            minHeight: 350,
                            objectFit: 'cover'
                          }}
                          onError={(e) => { e.target.src = 'https://placehold.co/800x400/111/333?text=Featured'; }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '60px 30px 30px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.9))'
                        }}>
                          <Tag style={{
                            background: 'transparent',
                            border: '1px solid #fff',
                            color: '#fff',
                            marginBottom: 12
                          }}>
                            {getCategory(featuredArticle)}
                          </Tag>
                          <Title level={2} style={{
                            color: '#fff',
                            margin: '0 0 16px',
                            fontSize: 28,
                            fontWeight: 400
                          }}>
                            {featuredArticle.title}
                          </Title>
                          <Button
                            icon={<ReadOutlined />}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              padding: 0,
                              fontSize: 14
                            }}
                          >
                            READ
                          </Button>
                        </div>
                      </div>
                    </a>
                  )}
                </Col>
              </Row>

              {/* More Stories Grid */}
              {gridArticles.length > 0 && (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: 60,
                    marginBottom: 30
                  }}>
                    <div style={{ width: 4, height: 24, background: '#f5c518', marginRight: 12 }} />
                    <Title level={4} style={{ color: '#fff', margin: 0, letterSpacing: 2 }}>
                      MORE STORIES
                    </Title>
                  </div>

                  <Row gutter={[24, 24]}>
                    {gridArticles.map((article, index) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={article.url || index}>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <Card
                            hoverable
                            cover={
                              <img
                                alt={article.title}
                                src={article.urlToImage || 'https://placehold.co/300x180/111/333?text=News'}
                                style={{ height: 180, objectFit: 'cover' }}
                                onError={(e) => { e.target.src = 'https://placehold.co/300x180/111/333?text=News'; }}
                              />
                            }
                            style={{
                              background: '#111',
                              border: 'none'
                            }}
                            styles={{ body: { padding: 16 } }}
                          >
                            <Text style={{
                              color: '#f5c518',
                              fontSize: 11,
                              letterSpacing: 1,
                              display: 'block',
                              marginBottom: 8
                            }}>
                              {getCategory(article)}
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
                              {article.title}
                            </Text>
                            {article.summary && article.summary !== article.description && (
                              <Text style={{
                                color: '#666',
                                fontSize: 12,
                                marginTop: 8,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {article.summary}
                              </Text>
                            )}
                          </Card>
                        </a>
                      </Col>
                    ))}
                  </Row>
                </>
              )}

              {/* Article Count */}
              <div style={{ textAlign: 'center', marginTop: 60, color: '#444' }}>
                <Text>Showing {articles.length} articles</Text>
              </div>
            </>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default Dashboard;
