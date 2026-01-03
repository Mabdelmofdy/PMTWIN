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
    
    try {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }
      
      // Validate required fields
      if (!opportunityData.modelType && !opportunityData.modelId) {
        return { success: false, error: 'Model type or model ID is required' };
      }
      if (!opportunityData.modelName) {
        return { success: false, error: 'Model name is required' };
      }
      
      // Check permission
      if (typeof PMTwinRBAC !== 'undefined') {
        const hasPermission = await PMTwinRBAC.canCurrentUserAccess('create_collaboration_opportunities');
        if (!hasPermission) {
          return { success: false, error: 'You do not have permission to create collaboration opportunities' };
        }
      }
      
      // Set creator and default status
      opportunityData.creatorId = currentUser.id;
      if (!opportunityData.status) {
        opportunityData.status = 'draft';
      }
      
      // Use modelId if provided, otherwise use modelType
      if (opportunityData.modelId && !opportunityData.modelType) {
        opportunityData.modelType = opportunityData.modelId;
      }
      
      const opportunity = PMTwinData.CollaborationOpportunities.create(opportunityData);
      
      if (opportunity) {
        return { success: true, opportunity: opportunity, message: 'Collaboration opportunity created successfully' };
      }
      
      return { success: false, error: 'Failed to create collaboration opportunity' };
    } catch (error) {
      console.error('Error creating collaboration opportunity:', error);
      return { success: false, error: 'Failed to create collaboration opportunity: ' + error.message };
    }
  }

  async function getCollaborationOpportunities(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    try {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      
      let opportunities = [];
      
      if (currentUser) {
        // Check what opportunities user can view
        if (typeof PMTwinRBAC !== 'undefined') {
          const canViewOwn = await PMTwinRBAC.canCurrentUserAccess('manage_own_collaboration_opportunities');
          const canViewAll = await PMTwinRBAC.canCurrentUserAccess('view_all_collaboration_opportunities');
          
          if (canViewAll) {
            // Admin or privileged user - see all
            opportunities = PMTwinData.CollaborationOpportunities.getAll();
          } else if (canViewOwn) {
            // View own opportunities
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
      if (filters.modelId) {
        opportunities = opportunities.filter(o => o.modelId === filters.modelId);
      }
      if (filters.status) {
        opportunities = opportunities.filter(o => o.status === filters.status);
      }
      if (filters.category) {
        opportunities = opportunities.filter(o => o.category === filters.category);
      }
      if (filters.relationshipType) {
        opportunities = opportunities.filter(o => o.relationshipType === filters.relationshipType);
      }
      if (filters.creatorId) {
        opportunities = opportunities.filter(o => o.creatorId === filters.creatorId);
      }
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        if (start) {
          opportunities = opportunities.filter(o => {
            const createdDate = new Date(o.createdAt);
            return createdDate >= new Date(start);
          });
        }
        if (end) {
          opportunities = opportunities.filter(o => {
            const createdDate = new Date(o.createdAt);
            return createdDate <= new Date(end);
          });
        }
      }
      
      // Sort by creation date (newest first) if no sort specified
      if (!filters.sortBy) {
        opportunities.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
      }
      
      return { success: true, opportunities: opportunities, count: opportunities.length };
    } catch (error) {
      console.error('Error getting collaboration opportunities:', error);
      return { success: false, error: 'Failed to retrieve collaboration opportunities: ' + error.message };
    }
  }

  async function applyToCollaboration(opportunityId, applicationData) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    try {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }
      
      // Validate opportunity exists
      const opportunity = PMTwinData.CollaborationOpportunities.getById(opportunityId);
      if (!opportunity) {
        return { success: false, error: 'Collaboration opportunity not found' };
      }
      
      // Check if opportunity is still active
      if (opportunity.status !== 'active' && opportunity.status !== 'pending') {
        return { success: false, error: 'This opportunity is no longer accepting applications' };
      }
      
      // Check if user already applied
      const existingApplications = PMTwinData.CollaborationApplications.getByOpportunity(opportunityId);
      const hasApplied = existingApplications.some(a => a.applicantId === currentUser.id);
      if (hasApplied) {
        return { success: false, error: 'You have already applied to this opportunity' };
      }
      
      // Check permission
      if (typeof PMTwinRBAC !== 'undefined') {
        const hasPermission = await PMTwinRBAC.canCurrentUserAccess('apply_to_collaboration_opportunities');
        if (!hasPermission) {
          return { success: false, error: 'You do not have permission to apply to collaboration opportunities' };
        }
      }
      
      // Set applicant and opportunity
      applicationData.applicantId = currentUser.id;
      applicationData.opportunityId = opportunityId;
      if (!applicationData.status) {
        applicationData.status = 'pending';
      }
      
      const application = PMTwinData.CollaborationApplications.create(applicationData);
      
      if (application) {
        return { success: true, application: application, message: 'Application submitted successfully' };
      }
      
      return { success: false, error: 'Failed to submit application' };
    } catch (error) {
      console.error('Error applying to collaboration:', error);
      return { success: false, error: 'Failed to submit application: ' + error.message };
    }
  }

  async function getCollaborationApplications(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    try {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }
      
      let applications = [];
      
      // Check what applications user can view
      if (typeof PMTwinRBAC !== 'undefined') {
        const canViewOwn = await PMTwinRBAC.canCurrentUserAccess('view_own_applications');
        const canViewAll = await PMTwinRBAC.canCurrentUserAccess('view_all_collaboration_applications');
        const canViewOpportunityApps = await PMTwinRBAC.canCurrentUserAccess('view_opportunity_applications');
        
        if (canViewAll) {
          // Admin - see all applications
          applications = PMTwinData.CollaborationApplications.getAll();
        } else if (canViewOpportunityApps && filters.opportunityId) {
          // Can view applications for specific opportunity (opportunity creator)
          const opportunity = PMTwinData.CollaborationOpportunities.getById(filters.opportunityId);
          if (opportunity && opportunity.creatorId === currentUser.id) {
            applications = PMTwinData.CollaborationApplications.getByOpportunity(filters.opportunityId);
          } else {
            applications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
          }
        } else if (canViewOwn) {
          // View own applications
          applications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
        } else {
          applications = [];
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
      if (filters.applicantId) {
        applications = applications.filter(a => a.applicantId === filters.applicantId);
      }
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        if (start) {
          applications = applications.filter(a => {
            const submittedDate = new Date(a.submittedAt);
            return submittedDate >= new Date(start);
          });
        }
        if (end) {
          applications = applications.filter(a => {
            const submittedDate = new Date(a.submittedAt);
            return submittedDate <= new Date(end);
          });
        }
      }
      
      // Sort by submission date (newest first) if no sort specified
      if (!filters.sortBy) {
        applications.sort((a, b) => {
          const dateA = new Date(a.submittedAt || 0);
          const dateB = new Date(b.submittedAt || 0);
          return dateB - dateA;
        });
      }
      
      return { success: true, applications: applications, count: applications.length };
    } catch (error) {
      console.error('Error getting collaboration applications:', error);
      return { success: false, error: 'Failed to retrieve collaboration applications: ' + error.message };
    }
  }

  window.CollaborationService = {
    createCollaborationOpportunity,
    getCollaborationOpportunities,
    applyToCollaboration,
    getCollaborationApplications
  };

})();


