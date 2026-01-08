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
    
    // Get user role
    let userRole = currentUser.role;
    if (typeof PMTwinRBAC !== 'undefined') {
      userRole = await PMTwinRBAC.getCurrentUserRole();
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('create_proposals') ||
                           await PMTwinRBAC.canCurrentUserAccess('submit_proposals') ||
                           await PMTwinRBAC.canCurrentUserAccess('submit_proposals_to_vendors');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to create proposals' };
      }
    }
    
    // Validate proposal based on role
    if (typeof ProposalValidator !== 'undefined') {
      const project = proposalData.projectId ? PMTwinData.Projects.getById(proposalData.projectId) : null;
      const validation = await ProposalValidator.validateProposal(proposalData, project);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      // Use validated proposal data if returned
      if (validation.proposalData) {
        proposalData = validation.proposalData;
      }
    }
    
    // Set provider ID and proposal type
    proposalData.providerId = currentUser.id;
    
    // Set proposal type based on role
    if (!proposalData.proposalType) {
      if (userRole === 'sub_contractor') {
        proposalData.proposalType = 'sub_contractor_to_vendor';
      } else if (userRole === 'vendor' || userRole === 'service_provider') {
        proposalData.proposalType = 'vendor_to_entity';
      }
    }
    
    // Set scope type if not provided
    if (!proposalData.scopeType) {
      if (userRole === 'sub_contractor') {
        proposalData.scopeType = 'minor_scope';
      } else if (proposalData.subprojectId) {
        proposalData.scopeType = 'subproject';
      } else {
        proposalData.scopeType = 'full_project';
      }
    }
    
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
    
    // If approving, set approvedAt timestamp
    if (status === 'approved') {
      updates.approvedAt = new Date().toISOString();
    }
    
    const updated = PMTwinData.Proposals.update(proposalId, updates);
    if (updated) {
      // If proposal was approved, create contract
      if (status === 'approved' && typeof ContractService !== 'undefined') {
        const contractResult = ContractService.createContractFromProposal(proposalId);
        if (contractResult.success) {
          // Contract created successfully
          // Engagement will be created separately when contract is signed
          return { success: true, proposal: updated, contract: contractResult.contract };
        } else {
          // Log error but don't fail the proposal approval
          console.warn('Failed to create contract from proposal:', contractResult.error);
        }
      }
      
      return { success: true, proposal: updated };
    }
    
    return { success: false, error: 'Failed to update proposal' };
  }

  // ============================================
  // Create Sub_Contractor Proposal to Vendor
  // ============================================
  async function createSubContractorProposal(vendorId, proposalData) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Get user role
    let userRole = currentUser.role;
    if (typeof PMTwinRBAC !== 'undefined') {
      userRole = await PMTwinRBAC.getCurrentUserRole();
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('submit_proposals_to_vendors');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to submit proposals to vendors' };
      }
    }
    
    if (userRole !== 'sub_contractor') {
      return { success: false, error: 'Only sub_contractors can submit proposals to vendors' };
    }
    
    // Validate vendor exists
    const vendor = PMTwinData.Users.getById(vendorId);
    if (!vendor) {
      return { success: false, error: 'Vendor not found' };
    }
    
    // Set proposal data
    proposalData.vendorId = vendorId;
    proposalData.providerId = currentUser.id;
    proposalData.proposalType = 'sub_contractor_to_vendor';
    proposalData.scopeType = 'minor_scope';
    
    // Validate proposal
    if (typeof ProposalValidator !== 'undefined') {
      const validation = await ProposalValidator.validateSubContractorProposal(proposalData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      if (validation.proposalData) {
        proposalData = validation.proposalData;
      }
    }
    
    const proposal = PMTwinData.Proposals.create(proposalData);
    
    if (proposal) {
      return { success: true, proposal: proposal };
    }
    
    return { success: false, error: 'Failed to create proposal' };
  }

  // ============================================
  // Get Vendor Sub_Contractors
  // ============================================
  async function getVendorSubContractors(vendorId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('manage_sub_contractors');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to manage sub_contractors' };
      }
    }
    
    // Get relationships
    const relationships = PMTwinData.VendorSubContractorRelationships?.getByVendor?.(vendorId) || [];
    
    // Get sub_contractor details
    const subContractors = relationships.map(rel => {
      const subContractor = PMTwinData.Users.getById(rel.subContractorId);
      return {
        ...rel,
        subContractor: subContractor
      };
    }).filter(item => item.subContractor);
    
    return { success: true, subContractors: subContractors };
  }

  // ============================================
  // Link Sub_Contractor to Vendor
  // ============================================
  async function linkSubContractorToVendor(vendorId, subContractorId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('manage_sub_contractors');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to manage sub_contractors' };
      }
    }
    
    // Verify vendor
    const vendor = PMTwinData.Users.getById(vendorId);
    if (!vendor) {
      return { success: false, error: 'Vendor not found' };
    }
    
    // Verify sub_contractor
    const subContractor = PMTwinData.Users.getById(subContractorId);
    if (!subContractor) {
      return { success: false, error: 'Sub_contractor not found' };
    }
    
    // Create relationship
    const relationship = {
      id: `relationship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vendorId: vendorId,
      subContractorId: subContractorId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      approvedAt: null
    };
    
    if (PMTwinData.VendorSubContractorRelationships?.create) {
      const created = PMTwinData.VendorSubContractorRelationships.create(relationship);
      if (created) {
        return { success: true, relationship: created };
      }
    } else {
      // Fallback: store in localStorage if data model not available
      const key = 'pmtwin_vendor_subcontractor_relationships';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(relationship);
      localStorage.setItem(key, JSON.stringify(existing));
      return { success: true, relationship: relationship };
    }
    
    return { success: false, error: 'Failed to create relationship' };
  }

  // ============================================
  // Validate Vendor Proposal Scope
  // ============================================
  async function validateVendorProposalScope(proposalData, project) {
    if (typeof ProposalValidator === 'undefined') {
      return { valid: true }; // Skip validation if validator not available
    }
    
    return await ProposalValidator.validateVendorProposalScope(proposalData, project);
  }

  window.ProposalService = {
    createProposal,
    createProposalFromOffering,
    createSubContractorProposal,
    getProposals,
    updateProposalStatus,
    getVendorSubContractors,
    linkSubContractorToVendor,
    validateVendorProposalScope
  };

})();


