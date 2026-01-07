/**
 * Track-Specific Access Guards
 * Enforces boundaries between Project Track and Service Track
 */

(function() {
  'use strict';

  /**
   * Check if user is a Service Provider (skill_service_provider role)
   * @returns {boolean} - True if user is a Service Provider
   */
  function requireServiceProvider() {
    if (typeof PMTwinData === 'undefined' || typeof PMTwinData.Sessions === 'undefined') {
      return false;
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    return currentUser.role === 'skill_service_provider';
  }

  /**
   * Check if user is Entity, Beneficiary, or Vendor
   * @returns {boolean} - True if user is Entity/Beneficiary/Vendor
   */
  function requireEntityOrVendor() {
    if (typeof PMTwinData === 'undefined' || typeof PMTwinData.Sessions === 'undefined') {
      return false;
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const allowedRoles = ['entity', 'beneficiary', 'vendor'];
    return allowedRoles.includes(currentUser.role);
  }

  /**
   * Block Sub-Contractor from accessing service endpoints
   * @returns {boolean} - True if access should be blocked
   */
  function blockSubContractor() {
    if (typeof PMTwinData === 'undefined' || typeof PMTwinData.Sessions === 'undefined') {
      return false;
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    return currentUser.role === 'sub_contractor';
  }

  /**
   * Block Service Provider from accessing project bidding endpoints
   * @returns {boolean} - True if access should be blocked
   */
  function blockServiceProviderFromProjects() {
    if (typeof PMTwinData === 'undefined' || typeof PMTwinData.Sessions === 'undefined') {
      return false;
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    // Block skill_service_provider role (new Service Provider entity type)
    // Note: Legacy service_provider role (mapped to vendor) should still have access
    return currentUser.role === 'skill_service_provider';
  }

  /**
   * Check if user can access service track features
   * @returns {boolean} - True if user can access services
   */
  function canAccessServiceTrack() {
    if (typeof PMTwinData === 'undefined' || typeof PMTwinData.Sessions === 'undefined') {
      return false;
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    // Block sub_contractor from service endpoints
    if (currentUser.role === 'sub_contractor') {
      return false;
    }

    // Allow entity, beneficiary, vendor, and skill_service_provider
    const allowedRoles = ['entity', 'beneficiary', 'vendor', 'skill_service_provider'];
    return allowedRoles.includes(currentUser.role);
  }

  /**
   * Check if user can access project track features
   * @returns {boolean} - True if user can access projects
   */
  function canAccessProjectTrack() {
    if (typeof PMTwinData === 'undefined' || typeof PMTwinData.Sessions === 'undefined') {
      return false;
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    // Block skill_service_provider from project bidding
    if (currentUser.role === 'skill_service_provider') {
      return false;
    }

    // Allow other roles (entity, beneficiary, vendor, sub_contractor, etc.)
    // Note: Legacy service_provider role (mapped to vendor) should still have access
    return true;
  }

  // Export
  window.TrackGuards = {
    requireServiceProvider,
    requireEntityOrVendor,
    blockSubContractor,
    blockServiceProviderFromProjects,
    canAccessServiceTrack,
    canAccessProjectTrack
  };

})();

