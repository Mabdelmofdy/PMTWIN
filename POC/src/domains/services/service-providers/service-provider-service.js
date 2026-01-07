/**
 * Service Provider Service
 * Business logic for Service Provider profile management
 */

(function() {
  'use strict';

  /**
   * Create or update service provider profile
   * @param {Object} profileData - Profile data
   * @returns {Object} - Created/updated profile or error
   */
  function createProfile(profileData) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceProviderProfiles) {
      return { success: false, error: 'Data service not available' };
    }

    // Check guard
    if (typeof TrackGuards !== 'undefined' && !TrackGuards.requireServiceProvider()) {
      return { success: false, error: 'Only Service Providers can create profiles' };
    }

    // Validate
    if (typeof ServiceProviderValidator !== 'undefined') {
      const validation = ServiceProviderValidator.validateServiceProviderProfile(profileData);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    // Get current user
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Set userId from current user
    profileData.userId = currentUser.id;

    // Create or update profile
    const existingProfile = PMTwinData.ServiceProviderProfiles.getByUserId(currentUser.id);
    let profile;
    if (existingProfile) {
      profile = PMTwinData.ServiceProviderProfiles.update(existingProfile.id, profileData);
    } else {
      profile = PMTwinData.ServiceProviderProfiles.create(profileData);
    }

    if (profile) {
      return { success: true, profile: profile };
    }

    return { success: false, error: 'Failed to create/update profile' };
  }

  /**
   * Get profile by user ID
   * @param {string} userId - User ID
   * @returns {Object} - Profile or null
   */
  function getProfile(userId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceProviderProfiles) {
      return null;
    }

    return PMTwinData.ServiceProviderProfiles.getByUserId(userId);
  }

  /**
   * Get current user's profile
   * @returns {Object} - Profile or null
   */
  function getMyProfile() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Sessions) {
      return null;
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    return getProfile(currentUser.id);
  }

  /**
   * Search providers by filters
   * @param {Object} filters - Search filters (skills, location, availability, etc.)
   * @returns {Array} - Array of matching profiles
   */
  function searchProviders(filters = {}) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceProviderProfiles) {
      return [];
    }

    let profiles = PMTwinData.ServiceProviderProfiles.getAll();

    // Filter by skills
    if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
      profiles = profiles.filter(profile => {
        if (!profile.skills || !Array.isArray(profile.skills)) return false;
        return filters.skills.some(skill => 
          profile.skills.some(pSkill => 
            pSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(pSkill.toLowerCase())
          )
        );
      });
    }

    // Filter by availability
    if (filters.availabilityStatus) {
      profiles = profiles.filter(profile => profile.availabilityStatus === filters.availabilityStatus);
    }

    // Filter by provider type
    if (filters.providerType) {
      profiles = profiles.filter(profile => profile.providerType === filters.providerType);
    }

    // Filter by pricing model
    if (filters.pricingModel) {
      profiles = profiles.filter(profile => profile.pricingModel === filters.pricingModel);
    }

    // Filter by hourly rate range
    if (filters.minHourlyRate !== undefined || filters.maxHourlyRate !== undefined) {
      profiles = profiles.filter(profile => {
        if (!profile.hourlyRate) return false;
        if (filters.minHourlyRate !== undefined && profile.hourlyRate < filters.minHourlyRate) return false;
        if (filters.maxHourlyRate !== undefined && profile.hourlyRate > filters.maxHourlyRate) return false;
        return true;
      });
    }

    return profiles;
  }

  /**
   * Search provider skills directly
   * @param {Object} skillFilters - Skill-based filters
   * @returns {Array} - Array of matching profiles with skill matches
   */
  function searchProviderSkills(skillFilters = {}) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceProviderProfiles) {
      return [];
    }

    let profiles = PMTwinData.ServiceProviderProfiles.getAll();

    // Filter by required skills
    if (skillFilters.requiredSkills && Array.isArray(skillFilters.requiredSkills) && skillFilters.requiredSkills.length > 0) {
      profiles = profiles.map(profile => {
        if (!profile.skills || !Array.isArray(profile.skills)) {
          return { ...profile, skillMatchScore: 0, matchedSkills: [] };
        }

        const matchedSkills = profile.skills.filter(skill =>
          skillFilters.requiredSkills.some(reqSkill =>
            skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
            reqSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );

        const skillMatchScore = matchedSkills.length / skillFilters.requiredSkills.length;

        return {
          ...profile,
          skillMatchScore: skillMatchScore,
          matchedSkills: matchedSkills
        };
      }).filter(profile => profile.skillMatchScore > 0);
    }

    // Sort by skill match score
    profiles.sort((a, b) => b.skillMatchScore - a.skillMatchScore);

    return profiles;
  }

  /**
   * Update profile
   * @param {string} userId - User ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} - Updated profile or error
   */
  function updateProfile(userId, updates) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceProviderProfiles) {
      return { success: false, error: 'Data service not available' };
    }

    // Check guard
    if (typeof TrackGuards !== 'undefined' && !TrackGuards.requireServiceProvider()) {
      return { success: false, error: 'Only Service Providers can update profiles' };
    }

    // Get current user
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Users can only update their own profile
    if (currentUser.id !== userId) {
      return { success: false, error: 'You can only update your own profile' };
    }

    // Validate updates
    if (typeof ServiceProviderValidator !== 'undefined') {
      const existingProfile = PMTwinData.ServiceProviderProfiles.getByUserId(userId);
      if (existingProfile) {
        const updatedProfile = { ...existingProfile, ...updates };
        const validation = ServiceProviderValidator.validateServiceProviderProfile(updatedProfile);
        if (!validation.valid) {
          return { success: false, errors: validation.errors };
        }
      }
    }

    const profile = PMTwinData.ServiceProviderProfiles.getByUserId(userId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    const updated = PMTwinData.ServiceProviderProfiles.update(profile.id, updates);
    if (updated) {
      return { success: true, profile: updated };
    }

    return { success: false, error: 'Failed to update profile' };
  }

  // Export
  window.ServiceProviderService = {
    createProfile,
    getProfile,
    getMyProfile,
    searchProviders,
    searchProviderSkills,
    updateProfile
  };

})();

