/**
 * PMTwin User Manager
 * Centralized user authentication management
 * Loads all demo users from demo-users.json and creates them in the system
 */

(function() {
  'use strict';

  let demoUsersData = null;
  let usersInitialized = false;

  // ============================================
  // Load Demo Users from JSON
  // ============================================
  async function loadDemoUsersData() {
    if (demoUsersData) {
      return demoUsersData;
    }

    try {
      // Get base path for data files
      const currentPath = window.location.pathname;
      const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
      const basePath = segments.length > 0 ? '../' : '';
      
      const response = await fetch(basePath + 'data/demo-users.json');
      if (!response.ok) {
        throw new Error(`Failed to load demo users: ${response.status}`);
      }
      
      const data = await response.json();
      demoUsersData = data.users || [];
      console.log(`[UserManager] Loaded ${demoUsersData.length} demo users from JSON`);
      return demoUsersData;
    } catch (error) {
      console.error('[UserManager] Error loading demo users:', error);
      return [];
    }
  }

  // ============================================
  // Map Role to User Type
  // ============================================
  function mapRoleToUserType(role) {
    const roleToUserTypeMap = {
      'platform_admin': 'admin',
      'project_lead': 'entity',
      'professional': 'individual',
      'supplier': 'entity',
      'service_provider': 'entity',
      'consultant': 'consultant',
      'mentor': 'individual',
      'auditor': 'admin'
    };
    
    return roleToUserTypeMap[role] || 'individual';
  }

  // ============================================
  // Map Role to Legacy Role (for backward compatibility)
  // ============================================
  function mapRoleToLegacyRole(role) {
    const roleMap = {
      'platform_admin': 'admin',
      'project_lead': 'entity',
      'professional': 'individual',
      'supplier': 'entity',
      'service_provider': 'entity',
      'consultant': 'consultant',
      'mentor': 'individual',
      'auditor': 'admin'
    };
    
    return roleMap[role] || 'individual';
  }

  // ============================================
  // Initialize All Demo Users
  // ============================================
  async function initializeAllUsers() {
    if (usersInitialized) {
      console.log('[UserManager] Users already initialized');
      return;
    }

    if (typeof PMTwinData === 'undefined' || !PMTwinData.Users) {
      console.warn('[UserManager] PMTwinData.Users not available');
      return;
    }

    console.log('[UserManager] Initializing all demo users...');

    // Load demo users from JSON
    const demoUsers = await loadDemoUsersData();
    
    if (demoUsers.length === 0) {
      console.warn('[UserManager] No demo users found in JSON');
      return;
    }

    // Get existing users
    const existingUsers = PMTwinData.Users.getAll();
    const existingEmails = new Set(existingUsers.map(u => u.email));

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Create or update each demo user
    for (const demoUser of demoUsers) {
      const existingUser = existingUsers.find(u => u.email === demoUser.email);
      
      if (existingUser) {
        // Check if user needs update
        const needsUpdate = 
          existingUser.role !== mapRoleToLegacyRole(demoUser.role) ||
          !existingUser.profile?.status ||
          existingUser.profile?.status !== 'approved';
        
        if (needsUpdate) {
          // Update user with correct role and status
          const legacyRole = mapRoleToLegacyRole(demoUser.role);
          
          PMTwinData.Users.update(existingUser.id, {
            role: legacyRole,
            password: btoa(demoUser.password), // Update password
            profile: {
              ...existingUser.profile,
              name: demoUser.name,
              status: 'approved',
              approvedAt: existingUser.profile?.approvedAt || new Date().toISOString()
            },
            onboardingStage: 'approved',
            emailVerified: true
          });
          updated++;
          console.log(`[UserManager] Updated user: ${demoUser.email}`);
        } else {
          skipped++;
        }
      } else {
        // Create new user
        const userType = mapRoleToUserType(demoUser.role);
        const legacyRole = mapRoleToLegacyRole(demoUser.role);
        
        PMTwinData.Users.create({
          email: demoUser.email,
          password: btoa(demoUser.password), // Base64 encode password
          role: legacyRole,
          userType: userType,
          onboardingStage: 'approved',
          emailVerified: true,
          mobileVerified: false,
          profile: {
            name: demoUser.name,
            status: 'approved',
            createdAt: new Date().toISOString(),
            approvedAt: new Date().toISOString(),
            approvedBy: 'system'
          },
          onboardingProgress: {
            percentage: 100,
            currentStage: 'approved',
            nextSteps: []
          }
        });
        created++;
        console.log(`[UserManager] Created user: ${demoUser.email} (${demoUser.role})`);
      }
    }

    // Assign roles in RBAC system
    if (typeof PMTwinRBAC !== 'undefined') {
      const allUsers = PMTwinData.Users.getAll();
      
      for (const demoUser of demoUsers) {
        const user = allUsers.find(u => u.email === demoUser.email);
        if (user) {
          // Check if role is already assigned
          const currentRole = await PMTwinRBAC.getUserRole(user.id, user.email);
          if (currentRole !== demoUser.role) {
            await PMTwinRBAC.assignRoleToUser(user.id, demoUser.role, 'system', user.email);
            console.log(`[UserManager] Assigned role ${demoUser.role} to ${user.email}`);
          }
        }
      }
    }

    usersInitialized = true;
    console.log(`[UserManager] ✅ Initialization complete: ${created} created, ${updated} updated, ${skipped} skipped`);
  }

  // ============================================
  // Force Reinitialize All Users
  // ============================================
  async function forceReinitializeUsers() {
    usersInitialized = false;
    await initializeAllUsers();
  }

  // ============================================
  // Get User by Email
  // ============================================
  function getUserByEmail(email) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Users) {
      return null;
    }
    return PMTwinData.Users.getByEmail(email);
  }

  // ============================================
  // Verify All Users Exist
  // ============================================
  async function verifyAllUsersExist() {
    const demoUsers = await loadDemoUsersData();
    const existingUsers = PMTwinData.Users.getAll();
    const existingEmails = new Set(existingUsers.map(u => u.email));
    
    const missing = demoUsers.filter(du => !existingEmails.has(du.email));
    
    if (missing.length > 0) {
      console.warn(`[UserManager] Missing users: ${missing.map(u => u.email).join(', ')}`);
      return false;
    }
    
    return true;
  }

  // ============================================
  // Public API
  // ============================================
  window.UserManager = {
    initializeAllUsers: initializeAllUsers,
    forceReinitializeUsers: forceReinitializeUsers,
    loadDemoUsersData: loadDemoUsersData,
    getUserByEmail: getUserByEmail,
    verifyAllUsersExist: verifyAllUsersExist
  };

  // ============================================
  // Auto-Initialize on Load
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait for PMTwinData to be available
      setTimeout(() => {
        if (typeof PMTwinData !== 'undefined') {
          initializeAllUsers();
        }
      }, 500);
    });
  } else {
    // DOM already loaded
    setTimeout(() => {
      if (typeof PMTwinData !== 'undefined') {
        initializeAllUsers();
      }
    }, 500);
  }

})();

