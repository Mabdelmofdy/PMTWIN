/**
 * Deal Linking Service
 * Handles linking one Need to multiple Offers
 * BRD Requirement: One Need can link to multiple Offers
 */

(function() {
  'use strict';

  /**
   * Link offers to a need
   * @param {string} needId - Need opportunity ID
   * @param {string[]} offerIds - Array of offer opportunity IDs
   * @returns {Object} - Result { success: boolean, errors: string[], linkedOffers: string[] }
   */
  function linkOffersToNeed(needId, offerIds) {
    const errors = [];

    if (!needId) {
      errors.push('Need ID is required');
      return { success: false, errors: errors };
    }

    if (!offerIds || !Array.isArray(offerIds) || offerIds.length === 0) {
      errors.push('At least one offer ID is required');
      return { success: false, errors: errors };
    }

    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      errors.push('Opportunities data service not available');
      return { success: false, errors: errors };
    }

    // Get need opportunity
    const need = PMTwinData.Opportunities.getById(needId);
    if (!need) {
      errors.push('Need opportunity not found');
      return { success: false, errors: errors };
    }

    // Validate need is REQUEST_SERVICE intent
    const needIntent = need.intentType || need.intent;
    if (needIntent !== 'REQUEST_SERVICE') {
      errors.push('Can only link offers to REQUEST_SERVICE opportunities');
      return { success: false, errors: errors };
    }

    // Validate all offers exist and are OFFER_SERVICE
    const offers = [];
    for (const offerId of offerIds) {
      const offer = PMTwinData.Opportunities.getById(offerId);
      if (!offer) {
        errors.push(`Offer ${offerId} not found`);
        continue;
      }

      const offerIntent = offer.intentType || offer.intent;
      if (offerIntent !== 'OFFER_SERVICE') {
        errors.push(`Offer ${offerId} must have OFFER_SERVICE intent`);
        continue;
      }

      // Check compatibility
      const compatibility = validateCompatibility(need, offer);
      if (!compatibility.compatible) {
        errors.push(`Offer ${offerId} is not compatible: ${compatibility.reason}`);
        continue;
      }

      offers.push(offer);
    }

    if (errors.length > 0 && offers.length === 0) {
      return { success: false, errors: errors };
    }

    // Update need with linked offers
    const existingLinkedOffers = need.linkedOffers || [];
    const newLinkedOffers = [...new Set([...existingLinkedOffers, ...offerIds])];

    const updateResult = PMTwinData.Opportunities.update(needId, {
      linkedOffers: newLinkedOffers,
      matchingModel: determineMatchingModel(need, newLinkedOffers)
    });

    if (!updateResult) {
      errors.push('Failed to update need opportunity');
      return { success: false, errors: errors };
    }

    // Create audit log
    if (PMTwinData.AuditTrail) {
      PMTwinData.AuditTrail.create({
        action: 'deal_linking',
        entityType: 'opportunity',
        entityId: needId,
        description: `Linked ${offerIds.length} offer(s) to need ${needId}`,
        changes: {
          before: { linkedOffers: existingLinkedOffers },
          after: { linkedOffers: newLinkedOffers }
        }
      });
    }

    return {
      success: true,
      errors: errors.length > 0 ? errors : [],
      linkedOffers: newLinkedOffers,
      linkedCount: newLinkedOffers.length
    };
  }

  /**
   * Unlink offers from a need
   * @param {string} needId - Need opportunity ID
   * @param {string[]} offerIds - Array of offer IDs to unlink
   * @returns {Object} - Result { success: boolean, errors: string[] }
   */
  function unlinkOffersFromNeed(needId, offerIds) {
    const errors = [];

    if (!needId) {
      errors.push('Need ID is required');
      return { success: false, errors: errors };
    }

    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      errors.push('Opportunities data service not available');
      return { success: false, errors: errors };
    }

    const need = PMTwinData.Opportunities.getById(needId);
    if (!need) {
      errors.push('Need opportunity not found');
      return { success: false, errors: errors };
    }

    const existingLinkedOffers = need.linkedOffers || [];
    const newLinkedOffers = existingLinkedOffers.filter(id => !offerIds.includes(id));

    const updateResult = PMTwinData.Opportunities.update(needId, {
      linkedOffers: newLinkedOffers,
      matchingModel: determineMatchingModel(need, newLinkedOffers)
    });

    if (!updateResult) {
      errors.push('Failed to update need opportunity');
      return { success: false, errors: errors };
    }

    return {
      success: true,
      errors: [],
      linkedOffers: newLinkedOffers
    };
  }

  /**
   * Validate compatibility between need and offer
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @returns {Object} - Compatibility result { compatible: boolean, reason: string }
   */
  function validateCompatibility(need, offer) {
    // Check payment mode compatibility
    const needPaymentMode = need.paymentMode || need.preferredPaymentTerms?.mode;
    const offerPaymentMode = offer.paymentMode || offer.preferredPaymentTerms?.mode;

    if (needPaymentMode && offerPaymentMode) {
      // Cash/Cash, Barter/Barter, Hybrid/Hybrid are compatible
      // Cash/Hybrid are compatible
      if (needPaymentMode !== offerPaymentMode && 
          !(needPaymentMode === 'CASH' && offerPaymentMode === 'HYBRID') &&
          !(needPaymentMode === 'HYBRID' && offerPaymentMode === 'CASH')) {
        return {
          compatible: false,
          reason: `Payment mode mismatch: Need is ${needPaymentMode}, Offer is ${offerPaymentMode}`
        };
      }
    }

    // Check skills compatibility using semantic mirroring
    if (typeof SemanticMirroring !== 'undefined') {
      const mirror = SemanticMirroring.applyAll(need, offer);
      if (!mirror.overallCompatible) {
        return {
          compatible: false,
          reason: 'Skills/attributes do not match'
        };
      }
    }

    return {
      compatible: true,
      reason: 'Compatible'
    };
  }

  /**
   * Determine matching model based on linked offers
   * @param {Object} need - Need opportunity
   * @param {string[]} linkedOffers - Linked offer IDs
   * @returns {string} - Matching model type
   */
  function determineMatchingModel(need, linkedOffers) {
    if (typeof MatchingModels !== 'undefined') {
      const tempNeed = { ...need, linkedOffers: linkedOffers };
      return MatchingModels.determine(tempNeed);
    }

    // Fallback logic
    if (linkedOffers.length > 1) {
      const paymentMode = need.paymentMode || need.preferredPaymentTerms?.mode;
      if (paymentMode === 'BARTER' || paymentMode === 'Barter' || 
          paymentMode === 'HYBRID' || paymentMode === 'Hybrid') {
        return 'GroupFormation';
      }
      return 'GroupFormation';
    }

    return 'OneWay';
  }

  /**
   * Get linked offers for a need
   * @param {string} needId - Need opportunity ID
   * @returns {Object[]} - Array of linked offer opportunities
   */
  function getLinkedOffers(needId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      return [];
    }

    const need = PMTwinData.Opportunities.getById(needId);
    if (!need || !need.linkedOffers || need.linkedOffers.length === 0) {
      return [];
    }

    return need.linkedOffers
      .map(id => PMTwinData.Opportunities.getById(id))
      .filter(offer => offer !== null);
  }

  /**
   * Check if offer is linked to need
   * @param {string} needId - Need opportunity ID
   * @param {string} offerId - Offer opportunity ID
   * @returns {boolean} - True if linked
   */
  function isLinked(needId, offerId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      return false;
    }

    const need = PMTwinData.Opportunities.getById(needId);
    if (!need || !need.linkedOffers) {
      return false;
    }

    return need.linkedOffers.includes(offerId);
  }

  // ============================================
  // Export
  // ============================================

  window.DealLinkingService = {
    link: linkOffersToNeed,
    unlink: unlinkOffersFromNeed,
    validate: validateCompatibility,
    getLinked: getLinkedOffers,
    isLinked: isLinked
  };

})();
