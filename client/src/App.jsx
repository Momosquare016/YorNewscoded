import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';

// Import components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SavedArticles from './pages/SavedArticles';
import Preferences from './pages/Preferences';
import Profile from './pages/Profile';

// Import context
import { AuthProvider } from './context/AuthContext';

// Global dark theme matching National Geographic style
const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#f5c518',
    colorBgBase: '#000000',
    colorBgContainer: '#111111',
    colorBgElevated: '#1a1a1a',
    colorText: '#ffffff',
    colorTextSecondary: '#888888',
    borderRadius: 2,
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
};

function App() {
  return (
    <ConfigProvider theme={darkTheme}>
      <AuthProvider>
        <Router>
          <div style={{ minHeight: '100vh', background: '#000' }}>
            <Navbar />

            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/news"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/saved"
                element={
                  <ProtectedRoute>
                    <SavedArticles />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/preferences"
                element={
                  <ProtectedRoute>
                    <Preferences />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
