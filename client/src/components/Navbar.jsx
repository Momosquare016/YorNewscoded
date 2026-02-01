import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Button, Space, Typography, Drawer } from 'antd';
import { ReadOutlined, BookOutlined, SettingOutlined, UserOutlined, LogoutOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header } = Layout;
const { Text } = Typography;

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  const navLinks = currentUser ? [
    { to: '/news', icon: <ReadOutlined />, label: 'Dashboard' },
    { to: '/saved', icon: <BookOutlined />, label: 'Saved' },
    { to: '/preferences', icon: <SettingOutlined />, label: 'Preferences' },
    { to: '/profile', icon: <UserOutlined />, label: 'Profile' },
  ] : [];

  return (
    <>
      <Header style={{
        background: '#000',
        borderBottom: '1px solid #222',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        height: 56
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 28,
            height: 28,
            background: '#f5c518',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text style={{
              color: '#000',
              fontWeight: 'bold',
              fontSize: 16
            }}>Y</Text>
          </div>
          <Text style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 400,
            letterSpacing: 2,
            fontFamily: "'Georgia', serif",
            whiteSpace: 'nowrap'
          }}>
            YORNEWS
          </Text>
        </Link>

        {/* Desktop Navigation Links */}
        <Space size="middle" className="desktop-nav" style={{ display: 'none' }}>
          {currentUser ? (
            <>
              {navLinks.map(link => (
                <Link key={link.to} to={link.to}>
                  <Button type="text" icon={link.icon} style={{ color: '#888' }}>
                    {link.label}
                  </Button>
                </Link>
              ))}
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
                  REGISTER
                </Button>
              </Link>
            </>
          )}
        </Space>

        {/* Mobile Menu Button */}
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: 20 }} />}
          onClick={() => setMobileMenuOpen(true)}
          className="mobile-menu-btn"
          style={{ color: '#fff', padding: 4 }}
        />
      </Header>

      {/* Mobile Drawer Menu */}
      <Drawer
        title={
          <Text style={{
            color: '#fff',
            fontFamily: "'Georgia', serif",
            fontSize: 18,
            letterSpacing: 2
          }}>
            YORNEWS
          </Text>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        closeIcon={<CloseOutlined style={{ color: '#fff' }} />}
        styles={{
          header: { background: '#111', borderBottom: '1px solid #222' },
          body: { background: '#111', padding: 0 }
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {currentUser ? (
            <>
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    color: '#fff',
                    padding: '16px 24px',
                    borderBottom: '1px solid #222',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <div
                onClick={handleLogout}
                style={{
                  color: '#888',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer'
                }}
              >
                <LogoutOutlined />
                Logout
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  color: '#fff',
                  padding: '16px 24px',
                  borderBottom: '1px solid #222'
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  color: '#f5c518',
                  padding: '16px 24px',
                  fontWeight: 500
                }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </Drawer>

      <style>{`
        @media (min-width: 769px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}

export default Navbar;
