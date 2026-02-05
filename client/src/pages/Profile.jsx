import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Typography, Card, Button, Spin, Avatar, Descriptions, message } from 'antd';
import { SettingOutlined, BookOutlined, LogoutOutlined, CameraOutlined, LoadingOutlined } from '@ant-design/icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const { Content } = Layout;
const { Title } = Typography;

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create storage reference with user's UID
      const storageRef = ref(storage, `profile-images/${currentUser.uid}`);

      // Upload file to Firebase Storage
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Save URL to database
      await api.updateProfileImage(downloadURL);

      // Update local state
      setUserData(prev => ({ ...prev, profile_image_url: downloadURL }));
      setProfileImage(downloadURL);

      message.success('Profile image updated');
    } catch (err) {
      console.error('Failed to upload image:', err);
      if (err.code === 'storage/unauthorized') {
        message.error('Storage access denied. Check Firebase Storage rules.');
      } else if (err.code === 'storage/canceled') {
        message.error('Upload was canceled');
      } else if (err.code === 'storage/unknown') {
        message.error('Unknown storage error. Check console for details.');
      } else {
        message.error(err.message || 'Failed to upload image');
      }
    } finally {
      setUploading(false);
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
