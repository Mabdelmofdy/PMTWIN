/**
 * Service Engagement Validator
 * Validates Service Engagement data and enforces business rules
 */

(function() {
  'use strict';

  /**
   * Validate Service Engagement creation
   * @param {Object} engagement - Engagement data to validate
   * @returns {Object} - Validation result with valid flag and errors array
   */
  function validateEngagementCreation(engagement) {
    const errors = [];

    if (!engagement) {
      return { valid: false, errors: ['Engagement data is required'] };
    }

    // Validate serviceRequestId
    if (!engagement.serviceRequestId) {
      errors.push('Service request ID is required');
    } else {
      // Check if service request exists
      if (typeof PMTwinData !== 'undefined' && PMTwinData.ServiceRequests) {
        const serviceRequest = PMTwinData.ServiceRequests.getById(engagement.serviceRequestId);
        if (!serviceRequest) {
          errors.push('Service request not found');
        }
      }
    }

    // Validate serviceProviderUserId
    if (!engagement.serviceProviderUserId) {
      errors.push('Service provider user ID is required');
    }

    // Validate serviceOfferId
    if (!engagement.serviceOfferId) {
      errors.push('Service offer ID is required');
    } else {
      // Check if service offer exists and is accepted
      if (typeof PMTwinData !== 'undefined' && PMTwinData.ServiceOffers) {
        const serviceOffer = PMTwinData.ServiceOffers.getById(engagement.serviceOfferId);
        if (!serviceOffer) {
          errors.push('Service offer not found');
        } else if (serviceOffer.status !== 'ACCEPTED') {
          errors.push('Service offer must be ACCEPTED to create engagement');
        } else if (serviceOffer.serviceRequestId !== engagement.serviceRequestId) {
          errors.push('Service offer does not match service request');
        } else if (serviceOffer.serviceProviderUserId !== engagement.serviceProviderUserId) {
          errors.push('Service offer does not match service provider');
        }
      }
    }

    // Check if there's already an active engagement for this request
    if (engagement.serviceRequestId) {
      if (typeof PMTwinData !== 'undefined' && PMTwinData.ServiceEngagements) {
        const engagements = PMTwinData.ServiceEngagements.getByServiceRequest(engagement.serviceRequestId);
        const activeEngagement = engagements.find(e => e.status === 'ACTIVE');
        if (activeEngagement) {
          errors.push('There is already an active engagement for this service request');
        }
      }
    }

    // Validate linkedSubProjectIds (optional, but must be array if provided)
    if (engagement.linkedSubProjectIds !== undefined) {
      if (!Array.isArray(engagement.linkedSubProjectIds)) {
        errors.push('Linked sub-project IDs must be an array');
      }
    }

    // Validate linkedMegaProjectId (optional)
    if (engagement.linkedMegaProjectId !== undefined && engagement.linkedMegaProjectId !== null) {
      if (typeof engagement.linkedMegaProjectId !== 'string' || engagement.linkedMegaProjectId.trim().length === 0) {
        errors.push('Linked mega-project ID must be a non-empty string if provided');
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
    const validStatuses = ['ACTIVE', 'COMPLETED', 'TERMINATED'];
    const statusTransitions = {
      'ACTIVE': ['COMPLETED', 'TERMINATED'],
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

    // Validate termination reason if status is TERMINATED
    if (newStatus === 'TERMINATED' && !updates.terminationReason) {
      errors.push('Termination reason is required when terminating an engagement');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate linking engagement to sub-project
   * @param {string} engagementId - Engagement ID
   * @param {string} subProjectId - Sub-project ID
   * @returns {Object} - Validation result
   */
  function validateSubProjectLink(engagementId, subProjectId) {
    const errors = [];

    if (!engagementId) {
      errors.push('Engagement ID is required');
    }

    if (!subProjectId) {
      errors.push('Sub-project ID is required');
    }

    // Check if engagement exists
    if (typeof PMTwinData !== 'undefined' && PMTwinData.ServiceEngagements) {
      const engagement = PMTwinData.ServiceEngagements.getById(engagementId);
      if (!engagement) {
        errors.push('Engagement not found');
      } else if (engagement.status !== 'ACTIVE') {
        errors.push('Can only link active engagements to sub-projects');
      }
    }

    // Note: We don't validate if sub-project exists here because
    // that would require access to the Projects domain, which violates
    // domain boundaries. The linking is informational only.

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Export
  window.ServiceEngagementValidator = {
    validateEngagementCreation,
    validateStatusUpdate,
    validateSubProjectLink
  };

})();

