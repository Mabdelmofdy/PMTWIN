/**
 * Statistics Card Component
 * Provides standardized statistics cards for dashboards
 */

(function() {
  'use strict';

  /**
   * Render a statistics card
   * @param {Object} options - Card configuration
   * @param {string|number} options.value - Statistic value
   * @param {string} options.label - Statistic label
   * @param {string} options.color - Color variant (primary, success, warning, error, info)
   * @param {string} options.icon - Icon class (optional)
   * @param {string} options.trend - Trend indicator (optional, e.g., "+5%")
   * @returns {string} HTML string
   */
  function renderStatCard(options = {}) {
    const {
      value,
      label,
      color = 'primary',
      icon = '',
      trend = ''
    } = options;

    if (value === undefined || !label) {
      console.warn('[StatCard] Value and label are required');
      return '';
    }

    const colorClass = `stat-color-${color}`;
    const colorValue = getColorValue(color);

    return `
      <div class="card stat-card">
        <div class="card-body" style="text-align: center; padding: var(--spacing-6);">
          ${icon ? `<div class="stat-icon" style="color: ${colorValue}; margin-bottom: var(--spacing-2);"><i class="${icon}" style="font-size: 2rem;"></i></div>` : ''}
          <div class="stat-value" style="font-size: 3rem; font-weight: var(--font-weight-bold); color: ${colorValue}; margin-bottom: var(--spacing-2); line-height: 1;">
            ${value}
            ${trend ? `<span class="stat-trend" style="font-size: 1.5rem; margin-left: var(--spacing-2);">${trend}</span>` : ''}
          </div>
          <div class="stat-label" style="color: var(--text-secondary); font-size: var(--font-size-base); font-weight: var(--font-weight-medium);">
            ${label}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render multiple statistics cards in a grid
   * @param {Array} stats - Array of stat card options
   * @param {string} gridClass - Grid class (default: stats-grid)
   * @returns {string} HTML string
   */
  function renderStatGrid(stats = [], gridClass = 'stats-grid') {
    if (!Array.isArray(stats) || stats.length === 0) {
      return '';
    }

    const cardsHTML = stats.map(stat => renderStatCard(stat)).join('');
    
    return `
      <div class="${gridClass}">
        ${cardsHTML}
      </div>
    `;
  }

  /**
   * Get color value for stat card
   * @param {string} color - Color name
   * @returns {string} CSS color value
   */
  function getColorValue(color) {
    const colors = {
      primary: 'var(--color-primary)',
      success: 'var(--color-success)',
      warning: 'var(--color-warning)',
      error: 'var(--color-error)',
      info: 'var(--color-info)',
      secondary: 'var(--text-secondary)'
    };
    return colors[color] || colors.primary;
  }

  // Export
  window.StatCard = {
    render: renderStatCard,
    renderGrid: renderStatGrid
  };

})();

