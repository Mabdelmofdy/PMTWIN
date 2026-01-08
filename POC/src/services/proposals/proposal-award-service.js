/**
 * Proposal Award Service
 * Handles awarding proposals and creating Contracts + Engagements
 */

(function() {
  'use strict';

  // ============================================
  // Award Proposal
  // ============================================
  async function awardProposal(proposalId, companyId = null) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const ownerCompanyId = companyId || currentUser.id; // Users represent companies

    // Get proposal
    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    // Validate: only owner can award
    if (proposal.ownerCompanyId !== ownerCompanyId) {
      return { success: false, error: 'Only the opportunity owner can award proposals' };
    }

    // Validate: proposal status must be SHORTLISTED or NEGOTIATION
    if (proposal.status !== 'SHORTLISTED' && proposal.status !== 'NEGOTIATION') {
      return { success: false, error: `Cannot award proposal with status: ${proposal.status}. Must be SHORTLISTED or NEGOTIATION` };
    }

    // Get target opportunity
    let targetOpportunity = null;
    if (proposal.targetType === 'PROJECT' || proposal.targetType === 'MEGA_PROJECT') {
      targetOpportunity = PMTwinData.Projects.getById(proposal.targetId);
    } else if (proposal.targetType === 'SERVICE_REQUEST') {
      targetOpportunity = PMTwinData.ServiceRequests.getById(proposal.targetId);
    }

    if (!targetOpportunity) {
      return { success: false, error: 'Target opportunity not found' };
    }

    // Determine contract type based on proposal type and target type
    let contractType = null;
    let engagementType = null;
    let scopeType = proposal.targetType;
    let scopeId = proposal.targetId;

    if (proposal.proposalType === 'PROJECT_BID' && proposal.targetType === 'PROJECT') {
      contractType = 'PROJECT_CONTRACT';
      engagementType = 'PROJECT_EXECUTION';
    } else if (proposal.proposalType === 'PROJECT_BID' && proposal.targetType === 'MEGA_PROJECT') {
      contractType = 'MEGA_PROJECT_CONTRACT';
      engagementType = 'PROJECT_EXECUTION';
    } else if (proposal.proposalType === 'SERVICE_OFFER' && proposal.targetType === 'SERVICE_REQUEST') {
      contractType = 'SERVICE_CONTRACT';
      engagementType = 'SERVICE_DELIVERY';
      // Scope derived from ServiceRequest
      if (targetOpportunity.scopeType) {
        scopeType = targetOpportunity.scopeType;
        scopeId = targetOpportunity.scopeId;
      }
    } else if (proposal.proposalType === 'ADVISORY_OFFER') {
      contractType = 'ADVISORY_CONTRACT';
      engagementType = 'ADVISORY';
      // Scope can be PROJECT, MEGA_PROJECT, or SERVICE_REQUEST
      if (targetOpportunity.scopeType) {
        scopeType = targetOpportunity.scopeType;
        scopeId = targetOpportunity.scopeId;
      }
    } else {
      return { success: false, error: `Invalid proposal type and target type combination: ${proposal.proposalType} + ${proposal.targetType}` };
    }

    // Determine buyer and provider party types
    const buyerPartyCompanyId = proposal.ownerCompanyId;
    const providerPartyCompanyId = proposal.bidderCompanyId;

    // Get buyer user to determine type
    const buyerUser = PMTwinData.Users.getById(buyerPartyCompanyId);
    let buyerPartyType = 'BENEFICIARY';
    if (buyerUser) {
      const buyerUserType = buyerUser.userType || buyerUser.role;
      if (buyerUserType === 'vendor_corporate' || buyerUserType === 'vendor') {
        buyerPartyType = 'VENDOR_CORPORATE';
      } else if (buyerUserType === 'vendor_individual') {
        buyerPartyType = 'VENDOR_INDIVIDUAL';
      }
    }

    // Get provider user to determine type
    const providerUser = PMTwinData.Users.getById(providerPartyCompanyId);
    let providerPartyType = 'SERVICE_PROVIDER';
    if (providerUser) {
      const providerUserType = providerUser.userType || providerUser.role;
      if (providerUserType === 'vendor_corporate' || providerUserType === 'vendor') {
        providerPartyType = 'VENDOR_CORPORATE';
      } else if (providerUserType === 'vendor_individual') {
        providerPartyType = 'VENDOR_INDIVIDUAL';
      } else if (providerUserType === 'service_provider' || providerUserType === 'skill_service_provider') {
        providerPartyType = 'SERVICE_PROVIDER';
      } else if (providerUserType === 'consultant') {
        providerPartyType = 'CONSULTANT';
      } else if (providerUserType === 'sub_contractor') {
        providerPartyType = 'SUB_CONTRACTOR';
      }
    }

    // Create Contract
    const contractData = {
      contractType: contractType,
      scopeType: scopeType,
      scopeId: scopeId,
      buyerPartyId: buyerPartyCompanyId, // Contracts use buyerPartyId (users represent companies)
      buyerPartyType: buyerPartyType,
      providerPartyId: providerPartyCompanyId, // Contracts use providerPartyId (users represent companies)
      providerPartyType: providerPartyType,
      status: 'DRAFT', // Will be sent for signature
      startDate: proposal.timeline?.startDate || new Date().toISOString(),
      endDate: proposal.timeline?.endDate || null,
      termsJSON: {
        pricing: {
          amount: proposal.total || proposal.cashDetails?.total || 0,
          currency: proposal.currency || proposal.cashDetails?.currency || 'SAR'
        },
        paymentTerms: proposal.paymentTerms || 'milestone_based',
        deliverables: proposal.deliverables || [],
        milestones: proposal.milestones || [],
        timeline: proposal.timeline || {}
      },
      sourceProposalId: proposal.id
    };

    const contract = PMTwinData.Contracts.create(contractData);
    if (!contract) {
      return { success: false, error: 'Failed to create contract' };
    }

    // Create Engagement
    const engagementData = {
      contractId: contract.id,
      engagementType: engagementType,
      status: 'PLANNED', // Will be activated when contract is signed
      assignedScopeType: scopeType,
      assignedScopeId: scopeId
    };

    const engagement = PMTwinData.Engagements.create(engagementData);
    if (!engagement) {
      // Contract created but engagement failed - log warning but don't fail
      console.warn('Failed to create engagement for contract:', contract.id);
    }

    // Update proposal status to AWARDED
    const updatedProposal = PMTwinData.Proposals.update(proposalId, {
      status: 'AWARDED',
      awardedAt: new Date().toISOString(),
      contractId: contract.id
    });

    if (!updatedProposal) {
      console.warn('Failed to update proposal status to AWARDED');
    }

    return {
      success: true,
      contract: contract,
      engagement: engagement,
      proposal: updatedProposal || proposal
    };
  }

  // ============================================
  // Public API
  // ============================================
  window.ProposalAwardService = {
    awardProposal
  };

})();
