/**
 * Service Track Guards
 * Guards specific to Service Track endpoints
 */

(function() {
  'use strict';

  /**
   * Guard for Service Provider profile endpoints
   * Requires skill_service_provider role
   * @returns {boolean} - True if access allowed
   */
  function guardServiceProviderProfile() {
    if (typeof TrackGuards === 'undefined') {
      console.error('TrackGuards not available');
      return false;
    }

    return TrackGuards.requireServiceProvider();
  }

  /**
   * Guard for Service Request creation endpoints
   * Requires entity, beneficiary, or vendor role
   * Blocks sub_contractor
   * @returns {boolean} - True if access allowed
   */
  function guardServiceRequestCreation() {
    if (typeof TrackGuards === 'undefined') {
      console.error('TrackGuards not available');
      return false;
    }

    if (TrackGuards.blockSubContractor()) {
      return false;
    }

    return TrackGuards.requireEntityOrVendor();
  }

  /**
   * Guard for Service Offer submission endpoints
   * Requires skill_service_provider role
   * @returns {boolean} - True if access allowed
   */
  function guardServiceOfferSubmission() {
    if (typeof TrackGuards === 'undefined') {
      console.error('TrackGuards not available');
      return false;
    }

    return TrackGuards.requireServiceProvider();
  }

  /**
   * Guard for Service Engagement management endpoints
   * Requires skill_service_provider role or entity/vendor for acceptance
   * @param {string} action - Action being performed (create, accept, manage)
   * @returns {boolean} - True if access allowed
   */
  function guardServiceEngagement(action = 'manage') {
    if (typeof TrackGuards === 'undefined') {
      console.error('TrackGuards not available');
      return false;
    }

    if (action === 'accept') {
      // Accepting offers requires entity/vendor
      return TrackGuards.requireEntityOrVendor();
    } else {
      // Creating/managing engagements requires service provider
      return TrackGuards.requireServiceProvider();
    }
  }

  /**
   * Guard for Service Provider Skills search endpoints
   * Requires entity, beneficiary, or vendor role
   * Blocks sub_contractor
   * @returns {boolean} - True if access allowed
   */
  function guardServiceProviderSkillsSearch() {
    if (typeof TrackGuards === 'undefined') {
      console.error('TrackGuards not available');
      return false;
    }

    if (TrackGuards.blockSubContractor()) {
      return false;
    }

    return TrackGuards.requireEntityOrVendor();
  }

  // Export
  window.ServiceTrackGuards = {
    guardServiceProviderProfile,
    guardServiceRequestCreation,
    guardServiceOfferSubmission,
    guardServiceEngagement,
    guardServiceProviderSkillsSearch
  };

})();

