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
      { id: 'dashboard', label: 'Dashboard', route: '#/dashboard', feature: 'user_dashboard' },
      { id: 'projects', label: 'Projects', route: '#/projects', feature: 'project_browsing' },
      { id: 'create-project', label: 'Create Project', route: '#/projects/create', feature: 'project_creation' },
      { id: 'proposals', label: 'Proposals', route: '#/proposals', feature: 'proposal_management' },
      { id: 'matches', label: 'Matches', route: '#/matches', feature: 'matches_view' },
      { id: 'collaboration', label: 'Collaboration', route: '#/collaboration', feature: 'collaboration_opportunities' },
      { id: 'profile', label: 'Profile', route: '#/profile', feature: 'profile_management' },
      { id: 'notifications', label: 'Notifications', route: '#/notifications', feature: 'notifications' },
      { id: 'admin-dashboard', label: 'Admin Dashboard', route: '#/admin/dashboard', feature: 'admin_dashboard' },
      { id: 'user-vetting', label: 'User Vetting', route: '#/admin/vetting', feature: 'user_vetting' },
      { id: 'user-management', label: 'User Management', route: '#/admin/users', feature: 'user_management' },
      { id: 'project-moderation', label: 'Project Moderation', route: '#/admin/projects', feature: 'project_moderation' },
      { id: 'audit-trail', label: 'Audit Trail', route: '#/admin/audit', feature: 'audit_trail' },
      { id: 'reports', label: 'Reports', route: '#/admin/reports', feature: 'reports' }
    ];
    
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


