import { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/config';

// API URL for backend calls
const API_URL = import.meta.env.VITE_API_URL || '';

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

      // Store token in localStorage immediately (for API calls)
      localStorage.setItem('authToken', idToken);

      // Register user in our backend database (non-blocking)
      // If this fails, user can still use the app since Firebase auth worked
      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebase_uid: user.uid,
            email: user.email,
          }),
        });

        if (!response.ok) {
          console.warn('Backend registration failed, but Firebase user created');
        }
      } catch (backendErr) {
        // Log but don't fail - Firebase user was created successfully
        console.warn('Backend registration error:', backendErr.message);
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