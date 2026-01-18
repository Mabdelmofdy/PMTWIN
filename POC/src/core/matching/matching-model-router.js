/**
 * Matching Model Router
 * Routes matching requests to appropriate matching logic based on matching model type
 */

(function() {
  'use strict';

  /**
   * Route matching request to appropriate handler
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @param {Object} provider - Provider user object
   * @returns {Object} - Match result
   */
  function routeMatching(need, offer, provider) {
    if (!need || !offer) {
      return null;
    }

    // Determine matching model
    let matchingModel = need.matchingModel;
    if (!matchingModel && typeof MatchingModels !== 'undefined') {
      matchingModel = MatchingModels.determine(need);
    } else {
      matchingModel = 'OneWay'; // Default
    }

    // Route to appropriate matching logic
    switch (matchingModel) {
      case 'TwoWayDependency':
        return matchTwoWayDependency(need, offer, provider);

      case 'GroupFormation':
        return matchGroupFormation(need, offer, provider);

      case 'CircularExchange':
        return matchCircularExchange(need, offer, provider);

      case 'OneWay':
      default:
        return matchOneWay(need, offer, provider);
    }
  }

  /**
   * One-Way Matching (Simple)
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @param {Object} provider - Provider user
   * @returns {Object} - Match result
   */
  function matchOneWay(need, offer, provider) {
    // Use standard matching algorithm
    if (typeof window.calculateMatchScore === 'function') {
      return window.calculateMatchScore(need, offer, provider);
    }

    // Fallback to PMTwinData matching if available
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Matching) {
      return PMTwinData.Matching.calculateMatchScore(need, offer, provider);
    }

    return null;
  }

  /**
   * Two-Way Dependency Matching (Barter)
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @param {Object} provider - Provider user
   * @returns {Object} - Match result
   */
  function matchTwoWayDependency(need, offer, provider) {
    // First, calculate standard match
    const standardMatch = matchOneWay(need, offer, provider);
    if (!standardMatch) {
      return null;
    }

    // Then validate bidirectional compatibility
    let bidirectionalScore = 50; // Base score

    // Check if offer's needs match need's offers (reverse matching)
    if (typeof SemanticMirroring !== 'undefined') {
      const reverseMirror = SemanticMirroring.applyAll(offer, need);
      if (reverseMirror && reverseMirror.overallCompatible) {
        bidirectionalScore = 80;
      } else {
        bidirectionalScore = 40;
      }
    }

    // Check barter compatibility
    if (typeof BarterMatching !== 'undefined') {
      const barterMatch = BarterMatching.matchBarterOpportunity(need, provider);
      if (barterMatch && barterMatch.compatible) {
        bidirectionalScore = Math.max(bidirectionalScore, barterMatch.score);
      }
    }

    // Combine standard match with bidirectional validation
    const finalScore = Math.round(
      (standardMatch.finalScore * 0.7) + (bidirectionalScore * 0.3)
    );

    return {
      ...standardMatch,
      finalScore: finalScore,
      matchingModel: 'TwoWayDependency',
      bidirectionalCompatible: bidirectionalScore >= 50,
      bidirectionalScore: bidirectionalScore
    };
  }

  /**
   * Group Formation Matching (Consortium)
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @param {Object} provider - Provider user
   * @returns {Object} - Match result
   */
  function matchGroupFormation(need, offer, provider) {
    // Calculate standard match
    const standardMatch = matchOneWay(need, offer, provider);
    if (!standardMatch) {
      return null;
    }

    // Check if this offer is part of a group
    const linkedOffers = need.linkedOffers || [];
    const isPartOfGroup = linkedOffers.includes(offer.id);

    // Group compatibility score
    let groupScore = standardMatch.finalScore;

    if (isPartOfGroup && linkedOffers.length > 1) {
      // Calculate group compatibility
      if (typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
        const otherOffers = linkedOffers
          .filter(id => id !== offer.id)
          .map(id => PMTwinData.Opportunities.getById(id))
          .filter(o => o !== null);

        // Check if offers complement each other
        const complementaryScore = calculateGroupComplementarity(need, offer, otherOffers);
        groupScore = Math.round((standardMatch.finalScore * 0.8) + (complementaryScore * 0.2));
      }
    }

    return {
      ...standardMatch,
      finalScore: groupScore,
      matchingModel: 'GroupFormation',
      isPartOfGroup: isPartOfGroup,
      groupSize: linkedOffers.length
    };
  }

  /**
   * Calculate group complementarity score
   * @param {Object} need - Need opportunity
   * @param {Object} currentOffer - Current offer
   * @param {Array} otherOffers - Other offers in group
   * @returns {number} - Complementarity score
   */
  function calculateGroupComplementarity(need, currentOffer, otherOffers) {
    if (!otherOffers || otherOffers.length === 0) {
      return 50;
    }

    // Check if offers cover different skills/requirements
    const needSkills = need.skills || need.attributes?.requiredSkills || [];
    const currentSkills = currentOffer.skills || currentOffer.attributes?.requiredSkills || [];
    
    let coveredSkills = new Set(currentSkills);
    let totalCoverage = currentSkills.length;

    otherOffers.forEach(otherOffer => {
      const otherSkills = otherOffer.skills || otherOffer.attributes?.requiredSkills || [];
      otherSkills.forEach(skill => {
        if (!coveredSkills.has(skill)) {
          coveredSkills.add(skill);
          totalCoverage++;
        }
      });
    });

    const coverageRate = needSkills.length > 0 
      ? (coveredSkills.size / needSkills.length) * 100 
      : 100;

    return Math.min(100, coverageRate);
  }

  /**
   * Circular Exchange Matching
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @param {Object} provider - Provider user
   * @returns {Object} - Match result
   */
  function matchCircularExchange(need, offer, provider) {
    // Calculate standard match
    const standardMatch = matchOneWay(need, offer, provider);
    if (!standardMatch) {
      return null;
    }

    // Check circular chain completeness
    let circularScore = standardMatch.finalScore;
    const linkedOffers = need.linkedOffers || [];

    if (linkedOffers.length >= 3) {
      // Verify circular chain
      if (typeof MatchingModels !== 'undefined' && MatchingModels.hasCircularDependencies(need)) {
        circularScore = Math.round(standardMatch.finalScore * 1.1); // Boost for complete circle
      }
    }

    return {
      ...standardMatch,
      finalScore: circularScore,
      matchingModel: 'CircularExchange',
      isCircular: true,
      chainLength: linkedOffers.length + 1
    };
  }

  // ============================================
  // Export
  // ============================================

  window.MatchingModelRouter = {
    route: routeMatching,
    matchOneWay: matchOneWay,
    matchTwoWayDependency: matchTwoWayDependency,
    matchGroupFormation: matchGroupFormation,
    matchCircularExchange: matchCircularExchange
  };

})();
