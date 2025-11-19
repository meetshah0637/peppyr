/**
 * Hook for managing contact activities
 * Handles tracking outreach activities (messages sent, responses, meetings, etc.)
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';
import { Activity, ActivityType } from '../types';

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load activities for a contact
  const loadActivities = useCallback(async (contactId: string) => {
    setIsLoading(true);
    try {
      const apiActivities = await apiClient.getContactActivities(contactId);
      setActivities(apiActivities);
      return apiActivities;
    } catch (error) {
      console.error('Failed to load activities:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create activity
  const createActivity = useCallback(async (activityData: Omit<Activity, 'id' | 'createdAt'>) => {
    try {
      const created = await apiClient.createActivity(activityData);
      setActivities(prev => [created, ...prev]);
      return created;
    } catch (error) {
      console.error('Failed to create activity:', error);
      throw error;
    }
  }, []);

  // Track message sent
  const trackMessageSent = useCallback(async (
    contactId: string,
    templateId: string | null,
    templateTitle: string | null,
    message: string
  ) => {
    return createActivity({
      contactId,
      userId: '', // Will be set by backend
      type: 'message_sent',
      templateId,
      templateTitle,
      message,
      metadata: {}
    });
  }, [createActivity]);

  // Track message received
  const trackMessageReceived = useCallback(async (
    contactId: string,
    templateId: string | null,
    message: string
  ) => {
    return createActivity({
      contactId,
      userId: '', // Will be set by backend
      type: 'message_received',
      templateId,
      templateTitle: null,
      message,
      metadata: {}
    });
  }, [createActivity]);

  // Track meeting scheduled
  const trackMeetingScheduled = useCallback(async (
    contactId: string,
    meetingLink?: string,
    scheduledDate?: string
  ) => {
    return createActivity({
      contactId,
      userId: '', // Will be set by backend
      type: 'meeting_scheduled',
      templateId: null,
      templateTitle: null,
      message: null,
      metadata: {
        meetingLink,
        scheduledDate
      }
    });
  }, [createActivity]);

  // Track meeting completed
  const trackMeetingCompleted = useCallback(async (contactId: string, notes?: string) => {
    return createActivity({
      contactId,
      userId: '', // Will be set by backend
      type: 'meeting_completed',
      templateId: null,
      templateTitle: null,
      message: notes || null,
      metadata: {}
    });
  }, [createActivity]);

  // Track status change
  const trackStatusChange = useCallback(async (
    contactId: string,
    oldStatus: string,
    newStatus: string
  ) => {
    return createActivity({
      contactId,
      userId: '', // Will be set by backend
      type: 'status_changed',
      templateId: null,
      templateTitle: null,
      message: `Status changed from ${oldStatus} to ${newStatus}`,
      metadata: {
        oldStatus,
        newStatus
      }
    });
  }, [createActivity]);

  // Track note added
  const trackNoteAdded = useCallback(async (contactId: string, note: string) => {
    return createActivity({
      contactId,
      userId: '', // Will be set by backend
      type: 'note_added',
      templateId: null,
      templateTitle: null,
      message: note,
      metadata: {}
    });
  }, [createActivity]);

  return {
    activities,
    isLoading,
    loadActivities,
    createActivity,
    trackMessageSent,
    trackMessageReceived,
    trackMeetingScheduled,
    trackMeetingCompleted,
    trackStatusChange,
    trackNoteAdded
  };
};

