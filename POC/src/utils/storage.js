/**
 * PMTwin Storage Utilities
 * Helper functions for localStorage operations
 */

(function() {
  'use strict';

  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Parsed value or default
   */
  function getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`[Storage] Error getting item ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  function setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Storage] Error setting item ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  function removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[Storage] Error removing item ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all items with a specific prefix
   * @param {string} prefix - Key prefix
   * @returns {number} Number of items removed
   */
  function clearByPrefix(prefix) {
    let count = 0;
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
          count++;
        }
      });
    } catch (error) {
      console.error(`[Storage] Error clearing items with prefix ${prefix}:`, error);
    }
    return count;
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} Availability status
   */
  function isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Export
  window.StorageUtils = {
    getItem,
    setItem,
    removeItem,
    clearByPrefix,
    isAvailable
  };

})();

