/**
 * Breadcrumb Component
 * Provides accessible breadcrumb navigation
 */

(function() {
  'use strict';

  /**
   * Render breadcrumb navigation
   * @param {Array} items - Array of breadcrumb items {label, href}
   * @param {string} containerId - Container ID to render into (optional)
   * @returns {string|HTMLElement} HTML string or rendered element
   */
  function renderBreadcrumb(items = [], containerId = null) {
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }

    const breadcrumbItems = items.map((item, index) => {
      const isLast = index === items.length - 1;
      const { label, href } = item;

      if (isLast) {
        return `<span class="breadcrumb-current" aria-current="page">${label}</span>`;
      }

      return `<a href="${href || '#'}" class="breadcrumb-link">${label}</a>`;
    }).join('<span class="breadcrumb-separator" aria-hidden="true">/</span>');

    const html = `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        ${breadcrumbItems}
      </nav>
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
   * Generate breadcrumb from current path
   * @param {string} basePath - Base path for navigation
   * @param {string} currentPage - Current page name
   * @returns {Array} Breadcrumb items
   */
  function generateFromPath(basePath = '', currentPage = '') {
    const items = [
      { label: 'Home', href: `${basePath}home/` }
    ];

    if (currentPage) {
      items.push({ label: currentPage, href: '#' });
    }

    return items;
  }

  // Export
  window.Breadcrumb = {
    render: renderBreadcrumb,
    generateFromPath: generateFromPath
  };

})();

