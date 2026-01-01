/**
 * Dashboard Service
 * Provides role-based dashboard data
 */

(function() {
  'use strict';

  async function getDashboardData() {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Get user's role and available features
    let roleId = 'guest';
    let availableFeatures = [];
    
    if (typeof PMTwinRBAC !== 'undefined') {
      roleId = await PMTwinRBAC.getCurrentUserRole();
      availableFeatures = await PMTwinRBAC.getCurrentUserFeatures();
    } else {
      // Fallback to legacy role
      roleId = currentUser.role || 'guest';
    }
    
    const dashboardData = {
      user: currentUser,
      role: roleId,
      features: availableFeatures,
      stats: {},
      recentActivity: [],
      notifications: []
    };
    
    // Role-specific dashboard data
    if (roleId === 'project_lead') {
      dashboardData = getProjectLeadDashboard(currentUser);
    } else if (roleId === 'supplier') {
      dashboardData = getSupplierDashboard(currentUser);
    } else if (roleId === 'service_provider') {
      dashboardData = getServiceProviderDashboard(currentUser);
    } else if (roleId === 'professional') {
      dashboardData = getProfessionalDashboard(currentUser);
    } else if (roleId === 'consultant') {
      dashboardData = getConsultantDashboard(currentUser);
    } else if (roleId === 'mentor') {
      dashboardData = getMentorDashboard(currentUser);
    } else if (roleId === 'platform_admin') {
      dashboardData = getPlatformAdminDashboard(currentUser);
    } else if (roleId === 'auditor') {
      dashboardData = getAuditorDashboard(currentUser);
    } else {
      // Fallback for legacy roles
      if (roleId === 'admin' || roleId === 'entity' || roleId === 'individual') {
        dashboardData = getLegacyRoleDashboard(currentUser, roleId);
      }
    }
    
    // Get notifications
    dashboardData.notifications = PMTwinData.Notifications.getUnread(currentUser.id);
    
    return { success: true, data: dashboardData };
  }

  // ============================================
  // Role-Specific Dashboard Functions
  // ============================================
  
  function getProjectLeadDashboard(user) {
    const userProjects = PMTwinData.Projects.getByCreator(user.id);
    const userProposals = PMTwinData.Proposals.getAll().filter(p => {
      const project = PMTwinData.Projects.getById(p.projectId);
      return project && project.creatorId === user.id;
    });
    const collaborationOpps = PMTwinData.CollaborationOpportunities.getByCreator(user.id);
    
    return {
      user: user,
      role: 'project_lead',
      features: [],
      stats: {
        totalProjects: userProjects.length,
        activeProjects: userProjects.filter(p => p.status === 'active').length,
        totalTenders: userProjects.filter(p => p.modelType === 'tender').length,
        totalConsortia: collaborationOpps.filter(o => o.modelId === '1.2').length,
        totalSPVs: collaborationOpps.filter(o => o.modelId === '1.4').length,
        totalProposals: userProposals.length,
        pendingProposals: userProposals.filter(p => p.status === 'in_review').length
      },
      recentActivity: [
        ...userProjects.slice(0, 5).map(p => ({
          type: 'project',
          title: p.title,
          date: p.updatedAt || p.createdAt
        })),
        ...userProposals.slice(0, 5).map(p => ({
          type: 'proposal',
          title: `Proposal for ${PMTwinData.Projects.getById(p.projectId)?.title || 'Project'}`,
          date: p.submittedAt
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
      notifications: PMTwinData.Notifications.getUnread(user.id)
    };
  }
  
  function getSupplierDashboard(user) {
    const bulkPurchasing = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
      o.modelId === '3.1' && (o.creatorId === user.id || o.participants?.includes(user.id))
    );
    const inventoryListings = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
      o.modelId === '3.3' && o.creatorId === user.id
    );
    
    return {
      user: user,
      role: 'supplier',
      features: [],
      stats: {
        activeBulkPurchasing: bulkPurchasing.filter(o => o.status === 'active').length,
        totalInventoryListings: inventoryListings.length,
        activeListings: inventoryListings.filter(o => o.status === 'active').length,
        strategicAlliances: PMTwinData.CollaborationOpportunities.getAll().filter(o => 
          o.modelId === '2.2' && (o.creatorId === user.id || o.participants?.includes(user.id))
        ).length
      },
      recentActivity: [
        ...bulkPurchasing.slice(0, 5).map(o => ({
          type: 'bulk_purchasing',
          title: o.title,
          date: o.createdAt
        })),
        ...inventoryListings.slice(0, 5).map(o => ({
          type: 'inventory',
          title: o.title,
          date: o.createdAt
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
      notifications: PMTwinData.Notifications.getUnread(user.id)
    };
  }
  
  function getServiceProviderDashboard(user) {
    const taskEngagements = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
      o.modelId === '1.1' && (o.creatorId === user.id || o.applicants?.includes(user.id))
    );
    
    return {
      user: user,
      role: 'service_provider',
      features: [],
      stats: {
        activeServices: taskEngagements.filter(o => o.status === 'active').length,
        totalEngagements: taskEngagements.length,
        strategicAlliances: PMTwinData.CollaborationOpportunities.getAll().filter(o => 
          o.modelId === '2.2' && (o.creatorId === user.id || o.participants?.includes(user.id))
        ).length
      },
      recentActivity: taskEngagements.slice(0, 10).map(o => ({
        type: 'task_engagement',
        title: o.title,
        date: o.createdAt
      })),
      notifications: PMTwinData.Notifications.getUnread(user.id)
    };
  }
  
  function getProfessionalDashboard(user) {
    const userProposals = PMTwinData.Proposals.getByProvider(user.id);
    const userMatches = PMTwinData.Matches.getByProvider(user.id);
    const taskEngagements = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
      o.modelId === '1.1' && o.applicants?.includes(user.id)
    );
    const consortia = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
      o.modelId === '1.2' && o.applicants?.includes(user.id)
    );
    
    return {
      user: user,
      role: 'professional',
      features: [],
      stats: {
        totalProposals: userProposals.length,
        activeProposals: userProposals.filter(p => p.status === 'in_review' || p.status === 'approved').length,
        totalMatches: userMatches.length,
        highMatches: userMatches.filter(m => m.score >= 80).length,
        taskEngagements: taskEngagements.length,
        consortiaApplications: consortia.length
      },
      recentActivity: [
        ...userProposals.slice(0, 5).map(p => ({
          type: 'proposal',
          title: `Proposal for ${PMTwinData.Projects.getById(p.projectId)?.title || 'Project'}`,
          date: p.submittedAt
        })),
        ...userMatches.slice(0, 5).map(m => ({
          type: 'match',
          title: `Match for ${PMTwinData.Projects.getById(m.projectId)?.title || 'Project'}`,
          date: m.createdAt,
          score: m.score
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
      notifications: PMTwinData.Notifications.getUnread(user.id)
    };
  }
  
  function getConsultantDashboard(user) {
    const userProposals = PMTwinData.Proposals.getByProvider(user.id);
    const taskEngagements = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
      o.modelId === '1.1' && (o.creatorId === user.id || o.applicants?.includes(user.id))
    );
    const consultantHiring = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
      o.modelId === '4.2' && o.applicants?.includes(user.id)
    );
    
    return {
      user: user,
      role: 'consultant',
      features: [],
      stats: {
        totalProposals: userProposals.length,
        activeProposals: userProposals.filter(p => p.status === 'in_review' || p.status === 'approved').length,
        taskEngagements: taskEngagements.length,
        consultantHiringApplications: consultantHiring.length,
        strategicAlliances: PMTwinData.CollaborationOpportunities.getAll().filter(o => 
          o.modelId === '2.2' && (o.creatorId === user.id || o.participants?.includes(user.id))
        ).length
      },
      recentActivity: [
        ...userProposals.slice(0, 5).map(p => ({
          type: 'proposal',
          title: `Proposal for ${PMTwinData.Projects.getById(p.projectId)?.title || 'Project'}`,
          date: p.submittedAt
        })),
        ...taskEngagements.slice(0, 5).map(o => ({
          type: 'task_engagement',
          title: o.title,
          date: o.createdAt
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
      notifications: PMTwinData.Notifications.getUnread(user.id)
    };
  }
  
  function getMentorDashboard(user) {
    const mentorshipPrograms = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
      o.modelId === '2.3' && o.creatorId === user.id
    );
    const mentees = mentorshipPrograms.reduce((acc, program) => {
      return acc + (program.applicants?.length || 0);
    }, 0);
    
    return {
      user: user,
      role: 'mentor',
      features: [],
      stats: {
        activePrograms: mentorshipPrograms.filter(o => o.status === 'active').length,
        totalPrograms: mentorshipPrograms.length,
        totalMentees: mentees,
        activeMentees: mentorshipPrograms.filter(o => o.status === 'active').reduce((acc, program) => {
          return acc + (program.applicants?.length || 0);
        }, 0)
      },
      recentActivity: mentorshipPrograms.slice(0, 10).map(o => ({
        type: 'mentorship',
        title: o.title,
        date: o.createdAt,
        mentees: o.applicants?.length || 0
      })),
      notifications: PMTwinData.Notifications.getUnread(user.id)
    };
  }
  
  function getPlatformAdminDashboard(user) {
    const allUsers = PMTwinData.Users.getAll();
    const pendingUsers = allUsers.filter(u => u.onboardingStage === 'under_review');
    
    return {
      user: user,
      role: 'platform_admin',
      features: [],
      stats: {
        totalUsers: allUsers.length,
        pendingUsers: pendingUsers.length,
        totalProjects: PMTwinData.Projects.getAll().length,
        activeProjects: PMTwinData.Projects.getActive().length,
        totalProposals: PMTwinData.Proposals.getAll().length,
        pendingVerifications: pendingUsers.length,
        totalCollaborations: PMTwinData.CollaborationOpportunities.getAll().length
      },
      recentActivity: PMTwinData.Audit.getRecent(10),
      notifications: PMTwinData.Notifications.getUnread(user.id)
    };
  }
  
  function getAuditorDashboard(user) {
    return {
      user: user,
      role: 'auditor',
      features: [],
      stats: {
        totalUsers: PMTwinData.Users.getAll().length,
        totalProjects: PMTwinData.Projects.getAll().length,
        totalProposals: PMTwinData.Proposals.getAll().length,
        totalAuditLogs: PMTwinData.Audit.getAll().length,
        recentAuditLogs: PMTwinData.Audit.getRecent(100).length
      },
      recentActivity: PMTwinData.Audit.getRecent(10),
      notifications: PMTwinData.Notifications.getUnread(user.id)
    };
  }
  
  function getLegacyRoleDashboard(user, roleId) {
    // Legacy role handling for backward compatibility
    if (roleId === 'admin') {
      return getPlatformAdminDashboard(user);
    } else if (roleId === 'entity') {
      return getProjectLeadDashboard(user);
    } else if (roleId === 'individual') {
      return getProfessionalDashboard(user);
    }
    return {
      user: user,
      role: roleId,
      features: [],
      stats: {},
      recentActivity: [],
      notifications: PMTwinData.Notifications.getUnread(user.id)
    };
  }

  // ============================================
  // Helper: Map User Role to Relationship Types
  // ============================================
  function getUserRelationshipTypes(userRole, userType) {
    // Map user role/type to relationship types they can participate in
    // B2B = Business-to-Business
    // B2P = Business-to-Professional
    // P2B = Professional-to-Business
    // P2P = Professional-to-Professional
    
    if (userRole === 'admin') {
      // Admin can see all models
      return ['B2B', 'B2P', 'P2B', 'P2P'];
    }
    
    // Determine if user is a Business or Professional
    const isBusiness = userRole === 'entity' || userType === 'company';
    const isProfessional = userRole === 'individual' || userRole === 'consultant' || userType === 'consultant' || userType === 'individual';
    
    if (isBusiness) {
      // Business can participate in B2B and B2P
      return ['B2B', 'B2P'];
    } else if (isProfessional) {
      // Professional can participate in P2B and P2P
      return ['P2B', 'P2P'];
    }
    
    // Default: return empty array
    return [];
  }

  // ============================================
  // Helper: Get Available Collaboration Models
  // ============================================
  function getAvailableCollaborationModels(userId) {
    if (typeof PMTwinData === 'undefined' || typeof CollaborationModels === 'undefined') {
      return [];
    }
    
    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      return [];
    }
    
    // Get user's relationship types
    const userRole = user.role || 'guest';
    const userType = user.userType || null;
    const relationshipTypes = getUserRelationshipTypes(userRole, userType);
    
    if (relationshipTypes.length === 0) {
      return [];
    }
    
    // Get all models and filter by applicability
    const allModels = CollaborationModels.getAllModels();
    const availableModels = allModels.filter(model => {
      if (!model.applicability || model.applicability.length === 0) {
        return false;
      }
      // Check if model's applicability includes any of user's relationship types
      return model.applicability.some(applicableType => 
        relationshipTypes.includes(applicableType)
      );
    });
    
    return availableModels;
  }

  async function getMenuItems() {
    console.log('[DashboardService] getMenuItems() called');
    
    if (typeof PMTwinData === 'undefined') {
      console.error('[DashboardService] PMTwinData not available');
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      console.error('[DashboardService] User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }
    
    console.log('[DashboardService] Current user:', currentUser.email, 'Role:', currentUser.role);
    
    // Get base path for routes
    function getBasePath() {
      const currentPath = window.location.pathname;
      // Remove leading/trailing slashes and split
      const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC' && p !== '');
      
      // Count how many directory levels deep we are (excluding POC root and filename)
      const depth = segments.length;
      
      // Generate the appropriate number of ../ to reach POC root
      return depth > 0 ? '../'.repeat(depth) : '';
    }
    
    const basePath = getBasePath();
    
    // Base menu items with proper feature mappings and directory-based routes
    const allMenuItems = [
      // User Dashboard
      { id: 'dashboard', label: 'Dashboard', route: `${basePath}dashboard/`, feature: 'user_dashboard', icon: '<i class="ph ph-gauge"></i>' },
      
      // Projects Section
      // Note: 'My Projects' can be accessed with either project_management OR project_browsing
      { id: 'projects', label: 'My Projects', route: `${basePath}projects/`, feature: 'project_management', icon: '<i class="ph ph-buildings"></i>', alternativeFeatures: ['project_browsing'] },
      { id: 'create-project', label: 'Create Project', route: `${basePath}create-project/`, feature: 'project_creation', icon: '<i class="ph ph-plus-circle"></i>' },
      
      // Opportunities & Matching
      { id: 'opportunities', label: 'Opportunities', route: `${basePath}opportunities/`, feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>' },
      { id: 'matches', label: 'Matches', route: `${basePath}matches/`, feature: 'matches_view', icon: '<i class="ph ph-link"></i>' },
      
      // Proposals & Pipeline
      // Note: Proposals can be accessed with proposal_management OR proposal_creation OR proposal_review
      { id: 'proposals', label: 'Proposals', route: `${basePath}proposals/`, feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>', alternativeFeatures: ['proposal_creation', 'proposal_review'] },
      { id: 'pipeline', label: 'Pipeline', route: `${basePath}pipeline/`, feature: 'pipeline_management', icon: '<i class="ph ph-trend-up"></i>' },
      
      // Collaboration
      // Note: Collaboration can be accessed with collaboration_opportunities OR collaboration_applications
      { id: 'collaboration', label: 'Collaboration', route: `${basePath}collaboration/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-handshake"></i>', alternativeFeatures: ['collaboration_applications'] },
      
      // Services Section (Grouped)
      { 
        id: 'services-group', 
        label: 'Services', 
        route: '#', 
        feature: 'service_providers', // Show if user has any service-related permission
        icon: '<i class="ph ph-briefcase"></i>', 
        isGroup: true,
        children: [
          { id: 'service-providers', label: 'Service Providers', route: `${basePath}service-providers/`, feature: 'service_providers', icon: '<i class="ph ph-briefcase"></i>' },
          { id: 'my-services', label: 'My Services', route: `${basePath}my-services/`, feature: 'service_portfolio', icon: '<i class="ph ph-package"></i>' },
          { id: 'services-marketplace', label: 'Services Marketplace', route: `${basePath}services-marketplace/`, feature: 'service_offering:view', icon: '<i class="ph ph-storefront"></i>' }
        ],
        alternativeFeatures: ['service_portfolio', 'service_offering:view'] // Show group if user has any of these
      },
      
      // Profile & Settings
      { id: 'profile', label: 'Profile', route: `${basePath}profile/`, feature: 'profile_management', icon: '<i class="ph ph-user"></i>' },
      { id: 'onboarding', label: 'Onboarding', route: `${basePath}onboarding/`, feature: 'profile_management', icon: '<i class="ph ph-clipboard-text"></i>' },
      { id: 'notifications', label: 'Notifications', route: `${basePath}notifications/`, feature: 'notifications', icon: '<i class="ph ph-bell"></i>' },
      
      // Admin Section (will be filtered by RBAC)
      { id: 'admin-separator', label: '---', route: '#', feature: null, icon: '', isSeparator: true },
      { id: 'admin-dashboard', label: 'Admin Dashboard', route: `${basePath}admin/`, feature: 'admin_dashboard', icon: '<i class="ph ph-gear"></i>' },
      { id: 'discovery', label: 'Discovery', route: `${basePath}discovery/`, feature: 'admin_dashboard', icon: '<i class="ph ph-magnifying-glass"></i>' },
      { id: 'user-vetting', label: 'User Vetting', route: `${basePath}admin-vetting/`, feature: 'user_vetting', icon: '<i class="ph ph-check-circle"></i>' },
      { id: 'user-management', label: 'User Management', route: `${basePath}admin/users-management/`, feature: 'user_management', icon: '<i class="ph ph-users"></i>' },
      { id: 'project-moderation', label: 'Project Moderation', route: `${basePath}admin-moderation/`, feature: 'project_moderation', icon: '<i class="ph ph-shield-check"></i>' },
      { id: 'audit-trail', label: 'Audit Trail', route: `${basePath}admin-audit/`, feature: 'audit_trail', icon: '<i class="ph ph-clipboard"></i>' },
      { id: 'reports', label: 'Reports', route: `${basePath}admin-reports/`, feature: 'reports', icon: '<i class="ph ph-chart-bar"></i>' }
    ];
    
    // Get available collaboration models for current user
    const availableModels = getAvailableCollaborationModels(currentUser.id);
    
    // Add collaboration models menu items (flat structure, grouped by category)
    if (availableModels.length > 0 && typeof CollaborationModels !== 'undefined') {
      const categories = CollaborationModels.getAllCategories();
      const categoryIcons = {
        '1': '<i class="ph ph-buildings"></i>',
        '2': '<i class="ph ph-handshake"></i>',
        '3': '<i class="ph ph-briefcase"></i>',
        '4': '<i class="ph ph-users"></i>',
        '5': '<i class="ph ph-trophy"></i>'
      };
      
      // Add a separator before collaboration models
      allMenuItems.push({
        id: 'collab-separator',
        label: '---',
        route: '#',
        feature: null,
        icon: '',
        isSeparator: true
      });
      
      // Add category headers and their models
      categories.forEach(category => {
        const categoryModels = availableModels.filter(model => 
          model.category === category.name || model.id.startsWith(category.id + '.')
        );
        
        if (categoryModels.length > 0) {
          // Add category header (non-clickable, for visual grouping)
          allMenuItems.push({
            id: `collab-category-${category.id}`,
            label: category.name,
            route: `#/collaboration?category=${category.id}`,
            feature: 'collaboration_opportunities',
            icon: categoryIcons[category.id] || '<i class="ph ph-clipboard"></i>',
            isCategoryHeader: true
          });
          
          // Add individual model items
          categoryModels.forEach(model => {
            allMenuItems.push({
              id: `collab-model-${model.id}`,
              label: model.name,
              route: `#/collaboration?model=${model.id}`,
              feature: 'collaboration_opportunities',
              icon: categoryIcons[category.id] || '<i class="ph ph-clipboard"></i>',
              indent: true // For visual indentation in sidebar
            });
          });
        }
      });
    }
    
    // Filter by role using RBAC
    if (typeof PMTwinRBAC !== 'undefined') {
      try {
        // Ensure RBAC data is loaded
        await PMTwinRBAC.loadRolesData();
        await PMTwinRBAC.loadUserRolesData();
        
        // Get user's role
        const userRoleId = await PMTwinRBAC.getCurrentUserRole();
        const availableFeatures = await PMTwinRBAC.getCurrentUserFeatures();
        
        console.log('[DashboardService] User role:', userRoleId);
        console.log('[DashboardService] Available features:', availableFeatures);
        console.log('[DashboardService] Available features count:', availableFeatures?.length || 0);
        console.log('[DashboardService] Total menu items before filter:', allMenuItems.length);
        
        // Special case: platform_admin should see everything (check early)
        if (userRoleId === 'platform_admin' || currentUser.role === 'admin' || currentUser.role === 'platform_admin') {
          console.log('[DashboardService] Platform admin detected - showing all menu items');
          return { success: true, items: allMenuItems };
        }
        
        // If no features available, log warning and use fallback
        if (!availableFeatures || availableFeatures.length === 0) {
          console.warn('[DashboardService] No features available for user. Role:', userRoleId);
          console.warn('[DashboardService] User object:', currentUser);
          console.warn('[DashboardService] Falling back to legacy role-based filtering');
          // Fall through to legacy filtering below
        } else {
        
          // Filter menu items based on available features
          const filtered = allMenuItems.map(item => {
            // Always show separators
            if (item.isSeparator) return item;
            
            // Handle grouped items
            if (item.isGroup && item.children) {
              // Filter children based on permissions
              const filteredChildren = item.children.filter(child => {
                if (!child.feature) return false;
                
                let hasAccess = availableFeatures.includes(child.feature);
                
                // Check alternative features if primary feature not available
                if (!hasAccess && child.alternativeFeatures && Array.isArray(child.alternativeFeatures)) {
                  hasAccess = child.alternativeFeatures.some(altFeature => availableFeatures.includes(altFeature));
                }
                
                // Special case: platform_admin should see all
                if (userRoleId === 'platform_admin' || userRoleId === 'admin') {
                  return true;
                }
                
                return hasAccess;
              });
              
              // Check if group itself should be shown (either group feature OR any child accessible)
              let showGroup = false;
              
              // Check group's own feature requirement
              if (item.feature) {
                let groupHasAccess = availableFeatures.includes(item.feature);
                if (!groupHasAccess && item.alternativeFeatures && Array.isArray(item.alternativeFeatures)) {
                  groupHasAccess = item.alternativeFeatures.some(altFeature => availableFeatures.includes(altFeature));
                }
                if (groupHasAccess || userRoleId === 'platform_admin' || userRoleId === 'admin') {
                  showGroup = true;
                }
              }
              
              // Also show if any child is accessible
              if (filteredChildren.length > 0) {
                showGroup = true;
              }
              
              // Only show group if it has at least one accessible child OR group feature is available
              if (!showGroup || filteredChildren.length === 0) {
                return null; // Filter out empty groups
              }
              
              // Return group with filtered children
              return {
                ...item,
                children: filteredChildren
              };
            }
            
            // Regular item filtering
            // If no feature requirement, hide it (security: explicit permission required)
            if (!item.feature) {
              console.log('[DashboardService] Hiding item without feature:', item.id);
              return null;
            }
            
            // Check if user has access to the primary feature
            let hasAccess = availableFeatures.includes(item.feature);
            
            // Check alternative features if primary feature not available
            if (!hasAccess && item.alternativeFeatures && Array.isArray(item.alternativeFeatures)) {
              hasAccess = item.alternativeFeatures.some(altFeature => availableFeatures.includes(altFeature));
              if (hasAccess) {
                console.log(`[DashboardService] Item ${item.id} accessible via alternative feature`);
              }
            }
            
            // Special handling for admin features - only show if user is platform_admin
            if (item.feature.startsWith('admin_') && userRoleId !== 'platform_admin') {
              return null;
            }
            
            // Special case: platform_admin should see all menu items
            if (userRoleId === 'platform_admin' || userRoleId === 'admin') {
              return item;
            }
            
            if (!hasAccess) {
              console.log(`[DashboardService] Hiding ${item.id} - missing feature: ${item.feature}`);
              return null;
            }
            
            return item;
          }).filter(item => item !== null); // Remove null items
          
          console.log('[DashboardService] Filtered menu items:', filtered.length);
          console.log('[DashboardService] Menu items:', filtered.map(i => ({ id: i.id, label: i.label, feature: i.feature })));
          
          // Debug: Check if service-providers is in the list
          const hasServiceProviders = filtered.some(item => item.id === 'service-providers');
          console.log('[DashboardService] Service Providers menu item present:', hasServiceProviders);
          if (!hasServiceProviders) {
            console.warn('[DashboardService] Service Providers menu item is missing!');
            console.warn('[DashboardService] Available features include service_providers:', availableFeatures.includes('service_providers'));
          }
          
          // If filtered list is empty, log detailed info for debugging
          if (filtered.length === 0) {
            console.error('[DashboardService] WARNING: No menu items after filtering!');
            console.error('[DashboardService] User role:', userRoleId);
            console.error('[DashboardService] Available features:', availableFeatures);
            console.error('[DashboardService] All menu items:', allMenuItems.map(i => ({ id: i.id, feature: i.feature })));
            
            // Safety fallback: show at least dashboard and profile for authenticated users
            console.warn('[DashboardService] Using safety fallback - showing basic menu items');
            const fallbackItems = allMenuItems.filter(item => 
              item.feature === 'user_dashboard' || 
              item.feature === 'service_providers' ||
              item.feature === 'profile_management' || 
              item.feature === 'notifications' ||
              item.isSeparator
            );
            return { success: true, items: fallbackItems };
          }
          
          return { success: true, items: filtered };
        }
      } catch (error) {
        console.error('[DashboardService] Error filtering menu items:', error);
        console.error('[DashboardService] Error stack:', error.stack);
        // Fall through to legacy filtering
      }
    }
    
    // Fallback: filter by legacy role (for backward compatibility)
    const role = currentUser.role;
    console.log('[DashboardService] Using fallback filtering for legacy role:', role);
    
    const filtered = allMenuItems.map(item => {
      // Always show separators
      if (item.isSeparator) return item;
      
      // Admin sees everything
      if (role === 'admin' || role === 'platform_admin') {
        return item;
      }
      
      // Handle grouped items
      if (item.isGroup && item.children) {
        // Filter children based on role permissions (same logic as below)
        const filteredChildren = item.children.filter(child => {
          if (!child.feature) return false;
          
          // Entity/Project Lead permissions
          if (role === 'entity' || role === 'project_lead') {
            const allowedFeatures = [
              'user_dashboard', 
              'project_creation', 
              'project_management',
              'project_browsing',
              'proposal_review',
              'proposal_management',
              'matches_view',
              'pipeline_management',
              'collaboration_opportunities',
              'collaboration_applications',
              'service_providers',
              'service_portfolio',
              'service_offering:view',
              'profile_management', 
              'notifications'
            ];
            if (allowedFeatures.includes(child.feature)) return true;
            if (child.alternativeFeatures && child.alternativeFeatures.some(alt => allowedFeatures.includes(alt))) return true;
            return false;
          }
          
          // Individual/Professional permissions
          if (role === 'individual' || role === 'professional') {
            const allowedFeatures = [
              'user_dashboard',
              'project_browsing',
              'proposal_creation',
              'proposal_management',
              'matches_view',
              'pipeline_management',
              'collaboration_opportunities',
              'service_providers',
              'service_portfolio',
              'service_offering:view',
              'profile_management',
              'notifications'
            ];
            if (allowedFeatures.includes(child.feature)) return true;
            if (child.alternativeFeatures && child.alternativeFeatures.some(alt => allowedFeatures.includes(alt))) return true;
            return false;
          }
          
          // Service Provider permissions
          if (role === 'service_provider' || role === 'supplier' || role === 'consultant') {
            const allowedFeatures = [
              'user_dashboard',
              'service_providers',
              'service_portfolio',
              'service_offering:view',
              'profile_management',
              'notifications'
            ];
            if (allowedFeatures.includes(child.feature)) return true;
            if (child.alternativeFeatures && child.alternativeFeatures.some(alt => allowedFeatures.includes(alt))) return true;
            return false;
          }
          
          return false;
        });
        
        // Only show group if it has at least one accessible child
        if (filteredChildren.length === 0) {
          return null;
        }
        
        return {
          ...item,
          children: filteredChildren
        };
      }
      
      // Regular items - Entity/Project Lead permissions
      if (role === 'entity' || role === 'project_lead') {
        const allowedFeatures = [
          'user_dashboard', 
          'project_creation', 
          'project_management',
          'project_browsing', // Allow browsing too
          'proposal_review',
          'proposal_management', // Allow management too
          'matches_view',
          'pipeline_management',
          'collaboration_opportunities',
          'collaboration_applications', // Allow applications too
          'service_providers',
          'service_portfolio',
          'service_offering:view',
          'profile_management', 
          'notifications'
        ];
        
        // Check primary feature or alternative features
        if (!item.feature) return null;
        if (allowedFeatures.includes(item.feature)) return item;
        if (item.alternativeFeatures && item.alternativeFeatures.some(alt => allowedFeatures.includes(alt))) return item;
        return null;
      }
      
      // Regular items - Individual/Professional permissions
      if (role === 'individual' || role === 'professional') {
        const allowedFeatures = [
          'user_dashboard', 
          'project_browsing',
          'project_management', // Allow management too
          'matches_view', 
          'proposal_creation', 
          'proposal_management',
          'pipeline_management',
          'collaboration_opportunities',
          'collaboration_applications',
          'service_providers',
          'service_portfolio',
          'service_offering:view',
          'profile_management', 
          'notifications'
        ];
        
        // Check primary feature or alternative features
        if (!item.feature) return null;
        if (allowedFeatures.includes(item.feature)) return item;
        if (item.alternativeFeatures && item.alternativeFeatures.some(alt => allowedFeatures.includes(alt))) return item;
        return null;
      }
      
      // Supplier, Service Provider, Consultant, Mentor permissions
      if (role === 'supplier' || role === 'service_provider' || role === 'consultant' || role === 'mentor') {
        const allowedFeatures = [
          'user_dashboard',
          'project_browsing',
          'matches_view',
          'proposal_creation',
          'proposal_management',
          'pipeline_management',
          'collaboration_opportunities',
          'collaboration_applications',
          'service_providers',
          'profile_management',
          'notifications'
        ];
        
        // Check primary feature or alternative features
        if (!item.feature) return null;
        if (allowedFeatures.includes(item.feature)) return item;
        if (item.alternativeFeatures && item.alternativeFeatures.some(alt => allowedFeatures.includes(alt))) return item;
        return null;
      }
      
      // Default: show basic items for any authenticated user
      if (!item.feature) return null;
      const basicFeatures = ['user_dashboard', 'service_providers', 'service_portfolio', 'service_offering:view', 'profile_management', 'notifications'];
      if (basicFeatures.includes(item.feature)) return item;
      if (item.alternativeFeatures && item.alternativeFeatures.some(alt => basicFeatures.includes(alt))) return item;
      
      return null;
    }).filter(item => item !== null); // Remove null items
    
    console.log('[DashboardService] Fallback filtered menu items:', filtered.length);
    
      // Final safety check - if still empty, return at least dashboard
      if (filtered.length === 0) {
        console.error('[DashboardService] CRITICAL: No menu items even after fallback!');
        const basicItems = allMenuItems.filter(item => 
          item.id === 'dashboard' || 
          item.id === 'service-providers' ||
          item.id === 'profile' || 
          item.id === 'notifications' ||
          item.isSeparator
        );
      return { success: true, items: basicItems };
    }
    
    return { success: true, items: filtered };
  }

  window.DashboardService = {
    getDashboardData,
    getMenuItems
  };

})();


