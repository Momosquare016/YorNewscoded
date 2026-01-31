import { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // SIGNUP FUNCTION
  async function signup(email, password) {
    try {
      setError(null);
      
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Register user in our backend database
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: user.uid,
          email: user.email,
        }),
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
        throw new Error(data.error || 'Failed to register in database');
      }

      return { user, idToken };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // LOGIN FUNCTION
  async function login(email, password) {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get ID token for API calls
      const idToken = await user.getIdToken();
      
      // Store token in localStorage (for API calls)
      localStorage.setItem('authToken', idToken);
      
      return { user, idToken };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // LOGOUT FUNCTION
  async function logout() {
    try {
      setError(null);
      
      // Clear token from localStorage
      localStorage.removeItem('authToken');
      
      // Sign out from Firebase
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // GET CURRENT USER TOKEN (for API calls)
  async function getToken() {
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  }

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // User is signed in, store token
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
      } else {
        // User is signed out
        localStorage.removeItem('authToken');
      }
      
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    logout,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}