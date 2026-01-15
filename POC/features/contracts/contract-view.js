/**
 * Contract View Component
 * Displays full contract details including parties, scope, payment terms, location, dates
 */

(function() {
  'use strict';

  let contractId = null;
  let contract = null;

  // ============================================
  // Initialize Component
  // ============================================
  function init() {
    // Get contract ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    contractId = urlParams.get('id');
    
    if (!contractId) {
      renderError('Contract ID not provided');
      return;
    }

    loadContract();
  }

  // ============================================
  // Load Contract
  // ============================================
  function loadContract() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      renderError('Contracts service not available');
      return;
    }

    contract = PMTwinData.Contracts.getById(contractId);
    
    if (!contract) {
      renderError('Contract not found');
      return;
    }

    // Get related data
    const buyerId = contract.buyerPartyId || contract.buyerId;
    const providerId = contract.providerPartyId || contract.providerId;
    const opportunityId = contract.opportunityId || contract.scopeId;
    const proposalId = contract.proposalId;
    
    const buyer = buyerId ? PMTwinData.Users.getById(buyerId) : null;
    const provider = providerId ? PMTwinData.Users.getById(providerId) : null;
    const opportunity = opportunityId ? PMTwinData.Opportunities?.getById(opportunityId) : null;
    const proposal = proposalId ? PMTwinData.Proposals?.getById(proposalId) : null;
    
    // Get accepted proposal version if available
    let acceptedVersion = null;
    if (proposal && contract.generatedFromProposalVersionId) {
      const versionNum = parseInt(contract.generatedFromProposalVersionId.split('_v')[1] || contract.generatedFromProposalVersionId);
      acceptedVersion = proposal.versions?.find(v => v.version === versionNum);
    }

    renderContract(contract, buyer, provider, opportunity, proposal, acceptedVersion);
  }

  // ============================================
  // Render Contract
  // ============================================
  function renderContract(contract, buyer, provider, opportunity, proposal, acceptedVersion) {
    const container = document.getElementById('contractViewContainer');
    if (!container) return;

    const statusBadge = getStatusBadge(contract.status);
    const buyerName = buyer?.name || buyer?.companyName || `User ${contract.buyerPartyId || contract.buyerId}`;
    const providerName = provider?.name || provider?.companyName || `User ${contract.providerPartyId || contract.providerId}`;
    
    const scopeTitle = opportunity?.title || contract.scopeTitle || 'N/A';
    const location = opportunity?.location || contract.location || {};
    const locationText = location.city && location.country 
      ? `${location.city}, ${location.country}`
      : location.country || 'Not specified';
    
    // Payment terms from accepted proposal version (preferred) or contract
    const paymentTerms = acceptedVersion?.paymentTerms || contract.paymentTerms || {};
    const paymentMode = paymentTerms.mode || 'N/A';
    const totalValue = paymentTerms.totalValue || contract.servicesSchedule?.reduce((sum, s) => sum + (s.totalValue || 0), 0) || 0;

    const html = `
      <div class="page-header">
        <div class="page-header-content">
          <div>
            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
              <a href="${getBackUrl()}" class="btn btn-secondary btn-sm">
                <i class="ph ph-arrow-left"></i> Back
              </a>
            </div>
            <h1>Contract: ${scopeTitle}</h1>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
              ${statusBadge}
              <span class="badge badge-secondary">${contract.contractType || 'Contract'}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="content-section">
        <div class="card enhanced-card">
          <div class="card-body">
            <!-- Parties -->
            <div style="margin-bottom: 2rem;">
              <h2 class="section-title">Parties</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                <div class="card" style="background: var(--bg-secondary); padding: 1.5rem;">
                  <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; text-transform: uppercase; color: var(--text-secondary);">Buyer</h3>
                  <p style="margin: 0; font-size: 1.125rem; font-weight: bold;">${buyerName}</p>
                  ${buyer?.email ? `<p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">${buyer.email}</p>` : ''}
                </div>
                <div class="card" style="background: var(--bg-secondary); padding: 1.5rem;">
                  <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; text-transform: uppercase; color: var(--text-secondary);">Provider</h3>
                  <p style="margin: 0; font-size: 1.125rem; font-weight: bold;">${providerName}</p>
                  ${provider?.email ? `<p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">${provider.email}</p>` : ''}
                </div>
              </div>
            </div>

            <!-- Scope Summary -->
            <div style="margin-bottom: 2rem;">
              <h2 class="section-title">Scope Summary</h2>
              <div class="card" style="background: var(--bg-secondary); padding: 1.5rem;">
                <p style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: bold;">${scopeTitle}</p>
                ${opportunity?.description ? `
                  <p style="margin: 0; color: var(--text-secondary);">${opportunity.description.substring(0, 300)}${opportunity.description.length > 300 ? '...' : ''}</p>
                ` : ''}
                ${opportunity?.serviceItems && opportunity.serviceItems.length > 0 ? `
                  <div style="margin-top: 1rem;">
                    <strong>Service Items:</strong>
                    <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                      ${opportunity.serviceItems.slice(0, 5).map(item => `
                        <li>${item.name || 'Service'} - ${item.qty || 1} ${item.unit || 'unit'}</li>
                      `).join('')}
                      ${opportunity.serviceItems.length > 5 ? `<li><em>+${opportunity.serviceItems.length - 5} more items</em></li>` : ''}
                    </ul>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Payment Terms -->
            <div style="margin-bottom: 2rem;">
              <h2 class="section-title">Final Payment Terms</h2>
              <div class="card" style="background: var(--bg-secondary); padding: 1.5rem;">
                ${renderPaymentTerms(paymentTerms, totalValue)}
                ${acceptedVersion ? `
                  <p style="margin: 1rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">
                    <i class="ph ph-info"></i> Terms from accepted proposal version ${acceptedVersion.version}
                  </p>
                ` : ''}
              </div>
            </div>

            <!-- Location Summary -->
            <div style="margin-bottom: 2rem;">
              <h2 class="section-title">Location</h2>
              <div class="card" style="background: var(--bg-secondary); padding: 1.5rem;">
                <p style="margin: 0; font-size: 1.125rem;">
                  <i class="ph ph-map-pin"></i> ${locationText}
                </p>
                ${location.isRemoteAllowed ? `
                  <p style="margin: 0.5rem 0 0 0; color: var(--color-success);">
                    <i class="ph ph-globe"></i> Remote work allowed
                  </p>
                ` : ''}
              </div>
            </div>

            <!-- Dates -->
            <div style="margin-bottom: 2rem;">
              <h2 class="section-title">Important Dates</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                ${contract.createdAt ? `
                  <div class="card" style="background: var(--bg-secondary); padding: 1rem;">
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; text-transform: uppercase; color: var(--text-secondary);">Created</h3>
                    <p style="margin: 0; font-size: 1rem;">${new Date(contract.createdAt).toLocaleDateString()}</p>
                  </div>
                ` : ''}
                ${contract.startDate ? `
                  <div class="card" style="background: var(--bg-secondary); padding: 1rem;">
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; text-transform: uppercase; color: var(--text-secondary);">Start Date</h3>
                    <p style="margin: 0; font-size: 1rem;">${new Date(contract.startDate).toLocaleDateString()}</p>
                  </div>
                ` : ''}
                ${contract.endDate ? `
                  <div class="card" style="background: var(--bg-secondary); padding: 1rem;">
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; text-transform: uppercase; color: var(--text-secondary);">End Date</h3>
                    <p style="margin: 0; font-size: 1rem;">${new Date(contract.endDate).toLocaleDateString()}</p>
                  </div>
                ` : ''}
                ${contract.signedAt ? `
                  <div class="card" style="background: var(--bg-secondary); padding: 1rem;">
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; text-transform: uppercase; color: var(--text-secondary);">Signed</h3>
                    <p style="margin: 0; font-size: 1rem;">${new Date(contract.signedAt).toLocaleDateString()}</p>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Source Proposal Link -->
            ${proposal ? `
              <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border-color);">
                <h2 class="section-title">Source Proposal</h2>
                <a href="${getProposalViewUrl(proposal.id)}" class="btn btn-secondary">
                  <i class="ph ph-paper-plane-tilt"></i> View Proposal
                </a>
              </div>
            ` : ''}

            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border-color);">
              <a href="${getBackUrl()}" class="btn btn-secondary">
                <i class="ph ph-arrow-left"></i> Back to Contracts
              </a>
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
  function renderPaymentTerms(paymentTerms, totalValue) {
    if (!paymentTerms || !paymentTerms.mode) {
      return '<p>No payment terms specified</p>';
    }
    
    let html = `<p style="margin: 0 0 0.5rem 0;"><strong>Mode:</strong> ${paymentTerms.mode}</p>`;
    
    if (totalValue > 0) {
      html += `<p style="margin: 0 0 0.5rem 0;"><strong>Total Value:</strong> ${totalValue.toLocaleString()} SAR</p>`;
    }
    
    if (paymentTerms.mode === 'BARTER' || paymentTerms.mode === 'HYBRID') {
      if (paymentTerms.barterRule) {
        html += `<p style="margin: 0 0 0.5rem 0;"><strong>Barter Rule:</strong> ${paymentTerms.barterRule}</p>`;
      }
      if (paymentTerms.cashSettlement !== undefined && paymentTerms.cashSettlement > 0) {
        html += `<p style="margin: 0;"><strong>Cash Settlement:</strong> ${paymentTerms.cashSettlement.toLocaleString()} SAR</p>`;
      }
    }
    
    return html;
  }

  // ============================================
  // Helper: Get Status Badge
  // ============================================
  function getStatusBadge(status) {
    const badges = {
      'DRAFT': '<span class="badge badge-secondary"><i class="ph ph-file-dashed"></i> Draft</span>',
      'SENT': '<span class="badge badge-info"><i class="ph ph-paper-plane-tilt"></i> Sent</span>',
      'SIGNED': '<span class="badge badge-success"><i class="ph ph-check-circle"></i> Signed</span>',
      'ACTIVE': '<span class="badge badge-success"><i class="ph ph-play-circle"></i> Active</span>',
      'COMPLETED': '<span class="badge badge-primary"><i class="ph ph-check-circle"></i> Completed</span>',
      'TERMINATED': '<span class="badge badge-danger"><i class="ph ph-x-circle"></i> Terminated</span>'
    };
    return badges[status] || '<span class="badge badge-secondary">' + (status || 'Unknown') + '</span>';
  }

  // ============================================
  // Helper: Get Back URL
  // ============================================
  function getBackUrl() {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRoute('contracts');
    }
    return '/POC/pages/contracts/index.html';
  }

  // ============================================
  // Helper: Get Proposal View URL
  // ============================================
  function getProposalViewUrl(proposalId) {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('proposal-view', { id: proposalId });
    }
    return `/POC/pages/proposals/view/index.html?id=${proposalId}`;
  }

  // ============================================
  // Render Error
  // ============================================
  function renderError(message) {
    const container = document.getElementById('contractViewContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-content">
          <div>
            <h1>Error</h1>
            <p>${message}</p>
            <a href="${getBackUrl()}" class="btn btn-secondary" style="margin-top: 1rem;">
              <i class="ph ph-arrow-left"></i> Back to Contracts
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Public API
  // ============================================
  window.contractView = {
    init
  };
})();
