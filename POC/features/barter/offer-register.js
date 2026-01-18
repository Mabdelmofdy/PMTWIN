/**
 * Offer Register Component
 * UI component for Offer Register feature
 * BRD Section 14.3: Opens when Barter mode is selected
 */

(function() {
  'use strict';

  let currentNeedId = null;
  let availableOffers = [];
  let linkedOffers = [];

  /**
   * Initialize Offer Register
   * @param {string} needId - Need opportunity ID
   */
  function init(needId) {
    currentNeedId = needId;
    loadOffers();
    render();
  }

  /**
   * Load available offers
   */
  function loadOffers() {
    if (!currentNeedId || typeof OfferRegisterService === 'undefined') {
      return;
    }

    // Get compatible offers
    const compatible = OfferRegisterService.getCompatibleOffers(currentNeedId);
    availableOffers = compatible.map(result => result.offer);

    // Get linked offers
    if (typeof DealLinkingService !== 'undefined') {
      linkedOffers = DealLinkingService.getLinked(currentNeedId);
    }
  }

  /**
   * Render Offer Register
   */
  function render() {
    const container = document.getElementById('offerRegister');
    if (!container) return;

    container.innerHTML = `
      <div class="offer-register">
        <div class="offer-register-header">
          <h2><i class="ph ph-list-bullets"></i> Offer Register</h2>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">
            Select offers to link to this need. Barter deals require bidirectional matching.
          </p>
        </div>

        ${linkedOffers.length > 0 ? `
          <div class="linked-offers-section" style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem;">Linked Offers (${linkedOffers.length})</h3>
            <div style="display: grid; gap: 1rem;">
              ${linkedOffers.map(offer => renderOfferCard(offer, true)).join('')}
            </div>
          </div>
        ` : ''}

        <div class="available-offers-section">
          <h3 style="margin-bottom: 1rem;">Available Offers</h3>
          ${availableOffers.length === 0 ? `
            <div class="alert alert-info">
              <p>No compatible offers found. Make sure offers have Barter or Hybrid payment mode.</p>
            </div>
          ` : `
            <div style="display: grid; gap: 1rem;">
              ${availableOffers.map(offer => renderOfferCard(offer, false)).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Render offer card
   * @param {Object} offer - Offer opportunity
   * @param {boolean} isLinked - Whether offer is already linked
   * @returns {string} - HTML string
   */
  function renderOfferCard(offer, isLinked) {
    const validation = typeof OfferRegisterService !== 'undefined' && currentNeedId
      ? OfferRegisterService.validateBidirectional(currentNeedId ? PMTwinData.Opportunities.getById(currentNeedId) : null, offer)
      : null;

    return `
      <div class="card enhanced-card ${isLinked ? 'linked' : ''}" style="position: relative;">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 0.5rem 0;">
                ${escapeHtml(offer.title || 'Untitled Offer')}
                ${isLinked ? '<span class="badge badge-success" style="margin-left: 0.5rem;">Linked</span>' : ''}
              </h4>
              <p style="margin: 0 0 1rem 0; color: var(--text-secondary);">
                ${escapeHtml(offer.description || '').substring(0, 200)}${offer.description && offer.description.length > 200 ? '...' : ''}
              </p>
              
              ${validation ? `
                <div style="margin-bottom: 1rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.875rem;">Bidirectional Match Score:</strong>
                    <span class="badge ${validation.score >= 70 ? 'badge-success' : validation.score >= 50 ? 'badge-warning' : 'badge-danger'}">
                      ${validation.score}%
                    </span>
                  </div>
                  ${validation.details.equivalenceRatio ? `
                    <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--border-radius); font-size: 0.875rem;">
                      <strong>Equivalence:</strong>
                      <div style="margin-top: 0.5rem;">
                        Offer → Need: ${validation.details.equivalenceRatio.offerToNeed?.totalOffered || 0} SAR
                        ${validation.details.equivalenceRatio.offerToNeed?.balance !== 0 ? 
                          ` (Balance: ${validation.details.equivalenceRatio.offerToNeed.balance > 0 ? '+' : ''}${validation.details.equivalenceRatio.offerToNeed.balance} SAR)` : ''}
                      </div>
                      <div>
                        Need → Offer: ${validation.details.equivalenceRatio.needToOffer?.totalOffered || 0} SAR
                        ${validation.details.equivalenceRatio.needToOffer?.balance !== 0 ? 
                          ` (Balance: ${validation.details.equivalenceRatio.needToOffer.balance > 0 ? '+' : ''}${validation.details.equivalenceRatio.needToOffer.balance} SAR)` : ''}
                      </div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}

              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;">
                ${(offer.skills || offer.attributes?.requiredSkills || []).slice(0, 5).map(skill => 
                  `<span class="badge badge-primary">${escapeHtml(skill)}</span>`
                ).join('')}
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${isLinked ? `
                <button class="btn btn-sm btn-outline-danger" onclick="offerRegister.unlinkOffer('${offer.id}')">
                  <i class="ph ph-x"></i> Unlink
                </button>
              ` : `
                <button class="btn btn-sm btn-primary" onclick="offerRegister.linkOffer('${offer.id}')">
                  <i class="ph ph-link"></i> Link
                </button>
              `}
              <button class="btn btn-sm btn-outline" onclick="offerRegister.viewOffer('${offer.id}')">
                <i class="ph ph-eye"></i> View
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Link an offer
   * @param {string} offerId - Offer ID
   */
  function linkOffer(offerId) {
    if (!currentNeedId || typeof DealLinkingService === 'undefined') {
      alert('Deal linking service not available');
      return;
    }

    const result = DealLinkingService.link(currentNeedId, [offerId]);
    
    if (result.success) {
      loadOffers();
      render();
      alert('Offer linked successfully!');
    } else {
      alert('Failed to link offer: ' + result.errors.join(', '));
    }
  }

  /**
   * Unlink an offer
   * @param {string} offerId - Offer ID
   */
  function unlinkOffer(offerId) {
    if (!currentNeedId || typeof DealLinkingService === 'undefined') {
      return;
    }

    if (!confirm('Are you sure you want to unlink this offer?')) {
      return;
    }

    const result = DealLinkingService.unlink(currentNeedId, [offerId]);
    
    if (result.success) {
      loadOffers();
      render();
      alert('Offer unlinked successfully!');
    } else {
      alert('Failed to unlink offer: ' + result.errors.join(', '));
    }
  }

  /**
   * View offer details
   * @param {string} offerId - Offer ID
   */
  function viewOffer(offerId) {
    if (typeof window.UrlHelper !== 'undefined') {
      const url = window.UrlHelper.buildUrl('pages/opportunities/view/index.html', { id: offerId });
      window.location.href = url;
    } else {
      window.location.href = `../opportunities/view/index.html?id=${offerId}`;
    }
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // Export
  // ============================================

  window.offerRegister = {
    init: init,
    linkOffer: linkOffer,
    unlinkOffer: unlinkOffer,
    viewOffer: viewOffer
  };

})();
