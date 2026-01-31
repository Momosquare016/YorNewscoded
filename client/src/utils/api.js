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
      // Provide user-friendly error messages based on status code
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('You don\'t have permission to access this resource.');
      } else if (response.status === 404) {
        throw new Error('The requested resource was not found.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw new Error(data.error || 'Something went wrong. Please try again.');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);

    // Handle network errors with user-friendly messages
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check your internet connection or try again later.');
    }

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
  getNews: (refresh = false) => apiCall(`/api/news${refresh ? '?refresh=true' : ''}`),

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