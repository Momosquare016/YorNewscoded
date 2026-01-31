import { Link } from 'react-router-dom';
import { Layout, Typography, Button, Row, Col, Card } from 'antd';
import { RobotOutlined, FileTextOutlined, BookOutlined, ThunderboltOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

function Home() {
  const { currentUser } = useAuth();

  const features = [
    {
      icon: <RobotOutlined style={{ fontSize: 24, color: '#f5c518' }} />,
      title: 'AI-Powered Curation',
      desc: 'Describe your interests and let AI find perfect articles'
    },
    {
      icon: <FileTextOutlined style={{ fontSize: 24, color: '#f5c518' }} />,
      title: 'Smart Summaries',
      desc: 'Get concise AI-generated summaries of every article'
    },
    {
      icon: <BookOutlined style={{ fontSize: 24, color: '#f5c518' }} />,
      title: 'Save for Later',
      desc: 'Bookmark articles to read later and access them anytime'
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#f5c518' }} />,
      title: 'Stay Updated',
      desc: 'Get fresh news daily based on your preferences'
    }
  ];

  return (
    <Layout style={{ background: '#000', minHeight: 'calc(100vh - 56px)' }}>
      <Content>
        {/* Hero Section */}
        <div className="hero-section">
          <Title level={1} className="hero-title">
            Your Personalized<br />News Dashboard
          </Title>
          <Paragraph className="hero-subtitle">
            Get AI-curated news based on your interests. Stay informed with summaries powered by artificial intelligence.
          </Paragraph>

          {/* CTA Buttons */}
          <div className="hero-buttons">
            {currentUser ? (
              <Link to="/news">
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  className="hero-btn-primary"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button
                    type="primary"
                    size="large"
                    className="hero-btn-primary"
                  >
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="large"
                    className="hero-btn-secondary"
                  >
                    Log In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Yellow accent line */}
          <div className="hero-accent" />
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="features-header">
            <div className="features-bar" />
            <Title level={3} style={{ color: '#fff', margin: 0, letterSpacing: 1, fontSize: 14 }}>
              FEATURES
            </Title>
          </div>

          <Row gutter={[16, 16]}>
            {features.map((feature, index) => (
              <Col xs={12} sm={12} md={6} key={index}>
                <Card
                  style={{
                    background: '#111',
                    border: '1px solid #222',
                    height: '100%'
                  }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div style={{ marginBottom: 12 }}>
                    {feature.icon}
                  </div>
                  <Title level={5} className="feature-title">
                    {feature.title}
                  </Title>
                  <Text className="feature-desc">
                    {feature.desc}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Footer */}
        <div className="home-footer">
          <Text style={{ color: '#444', fontSize: 12 }}>
            YorNews - AI-Powered News Curation
          </Text>
        </div>

        <style>{`
          .hero-section {
            padding: 60px 20px;
            text-align: center;
            background: linear-gradient(180deg, #000 0%, #111 100%);
            border-bottom: 1px solid #222;
          }
          .hero-title {
            color: #fff !important;
            font-size: 28px !important;
            font-weight: 400 !important;
            font-family: 'UnifrakturMaguntia', cursive !important;
            margin-bottom: 16px !important;
            line-height: 1.3 !important;
          }
          .hero-subtitle {
            color: #888 !important;
            font-size: 14px !important;
            max-width: 500px;
            margin: 0 auto 30px !important;
            line-height: 1.6 !important;
            padding: 0 10px;
          }
          .hero-buttons {
            display: flex;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
          }
          .hero-btn-primary {
            background: #f5c518 !important;
            border-color: #f5c518 !important;
            color: #000 !important;
            height: 44px !important;
            padding-inline: 24px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
          }
          .hero-btn-secondary {
            background: transparent !important;
            border-color: #444 !important;
            color: #fff !important;
            height: 44px !important;
            padding-inline: 24px !important;
            font-size: 14px !important;
          }
          .hero-accent {
            width: 50px;
            height: 3px;
            background: #f5c518;
            margin: 40px auto 0;
          }
          .features-section {
            padding: 40px 16px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .features-header {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
          }
          .features-bar {
            width: 4px;
            height: 20px;
            background: #f5c518;
            margin-right: 10px;
          }
          .feature-title {
            color: #fff !important;
            margin-bottom: 8px !important;
            font-size: 13px !important;
            word-break: break-word;
          }
          .feature-desc {
            color: #666;
            font-size: 12px;
            line-height: 1.5;
            display: block;
          }
          .home-footer {
            padding: 30px 16px;
            border-top: 1px solid #222;
            text-align: center;
          }
          @media (min-width: 769px) {
            .hero-section {
              padding: 100px 60px;
            }
            .hero-title {
              font-size: 48px !important;
            }
            .hero-subtitle {
              font-size: 18px !important;
              margin-bottom: 40px !important;
            }
            .hero-btn-primary, .hero-btn-secondary {
              height: 50px !important;
              padding-inline: 40px !important;
              font-size: 16px !important;
            }
            .hero-accent {
              margin-top: 60px;
            }
            .features-section {
              padding: 60px 60px;
            }
            .feature-title {
              font-size: 15px !important;
            }
            .feature-desc {
              font-size: 14px;
            }
            .home-footer {
              padding: 40px 60px;
            }
          }
        `}</style>
      </Content>
    </Layout>
  );
}

export default Home;
