/**
 * Analytics Service
 * Handles analytics data aggregation for admin portal
 */

(function() {
  'use strict';

  async function getUserAnalytics(dateRange = null, filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view analytics' };
    }
    
    let users = PMTwinData.Users.getAll();
    
    // Filter by date range if provided
    if (dateRange && dateRange.from) {
      users = users.filter(u => new Date(u.profile?.createdAt || u.createdAt) >= new Date(dateRange.from));
    }
    if (dateRange && dateRange.to) {
      users = users.filter(u => new Date(u.profile?.createdAt || u.createdAt) <= new Date(dateRange.to));
    }
    
    const analytics = {
      total: users.length,
      byType: {
        individual: users.filter(u => u.userType === 'individual' || u.role === 'individual').length,
        entity: users.filter(u => u.userType === 'company' || u.role === 'entity').length,
        consultant: users.filter(u => u.userType === 'consultant' || u.role === 'consultant').length,
        admin: users.filter(u => u.role === 'admin').length
      },
      byStatus: {
        approved: users.filter(u => u.profile?.status === 'approved' || u.onboardingStage === 'approved').length,
        pending: users.filter(u => u.profile?.status === 'pending' || u.onboardingStage === 'under_review').length,
        rejected: users.filter(u => u.profile?.status === 'rejected' || u.onboardingStage === 'rejected').length
      },
      registrationTrend: calculateRegistrationTrend(users, dateRange),
      geographicDistribution: calculateGeographicDistribution(users),
      profileCompletionRate: calculateProfileCompletionRate(users)
    };
    
    return { success: true, analytics: analytics };
  }

  async function getProjectAnalytics(dateRange = null, filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view analytics' };
    }
    
    let projects = PMTwinData.Projects.getAll();
    
    // Filter by date range if provided
    if (dateRange && dateRange.from) {
      projects = projects.filter(p => new Date(p.createdAt) >= new Date(dateRange.from));
    }
    if (dateRange && dateRange.to) {
      projects = projects.filter(p => new Date(p.createdAt) <= new Date(dateRange.to));
    }
    
    const analytics = {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length,
      byCategory: calculateCategoryDistribution(projects),
      averageValue: calculateAverageProjectValue(projects),
      totalValue: calculateTotalProjectValue(projects),
      completionRate: projects.length > 0 ? projects.filter(p => p.status === 'completed').length / projects.length : 0,
      averageDuration: calculateAverageProjectDuration(projects)
    };
    
    return { success: true, analytics: analytics };
  }

  async function getProposalAnalytics(dateRange = null, filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view analytics' };
    }
    
    let proposals = PMTwinData.Proposals.getAll();
    
    // Filter by date range if provided
    if (dateRange && dateRange.from) {
      proposals = proposals.filter(p => new Date(p.createdAt) >= new Date(dateRange.from));
    }
    if (dateRange && dateRange.to) {
      proposals = proposals.filter(p => new Date(p.createdAt) <= new Date(dateRange.to));
    }
    
    const analytics = {
      total: proposals.length,
      cash: proposals.filter(p => p.type === 'cash').length,
      barter: proposals.filter(p => p.type === 'barter').length,
      approved: proposals.filter(p => p.status === 'approved').length,
      rejected: proposals.filter(p => p.status === 'rejected').length,
      pending: proposals.filter(p => p.status === 'in_review' || p.status === 'pending').length,
      approvalRate: proposals.length > 0 ? proposals.filter(p => p.status === 'approved').length / proposals.length : 0,
      averageValue: calculateAverageProposalValue(proposals),
      totalValue: calculateTotalProposalValue(proposals)
    };
    
    return { success: true, analytics: analytics };
  }

  async function getCollaborationAnalytics(dateRange = null, filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view analytics' };
    }
    
    let opportunities = PMTwinData.CollaborationOpportunities.getAll();
    
    // Filter by date range if provided
    if (dateRange && dateRange.from) {
      opportunities = opportunities.filter(o => new Date(o.createdAt) >= new Date(dateRange.from));
    }
    if (dateRange && dateRange.to) {
      opportunities = opportunities.filter(o => new Date(o.createdAt) <= new Date(dateRange.to));
    }
    
    const stats = PMTwinData.CollaborationOpportunities.getStatistics();
    const applications = PMTwinData.CollaborationApplications.getAll();
    
    const analytics = {
      total: opportunities.length,
      byModel: stats.byModel,
      byStatus: stats.byStatus,
      totalApplications: applications.length,
      approvedApplications: applications.filter(a => a.status === 'approved').length,
      successRate: opportunities.length > 0 ? opportunities.filter(o => o.status === 'active' || o.status === 'closed').length / opportunities.length : 0,
      totalValue: stats.totalValue,
      averageValue: stats.averageValue
    };
    
    return { success: true, analytics: analytics };
  }

  async function getMatchingAnalytics(dateRange = null, filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view analytics' };
    }
    
    let matches = PMTwinData.Matches.getAll();
    
    // Filter by date range if provided
    if (dateRange && dateRange.from) {
      matches = matches.filter(m => new Date(m.createdAt) >= new Date(dateRange.from));
    }
    if (dateRange && dateRange.to) {
      matches = matches.filter(m => new Date(m.createdAt) <= new Date(dateRange.to));
    }
    
    const analytics = {
      total: matches.length,
      averageScore: calculateAverageMatchScore(matches),
      conversionRate: calculateMatchConversionRate(matches),
      byCategory: calculateMatchCategoryDistribution(matches),
      performance: {
        accuracy: 0.90, // Placeholder
        responseTime: 2.5, // Placeholder
        userSatisfaction: 0.85 // Placeholder
      }
    };
    
    return { success: true, analytics: analytics };
  }

  async function getFinancialAnalytics(dateRange = null, filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view analytics' };
    }
    
    const projects = PMTwinData.Projects.getAll();
    const proposals = PMTwinData.Proposals.getAll();
    const opportunities = PMTwinData.CollaborationOpportunities.getAll();
    
    const analytics = {
      platformVolume: calculateTotalProjectValue(projects),
      totalSavings: calculateTotalSavings(opportunities, proposals),
      averageTransactionValue: calculateAverageTransactionValue(proposals),
      barterValue: proposals.filter(p => p.type === 'barter').reduce((sum, p) => sum + (p.total || 0), 0),
      cashTransactions: proposals.filter(p => p.type === 'cash').reduce((sum, p) => sum + (p.total || 0), 0),
      growthRate: 0.15 // Placeholder - would calculate from historical data
    };
    
    return { success: true, analytics: analytics };
  }

  async function exportAnalytics(data, format = 'csv') {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to export analytics' };
    }
    
    if (format === 'csv') {
      // Convert analytics data to CSV format
      const csv = convertAnalyticsToCSV(data);
      return { success: true, data: csv, format: 'csv' };
    } else {
      // Return JSON
      return { success: true, data: data, format: 'json' };
    }
  }

  // Helper functions
  function calculateRegistrationTrend(users, dateRange) {
    // Group by date and count
    const trend = {};
    users.forEach(user => {
      const date = new Date(user.profile?.createdAt || user.createdAt).toISOString().split('T')[0];
      trend[date] = (trend[date] || 0) + 1;
    });
    
    return Object.entries(trend).map(([date, count]) => ({ date, count }));
  }

  function calculateGeographicDistribution(users) {
    const distribution = {};
    users.forEach(user => {
      const location = user.profile?.location?.city || user.profile?.location || 'Unknown';
      distribution[location] = (distribution[location] || 0) + 1;
    });
    return distribution;
  }

  function calculateProfileCompletionRate(users) {
    if (users.length === 0) return 0;
    const totalScore = users.reduce((sum, user) => {
      const score = PMTwinData.calculateProfileCompletionScore(user);
      return sum + (typeof score === 'object' ? score.score : score);
    }, 0);
    return totalScore / users.length;
  }

  function calculateCategoryDistribution(projects) {
    const distribution = {};
    projects.forEach(project => {
      const category = project.category || 'Unknown';
      distribution[category] = (distribution[category] || 0) + 1;
    });
    return distribution;
  }

  function calculateAverageProjectValue(projects) {
    if (projects.length === 0) return 0;
    const total = projects.reduce((sum, p) => sum + (p.budget?.max || p.budget?.min || 0), 0);
    return total / projects.length;
  }

  function calculateTotalProjectValue(projects) {
    return projects.reduce((sum, p) => sum + (p.budget?.max || p.budget?.min || 0), 0);
  }

  function calculateAverageProjectDuration(projects) {
    const completed = projects.filter(p => p.status === 'completed' && p.completedAt && p.createdAt);
    if (completed.length === 0) return 0;
    const totalDays = completed.reduce((sum, p) => {
      const days = (new Date(p.completedAt) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    return totalDays / completed.length;
  }

  function calculateAverageProposalValue(proposals) {
    if (proposals.length === 0) return 0;
    const total = proposals.reduce((sum, p) => sum + (p.total || 0), 0);
    return total / proposals.length;
  }

  function calculateTotalProposalValue(proposals) {
    return proposals.reduce((sum, p) => sum + (p.total || 0), 0);
  }

  function calculateAverageMatchScore(matches) {
    if (matches.length === 0) return 0;
    const total = matches.reduce((sum, m) => sum + (m.matchScore || 0), 0);
    return total / matches.length;
  }

  function calculateMatchConversionRate(matches) {
    if (matches.length === 0) return 0;
    const withProposals = matches.filter(m => m.proposalSubmitted === true).length;
    return withProposals / matches.length;
  }

  function calculateMatchCategoryDistribution(matches) {
    const distribution = {};
    matches.forEach(match => {
      const category = match.projectCategory || 'Unknown';
      distribution[category] = (distribution[category] || 0) + 1;
    });
    return distribution;
  }

  function calculateTotalSavings(opportunities, proposals) {
    // Calculate savings from bulk purchasing and barter
    let savings = 0;
    
    // Bulk purchasing savings (placeholder calculation)
    const bulkPurchases = opportunities.filter(o => o.modelId === '3.1');
    savings += bulkPurchases.length * 10000; // Placeholder
    
    // Barter value
    const barterProposals = proposals.filter(p => p.type === 'barter');
    savings += barterProposals.reduce((sum, p) => sum + (p.total || 0), 0);
    
    return savings;
  }

  function calculateAverageTransactionValue(proposals) {
    if (proposals.length === 0) return 0;
    const total = proposals.reduce((sum, p) => sum + (p.total || 0), 0);
    return total / proposals.length;
  }

  function convertAnalyticsToCSV(data) {
    // Simple CSV conversion for analytics data
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  }

  window.AnalyticsService = {
    getUserAnalytics,
    getProjectAnalytics,
    getProposalAnalytics,
    getCollaborationAnalytics,
    getMatchingAnalytics,
    getFinancialAnalytics,
    exportAnalytics
  };

})();

