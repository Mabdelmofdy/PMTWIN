/**
 * Router - Simplified for backward compatibility
 * Redirects hash-based routes to HTML files
 */

(function() {
  'use strict';

  // Route mapping: hash route -> directory path (updated for pages/ structure)
  const routeMap = {
    'home': 'pages/home/',
    'discovery': 'pages/discovery/',
    'wizard': 'pages/wizard/',
    'knowledge': 'pages/knowledge/',
    'login': 'pages/auth/login/',
    'signup': 'pages/auth/signup/',
    'dashboard': 'pages/dashboard/',
    'merchant-portal': 'pages/merchant-portal/',
    'projects': 'pages/projects/',
    'create-project': 'pages/projects/create/',
    'project': 'pages/projects/view/',
    'opportunities': 'pages/opportunities/',
    'matches': 'pages/matches/',
    'proposals': 'pages/proposals/',
    'create-proposal': 'pages/proposals/create/',
    'pipeline': 'pages/pipeline/',
    'collaboration': 'pages/collaboration/',
    'collab-task-based': 'pages/collaboration/task-based/',
    'collab-consortium': 'pages/collaboration/consortium/',
    'collab-jv': 'pages/collaboration/joint-venture/',
    'collab-spv': 'pages/collaboration/spv/',
    'collab-strategic-jv': 'pages/collaboration/strategic-jv/',
    'collab-strategic-alliance': 'pages/collaboration/strategic-alliance/',
    'collab-mentorship': 'pages/collaboration/mentorship/',
    'collab-bulk-purchasing': 'pages/collaboration/bulk-purchasing/',
    'collab-co-ownership': 'pages/collaboration/co-ownership/',
    'collab-resource-exchange': 'pages/collaboration/resource-exchange/',
    'collab-professional-hiring': 'pages/collaboration/professional-hiring/',
    'collab-consultant-hiring': 'pages/collaboration/consultant-hiring/',
    'collab-competition': 'pages/collaboration/competition/',
    'profile': 'pages/profile/',
    'onboarding': 'pages/onboarding/',
    'notifications': 'pages/notifications/',
    'admin': 'pages/admin/',
    'admin-vetting': 'pages/admin-vetting/',
    'admin-moderation': 'pages/admin-moderation/',
    'admin-audit': 'pages/admin-audit/',
    'admin-reports': 'pages/admin-reports/'
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
        targetFile = 'pages/projects/view/';
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
