/**
 * Equity Payment Engine
 * Handles equity-based payment with vesting logic
 */

(function() {
  'use strict';

  /**
   * Validate equity payment details
   * @param {Object} equityDetails - Equity payment details
   * @returns {Object} - Validation result { valid: boolean, errors: string[] }
   */
  function validateEquityDetails(equityDetails) {
    const errors = [];

    if (!equityDetails) {
      errors.push('Equity details are required');
      return { valid: false, errors: errors };
    }

    // Validate equity percentage
    if (typeof equityDetails.percentage !== 'number' || 
        equityDetails.percentage <= 0 || 
        equityDetails.percentage > 100) {
      errors.push('Equity percentage must be between 0 and 100');
    }

    // Validate valuation
    if (equityDetails.valuation !== undefined) {
      if (typeof equityDetails.valuation !== 'number' || equityDetails.valuation < 0) {
        errors.push('Valuation must be a positive number');
      }
    }

    // Validate vesting schedule if provided
    if (equityDetails.vestingSchedule) {
      const vestingErrors = validateVestingSchedule(equityDetails.vestingSchedule);
      if (vestingErrors.length > 0) {
        errors.push(...vestingErrors);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate vesting schedule
   * @param {Object} vestingSchedule - Vesting schedule object
   * @returns {string[]} - Array of validation errors
   */
  function validateVestingSchedule(vestingSchedule) {
    const errors = [];

    if (!vestingSchedule.type) {
      errors.push('Vesting schedule type is required');
      return errors;
    }

    const validTypes = ['Immediate', 'Cliff', 'Gradual', 'Milestone'];
    if (!validTypes.includes(vestingSchedule.type)) {
      errors.push(`Vesting type must be one of: ${validTypes.join(', ')}`);
    }

    switch (vestingSchedule.type) {
      case 'Cliff':
        if (!vestingSchedule.cliffPeriod || vestingSchedule.cliffPeriod <= 0) {
          errors.push('Cliff period is required and must be positive');
        }
        break;

      case 'Gradual':
        if (!vestingSchedule.vestingPeriod || vestingSchedule.vestingPeriod <= 0) {
          errors.push('Vesting period is required and must be positive');
        }
        if (!vestingSchedule.vestingFrequency || !['Monthly', 'Quarterly', 'Annually'].includes(vestingSchedule.vestingFrequency)) {
          errors.push('Vesting frequency must be Monthly, Quarterly, or Annually');
        }
        break;

      case 'Milestone':
        if (!vestingSchedule.milestones || !Array.isArray(vestingSchedule.milestones) || vestingSchedule.milestones.length === 0) {
          errors.push('Milestones array is required for milestone-based vesting');
        } else {
          vestingSchedule.milestones.forEach((milestone, index) => {
            if (!milestone.percentage || milestone.percentage <= 0 || milestone.percentage > 100) {
              errors.push(`Milestone ${index + 1}: Percentage must be between 0 and 100`);
            }
            if (!milestone.description) {
              errors.push(`Milestone ${index + 1}: Description is required`);
            }
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Calculate equity value
   * @param {Object} equityDetails - Equity payment details
   * @returns {Object} - Equity value calculation
   */
  function calculateEquityValue(equityDetails) {
    if (!equityDetails || !equityDetails.percentage) {
      return { value: 0, currency: 'SAR' };
    }

    const percentage = equityDetails.percentage;
    const valuation = equityDetails.valuation || 0;
    const value = (valuation * percentage) / 100;

    return {
      percentage: percentage,
      valuation: valuation,
      equityValue: value,
      currency: equityDetails.currency || 'SAR'
    };
  }

  /**
   * Calculate vested equity at a given date
   * @param {Object} equityDetails - Equity payment details
   * @param {Date} targetDate - Target date for vesting calculation
   * @param {Date} startDate - Start date of equity grant
   * @returns {Object} - Vested equity calculation
   */
  function calculateVestedEquity(equityDetails, targetDate, startDate) {
    if (!equityDetails || !equityDetails.vestingSchedule) {
      // No vesting schedule = immediate vesting
      return {
        vestedPercentage: equityDetails.percentage || 0,
        unvestedPercentage: 0,
        vestedValue: calculateEquityValue(equityDetails).equityValue
      };
    }

    const schedule = equityDetails.vestingSchedule;
    const totalPercentage = equityDetails.percentage || 0;
    const daysSinceStart = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));

    let vestedPercentage = 0;

    switch (schedule.type) {
      case 'Immediate':
        vestedPercentage = totalPercentage;
        break;

      case 'Cliff':
        const cliffDays = schedule.cliffPeriod * (schedule.cliffPeriodUnit === 'Months' ? 30 : schedule.cliffPeriodUnit === 'Years' ? 365 : 1);
        if (daysSinceStart >= cliffDays) {
          vestedPercentage = totalPercentage;
        }
        break;

      case 'Gradual':
        const vestingDays = schedule.vestingPeriod * (schedule.vestingPeriodUnit === 'Months' ? 30 : schedule.vestingPeriodUnit === 'Years' ? 365 : 1);
        const frequencyDays = schedule.vestingFrequency === 'Monthly' ? 30 : 
                              schedule.vestingFrequency === 'Quarterly' ? 90 : 365;
        const periods = Math.floor(daysSinceStart / frequencyDays);
        const totalPeriods = Math.floor(vestingDays / frequencyDays);
        if (totalPeriods > 0) {
          vestedPercentage = Math.min(totalPercentage, (totalPercentage * periods) / totalPeriods);
        }
        break;

      case 'Milestone':
        // Calculate based on completed milestones
        const completedMilestones = schedule.milestones.filter(m => m.completed === true);
        vestedPercentage = completedMilestones.reduce((sum, m) => sum + (m.percentage || 0), 0);
        break;
    }

    const equityValue = calculateEquityValue(equityDetails);
    const vestedValue = (equityValue.equityValue * vestedPercentage) / totalPercentage;

    return {
      vestedPercentage: Math.min(vestedPercentage, totalPercentage),
      unvestedPercentage: Math.max(0, totalPercentage - vestedPercentage),
      vestedValue: vestedValue,
      totalValue: equityValue.equityValue
    };
  }

  /**
   * Generate equity agreement terms
   * @param {Object} equityDetails - Validated equity details
   * @returns {Object} - Equity agreement terms
   */
  function generateEquityAgreement(equityDetails) {
    if (!equityDetails) {
      return null;
    }

    const validation = validateEquityDetails(equityDetails);
    if (!validation.valid) {
      return null;
    }

    const equityValue = calculateEquityValue(equityDetails);

    const agreement = {
      type: 'EQUITY',
      percentage: equityDetails.percentage,
      valuation: equityDetails.valuation || 0,
      equityValue: equityValue.equityValue,
      currency: equityDetails.currency || 'SAR',
      vestingSchedule: equityDetails.vestingSchedule || { type: 'Immediate' },
      terms: equityDetails.terms || {},
      votingRights: equityDetails.votingRights !== undefined ? equityDetails.votingRights : true,
      transferRestrictions: equityDetails.transferRestrictions || 'Standard transfer restrictions apply',
      dilutionProtection: equityDetails.dilutionProtection || false
    };

    return agreement;
  }

  /**
   * Format equity details for display
   * @param {Object} equityDetails - Equity payment details
   * @returns {string} - Formatted string
   */
  function formatEquityDetails(equityDetails) {
    if (!equityDetails) return 'Not specified';

    const parts = [`${equityDetails.percentage}% equity`];
    
    if (equityDetails.valuation) {
      parts.push(`(Valuation: ${equityDetails.valuation.toLocaleString()} ${equityDetails.currency || 'SAR'})`);
    }

    if (equityDetails.vestingSchedule) {
      parts.push(`- Vesting: ${equityDetails.vestingSchedule.type}`);
    }

    return parts.join(' ');
  }

  // ============================================
  // Export
  // ============================================

  window.EquityPayment = {
    validate: validateEquityDetails,
    validateVestingSchedule: validateVestingSchedule,
    calculateValue: calculateEquityValue,
    calculateVested: calculateVestedEquity,
    generateAgreement: generateEquityAgreement,
    format: formatEquityDetails
  };

})();
