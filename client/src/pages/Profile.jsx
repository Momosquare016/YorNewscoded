import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Typography, Card, Button, Spin, Avatar, Descriptions, message, Switch, Select, TimePicker, Divider } from 'antd';
import { SettingOutlined, BookOutlined, LogoutOutlined, CameraOutlined, LoadingOutlined, MailOutlined } from '@ant-design/icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import dayjs from 'dayjs';

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

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingNewsletter, setSavingNewsletter] = useState(false);
  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [newsletterFrequency, setNewsletterFrequency] = useState('daily');
  const [newsletterDay, setNewsletterDay] = useState(1);
  const [newsletterTime, setNewsletterTime] = useState('08:00');
  const fileInputRef = useRef(null);
  const { currentUser, logout, setProfileImage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const data = await api.getProfile();
      setUserData(data.user);
      if (data.user.profile_image_url) {
        setProfileImage(data.user.profile_image_url);
      }
      // Set newsletter state from profile data
      setNewsletterEnabled(data.user.newsletter_enabled || false);
      setNewsletterFrequency(data.user.newsletter_frequency || 'daily');
      setNewsletterDay(data.user.newsletter_day ?? 1);
      setNewsletterTime(data.user.newsletter_time || '08:00');
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const storageRef = ref(storage, `profile-images/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await api.updateProfileImage(downloadURL);
      setUserData(prev => ({ ...prev, profile_image_url: downloadURL }));
      setProfileImage(downloadURL);
      message.success('Profile image updated');
    } catch (err) {
      console.error('Failed to upload image:', err);
      if (err.code === 'storage/unauthorized') {
        message.error('Storage access denied. Check Firebase Storage rules.');
      } else if (err.code === 'storage/canceled') {
        message.error('Upload was canceled');
      } else {
        message.error(err.message || 'Failed to upload image');
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleNewsletterSave() {
    setSavingNewsletter(true);
    try {
      await api.updateNewsletterSettings({
        newsletter_enabled: newsletterEnabled,
        newsletter_frequency: newsletterFrequency,
        newsletter_day: newsletterDay,
        newsletter_time: newsletterTime,
      });
      message.success(newsletterEnabled ? 'Newsletter enabled!' : 'Newsletter disabled');
    } catch (err) {
      console.error('Failed to update newsletter settings:', err);
      message.error('Failed to update newsletter settings');
    } finally {
      setSavingNewsletter(false);
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
      <Layout style={{ background: '#000', minHeight: 'calc(100vh - 56px)' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ background: '#000', minHeight: 'calc(100vh - 56px)' }}>
      <Content className="profile-content">
        <Card style={{
          background: '#111',
          border: '1px solid #222'
        }}
        styles={{ body: { padding: '24px 16px' } }}
        >
          {/* Profile Header */}
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              <Avatar
                size={80}
                src={userData?.profile_image_url}
                style={{
                  background: '#f5c518',
                  color: '#000',
                  fontSize: 32
                }}
              >
                {!userData?.profile_image_url && currentUser?.email?.charAt(0).toUpperCase()}
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <Button
                shape="circle"
                size="small"
                icon={uploading ? <LoadingOutlined /> : <CameraOutlined />}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: '#f5c518',
                  borderColor: '#f5c518',
                  color: '#000'
                }}
              />
            </div>
            <Title level={2} style={{ color: '#fff', marginBottom: 6, fontSize: 22 }}>
              Profile
            </Title>
            <div style={{ width: 40, height: 3, background: '#f5c518', margin: '0 auto' }} />
          </div>

          {/* Profile Info */}
          <Descriptions
            column={1}
            labelStyle={{ color: '#666', width: 100, fontSize: 13 }}
            contentStyle={{ color: '#fff', fontSize: 13, wordBreak: 'break-word' }}
            style={{ marginBottom: 30 }}
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

          {/* Newsletter Settings */}
          <Divider style={{ borderColor: '#222', margin: '0 0 20px' }} />
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <MailOutlined style={{ color: '#f5c518', fontSize: 16 }} />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: 500 }}>Newsletter</Text>
            </div>

            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 4,
              padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: newsletterEnabled ? 16 : 0 }}>
                <Text style={{ color: '#ccc', fontSize: 13 }}>Email news digest</Text>
                <Switch
                  checked={newsletterEnabled}
                  onChange={(checked) => setNewsletterEnabled(checked)}
                  style={{ background: newsletterEnabled ? '#f5c518' : '#333' }}
                />
              </div>

              {newsletterEnabled && (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 6 }}>Frequency</Text>
                    <Select
                      value={newsletterFrequency}
                      onChange={(val) => setNewsletterFrequency(val)}
                      style={{ width: '100%' }}
                      options={[
                        { value: 'daily', label: 'Once a day' },
                        { value: 'weekly', label: 'Once a week' },
                      ]}
                    />
                  </div>

                  {newsletterFrequency === 'weekly' && (
                    <div style={{ marginBottom: 12 }}>
                      <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 6 }}>Day of the week</Text>
                      <Select
                        value={newsletterDay}
                        onChange={(val) => setNewsletterDay(val)}
                        style={{ width: '100%' }}
                        options={DAY_OPTIONS}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 6 }}>Time (UTC)</Text>
                    <TimePicker
                      value={dayjs(newsletterTime, 'HH:mm')}
                      onChange={(val) => setNewsletterTime(val ? val.format('HH:mm') : '08:00')}
                      format="HH:mm"
                      minuteStep={15}
                      style={{
                        width: '100%',
                        background: '#1a1a1a',
                        border: '1px solid #333',
                      }}
                    />
                  </div>

                  <Button
                    onClick={handleNewsletterSave}
                    loading={savingNewsletter}
                    block
                    style={{
                      background: '#f5c518',
                      borderColor: '#f5c518',
                      color: '#000',
                      height: 36,
                      fontSize: 13,
                      fontWeight: 500,
                      marginTop: 4,
                    }}
                  >
                    Save Newsletter Settings
                  </Button>
                </div>
              )}

              {!newsletterEnabled && (
                <Button
                  onClick={handleNewsletterSave}
                  loading={savingNewsletter}
                  size="small"
                  style={{
                    background: 'transparent',
                    borderColor: '#333',
                    color: '#888',
                    fontSize: 12,
                    marginTop: 10,
                  }}
                >
                  Save
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/preferences">
              <Button
                icon={<SettingOutlined />}
                block
                size="large"
                style={{
                  background: '#f5c518',
                  borderColor: '#f5c518',
                  color: '#000',
                  height: 44,
                  fontSize: 14
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
                  height: 44,
                  fontSize: 14
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
              style={{ height: 44, fontSize: 14 }}
            >
              Logout
            </Button>
          </div>
        </Card>

        <style>{`
          .profile-content {
            padding: 20px 16px;
            max-width: 500px;
            margin: 0 auto;
            width: 100%;
          }
          @media (min-width: 769px) {
            .profile-content {
              padding: 40px 20px;
            }
          }
        `}</style>
      </Content>
    </Layout>
  );
}

export default Profile;
