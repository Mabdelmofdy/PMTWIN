/**
 * Service Offer Service
 * Business logic for Service Offer management
 */

(function() {
  'use strict';

  /**
   * Submit service offer
   * @param {string} serviceRequestId - Service request ID
   * @param {Object} offerData - Offer data
   * @returns {Object} - Created offer or error
   */
  function submitOffer(serviceRequestId, offerData) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceOffers) {
      return { success: false, error: 'Data service not available' };
    }

    // Check guard
    if (typeof ServiceTrackGuards !== 'undefined' && !ServiceTrackGuards.guardServiceOfferSubmission()) {
      return { success: false, error: 'Only Service Providers can submit offers' };
    }

    // Get current user
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Set service provider user ID
    offerData.serviceRequestId = serviceRequestId;
    offerData.serviceProviderUserId = currentUser.id;

    // Validate
    if (typeof ServiceOfferValidator !== 'undefined') {
      const validation = ServiceOfferValidator.validateServiceOffer(offerData);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    // Create offer
    const offer = PMTwinData.ServiceOffers.create(offerData);
    if (offer) {
      return { success: true, offer: offer };
    }

    return { success: false, error: 'Failed to submit offer' };
  }

  /**
   * Get offer by ID
   * @param {string} id - Offer ID
   * @returns {Object} - Offer or null
   */
  function getOffer(id) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceOffers) {
      return null;
    }

    return PMTwinData.ServiceOffers.getById(id);
  }

  /**
   * Get offers for a service request
   * @param {string} serviceRequestId - Service request ID
   * @returns {Array} - Array of offers
   */
  function getOffersForRequest(serviceRequestId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceOffers) {
      return [];
    }

    return PMTwinData.ServiceOffers.getByServiceRequest(serviceRequestId);
  }

  /**
   * Get current provider's offers
   * @returns {Array} - Array of offers
   */
  function getMyOffers() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Sessions || !PMTwinData.ServiceOffers) {
      return [];
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    return PMTwinData.ServiceOffers.getByServiceProvider(currentUser.id);
  }

  /**
   * Accept offer
   * @param {string} offerId - Offer ID
   * @returns {Object} - Result
   */
  function acceptOffer(offerId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceOffers) {
      return { success: false, error: 'Data service not available' };
    }

    // Check guard
    if (typeof TrackGuards !== 'undefined' && !TrackGuards.requireEntityOrVendor()) {
      return { success: false, error: 'Only Entity, Beneficiary, or Vendor can accept offers' };
    }

    // Validate acceptance
    if (typeof ServiceOfferValidator !== 'undefined') {
      const validation = ServiceOfferValidator.validateOfferAcceptance(offerId);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    // Update offer status
    const offer = PMTwinData.ServiceOffers.getById(offerId);
    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }

    const updated = PMTwinData.ServiceOffers.update(offerId, { status: 'ACCEPTED' });
    if (!updated) {
      return { success: false, error: 'Failed to accept offer' };
    }

    // Update service request status
    if (PMTwinData.ServiceRequests) {
      PMTwinData.ServiceRequests.update(offer.serviceRequestId, { status: 'APPROVED' });
    }

    // Create engagement
    if (PMTwinData.ServiceEngagements) {
      const engagementData = {
        serviceRequestId: offer.serviceRequestId,
        serviceProviderUserId: offer.serviceProviderUserId,
        serviceOfferId: offerId
      };

      const engagement = PMTwinData.ServiceEngagements.create(engagementData);
      if (engagement) {
        return { success: true, offer: updated, engagement: engagement };
      }
    }

    return { success: true, offer: updated };
  }

  /**
   * Reject offer
   * @param {string} offerId - Offer ID
   * @param {string} reason - Rejection reason
   * @returns {Object} - Result
   */
  function rejectOffer(offerId, reason) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceOffers) {
      return { success: false, error: 'Data service not available' };
    }

    // Check guard
    if (typeof TrackGuards !== 'undefined' && !TrackGuards.requireEntityOrVendor()) {
      return { success: false, error: 'Only Entity, Beneficiary, or Vendor can reject offers' };
    }

    const updated = PMTwinData.ServiceOffers.update(offerId, { 
      status: 'REJECTED',
      rejectionReason: reason
    });

    if (updated) {
      return { success: true, offer: updated };
    }

    return { success: false, error: 'Failed to reject offer' };
  }

  /**
   * Withdraw offer
   * @param {string} offerId - Offer ID
   * @returns {Object} - Result
   */
  function withdrawOffer(offerId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceOffers) {
      return { success: false, error: 'Data service not available' };
    }

    // Check guard
    if (typeof TrackGuards !== 'undefined' && !TrackGuards.requireServiceProvider()) {
      return { success: false, error: 'Only Service Providers can withdraw offers' };
    }

    // Get current user
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const offer = PMTwinData.ServiceOffers.getById(offerId);
    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }

    // Users can only withdraw their own offers
    if (offer.serviceProviderUserId !== currentUser.id) {
      return { success: false, error: 'You can only withdraw your own offers' };
    }

    // Can only withdraw submitted offers
    if (offer.status !== 'SUBMITTED') {
      return { success: false, error: 'Can only withdraw submitted offers' };
    }

    const updated = PMTwinData.ServiceOffers.update(offerId, { status: 'WITHDRAWN' });
    if (updated) {
      return { success: true, offer: updated };
    }

    return { success: false, error: 'Failed to withdraw offer' };
  }

  // Export
  window.ServiceOfferService = {
    submitOffer,
    getOffer,
    getOffersForRequest,
    getMyOffers,
    acceptOffer,
    rejectOffer,
    withdrawOffer
  };

})();

