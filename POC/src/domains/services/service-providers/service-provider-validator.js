/**
 * Service Provider Profile Validator
 * Validates Service Provider profile data
 */

(function() {
  'use strict';

  /**
   * Validate Service Provider profile
   * @param {Object} profile - Profile data to validate
   * @returns {Object} - Validation result with valid flag and errors array
   */
  function validateServiceProviderProfile(profile) {
    const errors = [];

    if (!profile) {
      return { valid: false, errors: ['Profile data is required'] };
    }

    // Validate userId
    if (!profile.userId) {
      errors.push('User ID is required');
    }

    // Validate providerType
    const validProviderTypes = ['INDIVIDUAL', 'CONSULTANT', 'FIRM'];
    if (!profile.providerType || !validProviderTypes.includes(profile.providerType)) {
      errors.push('Provider type must be one of: INDIVIDUAL, CONSULTANT, FIRM');
    }

    // Validate skills
    if (!Array.isArray(profile.skills)) {
      errors.push('Skills must be an array');
    } else if (profile.skills.length === 0) {
      errors.push('At least one skill is required');
    }

    // Validate certifications (optional, but must be array if provided)
    if (profile.certifications !== undefined && !Array.isArray(profile.certifications)) {
      errors.push('Certifications must be an array');
    }

    // Validate availabilityStatus
    const validStatuses = ['AVAILABLE', 'BUSY', 'UNAVAILABLE'];
    if (!profile.availabilityStatus || !validStatuses.includes(profile.availabilityStatus)) {
      errors.push('Availability status must be one of: AVAILABLE, BUSY, UNAVAILABLE');
    }

    // Validate pricingModel
    const validPricingModels = ['HOURLY', 'FIXED', 'RETAINER'];
    if (!profile.pricingModel || !validPricingModels.includes(profile.pricingModel)) {
      errors.push('Pricing model must be one of: HOURLY, FIXED, RETAINER');
    }

    // Validate hourlyRate (required if pricingModel is HOURLY)
    if (profile.pricingModel === 'HOURLY') {
      if (profile.hourlyRate === null || profile.hourlyRate === undefined) {
        errors.push('Hourly rate is required when pricing model is HOURLY');
      } else if (typeof profile.hourlyRate !== 'number' || profile.hourlyRate <= 0) {
        errors.push('Hourly rate must be a positive number');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Export
  window.ServiceProviderValidator = {
    validateServiceProviderProfile
  };

})();

