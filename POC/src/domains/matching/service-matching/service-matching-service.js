/**
 * Service Matching Service
 * Main service for matching Service Providers to Service Requests
 */

(function() {
  'use strict';

  /**
   * Match service providers to a service request
   * @param {string} serviceRequestId - Service request ID
   * @returns {Array} - Array of matched providers with scores
   */
  function matchServiceProvidersToRequest(serviceRequestId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceRequests || !PMTwinData.ServiceProviderProfiles) {
      return [];
    }

    // Get service request
    const serviceRequest = PMTwinData.ServiceRequests.getById(serviceRequestId);
    if (!serviceRequest) {
      return [];
    }

    // Get all available providers
    let providers = PMTwinData.ServiceProviderProfiles.getAll();

    // Filter by availability
    providers = providers.filter(provider => provider.availabilityStatus === 'AVAILABLE');

    // Find matching providers using skill matcher
    const matches = SkillMatcher.findMatchingProviders(providers, serviceRequest.requiredSkills || []);

    // Score each match
    const scoredMatches = matches.map(match => 
      MatchScorer.scoreProviderMatch(match, serviceRequest)
    );

    // Rank matches
    const rankedMatches = MatchScorer.rankMatches(scoredMatches);

    return rankedMatches;
  }

  /**
   * Get top N matches for a service request
   * @param {string} serviceRequestId - Service request ID
   * @param {number} limit - Maximum number of matches to return
   * @returns {Array} - Top N matches
   */
  function getTopMatches(serviceRequestId, limit = 10) {
    const matches = matchServiceProvidersToRequest(serviceRequestId);
    return matches.slice(0, limit);
  }

  /**
   * Get matches above a threshold score
   * @param {string} serviceRequestId - Service request ID
   * @param {number} minScore - Minimum score threshold (0-1)
   * @returns {Array} - Matches above threshold
   */
  function getMatchesAboveThreshold(serviceRequestId, minScore = 0.5) {
    const matches = matchServiceProvidersToRequest(serviceRequestId);
    return matches.filter(match => match.overallScore >= minScore);
  }

  /**
   * Calculate match statistics for a service request
   * @param {string} serviceRequestId - Service request ID
   * @returns {Object} - Match statistics
   */
  function getMatchStatistics(serviceRequestId) {
    const matches = matchServiceProvidersToRequest(serviceRequestId);

    if (matches.length === 0) {
      return {
        totalMatches: 0,
        averageScore: 0,
        topScore: 0,
        matchesByScoreRange: {
          excellent: 0,  // >= 0.8
          good: 0,       // 0.6-0.8
          fair: 0,       // 0.4-0.6
          poor: 0        // < 0.4
        }
      };
    }

    const scores = matches.map(m => m.overallScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const topScore = Math.max(...scores);

    const matchesByScoreRange = {
      excellent: matches.filter(m => m.overallScore >= 0.8).length,
      good: matches.filter(m => m.overallScore >= 0.6 && m.overallScore < 0.8).length,
      fair: matches.filter(m => m.overallScore >= 0.4 && m.overallScore < 0.6).length,
      poor: matches.filter(m => m.overallScore < 0.4).length
    };

    return {
      totalMatches: matches.length,
      averageScore: averageScore,
      topScore: topScore,
      matchesByScoreRange: matchesByScoreRange
    };
  }

  // Export
  window.ServiceMatchingService = {
    matchServiceProvidersToRequest,
    getTopMatches,
    getMatchesAboveThreshold,
    getMatchStatistics
  };

})();

