/**
 * Firebase initialization and exports (Auth + Firestore)
 * Revert: delete this file and remove firebase usage in hooks.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ] as const

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? ''
  }

  const missingKeys = requiredKeys.filter(key => !import.meta.env[key])
  
  if (missingKeys.length > 0) {
    console.warn('Firebase configuration incomplete. Missing environment variables:', missingKeys)
    console.warn('Please copy .env.example to .env and fill in your Firebase project details.')
    console.warn('App will fall back to local storage mode.')
    return null
  }

  return config
}

const firebaseConfig = validateFirebaseConfig()
let app: FirebaseApp | null = null

export function getFirebaseApp() {
  if (!firebaseConfig) {
    throw new Error('Firebase configuration is missing. Please set up your environment variables.')
  }
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

export const isFirebaseConfigured = () => firebaseConfig !== null

export const firebaseAuth = () => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Cannot initialize authentication.')
  }
  return getAuth(getFirebaseApp())
}

export const firebaseDb = () => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Cannot initialize Firestore.')
  }
  return getFirestore(getFirebaseApp())
}

export const googleProvider = new GoogleAuthProvider()





