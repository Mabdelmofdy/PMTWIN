/**
 * Centralized Navigation Routes Map
 * Single source of truth for all navigation routes in the POC
 * All routes map to absolute paths ending with .html
 */

(function() {
  'use strict';

  // ============================================
  // Navigation Routes Map
  // All routes are absolute paths from /POC/ root, ending with .html
  // ============================================
  const NAV_ROUTES = {
    // Dashboard & Core
    'dashboard': '/POC/pages/dashboard/index.html',
    'home': '/POC/pages/home/index.html',
    'profile': '/POC/pages/profile/index.html',
    'settings': '/POC/pages/settings/index.html',
    'notifications': '/POC/pages/notifications/index.html',
    'onboarding': '/POC/pages/onboarding/index.html',
    'knowledge': '/POC/pages/knowledge/index.html',
    'wizard': '/POC/pages/wizard/index.html',
    'discovery': '/POC/pages/discovery/index.html',
    'merchant-portal': '/POC/pages/merchant-portal/index.html',

    // Projects (DEPRECATED - Redirects to Opportunities)
    'projects': '/POC/pages/opportunities/index.html', // Redirect to opportunities
    'my-projects': '/POC/pages/opportunities/index.html', // Redirect to opportunities
    'create-project': '/POC/pages/opportunities/create/index.html', // Redirect to opportunity creation
    'project-view': '/POC/pages/opportunities/index.html', // Redirect to opportunities list

    // Proposals
    'proposals': '/POC/pages/proposals/index.html',
    'proposals-list': '/POC/pages/proposals/list/index.html',
    'create-proposal': '/POC/pages/proposals/create/index.html',
    'proposal-view': '/POC/pages/proposals/view/index.html',

    // Matches & Opportunities
    'matches': '/POC/pages/matches/index.html',
    'opportunities': '/POC/pages/opportunities/index.html',
    'create-opportunity': '/POC/pages/opportunities/create/index.html',
    'pipeline': '/POC/pages/pipeline/index.html',

    // Collaboration
    'collaboration': '/POC/pages/collaboration/index.html',
    'collab-my-collaborations': '/POC/pages/collaboration/my-collaborations/index.html',
    'collab-opportunities': '/POC/pages/collaboration/opportunities/index.html',
    'collab-applications': '/POC/pages/collaboration/applications/index.html',
    'collab-view': '/POC/pages/collaboration/view/index.html',
    'collab-edit': '/POC/pages/collaboration/edit/index.html',
    
    // Collaboration - Project-Based
    'collab-task-based': '/POC/pages/collaboration/task-based/index.html',
    'collab-consortium': '/POC/pages/collaboration/consortium/index.html',
    'collab-jv': '/POC/pages/collaboration/joint-venture/index.html',
    'collab-spv': '/POC/pages/collaboration/spv/index.html',
    
    // Collaboration - Strategic
    'collab-strategic-jv': '/POC/pages/collaboration/strategic-jv/index.html',
    'collab-strategic-alliance': '/POC/pages/collaboration/strategic-alliance/index.html',
    'collab-mentorship': '/POC/pages/collaboration/mentorship/index.html',
    
    // Collaboration - Resource Pooling
    'collab-bulk-purchasing': '/POC/pages/collaboration/bulk-purchasing/index.html',
    'collab-co-ownership': '/POC/pages/collaboration/co-ownership/index.html',
    'collab-resource-exchange': '/POC/pages/collaboration/resource-exchange/index.html',
    
    // Collaboration - Hiring
    'collab-professional-hiring': '/POC/pages/collaboration/professional-hiring/index.html',
    'collab-consultant-hiring': '/POC/pages/collaboration/consultant-hiring/index.html',
    
    // Collaboration - Competition
    'collab-competition': '/POC/pages/collaboration/competition/index.html',

    // Services
    'my-services': '/POC/pages/my-services/index.html',
    'services-marketplace': '/POC/pages/services-marketplace/index.html',
    'service-providers': '/POC/pages/service-providers/index.html',
    'service-provider-profile': '/POC/pages/service-providers/profile/index.html',
    'skills-search': '/POC/pages/service-providers/skills-search.html',
    'service-requests': '/POC/pages/service-requests/index.html',
    'service-requests-create': '/POC/pages/service-requests/create/index.html',
    'service-requests-view': '/POC/pages/service-requests/view/index.html',
    'service-engagements': '/POC/pages/service-engagements/index.html',

    // Admin Routes
    'admin': '/POC/pages/admin/index.html',
    'admin-vetting': '/POC/pages/admin-vetting/index.html',
    'admin-moderation': '/POC/pages/admin-moderation/index.html',
    'admin-audit': '/POC/pages/admin-audit/index.html',
    'admin-reports': '/POC/pages/admin-reports/index.html',
    'admin-users-management': '/POC/pages/admin/users-management/index.html',
    'admin-models-management': '/POC/pages/admin/models-management/index.html',
    'admin-directory': '/POC/pages/admin/directory/index.html',
    'admin-analytics': '/POC/pages/admin/analytics/index.html',
    'admin-settings': '/POC/pages/admin/settings/index.html',
    'admin-contracts': '/POC/pages/admin/contracts/index.html',
    'admin-service-providers': '/POC/pages/admin/admin-service-providers/index.html',
    'admin-service-requests': '/POC/pages/admin/admin-service-requests/index.html',
    'admin-login': '/POC/pages/admin/login/index.html',

    // Auth Routes
    'login': '/POC/pages/auth/login/index.html',
    'signup': '/POC/pages/auth/signup/index.html',
    'auth-home': '/POC/pages/auth/home/index.html'
  };

  // ============================================
  // URL Normalization Helper
  // Ensures any URL always ends with .html
  // ============================================
  function toHtmlUrl(url) {
    if (!url || url === '#' || url.startsWith('javascript:')) {
      return url;
    }

    // If already a full URL with .html, return as-is
    if (url.includes('://') && url.endsWith('.html')) {
      return url;
    }

    // Extract query string and hash manually (don't use URL constructor for relative paths)
    let pathPart = url;
    let queryPart = '';
    let hashPart = '';
    
    // Extract hash
    const hashIndex = pathPart.indexOf('#');
    if (hashIndex !== -1) {
      hashPart = pathPart.substring(hashIndex);
      pathPart = pathPart.substring(0, hashIndex);
    }
    
    // Extract query string
    const queryIndex = pathPart.indexOf('?');
    if (queryIndex !== -1) {
      queryPart = pathPart.substring(queryIndex);
      pathPart = pathPart.substring(0, queryIndex);
    }
    
    // If it's a full URL, extract pathname properly
    if (url.includes('://')) {
      try {
        const urlObj = new URL(url);
        pathPart = urlObj.pathname;
        queryPart = urlObj.search;
        hashPart = urlObj.hash;
      } catch (e) {
        // If URL parsing fails, use the original pathPart
      }
    }

    // Handle absolute paths from /POC/
    if (pathPart.startsWith('/POC/')) {
      let normalizedPath = pathPart;
      
      // Remove trailing slash and add index.html if needed
      if (normalizedPath.endsWith('/')) {
        normalizedPath = normalizedPath.slice(0, -1) + '/index.html';
      } else if (!normalizedPath.endsWith('.html')) {
        // If it's a directory path without .html, add index.html
        normalizedPath = normalizedPath + '/index.html';
      }
      
      return normalizedPath + queryPart + hashPart;
    }

    // Handle Live Server URLs (http://127.0.0.1:5503/...)
    if (url.includes('://127.0.0.1:5503') || url.includes('://localhost:5503')) {
      const urlObj2 = new URL(url);
      let pathPart2 = urlObj2.pathname;
      
      if (pathPart2.startsWith('/POC/')) {
        if (pathPart2.endsWith('/')) {
          pathPart2 = pathPart2.slice(0, -1) + '/index.html';
        } else if (!pathPart2.endsWith('.html')) {
          pathPart2 = pathPart2 + '/index.html';
        }
        return urlObj2.origin + pathPart2 + urlObj2.search + urlObj2.hash;
      }
    }

    // Handle relative paths (../ or ./)
    if (pathPart.startsWith('../') || pathPart.startsWith('./') || (!pathPart.startsWith('/') && !pathPart.includes('://'))) {
      // For relative paths, we need to convert to absolute
      // This is a simplified conversion - assumes all pages are under /POC/pages/
      let cleanPath = pathPart.replace(/^\.\.\//g, '').replace(/^\.\//g, '');
      
      // Remove leading slash if present
      if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
      }
      
      // If it doesn't start with POC/, assume it's under pages/
      if (!cleanPath.startsWith('POC/')) {
        cleanPath = 'POC/pages/' + cleanPath;
      }
      
      // Ensure .html ending
      if (cleanPath.endsWith('/')) {
        cleanPath = cleanPath.slice(0, -1) + '/index.html';
      } else if (!cleanPath.endsWith('.html')) {
        cleanPath = cleanPath + '/index.html';
      }
      
      return '/' + cleanPath + queryPart + hashPart;
    }

    // Default: assume it needs /index.html if no extension
    if (!pathPart.endsWith('.html') && !pathPart.includes('.')) {
      return pathPart + '/index.html' + queryPart + hashPart;
    }

    return url;
  }

  // ============================================
  // Get Route Helper
  // Gets a route from NAV_ROUTES map or normalizes the URL
  // ============================================
  function getRoute(routeKey, options = {}) {
    const { 
      useLiveServer = false,
      preserveQuery = true 
    } = options;

    // Check if routeKey exists in NAV_ROUTES
    if (NAV_ROUTES[routeKey]) {
      let route = NAV_ROUTES[routeKey];
      
      // If Live Server is detected and useLiveServer is true, convert to full URL
      if (useLiveServer || (typeof window !== 'undefined' && window.location.port === '5503')) {
        const isLiveServer = window.location.port === '5503' || 
                            (window.location.hostname === '127.0.0.1' && window.location.port === '5503');
        
        if (isLiveServer) {
          route = `http://127.0.0.1:5503${route}`;
        }
      }
      
      return route;
    }

    // If not in map, normalize the URL
    return toHtmlUrl(routeKey);
  }

  // ============================================
  // Get Route with Query String
  // Helper to build routes with query parameters
  // ============================================
  function getRouteWithQuery(routeKey, queryParams = {}) {
    const route = getRoute(routeKey);
    if (!queryParams || Object.keys(queryParams).length === 0) {
      return route;
    }

    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return `${route}?${queryString}`;
  }

  // ============================================
  // Export Public API
  // ============================================
  window.NavRoutes = {
    NAV_ROUTES,
    getRoute,
    getRouteWithQuery,
    toHtmlUrl
  };

})();
