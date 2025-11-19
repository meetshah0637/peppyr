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
    apiClient.setAuthTokenGetter(async () => {
      const currentUser = firebaseAuth().currentUser;
      if (!currentUser) return null;
      try {
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
          
          setUser({
            ...apiUser,
            firebaseUser
          });
        } catch (err: any) {
          console.error('Failed to verify user with backend:', err);
          // Fallback to Firebase user data
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            firebaseUser
          });
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
      setError('Firebase is not configured. Authentication is disabled.');
      return;
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
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      throw err;
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
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Authentication is disabled.');
      return;
    }
    try {
      await signOut(firebaseAuth());
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
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
