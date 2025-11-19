/**
 * Hook for managing contacts/leads
 * Handles loading, creating, updating, and deleting contacts
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';
import { Contact, ContactStatus } from '../types';
import { storage } from '../utils/storage';

const CONTACTS_STORAGE_KEY = 'peppyr-contacts';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;

  // Load contacts
  const loadContacts = useCallback(async (params?: { status?: string; search?: string; listId?: string; projectId?: string }) => {
    try {
      if (isLoggedIn && user?.uid) {
        try {
          // Clear contacts immediately to prevent flash of old data
          setContacts([]);
          setIsLoading(true);
          
          const apiContacts = await apiClient.getContacts(params || {});
          setContacts(apiContacts);
          setIsLoading(false);
          return apiContacts;
        } catch (error) {
          console.error('Failed to load contacts from API:', error);
          // Fallback to localStorage - filter by userId
          const allLocal = (storage.getSettings()[CONTACTS_STORAGE_KEY] || []) as Contact[];
          const userContacts = allLocal.filter(c => c.userId === user.uid);
          setContacts(userContacts);
          setIsLoading(false);
          return userContacts;
        }
      } else {
        // Anonymous mode - use localStorage
        const allLocal = (storage.getSettings()[CONTACTS_STORAGE_KEY] || []) as Contact[];
        const anonymousContacts = allLocal.filter(c => !c.userId || c.userId === 'anonymous');
        setContacts(anonymousContacts);
        setIsLoading(false);
        return anonymousContacts;
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setContacts([]);
      setIsLoading(false);
      return [];
    }
  }, [isLoggedIn, user?.uid]);

  // Don't auto-load contacts on mount - let components load with specific filters
  // This prevents showing all contacts when navigating to the contacts page
  useEffect(() => {
    if (authLoading) return;
    
    // Only clear contacts on mount, don't load all contacts
    // Components should call loadContacts with specific filters
    setContacts([]);
    setIsLoading(false);
  }, [authLoading, isLoggedIn, user?.uid]);

  // Create contact
  const createContact = useCallback(async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (isLoggedIn && user?.uid) {
        try {
          const created = await apiClient.createContact(contactData);
          // Don't reload here - let parent component reload with correct filters
          // This prevents clearing the filtered list view during batch imports
          return created;
        } catch (error) {
          console.error('Failed to create contact via API:', error);
          // Fallback to localStorage
          const newContact: Contact = {
            ...contactData,
            id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: contactData.status || 'pending',
            tags: contactData.tags || [],
            notes: contactData.notes || '',
            lastContactedAt: contactData.lastContactedAt || null
          };
          const settings = storage.getSettings();
          const localContacts = (settings[CONTACTS_STORAGE_KEY] || []) as Contact[];
          // Filter by userId for localStorage too
          const userContacts = localContacts.filter(c => c.userId === user.uid);
          userContacts.unshift(newContact);
          settings[CONTACTS_STORAGE_KEY] = [...localContacts.filter(c => c.userId !== user.uid), ...userContacts];
          storage.saveSettings(settings);
          setContacts(prev => [newContact, ...prev]);
          return newContact;
        }
      } else {
        // Anonymous mode
        const newContact: Contact = {
          ...contactData,
          id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: 'anonymous',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: contactData.status || 'not_contacted',
          tags: contactData.tags || [],
          notes: contactData.notes || '',
          lastContactedAt: contactData.lastContactedAt || null
        };
        const settings = storage.getSettings();
        const localContacts = (settings[CONTACTS_STORAGE_KEY] || []) as Contact[];
        localContacts.unshift(newContact);
        settings[CONTACTS_STORAGE_KEY] = localContacts;
        storage.saveSettings(settings);
        setContacts(prev => [newContact, ...prev]);
        return newContact;
      }
    } catch (error) {
      console.error('Failed to create contact:', error);
      throw error;
    }
  }, [isLoggedIn, user?.uid, loadContacts]);

  // Update contact
  const updateContact = useCallback(async (id: string, updates: Partial<Contact>, listId?: string) => {
    try {
      if (isLoggedIn && user?.uid) {
        try {
          const updated = await apiClient.updateContact(id, updates);
          // Reload to ensure consistency - use listId if provided
          await loadContacts(listId ? { listId } : undefined);
          return updated;
        } catch (error) {
          console.error('Failed to update contact via API:', error);
          // Fallback to localStorage
          const settings = storage.getSettings();
          const localContacts = (settings[CONTACTS_STORAGE_KEY] || []) as Contact[];
          const index = localContacts.findIndex(c => c.id === id && c.userId === user.uid);
          if (index !== -1) {
            const updatedContact = {
              ...localContacts[index],
              ...updates,
              updatedAt: new Date().toISOString()
            };
            localContacts[index] = updatedContact;
            settings[CONTACTS_STORAGE_KEY] = localContacts;
            storage.saveSettings(settings);
            await loadContacts();
            return updatedContact;
          }
          throw new Error('Contact not found');
        }
      } else {
        // Anonymous mode
        const settings = storage.getSettings();
        const localContacts = (settings[CONTACTS_STORAGE_KEY] || []) as Contact[];
        const index = localContacts.findIndex(c => c.id === id && (!c.userId || c.userId === 'anonymous'));
        if (index !== -1) {
          const updatedContact = {
            ...localContacts[index],
            ...updates,
            updatedAt: new Date().toISOString()
          };
          localContacts[index] = updatedContact;
          settings[CONTACTS_STORAGE_KEY] = localContacts;
          storage.saveSettings(settings);
          await loadContacts();
          return updatedContact;
        }
        throw new Error('Contact not found');
      }
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  }, [isLoggedIn, user?.uid, loadContacts]);

  // Delete contact
  const deleteContact = useCallback(async (id: string) => {
    try {
      if (isLoggedIn && user?.uid) {
        try {
          await apiClient.deleteContact(id);
          setContacts(prev => prev.filter(c => c.id !== id));
        } catch (error) {
          console.error('Failed to delete contact via API:', error);
          // Fallback to localStorage
          const settings = storage.getSettings();
          const localContacts = (settings[CONTACTS_STORAGE_KEY] || []) as Contact[];
          settings[CONTACTS_STORAGE_KEY] = localContacts.filter(c => c.id !== id);
          storage.saveSettings(settings);
          setContacts(prev => prev.filter(c => c.id !== id));
        }
      } else {
        // Anonymous mode
        const settings = storage.getSettings();
        const localContacts = (settings[CONTACTS_STORAGE_KEY] || []) as Contact[];
        settings[CONTACTS_STORAGE_KEY] = localContacts.filter(c => c.id !== id);
        storage.saveSettings(settings);
        setContacts(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  }, [isLoggedIn, user?.uid]);

  // Update contact status
  const updateContactStatus = useCallback(async (id: string, status: ContactStatus) => {
    return updateContact(id, { status });
  }, [updateContact]);

  return {
    contacts,
    isLoading,
    createContact,
    updateContact,
    updateContactStatus,
    deleteContact,
    reloadContacts: loadContacts
  };
};

