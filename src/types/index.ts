/**
 * Core types for the Appointment Library Quickbar application
 * Defines the structure for templates, UI state, and storage
 */

export interface Template {
  id: string;
  title: string;
  body: string;
  tags: string[];
  isFavorite: boolean;
  copyCount: number;
  lastUsed: string | null;
  createdAt: string;
  isArchived: boolean;
  projectId: string | null; // ID of the project/client this template belongs to
}

export interface QuickbarState {
  isOpen: boolean;
  searchQuery: string;
  selectedIndex: number;
  filteredTemplates: Template[];
}

export interface AppState {
  templates: Template[];
  quickbar: QuickbarState;
  editor: {
    isOpen: boolean;
    editingTemplate: Template | null;
    isCreating: boolean;
  };
}

export type TemplateCategory = 'Intro' | 'Follow up 1' | 'Follow up 2' | 'Meeting Request';

export interface SampleTemplate {
  title: string;
  body: string;
  tags: string[];
  category: TemplateCategory;
}

export interface TemplateParameter {
  key: string; // e.g., "name", "company"
  value: string; // e.g., "John Doe", "Acme Corp"
  label?: string; // Display label (optional)
}

export interface UserParameters {
  userId: string;
  parameters: Record<string, string>; // { "name": "John Doe", "company": "Acme Corp" }
  updatedAt: string;
}

// Contact/Lead Management Types
export type ContactStatus = 
  | 'pending'
  | 'not_contacted' 
  | 'contacted' 
  | 'replied' 
  | 'meeting_scheduled' 
  | 'meeting_completed' 
  | 'qualified' 
  | 'not_qualified' 
  | 'no_response';

export interface Contact {
  id: string;
  userId: string;
  projectId: string | null; // ID of the project/client this contact belongs to
  listId: string | null; // ID of the contact list/batch this contact belongs to
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  linkedinUrl: string | null;
  status: ContactStatus;
  templateId: string | null; // Template used for this contact
  templateTitle: string | null; // Template title for display
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  lastContactedAt: string | null;
}

// Contact List/Batch - represents a CSV import or manual list
export interface ContactList {
  id: string;
  userId: string;
  projectId: string | null; // ID of the project/client this list belongs to
  name: string; // Name of the list (e.g., "LinkedIn Outreach - Jan 2024")
  description: string | null;
  source: 'csv_import' | 'manual'; // How the list was created
  csvFileName: string | null; // Original CSV filename if imported
  contactCount: number; // Number of contacts in this list
  createdAt: string;
  updatedAt: string;
}

// Outreach Activity Tracking
export type ActivityType = 
  | 'message_sent' 
  | 'message_received' 
  | 'meeting_scheduled' 
  | 'meeting_completed' 
  | 'status_changed' 
  | 'note_added';

export interface Activity {
  id: string;
  contactId: string;
  userId: string;
  type: ActivityType;
  templateId: string | null; // If message was sent using a template
  templateTitle: string | null;
  message: string | null; // Message content or note
  metadata: Record<string, any>; // Additional data (e.g., response time, meeting link)
  createdAt: string;
}

// Analytics Types
export interface OutreachMetrics {
  totalContacts: number;
  contacted: number;
  replied: number;
  meetingsScheduled: number;
  meetingsCompleted: number;
  responseRate: number; // Percentage
  meetingConversionRate: number; // Percentage
}

export interface TemplatePerformance {
  templateId: string;
  templateTitle: string;
  timesUsed: number;
  responsesReceived: number;
  meetingsScheduled: number;
  responseRate: number;
  meetingConversionRate: number;
}

// Project/Client Management Types
export interface Project {
  id: string;
  userId: string;
  name: string; // Client/Project name (e.g., "Acme Corp", "Tech Startup Inc")
  description: string | null;
  clientName: string | null; // Optional: specific client name if different from project name
  color: string | null; // Optional: color code for UI (e.g., "#3B82F6")
  templateCount: number; // Number of templates in this project
  contactCount: number; // Number of contacts in this project
  createdAt: string;
  updatedAt: string;
}

