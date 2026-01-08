/**
 * Engagement Validator
 * Validates Engagement data and enforces business rules
 */

(function() {
  'use strict';

  /**
   * Validate engagement creation
   * @param {Object} engagementData - Engagement data to validate
   * @returns {Object} - Validation result with valid flag and errors array
   */
  function validateEngagementCreation(engagementData) {
    const errors = [];

    if (!engagementData) {
      return { valid: false, errors: ['Engagement data is required'] };
    }

    // Rule: Engagement must have contractId
    if (!engagementData.contractId) {
      errors.push('Engagement must have contractId');
    } else {
      // Validate contract exists and is signed
      if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
        errors.push('Contracts module not available');
      } else {
        const contract = PMTwinData.Contracts.getById(engagementData.contractId);
        if (!contract) {
          errors.push('Contract not found');
        } else {
          // Rule: Contract must be SIGNED or ACTIVE to create engagement
          if (contract.status !== 'SIGNED' && contract.status !== 'ACTIVE') {
            errors.push(`Contract must be SIGNED or ACTIVE to create engagement. Current status: ${contract.status}`);
          }
        }
      }
    }

    // Validate engagementType
    const validEngagementTypes = ['PROJECT_EXECUTION', 'SERVICE_DELIVERY', 'ADVISORY'];
    if (!engagementData.engagementType || !validEngagementTypes.includes(engagementData.engagementType)) {
      errors.push(`Invalid engagementType. Must be one of: ${validEngagementTypes.join(', ')}`);
    }

    // Validate status
    const validStatuses = ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELED'];
    if (engagementData.status && !validStatuses.includes(engagementData.status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate assignedToScopeType if assignedToScopeId is provided
    if (engagementData.assignedToScopeId && !engagementData.assignedToScopeType) {
      errors.push('assignedToScopeType is required when assignedToScopeId is provided');
    }

    // Validate assignedToScopeType values
    if (engagementData.assignedToScopeType) {
      const validScopeTypes = ['SUB_PROJECT', 'PHASE', 'WORK_PACKAGE'];
      if (!validScopeTypes.includes(engagementData.assignedToScopeType)) {
        errors.push(`Invalid assignedToScopeType. Must be one of: ${validScopeTypes.join(', ')}`);
      }
    }

    // Validate milestoneIds is an array if provided
    if (engagementData.milestoneIds !== undefined) {
      if (!Array.isArray(engagementData.milestoneIds)) {
        errors.push('milestoneIds must be an array');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate engagement status update
   * @param {string} currentStatus - Current status
   * @param {string} newStatus - New status
   * @param {Object} updates - Additional update data
   * @returns {Object} - Validation result
   */
  function validateStatusUpdate(currentStatus, newStatus, updates = {}) {
    const errors = [];
    const validStatuses = ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELED'];
    const statusTransitions = {
      'PLANNED': ['ACTIVE', 'CANCELED'],
      'ACTIVE': ['PAUSED', 'COMPLETED', 'CANCELED'],
      'PAUSED': ['ACTIVE', 'CANCELED'],
      'COMPLETED': [],
      'CANCELED': []
    };

    if (!validStatuses.includes(newStatus)) {
      errors.push(`Invalid status: ${newStatus}`);
    }

    if (currentStatus && statusTransitions[currentStatus]) {
      if (!statusTransitions[currentStatus].includes(newStatus)) {
        errors.push(`Cannot transition from ${currentStatus} to ${newStatus}`);
      }
    }

    // Validate contract is still valid when activating engagement
    if (newStatus === 'ACTIVE' && currentStatus !== 'ACTIVE') {
      // This check should be done at service layer with contractId
      // We can't access it here without the engagement object
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate engagement assignment to scope
   * @param {string} engagementId - Engagement ID
   * @param {string} scopeType - Scope type (SUB_PROJECT, PHASE, WORK_PACKAGE)
   * @param {string} scopeId - Scope ID
   * @returns {Object} - Validation result
   */
  function validateScopeAssignment(engagementId, scopeType, scopeId) {
    const errors = [];

    if (!engagementId) {
      errors.push('Engagement ID is required');
    }

    if (!scopeType) {
      errors.push('Scope type is required');
    } else {
      const validScopeTypes = ['SUB_PROJECT', 'PHASE', 'WORK_PACKAGE'];
      if (!validScopeTypes.includes(scopeType)) {
        errors.push(`Invalid scope type. Must be one of: ${validScopeTypes.join(', ')}`);
      }
    }

    if (!scopeId) {
      errors.push('Scope ID is required');
    }

    // Check if engagement exists
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Engagements) {
      errors.push('Engagements module not available');
    } else {
      const engagement = PMTwinData.Engagements.getById(engagementId);
      if (!engagement) {
        errors.push('Engagement not found');
      } else {
        // Validate contract is still active
        if (typeof PMTwinData !== 'undefined' && PMTwinData.Contracts) {
          const contract = PMTwinData.Contracts.getById(engagement.contractId);
          if (!contract) {
            errors.push('Contract not found');
          } else if (contract.status !== 'ACTIVE' && contract.status !== 'SIGNED') {
            errors.push('Can only assign engagements with active contracts to scope');
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
   * Validate engagement can be created for contract
   * @param {string} contractId - Contract ID
   * @param {string} engagementType - Engagement type
   * @returns {Object} - Validation result
   */
  function validateEngagementForContract(contractId, engagementType) {
    const errors = [];

    if (!contractId) {
      errors.push('Contract ID is required');
    }

    if (!engagementType) {
      errors.push('Engagement type is required');
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

    // Contract must be signed or active
    if (contract.status !== 'SIGNED' && contract.status !== 'ACTIVE') {
      errors.push(`Contract must be SIGNED or ACTIVE to create engagement. Current status: ${contract.status}`);
    }

    // Validate engagement type matches contract type
    const contractTypeToEngagementType = {
      'PROJECT_CONTRACT': 'PROJECT_EXECUTION',
      'MEGA_PROJECT_CONTRACT': 'PROJECT_EXECUTION',
      'SERVICE_CONTRACT': 'SERVICE_DELIVERY',
      'ADVISORY_CONTRACT': 'ADVISORY',
      'SUB_CONTRACT': 'PROJECT_EXECUTION' // Sub-contracts are typically project execution
    };

    const expectedEngagementType = contractTypeToEngagementType[contract.contractType];
    if (expectedEngagementType && engagementType !== expectedEngagementType) {
      errors.push(`Engagement type ${engagementType} does not match contract type ${contract.contractType}. Expected: ${expectedEngagementType}`);
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Export
  window.EngagementValidator = {
    validateEngagementCreation,
    validateStatusUpdate,
    validateScopeAssignment,
    validateEngagementForContract
  };

})();

