/**
 * URL Helper Utility
 * Builds deploy-safe URLs that work in both local and production environments
 * Prevents double "/POC" in paths and ensures full URLs
 */

(function() {
  'use strict';

  /**
   * Build a full URL from a path relative to POC root
   * @param {string} pathFromRoot - Path like "pages/opportunities/index.html" or "/pages/opportunities/"
   * @returns {string} Full URL (no relative paths, no double /POC)
   */
  function buildUrl(pathFromRoot) {
    if (!pathFromRoot || pathFromRoot === '#') {
      return '#';
    }

    // If already a full URL, return as-is
    if (pathFromRoot.startsWith('http://') || pathFromRoot.startsWith('https://')) {
      return pathFromRoot;
    }

    // Clean up the path
    let cleanPath = pathFromRoot.trim();
    
    // Remove leading slash if present
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }

    // Remove /POC if it appears at the start (prevent double /POC)
    if (cleanPath.startsWith('POC/')) {
      cleanPath = cleanPath.substring(4);
    }

    // Detect environment
    const isLocalDev = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.port === '5503' ||
                       window.location.port === '8000' ||
                       window.location.protocol === 'file:';

    // Build URL based on environment
    if (isLocalDev) {
      // Local development - use localhost with port
      const port = window.location.port || '5503';
      const hostname = window.location.hostname || '127.0.0.1';
      
      // If using file:// protocol, construct relative path
      if (window.location.protocol === 'file:') {
        // For file protocol, use relative paths but ensure /POC/ prefix
        if (!cleanPath.startsWith('POC/')) {
          cleanPath = 'POC/' + cleanPath;
        }
        // Calculate relative path from current location
        const currentPath = window.location.pathname;
        const depth = (currentPath.match(/\//g) || []).length - 1;
        const basePath = depth > 0 ? '../'.repeat(depth) : '';
        return basePath + cleanPath;
      }
      
      return `http://${hostname}:${port}/POC/${cleanPath}`;
    } else {
      // Production/deployed - no /POC in URL
      // Assume deployed structure: https://pm-twin.vercel.app/pages/...
      return `/${cleanPath}`;
    }
  }

  /**
   * Build URL with query parameters
   * @param {string} pathFromRoot - Base path
   * @param {Object} queryParams - Query parameters object
   * @returns {string} Full URL with query string
   */
  function buildUrlWithQuery(pathFromRoot, queryParams = {}) {
    const baseUrl = buildUrl(pathFromRoot);
    if (baseUrl === '#' || Object.keys(queryParams).length === 0) {
      return baseUrl;
    }

    const queryString = Object.entries(queryParams)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}`;
  }

  /**
   * Get current base URL (without path)
   */
  function getBaseUrl() {
    const isLocalDev = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.port === '5503' ||
                       window.location.port === '8000' ||
                       window.location.protocol === 'file:';

    if (isLocalDev) {
      const port = window.location.port || '5503';
      const hostname = window.location.hostname || '127.0.0.1';
      if (window.location.protocol === 'file:') {
        return '';
      }
      return `http://${hostname}:${port}/POC`;
    } else {
      return '';
    }
  }

  // Export
  window.UrlHelper = {
    buildUrl: buildUrl,
    buildUrlWithQuery: buildUrlWithQuery,
    getBaseUrl: getBaseUrl
  };

})();
