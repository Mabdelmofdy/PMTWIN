/**
 * Service Item Model
 * Standardized structure for representing services across all models
 * Aligns with product vision: Service Name, Description, Unit of Measure, Quantity, Unit Price, Total Reference Value
 */

(function() {
  'use strict';

  // ============================================
  // Service Item Structure
  // ============================================

  /**
   * Create a service item
   * @param {Object} itemData - Service item data
   * @returns {Object} - Service item object
   */
  function createServiceItem(itemData) {
    const item = {
      id: itemData.id || `service_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serviceName: itemData.serviceName || '',
      description: itemData.description || '',
      unitOfMeasure: itemData.unitOfMeasure || 'unit',
      quantity: itemData.quantity || 1,
      unitPrice: itemData.unitPrice || 0,
      totalReferenceValue: itemData.totalReferenceValue || (itemData.quantity * itemData.unitPrice) || 0,
      currency: itemData.currency || 'SAR',
      // Optional fields
      category: itemData.category || null,
      subcategory: itemData.subcategory || null,
      timeline: itemData.timeline || null,
      deliverables: itemData.deliverables || [],
      requirements: itemData.requirements || [],
      metadata: itemData.metadata || {}
    };

    // Recalculate total if not explicitly provided
    if (!itemData.totalReferenceValue) {
      item.totalReferenceValue = item.quantity * item.unitPrice;
    }

    return item;
  }

  /**
   * Validate service item
   * @param {Object} item - Service item to validate
   * @returns {Object} - Validation result { valid: boolean, errors: string[] }
   */
  function validateServiceItem(item) {
    const errors = [];

    if (!item.serviceName || item.serviceName.trim().length === 0) {
      errors.push('Service name is required');
    }

    if (!item.description || item.description.trim().length === 0) {
      errors.push('Service description is required');
    }

    if (!item.unitOfMeasure || item.unitOfMeasure.trim().length === 0) {
      errors.push('Unit of measure is required');
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push('Quantity must be a positive number');
    }

    if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
      errors.push('Unit price must be a non-negative number');
    }

    if (typeof item.totalReferenceValue !== 'number' || item.totalReferenceValue < 0) {
      errors.push('Total reference value must be a non-negative number');
    }

    // Validate total matches quantity * unitPrice (with small tolerance for rounding)
    const calculatedTotal = item.quantity * item.unitPrice;
    const difference = Math.abs(item.totalReferenceValue - calculatedTotal);
    if (difference > 0.01) {
      errors.push(`Total reference value (${item.totalReferenceValue}) does not match quantity × unit price (${calculatedTotal})`);
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Calculate total value of service items array
   * @param {Array} items - Array of service items
   * @returns {number} - Total value
   */
  function calculateTotalValue(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return 0;
    }

    return items.reduce((total, item) => {
      return total + (item.totalReferenceValue || 0);
    }, 0);
  }

  /**
   * Calculate total value by currency
   * @param {Array} items - Array of service items
   * @returns {Object} - Totals by currency { SAR: 1000, USD: 500 }
   */
  function calculateTotalByCurrency(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return {};
    }

    return items.reduce((totals, item) => {
      const currency = item.currency || 'SAR';
      totals[currency] = (totals[currency] || 0) + (item.totalReferenceValue || 0);
      return totals;
    }, {});
  }

  /**
   * Validate array of service items
   * @param {Array} items - Array of service items
   * @returns {Object} - Validation result { valid: boolean, errors: string[], itemErrors: Object }
   */
  function validateServiceItems(items) {
    if (!Array.isArray(items)) {
      return {
        valid: false,
        errors: ['Service items must be an array'],
        itemErrors: {}
      };
    }

    const errors = [];
    const itemErrors = {};

    items.forEach((item, index) => {
      const validation = validateServiceItem(item);
      if (!validation.valid) {
        errors.push(`Item ${index + 1}: ${validation.errors.join(', ')}`);
        itemErrors[item.id || index] = validation.errors;
      }
    });

    return {
      valid: errors.length === 0,
      errors: errors,
      itemErrors: itemErrors
    };
  }

  /**
   * Convert legacy service format to standardized service item
   * @param {Object} legacyService - Legacy service object
   * @returns {Object} - Standardized service item
   */
  function convertLegacyService(legacyService) {
    // Handle various legacy formats
    if (legacyService.item || legacyService.serviceName) {
      return createServiceItem({
        serviceName: legacyService.serviceName || legacyService.item || legacyService.description,
        description: legacyService.description || legacyService.serviceName || legacyService.item,
        unitOfMeasure: legacyService.unit || legacyService.unitOfMeasure || 'unit',
        quantity: legacyService.quantity || 1,
        unitPrice: legacyService.unitPrice || legacyService.price || 0,
        totalReferenceValue: legacyService.total || legacyService.totalReferenceValue || (legacyService.quantity * legacyService.unitPrice) || 0,
        currency: legacyService.currency || 'SAR',
        category: legacyService.category,
        deliverables: legacyService.deliverables || []
      });
    }

    // If already in correct format, validate and return
    return createServiceItem(legacyService);
  }

  /**
   * Convert array of legacy services to standardized service items
   * @param {Array} legacyServices - Array of legacy service objects
   * @returns {Array} - Array of standardized service items
   */
  function convertLegacyServices(legacyServices) {
    if (!Array.isArray(legacyServices)) {
      return [];
    }

    return legacyServices.map(service => convertLegacyService(service));
  }

  /**
   * Format service item for display
   * @param {Object} item - Service item
   * @returns {String} - Formatted string
   */
  function formatServiceItem(item) {
    return `${item.serviceName} - ${item.quantity} ${item.unitOfMeasure} × ${item.unitPrice.toLocaleString()} ${item.currency} = ${item.totalReferenceValue.toLocaleString()} ${item.currency}`;
  }

  /**
   * Compare two service items for equivalence (for barter matching)
   * @param {Object} item1 - First service item
   * @param {Object} item2 - Second service item
   * @param {number} tolerance - Tolerance percentage (default 5%)
   * @returns {Object} - Comparison result { equivalent: boolean, difference: number, percentage: number }
   */
  function compareServiceItems(item1, item2, tolerance = 5) {
    const value1 = item1.totalReferenceValue || 0;
    const value2 = item2.totalReferenceValue || 0;
    const difference = Math.abs(value1 - value2);
    const average = (value1 + value2) / 2;
    const percentage = average > 0 ? (difference / average) * 100 : 0;

    return {
      equivalent: percentage <= tolerance,
      difference: difference,
      percentage: percentage,
      value1: value1,
      value2: value2
    };
  }

  // ============================================
  // Export
  // ============================================

  window.ServiceItemModel = {
    create: createServiceItem,
    validate: validateServiceItem,
    validateArray: validateServiceItems,
    calculateTotal: calculateTotalValue,
    calculateTotalByCurrency: calculateTotalByCurrency,
    convertLegacy: convertLegacyService,
    convertLegacyArray: convertLegacyServices,
    format: formatServiceItem,
    compare: compareServiceItems
  };

})();
