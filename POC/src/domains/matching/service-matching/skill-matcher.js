/**
 * Skill Matcher
 * Skill-based matching algorithm for Service Providers
 */

(function() {
  'use strict';

  /**
   * Calculate skill overlap score between provider skills and required skills
   * @param {Array} providerSkills - Provider's skills
   * @param {Array} requiredSkills - Required skills
   * @returns {number} - Match score (0-1)
   */
  function calculateSkillMatch(providerSkills, requiredSkills) {
    if (!Array.isArray(providerSkills) || providerSkills.length === 0) {
      return 0;
    }

    if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return 0;
    }

    // Normalize skills to lowercase for comparison
    const normalizedProviderSkills = providerSkills.map(s => s.toLowerCase().trim());
    const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());

    // Count matches
    let matches = 0;
    normalizedRequiredSkills.forEach(requiredSkill => {
      // Check for exact match
      if (normalizedProviderSkills.includes(requiredSkill)) {
        matches++;
      } else {
        // Check for partial match (contains)
        const hasPartialMatch = normalizedProviderSkills.some(providerSkill =>
          providerSkill.includes(requiredSkill) || requiredSkill.includes(providerSkill)
        );
        if (hasPartialMatch) {
          matches += 0.5; // Partial match counts as half
        }
      }
    });

    // Calculate score as percentage of required skills matched
    return matches / normalizedRequiredSkills.length;
  }

  /**
   * Find matching providers for required skills
   * @param {Array} providers - Array of provider profiles
   * @param {Array} requiredSkills - Required skills
   * @returns {Array} - Array of providers with match scores
   */
  function findMatchingProviders(providers, requiredSkills) {
    if (!Array.isArray(providers) || providers.length === 0) {
      return [];
    }

    if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return providers.map(p => ({ ...p, skillMatchScore: 0 }));
    }

    return providers.map(provider => {
      const skillMatchScore = calculateSkillMatch(provider.skills || [], requiredSkills);
      const matchedSkills = (provider.skills || []).filter(skill =>
        requiredSkills.some(reqSkill =>
          skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
          reqSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );

      return {
        ...provider,
        skillMatchScore: skillMatchScore,
        matchedSkills: matchedSkills
      };
    });
  }

  // Export
  window.SkillMatcher = {
    calculateSkillMatch,
    findMatchingProviders
  };

})();

