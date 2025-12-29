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
    if (roleId === 'admin') {
      dashboardData.stats = {
        totalUsers: PMTwinData.Users.getAll().length,
        pendingUsers: PMTwinData.Users.getByStatus('pending').length,
        totalProjects: PMTwinData.Projects.getAll().length,
        activeProjects: PMTwinData.Projects.getActive().length,
        totalProposals: PMTwinData.Proposals.getAll().length
      };
      
      dashboardData.recentActivity = PMTwinData.Audit.getRecent(10);
    } else if (roleId === 'entity') {
      const userProjects = PMTwinData.Projects.getByCreator(currentUser.id);
      const userProposals = PMTwinData.Proposals.getAll().filter(p => {
        const project = PMTwinData.Projects.getById(p.projectId);
        return project && project.creatorId === currentUser.id;
      });
      
      dashboardData.stats = {
        totalProjects: userProjects.length,
        activeProjects: userProjects.filter(p => p.status === 'active').length,
        totalProposals: userProposals.length,
        pendingProposals: userProposals.filter(p => p.status === 'in_review').length
      };
      
      dashboardData.recentActivity = [
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
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    } else if (roleId === 'individual' || roleId === 'consultant') {
      const userProposals = PMTwinData.Proposals.getByProvider(currentUser.id);
      const userMatches = PMTwinData.Matches.getByProvider(currentUser.id);
      
      dashboardData.stats = {
        totalProposals: userProposals.length,
        activeProposals: userProposals.filter(p => p.status === 'in_review' || p.status === 'approved').length,
        totalMatches: userMatches.length,
        highMatches: userMatches.filter(m => m.score >= 80).length
      };
      
      dashboardData.recentActivity = [
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
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    }
    
    // Get notifications
    dashboardData.notifications = PMTwinData.Notifications.getUnread(currentUser.id);
    
    return { success: true, data: dashboardData };
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
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Base menu items
    const allMenuItems = [
      { id: 'dashboard', label: 'Dashboard', route: '#/dashboard', feature: 'user_dashboard', icon: '📊' },
      { id: 'projects', label: 'Projects', route: '#/projects', feature: 'project_browsing', icon: '🏗️' },
      { id: 'create-project', label: 'Create Project', route: '#/projects/create', feature: 'project_creation', icon: '➕' },
      { id: 'proposals', label: 'Proposals', route: '#/proposals', feature: 'proposal_management', icon: '📄' },
      { id: 'matches', label: 'Matches', route: '#/matches', feature: 'matches_view', icon: '🔗' },
      { id: 'collaboration', label: 'Collaboration', route: '#/collaboration', feature: 'collaboration_opportunities', icon: '🤝' },
      { id: 'profile', label: 'Profile', route: '#/profile', feature: 'profile_management', icon: '👤' },
      { id: 'notifications', label: 'Notifications', route: '#/notifications', feature: 'notifications', icon: '🔔' },
      { id: 'admin-dashboard', label: 'Admin Dashboard', route: '#/admin/dashboard', feature: 'admin_dashboard', icon: '⚙️' },
      { id: 'user-vetting', label: 'User Vetting', route: '#/admin/vetting', feature: 'user_vetting', icon: '✅' },
      { id: 'user-management', label: 'User Management', route: '#/admin/users', feature: 'user_management', icon: '👥' },
      { id: 'project-moderation', label: 'Project Moderation', route: '#/admin/projects', feature: 'project_moderation', icon: '🛡️' },
      { id: 'audit-trail', label: 'Audit Trail', route: '#/admin/audit', feature: 'audit_trail', icon: '📋' },
      { id: 'reports', label: 'Reports', route: '#/admin/reports', feature: 'reports', icon: '📊' }
    ];
    
    // Get available collaboration models for current user
    const availableModels = getAvailableCollaborationModels(currentUser.id);
    
    // Add collaboration models menu items (flat structure, grouped by category)
    if (availableModels.length > 0 && typeof CollaborationModels !== 'undefined') {
      const categories = CollaborationModels.getAllCategories();
      const categoryIcons = {
        '1': '🏗️',
        '2': '🤝',
        '3': '💼',
        '4': '👥',
        '5': '🏆'
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
            icon: categoryIcons[category.id] || '📋',
            isCategoryHeader: true
          });
          
          // Add individual model items
          categoryModels.forEach(model => {
            allMenuItems.push({
              id: `collab-model-${model.id}`,
              label: model.name,
              route: `#/collaboration?model=${model.id}`,
              feature: 'collaboration_opportunities',
              icon: categoryIcons[category.id] || '📋',
              indent: true // For visual indentation in sidebar
            });
          });
        }
      });
    }
    
    // Filter by role
    if (typeof PMTwinRBAC !== 'undefined') {
      const filtered = await PMTwinRBAC.filterMenuItemsByRole(allMenuItems, currentUser.id, currentUser.email);
      return { success: true, items: filtered };
    }
    
    // Fallback: filter by legacy role
    const role = currentUser.role;
    const filtered = allMenuItems.filter(item => {
      if (role === 'admin') return true;
      if (role === 'entity') {
        return !item.feature || ['user_dashboard', 'project_creation', 'project_management', 
                                'proposal_review', 'matches_view', 'profile_management', 
                                'notifications'].includes(item.feature);
      }
      if (role === 'individual') {
        return !item.feature || ['user_dashboard', 'project_browsing', 'matches_view', 
                                'proposal_creation', 'proposal_management', 'profile_management', 
                                'notifications'].includes(item.feature);
      }
      return false;
    });
    
    return { success: true, items: filtered };
  }

  window.DashboardService = {
    getDashboardData,
    getMenuItems
  };

})();


