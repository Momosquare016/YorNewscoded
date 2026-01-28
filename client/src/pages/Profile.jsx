import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Loading from '../components/Loading';
import '../styles/Profile.css';

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
    return <Loading />;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {currentUser?.email?.charAt(0).toUpperCase()}
          </div>
          <h1>Profile</h1>
        </div>

        <div className="profile-info">
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{currentUser?.email}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Member Since:</span>
            <span className="info-value">
              {userData?.created_at 
                ? new Date(userData.created_at).toLocaleDateString() 
                : 'Unknown'}
            </span>
          </div>

          {userData?.preferences && (
            <div className="info-row">
              <span className="info-label">Current Preferences:</span>
              <span className="info-value">
                {JSON.parse(userData.preferences).raw_input || 'Not set'}
              </span>
            </div>
          )}
        </div>

        <div className="profile-actions">
          <Link to="/preferences" className="btn btn-primary">
            Edit Preferences
          </Link>
          <Link to="/saved" className="btn btn-secondary">
            View Saved Articles
          </Link>
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;