import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Typography, Card, Button, Spin, Avatar, Descriptions } from 'antd';
import { SettingOutlined, BookOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const { Content } = Layout;
const { Title } = Typography;

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const data = await api.getProfile();
      setUserData(data.user);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
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
      <Content style={{ padding: '60px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <Card style={{
          background: '#111',
          border: '1px solid #222'
        }}>
          {/* Profile Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Avatar
              size={100}
              style={{
                background: '#f5c518',
                color: '#000',
                fontSize: 40,
                marginBottom: 20
              }}
            >
              {currentUser?.email?.charAt(0).toUpperCase()}
            </Avatar>
            <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
              Profile
            </Title>
            <div style={{ width: 40, height: 3, background: '#f5c518', margin: '0 auto' }} />
          </div>

          {/* Profile Info */}
          <Descriptions
            column={1}
            labelStyle={{ color: '#666', width: 150 }}
            contentStyle={{ color: '#fff' }}
            style={{ marginBottom: 40 }}
          >
            <Descriptions.Item label="Email">
              {currentUser?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Member Since">
              {userData?.created_at
                ? new Date(userData.created_at).toLocaleDateString()
                : 'Unknown'}
            </Descriptions.Item>
            {userData?.preferences && (
              <Descriptions.Item label="Preferences">
                {userData.preferences.raw_input || 'Not set'}
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/preferences">
              <Button
                icon={<SettingOutlined />}
                block
                size="large"
                style={{
                  background: '#f5c518',
                  borderColor: '#f5c518',
                  color: '#000',
                  height: 48
                }}
              >
                Edit Preferences
              </Button>
            </Link>
            <Link to="/saved">
              <Button
                icon={<BookOutlined />}
                block
                size="large"
                style={{
                  background: 'transparent',
                  borderColor: '#333',
                  color: '#fff',
                  height: 48
                }}
              >
                View Saved Articles
              </Button>
            </Link>
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              block
              size="large"
              danger
              style={{ height: 48 }}
            >
              Logout
            </Button>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}

export default Profile;
