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
   * Create contract from approved proposal
   * @param {string} proposalId - Proposal ID
   * @returns {Object} - Created contract or error
   */
  function createContractFromProposal(proposalId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals || !PMTwinData.Projects) {
      return { success: false, error: 'Data service not available' };
    }

    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    if (proposal.status !== 'approved') {
      return { success: false, error: 'Proposal must be approved to create contract' };
    }

    const project = PMTwinData.Projects.getById(proposal.projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Determine contract type
    const contractType = project.projectType === 'mega' 
      ? 'MEGA_PROJECT_CONTRACT' 
      : 'PROJECT_CONTRACT';

    // Get user type for provider
    let providerPartyType = 'VENDOR_CORPORATE';
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Users) {
      const providerUser = PMTwinData.Users.getById(proposal.providerId);
      if (providerUser) {
        // Use mapRoleToUserType if available
        if (typeof mapRoleToUserType === 'function') {
          const userType = mapRoleToUserType(providerUser.role, providerUser.userType);
          if (userType === 'vendor_corporate') {
            providerPartyType = 'VENDOR_CORPORATE';
          } else if (userType === 'vendor_individual') {
            providerPartyType = 'VENDOR_INDIVIDUAL';
          }
        }
      }
    }

    // Create contract data
    const contractData = {
      contractType: contractType,
      scopeType: project.projectType === 'mega' ? 'MEGA_PROJECT' : 'PROJECT',
      scopeId: project.id,
      buyerPartyId: project.creatorId,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: proposal.providerId,
      providerPartyType: providerPartyType,
      status: 'DRAFT', // Will be signed separately
      startDate: proposal.timeline?.startDate || new Date().toISOString(),
      endDate: proposal.timeline?.completionDate || null,
      termsJSON: {
        pricing: proposal.cashDetails || proposal.barterDetails || { amount: 0, currency: 'SAR' },
        paymentTerms: project.paymentTerms || 'milestone_based',
        deliverables: [],
        milestones: []
      },
      sourceProposalId: proposal.id
    };

    return createContract(contractData);
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

