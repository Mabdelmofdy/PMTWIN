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
      analytics: {
        overview: {},
        breakdown: {},
        trends: {}
      },
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
    } else if (roleId === 'entity' || roleId === 'project_lead') {
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
        totalSPVs: collaborationOpps.filter(o => o.modelId === '1.4').length,
        totalMegaprojects: userProjects.filter(p => p.projectType === 'mega' || p.subProjects).length
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
    } else if (roleId === 'sub_contractor') {
      // Sub_contractors can only submit proposals to vendors
      const userProposals = PMTwinData.Proposals.getByProvider(currentUser.id).filter(p => 
        p.proposalType === 'sub_contractor_to_vendor'
      );
      const userMatches = PMTwinData.Matches.getByProvider(currentUser.id);
      const userApplications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
      
      // Get vendor relationships
      const vendorRelationships = PMTwinData.VendorSubContractorRelationships?.getBySubContractor?.(currentUser.id) || [];
      
      dashboardData.stats = {
        totalProposals: userProposals.length,
        activeProposals: userProposals.filter(p => p.status === 'in_review' || p.status === 'approved').length,
        totalMatches: userMatches.length,
        highMatches: userMatches.filter(m => m.score >= 80).length,
        totalApplications: userApplications.length,
        pendingApplications: userApplications.filter(a => a.status === 'pending').length,
        activeVendorRelationships: vendorRelationships.filter(r => r.status === 'active').length,
        totalVendorRelationships: vendorRelationships.length
      };
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
    } else if (roleId === 'vendor' || roleId === 'service_provider') {
      const userProposals = PMTwinData.Proposals.getByProvider(currentUser.id);
      const userMatches = PMTwinData.Matches.getByProvider(currentUser.id);
      const taskEngagements = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '1.1' && (o.creatorId === currentUser.id || o.applicants?.includes(currentUser.id))
      );
      
      // Get sub_contractor proposals (proposals submitted to this vendor)
      const subContractorProposals = PMTwinData.Proposals.getAll().filter(p => 
        p.vendorId === currentUser.id && p.proposalType === 'sub_contractor_to_vendor'
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
        // Proposal stats
        totalProposals: userProposals.length,
        activeProposals: userProposals.filter(p => p.status === 'in_review' || p.status === 'approved').length,
        totalMatches: userMatches.length,
        highMatches: userMatches.filter(m => m.score >= 80).length,
        activeServices: taskEngagements.filter(o => o.status === 'active').length,
        totalEngagements: taskEngagements.length,
        strategicAlliances: PMTwinData.CollaborationOpportunities.getAll().filter(o => 
          o.modelId === '2.2' && (o.creatorId === currentUser.id || o.participants?.includes(currentUser.id))
        ).length,
        // Sub_contractor management stats
        totalSubContractorProposals: subContractorProposals.length,
        pendingSubContractorProposals: subContractorProposals.filter(p => p.status === 'in_review' || p.status === 'pending').length
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
      // Bulk Purchasing (Model 3.1)
      const bulkPurchasing = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '3.1' && (o.creatorId === currentUser.id || o.participants?.includes(currentUser.id))
      );
      
      // Inventory Listings (Model 3.3 - Surplus Materials)
      const inventoryListings = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '3.3' && o.creatorId === currentUser.id
      );
      
      // Strategic Alliances (Model 2.2)
      const strategicAlliances = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '2.2' && (o.creatorId === currentUser.id || o.participants?.includes(currentUser.id))
      );
      
      // Resource Sharing (Model 3.2)
      const resourceSharing = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '3.2' && (o.creatorId === currentUser.id || o.participants?.includes(currentUser.id))
      );
      
      // General stats (suppliers can also participate in projects, proposals, matches)
      const userProjects = PMTwinData.Projects.getByCreator(currentUser.id);
      const userProposals = PMTwinData.Proposals.getByProvider(currentUser.id);
      const userMatches = PMTwinData.Matches.getByProvider(currentUser.id);
      const userApplications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
      
      dashboardData.stats = {
        // Supplier-specific metrics
        activeBulkPurchasing: bulkPurchasing.filter(o => o.status === 'active').length,
        totalBulkPurchasing: bulkPurchasing.length,
        inventoryListings: inventoryListings.length,
        activeListings: inventoryListings.filter(o => o.status === 'active').length,
        strategicAlliances: strategicAlliances.length,
        activeAlliances: strategicAlliances.filter(o => o.status === 'active').length,
        resourceSharing: resourceSharing.length,
        activeResourceSharing: resourceSharing.filter(o => o.status === 'active').length,
        // General metrics
        totalProjects: userProjects.length,
        activeProjects: userProjects.filter(p => p.status === 'active').length,
        totalProposals: userProposals.length,
        activeProposals: userProposals.filter(p => p.status === 'in_review' || p.status === 'approved').length,
        totalMatches: userMatches.length,
        highMatches: userMatches.filter(m => m.score >= 80).length,
        totalApplications: userApplications.length,
        pendingApplications: userApplications.filter(a => a.status === 'pending').length
      };
      
      dashboardData.recentActivity = [
        ...bulkPurchasing.slice(0, 5).map(o => ({
          type: 'bulk_purchase',
          title: o.title || 'Bulk Purchasing',
          date: o.createdAt,
          icon: '<i class="ph ph-shopping-cart"></i>'
        })),
        ...inventoryListings.slice(0, 5).map(o => ({
          type: 'inventory',
          title: o.title || 'Inventory Listing',
          date: o.createdAt,
          icon: '<i class="ph ph-package"></i>'
        })),
        ...strategicAlliances.slice(0, 5).map(o => ({
          type: 'alliance',
          title: o.title || 'Strategic Alliance',
          date: o.createdAt,
          icon: '<i class="ph ph-handshake"></i>'
        })),
        ...userProjects.slice(0, 3).map(p => ({
          type: 'project',
          title: p.title,
          date: p.updatedAt || p.createdAt,
          icon: '<i class="ph ph-folder"></i>'
        })),
        ...userProposals.slice(0, 3).map(p => ({
          type: 'proposal',
          title: `Proposal for ${PMTwinData.Projects.getById(p.projectId)?.title || 'Project'}`,
          date: p.submittedAt,
          icon: '<i class="ph ph-file-text"></i>'
        }))
      ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 10);
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
    try {
      dashboardData.notifications = PMTwinData.Notifications.getUnread(currentUser.id);
    } catch (error) {
      console.warn('[DashboardService] Error loading notifications:', error);
      dashboardData.notifications = [];
    }
    
    // Calculate comprehensive analytics for all roles
    try {
      dashboardData.analytics = calculateAccountAnalytics(dashboardData, roleId, currentUser);
      console.log('[DashboardService] Analytics calculated for role:', roleId, dashboardData.analytics);
    } catch (analyticsError) {
      console.error('[DashboardService] Error calculating analytics:', analyticsError);
      dashboardData.analytics = { overview: {}, breakdown: {}, trends: {} };
    }
    
    // Ensure we always have some stats even if empty
    if (!dashboardData.stats || Object.keys(dashboardData.stats).length === 0) {
      console.warn('[DashboardService] No stats found, using defaults');
      dashboardData.stats = {
        totalItems: 0,
        activeItems: 0
      };
    }
    
    console.log('[DashboardService] Returning dashboard data:', {
      role: roleId,
      hasStats: Object.keys(dashboardData.stats).length > 0,
      hasAnalytics: Object.keys(dashboardData.analytics.overview).length > 0,
      hasActivity: dashboardData.recentActivity.length > 0
    });
    
    return { success: true, data: dashboardData };
  }

  // ============================================
  // Calculate Account Analytics
  // ============================================
  function calculateAccountAnalytics(dashboardData, roleId, currentUser) {
    if (!dashboardData || !roleId || !currentUser) {
      console.warn('[DashboardService] Invalid parameters for calculateAccountAnalytics');
      return { overview: {}, breakdown: {}, trends: {} };
    }

    const analytics = {
      overview: {},
      breakdown: {},
      trends: {}
    };

    // Helper to format numbers with thousand separators
    function formatNumber(num) {
      if (typeof num !== 'number' || isNaN(num)) return '0';
      return num.toLocaleString('en-US');
    }

    // Helper to calculate percentage change
    function calculateChange(current, previous) {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(1);
    }

    try {
      // Role-specific analytics
      if (roleId === 'service_provider') {
      const stats = dashboardData.stats || {};
      const merchantPortal = dashboardData.merchantPortal || {};
      const performanceMetrics = merchantPortal.performanceMetrics || {};
      
      analytics.overview = {
        totalOfferings: {
          value: stats.totalOfferings || 0,
          label: 'Total Offerings',
          icon: '<i class="ph ph-package"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeOfferings || 0,
            paused: merchantPortal.statistics?.pausedOfferings || 0,
            draft: merchantPortal.statistics?.draftOfferings || 0
          }
        },
        totalViews: {
          value: stats.totalViews || 0,
          label: 'Total Views',
          icon: '<i class="ph ph-eye"></i>',
          color: 'var(--color-primary)',
          subValue: `Avg: ${performanceMetrics.averageViewsPerOffering || 0} per offering`
        },
        totalInquiries: {
          value: stats.totalInquiries || 0,
          label: 'Total Inquiries',
          icon: '<i class="ph ph-envelope"></i>',
          color: 'var(--color-success)',
          subValue: `${performanceMetrics.conversionRate || 0}% conversion rate`
        },
        totalProposals: {
          value: stats.totalProposals || 0,
          label: 'Proposals Sent',
          icon: '<i class="ph ph-file-text"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            approved: dashboardData.merchantPortal?.proposalBreakdown?.byStatus?.approved || 0,
            pending: dashboardData.merchantPortal?.proposalBreakdown?.byStatus?.pending || 0,
            rejected: dashboardData.merchantPortal?.proposalBreakdown?.byStatus?.rejected || 0
          }
        },
        totalEngagements: {
          value: stats.totalEngagements || 0,
          label: 'Engagements',
          icon: '<i class="ph ph-handshake"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeServices || 0,
            completed: merchantPortal.statistics?.completedEngagements || 0
          }
        },
        totalMatches: {
          value: stats.totalMatches || 0,
          label: 'Matches',
          icon: '<i class="ph ph-link"></i>',
          color: 'var(--color-primary)',
          subValue: `${stats.highMatches || 0} high score (≥80%)`
        },
        averageQuality: {
          value: Math.round(performanceMetrics.averageQualityScore || 0),
          label: 'Avg Quality Score',
          icon: '<i class="ph ph-star"></i>',
          color: performanceMetrics.averageQualityScore >= 80 ? 'var(--color-success)' : 
                 performanceMetrics.averageQualityScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
          maxValue: 100
        }
      };

      analytics.breakdown = {
        categoryPerformance: merchantPortal.categoryBreakdown || {},
        proposalStatus: dashboardData.merchantPortal?.proposalBreakdown?.byStatus || {},
        engagementStatus: {
          active: stats.activeServices || 0,
          completed: merchantPortal.statistics?.completedEngagements || 0,
          pending: dashboardData.merchantPortal?.engagementDetails?.pending || 0
        }
      };

    } else if (roleId === 'entity' || roleId === 'project_lead') {
      const stats = dashboardData.stats || {};
      const userProjects = PMTwinData.Projects.getByCreator(currentUser.id);
      const userProposals = PMTwinData.Proposals.getAll().filter(p => {
        const project = PMTwinData.Projects.getById(p.projectId);
        return project && project.creatorId === currentUser.id;
      });
      const totalProjectValue = userProjects.reduce((sum, p) => sum + (parseFloat(p.budget?.max || p.budget?.total || 0)), 0);

      analytics.overview = {
        totalProjects: {
          value: stats.totalProjects || 0,
          label: 'Total Projects',
          icon: '<i class="ph ph-buildings"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeProjects || 0,
            completed: userProjects.filter(p => p.status === 'completed').length,
            draft: userProjects.filter(p => p.status === 'draft').length
          }
        },
        totalProposalsReceived: {
          value: stats.totalProposals || 0,
          label: 'Proposals Received',
          icon: '<i class="ph ph-file-text"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            pending: stats.pendingProposals || 0,
            approved: userProposals.filter(p => p.status === 'approved' || p.status === 'accepted').length,
            rejected: userProposals.filter(p => p.status === 'rejected' || p.status === 'declined').length
          }
        },
        totalCollaborations: {
          value: stats.totalCollaborations || 0,
          label: 'Collaborations',
          icon: '<i class="ph ph-handshake"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeCollaborations || 0,
            taskBased: stats.totalTaskEngagements || 0,
            consortia: stats.totalConsortia || 0,
            spvs: stats.totalSPVs || 0
          }
        },
        totalProjectValue: {
          value: formatNumber(totalProjectValue),
          label: 'Total Project Value',
          icon: '<i class="ph ph-currency-circle-dollar"></i>',
          color: 'var(--color-success)',
          currency: 'SAR'
        }
      };

      analytics.breakdown = {
        projectStatus: {
          active: stats.activeProjects || 0,
          completed: userProjects.filter(p => p.status === 'completed').length,
          draft: userProjects.filter(p => p.status === 'draft').length
        },
        proposalStatus: {
          pending: stats.pendingProposals || 0,
          approved: userProposals.filter(p => p.status === 'approved' || p.status === 'accepted').length,
          rejected: userProposals.filter(p => p.status === 'rejected' || p.status === 'declined').length
        },
        collaborationTypes: {
          taskBased: stats.totalTaskEngagements || 0,
          consortia: stats.totalConsortia || 0,
          spvs: stats.totalSPVs || 0
        }
      };

    } else if (roleId === 'professional' || roleId === 'individual' || roleId === 'consultant') {
      const stats = dashboardData.stats || {};
      const userProposals = PMTwinData.Proposals.getByProvider(currentUser.id);
      const userMatches = PMTwinData.Matches.getByProvider(currentUser.id);
      const userApplications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
      const userProfile = PMTwinData.Users.getById(currentUser.id);
      const endorsements = userProfile?.profile?.endorsements || [];

      analytics.overview = {
        totalProposals: {
          value: stats.totalProposals || 0,
          label: 'Proposals Sent',
          icon: '<i class="ph ph-file-text"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeProposals || 0,
            approved: userProposals.filter(p => p.status === 'approved' || p.status === 'accepted').length,
            rejected: userProposals.filter(p => p.status === 'rejected' || p.status === 'declined').length
          }
        },
        totalMatches: {
          value: stats.totalMatches || 0,
          label: 'Matches Received',
          icon: '<i class="ph ph-link"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            highScore: stats.highMatches || 0,
            mediumScore: userMatches.filter(m => m.score >= 50 && m.score < 80).length,
            lowScore: userMatches.filter(m => m.score < 50).length
          }
        },
        totalApplications: {
          value: stats.totalApplications || 0,
          label: 'Applications',
          icon: '<i class="ph ph-clipboard-text"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            pending: stats.pendingApplications || 0,
            approved: userApplications.filter(a => a.status === 'approved').length,
            rejected: userApplications.filter(a => a.status === 'rejected').length
          }
        },
        totalEndorsements: {
          value: endorsements.length,
          label: 'Endorsements',
          icon: '<i class="ph ph-star"></i>',
          color: 'var(--color-success)'
        }
      };

      analytics.breakdown = {
        proposalStatus: {
          active: stats.activeProposals || 0,
          approved: userProposals.filter(p => p.status === 'approved' || p.status === 'accepted').length,
          rejected: userProposals.filter(p => p.status === 'rejected' || p.status === 'declined').length
        },
        matchScores: {
          high: stats.highMatches || 0,
          medium: userMatches.filter(m => m.score >= 50 && m.score < 80).length,
          low: userMatches.filter(m => m.score < 50).length
        },
        applicationStatus: {
          pending: stats.pendingApplications || 0,
          approved: userApplications.filter(a => a.status === 'approved').length,
          rejected: userApplications.filter(a => a.status === 'rejected').length
        }
      };

    } else if (roleId === 'supplier') {
      const stats = dashboardData.stats || {};

      analytics.overview = {
        totalBulkPurchasing: {
          value: stats.totalBulkPurchasing || 0,
          label: 'Bulk Purchasing Groups',
          icon: '<i class="ph ph-shopping-cart"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeBulkPurchasing || 0,
            total: stats.totalBulkPurchasing || 0
          }
        },
        totalListings: {
          value: stats.inventoryListings || 0,
          label: 'Inventory Listings',
          icon: '<i class="ph ph-package"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeListings || 0,
            total: stats.inventoryListings || 0
          }
        },
        totalAlliances: {
          value: stats.strategicAlliances || 0,
          label: 'Strategic Alliances',
          icon: '<i class="ph ph-handshake"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeAlliances || 0,
            total: stats.strategicAlliances || 0
          }
        },
        totalProjects: {
          value: stats.totalProjects || 0,
          label: 'Projects',
          icon: '<i class="ph ph-folder"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeProjects || 0,
            total: stats.totalProjects || 0
          }
        },
        totalProposals: {
          value: stats.totalProposals || 0,
          label: 'Proposals',
          icon: '<i class="ph ph-file-text"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeProposals || 0,
            total: stats.totalProposals || 0
          }
        },
        totalMatches: {
          value: stats.totalMatches || 0,
          label: 'Matches',
          icon: '<i class="ph ph-link"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            high: stats.highMatches || 0,
            total: stats.totalMatches || 0
          }
        }
      };

      analytics.breakdown = {
        bulkPurchasingStatus: {
          active: stats.activeBulkPurchasing || 0,
          inactive: (stats.totalBulkPurchasing || 0) - (stats.activeBulkPurchasing || 0),
          total: stats.totalBulkPurchasing || 0
        },
        listingStatus: {
          active: stats.activeListings || 0,
          inactive: (stats.inventoryListings || 0) - (stats.activeListings || 0),
          total: stats.inventoryListings || 0
        },
        allianceStatus: {
          active: stats.activeAlliances || 0,
          inactive: (stats.strategicAlliances || 0) - (stats.activeAlliances || 0),
          total: stats.strategicAlliances || 0
        },
        proposalStatus: {
          active: stats.activeProposals || 0,
          pending: (stats.totalProposals || 0) - (stats.activeProposals || 0),
          total: stats.totalProposals || 0
        },
        matchQuality: {
          high: stats.highMatches || 0,
          medium: (stats.totalMatches || 0) - (stats.highMatches || 0),
          total: stats.totalMatches || 0
        }
      };

    } else if (roleId === 'mentor') {
      const stats = dashboardData.stats || {};
      const mentorshipPrograms = PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '2.3' && o.creatorId === currentUser.id
      );
      const mentees = mentorshipPrograms.reduce((acc, program) => {
        const applications = PMTwinData.CollaborationApplications.getByOpportunity(program.id);
        return acc + applications.filter(a => a.status === 'approved').length;
      }, 0);

      analytics.overview = {
        totalPrograms: {
          value: stats.totalPrograms || 0,
          label: 'Mentorship Programs',
          icon: '<i class="ph ph-graduation-cap"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activePrograms || 0
          }
        },
        totalMentees: {
          value: stats.totalMentees || 0,
          label: 'Total Mentees',
          icon: '<i class="ph ph-users"></i>',
          color: 'var(--color-success)',
          breakdown: {
            active: stats.activeMentees || 0
          }
        }
      };

      analytics.breakdown = {
        programStatus: {
          active: stats.activePrograms || 0,
          total: stats.totalPrograms || 0
        }
      };

    } else if (roleId === 'auditor') {
      const stats = dashboardData.stats || {};

      analytics.overview = {
        totalUsers: {
          value: stats.totalUsers || 0,
          label: 'Total Users',
          icon: '<i class="ph ph-users"></i>',
          color: 'var(--color-primary)'
        },
        totalProjects: {
          value: stats.totalProjects || 0,
          label: 'Total Projects',
          icon: '<i class="ph ph-buildings"></i>',
          color: 'var(--color-primary)'
        },
        totalProposals: {
          value: stats.totalProposals || 0,
          label: 'Total Proposals',
          icon: '<i class="ph ph-file-text"></i>',
          color: 'var(--color-primary)'
        },
        totalCollaborations: {
          value: stats.totalCollaborations || 0,
          label: 'Total Collaborations',
          icon: '<i class="ph ph-handshake"></i>',
          color: 'var(--color-primary)'
        }
      };

      analytics.breakdown = {
        platformOverview: {
          users: stats.totalUsers || 0,
          projects: stats.totalProjects || 0,
          proposals: stats.totalProposals || 0,
          collaborations: stats.totalCollaborations || 0
        }
      };

    } else if (roleId === 'platform_admin' || roleId === 'admin') {
      const stats = dashboardData.stats || {};
      const allUsers = PMTwinData.Users.getAll();
      const allProjects = PMTwinData.Projects.getAll();
      const allProposals = PMTwinData.Proposals.getAll();

      analytics.overview = {
        totalUsers: {
          value: stats.totalUsers || 0,
          label: 'Total Users',
          icon: '<i class="ph ph-users"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            approved: stats.approvedUsers || 0,
            pending: stats.pendingUsers || 0,
            suspended: stats.suspendedUsers || 0
          }
        },
        totalProjects: {
          value: stats.totalProjects || 0,
          label: 'Total Projects',
          icon: '<i class="ph ph-buildings"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeProjects || 0
          }
        },
        totalProposals: {
          value: stats.totalProposals || 0,
          label: 'Total Proposals',
          icon: '<i class="ph ph-file-text"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            pending: stats.pendingProposals || 0
          }
        },
        totalCollaborations: {
          value: stats.totalCollaborations || 0,
          label: 'Total Collaborations',
          icon: '<i class="ph ph-handshake"></i>',
          color: 'var(--color-primary)',
          breakdown: {
            active: stats.activeCollaborations || 0,
            taskBased: stats.totalTaskEngagements || 0,
            consortia: stats.totalConsortia || 0,
            spvs: stats.totalSPVs || 0
          }
        }
      };

      analytics.breakdown = {
        userStatus: {
          approved: stats.approvedUsers || 0,
          pending: stats.pendingUsers || 0,
          suspended: stats.suspendedUsers || 0
        },
        projectStatus: {
          active: stats.activeProjects || 0,
          total: stats.totalProjects || 0
        },
        collaborationTypes: {
          taskBased: stats.totalTaskEngagements || 0,
          consortia: stats.totalConsortia || 0,
          spvs: stats.totalSPVs || 0
        }
      };
    }

      // Default case: if role doesn't match, return empty analytics
      // This ensures the function always returns a valid object
    } catch (error) {
      console.error('[DashboardService] Error calculating analytics for role', roleId, ':', error);
      return { overview: {}, breakdown: {}, trends: {} };
    }
    
    return analytics;
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
      // Calculate depth from POC root (count segments after 'pages')
      const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC');
      const pagesIndex = segments.indexOf('pages');
      
      if (pagesIndex >= 0) {
        // Calculate depth: number of segments after 'pages' (excluding filename)
        const depth = segments.length - pagesIndex - 1;
        return depth > 0 ? '../'.repeat(depth) : '';
      }
      
      // Fallback: if no 'pages' found, calculate based on total segments
      const depth = segments.length - 1; // -1 for filename
      return depth > 0 ? '../'.repeat(depth) : '';
    }
    
    const basePath = getBasePath();
    
    // Core menu items matching the new design (8 items)
    const coreMenuItems = [
      // 1. Dashboard
      { id: 'dashboard', label: 'Dashboard', route: `${basePath}dashboard/`, feature: 'user_dashboard', icon: '<i class="ph ph-gauge"></i>' },
      
      // 2. My Projects
      { id: 'projects', label: 'My Projects', route: `${basePath}projects/`, feature: 'project_management', icon: '<i class="ph ph-buildings"></i>', alternativeFeatures: ['project_browsing'] },
      
      // 3. Create Project
      { id: 'create-project', label: 'Create Project', route: `${basePath}projects/create/`, feature: 'project_creation', icon: '<i class="ph ph-plus-circle"></i>' },
      
      // 4. Opportunities
      { id: 'opportunities', label: 'Opportunities', route: `${basePath}opportunities/`, feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>' },
      
      // 5. Matches
      { id: 'matches', label: 'Matches', route: `${basePath}matches/`, feature: 'matches_view', icon: '<i class="ph ph-link"></i>' },
      
      // 6. Proposals
      { id: 'proposals', label: 'Proposals', route: `${basePath}proposals/`, feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>', alternativeFeatures: ['proposal_creation', 'proposal_review'] },
      
      // 7. Pipeline
      { id: 'pipeline', label: 'Pipeline', route: `${basePath}pipeline/`, feature: 'pipeline_management', icon: '<i class="ph ph-trend-up"></i>' },
      
      // 8. My Services
      { id: 'my-services', label: 'My Services', route: `${basePath}my-services/`, feature: 'service_portfolio', icon: '<i class="ph ph-briefcase"></i>', alternativeFeatures: ['service_providers'] },
      
      // 9. Profile
      { id: 'profile', label: 'Profile', route: `${basePath}profile/`, feature: 'profile_management', icon: '<i class="ph ph-user"></i>' },
      
      // 10. Settings
      { id: 'settings', label: 'Settings', route: `${basePath}settings/`, feature: 'profile_management', icon: '<i class="ph ph-gear"></i>' }
    ];
    
    // Additional menu items (for admin or future expansion)
    const additionalMenuItems = [
      { id: 'services-marketplace', label: 'Service Marketplace', route: `${basePath}services-marketplace/`, feature: 'service_providers', icon: '<i class="ph ph-storefront"></i>' },
      { id: 'service-evaluations', label: 'Service Evaluations', route: `${basePath}service-providers/`, feature: 'service_evaluations', icon: '<i class="ph ph-star"></i>', alternativeFeatures: ['service_providers'] },
      
      // Service Provider & Service Request Section (New)
      { id: 'service-provider-profile', label: 'Service Provider Profile', route: `${basePath}service-providers/profile/`, feature: 'service_provider_profile', icon: '<i class="ph ph-user-circle"></i>' },
      { id: 'service-requests', label: 'Service Requests', route: `${basePath}service-requests/`, feature: 'service_requests_browse', icon: '<i class="ph ph-clipboard-text"></i>', alternativeFeatures: ['create_service_requests'] },
      { id: 'skills-search', label: 'Search Provider Skills', route: `${basePath}service-providers/skills-search.html`, feature: 'search_service_provider_skills', icon: '<i class="ph ph-magnifying-glass"></i>', roles: ['vendor', 'entity', 'beneficiary'] },
      { id: 'service-engagements', label: 'Service Engagements', route: `${basePath}service-engagements/`, feature: 'service_engagements_view', icon: '<i class="ph ph-handshake"></i>' },
      
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
    
    // Start with core menu items for the new design (8 items)
    let allMenuItems = [...coreMenuItems];
    
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
        
        // Special case: platform_admin should see core menu items + admin items
        if (userRoleId === 'platform_admin' || currentUser.role === 'admin' || currentUser.role === 'platform_admin') {
          console.log('[DashboardService] Platform admin detected - showing core menu items + admin items');
          
          // Add admin menu items
          const adminMenuItems = [
            { id: 'admin-separator', label: '---', route: '#', feature: null, icon: '', isSeparator: true },
            { id: 'admin-dashboard', label: 'Admin Dashboard', route: `${basePath}admin/`, feature: 'admin_dashboard', icon: '<i class="ph ph-gear"></i>' },
            { id: 'directory', label: 'Directory', route: `${basePath}admin/directory/`, feature: 'admin_directory', icon: '<i class="ph ph-folder"></i>' },
            { id: 'user-vetting', label: 'User Vetting', route: `${basePath}admin-vetting/`, feature: 'user_vetting', icon: '<i class="ph ph-check-circle"></i>' },
            { id: 'user-management', label: 'User Management', route: `${basePath}admin/users-management/`, feature: 'user_management', icon: '<i class="ph ph-users"></i>' },
            { id: 'project-moderation', label: 'Project Moderation', route: `${basePath}admin-moderation/`, feature: 'project_moderation', icon: '<i class="ph ph-shield-check"></i>' },
            { id: 'audit-trail', label: 'Audit Trail', route: `${basePath}admin-audit/`, feature: 'audit_trail', icon: '<i class="ph ph-clipboard"></i>' },
            { id: 'reports', label: 'Reports', route: `${basePath}admin-reports/`, feature: 'reports', icon: '<i class="ph ph-chart-bar"></i>' }
          ];
          
          // Combine core items with admin items
          allMenuItems = [...allMenuItems, ...adminMenuItems];
          
          // For platform_admin, show all items (they have wildcard access "*")
          // Platform admin has all features, so show everything
          console.log('[DashboardService] Platform admin - showing all menu items (wildcard access)');
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
            // Check role restrictions first
            if (item.roles && Array.isArray(item.roles)) {
              if (!item.roles.includes(userRoleId)) {
                return null;
              }
            }
            
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
      // Check if item has role restrictions
      if (item.roles && Array.isArray(item.roles)) {
        if (!item.roles.includes(role)) {
          return false;
        }
      }
      
      if (role === 'admin' || role === 'platform_admin') return true;
      if (role === 'entity' || role === 'project_lead' || role === 'beneficiary') {
        return !item.feature || ['user_dashboard', 'project_creation', 'project_management', 
                                'proposal_review', 'matches_view', 'profile_management', 
                                'notifications', 'collaboration_opportunities', 'pipeline_management',
                                'service_providers', 'service_portfolio', 'service_offering:view',
                                'service_provider_profile', 'service_requests_browse', 'service_offers_manage', 'service_engagements_view',
                                'search_service_provider_skills'].includes(item.feature);
      }
      if (role === 'vendor') {
        return !item.feature || ['user_dashboard', 'project_browsing', 'matches_view',
                                'service_providers', 'service_portfolio', 'service_offering:view',
                                'collaboration_opportunities', 'collaboration_applications',
                                'proposal_creation', 'proposal_management', 'sub_contractor_management',
                                'pipeline_management', 'profile_management', 'notifications',
                                'service_provider_profile', 'service_requests_browse', 'service_offers_manage', 'service_engagements_view',
                                'search_service_provider_skills'].includes(item.feature);
      }
      if (role === 'sub_contractor') {
        return !item.feature || ['user_dashboard', 'project_browsing', 'matches_view',
                                'service_providers', 'service_evaluations',
                                'proposal_creation', 'proposal_management',
                                'collaboration_opportunities', 'collaboration_applications',
                                'pipeline_management', 'profile_management', 'notifications'].includes(item.feature);
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
      if (role === 'skill_service_provider') {
        return !item.feature || ['user_dashboard', 'service_provider_profile', 'service_requests_browse',
                                'service_offers_manage', 'service_engagements_view',
                                'pipeline_management', 'profile_management', 'notifications'].includes(item.feature);
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
