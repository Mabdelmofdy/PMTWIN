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
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    // If we have path segments (like 'login', 'dashboard', etc.), we're in a subdirectory
    // and need to go up one level to reach POC root
    return segments.length > 0 ? '../' : '';
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
      for (const service of services) {
        await loadService(service);
      }
      console.log('✅ All services loaded successfully');
      
      // Initialize role assignments for existing users
      if (typeof PMTwinData !== 'undefined' && typeof PMTwinRBAC !== 'undefined') {
        initializeRoleAssignments();
      }
    } catch (error) {
      console.error('❌ Error loading services:', error);
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


