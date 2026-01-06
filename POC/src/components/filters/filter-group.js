/**
 * Filter Group Component
 * Individual filter group component with consistent form styling
 */

(function() {
  'use strict';

  /**
   * Render a filter group
   * @param {Object} options - Filter group configuration
   * @param {string} options.label - Filter label
   * @param {string} options.name - Filter name/ID
   * @param {string} options.type - Filter type (text, select, date, etc.)
   * @param {Array} options.options - Options for select type
   * @param {string} options.placeholder - Placeholder text
   * @param {string} options.value - Default value
   * @param {string} options.className - Additional CSS classes
   * @returns {string} HTML string
   */
  function renderFilterGroup(options = {}) {
    const {
      label = '',
      name = '',
      type = 'text',
      options: selectOptions = [],
      placeholder = '',
      value = '',
      className = ''
    } = options;

    if (!name) {
      console.warn('[FilterGroup] Name is required');
      return '';
    }

    const classes = ['form-group', 'filter-group'];
    if (className) {
      classes.push(className);
    }

    let inputHTML = '';

    switch (type) {
      case 'select':
        inputHTML = `
          <select id="${name}" name="${name}" class="form-control">
            ${selectOptions.map(opt => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = value === optValue ? ' selected' : '';
              return `<option value="${optValue}"${isSelected}>${optLabel}</option>`;
            }).join('')}
          </select>
        `;
        break;

      case 'date':
        inputHTML = `<input type="date" id="${name}" name="${name}" class="form-control" value="${value}" placeholder="${placeholder}">`;
        break;

      case 'text':
      default:
        inputHTML = `<input type="text" id="${name}" name="${name}" class="form-control" value="${value}" placeholder="${placeholder}">`;
        break;
    }

    return `
      <div class="${classes.join(' ')}">
        ${label ? `<label for="${name}" class="form-label">${label}</label>` : ''}
        ${inputHTML}
      </div>
    `;
  }

  /**
   * Render multiple filter groups in a row
   * @param {Array} filters - Array of filter options
   * @param {string} rowClass - Row CSS class (default: 'filter-row')
   * @returns {string} HTML string
   */
  function renderFilterRow(filters = [], rowClass = 'filter-row') {
    if (!Array.isArray(filters) || filters.length === 0) {
      return '';
    }

    const filtersHTML = filters.map(filter => renderFilterGroup(filter)).join('');

    return `<div class="${rowClass}">${filtersHTML}</div>`;
  }

  // Export
  window.FilterGroup = {
    render: renderFilterGroup,
    renderRow: renderFilterRow
  };

})();

