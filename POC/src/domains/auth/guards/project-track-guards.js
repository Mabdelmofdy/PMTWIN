/**
 * Project Track Guards
 * Guards specific to Project Track endpoints
 */

(function() {
  'use strict';

  /**
   * Guard for project proposal submission endpoints
   * Blocks skill_service_provider role
   * @returns {boolean} - True if access allowed
   */
  function guardProjectProposalSubmission() {
    if (typeof TrackGuards === 'undefined') {
      console.error('TrackGuards not available');
      return false;
    }

    // Block skill_service_provider from project bidding
    if (TrackGuards.blockServiceProviderFromProjects()) {
      return false;
    }

    return true;
  }

  /**
   * Guard for project bidding endpoints
   * Blocks skill_service_provider role
   * @returns {boolean} - True if access allowed
   */
  function guardProjectBidding() {
    if (typeof TrackGuards === 'undefined') {
      console.error('TrackGuards not available');
      return false;
    }

    // Block skill_service_provider from project bidding
    if (TrackGuards.blockServiceProviderFromProjects()) {
      return false;
    }

    return true;
  }

  /**
   * Guard for project creation endpoints
   * Requires entity or beneficiary role
   * @returns {boolean} - True if access allowed
   */
  function guardProjectCreation() {
    if (typeof PMTwinData === 'undefined' || typeof PMTwinData.Sessions === 'undefined') {
      return false;
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const allowedRoles = ['entity', 'beneficiary'];
    return allowedRoles.includes(currentUser.role);
  }

  // Export
  window.ProjectTrackGuards = {
    guardProjectProposalSubmission,
    guardProjectBidding,
    guardProjectCreation
  };

})();

