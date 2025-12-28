/**
 * PMTwin Role-Based Access Control Service
 * Manages roles, permissions, and feature access
 */

(function() {
  'use strict';

  let rolesData = null;
  let userRolesData = null;

  // ============================================
  // Data Loading
  // ============================================
  async function loadRolesData() {
    if (rolesData) return rolesData;
    
    try {
      const response = await fetch('data/roles.json');
      rolesData = await response.json();
      return rolesData;
    } catch (error) {
      console.error('Error loading roles data:', error);
      // Fallback to default roles structure
      return getDefaultRoles();
    }
  }

  async function loadUserRolesData() {
    if (userRolesData) return userRolesData;
    
    // Check localStorage first (for POC persistence)
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('pmtwin_user_roles');
      if (stored) {
        try {
          userRolesData = JSON.parse(stored);
          return userRolesData;
        } catch (e) {
          console.warn('Error parsing stored user roles:', e);
        }
      }
    }
    
    try {
      const response = await fetch('data/user-roles.json');
      userRolesData = await response.json();
      
      // Store in localStorage for persistence
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pmtwin_user_roles', JSON.stringify(userRolesData));
      }
      
      return userRolesData;
    } catch (error) {
      console.error('Error loading user roles data:', error);
      return { userRoles: [], defaultRole: 'guest' };
    }
  }

  function getDefaultRoles() {
    return {
      roles: {
        admin: {
          id: "admin",
          name: "Administrator",
          permissions: ["*"],
          features: ["*"],
          portals: ["admin_portal"]
        },
        entity: {
          id: "entity",
          name: "Entity/Company",
          permissions: ["create_projects", "view_own_projects"],
          features: ["user_dashboard", "project_creation"],
          portals: ["user_portal"]
        },
        individual: {
          id: "individual",
          name: "Individual Professional",
          permissions: ["view_projects", "create_proposals"],
          features: ["user_dashboard", "project_browsing"],
          portals: ["user_portal"]
        },
        guest: {
          id: "guest",
          name: "Guest",
          permissions: ["view_public_portal"],
          features: ["public_portal"],
          portals: ["public_portal"]
        }
      }
    };
  }

  // ============================================
  // Role Management
  // ============================================
  async function getUserRole(userId, email = null) {
    const userRoles = await loadUserRolesData();
    
    // Try to find by userId first
    let userRole = userRoles.userRoles.find(ur => ur.userId === userId);
    
    // If not found and email provided, try to find by email
    if (!userRole && email) {
      userRole = userRoles.userRoles.find(ur => ur.email === email);
    }
    
    // If still not found, check if user exists in PMTwinData
    if (!userRole && typeof PMTwinData !== 'undefined') {
      const user = PMTwinData.Users.getById(userId) || 
                   (email ? PMTwinData.Users.getByEmail(email) : null);
      
      if (user) {
        // Map legacy role to new role system
        const roleMapping = {
          'admin': 'admin',
          'entity': 'entity',
          'individual': 'individual'
        };
        
        const roleId = roleMapping[user.role] || userRoles.defaultRole;
        return roleId;
      }
    }
    
    return userRole?.roleId || userRoles.defaultRole;
  }

  async function getRoleDefinition(roleId) {
    const roles = await loadRolesData();
    return roles.roles[roleId] || null;
  }

  async function getAllRoles() {
    const roles = await loadRolesData();
    return Object.values(roles.roles);
  }

  // ============================================
  // Permission Checking
  // ============================================
  async function hasPermission(userId, permission, email = null) {
    const roleId = await getUserRole(userId, email);
    const roleDef = await getRoleDefinition(roleId);
    
    if (!roleDef) return false;
    
    // Admin has all permissions
    if (roleDef.permissions.includes('*')) return true;
    
    return roleDef.permissions.includes(permission);
  }

  async function hasAnyPermission(userId, permissions, email = null) {
    for (const permission of permissions) {
      if (await hasPermission(userId, permission, email)) {
        return true;
      }
    }
    return false;
  }

  async function hasAllPermissions(userId, permissions, email = null) {
    for (const permission of permissions) {
      if (!(await hasPermission(userId, permission, email))) {
        return false;
      }
    }
    return true;
  }

  // ============================================
  // Feature Access
  // ============================================
  async function hasFeatureAccess(userId, feature, email = null) {
    const roleId = await getUserRole(userId, email);
    const roleDef = await getRoleDefinition(roleId);
    
    if (!roleDef) return false;
    
    // Admin has all features
    if (roleDef.features.includes('*')) return true;
    
    return roleDef.features.includes(feature);
  }

  async function getAvailableFeatures(userId, email = null) {
    const roleId = await getUserRole(userId, email);
    const roleDef = await getRoleDefinition(roleId);
    
    if (!roleDef) return [];
    
    // Admin has all features
    if (roleDef.features.includes('*')) {
      const roles = await loadRolesData();
      const allFeatures = new Set();
      Object.values(roles.roles).forEach(role => {
        role.features.forEach(f => {
          if (f !== '*') allFeatures.add(f);
        });
      });
      return Array.from(allFeatures);
    }
    
    return roleDef.features || [];
  }

  async function getAvailablePortals(userId, email = null) {
    const roleId = await getUserRole(userId, email);
    const roleDef = await getRoleDefinition(roleId);
    
    if (!roleDef) return ['public_portal'];
    
    return roleDef.portals || ['public_portal'];
  }

  // ============================================
  // Role Assignment
  // ============================================
  async function assignRoleToUser(userId, roleId, assignedBy = 'system', email = null) {
    const userRoles = await loadUserRolesData();
    
    // Remove existing assignment
    userRoles.userRoles = userRoles.userRoles.filter(ur => ur.userId !== userId && ur.email !== email);
    
    // Add new assignment
    userRoles.userRoles.push({
      userId: userId,
      email: email || (typeof PMTwinData !== 'undefined' ? PMTwinData.Users.getById(userId)?.email : null),
      roleId: roleId,
      assignedAt: new Date().toISOString(),
      assignedBy: assignedBy,
      isActive: true
    });
    
    // Save to localStorage for POC (in production, this would be an API call)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pmtwin_user_roles', JSON.stringify(userRoles));
    }
    
    userRolesData = userRoles;
    return true;
  }

  async function removeRoleFromUser(userId, email = null) {
    const userRoles = await loadUserRolesData();
    
    userRoles.userRoles = userRoles.userRoles.filter(
      ur => ur.userId !== userId && ur.email !== email
    );
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pmtwin_user_roles', JSON.stringify(userRoles));
    }
    
    userRolesData = userRoles;
    return true;
  }

  // ============================================
  // Current User Helpers
  // ============================================
  async function getCurrentUserRole() {
    if (typeof PMTwinAuth === 'undefined' || !PMTwinAuth.isAuthenticated()) {
      return 'guest';
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) return 'guest';
    
    return await getUserRole(currentUser.id, currentUser.email);
  }

  async function canCurrentUserAccess(permission) {
    if (typeof PMTwinAuth === 'undefined' || !PMTwinAuth.isAuthenticated()) {
      return false;
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) return false;
    
    return await hasPermission(currentUser.id, permission, currentUser.email);
  }

  async function canCurrentUserSeeFeature(feature) {
    if (typeof PMTwinAuth === 'undefined' || !PMTwinAuth.isAuthenticated()) {
      // Check if guest can see this feature
      return await hasFeatureAccess(null, feature);
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return await hasFeatureAccess(null, feature);
    }
    
    return await hasFeatureAccess(currentUser.id, feature, currentUser.email);
  }

  async function getCurrentUserFeatures() {
    if (typeof PMTwinAuth === 'undefined' || !PMTwinAuth.isAuthenticated()) {
      return await getAvailableFeatures(null);
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return await getAvailableFeatures(null);
    }
    
    return await getAvailableFeatures(currentUser.id, currentUser.email);
  }

  // ============================================
  // Feature Filtering
  // ============================================
  async function filterFeaturesByRole(features, userId = null, email = null) {
    const availableFeatures = userId 
      ? await getAvailableFeatures(userId, email)
      : await getAvailableFeatures(null);
    
    return features.filter(feature => availableFeatures.includes(feature));
  }

  async function filterMenuItemsByRole(menuItems, userId = null, email = null) {
    const availableFeatures = userId 
      ? await getAvailableFeatures(userId, email)
      : await getAvailableFeatures(null);
    
    return menuItems.filter(item => {
      if (!item.feature) return true; // No feature requirement
      return availableFeatures.includes(item.feature);
    });
  }

  // ============================================
  // Public API
  // ============================================
  window.PMTwinRBAC = {
    // Role Management
    getUserRole,
    getRoleDefinition,
    getAllRoles,
    assignRoleToUser,
    removeRoleFromUser,
    
    // Permission Checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Feature Access
    hasFeatureAccess,
    getAvailableFeatures,
    getAvailablePortals,
    
    // Current User Helpers
    getCurrentUserRole,
    canCurrentUserAccess,
    canCurrentUserSeeFeature,
    getCurrentUserFeatures,
    
    // Filtering
    filterFeaturesByRole,
    filterMenuItemsByRole,
    
    // Data Loading
    loadRolesData,
    loadUserRolesData
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadRolesData();
      loadUserRolesData();
    });
  } else {
    loadRolesData();
    loadUserRolesData();
  }

})();

