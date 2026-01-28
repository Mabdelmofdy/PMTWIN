/**
 * Navigation Routes Configuration
 * Centralized route mapping for the PMTwin application
 */

(function() {
  'use strict';

  // Route mapping: route key -> absolute path
  const NAV_ROUTES = {
    // Public Routes
    'home': '/pages/home/index.html',
    'discovery': '/pages/discovery/index.html',
    'wizard': '/pages/wizard/index.html',
    'knowledge': '/pages/knowledge/index.html',
    
    // Auth Routes
    'login': '/pages/auth/login/index.html',
    'signup': '/pages/auth/signup/index.html',
    
    // Dashboard
    'dashboard': '/pages/dashboard/index.html',
    
    // Opportunities (New Workflow)
    'opportunities': '/pages/opportunities/index.html',       // Browse all published (all companies)
    'opportunities/create': '/pages/opportunities/create/index.html',
    'opportunities/view': '/pages/opportunities/view/index.html',
    'opportunities/details': '/pages/opportunities/details.html',
    'opportunities/my': '/pages/opportunities/my/index.html',   // My created opportunities
    'my-opportunities': '/pages/opportunities/my/index.html',   // Alias
    
    // Matches
    'matches': '/pages/matches/index.html',
    
    // Proposals
    'proposals': '/pages/proposals/index.html',
    'proposals/create': '/pages/proposals/create/index.html',
    'proposals/submit': '/pages/proposals/submit.html',
    'proposals/view': '/pages/proposals/view/index.html',
    'create-proposal': '/pages/proposals/create/index.html', // Alias
    
    // Pipeline
    'pipeline': '/pages/pipeline/index.html',
    
    // Auth
    'demo-login': '/pages/auth/demo-login.html',
    
    // Contracts
    'contracts': '/pages/contracts/index.html',
    'contracts/view': '/pages/contracts/view/index.html',
    
    // Collaboration Models
    'collaboration': '/pages/collaboration/index.html',
    'collab-task-based': '/pages/collaboration/task-based/index.html',
    'collab-consortium': '/pages/collaboration/consortium/index.html',
    'collab-jv': '/pages/collaboration/joint-venture/index.html',
    'collab-spv': '/pages/collaboration/spv/index.html',
    'collab-strategic-jv': '/pages/collaboration/strategic-jv/index.html',
    'collab-strategic-alliance': '/pages/collaboration/strategic-alliance/index.html',
    'collab-mentorship': '/pages/collaboration/mentorship/index.html',
    'collab-bulk-purchasing': '/pages/collaboration/bulk-purchasing/index.html',
    'collab-co-ownership': '/pages/collaboration/co-ownership/index.html',
    'collab-resource-exchange': '/pages/collaboration/resource-exchange/index.html',
    'collab-professional-hiring': '/pages/collaboration/professional-hiring/index.html',
    'collab-consultant-hiring': '/pages/collaboration/consultant-hiring/index.html',
    'collab-competition': '/pages/collaboration/competition/index.html',
    
    // Profile & Settings
    'profile': '/pages/profile/index.html',
    'onboarding': '/pages/onboarding/index.html',
    'notifications': '/pages/notifications/index.html',
    
    // Admin Routes
    'admin': '/pages/admin/index.html',
    'admin-vetting': '/pages/admin-vetting/index.html',
    'admin-moderation': '/pages/admin-moderation/index.html',
    'admin-audit': '/pages/admin-audit/index.html',
    'admin-reports': '/pages/admin-reports/index.html',
    'admin-directory': '/pages/admin/directory/index.html',
    'admin-users-management': '/pages/admin/users-management/index.html',
    
    // Legacy Routes (redirect to opportunities)
    'projects': '/pages/opportunities/my/index.html',
    'project': '/pages/opportunities/my/index.html',
    'create-project': '/pages/opportunities/create/index.html',
    'my-projects': '/pages/opportunities/my/index.html',
    
    // Audit (alias for admin-audit)
    'audit': '/pages/admin-audit/index.html'
  };

  /**
   * Detect if running on Live Server
   * @returns {boolean} True if running on Live Server (port 5503)
   */
  function isLiveServer() {
    return window.location.port === '5503' || 
           (window.location.hostname === '127.0.0.1' && window.location.port === '5503');
  }

  /**
   * Get route URL by key
   * @param {string} routeKey - Route key (e.g., 'dashboard', 'opportunities')
   * @param {Object} options - Options
   * @param {boolean} options.useLiveServer - Force Live Server URL format (auto-detected if not specified)
   * @returns {string} Route URL
   */
  function getRoute(routeKey, options = {}) {
    const route = NAV_ROUTES[routeKey];
    if (!route) {
      console.warn(`[NavRoutes] Route not found: ${routeKey}`);
      return '#';
    }
    
    // Auto-detect Live Server if useLiveServer option is not explicitly set to false
    const shouldUseLiveServer = options.useLiveServer !== false && isLiveServer();
    
    if (shouldUseLiveServer) {
      // For local Live Server, add /POC prefix
      return `http://127.0.0.1:5503/POC${route}`;
    }
    
    return route;
  }

  /**
   * Get route URL with query parameters
   * @param {string} routeKey - Route key
   * @param {Object} queryParams - Query parameters object
   * @param {Object} options - Options
   * @returns {string} Route URL with query string
   */
  function getRouteWithQuery(routeKey, queryParams = {}, options = {}) {
    const baseUrl = getRoute(routeKey, options);
    if (!queryParams || Object.keys(queryParams).length === 0) {
      return baseUrl;
    }
    
    const queryString = Object.entries(queryParams)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    return `${baseUrl}?${queryString}`;
  }

  /**
   * Convert relative path to HTML URL
   * @param {string} path - Relative path (e.g., 'dashboard/', '../opportunities/')
   * @returns {string} Absolute HTML URL
   */
  function toHtmlUrl(path) {
    if (!path || path === '#') return '#';
    
    // If already absolute URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Remove leading/trailing slashes and ../ prefixes
    let cleanPath = path.replace(/^\.\.\//g, '').replace(/\/$/, '');
    
    // Check if it's a route key
    if (NAV_ROUTES[cleanPath]) {
      return getRoute(cleanPath);
    }
    
    // Check if it ends with .html
    if (cleanPath.endsWith('.html')) {
      if (isLiveServer()) {
        return `http://127.0.0.1:5503/POC/pages/${cleanPath}`;
      }
      return `/pages/${cleanPath}`;
    }
    
    // Assume it's a page directory
    if (isLiveServer()) {
      return `http://127.0.0.1:5503/POC/pages/${cleanPath}/index.html`;
    }
    return `/pages/${cleanPath}/index.html`;
  }

  // Export
  window.NavRoutes = {
    NAV_ROUTES,
    getRoute,
    getRouteWithQuery,
    toHtmlUrl
  };

})();
