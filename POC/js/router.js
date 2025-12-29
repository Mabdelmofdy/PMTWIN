/**
 * Router - Simplified for backward compatibility
 * Redirects hash-based routes to HTML files
 */

(function() {
  'use strict';

  // Route mapping: hash route -> directory path
  const routeMap = {
    'home': 'home/',
    'discovery': 'discovery/',
    'wizard': 'wizard/',
    'knowledge': 'knowledge/',
    'login': 'login/',
    'signup': 'signup/',
    'dashboard': 'dashboard/',
    'projects': 'projects/',
    'create-project': 'create-project/',
    'project': 'project/',
    'opportunities': 'opportunities/',
    'matches': 'matches/',
    'proposals': 'proposals/',
    'create-proposal': 'create-proposal/',
    'pipeline': 'pipeline/',
    'collaboration': 'collaboration/',
    'profile': 'profile/',
    'onboarding': 'onboarding/',
    'notifications': 'notifications/',
    'admin': 'admin/',
    'admin-vetting': 'admin-vetting/',
    'admin-moderation': 'admin-moderation/',
    'admin-audit': 'admin-audit/',
    'admin-reports': 'admin-reports/'
  };

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
    
    // Handle dynamic routes like #project/123 or #create-proposal?projectId=123
    let targetFile = null;
    let queryParams = '';

    if (route.includes('/')) {
      // Dynamic route like project/123
      const parts = route.split('/');
      const baseRoute = parts[0];
      const id = parts[1];
      
      if (baseRoute === 'project' && id) {
        targetFile = 'project/';
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
