/**
 * Matching Models Definitions
 * BRD Section 7: Four matching models for different collaboration scenarios
 */

(function() {
  'use strict';

  // Matching Model Types
  const MATCHING_MODELS = {
    ONE_WAY: 'OneWay',
    TWO_WAY_DEPENDENCY: 'TwoWayDependency',
    GROUP_FORMATION: 'GroupFormation',
    CIRCULAR_EXCHANGE: 'CircularExchange'
  };

  /**
   * Determine matching model for an opportunity
   * @param {Object} opportunity - Opportunity object
   * @returns {string} - Matching model type
   */
  function determineMatchingModel(opportunity) {
    if (!opportunity) {
      return MATCHING_MODELS.ONE_WAY; // Default
    }

    const paymentMode = opportunity.paymentMode || 
                       opportunity.preferredPaymentTerms?.mode || 
                       opportunity.paymentTerms?.mode;

    // Check if barter/hybrid (Two-Way Dependency)
    if (paymentMode === 'BARTER' || paymentMode === 'Barter' || paymentMode === 'HYBRID' || paymentMode === 'Hybrid') {
      // Check if there are linked offers (Group Formation)
      if (opportunity.linkedOffers && opportunity.linkedOffers.length > 1) {
        return MATCHING_MODELS.GROUP_FORMATION;
      }
      
      // Check for circular dependencies
      if (hasCircularDependencies(opportunity)) {
        return MATCHING_MODELS.CIRCULAR_EXCHANGE;
      }
      
      return MATCHING_MODELS.TWO_WAY_DEPENDENCY;
    }

    // Check for group formation (consortium, multiple offers)
    if (opportunity.linkedOffers && opportunity.linkedOffers.length > 1) {
      return MATCHING_MODELS.GROUP_FORMATION;
    }

    // Check model type for consortium/group models
    const modelType = opportunity.modelType || opportunity.subModel || opportunity.model;
    if (modelType === '1.2' || modelType === '1.3' || modelType === '1.4') {
      // Consortium, JV, or SPV - likely group formation
      return MATCHING_MODELS.GROUP_FORMATION;
    }

    // Default: One-Way Matching
    return MATCHING_MODELS.ONE_WAY;
  }

  /**
   * Check if opportunity has circular dependencies
   * @param {Object} opportunity - Opportunity object
   * @returns {boolean} - True if circular dependencies exist
   */
  function hasCircularDependencies(opportunity) {
    if (!opportunity.linkedOffers || opportunity.linkedOffers.length < 2) {
      return false;
    }

    // Check if linked offers form a circular chain
    // A → B → C → A pattern
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      return false;
    }

    const visited = new Set();
    const chain = [opportunity.id];

    function checkCircular(currentId, startId) {
      if (visited.has(currentId)) {
        return currentId === startId;
      }

      visited.add(currentId);
      const currentOpp = PMTwinData.Opportunities.getById(currentId);
      
      if (!currentOpp || !currentOpp.linkedOffers || currentOpp.linkedOffers.length === 0) {
        return false;
      }

      for (const linkedId of currentOpp.linkedOffers) {
        if (checkCircular(linkedId, startId)) {
          return true;
        }
      }

      return false;
    }

    return checkCircular(opportunity.id, opportunity.id);
  }

  /**
   * Get matching model description
   * @param {string} modelType - Matching model type
   * @returns {Object} - Model description
   */
  function getMatchingModelDescription(modelType) {
    const descriptions = {
      [MATCHING_MODELS.ONE_WAY]: {
        name: 'One-Way Matching (Simple)',
        description: 'Simple matching where a Need is matched with one or more Offers. Standard marketplace matching.',
        useCase: 'Standard project matching, service requests, simple collaborations'
      },
      [MATCHING_MODELS.TWO_WAY_DEPENDENCY]: {
        name: 'Two-Way Dependency Matching',
        description: 'Bidirectional matching for barter deals. Requires validation that both parties\' needs and offers match each other.',
        useCase: 'Barter transactions, service-for-service exchanges'
      },
      [MATCHING_MODELS.GROUP_FORMATION]: {
        name: 'Group Formation (Consortium)',
        description: 'Multiple Offers are matched to one Need. Used for consortiums, joint ventures, and group collaborations.',
        useCase: 'Consortiums, JVs, SPVs, multi-party projects'
      },
      [MATCHING_MODELS.CIRCULAR_EXCHANGE]: {
        name: 'Circular Exchange (Multi-party barter)',
        description: 'Circular dependency chain where multiple parties form a closed loop of needs and offers.',
        useCase: 'Multi-party barter, circular service exchanges'
      }
    };

    return descriptions[modelType] || descriptions[MATCHING_MODELS.ONE_WAY];
  }

  /**
   * Validate matching model compatibility
   * @param {Object} need - Need opportunity
   * @param {Object} offer - Offer opportunity
   * @param {string} matchingModel - Matching model type
   * @returns {Object} - Validation result { valid: boolean, errors: string[] }
   */
  function validateMatchingModelCompatibility(need, offer, matchingModel) {
    const errors = [];

    switch (matchingModel) {
      case MATCHING_MODELS.ONE_WAY:
        // One-way: Need must be REQUEST_SERVICE, Offer must be OFFER_SERVICE
        if (need.intentType !== 'REQUEST_SERVICE' && need.intent !== 'REQUEST_SERVICE') {
          errors.push('One-Way matching requires Need to have REQUEST_SERVICE intent');
        }
        if (offer.intentType !== 'OFFER_SERVICE' && offer.intent !== 'OFFER_SERVICE') {
          errors.push('One-Way matching requires Offer to have OFFER_SERVICE intent');
        }
        break;

      case MATCHING_MODELS.TWO_WAY_DEPENDENCY:
        // Two-way: Both must support barter/hybrid
        const needPaymentMode = need.paymentMode || need.preferredPaymentTerms?.mode;
        const offerPaymentMode = offer.paymentMode || offer.preferredPaymentTerms?.mode;
        
        if (needPaymentMode !== 'BARTER' && needPaymentMode !== 'Barter' && 
            needPaymentMode !== 'HYBRID' && needPaymentMode !== 'Hybrid') {
          errors.push('Two-Way Dependency matching requires Need to have Barter or Hybrid payment mode');
        }
        if (offerPaymentMode !== 'BARTER' && offerPaymentMode !== 'Barter' && 
            offerPaymentMode !== 'HYBRID' && offerPaymentMode !== 'Hybrid') {
          errors.push('Two-Way Dependency matching requires Offer to have Barter or Hybrid payment mode');
        }
        break;

      case MATCHING_MODELS.GROUP_FORMATION:
        // Group formation: Need can link to multiple offers
        if (!need.linkedOffers || need.linkedOffers.length < 2) {
          errors.push('Group Formation requires Need to link to multiple Offers');
        }
        break;

      case MATCHING_MODELS.CIRCULAR_EXCHANGE:
        // Circular: Must have circular dependency chain
        if (!hasCircularDependencies(need)) {
          errors.push('Circular Exchange requires circular dependency chain');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get matching model icon/indicator
   * @param {string} modelType - Matching model type
   * @returns {string} - Icon/indicator
   */
  function getMatchingModelIndicator(modelType) {
    const indicators = {
      [MATCHING_MODELS.ONE_WAY]: '→',
      [MATCHING_MODELS.TWO_WAY_DEPENDENCY]: '↔',
      [MATCHING_MODELS.GROUP_FORMATION]: '👥',
      [MATCHING_MODELS.CIRCULAR_EXCHANGE]: '🔄'
    };

    return indicators[modelType] || '→';
  }

  // ============================================
  // Export
  // ============================================

  window.MatchingModels = {
    MODELS: MATCHING_MODELS,
    determine: determineMatchingModel,
    getDescription: getMatchingModelDescription,
    validate: validateMatchingModelCompatibility,
    getIndicator: getMatchingModelIndicator,
    hasCircularDependencies: hasCircularDependencies
  };

})();
