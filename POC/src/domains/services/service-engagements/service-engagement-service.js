/**
 * Service Engagement Service
 * Business logic for Service Engagement lifecycle management
 */

(function() {
  'use strict';

  /**
   * Create engagement from accepted offer
   * @param {string} serviceRequestId - Service request ID
   * @param {string} serviceOfferId - Service offer ID
   * @returns {Object} - Created engagement or error
   */
  function createEngagement(serviceRequestId, serviceOfferId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceEngagements) {
      return { success: false, error: 'Data service not available' };
    }

    // Get offer
    if (!PMTwinData.ServiceOffers) {
      return { success: false, error: 'Service offers not available' };
    }

    const offer = PMTwinData.ServiceOffers.getById(serviceOfferId);
    if (!offer) {
      return { success: false, error: 'Service offer not found' };
    }

    if (offer.status !== 'ACCEPTED') {
      return { success: false, error: 'Service offer must be ACCEPTED to create engagement' };
    }

    const engagementData = {
      serviceRequestId: serviceRequestId,
      serviceProviderUserId: offer.serviceProviderUserId,
      serviceOfferId: serviceOfferId
    };

    // Validate
    if (typeof ServiceEngagementValidator !== 'undefined') {
      const validation = ServiceEngagementValidator.validateEngagementCreation(engagementData);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    // Create engagement
    const engagement = PMTwinData.ServiceEngagements.create(engagementData);
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
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceEngagements) {
      return null;
    }

    return PMTwinData.ServiceEngagements.getById(id);
  }

  /**
   * Get current user's engagements
   * @returns {Array} - Array of engagements
   */
  function getMyEngagements() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Sessions || !PMTwinData.ServiceEngagements) {
      return [];
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    // Get engagements where user is either requester or provider
    const allEngagements = PMTwinData.ServiceEngagements.getAll();
    return allEngagements.filter(engagement => {
      // Check if user is the service provider
      if (engagement.serviceProviderUserId === currentUser.id) {
        return true;
      }

      // Check if user is the requester
      if (PMTwinData.ServiceRequests) {
        const request = PMTwinData.ServiceRequests.getById(engagement.serviceRequestId);
        if (request && request.requesterId === currentUser.id) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Update engagement status
   * @param {string} id - Engagement ID
   * @param {string} status - New status
   * @param {Object} updates - Additional updates
   * @returns {Object} - Updated engagement or error
   */
  function updateEngagementStatus(id, status, updates = {}) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceEngagements) {
      return { success: false, error: 'Data service not available' };
    }

    const engagement = PMTwinData.ServiceEngagements.getById(id);
    if (!engagement) {
      return { success: false, error: 'Engagement not found' };
    }

    // Validate status update
    if (typeof ServiceEngagementValidator !== 'undefined') {
      const validation = ServiceEngagementValidator.validateStatusUpdate(engagement.status, status, updates);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    const updateData = { status: status, ...updates };
    const updated = PMTwinData.ServiceEngagements.update(id, updateData);
    if (updated) {
      return { success: true, engagement: updated };
    }

    return { success: false, error: 'Failed to update engagement status' };
  }

  /**
   * Complete engagement
   * @param {string} id - Engagement ID
   * @returns {Object} - Updated engagement or error
   */
  function completeEngagement(id) {
    return updateEngagementStatus(id, 'COMPLETED');
  }

  /**
   * Link engagement to sub-project
   * @param {string} engagementId - Engagement ID
   * @param {string} subProjectId - Sub-project ID
   * @returns {Object} - Updated engagement or error
   */
  function linkEngagementToSubProject(engagementId, subProjectId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceEngagements) {
      return { success: false, error: 'Data service not available' };
    }

    // Validate
    if (typeof ServiceEngagementValidator !== 'undefined') {
      const validation = ServiceEngagementValidator.validateSubProjectLink(engagementId, subProjectId);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    const engagement = PMTwinData.ServiceEngagements.getById(engagementId);
    if (!engagement) {
      return { success: false, error: 'Engagement not found' };
    }

    // Add sub-project ID to linked list
    const linkedSubProjectIds = engagement.linkedSubProjectIds || [];
    if (!linkedSubProjectIds.includes(subProjectId)) {
      linkedSubProjectIds.push(subProjectId);
    }

    const updated = PMTwinData.ServiceEngagements.update(engagementId, {
      linkedSubProjectIds: linkedSubProjectIds
    });

    if (updated) {
      return { success: true, engagement: updated };
    }

    return { success: false, error: 'Failed to link engagement to sub-project' };
  }

  /**
   * Link engagement to mega-project
   * @param {string} engagementId - Engagement ID
   * @param {string} megaProjectId - Mega-project ID
   * @returns {Object} - Updated engagement or error
   */
  function linkEngagementToMegaProject(engagementId, megaProjectId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceEngagements) {
      return { success: false, error: 'Data service not available' };
    }

    const engagement = PMTwinData.ServiceEngagements.getById(engagementId);
    if (!engagement) {
      return { success: false, error: 'Engagement not found' };
    }

    const updated = PMTwinData.ServiceEngagements.update(engagementId, {
      linkedMegaProjectId: megaProjectId
    });

    if (updated) {
      return { success: true, engagement: updated };
    }

    return { success: false, error: 'Failed to link engagement to mega-project' };
  }

  /**
   * Get engagements for a sub-project
   * @param {string} subProjectId - Sub-project ID
   * @returns {Array} - Array of engagements
   */
  function getEngagementsForSubProject(subProjectId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceEngagements) {
      return [];
    }

    return PMTwinData.ServiceEngagements.getBySubProject(subProjectId);
  }

  // Export
  window.ServiceEngagementService = {
    createEngagement,
    getEngagement,
    getMyEngagements,
    updateEngagementStatus,
    completeEngagement,
    linkEngagementToSubProject,
    linkEngagementToMegaProject,
    getEngagementsForSubProject
  };

})();

