/**
 * Contact detail modal showing contact information and activity history
 */

import React, { useState, useEffect } from 'react';
import { Contact, Activity } from '../types';
import { useActivities } from '../hooks/useActivities';

interface ContactDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onUpdate: (id: string, updates: Partial<Contact>) => void;
}

const statusLabels: Record<string, string> = {
  not_contacted: 'Not Contacted',
  contacted: 'Contacted',
  replied: 'Replied',
  meeting_scheduled: 'Meeting Scheduled',
  meeting_completed: 'Meeting Completed',
  qualified: 'Qualified',
  not_qualified: 'Not Qualified',
  no_response: 'No Response'
};

const activityTypeLabels: Record<string, string> = {
  message_sent: 'Message Sent',
  message_received: 'Message Received',
  meeting_scheduled: 'Meeting Scheduled',
  meeting_completed: 'Meeting Completed',
  status_changed: 'Status Changed',
  note_added: 'Note Added'
};

// Cache activities by contact ID to persist across tab switches
const activitiesCache = new Map<string, Activity[]>();

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  isOpen,
  onClose,
  contact,
  onUpdate
}) => {
  const { activities, isLoading: activitiesLoading, loadActivities } = useActivities();
  const [localActivities, setLocalActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (isOpen && contact) {
      // Check cache first
      const cached = activitiesCache.get(contact.id);
      if (cached && cached.length > 0) {
        setLocalActivities(cached);
      }

      // Always reload to get latest data
      loadActivities(contact.id).then(loadedActivities => {
        setLocalActivities(loadedActivities);
        // Update cache
        activitiesCache.set(contact.id, loadedActivities);
      });
    }
  }, [isOpen, contact?.id, loadActivities]);

  // Keep activities in local state and cache even when modal closes
  useEffect(() => {
    if (activities.length > 0 && contact) {
      setLocalActivities(activities);
      activitiesCache.set(contact.id, activities);
    }
  }, [activities, contact?.id]);

  if (!isOpen || !contact) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {contact.firstName || contact.lastName 
                  ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                  : contact.email || contact.company || 'Unnamed Contact'}
              </h2>
              {contact.title && (
                <p className="text-gray-600 mt-1">{contact.title}</p>
              )}
              {contact.company && (
                <p className="text-gray-500 text-sm mt-1">{contact.company}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                {contact.email && (
                  <div>
                    <span className="text-gray-500">Email:</span>{' '}
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div>
                    <span className="text-gray-500">Phone:</span>{' '}
                    <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.linkedinUrl && (
                  <div>
                    <span className="text-gray-500">LinkedIn:</span>{' '}
                    <a 
                      href={contact.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Status:</span>{' '}
                  <span className="font-medium">{statusLabels[contact.status] || contact.status}</span>
                </div>
                {contact.tags.length > 0 && (
                  <div>
                    <span className="text-gray-500">Tags:</span>{' '}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {contact.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
              {contact.notes ? (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No notes</p>
              )}
            </div>
          </div>

          {/* Activity History */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Activity History</h3>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : localActivities.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4">No activities recorded yet</p>
            ) : (
              <div className="space-y-3">
                {localActivities.map(activity => (
                  <div 
                    key={activity.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {activityTypeLabels[activity.type] || activity.type}
                        </span>
                        {activity.templateTitle && (
                          <span className="text-xs text-gray-500">
                            Template: {activity.templateTitle}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                    {activity.message && (
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                        {activity.message}
                      </p>
                    )}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {Object.entries(activity.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

