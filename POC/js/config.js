/**
 * PMTwin Configuration
 * Centralized configuration for API endpoints, environment settings, and feature flags
 */

(function() {
  'use strict';

  // ============================================
  // Environment Configuration
  // ============================================
  const CONFIG = {
    // API Configuration
    api: {
      // Base URL for API endpoints
      // In development: use localStorage (null)
      // In production: set to your Java backend URL (e.g., 'https://api.pmtwin.com')
      baseUrl: null, // Set to null to use localStorage, or set to API URL for backend
      
      // API version
      version: 'v1',
      
      // Timeout in milliseconds
      timeout: 30000,
      
      // Retry configuration
      retry: {
        maxAttempts: 3,
        delay: 1000 // milliseconds between retries
      }
    },

    // Data Storage Configuration
    storage: {
      // Use localStorage when API is not configured
      useLocalStorage: true,
      
      // Prefix for all localStorage keys
      keyPrefix: 'pmtwin_',
      
      // Enable/disable data persistence
      persistData: true
    },

    // Feature Flags
    features: {
      // Enable offline mode
      offlineMode: true,
      
      // Enable caching
      enableCache: true,
      
      // Cache expiration time (milliseconds)
      cacheExpiration: 5 * 60 * 1000, // 5 minutes
      
      // Enable request logging
      enableLogging: true
    },

    // Authentication Configuration
    auth: {
      // Session timeout (hours)
      sessionTimeout: 24,
      
      // Token storage key
      tokenKey: 'pmtwin_auth_token',
      
      // Enable automatic token refresh
      autoRefreshToken: true
    }
  };

  // ============================================
  // Environment Detection
  // ============================================
  function getEnvironment() {
    // Check if API base URL is configured
    if (CONFIG.api.baseUrl) {
      return 'production';
    }
    return 'development';
  }

  function isProduction() {
    return getEnvironment() === 'production';
  }

  function isDevelopment() {
    return getEnvironment() === 'development';
  }

  // ============================================
  // API Endpoint Builder
  // ============================================
  function buildApiUrl(endpoint) {
    if (!CONFIG.api.baseUrl) {
      return null; // Use localStorage
    }
    
    // Remove leading slash if present
    endpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Build full URL
    const version = CONFIG.api.version ? `/${CONFIG.api.version}` : '';
    return `${CONFIG.api.baseUrl}${version}/${endpoint}`;
  }

  // ============================================
  // Public API
  // ============================================
  window.PMTwinConfig = {
    // Configuration object
    config: CONFIG,
    
    // Environment detection
    getEnvironment,
    isProduction,
    isDevelopment,
    
    // API URL builder
    buildApiUrl,
    
    // Update configuration (for runtime changes)
    updateConfig: function(updates) {
      Object.assign(CONFIG, updates);
    },
    
    // Get configuration value
    get: function(path) {
      const keys = path.split('.');
      let value = CONFIG;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return undefined;
        }
      }
      return value;
    },
    
    // Set configuration value
    set: function(path, value) {
      const keys = path.split('.');
      const lastKey = keys.pop();
      let target = CONFIG;
      for (const key of keys) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        target = target[key];
      }
      target[lastKey] = value;
    }
  };

})();

