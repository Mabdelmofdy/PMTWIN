/**
 * Hybrid Proposal Form Component
 * UI component for creating hybrid proposals (Cash + Services)
 */

(function() {
  'use strict';

  let serviceItemCounter = 0;

  /**
   * Render hybrid proposal form
   * @param {string} containerId - Container element ID
   * @param {Object} options - Options { onSubmit: function, initialData: Object }
   * @returns {HTMLElement} - Rendered form element
   */
  function renderHybridProposalForm(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return null;
    }

    const initialData = options.initialData || {};

    const html = `
      <form id="hybridProposalForm_${containerId}" onsubmit="return HybridProposalForm.handleSubmit(event, '${containerId}')">
        <div class="hybrid-proposal-form">
          <!-- Cash Component Section -->
          <div class="form-section">
            <h3 class="section-title">Cash Component</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Cash Amount (SAR) *</label>
                <input type="number" id="cashAmount_${containerId}" class="form-control" 
                       value="${initialData.cashComponent?.amount || 0}" min="0" step="0.01" required
                       onchange="HybridProposalForm.calculateTotal('${containerId}')">
              </div>
              <div class="form-group">
                <label class="form-label">Currency *</label>
                <select id="cashCurrency_${containerId}" class="form-control" required>
                  <option value="SAR" ${(initialData.cashComponent?.currency || 'SAR') === 'SAR' ? 'selected' : ''}>SAR</option>
                  <option value="USD" ${initialData.cashComponent?.currency === 'USD' ? 'selected' : ''}>USD</option>
                  <option value="EUR" ${initialData.cashComponent?.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Service Components Section -->
          <div class="form-section" style="margin-top: 2rem;">
            <h3 class="section-title">Service Components</h3>
            <p class="section-description">Add services to be provided as part of the hybrid payment</p>
            <div id="serviceComponents_${containerId}" class="service-items-container">
              <!-- Service items will be added here -->
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="HybridProposalForm.addServiceItem('${containerId}')">
              <i class="ph ph-plus"></i> Add Service
            </button>
          </div>

          <!-- Total Value Display -->
          <div id="totalValueDisplay_${containerId}" class="value-display" style="margin-top: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
            <h4>Total Value</h4>
            <div id="totalValueDetails_${containerId}"></div>
          </div>

          <!-- Payment Terms -->
          <div class="form-section" style="margin-top: 2rem;">
            <label class="form-label">Payment Terms</label>
            <select id="paymentTerms_${containerId}" class="form-control">
              <option value="milestone_based" ${(initialData.paymentTerms || 'milestone_based') === 'milestone_based' ? 'selected' : ''}>Milestone-Based</option>
              <option value="upfront" ${initialData.paymentTerms === 'upfront' ? 'selected' : ''}>Upfront</option>
              <option value="30_days" ${initialData.paymentTerms === '30_days' ? 'selected' : ''}>30 Days</option>
              <option value="60_days" ${initialData.paymentTerms === '60_days' ? 'selected' : ''}>60 Days</option>
            </select>
          </div>

          <!-- Terms & Conditions -->
          <div class="form-section" style="margin-top: 2rem;">
            <label class="form-label">Terms & Conditions</label>
            <textarea id="hybridTerms_${containerId}" class="form-control" rows="4" 
                      placeholder="Additional terms for the hybrid payment (optional)">${initialData.terms || ''}</textarea>
          </div>

          <!-- Error Display -->
          <div id="hybridFormErrors_${containerId}" class="alert alert-error" style="display: none; margin-top: 1rem;"></div>

          <!-- Submit Button -->
          <div style="margin-top: 2rem;">
            <button type="submit" class="btn btn-primary">
              <i class="ph ph-check"></i> Submit Hybrid Proposal
            </button>
            <button type="button" class="btn btn-secondary" onclick="HybridProposalForm.calculateTotal('${containerId}')">
              <i class="ph ph-calculator"></i> Calculate Total
            </button>
          </div>
        </div>
      </form>
    `;

    container.innerHTML = html;

    // Store onSubmit callback
    if (options.onSubmit) {
      window[`hybridFormOnSubmit_${containerId}`] = options.onSubmit;
    }

    // Add initial service components if provided
    if (initialData.serviceComponents && initialData.serviceComponents.length > 0) {
      initialData.serviceComponents.forEach(service => {
        addServiceItem(containerId, service);
      });
    }

    // Calculate initial total
    calculateTotal(containerId);

    return container;
  }

  /**
   * Add service item to form
   * @param {string} containerId - Container ID
   * @param {Object} initialData - Initial service data
   */
  function addServiceItem(containerId, initialData = {}) {
    const container = document.getElementById(`serviceComponents_${containerId}`);
    if (!container) return;

    const itemId = `service_component_${containerId}_${serviceItemCounter++}`;
    const itemHtml = `
      <div class="service-item-card" id="${itemId}" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <strong>Service Component</strong>
          <button type="button" class="btn btn-sm btn-danger" onclick="HybridProposalForm.removeServiceItem('${itemId}')">
            <i class="ph ph-trash"></i> Remove
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">Service Name *</label>
          <input type="text" class="form-control service-name" value="${initialData.serviceName || ''}" 
                 placeholder="e.g., Project Management Services" required>
        </div>
        <div class="form-group">
          <label class="form-label">Description *</label>
          <textarea class="form-control service-description" rows="2" required 
                    placeholder="Describe the service...">${initialData.description || ''}</textarea>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Unit of Measure *</label>
            <input type="text" class="form-control service-unit" value="${initialData.unitOfMeasure || 'unit'}" 
                   placeholder="e.g., hours, days, project" required>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" class="form-control service-quantity" value="${initialData.quantity || 1}" 
                   min="0.01" step="0.01" required>
          </div>
          <div class="form-group">
            <label class="form-label">Unit Price (SAR) *</label>
            <input type="number" class="form-control service-unit-price" value="${initialData.unitPrice || 0}" 
                   min="0" step="0.01" required onchange="HybridProposalForm.calculateServiceTotal('${itemId}')">
          </div>
          <div class="form-group">
            <label class="form-label">Total Value (SAR)</label>
            <input type="number" class="form-control service-total" value="${initialData.totalReferenceValue || 0}" 
                   readonly style="background: var(--bg-secondary);">
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', itemHtml);

    // Calculate initial total
    calculateServiceTotal(itemId);

    // Recalculate total
    calculateTotal(containerId);
  }

  /**
   * Remove service item
   * @param {string} itemId - Service item ID
   */
  function removeServiceItem(itemId) {
    const item = document.getElementById(itemId);
    if (item) {
      item.remove();
      // Recalculate total
      const containerId = itemId.split('_').slice(-2, -1)[0];
      calculateTotal(containerId);
    }
  }

  /**
   * Calculate service item total
   * @param {string} itemId - Service item ID
   */
  function calculateServiceTotal(itemId) {
    const item = document.getElementById(itemId);
    if (!item) return;

    const quantity = parseFloat(item.querySelector('.service-quantity').value) || 0;
    const unitPrice = parseFloat(item.querySelector('.service-unit-price').value) || 0;
    const total = quantity * unitPrice;

    item.querySelector('.service-total').value = total.toFixed(2);
  }

  /**
   * Calculate total hybrid value
   * @param {string} containerId - Container ID
   */
  function calculateTotal(containerId) {
    if (typeof HybridPayment === 'undefined') {
      console.warn('HybridPayment not available');
      return;
    }

    const cashAmount = parseFloat(document.getElementById(`cashAmount_${containerId}`).value) || 0;
    const cashCurrency = document.getElementById(`cashCurrency_${containerId}`).value;
    const serviceComponents = collectServiceItems(containerId);

    const cashComponent = {
      amount: cashAmount,
      currency: cashCurrency
    };

    const composition = HybridPayment.compose(cashComponent, serviceComponents);

    if (!composition) {
      return;
    }

    // Display total
    const detailsContainer = document.getElementById(`totalValueDetails_${containerId}`);

    detailsContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
        <div>
          <strong>Cash Component:</strong>
          <p style="font-size: 1.25rem; margin: 0.5rem 0;">${composition.cashComponent.amount.toLocaleString()} ${composition.cashComponent.currency}</p>
          <small>${composition.composition.cashPercentage.toFixed(1)}% of total</small>
        </div>
        <div>
          <strong>Service Components:</strong>
          <p style="font-size: 1.25rem; margin: 0.5rem 0;">${composition.serviceTotal.toLocaleString()} ${composition.currency}</p>
          <small>${composition.composition.servicePercentage.toFixed(1)}% of total</small>
        </div>
        <div>
          <strong>Total Value:</strong>
          <p class="alert alert-success" style="font-size: 1.5rem; margin: 0.5rem 0; font-weight: bold;">
            ${composition.totalValue.toLocaleString()} ${composition.currency}
          </p>
        </div>
      </div>
      ${composition.currencyMismatch ? `
        <div class="alert alert-warning" style="margin-top: 1rem;">
          <strong>Warning:</strong> Service components currency does not match cash component currency
        </div>
      ` : ''}
    `;
  }

  /**
   * Collect service items from container
   * @param {string} containerId - Container ID
   * @returns {Array} - Array of service items
   */
  function collectServiceItems(containerId) {
    const container = document.getElementById(`serviceComponents_${containerId}`);
    if (!container) return [];

    const items = [];
    const itemCards = container.querySelectorAll('.service-item-card');

    itemCards.forEach(card => {
      const serviceName = card.querySelector('.service-name').value;
      const description = card.querySelector('.service-description').value;
      const unitOfMeasure = card.querySelector('.service-unit').value;
      const quantity = parseFloat(card.querySelector('.service-quantity').value) || 0;
      const unitPrice = parseFloat(card.querySelector('.service-unit-price').value) || 0;
      const totalReferenceValue = parseFloat(card.querySelector('.service-total').value) || 0;

      if (serviceName && description && quantity > 0 && unitPrice > 0) {
        items.push({
          serviceName: serviceName,
          description: description,
          unitOfMeasure: unitOfMeasure,
          quantity: quantity,
          unitPrice: unitPrice,
          totalReferenceValue: totalReferenceValue,
          currency: 'SAR'
        });
      }
    });

    return items;
  }

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   * @param {string} containerId - Container ID
   * @returns {boolean} - False to prevent default submission
   */
  function handleSubmit(event, containerId) {
    event.preventDefault();

    // Collect form data
    const cashAmount = parseFloat(document.getElementById(`cashAmount_${containerId}`).value) || 0;
    const cashCurrency = document.getElementById(`cashCurrency_${containerId}`).value;
    const serviceComponents = collectServiceItems(containerId);
    const paymentTerms = document.getElementById(`paymentTerms_${containerId}`).value;
    const terms = document.getElementById(`hybridTerms_${containerId}`).value;

    // Validate
    if (cashAmount === 0 && serviceComponents.length === 0) {
      showError(containerId, 'Hybrid payment must have at least one component (cash or services)');
      return false;
    }

    // Validate hybrid proposal
    if (typeof HybridPayment !== 'undefined') {
      const proposal = {
        cashComponent: {
          amount: cashAmount,
          currency: cashCurrency
        },
        serviceComponents: serviceComponents,
        paymentTerms: paymentTerms
      };

      const validation = HybridPayment.validate(proposal);
      if (!validation.valid) {
        showError(containerId, validation.errors.join(', '));
        return false;
      }
    }

    // Prepare proposal data
    const proposalData = {
      type: 'hybrid',
      cashComponent: {
        amount: cashAmount,
        currency: cashCurrency
      },
      serviceComponents: serviceComponents,
      paymentTerms: paymentTerms,
      terms: terms
    };

    // Call onSubmit callback
    const onSubmit = window[`hybridFormOnSubmit_${containerId}`];
    if (onSubmit && typeof onSubmit === 'function') {
      onSubmit(proposalData);
    }

    return false;
  }

  /**
   * Show error message
   * @param {string} containerId - Container ID
   * @param {string} message - Error message
   */
  function showError(containerId, message) {
    const errorContainer = document.getElementById(`hybridFormErrors_${containerId}`);
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
    }
  }

  // ============================================
  // Export
  // ============================================

  window.HybridProposalForm = {
    render: renderHybridProposalForm,
    addServiceItem: addServiceItem,
    removeServiceItem: removeServiceItem,
    calculateServiceTotal: calculateServiceTotal,
    calculateTotal: calculateTotal,
    handleSubmit: handleSubmit,
    collectFormData: function(containerId) {
      return {
        cashComponent: {
          amount: parseFloat(document.getElementById(`cashAmount_${containerId}`).value) || 0,
          currency: document.getElementById(`cashCurrency_${containerId}`).value
        },
        serviceComponents: collectServiceItems(containerId),
        paymentTerms: document.getElementById(`paymentTerms_${containerId}`).value,
        terms: document.getElementById(`hybridTerms_${containerId}`).value
      };
    }
  };

})();
