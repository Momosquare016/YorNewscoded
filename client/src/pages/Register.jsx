import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout, Typography, Form, Input, Button, Alert, Card } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Content } = Layout;
const { Title, Text } = Typography;

function Register() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(values) {
    setError('');

    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await signup(values.email, values.password);
      navigate('/preferences');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout style={{ background: '#000', minHeight: 'calc(100vh - 56px)' }}>
      <Content style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 16px'
      }}>
        <Card style={{
          background: '#111',
          border: '1px solid #222',
          width: '100%',
          maxWidth: 400
        }}
        styles={{ body: { padding: '24px 16px' } }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2} style={{ color: '#fff', marginBottom: 6, fontSize: 22 }}>
              Create Account
            </Title>
            <Text style={{ color: '#666', fontSize: 13 }}>Join YorNews today</Text>
          </div>

          {error && (
            <Alert
              description={error}
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
              rules={[
                { required: true, message: 'Please enter a password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#666' }} />}
                placeholder="Password (min 6 characters)"
                size="large"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  color: '#fff'
                }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              rules={[{ required: true, message: 'Please confirm your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#666' }} />}
                placeholder="Confirm password"
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
                  height: 44,
                  fontWeight: 500,
                  fontSize: 14
                }}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: '#666', fontSize: 13 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#f5c518' }}>
                Log in
              </Link>
            </Text>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}

export default Register;
