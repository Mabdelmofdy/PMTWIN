/**
 * Router - Simplified for backward compatibility
 * Redirects hash-based routes to HTML files
 */

(function() {
  'use strict';

  // Route mapping: hash route -> absolute path ending with .html
  // Uses NAV_ROUTES when available, otherwise falls back to this map
  function getRouteMap() {
    // If NavRoutes is available, use it
    if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES) {
      const navRoutes = window.NavRoutes.NAV_ROUTES;
      // Convert NAV_ROUTES to routeMap format (without /POC prefix for relative paths)
      const routeMap = {};
      Object.keys(navRoutes).forEach(key => {
        // Remove /POC prefix and convert to relative path
        const path = navRoutes[key].replace('/POC/', '');
        routeMap[key] = path;
      });
      return routeMap;
    }
    
    // Fallback route map (absolute paths ending with .html)
    return {
      'home': '/POC/pages/home/index.html',
      'discovery': '/POC/pages/discovery/index.html',
      'wizard': '/POC/pages/wizard/index.html',
      'knowledge': '/POC/pages/knowledge/index.html',
      'login': '/POC/pages/auth/login/index.html',
      'signup': '/POC/pages/auth/signup/index.html',
      'dashboard': '/POC/pages/dashboard/index.html',
      'merchant-portal': '/POC/pages/merchant-portal/index.html',
      'projects': '/POC/pages/opportunities/index.html', // Redirect to opportunities
      'project': '/POC/pages/opportunities/index.html', // Redirect to opportunities (legacy)
      'opportunities': '/POC/pages/opportunities/index.html',
      'matches': '/POC/pages/matches/index.html',
      'proposals': '/POC/pages/proposals/index.html',
      'create-proposal': '/POC/pages/proposals/create/index.html',
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
      'profile': '/POC/pages/profile/index.html',
      'onboarding': '/POC/pages/onboarding/index.html',
      'notifications': '/POC/pages/notifications/index.html',
      'admin': '/POC/pages/admin/index.html',
      'admin-vetting': '/POC/pages/admin-vetting/index.html',
      'admin-moderation': '/POC/pages/admin-moderation/index.html',
      'admin-audit': '/POC/pages/admin-audit/index.html',
      'admin-reports': '/POC/pages/admin-reports/index.html'
    };
  }

  /**
   * Redirect hash route to HTML file
   */
  function redirectHashRoute() {
    const hash = window.location.hash;
    if (!hash || hash === '#') {
      return; // No hash, stay on current page
    }

    // Remove # from hash
    const route = hash.substring(1);
    
    // Get route map (uses NAV_ROUTES if available)
    const routeMap = getRouteMap();
    
    // Handle dynamic routes like #project/123 or #create-proposal?projectId=123
    let targetFile = null;
    let queryParams = '';

    if (route.includes('/')) {
      // Dynamic route like project/123
      const parts = route.split('/');
      const baseRoute = parts[0];
      const id = parts[1];
      
      if (baseRoute === 'project' && id) {
        // Redirect legacy project routes to opportunities
        if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES['opportunities']) {
          targetFile = window.NavRoutes.NAV_ROUTES['opportunities'];
        } else {
          targetFile = '/POC/pages/opportunities/index.html';
        }
        queryParams = `?id=${id}`;
      } else if (routeMap[baseRoute]) {
        targetFile = routeMap[baseRoute];
        if (id) {
          queryParams = `?id=${id}`;
        }
      }
    } else if (route.includes('?')) {
      // Route with query params like create-proposal?projectId=123
      const [baseRoute, params] = route.split('?');
      if (routeMap[baseRoute]) {
        targetFile = routeMap[baseRoute];
        queryParams = `?${params}`;
      }
    } else {
      // Simple route
      targetFile = routeMap[route];
    }

    if (targetFile) {
      // Normalize URL to ensure it ends with .html
      if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.toHtmlUrl) {
        targetFile = window.NavRoutes.toHtmlUrl(targetFile);
      } else if (!targetFile.endsWith('.html')) {
        // Fallback: ensure .html ending
        if (targetFile.endsWith('/')) {
          targetFile = targetFile + 'index.html';
        } else {
          targetFile = targetFile + '/index.html';
        }
      }
      window.location.replace(targetFile + queryParams);
    }
  }

  /**
   * Initialize router - only for backward compatibility
   */
  function init() {
    // Only redirect if we're on index.html and there's a hash
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
      if (window.location.hash) {
        redirectHashRoute();
      }
    }
  }

  // Export
  window.AppRouter = {
    init
  };

})();
