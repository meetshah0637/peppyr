/**
 * API Client for Peppyr Backend
 * Handles all HTTP requests to the backend API
 */

// API base URL - defaults to localhost for development
// ALWAYS use relative URLs in production to avoid CORS and domain mismatch issues
// This ensures the API is called on the same domain as the frontend
const getApiBaseUrl = () => {
  // In production, ALWAYS use relative URL (same domain - no CORS issues)
  // This works regardless of www vs non-www, and avoids redirect issues
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // Development: use local backend
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

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
}

class ApiClient {
  private baseUrl: string;
  private getAuthToken: (() => string | null | Promise<string | null>) | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthTokenGetter(getter: () => string | null | Promise<string | null>) {
    this.getAuthToken = getter;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const tokenResult = this.getAuthToken?.();
    const token = tokenResult instanceof Promise ? await tokenResult : tokenResult;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('[ApiClient] Making request:', options.method || 'GET', url, token ? 'with token' : 'without token');

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('[ApiClient] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ApiClient] Error response:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || 'Unknown error' };
        }
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[ApiClient] Response data:', Array.isArray(data) ? `${data.length} items` : 'object');
      return data;
    } catch (error: any) {
      console.error('[ApiClient] Request failed:', error.message);
      throw error;
    }
  }

  // Auth endpoints
  async signup(email: string, password: string, displayName?: string): Promise<{ user: User; customToken?: string; token?: string }> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async verifyToken(token: string): Promise<{ user: User }> {
    // Temporarily set token for this request
    const originalGetter = this.getAuthToken;
    this.setAuthTokenGetter(() => Promise.resolve(token));
    try {
      return this.request('/auth/verify', {
        method: 'POST',
      });
    } finally {
      this.setAuthTokenGetter(originalGetter);
    }
  }

  // Template endpoints
  async getTemplates(projectId?: string): Promise<Template[]> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.request(`/templates${query}`, {
      method: 'GET',
    });
  }

  async createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'copyCount' | 'lastUsed'>): Promise<Template> {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    return this.request(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    return this.request(`/templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health', {
      method: 'GET',
    });
  }

  // User Parameters endpoints
  async getParameters(): Promise<Record<string, string>> {
    return this.request('/parameters', {
      method: 'GET',
    });
  }

  async updateParameters(parameters: Record<string, string>): Promise<Record<string, string>> {
    return this.request('/parameters', {
      method: 'PUT',
      body: JSON.stringify({ parameters }),
    });
  }

  // Contact List endpoints
  async getContactLists(): Promise<any[]> {
    return this.request('/contact-lists', {
      method: 'GET',
    });
  }

  async createContactList(list: Omit<any, 'id' | 'createdAt' | 'updatedAt' | 'contactCount'>): Promise<any> {
    return this.request('/contact-lists', {
      method: 'POST',
      body: JSON.stringify(list),
    });
  }

  async updateContactList(id: string, updates: Partial<any>): Promise<any> {
    return this.request(`/contact-lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteContactList(id: string): Promise<{ success: boolean }> {
    return this.request(`/contact-lists/${id}`, {
      method: 'DELETE',
    });
  }

  // Contact endpoints
  async getContacts(params?: { status?: string; search?: string; listId?: string; projectId?: string }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.listId) queryParams.append('listId', params.listId);
    if (params?.projectId) queryParams.append('projectId', params.projectId);
    const query = queryParams.toString();
    return this.request(`/contacts${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async createContact(contact: Omit<any, 'id' | 'createdAt' | 'updatedAt'>): Promise<any> {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  async updateContact(id: string, updates: Partial<any>): Promise<any> {
    return this.request(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteContact(id: string): Promise<{ success: boolean }> {
    return this.request(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Activity endpoints
  async getContactActivities(contactId: string): Promise<any[]> {
    return this.request(`/contacts/${contactId}/activities`, {
      method: 'GET',
    });
  }

  async createActivity(activity: Omit<any, 'id' | 'createdAt'>): Promise<any> {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }

  // Analytics endpoints
  async getMetrics(projectId?: string): Promise<any> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.request(`/analytics/metrics${query}`, {
      method: 'GET',
    });
  }

  async getTemplatePerformance(projectId?: string): Promise<any[]> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.request(`/analytics/template-performance${query}`, {
      method: 'GET',
    });
  }

  // Project endpoints
  async getProjects(): Promise<any[]> {
    return this.request('/projects', {
      method: 'GET',
    });
  }

  async createProject(project: Omit<any, 'id' | 'createdAt' | 'updatedAt' | 'templateCount' | 'contactCount'>): Promise<any> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, updates: Partial<any>): Promise<any> {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<{ success: boolean }> {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

