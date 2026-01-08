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
    
    // Set provider ID and bidder company ID
    proposalData.providerId = currentUser.id;
    proposalData.bidderCompanyId = currentUser.id; // Users represent companies
    
    // Determine target opportunity and validate role constraints
    let targetOpportunity = null;
    let targetType = proposalData.targetType;
    let targetId = proposalData.targetId;
    
    // Backward compatibility: use projectId if targetId not provided
    if (!targetId && proposalData.projectId) {
      targetId = proposalData.projectId;
      targetType = 'PROJECT';
      const project = PMTwinData.Projects.getById(targetId);
      if (project && project.projectType === 'mega') {
        targetType = 'MEGA_PROJECT';
      }
      targetOpportunity = project;
    } else if (targetId && targetType === 'PROJECT') {
      targetOpportunity = PMTwinData.Projects.getById(targetId);
    } else if (targetId && targetType === 'MEGA_PROJECT') {
      targetOpportunity = PMTwinData.Projects.getById(targetId);
    } else if (targetId && targetType === 'SERVICE_REQUEST') {
      targetOpportunity = PMTwinData.ServiceRequests.getById(targetId);
    }
    
    // Validate role constraints
    if (userRole === 'skill_service_provider' || userRole === 'service_provider') {
      // Service Provider: can only propose to SERVICE_REQUEST
      if (targetType !== 'SERVICE_REQUEST') {
        return { success: false, error: 'Service Providers can only submit proposals to Service Requests, not Projects or Mega-Projects' };
      }
      if (!proposalData.proposalType) {
        proposalData.proposalType = 'SERVICE_OFFER';
      }
    } else if (userRole === 'vendor' || userRole === 'project_lead' || userRole === 'service_provider') {
      // Vendor: can only propose to PROJECT/MEGA_PROJECT
      if (targetType !== 'PROJECT' && targetType !== 'MEGA_PROJECT') {
        return { success: false, error: 'Vendors can only submit proposals to Projects or Mega-Projects' };
      }
      if (!proposalData.proposalType) {
        proposalData.proposalType = 'PROJECT_BID';
      }
    } else if (userRole === 'consultant') {
      // Consultant: can only propose to ADVISORY_REQUEST or SERVICE_REQUEST (requestType=ADVISORY)
      if (targetType === 'SERVICE_REQUEST' && targetOpportunity) {
        if (targetOpportunity.requestType !== 'ADVISORY' && targetOpportunity.requestType !== 'advisory') {
          return { success: false, error: 'Consultants can only submit proposals to Advisory requests' };
        }
      } else if (targetType !== 'ADVISORY_REQUEST') {
        return { success: false, error: 'Consultants can only submit proposals to Advisory requests' };
      }
      if (!proposalData.proposalType) {
        proposalData.proposalType = 'ADVISORY_OFFER';
      }
    } else if (userRole === 'beneficiary' || userRole === 'entity') {
      return { success: false, error: 'Beneficiaries cannot submit proposals. They only receive proposals.' };
    }
    
    // Validate: bidderCompanyId must not equal ownerCompanyId
    if (targetOpportunity) {
      const ownerCompanyId = targetOpportunity.ownerCompanyId || targetOpportunity.creatorId || targetOpportunity.requesterId;
      if (proposalData.bidderCompanyId === ownerCompanyId) {
        return { success: false, error: 'Cannot submit proposal to your own opportunity' };
      }
      proposalData.ownerCompanyId = ownerCompanyId;
    }
    
    // Set targetType and targetId
    proposalData.targetType = targetType;
    proposalData.targetId = targetId;
    
    // Set scope type if not provided (backward compatibility)
    if (!proposalData.scopeType) {
      if (userRole === 'sub_contractor') {
        proposalData.scopeType = 'minor_scope';
      } else if (proposalData.subprojectId) {
        proposalData.scopeType = 'subproject';
      } else {
        proposalData.scopeType = 'full_project';
      }
    }
    
    // Set status (default to SUBMITTED, allow DRAFT)
    if (!proposalData.status) {
      proposalData.status = 'SUBMITTED';
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
        // Use new model: get by bidderCompanyId
        proposals = PMTwinData.Proposals.getByBidderCompany(currentUser.id);
      } else if (canViewReceived) {
        // Use new model: get by ownerCompanyId
        proposals = PMTwinData.Proposals.getByOwnerCompany(currentUser.id);
      }
    } else {
      // Fallback: use new model
      proposals = PMTwinData.Proposals.getByBidderCompany(currentUser.id);
    }
    
    // Apply filters
    if (filters.status) {
      proposals = proposals.filter(p => p.status === filters.status);
    }
    if (filters.projectId) {
      proposals = proposals.filter(p => p.projectId === filters.projectId || p.targetId === filters.projectId);
    }
    if (filters.targetType) {
      proposals = proposals.filter(p => p.targetType === filters.targetType);
    }
    
    return { success: true, proposals: proposals };
  }

  // ============================================
  // Get My Proposals (submitted by current company)
  // ============================================
  async function getMyProposals(companyId = null) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const bidderCompanyId = companyId || currentUser.id; // Users represent companies
    const proposals = PMTwinData.Proposals.getByBidderCompany(bidderCompanyId);
    
    return { success: true, proposals: proposals };
  }

  // ============================================
  // Get Incoming Proposals (for Beneficiary)
  // ============================================
  async function getIncomingProposals(companyId = null) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check if user is Beneficiary
    const userRole = currentUser.role || currentUser.userType;
    if (userRole !== 'beneficiary' && userRole !== 'entity' && userRole !== 'project_lead') {
      return { success: false, error: 'Only Beneficiaries can view incoming proposals' };
    }
    
    const ownerCompanyId = companyId || currentUser.id; // Users represent companies
    const proposals = PMTwinData.Proposals.getByOwnerCompany(ownerCompanyId);
    
    return { success: true, proposals: proposals };
  }

  // ============================================
  // Update Proposal Status (Role-aware)
  // ============================================
  async function updateProposalStatus(proposalId, status, companyId = null, reason = null) {
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
      
      // Check if user owns the opportunity (using ownerCompanyId)
      const ownerCompanyId = proposal.ownerCompanyId;
      if (ownerCompanyId && ownerCompanyId !== currentUser.id && !canApprove) {
        return { success: false, error: 'You can only approve/reject proposals for your own opportunities' };
      }
      
      // Backward compatibility: check project creatorId
      if (!ownerCompanyId && proposal.projectId) {
        const project = PMTwinData.Projects.getById(proposal.projectId);
        if (project && project.creatorId !== currentUser.id && project.ownerCompanyId !== currentUser.id && !canApprove) {
          return { success: false, error: 'You can only approve/reject proposals for your own projects' };
        }
      }
    // Normalize status to uppercase
    status = status.toUpperCase();
    
    // Get company IDs
    const ownerCompanyId = proposal.ownerCompanyId;
    const bidderCompanyId = proposal.bidderCompanyId || proposal.providerId;
    const currentCompanyId = companyId || currentUser.id; // Users represent companies
    
    // Determine who is making the change
    const isOwner = ownerCompanyId === currentCompanyId;
    const isBidder = bidderCompanyId === currentCompanyId;
    
    if (!isOwner && !isBidder) {
      return { success: false, error: 'You can only update proposals you own or submitted' };
    }
    
    // Owner can: UNDER_REVIEW, SHORTLISTED, NEGOTIATION, AWARDED, REJECTED
    if (isOwner) {
      const ownerAllowedStatuses = ['UNDER_REVIEW', 'SHORTLISTED', 'NEGOTIATION', 'AWARDED', 'REJECTED'];
      if (!ownerAllowedStatuses.includes(status)) {
        return { success: false, error: `Owner cannot set status to: ${status}. Allowed: ${ownerAllowedStatuses.join(', ')}` };
      }
    }
    
    // Bidder can: WITHDRAW (only if status allows)
    if (isBidder && status === 'WITHDRAWN') {
      const allowedStatuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'];
      if (!allowedStatuses.includes(proposal.status)) {
        return { success: false, error: `Cannot withdraw proposal with status: ${proposal.status}` };
      }
    } else if (isBidder && status !== 'WITHDRAWN') {
      return { success: false, error: 'Bidders can only withdraw proposals, not change status to: ' + status };
    }
    
    const updates = { status: status };
    if (reason) {
      updates.rejectionReason = reason;
    }
    
    // Set timestamps for status changes
    if (status === 'AWARDED') {
      updates.awardedAt = new Date().toISOString();
    } else if (status === 'REJECTED') {
      updates.rejectedAt = new Date().toISOString();
    } else if (status === 'WITHDRAWN') {
      updates.withdrawnAt = new Date().toISOString();
    }
    
    const updated = PMTwinData.Proposals.update(proposalId, updates);
    if (updated) {
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
    getMyProposals,
    getIncomingProposals,
    updateProposalStatus,
    getVendorSubContractors,
    linkSubContractorToVendor,
    validateVendorProposalScope
  };

})();


