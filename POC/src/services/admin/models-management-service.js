/**
 * Models Management Service
 * Handles collaboration models CRUD operations for admin portal
 */

(function() {
  'use strict';

  async function getAllOpportunities(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view collaboration opportunities' };
    }
    
    const opportunities = PMTwinData.CollaborationOpportunities.getWithFilters(filters);
    
    return { success: true, opportunities: opportunities };
  }

  async function getOpportunitiesByModel(modelId, filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view collaboration opportunities' };
    }
    
    const opportunities = PMTwinData.CollaborationOpportunities.getByModel(modelId);
    
    // Apply additional filters
    let filtered = opportunities;
    if (filters.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(o => new Date(o.createdAt) <= new Date(filters.dateTo));
    }
    
    return { success: true, opportunities: filtered };
  }

  async function getOpportunityById(opportunityId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view collaboration opportunities' };
    }
    
    const opportunity = PMTwinData.CollaborationOpportunities.getById(opportunityId);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }
    
    // Get applications for this opportunity
    const applications = PMTwinData.CollaborationApplications.getByOpportunity(opportunityId);
    
    return { success: true, opportunity: opportunity, applications: applications };
  }

  async function approveOpportunity(opportunityId, adminId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to approve opportunities' };
    }
    
    const opportunity = PMTwinData.CollaborationOpportunities.getById(opportunityId);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }
    
    const updated = PMTwinData.CollaborationOpportunities.update(opportunityId, {
      status: 'active',
      approvedAt: new Date().toISOString(),
      approvedBy: adminId || currentUser.id
    });
    
    if (updated) {
      // Notify creator
      PMTwinData.Notifications.create({
        userId: opportunity.creatorId,
        type: 'collaboration_approved',
        title: 'Collaboration Opportunity Approved',
        message: `Your collaboration opportunity "${opportunity.title}" has been approved and is now active.`,
        relatedEntityType: 'collaboration_opportunity',
        relatedEntityId: opportunityId
      });
      
      return { success: true, opportunity: updated };
    }
    
    return { success: false, error: 'Failed to approve opportunity' };
  }

  async function rejectOpportunity(opportunityId, reason, adminId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to reject opportunities' };
    }
    
    const opportunity = PMTwinData.CollaborationOpportunities.getById(opportunityId);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }
    
    const updated = PMTwinData.CollaborationOpportunities.update(opportunityId, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: adminId || currentUser.id,
      rejectionReason: reason
    });
    
    if (updated) {
      // Notify creator
      PMTwinData.Notifications.create({
        userId: opportunity.creatorId,
        type: 'collaboration_rejected',
        title: 'Collaboration Opportunity Rejected',
        message: `Your collaboration opportunity "${opportunity.title}" has been rejected. Reason: ${reason}`,
        relatedEntityType: 'collaboration_opportunity',
        relatedEntityId: opportunityId
      });
      
      return { success: true, opportunity: updated };
    }
    
    return { success: false, error: 'Failed to reject opportunity' };
  }

  async function getModelStatistics(modelId = null) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view statistics' };
    }
    
    const stats = PMTwinData.CollaborationOpportunities.getStatistics(modelId);
    
    return { success: true, statistics: stats };
  }

  async function exportOpportunities(filters = {}, format = 'csv') {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to export data' };
    }
    
    const opportunities = PMTwinData.CollaborationOpportunities.getWithFilters(filters);
    
    if (format === 'csv') {
      // Convert to CSV
      const headers = ['ID', 'Model', 'Title', 'Creator', 'Status', 'Created At', 'Applications'];
      const rows = opportunities.map(opp => [
        opp.id,
        opp.modelId || opp.modelName || 'Unknown',
        opp.title || '',
        opp.creatorId || '',
        opp.status || '',
        opp.createdAt || '',
        opp.applicationsReceived || 0
      ]);
      
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      
      return { success: true, data: csv, format: 'csv' };
    } else {
      // Return JSON
      return { success: true, data: opportunities, format: 'json' };
    }
  }

  window.ModelsManagementService = {
    getAllOpportunities,
    getOpportunitiesByModel,
    getOpportunityById,
    approveOpportunity,
    rejectOpportunity,
    getModelStatistics,
    exportOpportunities
  };

})();

