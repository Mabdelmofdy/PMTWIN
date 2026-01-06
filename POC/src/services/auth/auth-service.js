/**
 * Authentication Service
 * Handles authentication-related operations
 */

(function() {
  'use strict';

  // This service wraps PMTwinAuth functionality
  // and adds role-based checks
  
  async function login(email, password) {
    if (typeof PMTwinAuth === 'undefined') {
      return { success: false, error: 'Authentication service not available' };
    }
    
    const result = await PMTwinAuth.login(email, password);
    
    if (result.success && result.user) {
      // Ensure user has a role assigned
      if (typeof PMTwinRBAC !== 'undefined') {
        const roleId = await PMTwinRBAC.getUserRole(result.user.id, result.user.email);
        if (!roleId || roleId === 'guest') {
          // Auto-assign role based on user.role
          const roleMapping = {
            'admin': 'admin',
            'entity': 'entity',
            'individual': 'individual'
          };
          const mappedRole = roleMapping[result.user.role] || 'individual';
          await PMTwinRBAC.assignRoleToUser(result.user.id, mappedRole, 'system', result.user.email);
        }
      }
    }
    
    return result;
  }

  function logout() {
    if (typeof PMTwinAuth === 'undefined') {
      return { success: false, error: 'Authentication service not available' };
    }
    return PMTwinAuth.logout();
  }

  async function register(userData) {
    if (typeof PMTwinAuth === 'undefined') {
      return { success: false, error: 'Authentication service not available' };
    }
    
    const result = await PMTwinAuth.register(userData);
    
    if (result.success && result.user) {
      // Assign role based on registration
      if (typeof PMTwinRBAC !== 'undefined') {
        const roleMapping = {
          'admin': 'admin',
          'entity': 'entity',
          'individual': 'individual'
        };
        const roleId = roleMapping[result.user.role] || 'individual';
        await PMTwinRBAC.assignRoleToUser(result.user.id, roleId, 'system', result.user.email);
      }
    }
    
    return result;
  }

  function getCurrentUser() {
    if (typeof PMTwinAuth === 'undefined') {
      return null;
    }
    return PMTwinAuth.getCurrentUser();
  }

  function isAuthenticated() {
    if (typeof PMTwinAuth === 'undefined') {
      return false;
    }
    return PMTwinAuth.isAuthenticated();
  }

  async function canAccessRoute(route, userId = null) {
    if (!isAuthenticated()) {
      return { allowed: false, redirect: '#/login' };
    }
    
    const user = userId ? PMTwinData.Users.getById(userId) : getCurrentUser();
    if (!user) {
      return { allowed: false, redirect: '#/login' };
    }
    
    // Check role-based access
    if (typeof PMTwinRBAC !== 'undefined') {
      const roleId = await PMTwinRBAC.getUserRole(user.id, user.email);
      const roleDef = await PMTwinRBAC.getRoleDefinition(roleId);
      
      if (roleDef) {
        // Check if route requires specific portal
        const routePortals = {
          'admin': ['admin_portal'],
          'user': ['user_portal'],
          'public': ['public_portal']
        };
        
        // Simple route checking (can be enhanced)
        if (route.startsWith('/admin') && !roleDef.portals.includes('admin_portal')) {
          return { allowed: false, redirect: '#/' };
        }
        if (route.startsWith('/user') && !roleDef.portals.includes('user_portal')) {
          return { allowed: false, redirect: '#/' };
        }
      }
    }
    
    return { allowed: true };
  }

  window.AuthService = {
    login,
    logout,
    register,
    getCurrentUser,
    isAuthenticated,
    canAccessRoute
  };

})();


