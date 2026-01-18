/**
 * Semantic Attribute Mirroring Service
 * Implements BRD Section 6: Semantic Attribute Mirroring
 * Maps Need attributes to Offer attributes and vice versa
 */

(function() {
  'use strict';

  /**
   * Mirror Required Skills to Available Skills
   * Maps Need's required skills to Offer's available skills
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @returns {Object} - Mirroring result { matched: Array, unmatched: Array, score: number }
   */
  function mirrorSkillsToAvailable(need, offer) {
    const requiredSkills = need.attributes?.requiredSkills || need.skills || [];
    const availableSkills = offer.attributes?.requiredSkills || offer.attributes?.availableSkills || offer.skills || [];

    const matched = [];
    const unmatched = [];

    requiredSkills.forEach(reqSkill => {
      const reqSkillLower = reqSkill.toLowerCase();
      const found = availableSkills.some(availSkill => {
        const availSkillLower = availSkill.toLowerCase();
        return availSkillLower.includes(reqSkillLower) || reqSkillLower.includes(availSkillLower);
      });

      if (found) {
        matched.push(reqSkill);
      } else {
        unmatched.push(reqSkill);
      }
    });

    const score = requiredSkills.length > 0 
      ? (matched.length / requiredSkills.length) * 100 
      : 100;

    return {
      matched: matched,
      unmatched: unmatched,
      score: Math.round(score),
      requiredSkills: requiredSkills,
      availableSkills: availableSkills
    };
  }

  /**
   * Mirror Budget to Rate
   * Maps Need's budget range to Offer's rate range
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @returns {Object} - Mirroring result { compatible: boolean, score: number, details: Object }
   */
  function mirrorBudgetToRate(need, offer) {
    const needBudget = need.attributes?.budgetRange || need.budgetRange || {};
    const needBudgetMin = needBudget.min || 0;
    const needBudgetMax = needBudget.max || needBudgetMin || 0;

    const offerRate = offer.attributes?.budgetRange || offer.budgetRange || 
                     (offer.price_min && offer.price_max ? { min: offer.price_min, max: offer.price_max } : null) ||
                     (offer.price_min ? { min: offer.price_min, max: offer.price_min } : null);

    if (!offerRate || (!offerRate.min && !offerRate.max)) {
      return {
        compatible: false,
        score: 50,
        details: {
          needBudget: needBudget,
          offerRate: null,
          reason: 'Offer rate not specified'
        }
      };
    }

    const offerRateMin = offerRate.min || 0;
    const offerRateMax = offerRate.max || offerRateMin || 0;

    // Check compatibility
    let compatible = false;
    let score = 0;

    if (needBudgetMax > 0) {
      // Perfect match: offer rate fits within budget
      if (offerRateMax <= needBudgetMax && offerRateMin >= needBudgetMin) {
        compatible = true;
        score = 100;
      } else if (offerRateMin <= needBudgetMax && offerRateMax >= needBudgetMin) {
        // Overlap match
        compatible = true;
        const overlap = Math.min(offerRateMax, needBudgetMax) - Math.max(offerRateMin, needBudgetMin);
        const needRange = needBudgetMax - needBudgetMin || needBudgetMax;
        score = needRange > 0 ? Math.round((overlap / needRange) * 100) : 80;
      } else {
        // Check proximity
        const budgetCenter = (needBudgetMin + needBudgetMax) / 2;
        const rateCenter = (offerRateMin + offerRateMax) / 2;
        const difference = Math.abs(budgetCenter - rateCenter);
        const budgetRange = needBudgetMax - needBudgetMin || budgetCenter;
        const percentageDiff = budgetRange > 0 ? (difference / budgetRange) * 100 : 0;

        if (percentageDiff <= 20) {
          compatible = true;
          score = Math.max(50, 100 - percentageDiff * 2);
        } else {
          score = Math.max(0, 50 - (percentageDiff - 20));
        }
      }
    } else {
      score = 50; // Neutral if no budget specified
    }

    return {
      compatible: compatible,
      score: score,
      details: {
        needBudget: needBudget,
        offerRate: offerRate,
        needBudgetCenter: needBudgetMax > 0 ? (needBudgetMin + needBudgetMax) / 2 : 0,
        offerRateCenter: (offerRateMin + offerRateMax) / 2
      }
    };
  }

  /**
   * Mirror Timeline to Availability
   * Maps Need's timeline to Offer's availability
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @returns {Object} - Mirroring result { compatible: boolean, score: number, details: Object }
   */
  function mirrorTimelineToAvailability(need, offer) {
    // Extract timeline from need
    const needStartDate = need.attributes?.startDate || need.startDate || need.timeline?.startDate;
    const needDuration = need.attributes?.expectedDuration || need.attributes?.duration || 
                        need.timeline?.duration || need.duration || 0;
    const needEndDate = needStartDate && needDuration ? 
      new Date(new Date(needStartDate).getTime() + needDuration * 24 * 60 * 60 * 1000) : null;

    // Extract availability from offer
    const offerStartDate = offer.availability?.start_date || offer.attributes?.availability?.start_date;
    const offerEndDate = offer.availability?.end_date || offer.attributes?.availability?.end_date;
    const offerAvailability = offer.availability || offer.attributes?.availability || {};

    let compatible = false;
    let score = 0;

    if (!needStartDate && !offerStartDate) {
      return {
        compatible: true,
        score: 50,
        details: {
          needTimeline: { startDate: null, duration: needDuration },
          offerAvailability: offerAvailability,
          reason: 'Timeline/availability not fully specified'
        }
      };
    }

    // Check start date compatibility
    if (needStartDate && offerStartDate) {
      const needStart = new Date(needStartDate);
      const offerStart = new Date(offerStartDate);

      if (offerStart <= needStart) {
        compatible = true;
        score += 50;
      } else {
        const daysDiff = Math.floor((offerStart - needStart) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 30) {
          compatible = true;
          score += Math.max(30, 50 - daysDiff);
        } else {
          score += Math.max(0, 30 - (daysDiff - 30) * 0.5);
        }
      }
    } else {
      score += 25;
    }

    // Check duration/end date compatibility
    if (needDuration > 0 && offerEndDate) {
      const needEnd = needEndDate || new Date(new Date(needStartDate).getTime() + needDuration * 24 * 60 * 60 * 1000);
      const offerEnd = new Date(offerEndDate);

      if (offerEnd >= needEnd) {
        compatible = true;
        score += 50;
      } else {
        const overlapDays = Math.floor((offerEnd - new Date(needStartDate)) / (1000 * 60 * 60 * 1000));
        const overlapPercentage = (overlapDays / needDuration) * 100;
        score += Math.max(0, overlapPercentage * 0.5);
      }
    } else if (offerAvailability.lead_time) {
      score += 30;
    } else {
      score += 25;
    }

    return {
      compatible: compatible,
      score: Math.min(100, Math.round(score)),
      details: {
        needTimeline: {
          startDate: needStartDate,
          duration: needDuration,
          endDate: needEndDate
        },
        offerAvailability: {
          startDate: offerStartDate,
          endDate: offerEndDate,
          leadTime: offerAvailability.lead_time
        }
      }
    };
  }

  /**
   * Mirror Location to Preferred Location
   * Maps Need's location to Offer's preferred location
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @returns {Object} - Mirroring result { compatible: boolean, score: number, details: Object }
   */
  function mirrorLocationToPreferred(need, offer) {
    const needLocation = need.location || need.attributes?.location || {};
    const offerLocation = offer.location || offer.attributes?.location || offer.attributes?.preferredLocation || {};

    if (!needLocation || !offerLocation) {
      return {
        compatible: true,
        score: 50,
        details: {
          needLocation: needLocation,
          offerLocation: offerLocation,
          reason: 'Location not fully specified'
        }
      };
    }

    let compatible = false;
    let score = 0;

    // Exact city match
    if (needLocation.city && offerLocation.city) {
      if (needLocation.city.toLowerCase() === offerLocation.city.toLowerCase()) {
        compatible = true;
        score = 100;
        return {
          compatible: compatible,
          score: score,
          details: {
            needLocation: needLocation,
            offerLocation: offerLocation,
            matchType: 'city'
          }
        };
      }
    }

    // Region match
    if (needLocation.region && offerLocation.region) {
      if (needLocation.region.toLowerCase() === offerLocation.region.toLowerCase()) {
        compatible = true;
        score = 80;
        return {
          compatible: compatible,
          score: score,
          details: {
            needLocation: needLocation,
            offerLocation: offerLocation,
            matchType: 'region'
          }
        };
      }
    }

    // Country match
    if (needLocation.country && offerLocation.country) {
      if (needLocation.country.toLowerCase() === offerLocation.country.toLowerCase()) {
        compatible = true;
        score = 50;
      } else {
        score = 0;
      }
    } else {
      score = 50; // Neutral if country not specified
    }

    // Check remote availability
    if (offerLocation.isRemoteAllowed && needLocation.isRemoteAllowed) {
      score = Math.max(score, 60); // Boost score if both allow remote
      compatible = true;
    }

    return {
      compatible: compatible,
      score: score,
      details: {
        needLocation: needLocation,
        offerLocation: offerLocation,
        matchType: score === 100 ? 'city' : score === 80 ? 'region' : score >= 50 ? 'country' : 'none'
      }
    };
  }

  /**
   * Apply all semantic mirroring rules
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @returns {Object} - Complete mirroring result
   */
  function applySemanticMirroring(need, offer) {
    const skillsMirror = mirrorSkillsToAvailable(need, offer);
    const budgetMirror = mirrorBudgetToRate(need, offer);
    const timelineMirror = mirrorTimelineToAvailability(need, offer);
    const locationMirror = mirrorLocationToPreferred(need, offer);

    return {
      skills: skillsMirror,
      budget: budgetMirror,
      timeline: timelineMirror,
      location: locationMirror,
      overallCompatible: skillsMirror.score >= 50 && 
                        budgetMirror.compatible !== false && 
                        timelineMirror.compatible !== false && 
                        locationMirror.compatible !== false
    };
  }

  // ============================================
  // Export
  // ============================================

  window.SemanticMirroring = {
    mirrorSkills: mirrorSkillsToAvailable,
    mirrorBudget: mirrorBudgetToRate,
    mirrorTimeline: mirrorTimelineToAvailability,
    mirrorLocation: mirrorLocationToPreferred,
    applyAll: applySemanticMirroring
  };

})();
