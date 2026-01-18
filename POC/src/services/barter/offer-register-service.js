/**
 * Offer Register Service
 * Business logic for Offer Register feature
 * BRD Section 14.3: When Barter mode is selected, Offer Register opens
 */

(function() {
  'use strict';

  /**
   * Get all available offers for barter
   * @param {Object} filters - Filter options { paymentMode: string, status: string }
   * @returns {Object[]} - Array of available offers
   */
  function getAvailableOffers(filters = {}) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      return [];
    }

    let offers = PMTwinData.Opportunities.getAll().filter(opp => {
      const intent = opp.intentType || opp.intent;
      return intent === 'OFFER_SERVICE';
    });

    // Filter by payment mode
    if (filters.paymentMode) {
      offers = offers.filter(opp => {
        const mode = opp.paymentMode || opp.preferredPaymentTerms?.mode || opp.paymentTerms?.mode;
        return mode === filters.paymentMode || mode === filters.paymentMode.toUpperCase();
      });
    }

    // Filter by status
    if (filters.status) {
      offers = offers.filter(opp => {
        const oppStatus = opp.status || 'draft';
        return oppStatus === filters.status || oppStatus === filters.status.toUpperCase();
      });
    } else {
      // Default: only active/published offers
      offers = offers.filter(opp => {
        const oppStatus = opp.status || 'draft';
        return oppStatus === 'PUBLISHED' || oppStatus === 'active' || oppStatus === 'published';
      });
    }

    return offers;
  }

  /**
   * Validate bidirectional match for barter
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @returns {Object} - Validation result { valid: boolean, score: number, details: Object }
   */
  function validateBidirectionalMatch(need, offer) {
    if (!need || !offer) {
      return {
        valid: false,
        score: 0,
        details: { error: 'Need and offer are required' }
      };
    }

    // Check payment mode compatibility
    const needPaymentMode = need.paymentMode || need.preferredPaymentTerms?.mode;
    const offerPaymentMode = offer.paymentMode || offer.preferredPaymentTerms?.mode;

    if (needPaymentMode !== 'BARTER' && needPaymentMode !== 'Barter' && 
        needPaymentMode !== 'HYBRID' && needPaymentMode !== 'Hybrid') {
      return {
        valid: false,
        score: 0,
        details: { error: 'Need must have Barter or Hybrid payment mode' }
      };
    }

    if (offerPaymentMode !== 'BARTER' && offerPaymentMode !== 'Barter' && 
        offerPaymentMode !== 'HYBRID' && offerPaymentMode !== 'Hybrid') {
      return {
        valid: false,
        score: 0,
        details: { error: 'Offer must have Barter or Hybrid payment mode' }
      };
    }

    // Use semantic mirroring for bidirectional validation
    let bidirectionalScore = 50;
    let details = {};

    if (typeof SemanticMirroring !== 'undefined') {
      // Forward: Need → Offer
      const forwardMirror = SemanticMirroring.applyAll(need, offer);
      
      // Reverse: Offer → Need
      const reverseMirror = SemanticMirroring.applyAll(offer, need);

      bidirectionalScore = Math.round(
        (forwardMirror.skills.score * 0.3) +
        (forwardMirror.budget.score * 0.2) +
        (forwardMirror.timeline.score * 0.2) +
        (forwardMirror.location.score * 0.1) +
        (reverseMirror.skills.score * 0.1) +
        (reverseMirror.budget.score * 0.1)
      );

      details = {
        forward: forwardMirror,
        reverse: reverseMirror,
        overallCompatible: forwardMirror.overallCompatible && reverseMirror.overallCompatible
      };
    }

    // Calculate equivalence ratio if barter
    let equivalenceRatio = null;
    if (typeof BarterSettlement !== 'undefined') {
      const needServicesOffered = need.attributes?.servicesOffered || need.serviceItems || [];
      const needServicesRequested = need.attributes?.servicesRequested || [];
      const offerServicesOffered = offer.attributes?.servicesOffered || offer.serviceItems || [];
      const offerServicesRequested = offer.attributes?.servicesRequested || [];

      // Check if need's requested services match offer's offered services
      // and need's offered services match offer's requested services
      const equivalence = BarterSettlement.calculateEquivalence(
        offerServicesOffered,
        needServicesRequested
      );

      if (equivalence) {
        equivalenceRatio = {
          offerToNeed: equivalence,
          needToOffer: BarterSettlement.calculateEquivalence(
            needServicesOffered,
            offerServicesRequested
          )
        };
      }
    }

    return {
      valid: bidirectionalScore >= 50,
      score: bidirectionalScore,
      details: {
        ...details,
        equivalenceRatio: equivalenceRatio
      }
    };
  }

  /**
   * Calculate equivalence ratio for barter
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @returns {Object} - Equivalence calculation
   */
  function calculateEquivalenceRatio(need, offer) {
    if (typeof BarterSettlement === 'undefined') {
      return null;
    }

    const needServicesOffered = need.attributes?.servicesOffered || need.serviceItems || [];
    const needServicesRequested = need.attributes?.servicesRequested || [];
    const offerServicesOffered = offer.attributes?.servicesOffered || offer.serviceItems || [];
    const offerServicesRequested = offer.attributes?.servicesRequested || [];

    return {
      offerProvidesForNeed: BarterSettlement.calculateEquivalence(
        offerServicesOffered,
        needServicesRequested
      ),
      needProvidesForOffer: BarterSettlement.calculateEquivalence(
        needServicesOffered,
        offerServicesRequested
      )
    };
  }

  /**
   * Link offer to need in Offer Register
   * @param {string} needId - Need opportunity ID
   * @param {string} offerId - Offer opportunity ID
   * @returns {Object} - Result { success: boolean, errors: string[] }
   */
  function linkOfferToNeed(needId, offerId) {
    if (typeof DealLinkingService === 'undefined') {
      return {
        success: false,
        errors: ['Deal linking service not available']
      };
    }

    return DealLinkingService.link(needId, [offerId]);
  }

  /**
   * Get offers compatible with a need for barter
   * @param {string} needId - Need opportunity ID
   * @returns {Object[]} - Array of compatible offers with scores
   */
  function getCompatibleOffers(needId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      return [];
    }

    const need = PMTwinData.Opportunities.getById(needId);
    if (!need) {
      return [];
    }

    const availableOffers = getAvailableOffers({ 
      paymentMode: 'BARTER',
      status: 'PUBLISHED'
    });

    return availableOffers.map(offer => {
      const validation = validateBidirectionalMatch(need, offer);
      return {
        offer: offer,
        compatible: validation.valid,
        score: validation.score,
        details: validation.details
      };
    }).filter(result => result.compatible)
      .sort((a, b) => b.score - a.score);
  }

  // ============================================
  // Export
  // ============================================

  window.OfferRegisterService = {
    getAvailableOffers: getAvailableOffers,
    validateBidirectional: validateBidirectionalMatch,
    calculateEquivalence: calculateEquivalenceRatio,
    linkOffer: linkOfferToNeed,
    getCompatibleOffers: getCompatibleOffers
  };

})();
