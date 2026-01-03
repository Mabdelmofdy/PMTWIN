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

  async function createProposalFromOffering(offeringId, projectId, proposalData = {}) {
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
    
    // Get service offering
    if (typeof ServiceOfferingService === 'undefined') {
      return { success: false, error: 'Service offering service not available' };
    }
    
    const offeringResult = await ServiceOfferingService.getOfferingById(offeringId);
    if (!offeringResult.success || !offeringResult.offering) {
      return { success: false, error: 'Service offering not found' };
    }
    
    const offering = offeringResult.offering;
    
    // Validate offering is available
    if (offering.status !== 'Active') {
      return { success: false, error: 'Service offering is not active' };
    }
    
    // Check if offering provider matches current user
    if (offering.provider_user_id !== currentUser.id) {
      return { success: false, error: 'You can only create proposals from your own service offerings' };
    }
    
    // Get project
    const project = PMTwinData.Projects.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    
    // Validate offering matches project needs (basic validation)
    if (project.scope?.skillRequirements && offering.skills) {
      const projectSkills = project.scope.skillRequirements.map(s => s.toLowerCase());
      const offeringSkills = offering.skills.map(s => s.toLowerCase());
      const hasMatchingSkill = projectSkills.some(ps => 
        offeringSkills.some(os => os.includes(ps) || ps.includes(os))
      );
      if (!hasMatchingSkill && project.scope.skillRequirements.length > 0) {
        // Warning but allow - user may want to propose anyway
        console.warn('Service offering skills may not fully match project requirements');
      }
    }
    
    // Pre-populate proposal data from offering
    const enrichedProposalData = {
      projectId: projectId,
      providerId: currentUser.id,
      serviceOfferingId: offeringId, // Link to service offering
      type: proposalData.type || offering.exchange_type === 'Cash' ? 'cash' : 'barter',
      serviceDescription: proposalData.serviceDescription || offering.description || offering.shortDescription,
      ...proposalData // Allow override of any fields
    };
    
    // If cash proposal, use offering pricing
    if (enrichedProposalData.type === 'cash' && !proposalData.cashDetails) {
      enrichedProposalData.cashDetails = {
        serviceDescription: enrichedProposalData.serviceDescription,
        total: proposalData.total || offering.price_min || 0,
        currency: offering.currency || 'SAR',
        pricing: proposalData.pricing || [],
        subtotal: proposalData.subtotal || offering.price_min || 0,
        taxes: proposalData.taxes || { vat: 0, other: 0 }
      };
    }
    
    // If barter proposal, use offering barter preferences
    if (enrichedProposalData.type === 'barter' && !proposalData.barterDetails) {
      enrichedProposalData.barterDetails = {
        servicesOffered: [{
          description: offering.title,
          value: offering.price_min || 0,
          timeline: offering.estimatedDuration || 'TBD'
        }],
        servicesRequested: proposalData.servicesRequested || [],
        totalOffered: offering.price_min || 0,
        totalRequested: 0,
        balance: offering.price_min || 0,
        cashComponent: 0
      };
    }
    
    // Add timeline from offering if available
    if (offering.estimatedDuration && !proposalData.timeline) {
      enrichedProposalData.timeline = {
        duration: offering.estimatedDuration,
        startDate: offering.availability?.start_date || null
      };
    }
    
    const proposal = PMTwinData.Proposals.create(enrichedProposalData);
    
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
    createProposalFromOffering,
    getProposals,
    updateProposalStatus
  };

})();


