/**
 * Service Offer Validator
 * Validates Service Offer data and enforces business rules
 */

(function() {
  'use strict';

  /**
   * Validate Service Offer
   * @param {Object} offer - Offer data to validate
   * @returns {Object} - Validation result with valid flag and errors array
   */
  function validateServiceOffer(offer) {
    const errors = [];

    if (!offer) {
      return { valid: false, errors: ['Service offer data is required'] };
    }

    // Validate serviceRequestId
    if (!offer.serviceRequestId) {
      errors.push('Service request ID is required');
    } else {
      // Check if service request exists
      if (typeof PMTwinData !== 'undefined' && PMTwinData.ServiceRequests) {
        const serviceRequest = PMTwinData.ServiceRequests.getById(offer.serviceRequestId);
        if (!serviceRequest) {
          errors.push('Service request not found');
        } else if (serviceRequest.status !== 'OPEN') {
          errors.push('Service request must be OPEN to accept offers');
        }
      }
    }

    // Validate serviceProviderUserId
    if (!offer.serviceProviderUserId) {
      errors.push('Service provider user ID is required');
    }

    // Validate proposedPricing
    if (!offer.proposedPricing) {
      errors.push('Proposed pricing is required');
    } else {
      const validPricingModels = ['HOURLY', 'FIXED', 'RETAINER'];
      if (!offer.proposedPricing.model || !validPricingModels.includes(offer.proposedPricing.model)) {
        errors.push('Pricing model must be one of: HOURLY, FIXED, RETAINER');
      }

      if (typeof offer.proposedPricing.amount !== 'number' || offer.proposedPricing.amount <= 0) {
        errors.push('Pricing amount must be a positive number');
      }

      if (!offer.proposedPricing.currency || offer.proposedPricing.currency.length !== 3) {
        errors.push('Pricing currency must be a 3-letter code (e.g., SAR)');
      }
    }

    // Validate message (optional but recommended)
    if (offer.message && offer.message.trim().length > 0 && offer.message.trim().length < 10) {
      errors.push('Message must be at least 10 characters if provided');
    }

    // Check service provider role (business rule)
    if (typeof PMTwinData !== 'undefined' && typeof PMTwinData.Sessions !== 'undefined') {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (currentUser) {
        if (currentUser.role !== 'skill_service_provider') {
          errors.push('Only Service Providers (skill_service_provider role) can submit offers');
        }
      }
    }

    // Check if provider already submitted an offer for this request
    if (offer.serviceRequestId && offer.serviceProviderUserId) {
      if (typeof PMTwinData !== 'undefined' && PMTwinData.ServiceOffers) {
        const existingOffers = PMTwinData.ServiceOffers.getByServiceRequest(offer.serviceRequestId);
        const existingOffer = existingOffers.find(o => 
          o.serviceProviderUserId === offer.serviceProviderUserId && 
          (o.status === 'SUBMITTED' || o.status === 'ACCEPTED')
        );
        if (existingOffer) {
          errors.push('You have already submitted an offer for this service request');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate offer acceptance
   * @param {string} offerId - Offer ID
   * @returns {Object} - Validation result
   */
  function validateOfferAcceptance(offerId) {
    const errors = [];

    if (!offerId) {
      return { valid: false, errors: ['Offer ID is required'] };
    }

    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceOffers) {
      return { valid: false, errors: ['Data service not available'] };
    }

    const offer = PMTwinData.ServiceOffers.getById(offerId);
    if (!offer) {
      errors.push('Offer not found');
    } else {
      if (offer.status !== 'SUBMITTED') {
        errors.push('Only submitted offers can be accepted');
      }

      // Check if service request is still open
      if (PMTwinData.ServiceRequests) {
        const serviceRequest = PMTwinData.ServiceRequests.getById(offer.serviceRequestId);
        if (!serviceRequest) {
          errors.push('Service request not found');
        } else if (serviceRequest.status !== 'OPEN') {
          errors.push('Service request must be OPEN to accept offers');
        }
      }

      // Check if there's already an active engagement for this request
      if (PMTwinData.ServiceEngagements) {
        const engagements = PMTwinData.ServiceEngagements.getByServiceRequest(offer.serviceRequestId);
        const activeEngagement = engagements.find(e => e.status === 'ACTIVE');
        if (activeEngagement) {
          errors.push('There is already an active engagement for this service request');
        }
      }
    }

    // Check requester role (business rule)
    if (typeof PMTwinData !== 'undefined' && typeof PMTwinData.Sessions !== 'undefined') {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (currentUser) {
        const allowedRoles = ['entity', 'beneficiary', 'vendor'];
        if (!allowedRoles.includes(currentUser.role)) {
          errors.push('Only Entity, Beneficiary, or Vendor can accept service offers');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Export
  window.ServiceOfferValidator = {
    validateServiceOffer,
    validateOfferAcceptance
  };

})();

