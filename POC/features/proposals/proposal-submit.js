/**
 * Proposal Submit Component
 * Handles proposal submission form
 */

(function() {
  'use strict';

  let currentOpportunity = null;
  let currentOpportunityId = null;
  let currentProviderId = null;
  let breakdownItemCount = 0;

  /**
   * Initialize component
   */
  function init(opportunityId, providerId) {
    currentOpportunityId = opportunityId;
    currentProviderId = providerId;

    // Get current user if providerId not provided
    if (!currentProviderId) {
      try {
        const sessionStr = localStorage.getItem('pmtwin_current_user') || localStorage.getItem('pmtwin_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          currentProviderId = session.userId || session.id;
        }
      } catch (e) {
        console.error('Error getting current user:', e);
      }
    }

    // Load opportunity
    if (!window.OpportunityStore) {
      console.error('OpportunityStore not available');
      return;
    }

    currentOpportunity = window.OpportunityStore.getOpportunityById(opportunityId);
    if (!currentOpportunity) {
      document.getElementById('proposalForm').innerHTML = 
        '<p class="alert alert-error">Opportunity not found.</p>';
      return;
    }

    // Render opportunity title
    const titleEl = document.getElementById('opportunityTitle');
    if (titleEl) {
      titleEl.textContent = currentOpportunity.title;
    }

    // Set up cancel link
    const cancelLink = document.getElementById('cancelLink');
    if (cancelLink && window.UrlHelper) {
      cancelLink.href = window.UrlHelper.buildUrlWithQuery('pages/opportunities/details.html', {
        id: opportunityId
      });
    }

    // Add initial breakdown item
    addBreakdownItem();
  }

  /**
   * Add breakdown item
   */
  function addBreakdownItem() {
    const container = document.getElementById('breakdownItems');
    if (!container) return;

    const itemId = `breakdown_${breakdownItemCount++}`;
    const itemHTML = `
      <div class="breakdown-item" style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: end;">
        <div style="flex: 1;">
          <label class="form-label">Item Name</label>
          <input type="text" class="form-control breakdown-item-name" placeholder="e.g., Site Management">
        </div>
        <div style="width: 150px;">
          <label class="form-label">Amount</label>
          <input type="number" class="form-control breakdown-item-amount" placeholder="0" min="0" step="0.01">
        </div>
        <div>
          <button type="button" class="btn btn-outline" onclick="this.closest('.breakdown-item').remove()">
            <i class="ph ph-x"></i>
          </button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', itemHTML);
  }

  /**
   * Handle form submit
   */
  function handleSubmit(event) {
    event.preventDefault();

    if (!window.OpportunityStore || !currentOpportunityId || !currentProviderId) {
      alert('Error: Missing required data');
      return false;
    }

    // Get form values
    const priceTotal = parseFloat(document.getElementById('priceTotal').value);
    const currency = document.getElementById('currency').value;
    const deliveryTimeline = document.getElementById('deliveryTimeline').value;
    const notes = document.getElementById('notes').value;

    // Validate
    if (!priceTotal || priceTotal <= 0) {
      alert('Please enter a valid total price');
      return false;
    }

    if (!deliveryTimeline || deliveryTimeline.trim().length === 0) {
      alert('Please enter a delivery timeline');
      return false;
    }

    // Collect breakdown items
    const breakdown = [];
    const breakdownItems = document.querySelectorAll('.breakdown-item');
    breakdownItems.forEach(item => {
      const name = item.querySelector('.breakdown-item-name')?.value?.trim();
      const amount = parseFloat(item.querySelector('.breakdown-item-amount')?.value);
      if (name && amount && amount > 0) {
        breakdown.push({ item: name, amount: amount });
      }
    });

    // Create proposal
    const proposal = window.OpportunityStore.submitProposal({
      opportunityId: currentOpportunityId,
      providerUserId: currentProviderId,
      priceTotal: priceTotal,
      currency: currency,
      breakdown: breakdown,
      deliveryTimeline: deliveryTimeline.trim(),
      notes: notes.trim()
    });

    if (proposal) {
      alert('Proposal submitted successfully!');
      
      // Redirect to opportunity details
      if (window.UrlHelper) {
        const detailsUrl = window.UrlHelper.buildUrlWithQuery('pages/opportunities/details.html', {
          id: currentOpportunityId
        });
        window.location.href = detailsUrl;
      } else {
        window.location.href = `../../opportunities/details.html?id=${currentOpportunityId}`;
      }
    } else {
      alert('Error submitting proposal');
    }

    return false;
  }

  // Export
  window.proposalSubmit = {
    init: init,
    addBreakdownItem: addBreakdownItem,
    handleSubmit: handleSubmit
  };

})();
