/**
 * PMTwin Formatters
 * Utility functions for formatting dates, currency, and other display values
 */

(function() {
  'use strict';

  /**
   * Format currency
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: 'SAR')
   * @returns {string} Formatted currency string
   */
  function formatCurrency(amount, currency = 'SAR') {
    if (!amount) return 'N/A';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
  }

  /**
   * Format date
   * @param {string} dateString - Date string to format
   * @returns {string} Formatted date string
   */
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Get status badge HTML
   * @param {string} status - Status value
   * @param {string} type - Badge type (default: 'default')
   * @returns {string} HTML string for status badge
   */
  function getStatusBadge(status, type = 'default') {
    const statusColors = {
      active: { bg: '#10b981', text: '#fff' },
      pending: { bg: '#f59e0b', text: '#fff' },
      under_review: { bg: '#3b82f6', text: '#fff' },
      approved: { bg: '#10b981', text: '#fff' },
      rejected: { bg: '#ef4444', text: '#fff' },
      closed: { bg: '#6b7280', text: '#fff' },
      draft: { bg: '#9ca3af', text: '#fff' },
      completed: { bg: '#10b981', text: '#fff' },
      in_progress: { bg: '#3b82f6', text: '#fff' },
      verified: { bg: '#10b981', text: '#fff' }
    };

    const color = statusColors[status] || { bg: '#6b7280', text: '#fff' };
    return `<span class="badge" style="background: ${color.bg}; color: ${color.text}; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">${status.replace('_', ' ').toUpperCase()}</span>`;
  }

  /**
   * Get days remaining until deadline
   * @param {string} deadline - Deadline date string
   * @returns {number|null} Days remaining or null if invalid
   */
  function getDaysRemaining(deadline) {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Format number with thousand separators
   * @param {number} number - Number to format
   * @returns {string} Formatted number string
   */
  function formatNumber(number) {
    if (number === null || number === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US').format(number);
  }

  /**
   * Format percentage
   * @param {number} value - Value to format as percentage
   * @param {number} decimals - Number of decimal places (default: 0)
   * @returns {string} Formatted percentage string
   */
  function formatPercentage(value, decimals = 0) {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(decimals)}%`;
  }

  // Export
  window.Formatters = {
    formatCurrency,
    formatDate,
    getStatusBadge,
    getDaysRemaining,
    formatNumber,
    formatPercentage
  };

})();

