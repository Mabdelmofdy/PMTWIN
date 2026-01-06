/**
 * Filter Bar Component
 * Provides standardized filter bars for list pages
 */

(function() {
  'use strict';

  /**
   * Render a filter bar
   * @param {Object} options - Filter configuration
   * @param {Array} options.filters - Array of filter definitions
   * @param {Function} options.onApply - Apply callback
   * @param {Function} options.onClear - Clear callback
   * @param {string} options.containerId - Container ID (optional)
   * @returns {string|HTMLElement} HTML string or rendered element
   */
  function renderFilterBar(options = {}) {
    const {
      filters = [],
      onApply = null,
      onClear = null,
      containerId = null,
      showAdvanced = false
    } = options;

    if (filters.length === 0) {
      return '';
    }

    const filterHTML = filters.map((filter, index) => {
      const {
        id,
        label,
        type = 'select',
        options: filterOptions = [],
        placeholder = '',
        value = ''
      } = filter;

      if (type === 'select') {
        const optionsHTML = filterOptions.map(opt => {
          const optValue = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          return `<option value="${optValue}" ${optValue === value ? 'selected' : ''}>${optLabel}</option>`;
        }).join('');

        return `
          <div class="form-group">
            <label for="${id}" class="form-label">${label}</label>
            <select id="${id}" class="form-control">
              ${optionsHTML}
            </select>
          </div>
        `;
      } else if (type === 'text' || type === 'search') {
        const searchIcon = type === 'search' ? '<i class="ph ph-magnifying-glass" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none;"></i>' : '';
        const paddingLeft = type === 'search' ? 'padding-left: 2.5rem;' : '';
        
        return `
          <div class="form-group" style="position: relative; flex: 1; min-width: 250px;">
            ${searchIcon}
            <label for="${id}" class="form-label">${label}</label>
            <input type="text" id="${id}" class="form-control" placeholder="${placeholder}" value="${value}" style="${paddingLeft}">
          </div>
        `;
      } else if (type === 'date') {
        return `
          <div class="form-group">
            <label for="${id}" class="form-label">${label}</label>
            <input type="date" id="${id}" class="form-control" value="${value}">
          </div>
        `;
      }
      return '';
    }).join('');

    const applyHandler = onApply ? `onclick="FilterBar.apply('${containerId || 'filterForm'}')"` : '';
    const clearHandler = onClear ? `onclick="FilterBar.clear('${containerId || 'filterForm'}')"` : '';

    const html = `
      <div class="content-section">
        <div class="card filters-section">
          <div class="card-body">
            <form id="${containerId || 'filterForm'}" class="filter-row">
              ${filterHTML}
              <div class="form-group" style="display: flex; gap: var(--spacing-3); align-items: flex-end;">
                <button type="button" class="btn btn-primary" ${applyHandler}>Apply Filters</button>
                <button type="button" class="btn btn-secondary" ${clearHandler}>Clear</button>
              </div>
            </form>
          </div>
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
   * Get filter values from form
   * @param {string} formId - Form ID
   * @returns {Object} Filter values
   */
  function getFilterValues(formId = 'filterForm') {
    const form = document.getElementById(formId);
    if (!form) return {};

    const values = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      if (input.id && input.id !== 'filterForm') {
        values[input.id] = input.value;
      }
    });

    return values;
  }

  /**
   * Clear all filters
   * @param {string} formId - Form ID
   */
  function clearFilters(formId = 'filterForm') {
    const form = document.getElementById(formId);
    if (!form) return;

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = false;
      } else {
        input.value = '';
      }
    });
  }

  /**
   * Apply filters (triggers callback)
   * @param {string} formId - Form ID
   */
  function applyFilters(formId = 'filterForm') {
    const values = getFilterValues(formId);
    
    // Trigger custom event
    const event = new CustomEvent('filtersApplied', {
      detail: { values, formId }
    });
    window.dispatchEvent(event);
    
    return values;
  }

  // Export
  window.FilterBar = {
    render: renderFilterBar,
    getValues: getFilterValues,
    clear: clearFilters,
    apply: applyFilters
  };

})();

