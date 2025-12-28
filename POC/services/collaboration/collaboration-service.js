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
    
    // Check what applications user can view
    if (typeof PMTwinRBAC !== 'undefined') {
      const canViewOwn = await PMTwinRBAC.canCurrentUserAccess('view_own_applications');
      
      if (canViewOwn) {
        applications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
      }
    } else {
      applications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
    }
    
    // Apply filters
    if (filters.opportunityId) {
      applications = applications.filter(a => a.opportunityId === filters.opportunityId);
    }
    if (filters.status) {
      applications = applications.filter(a => a.status === filters.status);
    }
    
    return { success: true, applications: applications };
  }

  window.CollaborationService = {
    createCollaborationOpportunity,
    getCollaborationOpportunities,
    applyToCollaboration,
    getCollaborationApplications
  };

})();


