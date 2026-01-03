/**
 * Services Loader
 * Dynamically loads all service modules
 * This file should be included after PMTwinData and PMTwinAuth are loaded
 */

(function() {
  'use strict';

  // Calculate base path from current page location
  // All active pages load services-loader.js with ../services/services-loader.js
  // So they're all in subdirectories and need ../ to reach the POC root
  function getBasePath() {
    const currentPath = window.location.pathname;
    // Remove leading/trailing slashes and split
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC' && p !== '');
    
    // Count how many levels deep we are (excluding POC root)
    // For example: /POC/admin/users-management/ = 2 levels deep, need ../../ to reach POC root
    const depth = segments.length;
    
    // Generate the appropriate number of ../ to reach POC root
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  const basePath = getBasePath();

  const services = [
    // Core RBAC service (must be loaded first)
    'services/rbac/role-service.js',
    
    // Feature services
    'services/auth/auth-service.js',
    'services/dashboard/dashboard-service.js',
    'services/projects/project-service.js',
    'services/proposals/proposal-service.js',
    'services/matching/matching-service.js',
    'services/collaboration/collaboration-service.js',
    'services/service-providers/service-provider-service.js',
    'services/service-offerings/service-offering-service.js',
    'services/service-evaluations/service-evaluation-service.js',
    'services/notifications/notification-service.js',
    'services/admin/admin-service.js'
  ];

  function loadService(servicePath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // Prepend base path to service path
      script.src = basePath + servicePath;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${basePath + servicePath}`));
      document.head.appendChild(script);
    });
  }

  async function loadAllServices() {
    try {
      console.log('[ServicesLoader] Starting to load services...');
      for (const service of services) {
        await loadService(service);
      }
      console.log('[ServicesLoader] ✅ All services loaded successfully');
      console.log('[ServicesLoader] DashboardService available:', typeof DashboardService !== 'undefined');
      console.log('[ServicesLoader] PMTwinRBAC available:', typeof PMTwinRBAC !== 'undefined');
      console.log('[ServicesLoader] MatchingService available:', typeof MatchingService !== 'undefined');
      console.log('[ServicesLoader] CollaborationService available:', typeof CollaborationService !== 'undefined');
      console.log('[ServicesLoader] ServiceOfferingService available:', typeof ServiceOfferingService !== 'undefined');
      console.log('[ServicesLoader] ServiceProviderService available:', typeof ServiceProviderService !== 'undefined');
      console.log('[ServicesLoader] ServiceEvaluationService available:', typeof ServiceEvaluationService !== 'undefined');
      
      // Initialize role assignments for existing users
      if (typeof PMTwinData !== 'undefined' && typeof PMTwinRBAC !== 'undefined') {
        initializeRoleAssignments();
      }
      
      // Dispatch event that services are loaded
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('servicesLoaded', { 
          detail: { 
            dashboardService: typeof DashboardService !== 'undefined',
            rbac: typeof PMTwinRBAC !== 'undefined',
            serviceOfferingService: typeof ServiceOfferingService !== 'undefined',
            serviceProviderService: typeof ServiceProviderService !== 'undefined',
            serviceEvaluationService: typeof ServiceEvaluationService !== 'undefined'
          } 
        }));
      }
    } catch (error) {
      console.error('[ServicesLoader] ❌ Error loading services:', error);
    }
  }

  async function initializeRoleAssignments() {
    // Ensure all existing users have roles assigned
    const users = PMTwinData.Users.getAll();
    const roleMapping = {
      'admin': 'admin',
      'entity': 'entity',
      'individual': 'individual'
    };

    for (const user of users) {
      const roleId = roleMapping[user.role] || 'individual';
      const existingRole = await PMTwinRBAC.getUserRole(user.id, user.email);
      
      if (!existingRole || existingRole === 'guest') {
        await PMTwinRBAC.assignRoleToUser(user.id, roleId, 'system', user.email);
        console.log(`✅ Assigned role ${roleId} to user ${user.email}`);
      }
    }
  }

  // Auto-load on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllServices);
  } else {
    loadAllServices();
  }

  // Export for manual loading if needed
  window.ServicesLoader = {
    loadAllServices,
    initializeRoleAssignments
  };

})();


