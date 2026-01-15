/**
 * PMTwin Role-Based Access Control Service
 * Manages roles, permissions, and feature access
 */

(function() {
  'use strict';

  let rolesData = null;
  let userRolesData = null;

  // ============================================
  // Helper: Get Base Path for Data Files
  // ============================================
  function getDataBasePath() {
    // Calculate relative path from current page to POC root
    // For local development: count all path segments to determine depth
    const currentPath = window.location.pathname;
    
    // Remove leading/trailing slashes and split, filter out empty strings and HTML files
    // Also filter out 'POC' if it's in the path
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC');
    
    // Count how many directory levels deep we are
    // For example: /POC/pages/auth/login/index.html = 2 levels deep (pages, auth, login), need ../../../ to reach POC root
    // But if path is /pages/opportunities/create/index.html, we need ../../../ to reach POC root
    const depth = segments.length;
    
    // Generate the appropriate number of ../ to reach POC root
    const basePath = depth > 0 ? '../'.repeat(depth) : '';
    
    // Debug logging in development
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      console.log('[RoleService] Path calculation:', {
        pathname: currentPath,
        segments: segments,
        depth: depth,
        basePath: basePath
      });
    }
    
    return basePath;
  }

  // ============================================
  // Data Loading
  // ============================================
  async function loadRolesData() {
    if (rolesData) return rolesData;
    
    try {
      const basePath = getDataBasePath();
      const response = await fetch(basePath + 'data/roles.json');
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
      const basePath = getDataBasePath();
      const response = await fetch(basePath + 'data/user-roles.json');
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
        project_lead: {
          id: "project_lead",
          name: "Project Lead (Contractor)",
          permissions: ["create_projects", "view_own_projects"],
          features: ["user_dashboard", "project_creation"],
          portals: ["user_portal"]
        },
        supplier: {
          id: "supplier",
          name: "Supplier",
          permissions: ["view_public_projects"],
          features: ["user_dashboard", "bulk_purchasing"],
          portals: ["user_portal"]
        },
        service_provider: {
          id: "service_provider",
          name: "Service Provider",
          permissions: ["view_public_projects"],
          features: ["user_dashboard", "task_based_engagement"],
          portals: ["user_portal"]
        },
        professional: {
          id: "professional",
          name: "Professional / Expert",
          permissions: ["view_projects", "create_proposals"],
          features: ["user_dashboard", "project_browsing"],
          portals: ["user_portal"]
        },
        consultant: {
          id: "consultant",
          name: "Consultant",
          permissions: ["view_projects", "create_proposals"],
          features: ["user_dashboard", "project_browsing"],
          portals: ["user_portal"]
        },
        mentor: {
          id: "mentor",
          name: "Mentor",
          permissions: ["create_mentorship_programs"],
          features: ["user_dashboard", "mentorship_management"],
          portals: ["user_portal"]
        },
        admin: {
          id: "admin",
          name: "Admin",
          permissions: ["*"],
          features: ["*"],
          portals: ["admin_portal", "user_portal"]
        },
        platform_admin: {
          id: "platform_admin",
          name: "Platform Admin",
          permissions: ["*"],
          features: ["*"],
          portals: ["admin_portal", "user_portal"]
        },
        auditor: {
          id: "auditor",
          name: "Auditor",
          permissions: ["view_all_projects"],
          features: ["admin_dashboard", "audit_trail"],
          portals: ["admin_portal"]
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
    
    console.log('[RBAC] getUserRole called with:', { userId, email });
    console.log('[RBAC] User roles data:', userRoles);
    
    // Try to find by userId first
    let userRole = userRoles.userRoles.find(ur => ur.userId === userId);
    console.log('[RBAC] Found by userId:', userRole);
    
    // If not found and email provided, try to find by email
    if (!userRole && email) {
      userRole = userRoles.userRoles.find(ur => ur.email === email);
      console.log('[RBAC] Found by email:', userRole);
    }
    
    // If still not found, check if user exists in PMTwinData
    if (!userRole && typeof PMTwinData !== 'undefined') {
      const user = PMTwinData.Users.getById(userId) || 
                   (email ? PMTwinData.Users.getByEmail(email) : null);
      
      console.log('[RBAC] User from PMTwinData:', user);
      
      if (user) {
        // Map legacy role to new role system
        const roleMapping = {
          'admin': 'admin', // Map to admin role (not platform_admin)
          'platform_admin': 'platform_admin',
          'entity': 'entity',
          'project_lead': 'project_lead', // Keep as project_lead
          'beneficiary': 'project_lead', // Map beneficiary to project_lead
          'vendor': 'vendor',
          'service_provider': 'vendor', // Legacy mapping
          'skill_service_provider': 'service_provider',
          'sub_contractor': 'sub_contractor',
          'individual': 'professional', // Map individual to professional
          'professional': 'professional',
          'consultant': 'consultant',
          'supplier': 'supplier'
        };
        
        const roleId = roleMapping[user.role] || user.role || userRoles.defaultRole;
        console.log('[RBAC] Mapped legacy role:', user.role, '->', roleId);
        
        // Auto-assign role if not in user-roles.json
        if (!userRole) {
          console.log('[RBAC] Auto-assigning role to user');
          await assignRoleToUser(userId, roleId, 'system', email);
          return roleId;
        }
        
        return roleId;
      }
    }
    
    const finalRole = userRole?.roleId || userRoles.defaultRole;
    console.log('[RBAC] Final role:', finalRole);
    return finalRole;
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
  // Map router feature names to role feature names
  function mapFeatureToRoleFeatures(routerFeature) {
    const featureMap = {
      'dashboard': ['user_dashboard', 'admin_dashboard'],
      'projects': ['project_creation', 'project_management', 'project_browsing'],
      'proposals': ['proposal_creation', 'proposal_management', 'proposal_review'],
      'matching': ['matches_view'],
      'matches': ['matches_view'],
      'opportunities': ['matches_view'],
      'profile': ['profile_management'],
      'notifications': ['notifications'],
      'collaboration': ['collaboration_opportunities', 'collaboration_applications'],
      'pipeline': ['pipeline_management'],
      'service-providers': ['service_providers'],
      'service_providers': ['service_providers'],
      'onboarding': ['profile_management'], // Onboarding is part of profile management
      'admin': ['admin_dashboard', 'admin_directory', 'user_vetting', 'user_management', 'project_moderation', 'audit_trail', 'reports'],
      'public': ['public_portal', 'project_discovery_limited', 'pmtwin_wizard', 'knowledge_hub', 'registration'],
      'auth': ['registration'] // Auth features are public
    };
    
    return featureMap[routerFeature] || [routerFeature];
  }

  async function hasFeatureAccess(userId, feature, email = null) {
    const roleId = await getUserRole(userId, email);
    const roleDef = await getRoleDefinition(roleId);
    
    if (!roleDef) return false;
    
    // Admin has all features
    if (roleDef.features.includes('*')) return true;
    
    // Check if feature is directly in the role
    if (roleDef.features.includes(feature)) return true;
    
    // Map router feature to role features and check if any match
    const mappedFeatures = mapFeatureToRoleFeatures(feature);
    return mappedFeatures.some(mappedFeature => roleDef.features.includes(mappedFeature));
  }

  async function getAvailableFeatures(userId, email = null) {
    try {
      const roleId = await getUserRole(userId, email);
      console.log('[RBAC] getAvailableFeatures - roleId:', roleId);
      
      const roleDef = await getRoleDefinition(roleId);
      console.log('[RBAC] getAvailableFeatures - roleDef:', roleDef ? 'found' : 'not found');
      
      if (!roleDef) {
        console.warn('[RBAC] Role definition not found for:', roleId);
        return [];
      }
      
      // Admin has all features
      if (roleDef.features && roleDef.features.includes('*')) {
        console.log('[RBAC] Role has wildcard features - collecting all features');
        const roles = await loadRolesData();
        const allFeatures = new Set();
        Object.values(roles.roles).forEach(role => {
          if (role.features && Array.isArray(role.features)) {
            role.features.forEach(f => {
              if (f !== '*') allFeatures.add(f);
            });
          }
        });
        const featuresArray = Array.from(allFeatures);
        console.log('[RBAC] Collected', featuresArray.length, 'features for wildcard role');
        return featuresArray;
      }
      
      const features = roleDef.features || [];
      console.log('[RBAC] Returning', features.length, 'features for role:', roleId);
      return features;
    } catch (error) {
      console.error('[RBAC] Error in getAvailableFeatures:', error);
      console.error('[RBAC] Error stack:', error.stack);
      return [];
    }
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
      console.log('[RBAC] User not authenticated, returning guest');
      return 'guest';
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      console.log('[RBAC] No current user found, returning guest');
      return 'guest';
    }
    
    console.log('[RBAC] Getting role for user:', currentUser.email, 'ID:', currentUser.id);
    const role = await getUserRole(currentUser.id, currentUser.email);
    console.log('[RBAC] Resolved role:', role);
    return role;
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
      console.log('[RBAC] User not authenticated, returning guest features');
      return await getAvailableFeatures(null);
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      console.log('[RBAC] No current user, returning guest features');
      return await getAvailableFeatures(null);
    }
    
    console.log('[RBAC] Getting features for user:', currentUser.email);
    const features = await getAvailableFeatures(currentUser.id, currentUser.email);
    console.log('[RBAC] Available features:', features);
    return features;
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
    
    // Get user role for additional checks
    const roleId = userId ? await getUserRole(userId, email) : await getCurrentUserRole();
    
    return menuItems.filter(item => {
      // Always show separators
      if (item.isSeparator) return true;
      
      // If no feature requirement, be cautious - only show if explicitly safe
      if (!item.feature) {
        // Don't show items without feature requirements unless they're explicitly safe
        // (like separators which are handled above)
        return false;
      }
      
      // Check if feature is in available features
      const hasFeatureAccess = availableFeatures.includes(item.feature);
      
      // Special handling for admin features
      if (item.feature.startsWith('admin_')) {
        // Only platform_admin should see admin features
        return roleId === 'platform_admin' && hasFeatureAccess;
      }
      
      // For other features, check if user has access
      return hasFeatureAccess;
    });
  }

  // ============================================
  // Role-to-Model Mapping
  // ============================================
  /**
   * Get available collaboration models for a role
   * Reads from roles.json instead of hardcoded map
   * @param {string} roleId - The role ID
   * @returns {Promise<string[]>} Array of model IDs (e.g., ['1.1', '1.2', '2.1'])
   */
  async function getAvailableModelsForRole(roleId) {
    const roleDef = await getRoleDefinition(roleId);
    
    if (!roleDef) {
      console.warn(`[RBAC] Role definition not found for: ${roleId}`);
      return [];
    }
    
    // Return availableModels from role definition, or empty array if not defined
    return roleDef.availableModels || [];
  }

  /**
   * Check if a role can access a specific collaboration model
   * @param {string} roleId - The role ID
   * @param {string} modelId - The model ID (e.g., '1.1', '2.3')
   * @returns {Promise<boolean>} True if role can access the model
   */
  async function canRoleAccessModel(roleId, modelId) {
    const availableModels = await getAvailableModelsForRole(roleId);
    return availableModels.includes(modelId);
  }

  /**
   * Get available models for current user
   * @returns {Promise<string[]>} Array of model IDs
   */
  async function getAvailableModelsForCurrentUser() {
    const roleId = await getCurrentUserRole();
    return getAvailableModelsForRole(roleId);
  }

  /**
   * Check if current user can access a specific model
   * @param {string} modelId - The model ID
   * @returns {Promise<boolean>} True if user can access the model
   */
  async function canCurrentUserAccessModel(modelId) {
    const roleId = await getCurrentUserRole();
    return canRoleAccessModel(roleId, modelId);
  }

  /**
   * Filter collaboration models by role
   * @param {Array} models - Array of model objects with 'id' property
   * @param {string} roleId - The role ID (optional, uses current user if not provided)
   * @returns {Promise<Array>} Filtered array of models
   */
  async function filterModelsByRole(models, roleId = null) {
    const targetRoleId = roleId || await getCurrentUserRole();
    const availableModelIds = await getAvailableModelsForRole(targetRoleId);
    
    return models.filter(model => {
      // Extract model ID (could be '1.1' or 'model-1.1' format)
      const modelId = model.id ? model.id.replace('model-', '').replace('model_', '') : null;
      return modelId && availableModelIds.includes(modelId);
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
    
    // Model Access
    getAvailableModelsForRole,
    canRoleAccessModel,
    getAvailableModelsForCurrentUser,
    canCurrentUserAccessModel,
    filterModelsByRole,
    
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

