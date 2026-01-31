// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || '';

// Helper function to make authenticated API calls
async function apiCall(endpoint, options = {}) {
  try {
    const token = getAuthToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    // Handle response - check content type before parsing JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text || 'Server returned an invalid response' };
    }

    if (!response.ok) {
      throw new Error(data.error || 'API call failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Export API functions
export const api = {
  // Auth endpoints
  register: (userData) => apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  getProfile: () => apiCall('/api/auth/profile'),

  // Preferences endpoints
  getPreferences: () => apiCall('/api/preferences'),
  
  updatePreferences: (preferenceText) => apiCall('/api/preferences', {
    method: 'POST',
    body: JSON.stringify({ preferenceText }),
  }),

  // News endpoints
  getNews: () => apiCall('/api/news'),

  // Saved articles endpoints
  getSaved: () => apiCall('/api/saved'),
  
  saveArticle: (article_data) => apiCall('/api/saved', {
    method: 'POST',
    body: JSON.stringify({ article_data }),
  }),

  removeSaved: (articleId) => apiCall(`/api/saved/${articleId}`, {
    method: 'DELETE',
  }),
};