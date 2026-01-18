/**
 * Profit-Sharing Payment Engine
 * Handles profit-sharing calculations and distribution
 */

(function() {
  'use strict';

  /**
   * Validate profit-sharing details
   * @param {Object} profitSharingDetails - Profit-sharing details
   * @returns {Object} - Validation result { valid: boolean, errors: string[] }
   */
  function validateProfitSharingDetails(profitSharingDetails) {
    const errors = [];

    if (!profitSharingDetails) {
      errors.push('Profit-sharing details are required');
      return { valid: false, errors: errors };
    }

    // Validate calculation method
    const validMethods = ['Percentage', 'Fixed', 'Tiered', 'Performance'];
    if (!profitSharingDetails.calculationMethod || !validMethods.includes(profitSharingDetails.calculationMethod)) {
      errors.push(`Calculation method must be one of: ${validMethods.join(', ')}`);
    }

    // Validate shares
    if (profitSharingDetails.shares) {
      if (!Array.isArray(profitSharingDetails.shares) || profitSharingDetails.shares.length === 0) {
        errors.push('Shares array is required and must not be empty');
      } else {
        let totalPercentage = 0;
        profitSharingDetails.shares.forEach((share, index) => {
          if (!share.partyId && !share.partyName) {
            errors.push(`Share ${index + 1}: Party identifier is required`);
          }
          if (typeof share.percentage !== 'number' || share.percentage <= 0 || share.percentage > 100) {
            errors.push(`Share ${index + 1}: Percentage must be between 0 and 100`);
          }
          totalPercentage += share.percentage || 0;
        });

        // Check if percentages sum to 100 (with tolerance)
        if (Math.abs(totalPercentage - 100) > 0.01) {
          errors.push(`Total share percentages must sum to 100% (current: ${totalPercentage.toFixed(2)}%)`);
        }
      }
    }

    // Validate formula if provided
    if (profitSharingDetails.formula) {
      const formulaErrors = validateFormula(profitSharingDetails.formula, profitSharingDetails.calculationMethod);
      if (formulaErrors.length > 0) {
        errors.push(...formulaErrors);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate profit-sharing formula
   * @param {string|Object} formula - Formula string or object
   * @param {string} calculationMethod - Calculation method
   * @returns {string[]} - Array of validation errors
   */
  function validateFormula(formula, calculationMethod) {
    const errors = [];

    if (calculationMethod === 'Percentage' || calculationMethod === 'Fixed') {
      // Simple formulas for percentage/fixed
      if (typeof formula !== 'string' || formula.trim().length === 0) {
        errors.push('Formula is required for percentage/fixed calculation');
      }
    } else if (calculationMethod === 'Tiered') {
      // Tiered requires tiers array
      if (!Array.isArray(formula.tiers) || formula.tiers.length === 0) {
        errors.push('Tiers array is required for tiered calculation');
      } else {
        formula.tiers.forEach((tier, index) => {
          if (typeof tier.threshold !== 'number' || tier.threshold < 0) {
            errors.push(`Tier ${index + 1}: Threshold must be a positive number`);
          }
          if (typeof tier.percentage !== 'number' || tier.percentage <= 0 || tier.percentage > 100) {
            errors.push(`Tier ${index + 1}: Percentage must be between 0 and 100`);
          }
        });
      }
    } else if (calculationMethod === 'Performance') {
      // Performance requires performance metrics
      if (!formula.metrics || !Array.isArray(formula.metrics) || formula.metrics.length === 0) {
        errors.push('Performance metrics array is required');
      }
    }

    return errors;
  }

  /**
   * Calculate profit distribution
   * @param {Object} profitSharingDetails - Profit-sharing details
   * @param {number} totalProfit - Total profit amount
   * @returns {Object} - Profit distribution calculation
   */
  function calculateProfitDistribution(profitSharingDetails, totalProfit) {
    if (!profitSharingDetails || !profitSharingDetails.shares) {
      return { distributions: [], totalDistributed: 0 };
    }

    const distributions = profitSharingDetails.shares.map(share => {
      let shareAmount = 0;

      switch (profitSharingDetails.calculationMethod) {
        case 'Percentage':
          shareAmount = (totalProfit * share.percentage) / 100;
          break;

        case 'Fixed':
          shareAmount = share.fixedAmount || 0;
          break;

        case 'Tiered':
          shareAmount = calculateTieredDistribution(share, totalProfit, profitSharingDetails.formula);
          break;

        case 'Performance':
          shareAmount = calculatePerformanceDistribution(share, totalProfit, profitSharingDetails.formula);
          break;

        default:
          shareAmount = (totalProfit * share.percentage) / 100;
      }

      return {
        partyId: share.partyId,
        partyName: share.partyName,
        percentage: share.percentage,
        amount: shareAmount,
        currency: profitSharingDetails.currency || 'SAR'
      };
    });

    const totalDistributed = distributions.reduce((sum, d) => sum + d.amount, 0);

    return {
      distributions: distributions,
      totalDistributed: totalDistributed,
      remainingProfit: totalProfit - totalDistributed,
      currency: profitSharingDetails.currency || 'SAR'
    };
  }

  /**
   * Calculate tiered distribution
   * @param {Object} share - Share details
   * @param {number} totalProfit - Total profit
   * @param {Object} formula - Formula with tiers
   * @returns {number} - Calculated share amount
   */
  function calculateTieredDistribution(share, totalProfit, formula) {
    if (!formula || !formula.tiers) {
      return (totalProfit * share.percentage) / 100;
    }

    let shareAmount = 0;
    let remainingProfit = totalProfit;

    for (const tier of formula.tiers) {
      if (remainingProfit <= 0) break;

      const tierAmount = Math.min(remainingProfit, tier.threshold);
      const tierShare = (tierAmount * tier.percentage) / 100;
      shareAmount += tierShare;
      remainingProfit -= tierAmount;
    }

    return shareAmount;
  }

  /**
   * Calculate performance-based distribution
   * @param {Object} share - Share details
   * @param {number} totalProfit - Total profit
   * @param {Object} formula - Formula with performance metrics
   * @returns {number} - Calculated share amount
   */
  function calculatePerformanceDistribution(share, totalProfit, formula) {
    if (!formula || !formula.metrics) {
      return (totalProfit * share.percentage) / 100;
    }

    // Calculate performance multiplier based on metrics
    let performanceMultiplier = 1.0;
    
    formula.metrics.forEach(metric => {
      const actualValue = metric.actualValue || 0;
      const targetValue = metric.targetValue || 1;
      const weight = metric.weight || 1;

      if (targetValue > 0) {
        const achievement = actualValue / targetValue;
        performanceMultiplier += (achievement - 1) * weight;
      }
    });

    // Apply multiplier to base percentage
    const adjustedPercentage = share.percentage * Math.max(0, performanceMultiplier);
    return (totalProfit * adjustedPercentage) / 100;
  }

  /**
   * Generate profit-sharing agreement terms
   * @param {Object} profitSharingDetails - Validated profit-sharing details
   * @returns {Object} - Profit-sharing agreement terms
   */
  function generateProfitSharingAgreement(profitSharingDetails) {
    if (!profitSharingDetails) {
      return null;
    }

    const validation = validateProfitSharingDetails(profitSharingDetails);
    if (!validation.valid) {
      return null;
    }

    const agreement = {
      type: 'PROFIT_SHARING',
      calculationMethod: profitSharingDetails.calculationMethod,
      formula: profitSharingDetails.formula || {},
      shares: profitSharingDetails.shares || [],
      currency: profitSharingDetails.currency || 'SAR',
      distributionFrequency: profitSharingDetails.distributionFrequency || 'Annually',
      terms: profitSharingDetails.terms || {},
      profitDefinition: profitSharingDetails.profitDefinition || 'Net profit after all expenses',
      auditRights: profitSharingDetails.auditRights !== undefined ? profitSharingDetails.auditRights : true,
      disputeResolution: profitSharingDetails.disputeResolution || 'Disputes to be resolved through PMTwin mediation'
    };

    return agreement;
  }

  /**
   * Format profit-sharing details for display
   * @param {Object} profitSharingDetails - Profit-sharing details
   * @returns {string} - Formatted string
   */
  function formatProfitSharingDetails(profitSharingDetails) {
    if (!profitSharingDetails) return 'Not specified';

    const parts = [profitSharingDetails.calculationMethod || 'Percentage'];
    
    if (profitSharingDetails.shares && profitSharingDetails.shares.length > 0) {
      const shareStrings = profitSharingDetails.shares.map(s => 
        `${s.partyName || s.partyId}: ${s.percentage}%`
      );
      parts.push(`(${shareStrings.join(', ')})`);
    }

    return parts.join(' ');
  }

  // ============================================
  // Export
  // ============================================

  window.ProfitSharingPayment = {
    validate: validateProfitSharingDetails,
    validateFormula: validateFormula,
    calculateDistribution: calculateProfitDistribution,
    generateAgreement: generateProfitSharingAgreement,
    format: formatProfitSharingDetails
  };

})();
