/**
 * Workflow Validation Script
 * Validates the contract-driven workflow rules
 */

(function() {
  'use strict';

  // ============================================
  // Validate Workflow Rules
  // ============================================
  function validateWorkflow() {
    if (typeof PMTwinData === 'undefined') {
      console.error('PMTwinData not available');
      return { valid: false, errors: ['Data service not available'] };
    }

    const errors = [];
    const warnings = [];

    // 1. Validate: No proposals where bidderCompanyId === ownerCompanyId
    const proposals = PMTwinData.Proposals.getAll();
    proposals.forEach(proposal => {
      if (proposal.bidderCompanyId === proposal.ownerCompanyId) {
        errors.push(`Proposal ${proposal.id}: bidderCompanyId (${proposal.bidderCompanyId}) cannot equal ownerCompanyId`);
      }
    });

    // 2. Validate: No service provider proposals to Projects/MegaProjects
    proposals.forEach(proposal => {
      const bidder = PMTwinData.Users.getById(proposal.bidderCompanyId || proposal.providerId);
      if (bidder) {
        const userRole = bidder.role || bidder.userType;
        if ((userRole === 'service_provider' || userRole === 'skill_service_provider') && 
            (proposal.targetType === 'PROJECT' || proposal.targetType === 'MEGA_PROJECT')) {
          errors.push(`Proposal ${proposal.id}: Service Provider cannot bid on Projects/MegaProjects. Only ServiceRequests allowed.`);
        }
      }
    });

    // 3. Validate: No sub-contractor direct beneficiary contracts
    const contracts = PMTwinData.Contracts.getAll();
    contracts.forEach(contract => {
      // Contracts use buyerPartyId and providerPartyId (users represent companies)
      const buyerPartyId = contract.buyerPartyId || contract.buyerPartyCompanyId;
      const providerPartyId = contract.providerPartyId || contract.providerPartyCompanyId;
      
      if (contract.contractType === 'SUB_CONTRACT') {
        // Sub-contracts should have vendor as buyer
        const buyer = PMTwinData.Users.getById(buyerPartyId);
        if (buyer) {
          const buyerRole = buyer.role || buyer.userType;
          if (buyerRole !== 'vendor' && buyerRole !== 'vendor_corporate' && buyerRole !== 'vendor_individual') {
            errors.push(`Contract ${contract.id}: Sub-contract buyer must be Vendor, not ${buyerRole}`);
          }
        }
        
        // Sub-contracts must have parent contract
        if (!contract.parentContractId) {
          errors.push(`Contract ${contract.id}: Sub-contract must have parentContractId`);
        } else {
          const parentContract = PMTwinData.Contracts.getById(contract.parentContractId);
          if (!parentContract) {
            errors.push(`Contract ${contract.id}: Parent contract ${contract.parentContractId} not found`);
          } else if (parentContract.contractType !== 'PROJECT_CONTRACT' && parentContract.contractType !== 'MEGA_PROJECT_CONTRACT') {
            errors.push(`Contract ${contract.id}: Parent contract must be PROJECT_CONTRACT or MEGA_PROJECT_CONTRACT`);
          }
        }
      } else {
        // Non-sub-contracts: sub-contractor cannot be provider for direct beneficiary contracts
        const provider = PMTwinData.Users.getById(providerPartyId);
        const buyer = PMTwinData.Users.getById(buyerPartyId);
        if (provider && buyer) {
          const providerRole = provider.role || provider.userType;
          const buyerRole = buyer.role || buyer.userType;
          if (providerRole === 'sub_contractor' && 
              (buyerRole === 'beneficiary' || buyerRole === 'entity' || buyerRole === 'project_lead')) {
            errors.push(`Contract ${contract.id}: Sub-contractor cannot have direct contract with Beneficiary`);
          }
        }
      }
    });

    // 4. Validate: All engagements have contractId and contract is SIGNED/ACTIVE
    const engagements = PMTwinData.Engagements.getAll();
    engagements.forEach(engagement => {
      if (!engagement.contractId) {
        errors.push(`Engagement ${engagement.id}: Missing contractId`);
      } else {
        const contract = PMTwinData.Contracts.getById(engagement.contractId);
        if (!contract) {
          errors.push(`Engagement ${engagement.id}: Contract ${engagement.contractId} not found`);
        } else if (contract.status !== 'SIGNED' && contract.status !== 'ACTIVE') {
          // Allow PLANNED engagements with DRAFT contracts (will be activated when contract is signed)
          if (engagement.status === 'PLANNED' && contract.status === 'DRAFT') {
            // This is acceptable - engagement is planned, contract will be signed
          } else {
            errors.push(`Engagement ${engagement.id}: Contract ${engagement.contractId} must be SIGNED or ACTIVE for ${engagement.status} engagement, but is ${contract.status}`);
          }
        }
      }
    });

    // 5. Validate: All awarded proposals have corresponding Contract
    proposals.forEach(proposal => {
      if (proposal.status === 'AWARDED') {
        if (!proposal.contractId) {
          warnings.push(`Proposal ${proposal.id}: Awarded but no contractId set`);
        } else {
          const contract = PMTwinData.Contracts.getById(proposal.contractId);
          if (!contract) {
            errors.push(`Proposal ${proposal.id}: Contract ${proposal.contractId} not found`);
          }
        }
      }
    });

    // 6. Validate: Proposal type matches target type
    proposals.forEach(proposal => {
      if (proposal.proposalType === 'PROJECT_BID' && 
          proposal.targetType !== 'PROJECT' && proposal.targetType !== 'MEGA_PROJECT') {
        errors.push(`Proposal ${proposal.id}: PROJECT_BID must target PROJECT or MEGA_PROJECT, not ${proposal.targetType}`);
      }
      if (proposal.proposalType === 'SERVICE_OFFER' && proposal.targetType !== 'SERVICE_REQUEST') {
        errors.push(`Proposal ${proposal.id}: SERVICE_OFFER must target SERVICE_REQUEST, not ${proposal.targetType}`);
      }
      if (proposal.proposalType === 'ADVISORY_OFFER' && proposal.targetType !== 'SERVICE_REQUEST' && proposal.targetType !== 'ADVISORY_REQUEST') {
        warnings.push(`Proposal ${proposal.id}: ADVISORY_OFFER typically targets SERVICE_REQUEST with requestType=ADVISORY`);
      }
    });

    // 7. Validate: Opportunities have ownerCompanyId
    const projects = PMTwinData.Projects.getAll();
    projects.forEach(project => {
      if (!project.ownerCompanyId) {
        warnings.push(`Project ${project.id}: Missing ownerCompanyId`);
      }
    });

    const serviceRequests = PMTwinData.ServiceRequests.getAll();
    serviceRequests.forEach(sr => {
      if (!sr.ownerCompanyId) {
        warnings.push(`ServiceRequest ${sr.id}: Missing ownerCompanyId`);
      }
    });

    const result = {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        proposalsChecked: proposals.length,
        contractsChecked: contracts.length,
        engagementsChecked: engagements.length
      }
    };

    if (result.valid) {
      console.log('✅ Workflow validation passed!');
      if (warnings.length > 0) {
        console.warn(`⚠️ ${warnings.length} warning(s):`, warnings);
      }
    } else {
      console.error(`❌ Workflow validation failed: ${errors.length} error(s)`);
      errors.forEach(error => console.error('  -', error));
      if (warnings.length > 0) {
        console.warn(`⚠️ ${warnings.length} warning(s):`, warnings);
      }
    }

    return result;
  }

  // ============================================
  // Public API
  // ============================================
  window.WorkflowValidator = {
    validate: validateWorkflow
  };

  // Auto-run validation if PMTwinData is available
  if (typeof PMTwinData !== 'undefined' && typeof window !== 'undefined') {
    // Run validation after a short delay to ensure data is loaded
    setTimeout(() => {
      if (typeof WorkflowValidator !== 'undefined') {
        WorkflowValidator.validate();
      }
    }, 2000);
  }

})();
