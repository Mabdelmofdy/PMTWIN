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
    
    let currentUser = PMTwinData.Sessions.getCurrentUser();
    
    // If user not found but session exists, try to find user or create from session
    if (!currentUser) {
      const session = PMTwinData.Sessions.getCurrentSession();
      if (session) {
        console.log('[DashboardService] User object not found, trying alternative lookup...');
        const allUsers = PMTwinData.Users.getAll();
        
        // Try multiple lookup strategies
        currentUser = allUsers.find(u => 
          u.id === session.userId || 
          u.userId === session.userId ||
          String(u.id) === String(session.userId)
        );
        
        // If still not found and we have email in session, try by email
        if (!currentUser && session.userEmail) {
          currentUser = PMTwinData.Users.getByEmail(session.userEmail);
        }
        
        // Last resort: create minimal user from session
        if (!currentUser) {
          console.log('[DashboardService] Creating minimal user from session');
          // Try to find any user with matching role to get proper structure
          const roleMatchUser = allUsers.find(u => u.role === session.role);
          if (roleMatchUser) {
            currentUser = {
              ...roleMatchUser,
              id: session.userId,
              userId: session.userId,
              email: session.userEmail || roleMatchUser.email || `user_${session.userId}@pmtwin.com`
            };
          } else {
            currentUser = {
              id: session.userId,
              userId: session.userId,
              role: session.role,
              userType: session.userType || session.role,
              email: session.userEmail || `user_${session.userId}@pmtwin.com`
            };
          }
        } else {
          console.log('[DashboardService] Found user via alternative lookup');
        }
      }
    }
    
    if (!currentUser) {
      console.error('[DashboardService] User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }
    
        // Get role from RBAC, but fallback to user.role or session.role if RBAC returns guest
    let userRoleId = currentUser.role; // Default to user role
        if (typeof PMTwinRBAC !== 'undefined') {
          const rbacRole = await PMTwinRBAC.getCurrentUserRole();
          console.log('[DashboardService] RBAC role:', rbacRole, 'User role:', currentUser.role);
          
          // If RBAC returns guest, try to use session role or user role
          if (rbacRole === 'guest') {
            const session = PMTwinData.Sessions.getCurrentSession();
            if (session && session.role && session.role !== 'guest') {
              console.log('[DashboardService] RBAC returned guest, using session role:', session.role);
          userRoleId = session.role;
            } else if (currentUser.role && currentUser.role !== 'guest') {
              console.log('[DashboardService] RBAC returned guest, using user role instead:', currentUser.role);
          userRoleId = currentUser.role;
            } else {
          userRoleId = rbacRole; // Keep guest if no alternative
            }
          } else {
        userRoleId = rbacRole;
      }
    }
    
    // Map legacy roles to new RBAC roles
    const roleMapping = {
      'admin': 'platform_admin',
      'entity': 'project_lead',
      'beneficiary': 'project_lead',
      'individual': 'professional',
      'vendor': 'service_provider',
      'sub_contractor': 'professional'
    };
    
    // Apply role mapping if needed
    if (roleMapping[userRoleId]) {
      console.log(`[DashboardService] Mapping legacy role ${userRoleId} to ${roleMapping[userRoleId]}`);
      userRoleId = roleMapping[userRoleId];
    }
    
    console.log('[DashboardService] Current user:', currentUser.email, 'Role:', userRoleId);
    
    // Helper to get route from NAV_ROUTES map or fallback
    function getRouteForMenu(routeKey, fallbackPath) {
      // Try NavRoutes first
      if (typeof window.NavRoutes !== 'undefined') {
        // Check if routeKey exists in NAV_ROUTES
        if (window.NavRoutes.NAV_ROUTES && window.NavRoutes.NAV_ROUTES[routeKey]) {
          const route = window.NavRoutes.getRoute(routeKey, { useLiveServer: true });
          if (route && route !== routeKey) {
            return route;
          }
        }
        
        // Try toHtmlUrl as fallback
        if (typeof window.NavRoutes.toHtmlUrl === 'function') {
          try {
            const url = window.NavRoutes.toHtmlUrl(routeKey);
            if (url && url !== routeKey && !url.endsWith('/index.html') || url.includes('/')) {
              return url;
            }
          } catch (e) {
            // Ignore errors, fall through
          }
        }
      }
      
      // Fallback to constructing path
      const isLiveServer = window.location.port === '5503' || (window.location.hostname === '127.0.0.1' && window.location.port === '5503');
      
      if (isLiveServer && routeKey && routeKey !== '#' && !routeKey.startsWith('http')) {
        const cleanPath = routeKey.replace(/^\.\.\//g, '').replace(/\/$/, '').replace(/\.html$/, '');
        if (cleanPath && cleanPath !== 'index') {
          if (cleanPath.includes('/')) {
            return `http://127.0.0.1:5503/POC/pages/${cleanPath}/index.html`;
          } else {
            return `http://127.0.0.1:5503/POC/pages/${cleanPath}/index.html`;
          }
        }
      }
      
      // Use fallbackPath if provided and valid
      if (fallbackPath && fallbackPath !== '#' && !fallbackPath.startsWith('index.html')) {
        // If fallbackPath is already a full URL, return it
        if (fallbackPath.startsWith('http')) {
          return fallbackPath;
        }
        
        // If fallbackPath is relative, ensure it's properly formatted
        if (fallbackPath.startsWith('../') || fallbackPath.startsWith('./') || fallbackPath.startsWith('/')) {
          return fallbackPath;
        }
        
        // Otherwise, construct proper path
        if (isLiveServer) {
          // Remove any leading/trailing slashes and ensure proper format
          const cleanFallback = fallbackPath.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
          if (cleanFallback && cleanFallback !== 'index') {
            return `http://127.0.0.1:5503/POC/${cleanFallback}${cleanFallback.includes('index.html') ? '' : '/index.html'}`;
          }
        }
        
        return fallbackPath;
      }
      
      // Last resort: return routeKey if it's valid
      if (routeKey && routeKey !== '#' && !routeKey.startsWith('index.html')) {
        return routeKey;
      }
      
      // Return safe default
      return '#';
    }
    
    // Use RBACNavConfig if available
    if (typeof window.RBACNavConfig !== 'undefined' && window.RBACNavConfig.getNavItemsForRole) {
      console.log('[DashboardService] Using RBACNavConfig for menu items');
      
      try {
        // Get menu items from RBACNavConfig
        const navItems = window.RBACNavConfig.getNavItemsForRole(userRoleId);
        
        if (navItems && navItems.length > 0) {
          console.log(`[DashboardService] Found ${navItems.length} menu items for role ${userRoleId}`);
          
          // Convert route keys to actual URLs
          const menuItems = navItems.map(item => {
            // Get route URL, ensuring it's valid
            let routeUrl = getRouteForMenu(item.route, item.route);
            
            // Validate route URL - ensure it's not just "index.html" or invalid
            if (!routeUrl || routeUrl === 'index.html' || routeUrl === '/index.html' || 
                (routeUrl.startsWith('index.html') && !routeUrl.includes('/pages/'))) {
              console.warn(`[DashboardService] Invalid route for ${item.id}: ${routeUrl}, using fallback`);
              // Try to construct a proper path from the route key
              const isLiveServer = window.location.port === '5503' || (window.location.hostname === '127.0.0.1' && window.location.port === '5503');
              if (isLiveServer && item.route && item.route !== '#') {
                routeUrl = `http://127.0.0.1:5503/POC/pages/${item.route}/index.html`;
              } else {
                routeUrl = '#'; // Safe fallback
              }
            }
            
            const menuItem = {
              id: item.id,
              label: item.label,
              route: routeUrl,
              feature: item.feature,
              icon: item.icon
            };
            
            // Add optional properties
            if (item.filter) menuItem.filter = item.filter;
            if (item.conditional !== undefined) menuItem.conditional = item.conditional;
            if (item.readOnly !== undefined) menuItem.readOnly = item.readOnly;
            if (item.access) menuItem.access = item.access;
            
            return menuItem;
          });
          
          console.log('[DashboardService] Returning RBAC-based menu items:', menuItems);
          return { success: true, items: menuItems };
        } else {
          console.warn(`[DashboardService] No menu items found in RBACNavConfig for role ${userRoleId}`);
        }
      } catch (error) {
        console.error('[DashboardService] Error getting menu items from RBACNavConfig:', error);
        // Fall through to fallback
      }
    }
    
    // Fallback: Use role-based menu items if RBACNavConfig not available
    console.log('[DashboardService] Using fallback menu items');
    
    // Get base path for routes
    function getBasePath() {
      const isLiveServer = window.location.port === '5503' || (window.location.hostname === '127.0.0.1' && window.location.port === '5503');
      if (isLiveServer) return '';
      
      const currentPath = window.location.pathname;
      const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
      const depth = segments.length;
      return depth > 0 ? '../'.repeat(depth) : '';
    }
    
    const basePath = getBasePath();
    
    // Core menu items based on role
    const coreMenuItems = [
      { id: 'dashboard', label: 'Dashboard', route: getRouteForMenu('dashboard', `${basePath}pages/dashboard/index.html`), feature: 'user_dashboard', icon: '<i class="ph ph-gauge"></i>' }
    ];
    
    // Role-specific menu items
    if (userRoleId === 'project_lead') {
      coreMenuItems.push(
        { id: 'opportunities', label: 'Opportunities', route: getRouteForMenu('opportunities', `${basePath}pages/opportunities/index.html`), feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>' },
        { id: 'opportunities-create', label: 'Create Opportunity', route: getRouteForMenu('opportunities/create', `${basePath}pages/opportunities/create/index.html`), feature: 'project_creation', icon: '<i class="ph ph-plus-circle"></i>' },
        { id: 'matches', label: 'Matches', route: getRouteForMenu('matches', `${basePath}pages/matches/index.html`), feature: 'view_matches', icon: '<i class="ph ph-link"></i>' },
        { id: 'proposals', label: 'Proposals', route: getRouteForMenu('proposals', `${basePath}pages/proposals/index.html`), feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>' },
        { id: 'contracts', label: 'Contracts', route: getRouteForMenu('contracts', `${basePath}pages/contracts/index.html`), feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>' }
      );
    } else if (userRoleId === 'supplier') {
      coreMenuItems.push(
        { id: 'opportunities', label: 'Opportunities', route: getRouteForMenu('opportunities', `${basePath}pages/opportunities/index.html`), feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>', filter: 'OFFER_SERVICE' },
        { id: 'opportunities-create', label: 'Create Offer', route: getRouteForMenu('opportunities/create', `${basePath}pages/opportunities/create/index.html`), feature: 'project_creation', icon: '<i class="ph ph-plus-circle"></i>' },
        { id: 'proposals', label: 'Proposals', route: getRouteForMenu('proposals', `${basePath}pages/proposals/index.html`), feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>' },
        { id: 'contracts', label: 'Contracts', route: getRouteForMenu('contracts', `${basePath}pages/contracts/index.html`), feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>', filter: 'own' }
      );
    } else if (userRoleId === 'service_provider') {
      coreMenuItems.push(
        { id: 'opportunities', label: 'Opportunities', route: getRouteForMenu('opportunities', `${basePath}pages/opportunities/index.html`), feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>', filter: 'OFFER_SERVICE' },
        { id: 'opportunities-create', label: 'Create Offer', route: getRouteForMenu('opportunities/create', `${basePath}pages/opportunities/create/index.html`), feature: 'project_creation', icon: '<i class="ph ph-plus-circle"></i>' },
        { id: 'proposals', label: 'Proposals', route: getRouteForMenu('proposals', `${basePath}pages/proposals/index.html`), feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>' },
        { id: 'contracts', label: 'Contracts', route: getRouteForMenu('contracts', `${basePath}pages/contracts/index.html`), feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>' }
      );
    } else if (userRoleId === 'consultant') {
      coreMenuItems.push(
        { id: 'opportunities', label: 'Opportunities', route: getRouteForMenu('opportunities', `${basePath}pages/opportunities/index.html`), feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>', filter: 'OFFER_SERVICE' },
        { id: 'opportunities-create', label: 'Create Offer', route: getRouteForMenu('opportunities/create', `${basePath}pages/opportunities/create/index.html`), feature: 'project_creation', icon: '<i class="ph ph-plus-circle"></i>' },
        { id: 'proposals', label: 'Proposals', route: getRouteForMenu('proposals', `${basePath}pages/proposals/index.html`), feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>' },
        { id: 'contracts', label: 'Contracts', route: getRouteForMenu('contracts', `${basePath}pages/contracts/index.html`), feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>' }
      );
    } else if (userRoleId === 'professional') {
      coreMenuItems.push(
        { id: 'opportunities', label: 'Opportunities', route: getRouteForMenu('opportunities', `${basePath}pages/opportunities/index.html`), feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>' },
        { id: 'proposals', label: 'Proposals', route: getRouteForMenu('proposals', `${basePath}pages/proposals/index.html`), feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>', conditional: true },
        { id: 'contracts', label: 'Contracts', route: getRouteForMenu('contracts', `${basePath}pages/contracts/index.html`), feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>', filter: 'own' }
      );
    } else if (userRoleId === 'mentor') {
      coreMenuItems.push(
        { id: 'collaboration', label: 'Mentorship', route: getRouteForMenu('collab-mentorship', `${basePath}pages/collaboration/mentorship/index.html`), feature: 'collaboration_opportunities', icon: '<i class="ph ph-graduation-cap"></i>' }
      );
    } else if (userRoleId === 'platform_admin') {
      coreMenuItems.push(
        { id: 'admin', label: 'Admin Dashboard', route: getRouteForMenu('admin', `${basePath}pages/admin/index.html`), feature: 'admin_dashboard', icon: '<i class="ph ph-gear"></i>' },
        { id: 'opportunities', label: 'Opportunities', route: getRouteForMenu('opportunities', `${basePath}pages/opportunities/index.html`), feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>', access: 'monitor' },
        { id: 'proposals', label: 'Proposals', route: getRouteForMenu('proposals', `${basePath}pages/proposals/index.html`), feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>', access: 'monitor' },
        { id: 'contracts', label: 'Contracts', route: getRouteForMenu('contracts', `${basePath}pages/contracts/index.html`), feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>', access: 'monitor' },
        { id: 'admin-vetting', label: 'User Vetting', route: getRouteForMenu('admin-vetting', `${basePath}pages/admin-vetting/index.html`), feature: 'user_vetting', icon: '<i class="ph ph-check-circle"></i>' },
        { id: 'admin-users-management', label: 'User Management', route: getRouteForMenu('admin-users-management', `${basePath}pages/admin/users-management/index.html`), feature: 'user_management', icon: '<i class="ph ph-users"></i>' },
        { id: 'admin-moderation', label: 'Project Moderation', route: getRouteForMenu('admin-moderation', `${basePath}pages/admin-moderation/index.html`), feature: 'project_moderation', icon: '<i class="ph ph-shield-check"></i>' },
        { id: 'admin-audit', label: 'Audit Trail', route: getRouteForMenu('admin-audit', `${basePath}pages/admin-audit/index.html`), feature: 'audit_trail', icon: '<i class="ph ph-clipboard"></i>' },
        { id: 'admin-reports', label: 'Reports', route: getRouteForMenu('admin-reports', `${basePath}pages/admin-reports/index.html`), feature: 'reports', icon: '<i class="ph ph-chart-bar"></i>' }
      );
    } else if (userRoleId === 'auditor') {
      coreMenuItems.push(
        { id: 'audit', label: 'Audit Dashboard', route: getRouteForMenu('admin-audit', `${basePath}pages/admin-audit/index.html`), feature: 'audit_trail', icon: '<i class="ph ph-clipboard"></i>', readOnly: true },
        { id: 'opportunities', label: 'Opportunities', route: getRouteForMenu('opportunities', `${basePath}pages/opportunities/index.html`), feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>', readOnly: true },
        { id: 'proposals', label: 'Proposals', route: getRouteForMenu('proposals', `${basePath}pages/proposals/index.html`), feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>', readOnly: true },
        { id: 'contracts', label: 'Contracts', route: getRouteForMenu('contracts', `${basePath}pages/contracts/index.html`), feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>', readOnly: true }
      );
    }
    
    return { success: true, items: coreMenuItems };
  }

  // ============================================
  // Public API
  // ============================================
  window.DashboardService = {
    getDashboardData,
    getMenuItems
  };

})();
