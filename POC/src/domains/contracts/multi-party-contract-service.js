/**
 * Multi-Party Contract Service
 * Handles contract generation for SPV, Joint Venture, and Consortium scenarios
 * Supports multiple parties, governance structures, roles, shares, and risk allocation
 */

(function() {
  'use strict';

  /**
   * Create multi-party contract
   * @param {string} proposalId - Accepted proposal ID
   * @param {Array} parties - Array of party objects { partyId: string, partyType: string, role: string, share: number }
   * @param {Object} options - Additional options { contractType: string, governanceStructure: Object }
   * @returns {Object} - Result { success: boolean, contract: Object, error: string }
   */
  function createMultiPartyContract(proposalId, parties, options = {}) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals || !PMTwinData.Contracts) {
      return { success: false, error: 'Data service not available' };
    }

    // Get proposal
    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    // Validate parties
    if (!Array.isArray(parties) || parties.length < 2) {
      return { success: false, error: 'Multi-party contract requires at least 2 parties' };
    }

    // Validate shares sum to 100%
    const totalShare = parties.reduce((sum, party) => sum + (party.share || 0), 0);
    if (Math.abs(totalShare - 100) > 0.01) {
      return { success: false, error: `Party shares must sum to 100% (current: ${totalShare}%)` };
    }

    // Determine contract type from proposal or options
    const contractType = options.contractType || determineContractTypeFromProposal(proposal);
    
    // Get opportunity/project details
    const opportunity = getOpportunityFromProposal(proposal);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found for proposal' };
    }

    // Generate governance structure
    const governanceStructure = options.governanceStructure || generateGovernanceStructure(parties, contractType, opportunity);

    // Generate contract terms
    const contractTerms = generateMultiPartyContractTerms(proposal, parties, governanceStructure, contractType);

    // Create contract data
    const contractData = {
      contractType: contractType,
      scopeType: opportunity.projectType === 'mega' ? 'MEGA_PROJECT' : 'PROJECT',
      scopeId: opportunity.id || proposal.targetId,
      // Multi-party fields
      isMultiParty: true,
      parties: parties.map(p => ({
        partyId: p.partyId,
        partyType: p.partyType,
        role: p.role,
        share: p.share,
        consentStatus: 'PENDING', // PENDING, CONSENTED, REJECTED
        consentedAt: null
      })),
      governanceStructure: governanceStructure,
      // Standard fields
      status: 'DRAFT',
      startDate: proposal.timeline?.startDate || new Date().toISOString(),
      endDate: proposal.timeline?.completionDate || null,
      termsJSON: contractTerms,
      sourceProposalId: proposalId,
      createdAt: new Date().toISOString()
    };

    // Create contract
    const contract = PMTwinData.Contracts.create(contractData);

    if (contract) {
      return {
        success: true,
        contract: contract,
        requiresConsent: true // Multi-party contracts require all parties to consent
      };
    }

    return { success: false, error: 'Failed to create multi-party contract' };
  }

  /**
   * Generate SPV contract
   * @param {string} proposalId - Accepted proposal ID
   * @returns {Object} - Result { success: boolean, contract: Object, error: string }
   */
  function generateSPVContract(proposalId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals) {
      return { success: false, error: 'Data service not available' };
    }

    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    const opportunity = getOpportunityFromProposal(proposal);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }

    // Validate SPV requirements (50M+ SAR)
    const projectValue = opportunity.attributes?.spvValue || opportunity.attributes?.projectValue || 0;
    if (projectValue < 50000000) {
      return { success: false, error: 'SPV contracts require project value of 50M+ SAR' };
    }

    // Extract parties from opportunity (applications or direct parties)
    const parties = extractPartiesFromOpportunity(opportunity, proposal);

    if (parties.length < 2) {
      return { success: false, error: 'SPV requires at least 2 parties' };
    }

    // Generate SPV-specific governance
    const governanceStructure = {
      entityType: 'SPV',
      legalStructure: 'Limited Liability Company',
      riskIsolation: true,
      equityStructure: generateEquityStructure(parties),
      debtFinancing: opportunity.attributes?.debtFinancing || null,
      regulatoryCompliance: {
        registration: 'Required',
        licenses: opportunity.attributes?.requiredLicenses || []
      },
      management: {
        boardStructure: generateBoardStructure(parties),
        decisionMaking: 'Majority vote based on equity share',
        quorum: Math.ceil(parties.length / 2) + 1
      }
    };

    return createMultiPartyContract(proposalId, parties, {
      contractType: 'SPV_CONTRACT',
      governanceStructure: governanceStructure
    });
  }

  /**
   * Generate Joint Venture contract
   * @param {string} proposalId - Accepted proposal ID
   * @returns {Object} - Result { success: boolean, contract: Object, error: string }
   */
  function generateJVContract(proposalId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals) {
      return { success: false, error: 'Data service not available' };
    }

    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    const opportunity = getOpportunityFromProposal(proposal);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }

    // Extract parties
    const parties = extractPartiesFromOpportunity(opportunity, proposal);

    if (parties.length < 2) {
      return { success: false, error: 'Joint Venture requires at least 2 parties' };
    }

    // Get JV structure from opportunity
    const jvStructure = opportunity.attributes?.jvStructure || '50-50';
    const managementStructure = opportunity.attributes?.managementStructure || 'shared';

    // Generate JV-specific governance
    const governanceStructure = {
      entityType: 'JOINT_VENTURE',
      jvStructure: jvStructure,
      managementStructure: managementStructure,
      equityStructure: generateEquityStructure(parties, jvStructure),
      profitDistribution: generateProfitDistribution(parties),
      management: {
        structure: managementStructure,
        leadPartner: managementStructure === 'lead' ? parties[0].partyId : null,
        decisionMaking: managementStructure === 'shared' ? 'Consensus' : 'Lead partner with consultation',
        roles: assignJVRoles(parties, managementStructure)
      },
      exitStrategy: opportunity.attributes?.exitStrategy || {
        buyout: 'Available after 2 years',
        dissolution: 'Mutual agreement or project completion'
      }
    };

    return createMultiPartyContract(proposalId, parties, {
      contractType: 'JV_CONTRACT',
      governanceStructure: governanceStructure
    });
  }

  /**
   * Generate Consortium contract
   * @param {string} proposalId - Accepted proposal ID
   * @returns {Object} - Result { success: boolean, contract: Object, error: string }
   */
  function generateConsortiumContract(proposalId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals) {
      return { success: false, error: 'Data service not available' };
    }

    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    const opportunity = getOpportunityFromProposal(proposal);
    if (!opportunity) {
      return { success: false, error: 'Opportunity not found' };
    }

    // Extract parties
    const parties = extractPartiesFromOpportunity(opportunity, proposal);

    if (parties.length < 2) {
      return { success: false, error: 'Consortium requires at least 2 parties' };
    }

    // Get consortium structure
    const consortiumSize = opportunity.attributes?.consortiumSize || parties.length;
    const requiredSpecialties = opportunity.attributes?.requiredSpecialties || [];

    // Generate Consortium-specific governance
    const governanceStructure = {
      entityType: 'CONSORTIUM',
      consortiumSize: consortiumSize,
      leadMember: determineLeadMember(parties, opportunity),
      scopeDivision: generateScopeDivision(parties, opportunity),
      liabilityStructure: {
        type: 'Joint and Several',
        allocation: generateLiabilityAllocation(parties)
      },
      paymentDistribution: generatePaymentDistribution(parties, opportunity),
      management: {
        leadMemberRole: 'Coordination and primary interface',
        memberRoles: assignConsortiumRoles(parties, requiredSpecialties),
        decisionMaking: 'Lead member with member consultation',
        coordination: 'Lead member coordinates work packages'
      },
      workPackages: opportunity.attributes?.workPackages || generateWorkPackages(parties, opportunity)
    };

    return createMultiPartyContract(proposalId, parties, {
      contractType: 'CONSORTIUM_CONTRACT',
      governanceStructure: governanceStructure
    });
  }

  /**
   * Record party consent for multi-party contract
   * @param {string} contractId - Contract ID
   * @param {string} partyId - Party ID giving consent
   * @returns {Object} - Result { success: boolean, contract: Object, allConsented: boolean }
   */
  function recordPartyConsent(contractId, partyId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      return { success: false, error: 'Data service not available' };
    }

    const contract = PMTwinData.Contracts.getById(contractId);
    if (!contract || !contract.isMultiParty) {
      return { success: false, error: 'Contract not found or not a multi-party contract' };
    }

    // Find party and update consent
    const party = contract.parties.find(p => p.partyId === partyId);
    if (!party) {
      return { success: false, error: 'Party not found in contract' };
    }

    party.consentStatus = 'CONSENTED';
    party.consentedAt = new Date().toISOString();

    // Check if all parties have consented
    const allConsented = contract.parties.every(p => p.consentStatus === 'CONSENTED');

    // Update contract
    const updatedContract = PMTwinData.Contracts.update(contractId, {
      parties: contract.parties,
      status: allConsented ? 'SENT' : 'DRAFT' // Move to SENT when all consented
    });

    if (updatedContract) {
      return {
        success: true,
        contract: updatedContract,
        allConsented: allConsented
      };
    }

    return { success: false, error: 'Failed to update contract' };
  }

  // ============================================
  // Helper Functions
  // ============================================

  function determineContractTypeFromProposal(proposal) {
    // Infer from proposal target or model type
    const opportunity = getOpportunityFromProposal(proposal);
    if (opportunity) {
      const modelType = opportunity.modelType || opportunity.modelId;
      if (modelType === '1.4') return 'SPV_CONTRACT';
      if (modelType === '1.3') return 'JV_CONTRACT';
      if (modelType === '1.2') return 'CONSORTIUM_CONTRACT';
    }
    return 'MULTI_PARTY_CONTRACT';
  }

  function getOpportunityFromProposal(proposal) {
    if (!proposal) return null;

    // Try to get from targetId
    if (proposal.targetId) {
      if (proposal.targetType === 'PROJECT' || proposal.targetType === 'MEGA_PROJECT') {
        return PMTwinData.Projects.getById(proposal.targetId);
      }
    }

    // Try collaboration opportunity
    if (proposal.projectId) {
      const project = PMTwinData.Projects.getById(proposal.projectId);
      if (project) return project;
    }

    return null;
  }

  function extractPartiesFromOpportunity(opportunity, proposal) {
    const parties = [];

    // Add owner/creator as first party
    if (opportunity.creatorId || opportunity.ownerCompanyId) {
      parties.push({
        partyId: opportunity.ownerCompanyId || opportunity.creatorId,
        partyType: 'BENEFICIARY',
        role: 'OWNER',
        share: 0 // Will be calculated
      });
    }

    // Add proposal provider as second party
    if (proposal.bidderCompanyId || proposal.providerId) {
      parties.push({
        partyId: proposal.bidderCompanyId || proposal.providerId,
        partyType: 'VENDOR_CORPORATE',
        role: 'PARTNER',
        share: 0 // Will be calculated
      });
    }

    // Add approved applications as additional parties
    if (opportunity.applications && Array.isArray(opportunity.applications)) {
      const applications = PMTwinData.CollaborationApplications?.getByOpportunity(opportunity.id) || [];
      applications.filter(app => app.status === 'approved').forEach(app => {
        if (!parties.find(p => p.partyId === app.applicantId)) {
          parties.push({
            partyId: app.applicantId,
            partyType: 'VENDOR_CORPORATE',
            role: 'PARTNER',
            share: 0
          });
        }
      });
    }

    // Calculate shares if not provided
    if (parties.length > 0 && parties.every(p => p.share === 0)) {
      const equalShare = 100 / parties.length;
      parties.forEach(p => p.share = equalShare);
    }

    return parties;
  }

  function generateGovernanceStructure(parties, contractType, opportunity) {
    return {
      entityType: contractType,
      parties: parties.length,
      roles: assignRoles(parties),
      decisionMaking: 'Majority vote',
      quorum: Math.ceil(parties.length / 2) + 1
    };
  }

  function generateEquityStructure(parties, jvStructure = null) {
    if (jvStructure) {
      // Parse JV structure like "50-50" or "60-40"
      const shares = jvStructure.split('-').map(s => parseFloat(s));
      if (shares.length === parties.length) {
        return parties.map((p, i) => ({
          partyId: p.partyId,
          share: shares[i]
        }));
      }
    }

    // Equal distribution
    return parties.map(p => ({
      partyId: p.partyId,
      share: p.share || (100 / parties.length)
    }));
  }

  function generateProfitDistribution(parties) {
    return parties.map(p => ({
      partyId: p.partyId,
      percentage: p.share || (100 / parties.length),
      distributionMethod: 'Proportional to equity share'
    }));
  }

  function generateLiabilityAllocation(parties) {
    return parties.map(p => ({
      partyId: p.partyId,
      percentage: p.share || (100 / parties.length),
      type: 'Proportional to share'
    }));
  }

  function generatePaymentDistribution(parties, opportunity) {
    // Can be based on work packages or equal distribution
    return parties.map(p => ({
      partyId: p.partyId,
      percentage: p.share || (100 / parties.length),
      method: 'Milestone-based'
    }));
  }

  function generateScopeDivision(parties, opportunity) {
    const workPackages = opportunity.attributes?.workPackages || [];
    if (workPackages.length > 0) {
      return workPackages.map((wp, index) => ({
        workPackage: wp.name || `Work Package ${index + 1}`,
        assignedTo: parties[index % parties.length].partyId,
        value: wp.value || 0
      }));
    }

    // Equal division
    return parties.map(p => ({
      partyId: p.partyId,
      scope: 'Equal division',
      value: opportunity.attributes?.projectValue ? (opportunity.attributes.projectValue / parties.length) : 0
    }));
  }

  function generateWorkPackages(parties, opportunity) {
    const workPackages = opportunity.attributes?.workPackages || [];
    if (workPackages.length > 0) {
      return workPackages;
    }

    // Generate default work packages
    return parties.map((p, index) => ({
      id: `wp_${index + 1}`,
      name: `Work Package ${index + 1}`,
      assignedTo: p.partyId,
      value: opportunity.attributes?.projectValue ? (opportunity.attributes.projectValue / parties.length) : 0,
      deliverables: []
    }));
  }

  function assignRoles(parties) {
    return parties.map((p, index) => ({
      partyId: p.partyId,
      role: index === 0 ? 'LEAD' : 'MEMBER',
      responsibilities: index === 0 ? 'Project coordination' : 'Work package execution'
    }));
  }

  function assignJVRoles(parties, managementStructure) {
    if (managementStructure === 'lead') {
      return parties.map((p, index) => ({
        partyId: p.partyId,
        role: index === 0 ? 'LEAD_PARTNER' : 'PARTNER',
        responsibilities: index === 0 ? 'Management and coordination' : 'Execution and support'
      }));
    }

    return parties.map(p => ({
      partyId: p.partyId,
      role: 'PARTNER',
      responsibilities: 'Shared management and execution'
    }));
  }

  function assignConsortiumRoles(parties, requiredSpecialties) {
    return parties.map((p, index) => ({
      partyId: p.partyId,
      role: index === 0 ? 'LEAD_MEMBER' : 'MEMBER',
      specialty: requiredSpecialties[index] || 'General',
      responsibilities: index === 0 ? 'Coordination' : 'Specialty execution'
    }));
  }

  function determineLeadMember(parties, opportunity) {
    // First party or largest share holder
    return parties.reduce((lead, current) => 
      (current.share || 0) > (lead.share || 0) ? current : lead,
      parties[0]
    ).partyId;
  }

  function generateBoardStructure(parties) {
    const boardSize = Math.min(parties.length, 7); // Max 7 board members
    return {
      size: boardSize,
      members: parties.slice(0, boardSize).map((p, index) => ({
        partyId: p.partyId,
        role: index === 0 ? 'CHAIRMAN' : 'MEMBER',
        appointedBy: p.partyId
      }))
    };
  }

  function generateMultiPartyContractTerms(proposal, parties, governanceStructure, contractType) {
    const terms = {
      type: contractType,
      parties: parties.map(p => ({
        partyId: p.partyId,
        role: p.role,
        share: p.share
      })),
      governance: governanceStructure,
      pricing: proposal.cashDetails || proposal.barterDetails || { amount: 0, currency: 'SAR' },
      paymentTerms: proposal.paymentTerms || 'milestone_based',
      deliverables: proposal.deliverables || [],
      milestones: proposal.milestones || [],
      timeline: proposal.timeline || {},
      riskAllocation: generateRiskAllocation(parties, contractType)
    };

    return terms;
  }

  function generateRiskAllocation(parties, contractType) {
    return parties.map(p => ({
      partyId: p.partyId,
      riskShare: p.share || (100 / parties.length),
      liability: 'Proportional to equity share',
      insurance: 'Required per party'
    }));
  }

  // ============================================
  // Export
  // ============================================

  window.MultiPartyContractService = {
    createMultiPartyContract: createMultiPartyContract,
    generateSPVContract: generateSPVContract,
    generateJVContract: generateJVContract,
    generateConsortiumContract: generateConsortiumContract,
    recordPartyConsent: recordPartyConsent
  };

})();
