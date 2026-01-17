/**
 * Pipeline Component
 * Handles beneficiary and provider pipeline views
 */

(function() {
  'use strict';

  let currentUserId = null;
  let currentTab = 'beneficiary';

  /**
   * Initialize component
   */
  function init() {
    // Get current user
    try {
      const sessionStr = localStorage.getItem('pmtwin_current_user') || localStorage.getItem('pmtwin_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        currentUserId = session.userId || session.id;
      }
    } catch (e) {
      console.error('Error getting current user:', e);
    }

    if (!currentUserId) {
      console.error('No current user found');
      return;
    }

    // Determine initial tab based on user role
    const user = window.OpportunityStore ? window.OpportunityStore.getUserById(currentUserId) : null;
    if (user && user.role === 'provider') {
      currentTab = 'provider';
      showTab('provider');
    } else {
      showTab('beneficiary');
    }

    renderBeneficiaryPipeline();
    renderProviderPipeline();
  }

  /**
   * Show tab
   */
  function showTab(tab) {
    currentTab = tab;

    // Update tab buttons
    const beneficiaryTab = document.getElementById('beneficiaryTab');
    const providerTab = document.getElementById('providerTab');
    const beneficiaryPipeline = document.getElementById('beneficiaryPipeline');
    const providerPipeline = document.getElementById('providerPipeline');

    if (tab === 'beneficiary') {
      if (beneficiaryTab) beneficiaryTab.classList.add('active');
      if (providerTab) providerTab.classList.remove('active');
      if (beneficiaryPipeline) beneficiaryPipeline.style.display = 'block';
      if (providerPipeline) providerPipeline.style.display = 'none';
    } else {
      if (beneficiaryTab) beneficiaryTab.classList.remove('active');
      if (providerTab) providerTab.classList.add('active');
      if (beneficiaryPipeline) beneficiaryPipeline.style.display = 'none';
      if (providerPipeline) providerPipeline.style.display = 'block';
    }
  }

  /**
   * Render beneficiary pipeline
   */
  function renderBeneficiaryPipeline() {
    const container = document.getElementById('beneficiaryOpportunitiesList');
    if (!container || !window.OpportunityStore) return;

    const opportunities = window.OpportunityStore.getOpportunitiesByCreator(currentUserId);

    if (opportunities.length === 0) {
      container.innerHTML = `
        <p class="alert alert-info">You haven't created any opportunities yet.</p>
        <a href="${window.UrlHelper ? window.UrlHelper.buildUrl('pages/opportunities/create.html') : '../opportunities/create.html'}" 
           class="btn btn-primary">
          Create Opportunity
        </a>
      `;
      return;
    }

    container.innerHTML = opportunities.map(opp => {
      const proposals = window.OpportunityStore.getProposalsByOpportunityId(opp.id);
      const proposalCounts = {
        SUBMITTED: proposals.filter(p => p.status === 'SUBMITTED').length,
        CHANGES_REQUESTED: proposals.filter(p => p.status === 'CHANGES_REQUESTED').length,
        RESUBMITTED: proposals.filter(p => p.status === 'RESUBMITTED').length,
        ACCEPTED: proposals.filter(p => p.status === 'ACCEPTED').length,
        REJECTED: proposals.filter(p => p.status === 'REJECTED').length
      };
      const totalProposals = proposals.length;

      const intentBadge = opp.intent === 'REQUEST_SERVICE' ? 
        '<span class="badge badge-info"><i class="ph ph-hand"></i> Request Service</span>' :
        '<span class="badge badge-success"><i class="ph ph-handshake"></i> Offer Service</span>';

      const detailsUrl = window.UrlHelper ? 
        window.UrlHelper.buildUrlWithQuery('pages/opportunities/details.html', { id: opp.id }) :
        `../opportunities/details.html?id=${opp.id}`;

      return `
        <div class="card enhanced-card" style="margin-bottom: 1rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 1.5rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                  <h3 style="margin: 0; flex: 1;">
                    <a href="${detailsUrl}" style="text-decoration: none; color: inherit;">${escapeHtml(opp.title)}</a>
                  </h3>
                  ${getStatusBadge(opp.status)}
                </div>
                <p style="margin: 0 0 1rem 0; color: var(--text-secondary); line-height: 1.6;">
                  ${escapeHtml(opp.description.substring(0, 200))}${opp.description.length > 200 ? '...' : ''}
                </p>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                  ${intentBadge}
                  ${opp.location.city && opp.location.country ? 
                    `<span class="badge badge-secondary"><i class="ph ph-map-pin"></i> ${escapeHtml(opp.location.city)}, ${escapeHtml(opp.location.country)}</span>` : ''}
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
                  <strong style="font-size: 0.875rem; color: var(--text-secondary);">Proposal Statistics:</strong>
                  <div style="margin-top: 0.75rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem;">
                    <div>
                      <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${totalProposals}</div>
                      <div style="font-size: 0.875rem; color: var(--text-secondary);">Total</div>
                    </div>
                    ${proposalCounts.SUBMITTED > 0 ? `
                      <div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-info);">${proposalCounts.SUBMITTED}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Submitted</div>
                      </div>
                    ` : ''}
                    ${proposalCounts.RESUBMITTED > 0 ? `
                      <div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">${proposalCounts.RESUBMITTED}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Resubmitted</div>
                      </div>
                    ` : ''}
                    ${proposalCounts.CHANGES_REQUESTED > 0 ? `
                      <div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-warning);">${proposalCounts.CHANGES_REQUESTED}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Changes Req.</div>
                      </div>
                    ` : ''}
                    ${proposalCounts.ACCEPTED > 0 ? `
                      <div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">${proposalCounts.ACCEPTED}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Accepted</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <a href="${detailsUrl}" class="btn btn-primary">
                  <i class="ph ph-eye"></i> View Details
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render provider pipeline
   */
  function renderProviderPipeline() {
    const container = document.getElementById('providerProposalsList');
    if (!container || !window.OpportunityStore) return;

    const proposals = window.OpportunityStore.getProposalsByProviderId(currentUserId);

    if (proposals.length === 0) {
      container.innerHTML = `
        <div class="card enhanced-card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--text-secondary);">
              <i class="ph ph-file-text"></i>
            </div>
            <h3 style="margin-bottom: 0.5rem;">No Proposals Yet</h3>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">Start submitting proposals to see them here.</p>
            <a href="${window.UrlHelper ? window.UrlHelper.buildUrl('pages/opportunities/index.html') : '../opportunities/index.html'}" 
               class="btn btn-primary">
              <i class="ph ph-sparkle"></i> Browse Opportunities
            </a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = proposals.map(proposal => {
      const opportunity = window.OpportunityStore.getOpportunityById(proposal.opportunityId);
      const oppTitle = opportunity ? opportunity.title : 'Unknown Opportunity';

      const detailsUrl = window.UrlHelper ? 
        window.UrlHelper.buildUrlWithQuery('pages/opportunities/details.html', { id: proposal.opportunityId }) :
        `../opportunities/details.html?id=${proposal.opportunityId}`;

      let actionsHTML = '';
      if (proposal.status === 'CHANGES_REQUESTED') {
        actionsHTML += `
          <button class="btn btn-primary" onclick="pipelineComponent.resubmitProposal('${proposal.id}')">
            <i class="ph ph-arrow-clockwise"></i> Resubmit
          </button>
        `;
      }

      return `
        <div class="card enhanced-card" style="margin-bottom: 1rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 1.5rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                  <h3 style="margin: 0; flex: 1;">
                    <a href="${detailsUrl}" style="text-decoration: none; color: inherit;">${escapeHtml(oppTitle)}</a>
                  </h3>
                  ${getStatusBadge(proposal.status)}
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                  <div>
                    <strong style="font-size: 0.875rem; color: var(--text-secondary);">Price:</strong>
                    <div style="font-size: 1.125rem; font-weight: 600; color: var(--color-primary);">
                      ${proposal.priceTotal.toLocaleString()} ${proposal.currency}
                    </div>
                  </div>
                  <div>
                    <strong style="font-size: 0.875rem; color: var(--text-secondary);">Timeline:</strong>
                    <div>${escapeHtml(proposal.deliveryTimeline)}</div>
                  </div>
                </div>
                ${proposal.messages.length > 0 ? `
                  <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius); border-left: 3px solid var(--color-warning);">
                    <strong style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem; display: block;">Latest Message:</strong>
                    <p style="margin: 0 0 0.5rem 0; line-height: 1.6;">${escapeHtml(proposal.messages[proposal.messages.length - 1].text)}</p>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                      ${formatDate(proposal.messages[proposal.messages.length - 1].at)}
                    </div>
                  </div>
                ` : ''}
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 150px;">
                ${actionsHTML}
                <a href="${detailsUrl}" class="btn btn-outline">
                  <i class="ph ph-eye"></i> View
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Resubmit proposal
   */
  function resubmitProposal(proposalId) {
    const proposal = window.OpportunityStore ? window.OpportunityStore.getProposalById(proposalId) : null;
    if (!proposal) {
      alert('Proposal not found');
      return;
    }

    const message = prompt('Enter your message for the resubmission:');
    if (!message || message.trim().length === 0) {
      return;
    }

    // For resubmission, we'll redirect to a resubmit page or use a modal
    // For now, just update with a message
    const updates = {
      message: message.trim()
    };

    const updated = window.OpportunityStore.resubmitProposal(proposalId, updates);
    if (updated) {
      renderProviderPipeline();
      alert('Proposal resubmitted successfully!');
    }
  }

  /**
   * Get status badge with consistent styling
   */
  function getStatusBadge(status) {
    if (!status) return '';
    const statusUpper = status.toUpperCase();
    const statusColors = {
      'DRAFT': 'badge-warning',
      'PUBLISHED': 'badge-success',
      'CLOSED': 'badge-secondary',
      'SUBMITTED': 'badge-info',
      'CHANGES_REQUESTED': 'badge-warning',
      'RESUBMITTED': 'badge-success',
      'ACCEPTED': 'badge-success',
      'REJECTED': 'badge-error'
    };
    const colorClass = statusColors[statusUpper] || 'badge-secondary';
    return `<span class="badge ${colorClass}">${status}</span>`;
  }

  /**
   * Helper: Escape HTML
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Helper: Format date
   */
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  }

  // Export
  window.pipelineComponent = {
    init: init,
    showTab: showTab,
    resubmitProposal: resubmitProposal
  };

})();
