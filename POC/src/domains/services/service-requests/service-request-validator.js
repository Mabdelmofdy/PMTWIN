/**
 * Service Request Validator
 * Validates Service Request data and enforces business rules
 */

(function() {
  'use strict';

  /**
   * Validate Service Request
   * @param {Object} request - Request data to validate
   * @returns {Object} - Validation result with valid flag and errors array
   */
  function validateServiceRequest(request) {
    const errors = [];

    if (!request) {
      return { valid: false, errors: ['Service request data is required'] };
    }

    // Validate requesterType
    const validRequesterTypes = ['ENTITY', 'VENDOR'];
    if (!request.requesterType || !validRequesterTypes.includes(request.requesterType)) {
      errors.push('Requester type must be ENTITY or VENDOR');
    }

    // Validate requesterId
    if (!request.requesterId) {
      errors.push('Requester ID is required');
    }

    // Validate title
    if (!request.title || request.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (request.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters');
    }

    // Validate description
    if (!request.description || request.description.trim().length === 0) {
      errors.push('Description is required');
    } else if (request.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters');
    }

    // Validate requiredSkills
    if (!Array.isArray(request.requiredSkills)) {
      errors.push('Required skills must be an array');
    } else if (request.requiredSkills.length === 0) {
      errors.push('At least one required skill is needed');
    }

    // Validate budget
    if (request.budget) {
      if (typeof request.budget.min !== 'number' || request.budget.min < 0) {
        errors.push('Budget minimum must be a non-negative number');
      }
      if (typeof request.budget.max !== 'number' || request.budget.max < 0) {
        errors.push('Budget maximum must be a non-negative number');
      }
      if (request.budget.min > request.budget.max) {
        errors.push('Budget minimum cannot be greater than maximum');
      }
      if (!request.budget.currency || request.budget.currency.length !== 3) {
        errors.push('Budget currency must be a 3-letter code (e.g., SAR)');
      }
    }

    // Validate timeline
    if (request.timeline) {
      if (request.timeline.startDate) {
        const startDate = new Date(request.timeline.startDate);
        if (isNaN(startDate.getTime())) {
          errors.push('Start date must be a valid date');
        } else if (startDate < new Date()) {
          errors.push('Start date cannot be in the past');
        }
      }
      if (request.timeline.duration !== undefined) {
        if (typeof request.timeline.duration !== 'number' || request.timeline.duration <= 0) {
          errors.push('Duration must be a positive number (days)');
        }
      }
    }

    // Check requester role (business rule)
    if (typeof PMTwinData !== 'undefined' && typeof PMTwinData.Sessions !== 'undefined') {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (currentUser) {
        const allowedRoles = ['entity', 'beneficiary', 'vendor'];
        if (!allowedRoles.includes(currentUser.role)) {
          errors.push('Only Entity, Beneficiary, or Vendor can create service requests');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate Service Request status update
   * @param {string} currentStatus - Current status
   * @param {string} newStatus - New status
   * @returns {Object} - Validation result
   */
  function validateStatusUpdate(currentStatus, newStatus) {
    const errors = [];
    const validStatuses = ['OPEN', 'OFFERED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    const statusTransitions = {
      'OPEN': ['OFFERED', 'CANCELLED'],
      'OFFERED': ['OPEN', 'APPROVED', 'CANCELLED'],
      'APPROVED': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [],
      'CANCELLED': []
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

  // Export
  window.ServiceRequestValidator = {
    validateServiceRequest,
    validateStatusUpdate
  };

})();

