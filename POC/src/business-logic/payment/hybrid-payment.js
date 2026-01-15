/**
 * Hybrid Payment Engine
 * Handles composition and validation of hybrid payments (Cash + Services)
 */

(function() {
  'use strict';

  /**
   * Compose hybrid payment from cash and service components
   * @param {Object} cashComponent - Cash payment details { amount: number, currency: string }
   * @param {Array} serviceComponents - Array of service items
   * @returns {Object} - Hybrid payment composition
   */
  function composeHybridPayment(cashComponent, serviceComponents) {
    if (typeof ServiceItemModel === 'undefined') {
      console.error('ServiceItemModel not available');
      return null;
    }

    // Validate cash component
    const cashAmount = cashComponent?.amount || 0;
    const cashCurrency = cashComponent?.currency || 'SAR';

    // Convert and validate service components
    const services = Array.isArray(serviceComponents)
      ? serviceComponents.map(item => ServiceItemModel.convertLegacy(item))
      : [];

    // Calculate service totals
    const serviceTotal = ServiceItemModel.calculateTotal(services);
    const serviceByCurrency = ServiceItemModel.calculateTotalByCurrency(services);

    // Total value
    const totalValue = cashAmount + serviceTotal;

    // Validate currency consistency (all services should be in same currency as cash, or convert)
    const serviceCurrencies = Object.keys(serviceByCurrency);
    const currencyMismatch = serviceCurrencies.length > 0 && 
                           serviceCurrencies.some(curr => curr !== cashCurrency);

    return {
      cashComponent: {
        amount: cashAmount,
        currency: cashCurrency
      },
      serviceComponents: services,
      serviceTotal: serviceTotal,
      serviceByCurrency: serviceByCurrency,
      totalValue: totalValue,
      currency: cashCurrency,
      currencyMismatch: currencyMismatch,
      composition: {
        cashPercentage: totalValue > 0 ? (cashAmount / totalValue) * 100 : 0,
        servicePercentage: totalValue > 0 ? (serviceTotal / totalValue) * 100 : 0
      }
    };
  }

  /**
   * Calculate total value of hybrid payment
   * @param {Object} hybridPayment - Hybrid payment composition
   * @returns {number} - Total value
   */
  function calculateHybridValue(hybridPayment) {
    if (!hybridPayment) {
      return 0;
    }

    return hybridPayment.totalValue || 0;
  }

  /**
   * Validate hybrid proposal
   * @param {Object} proposal - Hybrid proposal object
   * @returns {Object} - Validation result { valid: boolean, errors: string[], composition: Object }
   */
  function validateHybridProposal(proposal) {
    const errors = [];

    // Check required fields
    if (!proposal.cashComponent) {
      errors.push('Cash component is required for hybrid payment');
    } else {
      if (typeof proposal.cashComponent.amount !== 'number' || proposal.cashComponent.amount < 0) {
        errors.push('Cash component amount must be a non-negative number');
      }
      if (!proposal.cashComponent.currency) {
        errors.push('Cash component currency is required');
      }
    }

    if (!proposal.serviceComponents || !Array.isArray(proposal.serviceComponents) || proposal.serviceComponents.length === 0) {
      errors.push('Service components are required for hybrid payment');
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors: errors,
        composition: null
      };
    }

    // Compose hybrid payment
    const composition = composeHybridPayment(
      proposal.cashComponent,
      proposal.serviceComponents
    );

    if (!composition) {
      errors.push('Failed to compose hybrid payment');
      return {
        valid: false,
        errors: errors,
        composition: null
      };
    }

    // Check currency mismatch
    if (composition.currencyMismatch) {
      errors.push('Service components currency does not match cash component currency');
    }

    // Validate service items
    if (typeof ServiceItemModel !== 'undefined') {
      const serviceValidation = ServiceItemModel.validateArray(proposal.serviceComponents);
      if (!serviceValidation.valid) {
        errors.push(...serviceValidation.errors);
      }
    }

    // Validate that at least one component has value
    if (composition.cashComponent.amount === 0 && composition.serviceTotal === 0) {
      errors.push('Hybrid payment must have at least one component with value');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      composition: composition
    };
  }

  /**
   * Generate hybrid contract terms
   * @param {Object} proposal - Validated hybrid proposal
   * @param {Object} composition - Hybrid payment composition
   * @returns {Object} - Hybrid contract terms
   */
  function generateHybridContractTerms(proposal, composition) {
    if (!proposal || !composition) {
      return null;
    }

    return {
      type: 'HYBRID',
      cashComponent: {
        amount: composition.cashComponent.amount,
        currency: composition.cashComponent.currency,
        paymentTerms: proposal.cashPaymentTerms || proposal.paymentTerms || 'milestone_based',
        paymentSchedule: proposal.cashPaymentSchedule || []
      },
      serviceComponents: composition.serviceComponents,
      serviceTotal: composition.serviceTotal,
      totalValue: composition.totalValue,
      currency: composition.currency,
      composition: {
        cashPercentage: composition.composition.cashPercentage,
        servicePercentage: composition.composition.servicePercentage
      },
      terms: proposal.terms || {},
      timeline: proposal.timeline || {},
      deliverables: proposal.deliverables || []
    };
  }

  /**
   * Split hybrid payment into cash and service components for display
   * @param {Object} hybridPayment - Hybrid payment composition
   * @returns {Object} - Split components { cash: Object, services: Array }
   */
  function splitHybridPayment(hybridPayment) {
    if (!hybridPayment) {
      return { cash: null, services: [] };
    }

    return {
      cash: hybridPayment.cashComponent,
      services: hybridPayment.serviceComponents || []
    };
  }

  /**
   * Convert hybrid payment to barter (if cash component is zero)
   * @param {Object} hybridPayment - Hybrid payment composition
   * @returns {Object|null} - Barter equivalence if convertible, null otherwise
   */
  function convertToBarter(hybridPayment) {
    if (!hybridPayment || hybridPayment.cashComponent.amount > 0) {
      return null;
    }

    if (typeof BarterSettlement === 'undefined') {
      return null;
    }

    // If no cash component, it's effectively barter
    return BarterSettlement.calculateEquivalence(
      hybridPayment.serviceComponents,
      [] // No services requested in pure barter conversion
    );
  }

  /**
   * Convert hybrid payment to cash-only (if service components are empty)
   * @param {Object} hybridPayment - Hybrid payment composition
   * @returns {Object|null} - Cash payment if convertible, null otherwise
   */
  function convertToCash(hybridPayment) {
    if (!hybridPayment || 
        !hybridPayment.serviceComponents || 
        hybridPayment.serviceComponents.length === 0 ||
        hybridPayment.serviceTotal > 0) {
      return null;
    }

    // If no service components, it's effectively cash-only
    return {
      amount: hybridPayment.cashComponent.amount,
      currency: hybridPayment.cashComponent.currency,
      type: 'CASH'
    };
  }

  // ============================================
  // Export
  // ============================================

  window.HybridPayment = {
    compose: composeHybridPayment,
    calculateValue: calculateHybridValue,
    validate: validateHybridProposal,
    generateContractTerms: generateHybridContractTerms,
    split: splitHybridPayment,
    convertToBarter: convertToBarter,
    convertToCash: convertToCash
  };

})();
