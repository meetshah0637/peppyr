/**
 * Hook for managing user template parameters
 * Handles loading, saving, and using parameters for template placeholders
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';
import { storage } from '../utils/storage';

const PARAMETERS_STORAGE_KEY = 'peppyr-template-parameters';

export const useParameters = () => {
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;
  
  // Function to reload parameters
  const reloadParameters = useCallback(async () => {
    try {
      if (isLoggedIn && user?.uid) {
        try {
          const apiParams = await apiClient.getParameters();
          const normalized: Record<string, string> = {};
          if (apiParams) {
            Object.entries(apiParams).forEach(([key, value]) => {
              normalized[key.toLowerCase().trim()] = value;
            });
          }
          setParameters(normalized);
          return normalized;
        } catch (error) {
          const local = storage.getSettings()[PARAMETERS_STORAGE_KEY] || {};
          const normalized: Record<string, string> = {};
          Object.entries(local).forEach(([key, value]) => {
            normalized[key.toLowerCase().trim()] = value;
          });
          setParameters(normalized);
          return normalized;
        }
      } else {
        const local = storage.getSettings()[PARAMETERS_STORAGE_KEY] || {};
        const normalized: Record<string, string> = {};
        Object.entries(local).forEach(([key, value]) => {
          normalized[key.toLowerCase().trim()] = value;
        });
        setParameters(normalized);
        return normalized;
      }
    } catch (error) {
      console.error('Failed to reload parameters:', error);
      return parameters;
    }
  }, [isLoggedIn, user?.uid, parameters]);

  // Load parameters on mount and when auth state changes
  useEffect(() => {
    if (authLoading) return;

    const loadParameters = async () => {
      try {
        if (isLoggedIn && user?.uid) {
          // Load from backend API for authenticated users
          try {
            const apiParams = await apiClient.getParameters();
            // Normalize keys to lowercase
            const normalized: Record<string, string> = {};
            if (apiParams) {
              Object.entries(apiParams).forEach(([key, value]) => {
                normalized[key.toLowerCase().trim()] = value;
              });
            }
            // Create new object reference to ensure React detects change
            setParameters({ ...normalized });
          } catch (error) {
            console.error('Failed to load parameters from API:', error);
            // Fallback to localStorage
            const local = storage.getSettings()[PARAMETERS_STORAGE_KEY] || {};
            // Normalize keys
            const normalized: Record<string, string> = {};
            Object.entries(local).forEach(([key, value]) => {
              normalized[key.toLowerCase().trim()] = value;
            });
            // Create new object reference to ensure React detects change
            setParameters({ ...normalized });
          }
        } else {
          // Anonymous mode - use localStorage
          const local = storage.getSettings()[PARAMETERS_STORAGE_KEY] || {};
          // Normalize keys
          const normalized: Record<string, string> = {};
          Object.entries(local).forEach(([key, value]) => {
            normalized[key.toLowerCase().trim()] = value;
          });
          setParameters(normalized);
        }
      } catch (error) {
        console.error('Failed to load parameters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadParameters();
  }, [authLoading, isLoggedIn, user?.uid]);

  // Save parameters
  const updateParameters = useCallback(async (newParameters: Record<string, string>) => {
    // Normalize keys to lowercase to avoid case sensitivity issues
    const normalizedParams: Record<string, string> = {};
    Object.entries(newParameters).forEach(([key, value]) => {
      normalizedParams[key.toLowerCase().trim()] = value.trim();
    });
    
    // Update state immediately (optimistic update)
    // Create a new object reference to ensure React detects the change
    // Use functional update to ensure we get the latest state
    setParameters(prev => {
      const updated = { ...normalizedParams };
      return updated;
    });

    // Save to backend or localStorage
    if (isLoggedIn && user?.uid) {
      try {
        const saved = await apiClient.updateParameters(normalizedParams);
        // Ensure state is set with saved values (in case API normalized them)
        if (saved) {
          const savedNormalized: Record<string, string> = {};
          Object.entries(saved).forEach(([key, value]) => {
            savedNormalized[key.toLowerCase().trim()] = value;
          });
          // Create new object reference - this will trigger useEffect in useTemplates
          setParameters(prev => {
            const updated = { ...savedNormalized };
            return updated;
          });
          // Return the saved normalized params
          return savedNormalized;
        }
      } catch (error) {
        console.error('Failed to save parameters via API:', error);
        // Fallback to localStorage
        const settings = storage.getSettings();
        settings[PARAMETERS_STORAGE_KEY] = normalizedParams;
        storage.saveSettings(settings);
        // State already updated above, return normalized params
        return normalizedParams;
      }
    } else {
      // Anonymous mode - save to localStorage
      const settings = storage.getSettings();
      settings[PARAMETERS_STORAGE_KEY] = normalizedParams;
      storage.saveSettings(settings);
      // State already updated above, return normalized params
      return normalizedParams;
    }
    
    // Return the normalized parameters so caller can use them immediately
    return normalizedParams;
  }, [isLoggedIn, user?.uid]);

  // Update a single parameter
  const setParameter = useCallback(async (key: string, value: string) => {
    const updated = { ...parameters, [key]: value };
    await updateParameters(updated);
  }, [parameters, updateParameters]);

  // Remove a parameter
  const removeParameter = useCallback(async (key: string) => {
    const updated = { ...parameters };
    delete updated[key];
    await updateParameters(updated);
  }, [parameters, updateParameters]);

  return {
    parameters,
    isLoading,
    updateParameters,
    setParameter,
    removeParameter,
    reloadParameters
  };
};

