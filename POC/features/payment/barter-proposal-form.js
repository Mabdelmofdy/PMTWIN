/**
 * Barter Proposal Form Component
 * UI component for creating barter proposals with settlement rules
 */

(function() {
  'use strict';

  let serviceItemCounter = 0;

  /**
   * Render barter proposal form
   * @param {string} containerId - Container element ID
   * @param {Object} options - Options { onSubmit: function, initialData: Object }
   * @returns {HTMLElement} - Rendered form element
   */
  function renderBarterProposalForm(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return null;
    }

    const initialData = options.initialData || {};

    const html = `
      <form id="barterProposalForm_${containerId}" onsubmit="return BarterProposalForm.handleSubmit(event, '${containerId}')">
        <div class="barter-proposal-form">
          <!-- Services Offered Section -->
          <div class="form-section">
            <h3 class="section-title">Services Offered</h3>
            <p class="section-description">Describe the services you are offering in this barter exchange</p>
            <div id="servicesOffered_${containerId}" class="service-items-container">
              <!-- Service items will be added here -->
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="BarterProposalForm.addServiceItem('servicesOffered', '${containerId}')">
              <i class="ph ph-plus"></i> Add Service
            </button>
          </div>

          <!-- Services Requested Section -->
          <div class="form-section" style="margin-top: 2rem;">
            <h3 class="section-title">Services Requested</h3>
            <p class="section-description">Describe the services you are requesting in exchange</p>
            <div id="servicesRequested_${containerId}" class="service-items-container">
              <!-- Service items will be added here -->
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="BarterProposalForm.addServiceItem('servicesRequested', '${containerId}')">
              <i class="ph ph-plus"></i> Add Service
            </button>
          </div>

          <!-- Value Equivalence Display -->
          <div id="valueEquivalence_${containerId}" class="value-equivalence-display" style="margin-top: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); display: none;">
            <h4>Value Equivalence</h4>
            <div id="equivalenceDetails_${containerId}"></div>
          </div>

          <!-- Barter Settlement Rule -->
          <div class="form-section" style="margin-top: 2rem;">
            <label class="form-label">Barter Settlement Rule *</label>
            <select id="barterSettlementRule_${containerId}" class="form-control" required onchange="BarterProposalForm.updateSettlementRule('${containerId}')">
              <option value="">Select settlement rule</option>
              <option value="EQUAL_VALUE_ONLY" ${initialData.barterSettlementRule === 'EQUAL_VALUE_ONLY' ? 'selected' : ''}>
                Equal Value Only - Values must match exactly
              </option>
              <option value="ALLOW_DIFFERENCE_WITH_CASH" ${initialData.barterSettlementRule === 'ALLOW_DIFFERENCE_WITH_CASH' || !initialData.barterSettlementRule ? 'selected' : ''}>
                Allow Difference with Cash - Cash component allowed for imbalance
              </option>
              <option value="ACCEPT_AS_IS" ${initialData.barterSettlementRule === 'ACCEPT_AS_IS' ? 'selected' : ''}>
                Accept As-Is - Value difference explicitly waived
              </option>
            </select>
            <small class="form-text">How should value differences be handled?</small>
          </div>

          <!-- Cash Component (if ALLOW_DIFFERENCE_WITH_CASH) -->
          <div id="cashComponentSection_${containerId}" class="form-section" style="margin-top: 1rem; display: none;">
            <label class="form-label">Cash Component (SAR)</label>
            <input type="number" id="cashComponent_${containerId}" class="form-control" min="0" step="0.01" 
                   placeholder="Enter cash amount to balance difference">
            <small class="form-text">Additional cash payment to balance value difference</small>
          </div>

          <!-- Explicit Waiver (if ACCEPT_AS_IS) -->
          <div id="explicitWaiverSection_${containerId}" class="form-section" style="margin-top: 1rem; display: none;">
            <label class="form-check-label">
              <input type="checkbox" id="explicitWaiver_${containerId}" class="form-check-input">
              I explicitly waive the value difference and consent to this barter exchange as-is
            </label>
          </div>

          <!-- Barter Terms -->
          <div class="form-section" style="margin-top: 2rem;">
            <label class="form-label">Barter Terms</label>
            <textarea id="barterTerms_${containerId}" class="form-control" rows="4" 
                      placeholder="Additional terms for the barter exchange (optional)">${initialData.terms || ''}</textarea>
          </div>

          <!-- Error Display -->
          <div id="barterFormErrors_${containerId}" class="alert alert-error" style="display: none; margin-top: 1rem;"></div>

          <!-- Submit Button -->
          <div style="margin-top: 2rem;">
            <button type="submit" class="btn btn-primary">
              <i class="ph ph-check"></i> Submit Barter Proposal
            </button>
            <button type="button" class="btn btn-secondary" onclick="BarterProposalForm.calculateEquivalence('${containerId}')">
              <i class="ph ph-calculator"></i> Calculate Equivalence
            </button>
          </div>
        </div>
      </form>
    `;

    container.innerHTML = html;

    // Store onSubmit callback
    if (options.onSubmit) {
      window[`barterFormOnSubmit_${containerId}`] = options.onSubmit;
    }

    // Add initial service items if provided
    if (initialData.servicesOffered && initialData.servicesOffered.length > 0) {
      initialData.servicesOffered.forEach(service => {
        addServiceItem('servicesOffered', containerId, service);
      });
    }

    if (initialData.servicesRequested && initialData.servicesRequested.length > 0) {
      initialData.servicesRequested.forEach(service => {
        addServiceItem('servicesRequested', containerId, service);
      });
    }

    // Update settlement rule display
    updateSettlementRule(containerId);

    return container;
  }

  /**
   * Add service item to form
   * @param {string} type - 'servicesOffered' or 'servicesRequested'
   * @param {string} containerId - Container ID
   * @param {Object} initialData - Initial service data
   */
  function addServiceItem(type, containerId, initialData = {}) {
    const container = document.getElementById(`${type}_${containerId}`);
    if (!container) return;

    const itemId = `service_${type}_${containerId}_${serviceItemCounter++}`;
    const itemHtml = `
      <div class="service-item-card" id="${itemId}" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <strong>Service Item</strong>
          <button type="button" class="btn btn-sm btn-danger" onclick="BarterProposalForm.removeServiceItem('${itemId}')">
            <i class="ph ph-trash"></i> Remove
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">Service Name *</label>
          <input type="text" class="form-control service-name" value="${initialData.serviceName || ''}" 
                 placeholder="e.g., Engineering Design Services" required>
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
                   min="0" step="0.01" required onchange="BarterProposalForm.calculateServiceTotal('${itemId}')">
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

    // Recalculate equivalence
    calculateEquivalence(containerId);
  }

  /**
   * Remove service item
   * @param {string} itemId - Service item ID
   */
  function removeServiceItem(itemId) {
    const item = document.getElementById(itemId);
    if (item) {
      item.remove();
      // Recalculate equivalence
      const containerId = itemId.split('_').slice(-2, -1)[0];
      calculateEquivalence(containerId);
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
   * Calculate barter equivalence
   * @param {string} containerId - Container ID
   */
  function calculateEquivalence(containerId) {
    if (typeof BarterSettlement === 'undefined') {
      console.warn('BarterSettlement not available');
      return;
    }

    const servicesOffered = collectServiceItems(`servicesOffered_${containerId}`);
    const servicesRequested = collectServiceItems(`servicesRequested_${containerId}`);

    if (servicesOffered.length === 0 && servicesRequested.length === 0) {
      document.getElementById(`valueEquivalence_${containerId}`).style.display = 'none';
      return;
    }

    const equivalence = BarterSettlement.calculateEquivalence(servicesOffered, servicesRequested);

    if (!equivalence) {
      return;
    }

    // Display equivalence
    const equivalenceDisplay = document.getElementById(`valueEquivalence_${containerId}`);
    const detailsContainer = document.getElementById(`equivalenceDetails_${containerId}`);

    equivalenceDisplay.style.display = 'block';

    const balanceClass = equivalence.balance === 0 ? 'success' : equivalence.balance > 0 ? 'warning' : 'info';
    const balanceText = equivalence.balance === 0 ? 'Balanced' : 
                        equivalence.balance > 0 ? `Requester pays ${Math.abs(equivalence.balance).toLocaleString()} SAR` :
                        `Offerer pays ${Math.abs(equivalence.balance).toLocaleString()} SAR`;

    detailsContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
        <div>
          <strong>Total Offered:</strong>
          <p style="font-size: 1.25rem; margin: 0.5rem 0;">${equivalence.totalOffered.toLocaleString()} SAR</p>
        </div>
        <div>
          <strong>Total Requested:</strong>
          <p style="font-size: 1.25rem; margin: 0.5rem 0;">${equivalence.totalRequested.toLocaleString()} SAR</p>
        </div>
        <div>
          <strong>Balance:</strong>
          <p class="alert alert-${balanceClass}" style="font-size: 1.25rem; margin: 0.5rem 0;">${balanceText}</p>
        </div>
      </div>
      ${equivalence.percentageDifference > 0.01 ? `
        <div class="alert alert-info" style="margin-top: 1rem;">
          <strong>Value Difference:</strong> ${equivalence.percentageDifference.toFixed(2)}% difference
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
    const container = document.getElementById(containerId);
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
   * Update settlement rule display
   * @param {string} containerId - Container ID
   */
  function updateSettlementRule(containerId) {
    const rule = document.getElementById(`barterSettlementRule_${containerId}`).value;
    const cashSection = document.getElementById(`cashComponentSection_${containerId}`);
    const waiverSection = document.getElementById(`explicitWaiverSection_${containerId}`);

    if (rule === 'ALLOW_DIFFERENCE_WITH_CASH') {
      cashSection.style.display = 'block';
      waiverSection.style.display = 'none';
    } else if (rule === 'ACCEPT_AS_IS') {
      cashSection.style.display = 'none';
      waiverSection.style.display = 'block';
    } else {
      cashSection.style.display = 'none';
      waiverSection.style.display = 'none';
    }

    // Recalculate equivalence to show required cash component
    calculateEquivalence(containerId);
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
    const servicesOffered = collectServiceItems(`servicesOffered_${containerId}`);
    const servicesRequested = collectServiceItems(`servicesRequested_${containerId}`);
    const barterSettlementRule = document.getElementById(`barterSettlementRule_${containerId}`).value;
    const cashComponent = parseFloat(document.getElementById(`cashComponent_${containerId}`).value) || 0;
    const explicitWaiver = document.getElementById(`explicitWaiver_${containerId}`)?.checked || false;
    const terms = document.getElementById(`barterTerms_${containerId}`).value;

    // Validate
    if (servicesOffered.length === 0) {
      showError(containerId, 'At least one service offered is required');
      return false;
    }

    if (servicesRequested.length === 0) {
      showError(containerId, 'At least one service requested is required');
      return false;
    }

    if (!barterSettlementRule) {
      showError(containerId, 'Barter settlement rule is required');
      return false;
    }

    // Validate barter proposal
    if (typeof BarterSettlement !== 'undefined') {
      const proposal = {
        servicesOffered: servicesOffered,
        servicesRequested: servicesRequested,
        barterSettlementRule: barterSettlementRule,
        cashComponent: cashComponent,
        explicitWaiver: explicitWaiver
      };

      const validation = BarterSettlement.validate(proposal);
      if (!validation.valid) {
        showError(containerId, validation.errors.join(', '));
        return false;
      }
    }

    // Prepare proposal data
    const proposalData = {
      type: 'barter',
      servicesOffered: servicesOffered,
      servicesRequested: servicesRequested,
      barterSettlementRule: barterSettlementRule,
      cashComponent: cashComponent,
      explicitWaiver: explicitWaiver,
      terms: terms
    };

    // Call onSubmit callback
    const onSubmit = window[`barterFormOnSubmit_${containerId}`];
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
    const errorContainer = document.getElementById(`barterFormErrors_${containerId}`);
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
    }
  }

  // ============================================
  // Export
  // ============================================

  window.BarterProposalForm = {
    render: renderBarterProposalForm,
    addServiceItem: addServiceItem,
    removeServiceItem: removeServiceItem,
    calculateServiceTotal: calculateServiceTotal,
    calculateEquivalence: calculateEquivalence,
    updateSettlementRule: updateSettlementRule,
    handleSubmit: handleSubmit,
    collectFormData: function(containerId) {
      return {
        servicesOffered: collectServiceItems(`servicesOffered_${containerId}`),
        servicesRequested: collectServiceItems(`servicesRequested_${containerId}`),
        barterSettlementRule: document.getElementById(`barterSettlementRule_${containerId}`).value,
        cashComponent: parseFloat(document.getElementById(`cashComponent_${containerId}`).value) || 0,
        explicitWaiver: document.getElementById(`explicitWaiver_${containerId}`)?.checked || false,
        terms: document.getElementById(`barterTerms_${containerId}`).value
      };
    }
  };

})();
