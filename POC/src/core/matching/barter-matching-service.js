/**
 * Barter Matching Service
 * Specialized matching logic for barter and hybrid payment modes
 */

(function() {
  'use strict';

  /**
   * Match barter opportunities based on service-for-service compatibility
   * @param {Object} opportunity - Opportunity with Barter/Hybrid payment mode
   * @param {Object} user - User to match against
   * @returns {Object} - Barter match result { compatible: boolean, score: number, details: Object }
   */
  function matchBarterOpportunity(opportunity, user) {
    if (!opportunity || (opportunity.paymentMode !== 'Barter' && opportunity.paymentMode !== 'Hybrid')) {
      return null;
    }

    if (typeof ServiceItemModel === 'undefined') {
      console.warn('ServiceItemModel not available for barter matching');
      return null;
    }

    // Get services offered/requested from opportunity
    const servicesOffered = opportunity.attributes?.servicesOffered || [];
    const servicesRequested = opportunity.attributes?.servicesRequested || [];
    const barterOffer = opportunity.attributes?.barterOffer || '';

    // Get user's barter capabilities
    const userBarterOffers = user.profile?.barterOffers || user.profile?.availableServices || [];
    const userBarterNeeds = user.profile?.barterNeeds || user.profile?.neededServices || [];

    // Calculate compatibility
    const compatibility = {
      servicesOfferedMatch: calculateServiceMatch(servicesOffered, userBarterNeeds),
      servicesRequestedMatch: calculateServiceMatch(servicesRequested, userBarterOffers),
      barterOfferMatch: calculateBarterOfferMatch(barterOffer, userBarterOffers, userBarterNeeds),
      valueEquivalence: null
    };

    // Calculate overall compatibility score
    let score = 0;
    let factors = 0;

    if (compatibility.servicesOfferedMatch) {
      score += compatibility.servicesOfferedMatch.score * 0.4;
      factors += 0.4;
    }

    if (compatibility.servicesRequestedMatch) {
      score += compatibility.servicesRequestedMatch.score * 0.4;
      factors += 0.4;
    }

    if (compatibility.barterOfferMatch) {
      score += compatibility.barterOfferMatch.score * 0.2;
      factors += 0.2;
    }

    // Normalize score
    const finalScore = factors > 0 ? score / factors : 0;

    // Check value equivalence if services are specified
    if (servicesOffered.length > 0 && servicesRequested.length > 0) {
      if (typeof BarterSettlement !== 'undefined') {
        const equivalence = BarterSettlement.calculateEquivalence(servicesOffered, servicesRequested);
        compatibility.valueEquivalence = equivalence;
        
        // Adjust score based on value equivalence
        if (equivalence.isEqual) {
          // Perfect value match boosts score
          finalScore = Math.min(100, finalScore + 10);
        } else if (equivalence.percentageDifference > 50) {
          // Large value difference reduces score
          finalScore = Math.max(0, finalScore - 15);
        }
      }
    }

    return {
      compatible: finalScore >= 50,
      score: Math.round(finalScore),
      details: compatibility
    };
  }

  /**
   * Calculate service match score
   * @param {Array} opportunityServices - Services from opportunity
   * @param {Array} userServices - Services from user profile
   * @returns {Object|null} - Match result { score: number, matched: Array }
   */
  function calculateServiceMatch(opportunityServices, userServices) {
    if (!Array.isArray(opportunityServices) || opportunityServices.length === 0) {
      return null;
    }

    if (!Array.isArray(userServices) || userServices.length === 0) {
      return { score: 0, matched: [] };
    }

    // Convert to standardized service items if needed
    const oppServices = opportunityServices.map(s => 
      typeof ServiceItemModel !== 'undefined' ? ServiceItemModel.convertLegacy(s) : s
    );

    const userServicesList = userServices.map(s => 
      typeof ServiceItemModel !== 'undefined' ? ServiceItemModel.convertLegacy(s) : s
    );

    // Match by service name/description
    const matched = [];
    oppServices.forEach(oppService => {
      const serviceName = (oppService.serviceName || oppService.description || '').toLowerCase();
      userServicesList.forEach(userService => {
        const userServiceName = (userService.serviceName || userService.description || '').toLowerCase();
        if (serviceName.includes(userServiceName) || userServiceName.includes(serviceName)) {
          matched.push({
            opportunityService: oppService,
            userService: userService
          });
        }
      });
    });

    const score = oppServices.length > 0 ? (matched.length / oppServices.length) * 100 : 0;

    return {
      score: score,
      matched: matched
    };
  }

  /**
   * Calculate barter offer text match
   * @param {string} barterOffer - Barter offer text from opportunity
   * @param {Array} userOffers - User's barter offers
   * @param {Array} userNeeds - User's barter needs
   * @returns {Object} - Match result { score: number, matched: Array }
   */
  function calculateBarterOfferMatch(barterOffer, userOffers, userNeeds) {
    if (!barterOffer || barterOffer.trim().length === 0) {
      return { score: 50, matched: [] }; // Neutral if not specified
    }

    const offerLower = barterOffer.toLowerCase();
    const matched = [];

    // Check user offers (what user can provide)
    if (Array.isArray(userOffers) && userOffers.length > 0) {
      userOffers.forEach(offer => {
        const offerText = (typeof offer === 'string' ? offer : offer.name || offer.description || '').toLowerCase();
        if (offerLower.includes(offerText) || offerText.includes(offerLower)) {
          matched.push({ type: 'offer', text: offer });
        }
      });
    }

    // Check user needs (what user wants)
    if (Array.isArray(userNeeds) && userNeeds.length > 0) {
      userNeeds.forEach(need => {
        const needText = (typeof need === 'string' ? need : need.name || need.description || '').toLowerCase();
        if (offerLower.includes(needText) || needText.includes(offerLower)) {
          matched.push({ type: 'need', text: need });
        }
      });
    }

    // Calculate score based on matches
    const totalChecks = (userOffers?.length || 0) + (userNeeds?.length || 0);
    const score = totalChecks > 0 ? (matched.length / totalChecks) * 100 : 50;

    return {
      score: score,
      matched: matched
    };
  }

  /**
   * Match REQUEST_SERVICE opportunities with OFFER_SERVICE opportunities
   * @param {string} requestOpportunityId - Request opportunity ID
   * @returns {Array} - Array of matched offering opportunities with scores
   */
  function matchRequestToOfferings(requestOpportunityId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
      return [];
    }

    const request = PMTwinData.CollaborationOpportunities.getById(requestOpportunityId);
    if (!request || request.intentType !== 'REQUEST_SERVICE') {
      return [];
    }

    // Get all OFFER_SERVICE opportunities
    const offerings = PMTwinData.CollaborationOpportunities.getWithFilters({
      intentType: 'OFFER_SERVICE',
      status: 'active'
    });

    // Match each offering
    const matches = offerings.map(offering => {
      // Basic compatibility checks
      let score = 0;
      const factors = {};

      // Payment mode compatibility
      if (request.paymentMode === offering.paymentMode) {
        factors.paymentMode = 100;
        score += 30;
      } else if (
        (request.paymentMode === 'Hybrid' && offering.paymentMode === 'Cash') ||
        (request.paymentMode === 'Cash' && offering.paymentMode === 'Hybrid')
      ) {
        factors.paymentMode = 50;
        score += 15;
      } else {
        factors.paymentMode = 0;
      }

      // Category/skills match
      const requestSkills = request.attributes?.requiredSkills || [];
      const offeringSkills = offering.attributes?.requiredSkills || offering.attributes?.skills || [];
      if (requestSkills.length > 0 && offeringSkills.length > 0) {
        const matchedSkills = requestSkills.filter(rs => 
          offeringSkills.some(os => 
            rs.toLowerCase().includes(os.toLowerCase()) || 
            os.toLowerCase().includes(rs.toLowerCase())
          )
        );
        factors.skillsMatch = (matchedSkills.length / requestSkills.length) * 100;
        score += factors.skillsMatch * 0.4;
      } else {
        factors.skillsMatch = 0;
      }

      // Barter compatibility (if applicable)
      if (request.paymentMode === 'Barter' || request.paymentMode === 'Hybrid') {
        // Create a mock user from the offering
        const mockUser = {
          profile: {
            barterOffers: offering.attributes?.servicesOffered || [],
            barterNeeds: request.attributes?.servicesRequested || []
          }
        };
        const barterMatch = matchBarterOpportunity(request, mockUser);
        if (barterMatch) {
          factors.barterCompatibility = barterMatch.score;
          score += barterMatch.score * 0.3;
        }
      }

      return {
        offering: offering,
        score: Math.min(100, Math.round(score)),
        factors: factors,
        meetsThreshold: score >= 70
      };
    });

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  /**
   * Match OFFER_SERVICE opportunities with REQUEST_SERVICE opportunities
   * @param {string} offeringOpportunityId - Offering opportunity ID
   * @returns {Array} - Array of matched request opportunities with scores
   */
  function matchOfferingToRequests(offeringOpportunityId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
      return [];
    }

    const offering = PMTwinData.CollaborationOpportunities.getById(offeringOpportunityId);
    if (!offering || offering.intentType !== 'OFFER_SERVICE') {
      return [];
    }

    // Get all REQUEST_SERVICE opportunities
    const requests = PMTwinData.CollaborationOpportunities.getWithFilters({
      intentType: 'REQUEST_SERVICE',
      status: 'active'
    });

    // Match each request (similar logic to matchRequestToOfferings)
    const matches = requests.map(request => {
      let score = 0;
      const factors = {};

      // Payment mode compatibility
      if (request.paymentMode === offering.paymentMode) {
        factors.paymentMode = 100;
        score += 30;
      } else if (
        (request.paymentMode === 'Hybrid' && offering.paymentMode === 'Cash') ||
        (request.paymentMode === 'Cash' && offering.paymentMode === 'Hybrid')
      ) {
        factors.paymentMode = 50;
        score += 15;
      } else {
        factors.paymentMode = 0;
      }

      // Skills match
      const requestSkills = request.attributes?.requiredSkills || [];
      const offeringSkills = offering.attributes?.requiredSkills || offering.attributes?.skills || [];
      if (requestSkills.length > 0 && offeringSkills.length > 0) {
        const matchedSkills = requestSkills.filter(rs => 
          offeringSkills.some(os => 
            rs.toLowerCase().includes(os.toLowerCase()) || 
            os.toLowerCase().includes(rs.toLowerCase())
          )
        );
        factors.skillsMatch = (matchedSkills.length / requestSkills.length) * 100;
        score += factors.skillsMatch * 0.4;
      } else {
        factors.skillsMatch = 0;
      }

      // Barter compatibility
      if (request.paymentMode === 'Barter' || request.paymentMode === 'Hybrid') {
        const mockUser = {
          profile: {
            barterOffers: offering.attributes?.servicesOffered || [],
            barterNeeds: request.attributes?.servicesRequested || []
          }
        };
        const barterMatch = matchBarterOpportunity(request, mockUser);
        if (barterMatch) {
          factors.barterCompatibility = barterMatch.score;
          score += barterMatch.score * 0.3;
        }
      }

      return {
        request: request,
        score: Math.min(100, Math.round(score)),
        factors: factors,
        meetsThreshold: score >= 70
      };
    });

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  // ============================================
  // Export
  // ============================================

  window.BarterMatchingService = {
    matchBarterOpportunity: matchBarterOpportunity,
    matchRequestToOfferings: matchRequestToOfferings,
    matchOfferingToRequests: matchOfferingToRequests
  };

})();
