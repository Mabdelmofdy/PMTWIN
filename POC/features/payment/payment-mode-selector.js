/**
 * Payment Mode Selector Component
 * UI component for selecting payment mode (Cash, Barter, Hybrid)
 */

(function() {
  'use strict';

  /**
   * Render payment mode selector
   * @param {string} containerId - Container element ID
   * @param {Object} options - Options { selected: string, onChange: function, showDescriptions: boolean }
   * @returns {HTMLElement} - Rendered selector element
   */
  function renderPaymentModeSelector(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return null;
    }

    const selected = options.selected || 'Cash';
    const showDescriptions = options.showDescriptions !== false;

    const html = `
      <div class="payment-mode-selector">
        <label class="form-label">Payment Mode *</label>
        <div class="payment-mode-options" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
          <label class="payment-mode-option ${selected === 'Cash' ? 'selected' : ''}" 
                 style="cursor: pointer; padding: 1rem; border: 2px solid ${selected === 'Cash' ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: var(--radius-md); transition: all 0.2s; background: ${selected === 'Cash' ? 'var(--primary-light)' : 'transparent'};"
                 onclick="selectPaymentMode('Cash', '${containerId}')">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <input type="radio" name="paymentMode_${containerId}" value="Cash" ${selected === 'Cash' ? 'checked' : ''} 
                     onchange="if(window.PaymentModeSelector) PaymentModeSelector.onChange('Cash', '${containerId}')">
              <strong>Cash</strong>
            </div>
            ${showDescriptions ? '<p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0;">Traditional cash payment</p>' : ''}
          </label>
          
          <label class="payment-mode-option ${selected === 'Equity' ? 'selected' : ''}" 
                 style="cursor: pointer; padding: 1rem; border: 2px solid ${selected === 'Equity' ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: var(--radius-md); transition: all 0.2s; background: ${selected === 'Equity' ? 'var(--primary-light)' : 'transparent'};"
                 onclick="selectPaymentMode('Equity', '${containerId}')">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <input type="radio" name="paymentMode_${containerId}" value="Equity" ${selected === 'Equity' ? 'checked' : ''} 
                     onchange="if(window.PaymentModeSelector) PaymentModeSelector.onChange('Equity', '${containerId}')">
              <strong>Equity</strong>
            </div>
            ${showDescriptions ? '<p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0;">Equity stake with vesting</p>' : ''}
          </label>
          
          <label class="payment-mode-option ${selected === 'ProfitSharing' ? 'selected' : ''}" 
                 style="cursor: pointer; padding: 1rem; border: 2px solid ${selected === 'ProfitSharing' ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: var(--radius-md); transition: all 0.2s; background: ${selected === 'ProfitSharing' ? 'var(--primary-light)' : 'transparent'};"
                 onclick="selectPaymentMode('ProfitSharing', '${containerId}')">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <input type="radio" name="paymentMode_${containerId}" value="ProfitSharing" ${selected === 'ProfitSharing' ? 'checked' : ''} 
                     onchange="if(window.PaymentModeSelector) PaymentModeSelector.onChange('ProfitSharing', '${containerId}')">
              <strong>Profit-Sharing</strong>
            </div>
            ${showDescriptions ? '<p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0;">Share of profits</p>' : ''}
          </label>
          
          <label class="payment-mode-option ${selected === 'Barter' ? 'selected' : ''}" 
                 style="cursor: pointer; padding: 1rem; border: 2px solid ${selected === 'Barter' ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: var(--radius-md); transition: all 0.2s; background: ${selected === 'Barter' ? 'var(--primary-light)' : 'transparent'};"
                 onclick="selectPaymentMode('Barter', '${containerId}')">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <input type="radio" name="paymentMode_${containerId}" value="Barter" ${selected === 'Barter' ? 'checked' : ''} 
                     onchange="if(window.PaymentModeSelector) PaymentModeSelector.onChange('Barter', '${containerId}')">
              <strong>Barter</strong>
            </div>
            ${showDescriptions ? '<p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0;">Service-for-service exchange</p>' : ''}
          </label>
          
          <label class="payment-mode-option ${selected === 'Hybrid' ? 'selected' : ''}" 
                 style="cursor: pointer; padding: 1rem; border: 2px solid ${selected === 'Hybrid' ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: var(--radius-md); transition: all 0.2s; background: ${selected === 'Hybrid' ? 'var(--primary-light)' : 'transparent'};"
                 onclick="selectPaymentMode('Hybrid', '${containerId}')">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <input type="radio" name="paymentMode_${containerId}" value="Hybrid" ${selected === 'Hybrid' ? 'checked' : ''} 
                     onchange="if(window.PaymentModeSelector) PaymentModeSelector.onChange('Hybrid', '${containerId}')">
              <strong>Hybrid</strong>
            </div>
            ${showDescriptions ? '<p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0;">Cash + Services combination</p>' : ''}
          </label>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Store onChange callback
    if (options.onChange) {
      window[`paymentModeOnChange_${containerId}`] = options.onChange;
    }

    return container;
  }

  /**
   * Select payment mode (called from onclick)
   * @param {string} mode - Payment mode
   * @param {string} containerId - Container ID
   */
  function selectPaymentMode(mode, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Update radio buttons
    const radios = container.querySelectorAll(`input[name="paymentMode_${containerId}"]`);
    radios.forEach(radio => {
      radio.checked = radio.value === mode;
    });

    // Update visual selection
    const options = container.querySelectorAll('.payment-mode-option');
    options.forEach(option => {
      const optionMode = option.querySelector('input').value;
      if (optionMode === mode) {
        option.classList.add('selected');
        option.style.borderColor = 'var(--primary-color)';
        option.style.background = 'var(--primary-light)';
      } else {
        option.classList.remove('selected');
        option.style.borderColor = 'var(--border-color)';
        option.style.background = 'transparent';
      }
    });

    // Call onChange callback
    const onChange = window[`paymentModeOnChange_${containerId}`];
    if (onChange && typeof onChange === 'function') {
      onChange(mode);
    }

    // Dispatch custom event
    container.dispatchEvent(new CustomEvent('paymentModeChanged', {
      detail: { mode: mode, containerId: containerId }
    }));
  }

  /**
   * Get selected payment mode
   * @param {string} containerId - Container ID
   * @returns {string|null} - Selected payment mode
   */
  function getSelectedPaymentMode(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const selected = container.querySelector(`input[name="paymentMode_${containerId}"]:checked`);
    return selected ? selected.value : null;
  }

  /**
   * Show/hide payment mode specific fields
   * @param {string} mode - Payment mode
   * @param {Object} fieldIds - Field IDs { cash: string, barter: string, hybrid: string }
   */
  function togglePaymentModeFields(mode, fieldIds) {
    // Hide all
    if (fieldIds.cash) {
      const cashFields = document.getElementById(fieldIds.cash);
      if (cashFields) cashFields.style.display = mode === 'Cash' || mode === 'Hybrid' ? 'block' : 'none';
    }

    if (fieldIds.barter) {
      const barterFields = document.getElementById(fieldIds.barter);
      if (barterFields) barterFields.style.display = mode === 'Barter' || mode === 'Hybrid' ? 'block' : 'none';
    }

    if (fieldIds.hybrid) {
      const hybridFields = document.getElementById(fieldIds.hybrid);
      if (hybridFields) hybridFields.style.display = mode === 'Hybrid' ? 'block' : 'none';
    }
  }

  // ============================================
  // Export
  // ============================================

  window.PaymentModeSelector = {
    render: renderPaymentModeSelector,
    select: selectPaymentMode,
    getSelected: getSelectedPaymentMode,
    toggleFields: togglePaymentModeFields,
    onChange: function(mode, containerId) {
      selectPaymentMode(mode, containerId);
    }
  };

  // Global function for onclick handlers
  window.selectPaymentMode = selectPaymentMode;

})();
