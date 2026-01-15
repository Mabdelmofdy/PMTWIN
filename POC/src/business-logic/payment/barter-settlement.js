/**
 * Barter Settlement Engine
 * Handles barter value equivalence calculation and settlement rule enforcement
 * Settlement Rules:
 * - EQUAL_VALUE_ONLY: Values must match exactly
 * - ALLOW_DIFFERENCE_WITH_CASH: Cash component allowed for imbalance
 * - ACCEPT_AS_IS: Value difference explicitly waived
 */

(function() {
  'use strict';

  // Settlement rule constants
  const SETTLEMENT_RULES = {
    EQUAL_VALUE_ONLY: 'EQUAL_VALUE_ONLY',
    ALLOW_DIFFERENCE_WITH_CASH: 'ALLOW_DIFFERENCE_WITH_CASH',
    ACCEPT_AS_IS: 'ACCEPT_AS_IS'
  };

  // Tolerance for "equal" values (percentage)
  const EQUAL_VALUE_TOLERANCE = 0.01; // 0.01% tolerance

  /**
   * Calculate barter equivalence
   * @param {Array} servicesOffered - Array of service items being offered
   * @param {Array} servicesRequested - Array of service items being requested
   * @returns {Object} - Equivalence calculation result
   */
  function calculateBarterEquivalence(servicesOffered, servicesRequested) {
    if (typeof ServiceItemModel === 'undefined') {
      console.error('ServiceItemModel not available');
      return null;
    }

    // Convert to standardized service items if needed
    const offered = Array.isArray(servicesOffered) 
      ? servicesOffered.map(item => ServiceItemModel.convertLegacy(item))
      : [];
    const requested = Array.isArray(servicesRequested)
      ? servicesRequested.map(item => ServiceItemModel.convertLegacy(item))
      : [];

    // Calculate totals
    const totalOffered = ServiceItemModel.calculateTotal(offered);
    const totalRequested = ServiceItemModel.calculateTotal(requested);
    const balance = totalOffered - totalRequested;
    const absoluteBalance = Math.abs(balance);

    // Calculate by currency
    const offeredByCurrency = ServiceItemModel.calculateTotalByCurrency(offered);
    const requestedByCurrency = ServiceItemModel.calculateTotalByCurrency(requested);

    // Determine if values match (within tolerance)
    const average = (totalOffered + totalRequested) / 2;
    const percentageDifference = average > 0 ? (absoluteBalance / average) * 100 : 0;
    const isEqual = percentageDifference <= EQUAL_VALUE_TOLERANCE;

    return {
      servicesOffered: offered,
      servicesRequested: requested,
      totalOffered: totalOffered,
      totalRequested: totalRequested,
      balance: balance,
      absoluteBalance: absoluteBalance,
      percentageDifference: percentageDifference,
      isEqual: isEqual,
      offeredByCurrency: offeredByCurrency,
      requestedByCurrency: requestedByCurrency,
      // Settlement options
      requiresCashSettlement: balance !== 0 && !isEqual,
      cashComponent: balance !== 0 && !isEqual ? Math.abs(balance) : 0,
      cashComponentDirection: balance > 0 ? 'REQUESTER_PAYS' : 'OFFERER_PAYS'
    };
  }

  /**
   * Apply settlement rule to barter proposal
   * @param {Object} equivalence - Equivalence calculation result from calculateBarterEquivalence
   * @param {string} rule - Settlement rule (EQUAL_VALUE_ONLY | ALLOW_DIFFERENCE_WITH_CASH | ACCEPT_AS_IS)
   * @param {Object} options - Additional options { cashComponent: number, explicitWaiver: boolean }
   * @returns {Object} - Settlement result { valid: boolean, errors: string[], settlement: Object }
   */
  function applySettlementRule(equivalence, rule, options = {}) {
    const errors = [];
    let settlement = {
      rule: rule,
      valid: false,
      requiresConsent: false,
      cashComponent: 0,
      cashComponentDirection: null,
      explicitWaiver: false
    };

    if (!equivalence) {
      errors.push('Equivalence calculation is required');
      return { valid: false, errors: errors, settlement: settlement };
    }

    // Check if values are equal
    if (equivalence.isEqual) {
      settlement.valid = true;
      settlement.cashComponent = 0;
      return { valid: true, errors: [], settlement: settlement };
    }

    const balance = equivalence.balance;
    const absoluteBalance = equivalence.absoluteBalance;

    switch (rule) {
      case SETTLEMENT_RULES.EQUAL_VALUE_ONLY:
        // Values must match exactly (within tolerance)
        if (!equivalence.isEqual) {
          errors.push(`Values must match exactly. Difference: ${absoluteBalance.toLocaleString()} ${equivalence.servicesOffered[0]?.currency || 'SAR'}`);
          settlement.valid = false;
        } else {
          settlement.valid = true;
        }
        break;

      case SETTLEMENT_RULES.ALLOW_DIFFERENCE_WITH_CASH:
        // Cash component is allowed to balance the difference
        if (options.cashComponent !== undefined) {
          // Validate cash component matches the difference
          const expectedCash = absoluteBalance;
          const providedCash = Math.abs(options.cashComponent || 0);
          const cashDifference = Math.abs(expectedCash - providedCash);
          
          if (cashDifference > 0.01) {
            errors.push(`Cash component (${providedCash.toLocaleString()}) does not match value difference (${expectedCash.toLocaleString()})`);
            settlement.valid = false;
          } else {
            settlement.valid = true;
            settlement.cashComponent = providedCash;
            settlement.cashComponentDirection = balance > 0 ? 'REQUESTER_PAYS' : 'OFFERER_PAYS';
            settlement.requiresConsent = true; // Both parties must consent to cash settlement
          }
        } else {
          // Cash component not provided but required
          settlement.valid = true; // Valid structure, but cash component needs to be set
          settlement.cashComponent = absoluteBalance;
          settlement.cashComponentDirection = balance > 0 ? 'REQUESTER_PAYS' : 'OFFERER_PAYS';
          settlement.requiresConsent = true;
        }
        break;

      case SETTLEMENT_RULES.ACCEPT_AS_IS:
        // Value difference is explicitly waived - requires explicit consent
        if (options.explicitWaiver !== true) {
          errors.push('Explicit waiver consent is required for ACCEPT_AS_IS settlement rule');
          settlement.valid = false;
        } else {
          settlement.valid = true;
          settlement.explicitWaiver = true;
          settlement.requiresConsent = true; // Both parties must explicitly consent
          settlement.cashComponent = 0;
        }
        break;

      default:
        errors.push(`Unknown settlement rule: ${rule}`);
        settlement.valid = false;
    }

    return {
      valid: errors.length === 0 && settlement.valid,
      errors: errors,
      settlement: settlement
    };
  }

  /**
   * Validate barter proposal
   * @param {Object} proposal - Barter proposal object
   * @returns {Object} - Validation result { valid: boolean, errors: string[], equivalence: Object }
   */
  function validateBarterProposal(proposal) {
    const errors = [];

    // Check required fields
    if (!proposal.servicesOffered || !Array.isArray(proposal.servicesOffered) || proposal.servicesOffered.length === 0) {
      errors.push('Services offered are required');
    }

    if (!proposal.servicesRequested || !Array.isArray(proposal.servicesRequested) || proposal.servicesRequested.length === 0) {
      errors.push('Services requested are required');
    }

    if (!proposal.barterSettlementRule) {
      errors.push('Barter settlement rule is required');
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors: errors,
        equivalence: null
      };
    }

    // Calculate equivalence
    const equivalence = calculateBarterEquivalence(
      proposal.servicesOffered,
      proposal.servicesRequested
    );

    if (!equivalence) {
      errors.push('Failed to calculate barter equivalence');
      return {
        valid: false,
        errors: errors,
        equivalence: null
      };
    }

    // Validate service items
    if (typeof ServiceItemModel !== 'undefined') {
      const offeredValidation = ServiceItemModel.validateArray(proposal.servicesOffered);
      if (!offeredValidation.valid) {
        errors.push(...offeredValidation.errors);
      }

      const requestedValidation = ServiceItemModel.validateArray(proposal.servicesRequested);
      if (!requestedValidation.valid) {
        errors.push(...requestedValidation.errors);
      }
    }

    // Apply settlement rule
    const settlementResult = applySettlementRule(
      equivalence,
      proposal.barterSettlementRule,
      {
        cashComponent: proposal.cashComponent,
        explicitWaiver: proposal.explicitWaiver === true
      }
    );

    if (!settlementResult.valid) {
      errors.push(...settlementResult.errors);
    }

    return {
      valid: errors.length === 0 && settlementResult.valid,
      errors: errors,
      equivalence: equivalence,
      settlement: settlementResult.settlement
    };
  }

  /**
   * Generate barter agreement terms
   * @param {Object} proposal - Validated barter proposal
   * @param {Object} equivalence - Equivalence calculation result
   * @returns {Object} - Barter agreement terms
   */
  function generateBarterAgreement(proposal, equivalence) {
    if (!proposal || !equivalence) {
      return null;
    }

    const agreement = {
      type: 'BARTER',
      servicesOffered: equivalence.servicesOffered,
      servicesRequested: equivalence.servicesRequested,
      totalOffered: equivalence.totalOffered,
      totalRequested: equivalence.totalRequested,
      balance: equivalence.balance,
      settlementRule: proposal.barterSettlementRule,
      settlement: {
        cashComponent: 0,
        cashComponentDirection: null,
        explicitWaiver: false
      },
      terms: proposal.terms || {},
      exchangeSchedule: proposal.exchangeSchedule || 'Concurrent',
      qualityStandards: proposal.qualityStandards || 'All services must meet project specifications',
      disputeResolution: proposal.disputeResolution || 'Disputes to be resolved through PMTwin mediation'
    };

    // Add settlement details based on rule
    if (proposal.barterSettlementRule === SETTLEMENT_RULES.ALLOW_DIFFERENCE_WITH_CASH && proposal.cashComponent) {
      agreement.settlement.cashComponent = Math.abs(proposal.cashComponent);
      agreement.settlement.cashComponentDirection = equivalence.balance > 0 ? 'REQUESTER_PAYS' : 'OFFERER_PAYS';
    } else if (proposal.barterSettlementRule === SETTLEMENT_RULES.ACCEPT_AS_IS && proposal.explicitWaiver) {
      agreement.settlement.explicitWaiver = true;
      agreement.settlement.waivedAmount = equivalence.absoluteBalance;
    }

    return agreement;
  }

  /**
   * Check if barter proposal requires consent
   * @param {Object} proposal - Barter proposal
   * @returns {boolean} - True if consent is required
   */
  function requiresConsent(proposal) {
    if (!proposal.barterSettlementRule) {
      return false;
    }

    const equivalence = calculateBarterEquivalence(
      proposal.servicesOffered,
      proposal.servicesRequested
    );

    if (!equivalence || equivalence.isEqual) {
      return false;
    }

    return proposal.barterSettlementRule === SETTLEMENT_RULES.ALLOW_DIFFERENCE_WITH_CASH ||
           proposal.barterSettlementRule === SETTLEMENT_RULES.ACCEPT_AS_IS;
  }

  // ============================================
  // Export
  // ============================================

  window.BarterSettlement = {
    SETTLEMENT_RULES: SETTLEMENT_RULES,
    calculateEquivalence: calculateBarterEquivalence,
    applyRule: applySettlementRule,
    validate: validateBarterProposal,
    generateAgreement: generateBarterAgreement,
    requiresConsent: requiresConsent
  };

})();
