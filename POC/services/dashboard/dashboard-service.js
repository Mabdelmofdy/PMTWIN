/**
 * Dashboard Service
 * Provides role-based dashboard data and menu items
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
    
    // Role-specific dashboard data with comprehensive stats
    if (roleId === 'platform_admin' || roleId === 'admin') {
      const allUsers = PMTwinData.Users.getAll();
      const allProjects = PMTwinData.Projects.getAll();
      const allProposals = PMTwinData.Proposals.getAll();
      const collaborationOpps = PMTwinData.CollaborationOpportunities.getAll();
      
      dashboardData.stats = {
        totalUsers: allUsers.length,
        pendingUsers: allUsers.filter(u => u.onboardingStage === 'pending' || u.status === 'pending').length,
        approvedUsers: allUsers.filter(u => u.onboardingStage === 'approved' || u.status === 'approved').length,
        suspendedUsers: allUsers.filter(u => u.status === 'suspended').length,
        totalProjects: allProjects.length,
        activeProjects: allProjects.filter(p => p.status === 'active').length,
        totalProposals: allProposals.length,
        pendingProposals: allProposals.filter(p => p.status === 'in_review').length,
        totalCollaborations: collaborationOpps.length,
        activeCollaborations: collaborationOpps.filter(o => o.status === 'active').length,
        totalTaskEngagements: collaborationOpps.filter(o => o.modelId === '1.1').length,
        totalConsortia: collaborationOpps.filter(o => o.modelId === '1.2').length,
        totalSPVs: collaborationOpps.filter(o => o.modelId === '1.4').length,
        totalProposals: allProposals.length,
        pendingProposals: allProposals.filter(p => p.status === 'in_review').length
      };
      
      dashboardData.recentActivity = PMTwinData.Audit.getRecent(10);
    } else if (roleId === 'project_lead' || roleId === 'entity') {
      const userProjects = PMTwinData.Projects.getByCreator(currentUser.id);
    const userProposals = PMTwinData.Proposals.getAll().filter(p => {
      const project = PMTwinData.Projects.getById(p.projectId);
        return project && project.creatorId === currentUser.id;
      });
      const collaborationOpps = PMTwinData.CollaborationOpportunities.getByCreator(currentUser.id);
      
      dashboardData.stats = {
        totalProjects: userProjects.length,
        activeProjects: userProjects.filter(p => p.status === 'active').length,
        totalProposals: userProposals.length,
        pendingProposals: userProposals.filter(p => p.status === 'in_review').length,
        totalCollaborations: collaborationOpps.length,
        activeCollaborations: collaborationOpps.filter(o => o.status === 'active').length,
        totalTaskEngagements: collaborationOpps.filter(o => o.modelId === '1.1').length,
        totalConsortia: collaborationOpps.filter(o => o.modelId === '1.2').length,
        totalSPVs: collaborationOpps.filter(o => o.modelId === '1.4').length
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
    } else if (roleId === 'professional' || roleId === 'individual' || roleId === 'consultant') {
      const userProposals = PMTwinData.Proposals.getByProvider(currentUser.id);
      const userMatches = PMTwinData.Matches.getByProvider(currentUser.id);
      const userApplications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
      
      dashboardData.stats = {
        totalProposals: userProposals.length,
        activeProposals: userProposals.filter(p => p.status === 'in_review' || p.status === 'approved').length,
        totalMatches: userMatches.length,
        highMatches: userMatches.filter(m => m.score >= 80).length,
        totalApplications: userApplications.length,
        pendingApplications: userApplications.filter(a => a.status === 'pending').length
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
    } else if (roleId === 'service_provider') {
      const userProposals = PMTwinData.Proposals.getByProvider(currentUser.id);
      const userMatches = PMTwinData.Matches.getByProvider(currentUser.id);
    const taskEngagements = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '1.1' && (o.creatorId === currentUser.id || o.applicants?.includes(currentUser.id))
      );
      
      // Load merchant portal statistics (service offerings)
      let merchantStats = {};
      let recentOfferings = [];
      let topPerformingOfferings = [];
      let categoryBreakdown = {};
      let performanceMetrics = {};
      
      if (typeof ServiceOfferingService !== 'undefined') {
        try {
          const statsResult = await ServiceOfferingService.getProviderStatistics(currentUser.id);
          if (statsResult.success && statsResult.statistics) {
            merchantStats = statsResult.statistics;
          }
          
          const offeringsResult = await ServiceOfferingService.getMyOfferings();
          if (offeringsResult.success && offeringsResult.offerings) {
            const allOfferings = offeringsResult.offerings;
            
            // Recent offerings
            recentOfferings = allOfferings
              .sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt || 0);
                const dateB = new Date(b.updatedAt || b.createdAt || 0);
                return dateB - dateA;
              })
              .slice(0, 5);
            
            // Top performing offerings (by views, inquiries, or quality score)
            topPerformingOfferings = [...allOfferings]
              .sort((a, b) => {
                const scoreA = (a.views || 0) * 0.3 + (a.inquiries || 0) * 0.5 + (a.qualityScore || 0) * 0.2;
                const scoreB = (b.views || 0) * 0.3 + (b.inquiries || 0) * 0.5 + (b.qualityScore || 0) * 0.2;
                return scoreB - scoreA;
              })
              .slice(0, 3);
            
            // Category breakdown
            categoryBreakdown = {};
            allOfferings.forEach(offering => {
              const category = offering.category || 'uncategorized';
              if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = {
                  count: 0,
                  active: 0,
                  totalViews: 0,
                  totalInquiries: 0
                };
              }
              categoryBreakdown[category].count++;
              if (offering.status === 'Active') categoryBreakdown[category].active++;
              categoryBreakdown[category].totalViews += (offering.views || 0);
              categoryBreakdown[category].totalInquiries += (offering.inquiries || 0);
            });
            
            // Performance metrics
            const activeOfferings = allOfferings.filter(o => o.status === 'Active');
            const totalViews = allOfferings.reduce((sum, o) => sum + (o.views || 0), 0);
            const totalInquiries = allOfferings.reduce((sum, o) => sum + (o.inquiries || 0), 0);
            const totalProposals = allOfferings.reduce((sum, o) => sum + (o.proposalsReceived || 0), 0);
            
            performanceMetrics = {
              conversionRate: totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : 0,
              inquiryToProposalRate: totalInquiries > 0 ? ((totalProposals / totalInquiries) * 100).toFixed(1) : 0,
              averageViewsPerOffering: activeOfferings.length > 0 ? (totalViews / activeOfferings.length).toFixed(1) : 0,
              averageInquiriesPerOffering: activeOfferings.length > 0 ? (totalInquiries / activeOfferings.length).toFixed(1) : 0,
              averageQualityScore: merchantStats.averageQualityScore || 0,
              averageRating: merchantStats.averageRating || null
            };
          }
        } catch (error) {
          console.error('Error loading merchant portal data:', error);
        }
      }
      
      dashboardData.stats = {
        // Merchant portal stats (service offerings)
        totalOfferings: merchantStats.totalOfferings || 0,
        activeOfferings: merchantStats.activeOfferings || 0,
        totalViews: merchantStats.totalViews || 0,
        totalInquiries: merchantStats.totalInquiries || 0,
        // Legacy stats
        totalProposals: userProposals.length,
        activeProposals: userProposals.filter(p => p.status === 'in_review' || p.status === 'approved').length,
        totalMatches: userMatches.length,
        highMatches: userMatches.filter(m => m.score >= 80).length,
        activeServices: taskEngagements.filter(o => o.status === 'active').length,
        totalEngagements: taskEngagements.length,
        strategicAlliances: PMTwinData.CollaborationOpportunities.getAll().filter(o => 
          o.modelId === '2.2' && (o.creatorId === currentUser.id || o.participants?.includes(currentUser.id))
        ).length
      };
      
      // Store merchant portal data for rendering
      dashboardData.merchantPortal = {
        recentOfferings: recentOfferings,
        topPerformingOfferings: topPerformingOfferings,
        categoryBreakdown: categoryBreakdown,
        performanceMetrics: performanceMetrics,
        statistics: merchantStats
      };
      
      dashboardData.recentActivity = [
        ...recentOfferings.slice(0, 3).map(o => ({
          type: 'offering',
          title: o.title || 'Service Offering',
          details: `Status: ${o.status || 'Draft'}`,
          date: o.updatedAt || o.createdAt,
          icon: '<i class="ph ph-package"></i>'
        })),
        ...taskEngagements.slice(0, 3).map(o => ({
          type: 'collaboration',
          title: o.title || o.modelName,
          date: o.createdAt,
          icon: '<i class="ph ph-handshake"></i>'
        })),
        ...userProposals.slice(0, 4).map(p => ({
          type: 'proposal',
          title: `Proposal for ${PMTwinData.Projects.getById(p.projectId)?.title || 'Project'}`,
          date: p.submittedAt,
          icon: '<i class="ph ph-file-text"></i>'
        }))
      ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 10);
    } else if (roleId === 'supplier') {
      const bulkPurchasing = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '3.1' && (o.creatorId === currentUser.id || o.participants?.includes(currentUser.id))
      );
      const inventoryListings = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '3.3' && o.creatorId === currentUser.id
      );
      
      dashboardData.stats = {
        activeBulkPurchasing: bulkPurchasing.filter(o => o.status === 'active').length,
        totalBulkPurchasing: bulkPurchasing.length,
        inventoryListings: inventoryListings.length,
        activeListings: inventoryListings.filter(o => o.status === 'active').length,
        strategicAlliances: PMTwinData.CollaborationOpportunities.getAll().filter(o => 
          o.modelId === '2.2' && (o.creatorId === currentUser.id || o.participants?.includes(currentUser.id))
        ).length
      };
      
      dashboardData.recentActivity = [
        ...bulkPurchasing.slice(0, 5).map(o => ({
          type: 'bulk_purchase',
          title: o.title || 'Bulk Purchasing',
          date: o.createdAt
        })),
        ...inventoryListings.slice(0, 5).map(o => ({
          type: 'inventory',
          title: o.title || 'Inventory Listing',
          date: o.createdAt
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    } else if (roleId === 'mentor') {
    const mentorshipPrograms = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '2.3' && o.creatorId === currentUser.id
    );
    const mentees = mentorshipPrograms.reduce((acc, program) => {
        const applications = PMTwinData.CollaborationApplications.getByOpportunity(program.id);
        return acc + applications.filter(a => a.status === 'approved').length;
    }, 0);
    
      dashboardData.stats = {
        activePrograms: mentorshipPrograms.filter(o => o.status === 'active').length,
        totalPrograms: mentorshipPrograms.length,
        totalMentees: mentees,
        activeMentees: mentorshipPrograms.filter(o => o.status === 'active').length
      };
      
      dashboardData.recentActivity = mentorshipPrograms.slice(0, 10).map(o => ({
        type: 'mentorship',
        title: o.title || 'Mentorship Program',
        date: o.createdAt
      }));
    } else if (roleId === 'auditor') {
      dashboardData.stats = {
        totalUsers: PMTwinData.Users.getAll().length,
        totalProjects: PMTwinData.Projects.getAll().length,
        totalProposals: PMTwinData.Proposals.getAll().length,
        totalCollaborations: PMTwinData.CollaborationOpportunities.getAll().length
      },
      dashboardData.recentActivity = PMTwinData.Audit.getRecent(10);
    }
    
    // Get notifications
    dashboardData.notifications = PMTwinData.Notifications.getUnread(currentUser.id);
    
    return { success: true, data: dashboardData };
  }

  // ============================================
  // Helper: Get User Relationship Types
  // ============================================
  function getUserRelationshipTypes(userRole, userType) {
    // Map roles to relationship types (B2B, B2P, P2B, P2P)
    const roleMap = {
      'project_lead': ['B2B', 'B2P'],
      'supplier': ['B2B', 'B2P'],
      'service_provider': ['B2B', 'B2P'],
      'professional': ['P2B', 'P2P'],
      'consultant': ['B2B', 'B2P', 'P2B', 'P2P'],
      'mentor': ['B2P', 'P2B', 'P2P'],
      'platform_admin': ['B2B', 'B2P', 'P2B', 'P2P'],
      'auditor': ['B2B', 'B2P', 'P2B', 'P2P']
    };
    
    if (roleMap[userRole]) {
      return roleMap[userRole];
    }
    
    // Fallback based on userType
    if (userType === 'company' || userType === 'entity') {
      return ['B2B', 'B2P'];
    } else if (userType === 'individual' || userType === 'consultant') {
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
      
      // Profile & Settings
      { id: 'profile', label: 'Profile', route: `${basePath}profile/`, feature: 'profile_management', icon: '<i class="ph ph-user"></i>' },
      { id: 'settings', label: 'Settings', route: `${basePath}settings/`, feature: 'profile_management', icon: '<i class="ph ph-gear"></i>' },
      { id: 'notifications', label: 'Notifications', route: `${basePath}notifications/`, feature: 'notifications', icon: '<i class="ph ph-bell"></i>' },
      
      // Admin Section (will be filtered by RBAC)
      { id: 'admin-separator', label: '---', route: '#', feature: null, icon: '', isSeparator: true },
      { id: 'admin-dashboard', label: 'Admin Dashboard', route: `${basePath}admin/`, feature: 'admin_dashboard', icon: '<i class="ph ph-gear"></i>' },
      { id: 'directory', label: 'Directory', route: `${basePath}admin/directory/`, feature: 'admin_directory', icon: '<i class="ph ph-folder"></i>' },
      { id: 'user-vetting', label: 'User Vetting', route: `${basePath}admin-vetting/`, feature: 'user_vetting', icon: '<i class="ph ph-check-circle"></i>' },
      { id: 'user-management', label: 'User Management', route: `${basePath}admin/users-management/`, feature: 'user_management', icon: '<i class="ph ph-users"></i>' },
      { id: 'project-moderation', label: 'Project Moderation', route: `${basePath}admin-moderation/`, feature: 'project_moderation', icon: '<i class="ph ph-shield-check"></i>' },
      { id: 'audit-trail', label: 'Audit Trail', route: `${basePath}admin-audit/`, feature: 'audit_trail', icon: '<i class="ph ph-clipboard"></i>' },
      { id: 'reports', label: 'Reports', route: `${basePath}admin-reports/`, feature: 'reports', icon: '<i class="ph ph-chart-bar"></i>' }
    ];
    
    // Create simplified Collaboration menu item with main features
    const collaborationChildren = [
      // Main Features
      { 
        id: 'collab-my-collaborations', 
        label: 'My Collaborations', 
        route: `${basePath}collaboration/my-collaborations/`, 
        feature: 'collaboration_opportunities',
        icon: '<i class="ph ph-folder"></i>' 
      },
      { 
        id: 'collab-opportunities', 
        label: 'Browse Opportunities', 
        route: `${basePath}collaboration/opportunities/`, 
        feature: 'collaboration_opportunities',
        icon: '<i class="ph ph-sparkle"></i>' 
      },
      { 
        id: 'collab-applications', 
        label: 'My Applications', 
        route: `${basePath}collaboration/applications/`, 
        feature: 'collaboration_applications',
        icon: '<i class="ph ph-file-text"></i>' 
      },
      { 
        id: 'collab-separator', 
        label: '---', 
        route: '#', 
        feature: null, 
        icon: '', 
        isSeparator: true 
      },
      // Simplified Model Categories with Sub-Features
      { 
        id: 'collab-models', 
        label: 'Collaboration Models', 
        route: `${basePath}collaboration/`, 
        feature: 'collaboration_opportunities',
        icon: '<i class="ph ph-clipboard-text"></i>' 
      },
      { 
        id: 'collab-project-based', 
        label: 'Project-Based', 
        route: `${basePath}collaboration/?category=1`, 
        feature: 'collaboration_opportunities',
        icon: '<i class="ph ph-buildings"></i>',
        hasChildren: true,
        children: [
          { id: 'collab-task-based', label: 'Task-Based Engagement', route: `${basePath}collaboration/task-based/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-file-text"></i>' },
          { id: 'collab-consortium', label: 'Consortium', route: `${basePath}collaboration/consortium/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-users-three"></i>' },
          { id: 'collab-jv', label: 'Project-Specific JV', route: `${basePath}collaboration/joint-venture/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-handshake"></i>' },
          { id: 'collab-spv', label: 'Special Purpose Vehicle', route: `${basePath}collaboration/spv/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-building-office"></i>' }
        ]
      },
      { 
        id: 'collab-strategic', 
        label: 'Strategic Partnerships', 
        route: `${basePath}collaboration/?category=2`, 
        feature: 'collaboration_opportunities',
        icon: '<i class="ph ph-handshake"></i>',
        hasChildren: true,
        children: [
          { id: 'collab-strategic-jv', label: 'Strategic Joint Venture', route: `${basePath}collaboration/strategic-jv/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-handshake"></i>' },
          { id: 'collab-strategic-alliance', label: 'Strategic Alliance', route: `${basePath}collaboration/strategic-alliance/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-link"></i>' },
          { id: 'collab-mentorship', label: 'Mentorship Program', route: `${basePath}collaboration/mentorship/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-graduation-cap"></i>' }
        ]
      },
      { 
        id: 'collab-resources', 
        label: 'Resource Pooling', 
        route: `${basePath}collaboration/?category=3`, 
        feature: 'collaboration_opportunities',
        icon: '<i class="ph ph-package"></i>',
        hasChildren: true,
        children: [
          { id: 'collab-bulk-purchasing', label: 'Bulk Purchasing', route: `${basePath}collaboration/bulk-purchasing/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-shopping-cart"></i>' },
          { id: 'collab-co-ownership', label: 'Co-Ownership Pooling', route: `${basePath}collaboration/co-ownership/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-users"></i>' },
          { id: 'collab-resource-exchange', label: 'Resource Exchange', route: `${basePath}collaboration/resource-exchange/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-arrows-clockwise"></i>' }
        ]
      },
      { 
        id: 'collab-hiring', 
        label: 'Hiring Resources', 
        route: `${basePath}collaboration/?category=4`, 
        feature: 'collaboration_opportunities',
        icon: '<i class="ph ph-briefcase"></i>',
        hasChildren: true,
        children: [
          { id: 'collab-professional-hiring', label: 'Professional Hiring', route: `${basePath}collaboration/professional-hiring/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-user"></i>' },
          { id: 'collab-consultant-hiring', label: 'Consultant Hiring', route: `${basePath}collaboration/consultant-hiring/`, feature: 'collaboration_opportunities', icon: '<i class="ph ph-user-circle"></i>' }
        ]
      },
      { 
        id: 'collab-competition', 
        label: 'Call for Competition', 
        route: `${basePath}collaboration/?category=5`, 
        feature: 'collaboration_opportunities',
        icon: '<i class="ph ph-trophy"></i>' 
      }
    ];
    
    // Insert Collaboration menu item with dropdown before Profile
    const collaborationItem = {
      id: 'collaboration',
      label: 'Collaboration',
      route: `${basePath}collaboration/`,
      feature: 'collaboration_opportunities',
      icon: '<i class="ph ph-handshake"></i>',
      alternativeFeatures: ['collaboration_applications'],
      hasChildren: true,
      children: collaborationChildren,
      isExpanded: false // Default collapsed
    };
    
    // Add before Profile section
    const profileIndex = allMenuItems.findIndex(item => item.id === 'profile');
    if (profileIndex >= 0) {
      allMenuItems.splice(profileIndex, 0, collaborationItem);
    } else {
      allMenuItems.push(collaborationItem);
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
            
            // Handle grouped items (both isGroup and hasChildren)
            if ((item.isGroup || item.hasChildren) && item.children && Array.isArray(item.children)) {
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
                children: filteredChildren,
                hasChildren: filteredChildren.length > 0, // Ensure hasChildren is set
                isGroup: false // Remove isGroup, use hasChildren instead
              };
            }
            
            // Regular item filtering
            // If no feature requirement, hide it (security: explicit permission required)
            if (!item.feature) {
              console.log('[DashboardService] Hiding item without feature:', item.id);
              return null;
            }
            
            // Check if user has access to this feature
            let hasAccess = availableFeatures.includes(item.feature);
            
            // Check alternative features if primary feature not available
            if (!hasAccess && item.alternativeFeatures && Array.isArray(item.alternativeFeatures)) {
              hasAccess = item.alternativeFeatures.some(altFeature => availableFeatures.includes(altFeature));
              if (hasAccess) {
                console.log(`[DashboardService] Item ${item.id} accessible via alternative feature`);
              }
            }
            
            // Special case: platform_admin should see all
            if (userRoleId === 'platform_admin' || userRoleId === 'admin') {
              return item;
            }
            
            if (hasAccess) {
              return item;
            }
            
            return null; // Filter out items user doesn't have access to
          }).filter(item => item !== null); // Remove null items
          
          console.log('[DashboardService] Filtered menu items:', filtered.length);
          
          // Debug: Check if Service Providers is in filtered list
          if (filtered.length > 0) {
          const hasServiceProviders = filtered.some(item => item.id === 'service-providers');
          console.log('[DashboardService] Service Providers menu item present:', hasServiceProviders);
          if (!hasServiceProviders) {
            console.warn('[DashboardService] Service Providers menu item is missing!');
            }
          }
          
          return { success: true, items: filtered };
        }
      } catch (error) {
        console.error('[DashboardService] Error filtering menu items:', error);
        // Fall through to legacy filtering
      }
    }
    
    // Legacy role-based filtering (fallback)
    const role = currentUser.role;
    const filtered = allMenuItems.filter(item => {
      if (role === 'admin' || role === 'platform_admin') return true;
      if (role === 'entity' || role === 'project_lead') {
        return !item.feature || ['user_dashboard', 'project_creation', 'project_management', 
                                'proposal_review', 'matches_view', 'profile_management', 
                                'notifications', 'collaboration_opportunities', 'pipeline_management',
                                'service_providers', 'service_portfolio', 'service_offering:view'].includes(item.feature);
      }
      if (role === 'individual' || role === 'professional' || role === 'consultant') {
        return !item.feature || ['user_dashboard', 'project_browsing', 'matches_view', 
                                'proposal_creation', 'proposal_management', 'profile_management', 
                                'notifications', 'collaboration_opportunities', 'collaboration_applications',
                                'service_providers', 'service_portfolio', 'service_offering:view',
                                'pipeline_management'].includes(item.feature);
      }
      if (role === 'service_provider') {
        return !item.feature || ['user_dashboard', 'project_browsing', 'matches_view',
                                'service_providers', 'service_portfolio', 'service_offering:view',
                                'collaboration_opportunities', 'collaboration_applications',
                                'proposal_creation', 'proposal_management', 'pipeline_management',
                                'profile_management', 'notifications'].includes(item.feature);
      }
      if (role === 'supplier') {
        return !item.feature || ['user_dashboard', 'project_browsing', 'matches_view',
                                'collaboration_opportunities', 'collaboration_applications',
                                'service_providers', 'pipeline_management',
                                'profile_management', 'notifications'].includes(item.feature);
      }
      if (role === 'mentor') {
        return !item.feature || ['user_dashboard', 'project_browsing', 'matches_view',
                                'collaboration_opportunities', 'service_providers',
                                'pipeline_management', 'profile_management', 'notifications'].includes(item.feature);
      }
      if (role === 'auditor') {
        return !item.feature || ['user_dashboard', 'admin_dashboard', 'audit_trail', 'reports',
                                'project_browsing', 'notifications'].includes(item.feature);
      }
      return false;
    });
    
    return { success: true, items: filtered };
  }

  // ============================================
  // Public API
  // ============================================
  window.DashboardService = {
    getDashboardData,
    getMenuItems
  };

})();
