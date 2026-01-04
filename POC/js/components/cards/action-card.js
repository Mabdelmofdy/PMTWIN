/**
 * Action Card Component
 * Cards with embedded action buttons and hover interactions
 */

(function() {
  'use strict';

  /**
   * Render an action card
   * @param {Object} options - Card configuration
   * @param {string} options.title - Card title
   * @param {string} options.content - Card content (HTML)
   * @param {Array} options.actions - Array of action buttons {label, href, onclick, class, icon}
   * @param {string} options.icon - Icon class (optional)
   * @param {string} options.className - Additional CSS classes (optional)
   * @param {string} options.id - Card ID (optional)
   * @returns {string} HTML string
   */
  function renderActionCard(options = {}) {
    const {
      title = '',
      content = '',
      actions = [],
      icon = '',
      className = '',
      id = ''
    } = options;

    const idAttr = id ? ` id="${id}"` : '';
    const classes = ['card', 'action-card'];
    if (className) {
      classes.push(className);
    }

    const iconHTML = icon ? `<div class="action-card-icon"><i class="${icon}"></i></div>` : '';

    let actionsHTML = '';
    if (actions.length > 0) {
      actionsHTML = `
        <div class="card-footer">
          <div class="action-card-actions">
            ${actions.map(action => {
              const {
                label,
                href,
                onclick,
                class: actionClass = 'btn btn-primary',
                icon: actionIcon = ''
              } = action;

              if (href) {
                return `<a href="${href}" class="${actionClass}">${actionIcon ? `<i class="${actionIcon}"></i> ` : ''}${label}</a>`;
              } else {
                return `<button onclick="${onclick || ''}" class="${actionClass}">${actionIcon ? `<i class="${actionIcon}"></i> ` : ''}${label}</button>`;
              }
            }).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div${idAttr} class="${classes.join(' ')}">
        ${iconHTML}
        <div class="card-body">
          ${title ? `<h3 class="card-title">${title}</h3>` : ''}
          <div class="card-text">${content}</div>
        </div>
        ${actionsHTML}
      </div>
    `;
  }

  /**
   * Render multiple action cards in a grid
   * @param {Array} cards - Array of card options
   * @param {string} gridClass - Grid CSS class (default: 'content-grid-3')
   * @returns {string} HTML string
   */
  function renderActionCardGrid(cards = [], gridClass = 'content-grid-3') {
    if (!Array.isArray(cards) || cards.length === 0) {
      return '';
    }

    const cardsHTML = cards.map(card => renderActionCard(card)).join('');

    return `<div class="${gridClass}">${cardsHTML}</div>`;
  }

  // Export
  window.ActionCard = {
    render: renderActionCard,
    renderGrid: renderActionCardGrid
  };

})();

