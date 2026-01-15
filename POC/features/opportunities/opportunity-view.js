/**
 * Opportunity View Component
 * Displays full opportunity details with engagement request CTA, proposals/matches links, view counter
 */

(function() {
  'use strict';

  let opportunityId = null;
  let opportunity = null;

  // ============================================
  // Initialize Component
  // ============================================
  function init() {
    // Get opportunity ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    opportunityId = urlParams.get('id');
    
    if (!opportunityId) {
      renderError('Opportunity ID not provided');
      return;
    }

    loadOpportunity();
  }

  // ============================================
  // Load Opportunity
  // ============================================
  function loadOpportunity() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      renderError('Opportunities service not available');
      return;
    }

    opportunity = PMTwinData.Opportunities.getById(opportunityId);
    
    if (!opportunity) {
      renderError('Opportunity not found');
      return;
    }

    // Increment views counter
    incrementViews();

    // Get current user
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    const userId = currentUser?.id;
    const isOwner = userId && (opportunity.createdBy === userId || opportunity.creatorId === userId);

    // Get proposals count
    const proposals = typeof PMTwinData.Proposals !== 'undefined' 
      ? PMTwinData.Proposals.getByOpportunityId(opportunityId) || []
      : [];

    // Get matches count (if available)
    const matches = typeof PMTwinData.Matches !== 'undefined'
      ? PMTwinData.Matches.getByOpportunityId?.(opportunityId) || []
      : [];

    renderOpportunity(opportunity, isOwner, proposals.length, matches.length);
  }

  // ============================================
  // Increment Views Counter
  // ============================================
  function incrementViews() {
    if (!opportunity) return;
    
    const currentViews = opportunity.views || 0;
    PMTwinData.Opportunities.update(opportunityId, {
      views: currentViews + 1
    });
    opportunity.views = currentViews + 1;
  }

  // ============================================
  // Render Opportunity
  // ============================================
  function renderOpportunity(opp, isOwner, proposalsCount, matchesCount) {
    const container = document.getElementById('opportunityViewContainer');
    if (!container) return;

    const intentBadge = getIntentBadge(opp.intent || opp.intentType);
    const paymentBadge = getPaymentBadge(opp.preferredPaymentTerms?.mode || opp.paymentTerms?.mode || opp.paymentMode);
    const statusBadge = getStatusBadge(opp.status);
    
    const oppCity = opp.location?.city || 'TBD';
    const oppCountry = opp.location?.country || 'Not specified';
    const locationText = `${oppCity}, ${oppCountry}`;
    const isRemoteAllowed = opp.location?.isRemoteAllowed || false;
    
    const totalValue = opp.serviceItems && opp.serviceItems.length > 0
      ? opp.serviceItems.reduce((sum, item) => sum + (item.totalRef || 0), 0)
      : 0;

    const html = `
      <div class="page-header">
        <div class="page-header-content">
          <div>
            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
              <a href="${getBackUrl()}" class="btn btn-secondary btn-sm">
                <i class="ph ph-arrow-left"></i> Back
              </a>
              ${isOwner ? `
                <a href="${getEditUrl()}" class="btn btn-secondary btn-sm">
                  <i class="ph ph-pencil"></i> Edit
                </a>
                ${opp.status === 'draft' ? `
                  <button type="button" class="btn btn-success btn-sm" onclick="opportunityView.publishOpportunity()">
                    <i class="ph ph-paper-plane-tilt"></i> Publish
                  </button>
                ` : ''}
              ` : ''}
            </div>
            <h1>${opp.title || 'Untitled Opportunity'}</h1>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
              ${statusBadge}
              ${intentBadge}
              ${paymentBadge}
              ${isRemoteAllowed ? '<span class="badge badge-success"><i class="ph ph-globe"></i> Remote</span>' : ''}
              <span class="badge badge-secondary">${opp.subModel || opp.modelName || 'Model ' + (opp.model || '1')}</span>
            </div>
          </div>
          ${!isOwner ? `
            <div>
              <a href="${getEngagementRequestUrl()}" class="btn btn-primary btn-lg">
                <i class="ph ph-paper-plane-tilt"></i> Send Engagement Request
              </a>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="content-section">
        <div class="card enhanced-card">
          <div class="card-body">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
              <div>
                <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase;">Location</h3>
                <p style="margin: 0; font-size: 1.125rem;">
                  <i class="ph ph-map-pin"></i> ${locationText}
                </p>
              </div>
              ${totalValue > 0 ? `
                <div>
                  <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase;">Total Value</h3>
                  <p style="margin: 0; font-size: 1.125rem; font-weight: bold; color: var(--color-success);">
                    ${totalValue.toLocaleString()} SAR
                  </p>
                </div>
              ` : ''}
              <div>
                <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase;">Views</h3>
                <p style="margin: 0; font-size: 1.125rem;">
                  <i class="ph ph-eye"></i> ${opp.views || 0}
                </p>
              </div>
              ${isOwner ? `
                <div>
                  <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase;">Proposals</h3>
                  <p style="margin: 0; font-size: 1.125rem;">
                    <a href="${getProposalsUrl()}" style="color: var(--color-primary); text-decoration: none;">
                      <i class="ph ph-paper-plane-tilt"></i> ${proposalsCount}
                    </a>
                  </p>
                </div>
                <div>
                  <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase;">Matches</h3>
                  <p style="margin: 0; font-size: 1.125rem;">
                    <a href="${getMatchesUrl()}" style="color: var(--color-primary); text-decoration: none;">
                      <i class="ph ph-handshake"></i> ${matchesCount}
                    </a>
                  </p>
                </div>
              ` : ''}
            </div>

            <div style="margin-bottom: 2rem;">
              <h2 class="section-title">Description</h2>
              <p style="line-height: 1.8; color: var(--text-primary); white-space: pre-wrap;">${opp.description || 'No description provided.'}</p>
            </div>

            ${opp.skills && opp.skills.length > 0 ? `
              <div style="margin-bottom: 2rem;">
                <h2 class="section-title">Required Skills</h2>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  ${opp.skills.map(skill => `<span class="badge badge-primary">${skill}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            ${opp.serviceItems && opp.serviceItems.length > 0 ? `
              <div style="margin-bottom: 2rem;">
                <h2 class="section-title">Service Items</h2>
                <div style="overflow-x: auto;">
                  <table class="table" style="width: 100%;">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${opp.serviceItems.map(item => `
                        <tr>
                          <td>${item.name || 'Service'}</td>
                          <td>${item.qty || 1} ${item.unit || 'unit'}</td>
                          <td>${(item.unitPriceRef || 0).toLocaleString()} SAR</td>
                          <td><strong>${(item.totalRef || 0).toLocaleString()} SAR</strong></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}

            ${opp.preferredPaymentTerms || opp.paymentTerms ? `
              <div style="margin-bottom: 2rem;">
                <h2 class="section-title">Preferred Payment Terms</h2>
                <div class="card" style="background: var(--bg-secondary); padding: 1.5rem;">
                  ${renderPaymentTerms(opp.preferredPaymentTerms || opp.paymentTerms)}
                </div>
              </div>
            ` : ''}

            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border-color);">
              <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                ${!isOwner ? `
                  <a href="${getEngagementRequestUrl()}" class="btn btn-primary">
                    <i class="ph ph-paper-plane-tilt"></i> Send Engagement Request
                  </a>
                ` : ''}
                <a href="${getBackUrl()}" class="btn btn-secondary">
                  <i class="ph ph-arrow-left"></i> Back to Opportunities
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // ============================================
  // Render Payment Terms
  // ============================================
  function renderPaymentTerms(paymentTerms) {
    if (!paymentTerms || !paymentTerms.mode) return '<p>No payment terms specified</p>';
    
    let html = `<p><strong>Mode:</strong> ${paymentTerms.mode}</p>`;
    
    if (paymentTerms.mode === 'BARTER' || paymentTerms.mode === 'HYBRID') {
      if (paymentTerms.barterRule) {
        html += `<p><strong>Barter Rule:</strong> ${paymentTerms.barterRule}</p>`;
      }
      if (paymentTerms.cashSettlement !== undefined && paymentTerms.cashSettlement > 0) {
        html += `<p><strong>Cash Settlement:</strong> ${paymentTerms.cashSettlement.toLocaleString()} SAR</p>`;
      }
    }
    
    return html;
  }

  // ============================================
  // Helper: Get Intent Badge
  // ============================================
  function getIntentBadge(intent) {
    const badges = {
      'REQUEST_SERVICE': '<span class="badge badge-warning">Request</span>',
      'OFFER_SERVICE': '<span class="badge badge-info">Offer</span>',
      'BOTH': '<span class="badge badge-primary">Both</span>'
    };
    return badges[intent] || '';
  }

  // ============================================
  // Helper: Get Payment Badge
  // ============================================
  function getPaymentBadge(mode) {
    const badges = {
      'CASH': '<span class="badge badge-success">Cash</span>',
      'BARTER': '<span class="badge badge-purple">Barter</span>',
      'HYBRID': '<span class="badge badge-secondary">Hybrid</span>'
    };
    return badges[mode] || '';
  }

  // ============================================
  // Helper: Get Status Badge
  // ============================================
  function getStatusBadge(status) {
    const badges = {
      'draft': '<span class="badge badge-secondary"><i class="ph ph-file-dashed"></i> Draft</span>',
      'published': '<span class="badge badge-success"><i class="ph ph-paper-plane-tilt"></i> Published</span>',
      'active': '<span class="badge badge-info"><i class="ph ph-check-circle"></i> Active</span>',
      'closed': '<span class="badge badge-danger"><i class="ph ph-x-circle"></i> Closed</span>'
    };
    return badges[status] || '<span class="badge badge-secondary">' + (status || 'Draft') + '</span>';
  }

  // ============================================
  // Helper: Get Back URL
  // ============================================
  function getBackUrl() {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRoute('opportunities');
    }
    return '/POC/pages/opportunities/index.html';
  }

  // ============================================
  // Helper: Get Edit URL
  // ============================================
  function getEditUrl() {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('create-opportunity', { edit: opportunityId });
    }
    return `/POC/pages/opportunities/create/index.html?edit=${opportunityId}`;
  }

  // ============================================
  // Helper: Get Engagement Request URL
  // ============================================
  function getEngagementRequestUrl() {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('create-proposal', { opportunityId: opportunityId });
    }
    return `/POC/pages/proposals/create/index.html?opportunityId=${opportunityId}`;
  }

  // ============================================
  // Helper: Get Proposals URL
  // ============================================
  function getProposalsUrl() {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('proposals', { opportunityId: opportunityId });
    }
    return `/POC/pages/proposals/index.html?opportunityId=${opportunityId}`;
  }

  // ============================================
  // Helper: Get Matches URL
  // ============================================
  function getMatchesUrl() {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('matches', { opportunityId: opportunityId });
    }
    return `/POC/pages/matches/index.html?opportunityId=${opportunityId}`;
  }

  // ============================================
  // Publish Opportunity
  // ============================================
  function publishOpportunity() {
    if (!opportunity) return;
    
    if (!confirm('Are you sure you want to publish this opportunity? It will be visible to all users.')) {
      return;
    }

    PMTwinData.Opportunities.update(opportunityId, {
      status: 'published',
      publishedAt: new Date().toISOString()
    });

    opportunity.status = 'published';
    loadOpportunity();
    
    alert('Opportunity published successfully!');
  }

  // ============================================
  // Render Error
  // ============================================
  function renderError(message) {
    const container = document.getElementById('opportunityViewContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content">
          <div>
            <h1>Error</h1>
            <p>${message}</p>
            <a href="${getBackUrl()}" class="btn btn-secondary" style="margin-top: 1rem;">
              <i class="ph ph-arrow-left"></i> Back to Opportunities
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Public API
  // ============================================
  window.opportunityView = {
    init,
    publishOpportunity
  };
})();
