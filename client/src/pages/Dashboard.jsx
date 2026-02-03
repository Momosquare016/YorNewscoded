import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Layout, Typography, Row, Col, Card, Tag, Button, Spin, Alert, ConfigProvider, theme } from 'antd';
import { SettingOutlined, BookOutlined, ReadOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { api } from '../utils/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [savedArticleUrls, setSavedArticleUrls] = useState(new Set());
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchNews(true);
    fetchSavedArticles();
  }, []);

  // Fetch news using specific preferences (bypasses DB replication lag)
  async function fetchNewsWithPreferences(preferences) {
    try {
      setLoading(true);
      setError('');
      setRateLimited(false);

      const data = await api.getNews(true, preferences);

      if (data.rateLimited) {
        setRateLimited(true);
        setError(data.message || 'Daily limit reached. Please try again tomorrow!');
        return;
      }

      if (data.message && data.articles.length === 0) {
        setError(data.message);
      }

      setArticles(data.articles || []);
      // Clear localStorage since we successfully fetched with new prefs
      localStorage.removeItem('lastSavedPreferences');
    } catch (err) {
      console.error('Failed to fetch news with preferences:', err);
      // Fallback to normal fetch
      fetchNews(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNews(forceRefresh = false) {
    try {
      setLoading(true);
      setError('');
      setRateLimited(false);

      // Check for fresh preferences from Preferences page (avoids DB replication lag)
      const freshData = sessionStorage.getItem('freshPreferences');
      let data;

      if (freshData) {
        const { preferences, timestamp } = JSON.parse(freshData);
        const ageInSeconds = (Date.now() - timestamp) / 1000;

        // Only use if less than 30 seconds old
        if (ageInSeconds < 30) {
          sessionStorage.removeItem('freshPreferences');
          data = await api.getNews(true, preferences);
        } else {
          sessionStorage.removeItem('freshPreferences');
          data = await api.getNews(forceRefresh);
        }
      } else {
        data = await api.getNews(forceRefresh);
      }

      if (!data) {
        data = await api.getNews(forceRefresh);
      }

      if (data.rateLimited) {
        setRateLimited(true);
        setError(data.message || 'Daily limit reached. Please try again tomorrow!');
        return;
      }

      // If no preferences set, redirect to preferences page
      if (data.message && data.message.includes('preferences') && data.articles.length === 0) {
        navigate('/preferences');
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
        <Content className="dashboard-content">

          {/* Header */}
          <div className="dashboard-header">
            <Title level={1} className="dashboard-title">
              Your News
            </Title>
            <Text className="dashboard-subtitle">
              Personalized stories based on your{' '}
              <Link to="/preferences" style={{ color: '#f5c518', textDecoration: 'underline' }}>
                preferences
              </Link>
            </Text>
            <div className="dashboard-accent" />
          </div>

          {/* Action Buttons */}
          <div className="dashboard-actions">
            <Link to="/saved">
              <Button
                icon={<BookOutlined />}
                className="action-btn"
              >
                Saved ({savedArticleUrls.size})
              </Button>
            </Link>
            <Link to="/preferences">
              <Button
                type="primary"
                icon={<SettingOutlined />}
                className="action-btn-primary"
              >
                Preferences
              </Button>
            </Link>
          </div>

          <style>{`
            .dashboard-content {
              padding: 20px 16px;
              max-width: 1400px;
              margin: 0 auto;
            }
            .dashboard-header {
              text-align: center;
              margin-bottom: 30px;
            }
            .dashboard-title {
              color: #fff !important;
              font-size: 28px !important;
              font-weight: 400 !important;
              letter-spacing: 2px !important;
              margin-bottom: 12px !important;
            }
            .dashboard-subtitle {
              color: #888;
              font-size: 14px;
            }
            .dashboard-accent {
              width: 40px;
              height: 3px;
              background: #f5c518;
              margin: 16px auto 0;
            }
            .dashboard-actions {
              display: flex;
              justify-content: center;
              gap: 12px;
              margin-bottom: 30px;
              flex-wrap: wrap;
            }
            .action-btn {
              background: transparent;
              border-color: #333;
              color: #fff;
              font-size: 13px;
            }
            .action-btn-primary {
              background: #f5c518;
              border-color: #f5c518;
              color: #000;
              font-size: 13px;
            }
            .section-header {
              display: flex;
              align-items: center;
              margin-bottom: 20px;
            }
            .section-bar {
              width: 4px;
              height: 20px;
              background: #f5c518;
              margin-right: 10px;
            }
            .side-article {
              display: flex;
              gap: 12px;
              margin-bottom: 16px;
            }
            .side-article-img {
              width: 80px;
              height: 56px;
              object-fit: cover;
              flex-shrink: 0;
            }
            .side-article-category {
              color: #f5c518;
              font-size: 10px;
              letter-spacing: 1px;
              display: block;
              margin-bottom: 4px;
            }
            .side-article-title {
              color: #fff;
              font-size: 13px;
              line-height: 1.3;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              word-break: break-word;
            }
            .featured-overlay {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 40px 20px 20px;
              background: linear-gradient(transparent, rgba(0,0,0,0.9));
            }
            .featured-title {
              color: #fff !important;
              margin: 0 0 12px !important;
              font-size: 20px !important;
              font-weight: 400 !important;
              word-break: break-word;
            }
            .grid-card-title {
              color: #fff;
              font-size: 13px;
              line-height: 1.4;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
              word-break: break-word;
            }
            .grid-card-summary {
              color: #666;
              font-size: 11px;
              margin-top: 8px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            @media (min-width: 769px) {
              .dashboard-content {
                padding: 40px 60px;
              }
              .dashboard-header {
                margin-bottom: 50px;
              }
              .dashboard-title {
                font-size: 38px !important;
              }
              .dashboard-subtitle {
                font-size: 16px;
              }
              .dashboard-actions {
                justify-content: flex-end;
                margin-bottom: 40px;
              }
              .action-btn, .action-btn-primary {
                font-size: 14px;
              }
              .side-article-img {
                width: 100px;
                height: 70px;
              }
              .side-article-title {
                font-size: 14px;
              }
              .featured-overlay {
                padding: 60px 30px 30px;
              }
              .featured-title {
                font-size: 28px !important;
              }
              .grid-card-title {
                font-size: 14px;
              }
              .grid-card-summary {
                font-size: 12px;
              }
            }
          `}</style>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 100 }}>
              <Spin size="large" />
              <Paragraph style={{ color: '#888', marginTop: 20 }}>
                Fetching your personalized news...
              </Paragraph>
              <Paragraph style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                This may take a moment, please wait.
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

          {/* Error - only show for actual errors, not missing preferences */}
          {error && !rateLimited && !error.includes('preferences') && (
            <Alert
              message={error.includes('connect') ? 'Connection Error' : 'Error'}
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 40 }}
              action={
                error.includes('connect') && (
                  <Button size="small" onClick={fetchNews}>Retry</Button>
                )
              }
            />
          )}

          {/* Empty State */}
          {articles.length === 0 && !error && !loading && (
            <div style={{ textAlign: 'center', padding: 100 }}>
              <Title level={3} style={{ color: '#fff' }}>No articles found</Title>
              <Text style={{ color: '#888' }}>Try adjusting your preferences for different results</Text>
              <div style={{ marginTop: 20 }}>
                <Link to="/preferences">
                  <Button type="primary" style={{ background: '#f5c518', borderColor: '#f5c518', color: '#000' }}>
                    Update Preferences
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Main Content */}
          {articles.length > 0 && !loading && (
            <>
              {/* Section Header */}
              <div className="section-header">
                <div className="section-bar" />
                <Title level={4} style={{ color: '#fff', margin: 0, letterSpacing: 1, fontSize: 14 }}>
                  TOP PICKS FOR YOU
                </Title>
              </div>

              {/* Featured Layout */}
              <Row gutter={[16, 16]}>
                {/* Left Side - Small Cards */}
                <Col xs={24} md={8}>
                  {sideArticles.map((article, index) => (
                    <div key={article.url || index} className="side-article">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={article.urlToImage || 'https://placehold.co/100x70/111/333?text=News'}
                          alt={article.title}
                          className="side-article-img"
                          onError={(e) => { e.target.src = 'https://placehold.co/100x70/111/333?text=News'; }}
                        />
                      </a>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text className="side-article-category">
                          {getCategory(article)}
                        </Text>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <Text className="side-article-title">
                            {article.title}
                          </Text>
                        </a>
                        <Button
                          type="text"
                          size="small"
                          icon={savedArticleUrls.has(article.url) ? <HeartFilled style={{ color: '#f5c518' }} /> : <HeartOutlined />}
                          onClick={() => handleSaveArticle(article)}
                          disabled={savedArticleUrls.has(article.url)}
                          style={{
                            color: savedArticleUrls.has(article.url) ? '#f5c518' : '#666',
                            padding: 0,
                            marginTop: 4,
                            height: 'auto',
                            fontSize: 12
                          }}
                        >
                          {savedArticleUrls.has(article.url) ? 'Saved' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </Col>

                {/* Right Side - Featured Card */}
                <Col xs={24} md={16}>
                  {featuredArticle && (
                    <div style={{ position: 'relative', height: '100%', minHeight: 250 }}>
                      <a
                        href={featuredArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={featuredArticle.urlToImage || 'https://placehold.co/800x400/111/333?text=Featured'}
                          alt={featuredArticle.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            minHeight: 250,
                            objectFit: 'cover'
                          }}
                          onError={(e) => { e.target.src = 'https://placehold.co/800x400/111/333?text=Featured'; }}
                        />
                      </a>
                      <div className="featured-overlay">
                        <Tag style={{
                          background: 'transparent',
                          border: '1px solid #fff',
                          color: '#fff',
                          marginBottom: 10,
                          fontSize: 10
                        }}>
                          {getCategory(featuredArticle)}
                        </Tag>
                        <a
                          href={featuredArticle.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <Title level={2} className="featured-title">
                            {featuredArticle.title}
                          </Title>
                        </a>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <a
                            href={featuredArticle.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              icon={<ReadOutlined />}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                padding: 0,
                                fontSize: 12
                              }}
                            >
                              READ
                            </Button>
                          </a>
                          <Button
                            icon={savedArticleUrls.has(featuredArticle.url) ? <HeartFilled /> : <HeartOutlined />}
                            onClick={() => handleSaveArticle(featuredArticle)}
                            disabled={savedArticleUrls.has(featuredArticle.url)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: savedArticleUrls.has(featuredArticle.url) ? '#f5c518' : '#fff',
                              padding: 0,
                              fontSize: 12
                            }}
                          >
                            {savedArticleUrls.has(featuredArticle.url) ? 'SAVED' : 'SAVE'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Col>
              </Row>

              {/* More Stories Grid */}
              {gridArticles.length > 0 && (
                <>
                  <div className="section-header" style={{ marginTop: 40 }}>
                    <div className="section-bar" />
                    <Title level={4} style={{ color: '#fff', margin: 0, letterSpacing: 1, fontSize: 14 }}>
                      MORE STORIES
                    </Title>
                  </div>

                  <Row gutter={[12, 12]}>
                    {gridArticles.map((article, index) => (
                      <Col xs={12} sm={12} md={8} lg={6} key={article.url || index}>
                        <Card
                          hoverable
                          cover={
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                alt={article.title}
                                src={article.urlToImage || 'https://placehold.co/300x180/111/333?text=News'}
                                style={{ height: 120, objectFit: 'cover', width: '100%' }}
                                onError={(e) => { e.target.src = 'https://placehold.co/300x180/111/333?text=News'; }}
                              />
                            </a>
                          }
                          style={{
                            background: '#111',
                            border: 'none'
                          }}
                          styles={{ body: { padding: 10 } }}
                        >
                          <Text style={{
                            color: '#f5c518',
                            fontSize: 9,
                            letterSpacing: 1,
                            display: 'block',
                            marginBottom: 6
                          }}>
                            {getCategory(article)}
                          </Text>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <Text className="grid-card-title">
                              {article.title}
                            </Text>
                          </a>
                          {article.summary && article.summary !== article.description && (
                            <Text className="grid-card-summary">
                              {article.summary}
                            </Text>
                          )}
                          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              type="text"
                              size="small"
                              icon={savedArticleUrls.has(article.url) ? <HeartFilled style={{ color: '#f5c518' }} /> : <HeartOutlined />}
                              onClick={() => handleSaveArticle(article)}
                              disabled={savedArticleUrls.has(article.url)}
                              style={{ color: savedArticleUrls.has(article.url) ? '#f5c518' : '#888', fontSize: 11, padding: '0 4px' }}
                            >
                              {savedArticleUrls.has(article.url) ? 'Saved' : 'Save'}
                            </Button>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              )}

              {/* Article Count */}
              <div style={{ textAlign: 'center', marginTop: 40, color: '#444' }}>
                <Text style={{ fontSize: 12 }}>Showing {articles.length} articles</Text>
              </div>
            </>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default Dashboard;
