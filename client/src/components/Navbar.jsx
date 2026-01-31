import { Link, useNavigate } from 'react-router-dom';
import { Layout, Button, Space, Typography } from 'antd';
import { ReadOutlined, BookOutlined, SettingOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header } = Layout;
const { Text } = Typography;

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  return (
    <Header style={{
      background: '#000',
      borderBottom: '1px solid #222',
      padding: '0 60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      height: 64
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32,
          height: 32,
          background: '#f5c518',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 18 }}>Y</Text>
        </div>
        <Text style={{
          color: '#fff',
          fontSize: 18,
          fontWeight: 400,
          letterSpacing: 2,
          fontFamily: "'Georgia', serif"
        }}>
          YORNEWS
        </Text>
      </Link>

      {/* Navigation Links */}
      <Space size="middle">
        {currentUser ? (
          <>
            <Link to="/news">
              <Button type="text" icon={<ReadOutlined />} style={{ color: '#888' }}>
                Dashboard
              </Button>
            </Link>
            <Link to="/saved">
              <Button type="text" icon={<BookOutlined />} style={{ color: '#888' }}>
                Saved
              </Button>
            </Link>
            <Link to="/preferences">
              <Button type="text" icon={<SettingOutlined />} style={{ color: '#888' }}>
                Preferences
              </Button>
            </Link>
            <Link to="/profile">
              <Button type="text" icon={<UserOutlined />} style={{ color: '#888' }}>
                Profile
              </Button>
            </Link>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ color: '#888' }}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/login">
              <Button type="text" style={{ color: '#fff' }}>
                LOGIN
              </Button>
            </Link>
            <Link to="/register">
              <Button
                type="primary"
                style={{
                  background: '#f5c518',
                  borderColor: '#f5c518',
                  color: '#000',
                  fontWeight: 500
                }}
              >
                SUBSCRIBE
              </Button>
            </Link>
          </>
        )}
      </Space>
    </Header>
  );
}

export default Navbar;
