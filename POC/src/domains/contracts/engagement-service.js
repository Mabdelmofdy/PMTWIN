/**
 * Engagement Service
 * Business logic for Engagement management
 */

(function() {
  'use strict';

  /**
   * Create engagement
   * @param {Object} engagementData - Engagement data
   * @returns {Object} - Created engagement or error
   */
  function createEngagement(engagementData) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Engagements) {
      return { success: false, error: 'Data service not available' };
    }

    // Validate
    if (typeof EngagementValidator !== 'undefined') {
      const validation = EngagementValidator.validateEngagementCreation(engagementData);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // Additional validation: check contract and engagement type match
      if (engagementData.contractId && engagementData.engagementType) {
        const contractValidation = EngagementValidator.validateEngagementForContract(
          engagementData.contractId,
          engagementData.engagementType
        );
        if (!contractValidation.valid) {
          return { success: false, errors: contractValidation.errors };
        }
      }
    }

    // Create engagement
    const engagement = PMTwinData.Engagements.create(engagementData);
    if (engagement) {
      return { success: true, engagement: engagement };
    }

    return { success: false, error: 'Failed to create engagement' };
  }

  /**
   * Get engagement by ID
   * @param {string} id - Engagement ID
   * @returns {Object} - Engagement or null
   */
  function getEngagement(id) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Engagements) {
      return null;
    }

    return PMTwinData.Engagements.getById(id);
  }

  /**
   * Get engagements by contract
   * @param {string} contractId - Contract ID
   * @returns {Array} - Array of engagements
   */
  function getEngagementsByContract(contractId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Engagements) {
      return [];
    }

    return PMTwinData.Engagements.getByContract(contractId);
  }

  /**
   * Get engagements by scope
   * @param {string} scopeType - Scope type (SUB_PROJECT, PHASE, WORK_PACKAGE)
   * @param {string} scopeId - Scope ID
   * @returns {Array} - Array of engagements
   */
  function getEngagementsByScope(scopeType, scopeId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Engagements) {
      return [];
    }

    return PMTwinData.Engagements.getByScope(scopeType, scopeId);
  }

  /**
   * Update engagement status
   * @param {string} engagementId - Engagement ID
   * @param {string} status - New status
   * @returns {Object} - Updated engagement or error
   */
  function updateEngagementStatus(engagementId, status) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Engagements) {
      return { success: false, error: 'Data service not available' };
    }

    const engagement = PMTwinData.Engagements.getById(engagementId);
    if (!engagement) {
      return { success: false, error: 'Engagement not found' };
    }

    // Validate status transition
    if (typeof EngagementValidator !== 'undefined') {
      const validation = EngagementValidator.validateStatusUpdate(engagement.status, status);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    // Update engagement
    const updated = PMTwinData.Engagements.update(engagementId, { status: status });
    if (updated) {
      return { success: true, engagement: updated };
    }

    return { success: false, error: 'Failed to update engagement status' };
  }

  /**
   * Assign engagement to scope
   * @param {string} engagementId - Engagement ID
   * @param {string} scopeType - Scope type (SUB_PROJECT, PHASE, WORK_PACKAGE)
   * @param {string} scopeId - Scope ID
   * @returns {Object} - Updated engagement or error
   */
  function assignEngagementToScope(engagementId, scopeType, scopeId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Engagements) {
      return { success: false, error: 'Data service not available' };
    }

    // Validate assignment
    if (typeof EngagementValidator !== 'undefined') {
      const validation = EngagementValidator.validateScopeAssignment(engagementId, scopeType, scopeId);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    // Update engagement
    const updated = PMTwinData.Engagements.update(engagementId, {
      assignedToScopeType: scopeType,
      assignedToScopeId: scopeId
    });

    if (updated) {
      return { success: true, engagement: updated };
    }

    return { success: false, error: 'Failed to assign engagement to scope' };
  }

  /**
   * Complete engagement
   * @param {string} engagementId - Engagement ID
   * @returns {Object} - Completed engagement or error
   */
  function completeEngagement(engagementId) {
    return updateEngagementStatus(engagementId, 'COMPLETED');
  }

  /**
   * Pause engagement
   * @param {string} engagementId - Engagement ID
   * @returns {Object} - Paused engagement or error
   */
  function pauseEngagement(engagementId) {
    return updateEngagementStatus(engagementId, 'PAUSED');
  }

  /**
   * Resume engagement
   * @param {string} engagementId - Engagement ID
   * @returns {Object} - Resumed engagement or error
   */
  function resumeEngagement(engagementId) {
    return updateEngagementStatus(engagementId, 'ACTIVE');
  }

  /**
   * Cancel engagement
   * @param {string} engagementId - Engagement ID
   * @returns {Object} - Canceled engagement or error
   */
  function cancelEngagement(engagementId) {
    return updateEngagementStatus(engagementId, 'CANCELED');
  }

  /**
   * Link milestone to engagement
   * @param {string} engagementId - Engagement ID
   * @param {string} milestoneId - Milestone ID
   * @returns {Object} - Updated engagement or error
   */
  function linkMilestone(engagementId, milestoneId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Engagements) {
      return { success: false, error: 'Data service not available' };
    }

    const engagement = PMTwinData.Engagements.getById(engagementId);
    if (!engagement) {
      return { success: false, error: 'Engagement not found' };
    }

    // Validate milestone exists
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Milestones) {
      const milestone = PMTwinData.Milestones.getById(milestoneId);
      if (!milestone) {
        return { success: false, error: 'Milestone not found' };
      }

      // Verify milestone belongs to same engagement
      if (milestone.engagementId !== engagementId) {
        return { success: false, error: 'Milestone does not belong to this engagement' };
      }
    }

    // Add milestone to engagement's milestoneIds if not already present
    const milestoneIds = engagement.milestoneIds || [];
    if (!milestoneIds.includes(milestoneId)) {
      milestoneIds.push(milestoneId);
      const updated = PMTwinData.Engagements.update(engagementId, { milestoneIds: milestoneIds });
      if (updated) {
        return { success: true, engagement: updated };
      }
    } else {
      return { success: true, engagement: engagement }; // Already linked
    }

    return { success: false, error: 'Failed to link milestone to engagement' };
  }

  // Export
  window.EngagementService = {
    createEngagement,
    getEngagement,
    getEngagementsByContract,
    getEngagementsByScope,
    updateEngagementStatus,
    assignEngagementToScope,
    completeEngagement,
    pauseEngagement,
    resumeEngagement,
    cancelEngagement,
    linkMilestone
  };

})();

