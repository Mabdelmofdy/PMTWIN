/**
 * Proposal Service
 * Handles proposal-related operations with role-based access control
 */

(function() {
  'use strict';

  async function createProposal(proposalData) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('create_proposals');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to create proposals' };
      }
    }
    
    proposalData.providerId = currentUser.id;
    const proposal = PMTwinData.Proposals.create(proposalData);
    
    if (proposal) {
      return { success: true, proposal: proposal };
    }
    
    return { success: false, error: 'Failed to create proposal' };
  }

  async function getProposals(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    let proposals = [];
    
    // Check what proposals user can view
    if (typeof PMTwinRBAC !== 'undefined') {
      const canViewAll = await PMTwinRBAC.canCurrentUserAccess('view_all_proposals');
      const canViewOwn = await PMTwinRBAC.canCurrentUserAccess('view_own_proposals');
      const canViewReceived = await PMTwinRBAC.canCurrentUserAccess('view_proposals');
      
      if (canViewAll) {
        proposals = PMTwinData.Proposals.getAll();
      } else if (canViewOwn) {
        proposals = PMTwinData.Proposals.getByProvider(currentUser.id);
      } else if (canViewReceived) {
        // Get proposals for projects created by this user
        const userProjects = PMTwinData.Projects.getByCreator(currentUser.id);
        const projectIds = userProjects.map(p => p.id);
        proposals = PMTwinData.Proposals.getAll().filter(p => projectIds.includes(p.projectId));
      }
    } else {
      // Fallback to legacy behavior
      proposals = PMTwinData.Proposals.getByProvider(currentUser.id);
    }
    
    // Apply filters
    if (filters.status) {
      proposals = proposals.filter(p => p.status === filters.status);
    }
    if (filters.projectId) {
      proposals = proposals.filter(p => p.projectId === filters.projectId);
    }
    
    return { success: true, proposals: proposals };
  }

  async function updateProposalStatus(proposalId, status, reason = null) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission based on status change
    if (status === 'approved' || status === 'rejected') {
      const canApprove = typeof PMTwinRBAC !== 'undefined' && 
                         await PMTwinRBAC.canCurrentUserAccess('approve_proposals');
      const canReject = typeof PMTwinRBAC !== 'undefined' && 
                        await PMTwinRBAC.canCurrentUserAccess('reject_proposals');
      
      if (status === 'approved' && !canApprove) {
        return { success: false, error: 'You do not have permission to approve proposals' };
      }
      if (status === 'rejected' && !canReject) {
        return { success: false, error: 'You do not have permission to reject proposals' };
      }
      
      // Check if user owns the project
      const project = PMTwinData.Projects.getById(proposal.projectId);
      if (project && project.creatorId !== currentUser.id && !canApprove) {
        return { success: false, error: 'You can only approve/reject proposals for your own projects' };
      }
    } else {
      // Editing own proposal
      if (proposal.providerId !== currentUser.id) {
        return { success: false, error: 'You can only edit your own proposals' };
      }
    }
    
    const updates = { status: status };
    if (reason) {
      updates.rejectionReason = reason;
    }
    
    const updated = PMTwinData.Proposals.update(proposalId, updates);
    if (updated) {
      return { success: true, proposal: updated };
    }
    
    return { success: false, error: 'Failed to update proposal' };
  }

  window.ProposalService = {
    createProposal,
    getProposals,
    updateProposalStatus
  };

})();


