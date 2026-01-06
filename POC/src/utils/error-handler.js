/**
 * PMTwin Error Handler
 * Centralized error handling utilities
 */

(function() {
  'use strict';

  /**
   * Log error to console
   * @param {string} context - Error context/component
   * @param {Error|string} error - Error object or message
   * @param {Object} additionalInfo - Additional error information
   */
  function logError(context, error, additionalInfo = {}) {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : null;
    
    console.error(`[${context}] Error:`, errorMessage);
    if (errorStack) {
      console.error(`[${context}] Stack:`, errorStack);
    }
    if (Object.keys(additionalInfo).length > 0) {
      console.error(`[${context}] Additional Info:`, additionalInfo);
    }
  }

  /**
   * Handle API error
   * @param {Error} error - Error object
   * @param {string} operation - Operation name
   * @returns {Object} Error response object
   */
  function handleApiError(error, operation = 'API call') {
    const errorResponse = {
      success: false,
      error: error.message || 'An unknown error occurred',
      operation: operation
    };

    if (error.response) {
      errorResponse.status = error.response.status;
      errorResponse.data = error.response.data;
    }

    logError('API', error, { operation });
    return errorResponse;
  }

  /**
   * Handle validation error
   * @param {string} field - Field name
   * @param {string} message - Error message
   * @returns {Object} Error object
   */
  function handleValidationError(field, message) {
    const error = {
      field,
      message,
      type: 'validation'
    };
    logError('Validation', message, { field });
    return error;
  }

  /**
   * Show user-friendly error message
   * @param {string} message - Error message
   * @param {string} type - Error type (error, warning, info)
   */
  function showError(message, type = 'error') {
    // Try to use existing notification system if available
    if (typeof window !== 'undefined' && window.showNotification) {
      window.showNotification(message, type);
    } else {
      // Fallback to alert
      alert(message);
    }
  }

  /**
   * Wrap async function with error handling
   * @param {Function} asyncFn - Async function to wrap
   * @param {string} context - Context name for logging
   * @returns {Function} Wrapped function
   */
  function wrapAsync(asyncFn, context = 'Async') {
    return async function(...args) {
      try {
        return await asyncFn.apply(this, args);
      } catch (error) {
        logError(context, error);
        throw error;
      }
    };
  }

  /**
   * Create error object
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {*} details - Error details
   * @returns {Object} Error object
   */
  function createError(message, code = 'UNKNOWN', details = null) {
    return {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    };
  }

  // Export
  window.ErrorHandler = {
    logError,
    handleApiError,
    handleValidationError,
    showError,
    wrapAsync,
    createError
  };

})();

