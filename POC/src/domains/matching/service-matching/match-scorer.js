/**
 * Match Scorer
 * Scoring and ranking logic for service provider matches
 */

(function() {
  'use strict';

  /**
   * Calculate availability score
   * @param {string} availabilityStatus - Provider availability status
   * @returns {number} - Score (0-1)
   */
  function calculateAvailabilityScore(availabilityStatus) {
    const scores = {
      'AVAILABLE': 1.0,
      'BUSY': 0.5,
      'UNAVAILABLE': 0.0
    };

    return scores[availabilityStatus] || 0.0;
  }

  /**
   * Calculate pricing score (lower is better, normalized to 0-1)
   * @param {Object} providerPricing - Provider pricing info
   * @param {Object} requestBudget - Request budget
   * @returns {number} - Score (0-1)
   */
  function calculatePricingScore(providerPricing, requestBudget) {
    if (!providerPricing || !requestBudget) {
      return 0.5; // Neutral score if pricing info not available
    }

    // Extract amount from provider pricing
    let providerAmount = 0;
    if (providerPricing.hourlyRate) {
      // Estimate based on hourly rate (assume 40 hours for fixed projects)
      providerAmount = providerPricing.hourlyRate * 40;
    } else if (providerPricing.amount) {
      providerAmount = providerPricing.amount;
    }

    if (providerAmount === 0) {
      return 0.5; // Neutral if no pricing info
    }

    // Calculate score based on how close provider price is to budget range
    const budgetMin = requestBudget.min || 0;
    const budgetMax = requestBudget.max || Infinity;

    if (providerAmount < budgetMin) {
      // Below budget - good, but might indicate lower quality
      return 0.7;
    } else if (providerAmount <= budgetMax) {
      // Within budget - perfect
      return 1.0;
    } else {
      // Above budget - calculate penalty
      const overage = providerAmount - budgetMax;
      const budgetRange = budgetMax - budgetMin || budgetMax;
      const penalty = Math.min(overage / budgetRange, 1.0);
      return Math.max(0.0, 1.0 - penalty);
    }
  }

  /**
   * Calculate overall match score
   * @param {Object} matchData - Match data with scores
   * @returns {number} - Overall score (0-1)
   */
  function calculateOverallScore(matchData) {
    const weights = {
      skillMatch: 0.6,      // 60% weight on skill match
      availability: 0.2,     // 20% weight on availability
      pricing: 0.2          // 20% weight on pricing
    };

    const skillMatchScore = matchData.skillMatchScore || 0;
    const availabilityScore = matchData.availabilityScore || 0;
    const pricingScore = matchData.pricingScore || 0.5;

    const overallScore = (
      skillMatchScore * weights.skillMatch +
      availabilityScore * weights.availability +
      pricingScore * weights.pricing
    );

    return Math.min(1.0, Math.max(0.0, overallScore));
  }

  /**
   * Rank matches by score
   * @param {Array} matches - Array of matches with scores
   * @returns {Array} - Sorted array of matches (highest score first)
   */
  function rankMatches(matches) {
    if (!Array.isArray(matches)) {
      return [];
    }

    return matches
      .map(match => ({
        ...match,
        overallScore: calculateOverallScore(match)
      }))
      .sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Score a provider match for a service request
   * @param {Object} provider - Provider profile
   * @param {Object} serviceRequest - Service request
   * @returns {Object} - Scored match data
   */
  function scoreProviderMatch(provider, serviceRequest) {
    // Calculate skill match
    const skillMatchScore = SkillMatcher.calculateSkillMatch(
      provider.skills || [],
      serviceRequest.requiredSkills || []
    );

    // Calculate availability score
    const availabilityScore = calculateAvailabilityScore(provider.availabilityStatus);

    // Calculate pricing score
    const pricingScore = calculatePricingScore(
      {
        hourlyRate: provider.hourlyRate,
        pricingModel: provider.pricingModel
      },
      serviceRequest.budget
    );

    // Calculate overall score
    const matchData = {
      provider: provider,
      skillMatchScore: skillMatchScore,
      availabilityScore: availabilityScore,
      pricingScore: pricingScore
    };

    const overallScore = calculateOverallScore(matchData);

    return {
      ...matchData,
      overallScore: overallScore
    };
  }

  // Export
  window.MatchScorer = {
    calculateAvailabilityScore,
    calculatePricingScore,
    calculateOverallScore,
    rankMatches,
    scoreProviderMatch
  };

})();

