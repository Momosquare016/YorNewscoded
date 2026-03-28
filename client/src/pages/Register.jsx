import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout, Typography, Form, Input, Button, Alert, Card, Checkbox, Select, TimePicker } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const { Content } = Layout;
const { Title, Text } = Typography;

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

function Register() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [frequency, setFrequency] = useState('daily');

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

      // Save newsletter settings if opted in
      if (newsletterEnabled) {
        try {
          const timeVal = values.newsletter_time;
          const timeStr = timeVal ? timeVal.format('HH:mm') : '08:00';
          await api.updateNewsletterSettings({
            newsletter_enabled: true,
            newsletter_frequency: values.newsletter_frequency || 'daily',
            newsletter_day: values.newsletter_day ?? 1,
            newsletter_time: timeStr,
          });
        } catch (err) {
          console.warn('Newsletter settings save failed:', err.message);
        }
      }

      navigate('/preferences');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters');
      } else if (err.message?.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please try again later.');
      } else {
        setError(err.message || 'Failed to create account');
      }
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
          maxWidth: 420
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
            initialValues={{
              newsletter_frequency: 'daily',
              newsletter_day: 1,
            }}
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

            {/* Newsletter Opt-in */}
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 4,
              padding: '14px 14px 4px',
              marginBottom: 20,
            }}>
              <Checkbox
                checked={newsletterEnabled}
                onChange={(e) => setNewsletterEnabled(e.target.checked)}
                style={{ color: '#fff', fontSize: 13 }}
              >
                <span style={{ color: '#fff' }}>Send me a news digest via email</span>
              </Checkbox>

              {newsletterEnabled && (
                <div style={{ marginTop: 14, paddingLeft: 4 }}>
                  <Form.Item
                    name="newsletter_frequency"
                    label={<span style={{ color: '#888', fontSize: 12 }}>Frequency</span>}
                    style={{ marginBottom: 12 }}
                  >
                    <Select
                      onChange={(val) => setFrequency(val)}
                      style={{ width: '100%' }}
                      options={[
                        { value: 'daily', label: 'Once a day' },
                        { value: 'weekly', label: 'Once a week' },
                      ]}
                    />
                  </Form.Item>

                  {frequency === 'weekly' && (
                    <Form.Item
                      name="newsletter_day"
                      label={<span style={{ color: '#888', fontSize: 12 }}>Day of the week</span>}
                      style={{ marginBottom: 12 }}
                    >
                      <Select
                        style={{ width: '100%' }}
                        options={DAY_OPTIONS}
                      />
                    </Form.Item>
                  )}

                  <Form.Item
                    name="newsletter_time"
                    label={<span style={{ color: '#888', fontSize: 12 }}>Time (UTC)</span>}
                    style={{ marginBottom: 12 }}
                  >
                    <TimePicker
                      format="HH:mm"
                      minuteStep={15}
                      style={{
                        width: '100%',
                        background: '#1a1a1a',
                        border: '1px solid #333',
                      }}
                      placeholder="08:00"
                    />
                  </Form.Item>
                </div>
              )}
            </div>

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
