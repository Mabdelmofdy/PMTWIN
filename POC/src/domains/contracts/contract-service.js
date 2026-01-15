/**
 * Contract Service
 * Business logic for Contract management
 */

(function() {
  'use strict';

  /**
   * Create contract
   * @param {Object} contractData - Contract data
   * @returns {Object} - Created contract or error
   */
  function createContract(contractData) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      return { success: false, error: 'Data service not available' };
    }

    // Get current user
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Set createdBy
    contractData.createdBy = currentUser.id;

    // Validate
    if (typeof ContractValidator !== 'undefined') {
      const validation = ContractValidator.validateContractCreation(contractData);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    // Create contract
    const contract = PMTwinData.Contracts.create(contractData);
    if (contract) {
      return { success: true, contract: contract };
    }

    return { success: false, error: 'Failed to create contract' };
  }

  /**
   * Get contract by ID
   * @param {string} id - Contract ID
   * @returns {Object} - Contract or null
   */
  function getContract(id) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      return null;
    }

    return PMTwinData.Contracts.getById(id);
  }

  /**
   * Get contracts by scope
   * @param {string} scopeType - Scope type (PROJECT, MEGA_PROJECT, SUB_PROJECT, SERVICE_REQUEST)
   * @param {string} scopeId - Scope ID
   * @returns {Array} - Array of contracts
   */
  function getContractsByScope(scopeType, scopeId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      return [];
    }

    return PMTwinData.Contracts.getByScope(scopeType, scopeId);
  }

  /**
   * Get contracts by party
   * @param {string} partyId - Party ID (buyer or provider)
   * @param {string} partyType - Optional: 'buyer' or 'provider'
   * @returns {Array} - Array of contracts
   */
  function getContractsByParty(partyId, partyType = null) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      return [];
    }

    if (partyType === 'buyer') {
      return PMTwinData.Contracts.getByBuyer(partyId);
    } else if (partyType === 'provider') {
      return PMTwinData.Contracts.getByProvider(partyId);
    } else {
      // Get all contracts where party is buyer or provider
      return PMTwinData.Contracts.getByParty(partyId);
    }
  }

  /**
   * Get sub-contracts for a vendor contract
   * @param {string} parentContractId - Parent contract ID
   * @returns {Array} - Array of sub-contracts
   */
  function getSubContracts(parentContractId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      return [];
    }

    return PMTwinData.Contracts.getSubContracts(parentContractId);
  }

  /**
   * Sign contract
   * @param {string} contractId - Contract ID
   * @param {string} signerId - User ID of signer (optional, uses current user if not provided)
   * @returns {Object} - Signed contract or error
   */
  function signContract(contractId, signerId = null) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      return { success: false, error: 'Data service not available' };
    }

    // Get current user if signerId not provided
    if (!signerId) {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }
      signerId = currentUser.id;
    }

    // Validate signing
    if (typeof ContractValidator !== 'undefined') {
      const validation = ContractValidator.validateContractSigning(contractId, signerId);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    // Update contract status to SIGNED
    const contract = PMTwinData.Contracts.update(contractId, {
      status: 'SIGNED',
      signedAt: new Date().toISOString(),
      signedBy: signerId
    });

    if (contract) {
      return { success: true, contract: contract };
    }

    return { success: false, error: 'Failed to sign contract' };
  }

  /**
   * Update contract status
   * @param {string} contractId - Contract ID
   * @param {string} status - New status
   * @returns {Object} - Updated contract or error
   */
  function updateContractStatus(contractId, status) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      return { success: false, error: 'Data service not available' };
    }

    const contract = PMTwinData.Contracts.getById(contractId);
    if (!contract) {
      return { success: false, error: 'Contract not found' };
    }

    // Validate status transition
    if (typeof ContractValidator !== 'undefined') {
      const validation = ContractValidator.validateContractStatusUpdate(contract.status, status);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    // Update contract
    const updated = PMTwinData.Contracts.update(contractId, { status: status });
    if (updated) {
      return { success: true, contract: updated };
    }

    return { success: false, error: 'Failed to update contract status' };
  }

  /**
   * Terminate contract
   * @param {string} contractId - Contract ID
   * @param {string} reason - Termination reason
   * @returns {Object} - Terminated contract or error
   */
  function terminateContract(contractId, reason) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      return { success: false, error: 'Data service not available' };
    }

    const contract = PMTwinData.Contracts.getById(contractId);
    if (!contract) {
      return { success: false, error: 'Contract not found' };
    }

    // Validate status transition
    if (typeof ContractValidator !== 'undefined') {
      const validation = ContractValidator.validateContractStatusUpdate(contract.status, 'TERMINATED');
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    // Update contract
    const updated = PMTwinData.Contracts.update(contractId, {
      status: 'TERMINATED',
      termsJSON: {
        ...contract.termsJSON,
        terminationReason: reason,
        terminatedAt: new Date().toISOString()
      }
    });

    if (updated) {
      return { success: true, contract: updated };
    }

    return { success: false, error: 'Failed to terminate contract' };
  }

  /**
   * Create contract from approved proposal (using specific version)
   * @param {string} proposalId - Proposal ID
   * @param {number} version - Optional version number (defaults to mutually accepted version)
   * @returns {Object} - Created contract or error
   */
  function createContractFromProposal(proposalId, version = null) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals) {
      return { success: false, error: 'Data service not available' };
    }

    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    // Validate proposal is FINAL_ACCEPTED before generating contract
    // Map legacy AWARDED status to FINAL_ACCEPTED for backward compatibility
    const isFinalAccepted = proposal.status === 'FINAL_ACCEPTED' || proposal.status === 'AWARDED';
    if (!isFinalAccepted) {
      return { success: false, error: `Proposal must be FINAL_ACCEPTED to create contract (current status: ${proposal.status})` };
    }
    
    // Ensure both parties have accepted (mutuallyAcceptedVersion is set)
    if (!proposal.acceptance?.mutuallyAcceptedVersion && 
        !(proposal.acceptance?.ownerAcceptedVersion && proposal.acceptance?.otherPartyAcceptedVersion &&
          proposal.acceptance.ownerAcceptedVersion === proposal.acceptance.otherPartyAcceptedVersion)) {
      return { success: false, error: 'Proposal must have both parties accepted the same version to create contract' };
    }

    // Determine which version to use
    let versionToUse = version;
    if (!versionToUse) {
      // Use mutually accepted version if available
      if (proposal.acceptance && proposal.acceptance.mutuallyAcceptedVersion) {
        versionToUse = proposal.acceptance.mutuallyAcceptedVersion;
      } else {
        // Fallback to current version
        versionToUse = proposal.currentVersion || proposal.version || 1;
      }
    }

    // Get version data
    const versionData = PMTwinData.Proposals.getVersion ? 
      PMTwinData.Proposals.getVersion(proposalId, versionToUse) : null;
    
    if (!versionData && proposal.versions && proposal.versions.length > 0) {
      versionData = proposal.versions.find(v => v.version === versionToUse);
    }

    const proposalData = versionData?.proposalData || proposal;
    const generatedFromProposalVersionId = `${proposalId}_v${versionToUse}`;

    // IMPORTANT: Get payment terms from version first (not opportunity's preferredPaymentTerms)
    let paymentTerms = null;
    if (versionData?.paymentTerms) {
      // Use version-level paymentTerms (new structure)
      paymentTerms = versionData.paymentTerms;
    } else if (versionData?.proposalData?.paymentTerms) {
      // Fallback to proposalData.paymentTerms (legacy structure)
      paymentTerms = versionData.proposalData.paymentTerms;
    }

    // Get opportunity
    const opportunityId = proposal.opportunityId || proposal.targetId || proposal.projectId;
    let opportunity = null;
    if (PMTwinData.Opportunities && opportunityId) {
      opportunity = PMTwinData.Opportunities.getById(opportunityId);
    }
    
    // Fallback to Projects for backward compatibility
    if (!opportunity && PMTwinData.Projects && opportunityId) {
      const project = PMTwinData.Projects.getById(opportunityId);
      if (project) {
        opportunity = {
          id: project.id,
          paymentTerms: { mode: 'CASH' },
          serviceItems: []
        };
      }
    }

    // Check if this is a multi-party scenario (SPV, JV, Consortium)
    if (opportunity) {
      const modelType = opportunity.subModel || opportunity.modelType || opportunity.modelId;
      
      // Multi-party models: 1.2 (Consortium), 1.3 (JV), 1.4 (SPV)
      if (modelType === '1.2' || modelType === '1.3' || modelType === '1.4') {
        if (typeof MultiPartyContractService !== 'undefined') {
          // Use multi-party contract service
          if (modelType === '1.4') {
            return MultiPartyContractService.generateSPVContract(proposalId, versionToUse);
          } else if (modelType === '1.3') {
            return MultiPartyContractService.generateJVContract(proposalId, versionToUse);
          } else if (modelType === '1.2') {
            return MultiPartyContractService.generateConsortiumContract(proposalId, versionToUse);
          }
        }
      }
    }

    // Single-party contract
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }

    // Extract servicesSchedule from proposal version
    let servicesSchedule = [];
    if (proposalData.serviceItems && Array.isArray(proposalData.serviceItems)) {
      servicesSchedule = proposalData.serviceItems.map((item, index) => ({
        serviceItemId: item.id || `item_${index}`,
        name: item.name || item.serviceName || '',
        qty: item.qty || item.quantity || 1,
        unitPrice: item.unitPriceRef || item.unitPrice || 0,
        total: item.totalRef || item.total || 0,
        deliveryDate: item.deliveryDate || null
      }));
    } else if (proposalData.servicesOffered && Array.isArray(proposalData.servicesOffered)) {
      // Legacy format
      servicesSchedule = proposalData.servicesOffered.map((item, index) => ({
        serviceItemId: item.id || `item_${index}`,
        name: item.name || item.serviceName || '',
        qty: item.qty || item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        total: item.total || 0,
        deliveryDate: null
      }));
    }

    // IMPORTANT: Contract paymentTerms MUST come from the accepted proposal version
    // Only fallback to opportunity's preferredPaymentTerms if no version paymentTerms found
    if (!paymentTerms && opportunity) {
      // Fallback: use opportunity's preferredPaymentTerms (new) or paymentTerms (legacy)
      // This should rarely happen if proposal was created correctly
      console.warn(`No paymentTerms found in proposal version ${versionToUse}, falling back to opportunity preferredPaymentTerms`);
      paymentTerms = opportunity.preferredPaymentTerms || opportunity.paymentTerms || {
        mode: 'CASH',
        barterRule: null,
        cashSettlement: 0,
        acknowledgedDifference: false
      };
    } else if (!paymentTerms) {
      // Last resort: default payment terms
      paymentTerms = {
        mode: 'CASH',
        barterRule: null,
        cashSettlement: 0,
        acknowledgedDifference: false
      };
    }

    // Determine contract type
    const isMegaProject = opportunity.subModel === '1.4' || 
                         opportunity.subModel === '1.2' || 
                         opportunity.subModel === '1.3' ||
                         opportunity.model === '1' && (opportunity.subModel === '1.4' || opportunity.subModel === '1.2' || opportunity.subModel === '1.3');
    
    let contractType = 'PROJECT_CONTRACT';
    if (isMegaProject) {
      if (opportunity.subModel === '1.4') {
        contractType = 'SPV_CONTRACT';
      } else if (opportunity.subModel === '1.3') {
        contractType = 'JV_CONTRACT';
      } else if (opportunity.subModel === '1.2') {
        contractType = 'CONSORTIUM_CONTRACT';
      } else {
        contractType = 'MEGA_PROJECT_CONTRACT';
      }
    } else {
      contractType = 'PROJECT_CONTRACT';
    }

    // Get user type for provider
    let providerPartyType = 'VENDOR_CORPORATE';
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Users) {
      const providerUser = PMTwinData.Users.getById(proposal.providerId || proposal.bidderCompanyId);
      if (providerUser) {
        const userType = providerUser.userType || providerUser.role;
        if (userType === 'vendor_corporate' || userType === 'vendor') {
          providerPartyType = 'VENDOR_CORPORATE';
        } else if (userType === 'vendor_individual') {
          providerPartyType = 'VENDOR_INDIVIDUAL';
        }
      }
    }

    // Calculate total value from servicesSchedule
    const totalValue = servicesSchedule.reduce((sum, item) => sum + (item.total || 0), 0);

    // Create contract data
    const contractData = {
      contractType: contractType,
      scopeType: isMegaProject ? 'MEGA_PROJECT' : 'OPPORTUNITY',
      scopeId: opportunityId,
      opportunityId: opportunityId,
      generatedFromProposalVersionId: generatedFromProposalVersionId,
      proposalId: proposalId,
      buyerPartyId: opportunity.createdBy || opportunity.creatorId,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: proposal.providerId || proposal.bidderCompanyId,
      providerPartyType: providerPartyType,
      status: 'DRAFT', // Will be signed separately
      startDate: proposalData.timeline?.startDate || new Date().toISOString(),
      endDate: proposalData.timeline?.endDate || proposalData.timeline?.completionDate || null,
      servicesSchedule: servicesSchedule,
      paymentTerms: paymentTerms,
      termsJSON: {
        pricing: { 
          amount: totalValue, 
          currency: proposalData.currency || 'SAR' 
        },
        paymentTerms: paymentTerms.mode === 'CASH' ? 'milestone_based' : paymentTerms.mode.toLowerCase(),
        deliverables: proposalData.deliverables || [],
        milestones: proposalData.milestones || []
      },
      sourceProposalId: proposal.id
    };

    return createContract(contractData);
  }

  /**
   * Helper: Get opportunity from proposal
   * @param {Object} proposal - Proposal object
   * @returns {Object|null} - Opportunity or null
   */
  function getOpportunityFromProposal(proposal) {
    if (!proposal) return null;
    
    // Try Opportunities first
    const opportunityId = proposal.opportunityId || proposal.targetId || proposal.projectId;
    if (opportunityId && PMTwinData.Opportunities) {
      const opportunity = PMTwinData.Opportunities.getById(opportunityId);
      if (opportunity) return opportunity;
    }
    
    // Fallback to Projects for backward compatibility
    if (opportunityId && PMTwinData.Projects) {
      const project = PMTwinData.Projects.getById(opportunityId);
      if (project) {
        // Convert project to opportunity-like structure
        return {
          id: project.id,
          subModel: project.projectType === 'mega' ? '1.4' : '1.1',
          modelType: project.projectType === 'mega' ? '1.4' : '1.1',
          paymentTerms: { mode: 'CASH' },
          serviceItems: [],
          createdBy: project.ownerCompanyId || project.creatorId,
          ...project
        };
      }
    }
    
    return null;

    // Try collaboration opportunity
    if (proposal.targetId && proposal.targetType) {
      if (proposal.targetType === 'PROJECT' || proposal.targetType === 'MEGA_PROJECT') {
        return PMTwinData.Projects?.getById(proposal.targetId) || null;
      }
    }

    // Try projectId (backward compatibility)
    if (proposal.projectId) {
      return PMTwinData.Projects?.getById(proposal.projectId) || null;
    }

    return null;
  }

  /**
   * Create contract from accepted service offer
   * @param {string} serviceOfferId - Service offer ID
   * @returns {Object} - Created contract or error
   */
  function createContractFromServiceOffer(serviceOfferId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceOffers || !PMTwinData.ServiceRequests) {
      return { success: false, error: 'Data service not available' };
    }

    const serviceOffer = PMTwinData.ServiceOffers.getById(serviceOfferId);
    if (!serviceOffer) {
      return { success: false, error: 'Service offer not found' };
    }

    if (serviceOffer.status !== 'ACCEPTED') {
      return { success: false, error: 'Service offer must be ACCEPTED to create contract' };
    }

    const serviceRequest = PMTwinData.ServiceRequests.getById(serviceOffer.serviceRequestId);
    if (!serviceRequest) {
      return { success: false, error: 'Service request not found' };
    }

    // Determine buyer party type
    let buyerPartyType = 'BENEFICIARY';
    if (serviceRequest.requesterType === 'VENDOR') {
      buyerPartyType = 'VENDOR_CORPORATE'; // Default to corporate, can be refined
    }

    // Create contract data
    const contractData = {
      contractType: 'SERVICE_CONTRACT',
      scopeType: 'SERVICE_REQUEST',
      scopeId: serviceRequest.id,
      buyerPartyId: serviceRequest.requesterId,
      buyerPartyType: buyerPartyType,
      providerPartyId: serviceOffer.serviceProviderUserId,
      providerPartyType: 'SERVICE_PROVIDER',
      status: 'DRAFT', // Will be signed separately
      startDate: new Date().toISOString(),
      endDate: serviceRequest.requiredBy || null,
      termsJSON: {
        pricing: serviceOffer.proposedPricing || { amount: 0, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: [],
        milestones: []
      },
      sourceServiceOfferId: serviceOffer.id
    };

    return createContract(contractData);
  }

  // Export
  window.ContractService = {
    createContract,
    getContract,
    getContractsByScope,
    getContractsByParty,
    getSubContracts,
    signContract,
    updateContractStatus,
    terminateContract,
    createContractFromProposal,
    createContractFromServiceOffer
  };

})();

