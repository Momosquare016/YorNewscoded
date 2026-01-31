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
      icon: <RobotOutlined style={{ fontSize: 32, color: '#f5c518' }} />,
      title: 'AI-Powered Curation',
      desc: 'Describe your interests in natural language and let AI find the perfect articles for you'
    },
    {
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#f5c518' }} />,
      title: 'Smart Summaries',
      desc: 'Get concise AI-generated summaries of every article to quickly understand the content'
    },
    {
      icon: <BookOutlined style={{ fontSize: 32, color: '#f5c518' }} />,
      title: 'Save for Later',
      desc: 'Bookmark articles you want to read later and access them anytime'
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: 32, color: '#f5c518' }} />,
      title: 'Stay Updated',
      desc: 'Get fresh news daily based on your evolving preferences'
    }
  ];

  return (
    <Layout style={{ background: '#000', minHeight: 'calc(100vh - 64px)' }}>
      <Content>
        {/* Hero Section */}
        <div style={{
          padding: '120px 60px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #000 0%, #111 100%)',
          borderBottom: '1px solid #222'
        }}>
          <Title level={1} style={{
            color: '#fff',
            fontSize: 56,
            fontWeight: 400,
            letterSpacing: 2,
            marginBottom: 24,
            fontFamily: "'Georgia', serif"
          }}>
            Your Personalized<br />News Dashboard
          </Title>
          <Paragraph style={{
            color: '#888',
            fontSize: 18,
            maxWidth: 600,
            margin: '0 auto 40px',
            lineHeight: 1.8
          }}>
            Get AI-curated news based on your interests. Stay informed with summaries powered by artificial intelligence.
          </Paragraph>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            {currentUser ? (
              <Link to="/news">
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  style={{
                    background: '#f5c518',
                    borderColor: '#f5c518',
                    color: '#000',
                    height: 50,
                    paddingInline: 40,
                    fontSize: 16,
                    fontWeight: 500
                  }}
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
                    style={{
                      background: '#f5c518',
                      borderColor: '#f5c518',
                      color: '#000',
                      height: 50,
                      paddingInline: 40,
                      fontSize: 16,
                      fontWeight: 500
                    }}
                  >
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="large"
                    style={{
                      background: 'transparent',
                      borderColor: '#444',
                      color: '#fff',
                      height: 50,
                      paddingInline: 40,
                      fontSize: 16
                    }}
                  >
                    Log In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Yellow accent line */}
          <div style={{
            width: 60,
            height: 3,
            background: '#f5c518',
            margin: '60px auto 0'
          }} />
        </div>

        {/* Features Section */}
        <div style={{ padding: '80px 60px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 50 }}>
            <div style={{ width: 4, height: 24, background: '#f5c518', marginRight: 12 }} />
            <Title level={3} style={{ color: '#fff', margin: 0, letterSpacing: 2 }}>
              FEATURES
            </Title>
          </div>

          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card
                  style={{
                    background: '#111',
                    border: '1px solid #222',
                    height: '100%'
                  }}
                  styles={{ body: { padding: 24 } }}
                >
                  <div style={{ marginBottom: 20 }}>
                    {feature.icon}
                  </div>
                  <Title level={5} style={{ color: '#fff', marginBottom: 12 }}>
                    {feature.title}
                  </Title>
                  <Text style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>
                    {feature.desc}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Footer */}
        <div style={{
          padding: '40px 60px',
          borderTop: '1px solid #222',
          textAlign: 'center'
        }}>
          <Text style={{ color: '#444' }}>
            YorNews - AI-Powered News Curation
          </Text>
        </div>
      </Content>
    </Layout>
  );
}

export default Home;
