/**
 * Hook for managing contact lists/batches
 * Handles loading, creating, updating, and deleting contact lists
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';
import { ContactList } from '../types';

export const useContactLists = () => {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;

  // Load contact lists
  const loadLists = useCallback(async () => {
    try {
      if (isLoggedIn && user?.uid) {
        try {
          const apiLists = await apiClient.getContactLists();
          setLists(apiLists);
          return apiLists;
        } catch (error) {
          console.error('Failed to load contact lists from API:', error);
          setLists([]);
          return [];
        }
      } else {
        setLists([]);
        return [];
      }
    } catch (error) {
      console.error('Failed to load contact lists:', error);
      setLists([]);
      return [];
    }
  }, [isLoggedIn, user?.uid]);

  // Load lists on mount and when auth state changes
  useEffect(() => {
    if (authLoading) return;

    loadLists().finally(() => {
      setIsLoading(false);
    });
  }, [authLoading, isLoggedIn, user?.uid, loadLists]);

  // Create contact list
  const createList = useCallback(async (listData: Omit<ContactList, 'id' | 'createdAt' | 'updatedAt' | 'contactCount'>) => {
    try {
      if (isLoggedIn && user?.uid) {
        const created = await apiClient.createContactList(listData);
        setLists(prev => {
          const exists = prev.find(l => l.id === created.id);
          if (exists) {
            return prev.map(l => l.id === created.id ? created : l);
          }
          return [created, ...prev];
        });
        return created;
      }
      throw new Error('Must be logged in to create lists');
    } catch (error) {
      console.error('Failed to create contact list:', error);
      throw error;
    }
  }, [isLoggedIn, user?.uid]);

  // Update contact list
  const updateList = useCallback(async (id: string, updates: Partial<ContactList>) => {
    try {
      if (isLoggedIn && user?.uid) {
        const updated = await apiClient.updateContactList(id, updates);
        setLists(prev => prev.map(l => l.id === id ? updated : l));
        return updated;
      }
      throw new Error('Must be logged in to update lists');
    } catch (error) {
      console.error('Failed to update contact list:', error);
      throw error;
    }
  }, [isLoggedIn, user?.uid]);

  // Delete contact list
  const deleteList = useCallback(async (id: string) => {
    try {
      if (isLoggedIn && user?.uid) {
        // Optimistically update UI immediately
        setLists(prev => prev.filter(l => l.id !== id));
        // Then delete from backend
        const result = await apiClient.deleteContactList(id);
        return result;
      } else {
        throw new Error('Must be logged in to delete lists');
      }
    } catch (error) {
      console.error('Failed to delete contact list:', error);
      // Reload lists to restore state if deletion failed
      await loadLists();
      throw error;
    }
  }, [isLoggedIn, user?.uid, loadLists]);

  return {
    lists,
    isLoading,
    createList,
    updateList,
    deleteList,
    reloadLists: loadLists
  };
};

