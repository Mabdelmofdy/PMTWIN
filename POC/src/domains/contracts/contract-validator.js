/**
 * Contract Validator
 * Validates Contract data and enforces business rules
 */

(function() {
  'use strict';

  /**
   * Get user type from user ID
   * @param {string} userId - User ID
   * @returns {string|null} - User type or null
   */
  function getUserTypeFromUser(userId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Users) {
      return null;
    }
    const user = PMTwinData.Users.getById(userId);
    if (!user) return null;
    
    // Use mapRoleToUserType if available, otherwise use userType
    if (typeof mapRoleToUserType === 'function') {
      return mapRoleToUserType(user.role, user.userType);
    }
    return user.userType || 'consultant';
  }

  /**
   * Validate SubContract creation
   * @param {Object} contractData - Contract data to validate
   * @returns {Object} - Validation result with valid flag and error message
   */
  function validateSubContract(contractData) {
    // Rule 1: providerPartyType must be SUB_CONTRACTOR
    if (contractData.providerPartyType !== 'SUB_CONTRACTOR' && 
        contractData.providerPartyType !== 'sub_contractor') {
      return { valid: false, error: 'SubContract must have SUB_CONTRACTOR as provider' };
    }
    
    // Rule 2: buyerPartyType must be VENDOR
    if (contractData.buyerPartyType !== 'VENDOR_CORPORATE' && 
        contractData.buyerPartyType !== 'VENDOR_INDIVIDUAL' &&
        contractData.buyerPartyType !== 'vendor_corporate' &&
        contractData.buyerPartyType !== 'vendor_individual') {
      return { valid: false, error: 'SubContract buyer must be VENDOR' };
    }
    
    // Rule 3: parentContractId must exist and point to Vendor contract
    if (!contractData.parentContractId) {
      return { valid: false, error: 'SubContract must have parentContractId' };
    }
    
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      return { valid: false, error: 'Contracts module not available' };
    }
    
    const parentContract = PMTwinData.Contracts.getById(contractData.parentContractId);
    if (!parentContract) {
      return { valid: false, error: 'Parent contract not found' };
    }
    
    if (parentContract.contractType !== 'PROJECT_CONTRACT' && 
        parentContract.contractType !== 'MEGA_PROJECT_CONTRACT') {
      return { valid: false, error: 'Parent contract must be PROJECT_CONTRACT or MEGA_PROJECT_CONTRACT' };
    }
    
    const parentProviderType = parentContract.providerPartyType || '';
    if (parentProviderType !== 'VENDOR_CORPORATE' && 
        parentProviderType !== 'VENDOR_INDIVIDUAL' &&
        parentProviderType !== 'vendor_corporate' &&
        parentProviderType !== 'vendor_individual') {
      return { valid: false, error: 'Parent contract provider must be VENDOR' };
    }
    
    // Rule 4: SubContractor cannot have direct contract with Beneficiary
    const buyer = getUserTypeFromUser(contractData.buyerPartyId);
    if (buyer === 'beneficiary' || buyer === 'entity' || buyer === 'company') {
      // Check if this is actually a beneficiary
      if (typeof PMTwinData !== 'undefined' && PMTwinData.Users) {
        const buyerUser = PMTwinData.Users.getById(contractData.buyerPartyId);
        if (buyerUser) {
          const role = buyerUser.role || '';
          if (role === 'entity' || role === 'beneficiary' || role === 'project_lead') {
            return { valid: false, error: 'SubContractor cannot contract directly with Beneficiary' };
          }
        }
      }
    }
    
    return { valid: true };
  }

  /**
   * Validate Service Provider Contract
   * @param {Object} contractData - Contract data to validate
   * @returns {Object} - Validation result
   */
  function validateServiceProviderContract(contractData) {
    // Rule: ServiceProvider cannot bid on Projects/MegaProjects
    if (contractData.scopeType === 'PROJECT' || contractData.scopeType === 'MEGA_PROJECT') {
      return { valid: false, error: 'ServiceProvider cannot contract for Projects/MegaProjects directly' };
    }
    
    // Must be SERVICE_CONTRACT with SERVICE_REQUEST scope
    if (contractData.contractType !== 'SERVICE_CONTRACT') {
      return { valid: false, error: 'ServiceProvider contracts must be SERVICE_CONTRACT type' };
    }
    
    if (contractData.scopeType !== 'SERVICE_REQUEST') {
      return { valid: false, error: 'ServiceProvider contracts must reference SERVICE_REQUEST' };
    }
    
    // Validate providerPartyType is SERVICE_PROVIDER
    if (contractData.providerPartyType !== 'SERVICE_PROVIDER' && 
        contractData.providerPartyType !== 'service_provider') {
      return { valid: false, error: 'ServiceProvider contract must have SERVICE_PROVIDER as provider' };
    }
    
    return { valid: true };
  }

  /**
   * Validate contract creation
   * @param {Object} contractData - Contract data to validate
   * @returns {Object} - Validation result with valid flag and errors array
   */
  function validateContractCreation(contractData) {
    const errors = [];

    if (!contractData) {
      return { valid: false, errors: ['Contract data is required'] };
    }

    // Validate contractType
    const validContractTypes = [
      'PROJECT_CONTRACT',
      'MEGA_PROJECT_CONTRACT',
      'SERVICE_CONTRACT',
      'ADVISORY_CONTRACT',
      'SUB_CONTRACT'
    ];
    if (!contractData.contractType || !validContractTypes.includes(contractData.contractType)) {
      errors.push(`Invalid contractType. Must be one of: ${validContractTypes.join(', ')}`);
    }

    // Validate scopeType
    const validScopeTypes = ['PROJECT', 'MEGA_PROJECT', 'SUB_PROJECT', 'SERVICE_REQUEST'];
    if (!contractData.scopeType || !validScopeTypes.includes(contractData.scopeType)) {
      errors.push(`Invalid scopeType. Must be one of: ${validScopeTypes.join(', ')}`);
    }

    // Validate scopeId
    if (!contractData.scopeId) {
      errors.push('scopeId is required');
    }

    // Validate buyerPartyId
    if (!contractData.buyerPartyId) {
      errors.push('buyerPartyId is required');
    }

    // Validate buyerPartyType
    const validBuyerTypes = ['BENEFICIARY', 'VENDOR_CORPORATE', 'VENDOR_INDIVIDUAL'];
    if (!contractData.buyerPartyType || !validBuyerTypes.includes(contractData.buyerPartyType)) {
      errors.push(`Invalid buyerPartyType. Must be one of: ${validBuyerTypes.join(', ')}`);
    }

    // Validate providerPartyId
    if (!contractData.providerPartyId) {
      errors.push('providerPartyId is required');
    }

    // Validate providerPartyType
    const validProviderTypes = [
      'VENDOR_CORPORATE',
      'VENDOR_INDIVIDUAL',
      'SERVICE_PROVIDER',
      'CONSULTANT',
      'SUB_CONTRACTOR'
    ];
    if (!contractData.providerPartyType || !validProviderTypes.includes(contractData.providerPartyType)) {
      errors.push(`Invalid providerPartyType. Must be one of: ${validProviderTypes.join(', ')}`);
    }

    // Validate parentContractId for SUB_CONTRACT
    if (contractData.contractType === 'SUB_CONTRACT') {
      if (!contractData.parentContractId) {
        errors.push('parentContractId is required for SUB_CONTRACT');
      }
      
      // Run SubContract-specific validation
      const subContractValidation = validateSubContract(contractData);
      if (!subContractValidation.valid) {
        errors.push(subContractValidation.error);
      }
    } else {
      // SUB_CONTRACT should not have parentContractId
      if (contractData.parentContractId) {
        errors.push('parentContractId should only be set for SUB_CONTRACT');
      }
    }

    // Validate ServiceProvider contract
    if (contractData.providerPartyType === 'SERVICE_PROVIDER' || 
        contractData.providerPartyType === 'service_provider') {
      const spValidation = validateServiceProviderContract(contractData);
      if (!spValidation.valid) {
        errors.push(spValidation.error);
      }
    }

    // Validate dates
    if (contractData.startDate) {
      const startDate = new Date(contractData.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid startDate');
      }
    }

    if (contractData.endDate) {
      const endDate = new Date(contractData.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid endDate');
      }
      
      // Validate endDate is after startDate
      if (contractData.startDate) {
        const startDate = new Date(contractData.startDate);
        if (endDate <= startDate) {
          errors.push('endDate must be after startDate');
        }
      }
    }

    // Validate termsJSON structure
    if (contractData.termsJSON) {
      if (typeof contractData.termsJSON !== 'object') {
        errors.push('termsJSON must be an object');
      } else {
        if (contractData.termsJSON.pricing) {
          if (!contractData.termsJSON.pricing.currency) {
            errors.push('termsJSON.pricing.currency is required');
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate contract status update
   * @param {string} currentStatus - Current status
   * @param {string} newStatus - New status
   * @returns {Object} - Validation result
   */
  function validateContractStatusUpdate(currentStatus, newStatus) {
    const errors = [];
    const validStatuses = ['DRAFT', 'SENT', 'SIGNED', 'ACTIVE', 'COMPLETED', 'TERMINATED'];
    const statusTransitions = {
      'DRAFT': ['SENT', 'TERMINATED'],
      'SENT': ['SIGNED', 'DRAFT', 'TERMINATED'],
      'SIGNED': ['ACTIVE', 'TERMINATED'],
      'ACTIVE': ['COMPLETED', 'TERMINATED', 'PAUSED'],
      'COMPLETED': [],
      'TERMINATED': []
    };

    if (!validStatuses.includes(newStatus)) {
      errors.push(`Invalid status: ${newStatus}`);
    }

    if (currentStatus && statusTransitions[currentStatus]) {
      if (!statusTransitions[currentStatus].includes(newStatus)) {
        errors.push(`Cannot transition from ${currentStatus} to ${newStatus}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate contract signing
   * @param {string} contractId - Contract ID
   * @param {string} signerId - User ID of signer
   * @returns {Object} - Validation result
   */
  function validateContractSigning(contractId, signerId) {
    const errors = [];

    if (!contractId) {
      errors.push('Contract ID is required');
    }

    if (!signerId) {
      errors.push('Signer ID is required');
    }

    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      errors.push('Contracts module not available');
      return { valid: false, errors: errors };
    }

    const contract = PMTwinData.Contracts.getById(contractId);
    if (!contract) {
      errors.push('Contract not found');
      return { valid: false, errors: errors };
    }

    if (contract.status !== 'DRAFT' && contract.status !== 'SENT') {
      errors.push(`Contract must be in DRAFT or SENT status to be signed. Current status: ${contract.status}`);
    }

    // Validate signer is either buyer or provider
    if (signerId !== contract.buyerPartyId && signerId !== contract.providerPartyId) {
      errors.push('Signer must be either the buyer or provider party');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Export
  window.ContractValidator = {
    validateContractCreation,
    validateContractStatusUpdate,
    validateContractSigning,
    validateSubContract,
    validateServiceProviderContract
  };

})();

