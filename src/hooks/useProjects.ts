/**
 * Hook for managing projects/clients
 * Handles creating, updating, and managing projects for organizing templates and contacts
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';
import { Project } from '../types';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      if (isLoggedIn && user?.uid) {
        try {
          console.log('[useProjects] Loading projects for user:', user.uid);
          const apiProjects = await apiClient.getProjects();
          console.log('[useProjects] API returned', apiProjects.length, 'projects');
          if (apiProjects.length > 0) {
            apiProjects.forEach(p => console.log('[useProjects]   - Project:', p.name, 'ID:', p.id, 'userId:', p.userId));
          } else {
            console.warn('[useProjects] No projects returned from API for user:', user.uid);
          }
          setProjects(apiProjects);
          setIsLoading(false);
          return apiProjects;
        } catch (error: any) {
          console.error('[useProjects] Failed to load projects from API:', error);
          console.error('[useProjects] Error details:', error.message, error.stack);
          setProjects([]);
          setIsLoading(false);
          return [];
        }
      } else {
        console.log('[useProjects] User not logged in, returning empty projects');
        setProjects([]);
        setIsLoading(false);
        return [];
      }
    } catch (error: any) {
      console.error('[useProjects] Failed to load projects:', error);
      console.error('[useProjects] Error details:', error.message, error.stack);
      setProjects([]);
      setIsLoading(false);
      return [];
    }
  }, [isLoggedIn, user?.uid]);

  // Load projects on mount and when auth state changes
  useEffect(() => {
    if (authLoading) return;

    loadProjects().finally(() => {
      setIsLoading(false);
    });
  }, [authLoading, isLoggedIn, user?.uid, loadProjects]);

  // Create project
  const createProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'templateCount' | 'contactCount'>) => {
    try {
      if (isLoggedIn && user?.uid) {
        console.log('Creating project:', projectData.name);
        const created = await apiClient.createProject(projectData);
        console.log('Project created:', created.id, created.name);
        // Reload projects to ensure we have the latest list
        const reloaded = await loadProjects();
        console.log('Projects after reload:', reloaded.length);
        return created;
      }
      throw new Error('Must be logged in to create projects');
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }, [isLoggedIn, user?.uid, loadProjects]);

  // Update project
  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      if (isLoggedIn && user?.uid) {
        const updated = await apiClient.updateProject(id, updates);
        setProjects(prev => prev.map(p => p.id === id ? updated : p));
        return updated;
      }
      throw new Error('Must be logged in to update projects');
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }, [isLoggedIn, user?.uid]);

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    try {
      if (isLoggedIn && user?.uid) {
        await apiClient.deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }, [isLoggedIn, user?.uid]);

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    reloadProjects: loadProjects
  };
};

