/**
 * PMTwin API Client
 * Handles all HTTP requests to the backend API
 * Falls back to localStorage when API is not configured
 */

(function() {
  'use strict';

  // ============================================
  // Request Cache
  // ============================================
  const requestCache = new Map();
  const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

  // ============================================
  // HTTP Client
  // ============================================
  class ApiClient {
    constructor() {
      this.baseUrl = null;
      this.timeout = 30000;
      this.retryConfig = {
        maxAttempts: 3,
        delay: 1000
      };
    }

    /**
     * Initialize API client with configuration
     */
    init(config) {
      if (config && config.api) {
        this.baseUrl = config.api.baseUrl;
        this.timeout = config.api.timeout || 30000;
        this.retryConfig = config.api.retry || this.retryConfig;
      }
    }

    /**
     * Check if API is available
     */
    isApiAvailable() {
      return this.baseUrl !== null && this.baseUrl !== undefined;
    }

    /**
     * Build request headers
     */
    buildHeaders(customHeaders = {}) {
      const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
      };

      // Add authentication token if available
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return headers;
    }

    /**
     * Get authentication token from storage
     */
    getAuthToken() {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('pmtwin_auth_token');
      }
      return null;
    }

    /**
     * Set authentication token
     */
    setAuthToken(token) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pmtwin_auth_token', token);
      }
    }

    /**
     * Clear authentication token
     */
    clearAuthToken() {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pmtwin_auth_token');
      }
    }

    /**
     * Make HTTP request with retry logic
     */
    async request(method, endpoint, data = null, options = {}) {
      const url = this.buildUrl(endpoint);
      
      // If API is not available, return null to use localStorage fallback
      if (!this.isApiAvailable()) {
        return null;
      }

      const requestOptions = {
        method: method,
        headers: this.buildHeaders(options.headers),
        signal: AbortSignal.timeout(this.timeout),
        ...options
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(data);
      }

      // Check cache for GET requests
      if (method === 'GET' && options.useCache !== false) {
        const cached = this.getCachedResponse(endpoint);
        if (cached) {
          return cached;
        }
      }

      // Retry logic
      let lastError = null;
      for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
        try {
          const response = await fetch(url, requestOptions);
          
          // Handle different response types
          const contentType = response.headers.get('content-type');
          let responseData;
          
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }

          // Handle errors
          if (!response.ok) {
            throw new ApiError(
              responseData.message || `HTTP ${response.status}: ${response.statusText}`,
              response.status,
              responseData
            );
          }

          // Cache successful GET responses
          if (method === 'GET' && options.useCache !== false) {
            this.cacheResponse(endpoint, responseData);
          }

          return {
            success: true,
            data: responseData,
            status: response.status,
            headers: response.headers
          };

        } catch (error) {
          lastError = error;
          
          // Don't retry on certain errors
          if (error instanceof ApiError && (error.status === 400 || error.status === 401 || error.status === 403)) {
            throw error;
          }

          // Wait before retry (except on last attempt)
          if (attempt < this.retryConfig.maxAttempts) {
            await this.delay(this.retryConfig.delay * attempt);
          }
        }
      }

      throw lastError || new Error('Request failed after retries');
    }

    /**
     * Build full URL from endpoint
     */
    buildUrl(endpoint) {
      if (!endpoint) {
        throw new Error('Endpoint is required');
      }

      // Remove leading slash if present
      endpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

      // If endpoint is already a full URL, return it
      if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        return endpoint;
      }

      // Build URL with base URL
      return `${this.baseUrl}/${endpoint}`;
    }

    /**
     * Delay helper for retries
     */
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cache response
     */
    cacheResponse(endpoint, data) {
      const cacheKey = endpoint;
      requestCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }

    /**
     * Get cached response
     */
    getCachedResponse(endpoint) {
      const cacheKey = endpoint;
      const cached = requestCache.get(cacheKey);
      
      if (!cached) {
        return null;
      }

      // Check if cache is expired
      if (Date.now() - cached.timestamp > CACHE_EXPIRATION) {
        requestCache.delete(cacheKey);
        return null;
      }

      return {
        success: true,
        data: cached.data,
        cached: true
      };
    }

    /**
     * Clear cache
     */
    clearCache(endpoint = null) {
      if (endpoint) {
        requestCache.delete(endpoint);
      } else {
        requestCache.clear();
      }
    }

    // Convenience methods
    async get(endpoint, options = {}) {
      return this.request('GET', endpoint, null, options);
    }

    async post(endpoint, data, options = {}) {
      return this.request('POST', endpoint, data, options);
    }

    async put(endpoint, data, options = {}) {
      return this.request('PUT', endpoint, data, options);
    }

    async patch(endpoint, data, options = {}) {
      return this.request('PATCH', endpoint, data, options);
    }

    async delete(endpoint, options = {}) {
      return this.request('DELETE', endpoint, null, options);
    }
  }

  // ============================================
  // API Error Class
  // ============================================
  class ApiError extends Error {
    constructor(message, status, data = null) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  }

  // ============================================
  // Initialize and Export
  // ============================================
  const apiClient = new ApiClient();

  // Initialize with config if available
  if (typeof window.PMTwinConfig !== 'undefined') {
    apiClient.init(window.PMTwinConfig.config);
  }

  window.ApiClient = apiClient;
  window.ApiError = ApiError;

})();

