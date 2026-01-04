/**
 * Info Card Component
 * Standard information display cards with consistent styling
 */

(function() {
  'use strict';

  /**
   * Render an info card
   * @param {Object} options - Card configuration
   * @param {string} options.title - Card title
   * @param {string} options.content - Card content (HTML)
   * @param {string} options.icon - Icon class (optional)
   * @param {string} options.className - Additional CSS classes (optional)
   * @param {string} options.id - Card ID (optional)
   * @returns {string} HTML string
   */
  function renderInfoCard(options = {}) {
    const {
      title = '',
      content = '',
      icon = '',
      className = '',
      id = ''
    } = options;

    const idAttr = id ? ` id="${id}"` : '';
    const classes = ['card', 'info-card'];
    if (className) {
      classes.push(className);
    }

    const iconHTML = icon ? `<div class="info-card-icon"><i class="${icon}"></i></div>` : '';

    return `
      <div${idAttr} class="${classes.join(' ')}">
        ${iconHTML}
        <div class="card-body">
          ${title ? `<h3 class="card-title">${title}</h3>` : ''}
          <div class="card-text">${content}</div>
        </div>
      </div>
    `;
  }

  /**
   * Render multiple info cards in a grid
   * @param {Array} cards - Array of card options
   * @param {string} gridClass - Grid CSS class (default: 'content-grid-3')
   * @returns {string} HTML string
   */
  function renderInfoCardGrid(cards = [], gridClass = 'content-grid-3') {
    if (!Array.isArray(cards) || cards.length === 0) {
      return '';
    }

    const cardsHTML = cards.map(card => renderInfoCard(card)).join('');

    return `<div class="${gridClass}">${cardsHTML}</div>`;
  }

  // Export
  window.InfoCard = {
    render: renderInfoCard,
    renderGrid: renderInfoCardGrid
  };

})();

