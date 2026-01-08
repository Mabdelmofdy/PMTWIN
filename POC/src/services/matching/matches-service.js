/**
 * Matches Service
 * Handles role-based opportunity matching
 */

(function() {
  'use strict';

  // ============================================
  // Get Matches for Vendor
  // ============================================
  async function getMatchesForVendor(companyId) {
    if (typeof OpportunityMatchingService === 'undefined') {
      return { success: false, error: 'Matching service not available' };
    }

    try {
      const matches = OpportunityMatchingService.findMatchesForCompany(companyId, 'vendor');
      return {
        success: true,
        matches: matches
      };
    } catch (error) {
      console.error('Error getting vendor matches:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // Get Matches for Service Provider
  // ============================================
  async function getMatchesForServiceProvider(companyId) {
    if (typeof OpportunityMatchingService === 'undefined') {
      return { success: false, error: 'Matching service not available' };
    }

    try {
      const matches = OpportunityMatchingService.findMatchesForCompany(companyId, 'service_provider');
      return {
        success: true,
        matches: matches
      };
    } catch (error) {
      console.error('Error getting service provider matches:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // Get Matches for Consultant
  // ============================================
  async function getMatchesForConsultant(companyId) {
    if (typeof OpportunityMatchingService === 'undefined') {
      return { success: false, error: 'Matching service not available' };
    }

    try {
      const matches = OpportunityMatchingService.findMatchesForCompany(companyId, 'consultant');
      return {
        success: true,
        matches: matches
      };
    } catch (error) {
      console.error('Error getting consultant matches:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // Get Matches for Current User (Auto-detect role)
  // ============================================
  async function getMatchesForCurrentUser() {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const companyId = currentUser.id; // Users represent companies
    const userRole = currentUser.role || currentUser.userType;

    // Map role to matching function
    if (userRole === 'vendor' || userRole === 'vendor_corporate' || userRole === 'vendor_individual') {
      return await getMatchesForVendor(companyId);
    } else if (userRole === 'service_provider' || userRole === 'skill_service_provider') {
      return await getMatchesForServiceProvider(companyId);
    } else if (userRole === 'consultant') {
      return await getMatchesForConsultant(companyId);
    } else {
      return { success: false, error: 'User role does not support matching' };
    }
  }

  // ============================================
  // Public API
  // ============================================
  window.MatchesService = {
    getMatchesForVendor,
    getMatchesForServiceProvider,
    getMatchesForConsultant,
    getMatchesForCurrentUser
  };

})();
