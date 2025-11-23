/**
 * Custom hook for managing templates state and operations
 * Uses backend API for all CRUD operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Template } from '../types';
import { storage } from '../utils/storage';
import { apiClient, Template as ApiTemplate } from '../services/api';
import { useAuth } from './useAuth';
import { clipboard } from '../utils/clipboard';
import { createSampleTemplates } from '../utils/sampleData';
import { replaceParameters } from '../utils/templateParams';
import { useParameters } from './useParameters';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { parameters } = useParameters();
  const isLoggedIn = !!user;
  
  // Use ref to always get latest parameters (avoids stale closures)
  const parametersRef = useRef(parameters);
  useEffect(() => {
    parametersRef.current = parameters;
  }, [parameters]);

  // Load templates function
  const loadTemplates = useCallback(async (projectId?: string) => {
    try {
      if (isLoggedIn && user?.uid) {
        // Load from backend API for authenticated users
        try {
          const apiTemplates = await apiClient.getTemplates(projectId);
          
          if (apiTemplates.length === 0) {
            // If remote empty, check if user wants to migrate from localStorage
            // For now, we'll just show empty list - user can manually import if needed
            // This prevents auto-migrating old data when Firestore is intentionally cleared
            setTemplates([]);
            setIsLoading(false);
            return [];
          }
          
          setTemplates(apiTemplates);
          setIsLoading(false);
          return apiTemplates;
        } catch (error) {
          console.error('Failed to load templates from API:', error);
          // Don't fallback to localStorage for logged-in users - show empty instead
          // This ensures data comes from Firestore when authenticated
          setTemplates([]);
          setIsLoading(false);
          return [];
        }
      } else {
        // Anonymous/local mode - use localStorage
        const storedTemplates = storage.getTemplates();
        if (storedTemplates.length === 0) {
          const sampleTemplates = createSampleTemplates();
          setTemplates(sampleTemplates);
          storage.saveTemplates(sampleTemplates);
          setIsLoading(false);
          return sampleTemplates;
        } else {
          setTemplates(storedTemplates);
          setIsLoading(false);
          return storedTemplates;
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setIsLoading(false);
      return [];
    }
  }, [isLoggedIn, user?.uid]);

  // Load templates on mount and when auth state changes
  useEffect(() => {
    if (authLoading) return; // wait for auth to settle before loading
    loadTemplates();
  }, [authLoading, isLoggedIn, user?.uid, loadTemplates]);

  // Save templates to localStorage for anonymous users
  useEffect(() => {
    if (isLoading) return;
    if (templates.length === 0) return;
    if (isLoggedIn && user?.uid) return; // Backend API is source of truth for logged-in users
    storage.saveTemplates(templates);
  }, [templates, isLoading, isLoggedIn, user?.uid]);

  // Create new template
  const createTemplate = useCallback(async (templateData: Omit<Template, 'id' | 'createdAt' | 'copyCount' | 'lastUsed'>) => {
    const newTemplate: Template = {
      ...templateData,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      copyCount: 0,
      lastUsed: null
    };

    if (isLoggedIn && user?.uid) {
      try {
        // Create via backend API
        const created = await apiClient.createTemplate(templateData);
        setTemplates(prev => [created, ...prev]);
        return created;
      } catch (error) {
        console.error('Failed to create template via API:', error);
        // Fallback to local state
        setTemplates(prev => [newTemplate, ...prev]);
        return newTemplate;
      }
    } else {
      // Anonymous mode - local only
      setTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    }
  }, [isLoggedIn, user?.uid]);

  // Update existing template
  const updateTemplate = useCallback(async (id: string, updates: Partial<Template>) => {
    const updatedTemplate = templates.find(t => t.id === id);
    if (!updatedTemplate) return;

    // Optimistic update
    setTemplates(prev => 
      prev.map(template => 
        template.id === id ? { ...template, ...updates } : template
      )
    );

    if (isLoggedIn && user?.uid) {
      try {
        // Update via backend API
        const updated = await apiClient.updateTemplate(id, updates);
        // Update with server response
        setTemplates(prev =>
          prev.map(t => t.id === id ? updated : t)
        );
      } catch (error) {
        console.error('Failed to update template via API:', error);
        // Revert optimistic update on error
        setTemplates(prev =>
          prev.map(t => t.id === id ? updatedTemplate : t)
        );
        throw error;
      }
    }
  }, [templates, isLoggedIn, user?.uid]);

  // Delete template (soft delete by archiving)
  const deleteTemplate = useCallback(async (id: string) => {
    if (isLoggedIn && user?.uid) {
      try {
        await apiClient.deleteTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
      } catch (error) {
        console.error('Failed to delete template via API:', error);
        // Fallback to local update
        updateTemplate(id, { isArchived: true });
      }
    } else {
      updateTemplate(id, { isArchived: true });
    }
  }, [isLoggedIn, user?.uid, updateTemplate]);

  // Duplicate template
  const duplicateTemplate = useCallback(async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    const duplicatedData: Omit<Template, 'id' | 'createdAt' | 'copyCount' | 'lastUsed'> = {
      title: `${template.title} (Copy)`,
      body: template.body,
      tags: template.tags,
      isFavorite: template.isFavorite,
      isArchived: false
    };

    return createTemplate(duplicatedData);
  }, [templates, createTemplate]);

  // Copy template to clipboard (with parameter replacement)
  const copyTemplate = useCallback(async (id: string, contactId?: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) {
      throw new Error('Template not found');
    }

    try {
      // Get the latest parameters - use current state first, fallback to ref
      // This ensures we always have the most up-to-date parameters
      const currentParams = parameters || parametersRef.current || {};
      
      // Normalize parameter keys to lowercase for consistent matching
      const normalizedParams: Record<string, string> = {};
      Object.entries(currentParams).forEach(([key, value]) => {
        if (value && value.trim()) {
          normalizedParams[key.toLowerCase().trim()] = value.trim();
        }
      });
      
      const processedBody = replaceParameters(template.body, normalizedParams);
      
      await clipboard.copyText(processedBody);
      
      // Update copy count and last used
      await updateTemplate(id, {
        copyCount: template.copyCount + 1,
        lastUsed: new Date().toISOString()
      });

      // Track activity if contactId is provided
      if (contactId && isLoggedIn) {
        try {
          await apiClient.createActivity({
            contactId,
            userId: '', // Will be set by backend
            type: 'message_sent',
            templateId: id,
            templateTitle: template.title,
            message: processedBody,
            metadata: {}
          });
        } catch (error) {
          console.error('Failed to track activity:', error);
          // Don't throw - activity tracking failure shouldn't break template copy
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to copy template:', error);
      throw error;
    }
  }, [templates, parameters, updateTemplate, isLoggedIn, parametersRef]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      await updateTemplate(id, { isFavorite: !template.isFavorite });
    }
  }, [templates, updateTemplate]);

  // Get active templates (not archived)
  const getActiveTemplates = useCallback(() => {
    return templates.filter(t => !t.isArchived);
  }, [templates]);

  // Get favorite templates
  const getFavoriteTemplates = useCallback(() => {
    return templates.filter(t => !t.isArchived && t.isFavorite);
  }, [templates]);

  // Get recently used templates
  const getRecentlyUsedTemplates = useCallback(() => {
    return templates
      .filter(t => !t.isArchived && t.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime());
  }, [templates]);

  // Search templates
  const searchTemplates = useCallback((query: string) => {
    if (!query.trim()) return getActiveTemplates();
    
    const lowercaseQuery = query.toLowerCase();
    return getActiveTemplates().filter(template =>
      template.title.toLowerCase().includes(lowercaseQuery) ||
      template.body.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [getActiveTemplates]);

  return {
    templates: getActiveTemplates(),
    allTemplates: templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    copyTemplate,
    toggleFavorite,
    getFavoriteTemplates,
    getRecentlyUsedTemplates,
    searchTemplates,
    reloadTemplates: loadTemplates
  };
};
