/**
 * Page Header Component
 * Provides standardized page headers with title, description, and actions
 */

(function() {
  'use strict';

  /**
   * Render a page header
   * @param {Object} options - Header configuration
   * @param {string} options.title - Page title
   * @param {string} options.description - Page description (optional)
   * @param {Array} options.actions - Array of action buttons (optional)
   * @param {string} options.containerId - Container ID to render into (optional)
   * @returns {string|HTMLElement} HTML string or rendered element
   */
  function renderPageHeader(options = {}) {
    const {
      title,
      description = '',
      actions = [],
      containerId = null
    } = options;

    if (!title) {
      console.warn('[PageHeader] Title is required');
      return '';
    }

    let actionsHTML = '';
    if (actions.length > 0) {
      actionsHTML = `
        <div class="page-actions">
          ${actions.map(action => {
            if (typeof action === 'string') {
              return action; // Raw HTML
            }
            const {
              label,
              href,
              onclick,
              class: className = 'btn btn-primary',
              icon = ''
            } = action;
            
            if (href) {
              return `<a href="${href}" class="${className}">${icon ? `<i class="${icon}"></i> ` : ''}${label}</a>`;
            } else {
              return `<button onclick="${onclick || ''}" class="${className}">${icon ? `<i class="${icon}"></i> ` : ''}${label}</button>`;
            }
          }).join('')}
        </div>
      `;
    }

    const html = `
      <div class="page-header">
        <div class="page-header-content">
          <div>
            <h1>${title}</h1>
            ${description ? `<p>${description}</p>` : ''}
          </div>
          ${actionsHTML}
        </div>
      </div>
    `;

    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = html;
        return container;
      }
    }

    return html;
  }

  /**
   * Update page header dynamically
   * @param {string} containerId - Container ID
   * @param {Object} options - Header options
   */
  function updatePageHeader(containerId, options) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[PageHeader] Container not found: ${containerId}`);
      return;
    }
    container.innerHTML = renderPageHeader(options);
  }

  // Export
  window.PageHeader = {
    render: renderPageHeader,
    update: updatePageHeader
  };

})();

