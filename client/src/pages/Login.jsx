import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout, Typography, Form, Input, Button, Alert, Card } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Content } = Layout;
const { Title, Text } = Typography;

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(values) {
    setError('');

    try {
      setLoading(true);
      await login(values.email, values.password);
      navigate('/news');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else {
        setError(err.message || 'Failed to log in');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout style={{ background: '#000', minHeight: 'calc(100vh - 64px)' }}>
      <Content style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px'
      }}>
        <Card style={{
          background: '#111',
          border: '1px solid #222',
          width: '100%',
          maxWidth: 420,
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
              Welcome Back
            </Title>
            <Text style={{ color: '#666' }}>Log in to your account</Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Form
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#666' }} />}
                placeholder="Email"
                size="large"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  color: '#fff'
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#666' }} />}
                placeholder="Password"
                size="large"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  color: '#fff'
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
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
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: '#666' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#f5c518' }}>
                Sign up
              </Link>
            </Text>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}

export default Login;
