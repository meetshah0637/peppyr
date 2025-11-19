/**
 * LocalStorage utilities for persisting templates and app state
 * Provides fallbacks for environments where localStorage is not available
 */

import { Template } from '../types';
import { firebaseDb, isFirebaseConfigured } from './firebase'
import { collection, addDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where, getDoc } from 'firebase/firestore'

const STORAGE_KEY = 'appointment-library-templates';
const SETTINGS_KEY = 'appointment-library-settings';

// Local storage (existing behavior)
export const storage = {
  // Template storage
  getTemplates: (): Template[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load templates from localStorage:', error);
      return [];
    }
  },

  saveTemplates: (templates: Template[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.warn('Failed to save templates to localStorage:', error);
    }
  },

  // Settings storage
  getSettings: () => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
      return {};
    }
  },

  saveSettings: (settings: Record<string, any>): void => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  },

  // Clear all data
  clearAll: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SETTINGS_KEY);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
};

// Remote Firestore storage (per user) - DEPRECATED: Now using backend API
// Keeping for backward compatibility but not actively used
export const remoteStorage = {
  async ensureUser(user: { uid: string; email: string | null; displayName: string | null }) {
    // Check if Firebase is configured before attempting any operations
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured. Skipping remote user creation. App will use local storage only.');
      return;
    }
    try {
      const db = firebaseDb()
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        await setDoc(ref, {
          email: user.email ?? null,
          displayName: user.displayName ?? null,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        })
      } else {
        await updateDoc(ref, {
          email: user.email ?? null,
          displayName: user.displayName ?? null,
          lastLoginAt: serverTimestamp()
        })
      }
    } catch (e) {
      console.warn('Failed to upsert user profile', e)
    }
  },
  async getTemplates(userId: string): Promise<Template[]> {
    const db = firebaseDb()
    const normalize = (docData: any, id: string): Template => {
      const toIso = (v: any) => (v && typeof v.toDate === 'function') ? v.toDate().toISOString() : (typeof v === 'string' ? v : null)
      const createdAt = toIso(docData.createdAt) ?? new Date().toISOString()
      const lastUsed = toIso(docData.lastUsed)
      return { id, ...docData, createdAt, lastUsed } as Template
    }
    try {
      // Preferred: ordered by createdAt desc
      const q1 = query(collection(db, 'templates'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q1)
      return snap.docs.map(d => normalize(d.data(), d.id))
    } catch (e: any) {
      // If composite index is missing, fall back to un-ordered query and sort client-side.
      if (e?.code === 'failed-precondition') {
        console.warn('Missing Firestore index for (userId, createdAt). Falling back to client-side sort. Create a composite index for better performance.')
        const q2 = query(collection(db, 'templates'), where('userId', '==', userId))
        const snap2 = await getDocs(q2)
        return snap2.docs.map(d => normalize(d.data(), d.id)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
      console.warn('Failed to fetch templates from Firestore', e)
      return []
    }
  },
  async upsertTemplate(userId: string, t: Template): Promise<void> {
    const db = firebaseDb()
    const ref = doc(collection(db, 'templates'), t.id)
    await setDoc(ref, { ...t, userId, createdAt: t.createdAt || serverTimestamp() })
  },
  async addTemplate(userId: string, t: Omit<Template, 'id'>): Promise<Template> {
    const db = firebaseDb()
    const ref = await addDoc(collection(db, 'templates'), { ...t, userId, createdAt: serverTimestamp() })
    return { ...t, id: ref.id }
  },
  async updateTemplate(userId: string, id: string, updates: Partial<Template>): Promise<void> {
    const db = firebaseDb()
    const ref = doc(db, 'templates', id)
    await updateDoc(ref, { ...updates, userId })
  }
}


