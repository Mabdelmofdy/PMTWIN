/**
 * Navigation Routes Configuration
 * Centralized route mapping for the PMTwin application
 */

(function() {
  'use strict';

  // Route mapping: route key -> absolute path
  const NAV_ROUTES = {
    // Public Routes
    'home': '/POC/pages/home/index.html',
    'discovery': '/POC/pages/discovery/index.html',
    'wizard': '/POC/pages/wizard/index.html',
    'knowledge': '/POC/pages/knowledge/index.html',
    
    // Auth Routes
    'login': '/POC/pages/auth/login/index.html',
    'signup': '/POC/pages/auth/signup/index.html',
    
    // Dashboard
    'dashboard': '/POC/pages/dashboard/index.html',
    
    // Opportunities (New Workflow)
    'opportunities': '/POC/pages/opportunities/index.html',
    'opportunities/create': '/POC/pages/opportunities/create/index.html',
    'opportunities/view': '/POC/pages/opportunities/view/index.html',
    'opportunities/my': '/POC/pages/opportunities/my/index.html',
    
    // Matches
    'matches': '/POC/pages/matches/index.html',
    
    // Proposals
    'proposals': '/POC/pages/proposals/index.html',
    'proposals/create': '/POC/pages/proposals/create/index.html',
    'proposals/view': '/POC/pages/proposals/view/index.html',
    'create-proposal': '/POC/pages/proposals/create/index.html', // Alias
    
    // Contracts
    'contracts': '/POC/pages/contracts/index.html',
    'contracts/view': '/POC/pages/contracts/view/index.html',
    
    // Collaboration Models
    'collaboration': '/POC/pages/collaboration/index.html',
    'collab-task-based': '/POC/pages/collaboration/task-based/index.html',
    'collab-consortium': '/POC/pages/collaboration/consortium/index.html',
    'collab-jv': '/POC/pages/collaboration/joint-venture/index.html',
    'collab-spv': '/POC/pages/collaboration/spv/index.html',
    'collab-strategic-jv': '/POC/pages/collaboration/strategic-jv/index.html',
    'collab-strategic-alliance': '/POC/pages/collaboration/strategic-alliance/index.html',
    'collab-mentorship': '/POC/pages/collaboration/mentorship/index.html',
    'collab-bulk-purchasing': '/POC/pages/collaboration/bulk-purchasing/index.html',
    'collab-co-ownership': '/POC/pages/collaboration/co-ownership/index.html',
    'collab-resource-exchange': '/POC/pages/collaboration/resource-exchange/index.html',
    'collab-professional-hiring': '/POC/pages/collaboration/professional-hiring/index.html',
    'collab-consultant-hiring': '/POC/pages/collaboration/consultant-hiring/index.html',
    'collab-competition': '/POC/pages/collaboration/competition/index.html',
    
    // Profile & Settings
    'profile': '/POC/pages/profile/index.html',
    'onboarding': '/POC/pages/onboarding/index.html',
    'notifications': '/POC/pages/notifications/index.html',
    
    // Admin Routes
    'admin': '/POC/pages/admin/index.html',
    'admin-vetting': '/POC/pages/admin-vetting/index.html',
    'admin-moderation': '/POC/pages/admin-moderation/index.html',
    'admin-audit': '/POC/pages/admin-audit/index.html',
    'admin-reports': '/POC/pages/admin-reports/index.html',
    'admin-directory': '/POC/pages/admin/directory/index.html',
    'admin-users-management': '/POC/pages/admin/users-management/index.html',
    
    // Legacy Routes (redirect to opportunities)
    'projects': '/POC/pages/opportunities/index.html',
    'project': '/POC/pages/opportunities/index.html',
    'create-project': '/POC/pages/opportunities/create/index.html',
    'my-projects': '/POC/pages/opportunities/my/index.html',
    
    // Audit (alias for admin-audit)
    'audit': '/POC/pages/admin-audit/index.html'
  };

  /**
   * Get route URL by key
   * @param {string} routeKey - Route key (e.g., 'dashboard', 'opportunities')
   * @param {Object} options - Options
   * @param {boolean} options.useLiveServer - Use Live Server URL format
   * @returns {string} Route URL
   */
  function getRoute(routeKey, options = {}) {
    const route = NAV_ROUTES[routeKey];
    if (!route) {
      console.warn(`[NavRoutes] Route not found: ${routeKey}`);
      return '#';
    }
    
    if (options.useLiveServer) {
      const isLiveServer = window.location.port === '5503' || 
                          (window.location.hostname === '127.0.0.1' && window.location.port === '5503');
      if (isLiveServer && route.startsWith('/POC/')) {
        return `http://127.0.0.1:5503${route}`;
      }
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
      return getRoute(cleanPath, { useLiveServer: true });
    }
    
    // Check if it ends with .html
    if (cleanPath.endsWith('.html')) {
      const isLiveServer = window.location.port === '5503' || 
                          (window.location.hostname === '127.0.0.1' && window.location.port === '5503');
      if (isLiveServer) {
        return `http://127.0.0.1:5503/POC/pages/${cleanPath}`;
      }
      return `/POC/pages/${cleanPath}`;
    }
    
    // Assume it's a page directory
    const isLiveServer = window.location.port === '5503' || 
                        (window.location.hostname === '127.0.0.1' && window.location.port === '5503');
    if (isLiveServer) {
      return `http://127.0.0.1:5503/POC/pages/${cleanPath}/index.html`;
    }
    return `/POC/pages/${cleanPath}/index.html`;
  }

  // Export
  window.NavRoutes = {
    NAV_ROUTES,
    getRoute,
    getRouteWithQuery,
    toHtmlUrl
  };

})();
