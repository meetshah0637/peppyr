/**
 * useAuth - Authentication hook that uses Firebase Auth for client-side auth
 * and backend API for user verification and data management
 */
import { useEffect, useState, useCallback } from 'react';
import { firebaseAuth, googleProvider, isFirebaseConfigured } from '../utils/firebase';
import { apiClient, User } from '../services/api';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, signInWithCustomToken, User as FirebaseUser } from 'firebase/auth';

interface AuthUser extends User {
  firebaseUser: FirebaseUser | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up API client token getter to provide Firebase ID tokens
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      // If Firebase is not configured, set a token getter that returns null
      apiClient.setAuthTokenGetter(async () => null);
      return;
    }
    
    apiClient.setAuthTokenGetter(async () => {
      try {
        const currentUser = firebaseAuth().currentUser;
        if (!currentUser) return null;
        return await currentUser.getIdToken();
      } catch (error) {
        console.error('Failed to get ID token:', error);
        return null;
      }
    });
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured - running in local mode');
      setLoading(false);
      setUser(null);
      return;
    }

    let unsub: (() => void) | undefined;
    try {
      unsub = onAuthStateChanged(firebaseAuth(), async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token and verify with backend
          const idToken = await firebaseUser.getIdToken();
          
          // Verify user with backend API
          const { user: apiUser } = await apiClient.verifyToken(idToken);
          
          const newUser = {
            ...apiUser,
            firebaseUser
          };
          
          setUser(newUser);
        } catch (err: any) {
          console.error('Failed to verify user with backend:', err);
          // Fallback to Firebase user data
          const fallbackUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            firebaseUser
          };
          setUser(fallbackUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      });
    } catch (error) {
      console.error('Firebase auth initialization error:', error);
      setLoading(false);
      setUser(null);
      return;
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Authentication is disabled.');
      return;
    }
    setError(null);
    try {
      await signInWithEmailAndPassword(firebaseAuth(), email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!isFirebaseConfigured()) {
      const error = new Error('Firebase is not configured. Authentication is disabled.');
      setError(error.message);
      throw error;
    }
    setError(null);
    try {
      // First create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth(), email, password);
      
      // Update display name if provided
      if (displayName && userCredential.user) {
        // Note: Firebase Auth doesn't allow updating displayName directly from client
        // This will be handled by the backend when verifying the user
      }

      // User will be verified automatically via onAuthStateChanged
      // The onAuthStateChanged listener will handle setting the user state
      // and verifying with the backend
    } catch (err: any) {
      console.error('Signup error:', err);
      // Preserve the original error with code and message
      const error = err || new Error('Signup failed');
      setError(error.message || 'Signup failed');
      throw error;
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Authentication is disabled.');
      return;
    }
    setError(null);
    try {
      await signInWithPopup(firebaseAuth(), googleProvider);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Clear user state immediately for better UX
      setUser(null);
      setLoading(false);
      
      if (isFirebaseConfigured()) {
        await signOut(firebaseAuth());
      }
      // User state is already cleared above, onAuthStateChanged will confirm it
    } catch (err: any) {
      console.error('Logout error:', err);
      // Even if signOut fails, we've already cleared the user state
      setError(err.message || 'Logout failed');
    }
  }, []);

  return { 
    user: user ? {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    } : null,
    loading, 
    error, 
    login, 
    signup, 
    loginWithGoogle, 
    logout 
  };
}
