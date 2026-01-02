/**
 * Collaboration Service
 * Handles collaboration opportunities and applications
 */

(function() {
  'use strict';

  async function createCollaborationOpportunity(opportunityData) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('create_collaboration_opportunities');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to create collaboration opportunities' };
      }
    }
    
    opportunityData.creatorId = currentUser.id;
    const opportunity = PMTwinData.CollaborationOpportunities.create(opportunityData);
    
    if (opportunity) {
      return { success: true, opportunity: opportunity };
    }
    
    return { success: false, error: 'Failed to create collaboration opportunity' };
  }

  async function getCollaborationOpportunities(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    
    let opportunities = [];
    
    if (currentUser) {
      // Check what opportunities user can view
      if (typeof PMTwinRBAC !== 'undefined') {
        const canViewOwn = await PMTwinRBAC.canCurrentUserAccess('manage_own_collaboration_opportunities');
        
        if (canViewOwn) {
          opportunities = PMTwinData.CollaborationOpportunities.getByCreator(currentUser.id);
        } else {
          // View public/active opportunities
          opportunities = PMTwinData.CollaborationOpportunities.getActive();
        }
      } else {
        opportunities = PMTwinData.CollaborationOpportunities.getActive();
      }
    } else {
      opportunities = PMTwinData.CollaborationOpportunities.getActive();
    }
    
    // Apply filters
    if (filters.modelType) {
      opportunities = opportunities.filter(o => o.modelType === filters.modelType);
    }
    if (filters.status) {
      opportunities = opportunities.filter(o => o.status === filters.status);
    }
    
    return { success: true, opportunities: opportunities };
  }

  async function applyToCollaboration(opportunityId, applicationData) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('apply_to_collaboration_opportunities');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to apply to collaboration opportunities' };
      }
    }
    
    applicationData.applicantId = currentUser.id;
    applicationData.opportunityId = opportunityId;
    const application = PMTwinData.CollaborationApplications.create(applicationData);
    
    if (application) {
      return { success: true, application: application };
    }
    
    return { success: false, error: 'Failed to submit application' };
  }

  async function getCollaborationApplications(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    let applications = [];
    
    // If filtering by opportunityId, check if user is the creator
    if (filters.opportunityId) {
      const opportunity = PMTwinData.CollaborationOpportunities.getById(filters.opportunityId);
      if (opportunity && opportunity.creatorId === currentUser.id) {
        // Creator can view all applications for their opportunity
        applications = PMTwinData.CollaborationApplications.getByOpportunity(filters.opportunityId);
      } else {
        // Otherwise, only view own applications
        applications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
        applications = applications.filter(a => a.opportunityId === filters.opportunityId);
      }
    } else {
      // Check what applications user can view
      if (typeof PMTwinRBAC !== 'undefined') {
        const canViewOwn = await PMTwinRBAC.canCurrentUserAccess('view_own_applications');
        
        if (canViewOwn) {
          applications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
        }
      } else {
        applications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
      }
    }
    
    // Apply status filter
    if (filters.status) {
      applications = applications.filter(a => a.status === filters.status);
    }
    
    return { success: true, applications: applications };
  }

  async function updateCollaborationOpportunity(opportunityId, updates) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const opportunity = PMTwinData.CollaborationOpportunities.getById(opportunityId);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }
    
    // Check permission - only creator can update
    if (opportunity.creatorId !== currentUser.id) {
      if (typeof PMTwinRBAC !== 'undefined') {
        const hasPermission = await PMTwinRBAC.canCurrentUserAccess('manage_all_collaboration_opportunities');
        if (!hasPermission) {
          return { success: false, error: 'You do not have permission to update this opportunity' };
        }
      } else {
        return { success: false, error: 'You can only update your own opportunities' };
      }
    }
    
    const updated = PMTwinData.CollaborationOpportunities.update(opportunityId, updates);
    
    if (updated) {
      return { success: true, opportunity: updated };
    }
    
    return { success: false, error: 'Failed to update opportunity' };
  }

  async function publishOpportunity(opportunityId) {
    return await updateCollaborationOpportunity(opportunityId, { 
      status: 'active',
      publishedAt: new Date().toISOString()
    });
  }

  async function closeOpportunity(opportunityId) {
    return await updateCollaborationOpportunity(opportunityId, { 
      status: 'completed',
      closedAt: new Date().toISOString()
    });
  }

  async function getOpportunityApplications(opportunityId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const opportunity = PMTwinData.CollaborationOpportunities.getById(opportunityId);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }
    
    // Check permission - only creator can view applications
    if (opportunity.creatorId !== currentUser.id) {
      if (typeof PMTwinRBAC !== 'undefined') {
        const hasPermission = await PMTwinRBAC.canCurrentUserAccess('view_all_applications');
        if (!hasPermission) {
          return { success: false, error: 'You do not have permission to view applications for this opportunity' };
        }
      } else {
        return { success: false, error: 'You can only view applications for your own opportunities' };
      }
    }
    
    const applications = PMTwinData.CollaborationApplications.getByOpportunity(opportunityId);
    
    return { success: true, applications: applications || [] };
  }

  window.CollaborationService = {
    createCollaborationOpportunity,
    getCollaborationOpportunities,
    applyToCollaboration,
    getCollaborationApplications,
    updateCollaborationOpportunity,
    publishOpportunity,
    closeOpportunity,
    getOpportunityApplications
  };

})();


