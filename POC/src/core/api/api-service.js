/**
 * PMTwin API Service
 * High-level API service that abstracts data access
 * Automatically falls back to localStorage when API is not available
 */

(function() {
  'use strict';

  // ============================================
  // API Service Base Class
  // ============================================
  class ApiService {
    constructor(resourceName, localStorageKey) {
      this.resourceName = resourceName;
      this.localStorageKey = localStorageKey;
      this.apiClient = window.ApiClient || null;
    }

    /**
     * Check if API is available
     */
    isApiAvailable() {
      return this.apiClient && this.apiClient.isApiAvailable();
    }

    /**
     * Get from localStorage
     */
    getFromLocalStorage() {
      if (typeof localStorage === 'undefined') {
        return [];
      }
      try {
        const data = localStorage.getItem(this.localStorageKey);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        console.error(`Error reading from localStorage (${this.localStorageKey}):`, error);
        return [];
      }
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage(data) {
      if (typeof localStorage === 'undefined') {
        return false;
      }
      try {
        localStorage.setItem(this.localStorageKey, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error(`Error writing to localStorage (${this.localStorageKey}):`, error);
        return false;
      }
    }

    /**
     * Get all items
     */
    async getAll() {
      if (this.isApiAvailable()) {
        try {
          const response = await this.apiClient.get(this.resourceName);
          if (response && response.success) {
            return response.data;
          }
        } catch (error) {
          console.warn(`API request failed, falling back to localStorage:`, error);
        }
      }
      return this.getFromLocalStorage();
    }

    /**
     * Get item by ID
     */
    async getById(id) {
      if (this.isApiAvailable()) {
        try {
          const response = await this.apiClient.get(`${this.resourceName}/${id}`);
          if (response && response.success) {
            return response.data;
          }
        } catch (error) {
          console.warn(`API request failed, falling back to localStorage:`, error);
        }
      }
      const items = this.getFromLocalStorage();
      return items.find(item => item.id === id) || null;
    }

    /**
     * Create new item
     */
    async create(data) {
      if (this.isApiAvailable()) {
        try {
          const response = await this.apiClient.post(this.resourceName, data);
          if (response && response.success) {
            // Invalidate cache
            this.apiClient.clearCache(this.resourceName);
            return response.data;
          }
        } catch (error) {
          console.warn(`API request failed, falling back to localStorage:`, error);
        }
      }
      // Fallback to localStorage
      const items = this.getFromLocalStorage();
      const newItem = {
        ...data,
        id: data.id || this.generateId(),
        createdAt: data.createdAt || new Date().toISOString()
      };
      items.push(newItem);
      this.saveToLocalStorage(items);
      return newItem;
    }

    /**
     * Update item
     */
    async update(id, data) {
      if (this.isApiAvailable()) {
        try {
          const response = await this.apiClient.put(`${this.resourceName}/${id}`, data);
          if (response && response.success) {
            // Invalidate cache
            this.apiClient.clearCache(this.resourceName);
            this.apiClient.clearCache(`${this.resourceName}/${id}`);
            return response.data;
          }
        } catch (error) {
          console.warn(`API request failed, falling back to localStorage:`, error);
        }
      }
      // Fallback to localStorage
      const items = this.getFromLocalStorage();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) {
        return null;
      }
      items[index] = {
        ...items[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      this.saveToLocalStorage(items);
      return items[index];
    }

    /**
     * Delete item
     */
    async delete(id) {
      if (this.isApiAvailable()) {
        try {
          const response = await this.apiClient.delete(`${this.resourceName}/${id}`);
          if (response && response.success) {
            // Invalidate cache
            this.apiClient.clearCache(this.resourceName);
            return true;
          }
        } catch (error) {
          console.warn(`API request failed, falling back to localStorage:`, error);
        }
      }
      // Fallback to localStorage
      const items = this.getFromLocalStorage();
      const filtered = items.filter(item => item.id !== id);
      this.saveToLocalStorage(filtered);
      return true;
    }

    /**
     * Generate unique ID
     */
    generateId(prefix = 'id') {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // ============================================
  // Specific API Services
  // ============================================
  const ApiServices = {
    users: new ApiService('users', 'pmtwin_users'),
    sessions: new ApiService('sessions', 'pmtwin_sessions'),
    projects: new ApiService('projects', 'pmtwin_projects'),
    proposals: new ApiService('proposals', 'pmtwin_proposals'),
    matches: new ApiService('matches', 'pmtwin_matches'),
    notifications: new ApiService('notifications', 'pmtwin_notifications'),
    audit: new ApiService('audit', 'pmtwin_audit'),
    collaborationOpportunities: new ApiService('collaboration-opportunities', 'pmtwin_collaboration_opportunities'),
    collaborationApplications: new ApiService('collaboration-applications', 'pmtwin_collaboration_applications')
  };

  // ============================================
  // Export
  // ============================================
  window.ApiService = ApiService;
  window.ApiServices = ApiServices;

})();

