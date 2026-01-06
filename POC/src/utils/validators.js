/**
 * PMTwin Validators
 * Input validation utilities
 */

(function() {
  'use strict';

  /**
   * Validate email format
   * @param {string} email - Email address to validate
   * @returns {boolean} Valid status
   */
  function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (basic validation)
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Valid status
   */
  function isValidPhone(phone) {
    if (!phone) return false;
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // Check if it's all digits and has reasonable length (7-15 digits)
    return /^\d{7,15}$/.test(cleaned);
  }

  /**
   * Validate required field
   * @param {*} value - Value to check
   * @returns {boolean} Valid status
   */
  function isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  /**
   * Validate number range
   * @param {number} value - Value to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} Valid status
   */
  function isInRange(value, min, max) {
    const num = Number(value);
    if (isNaN(num)) return false;
    return num >= min && num <= max;
  }

  /**
   * Validate string length
   * @param {string} value - String to validate
   * @param {number} minLength - Minimum length
   * @param {number} maxLength - Maximum length
   * @returns {boolean} Valid status
   */
  function isValidLength(value, minLength, maxLength) {
    if (!value) return minLength === 0;
    const length = value.trim().length;
    return length >= minLength && length <= maxLength;
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} Valid status
   */
  function isValidUrl(url) {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate date
   * @param {string} dateString - Date string to validate
   * @returns {boolean} Valid status
   */
  function isValidDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Validate date is in the future
   * @param {string} dateString - Date string to validate
   * @returns {boolean} Valid status
   */
  function isFutureDate(dateString) {
    if (!isValidDate(dateString)) return false;
    const date = new Date(dateString);
    return date > new Date();
  }

  /**
   * Validate date is in the past
   * @param {string} dateString - Date string to validate
   * @returns {boolean} Valid status
   */
  function isPastDate(dateString) {
    if (!isValidDate(dateString)) return false;
    const date = new Date(dateString);
    return date < new Date();
  }

  // Export
  window.Validators = {
    isValidEmail,
    isValidPhone,
    isRequired,
    isInRange,
    isValidLength,
    isValidUrl,
    isValidDate,
    isFutureDate,
    isPastDate
  };

})();

