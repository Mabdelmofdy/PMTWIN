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

      const statusColors = {
        'DRAFT': 'alert-warning',
        'PUBLISHED': 'alert-success',
        'CLOSED': 'alert-secondary'
      };

      const detailsUrl = window.UrlHelper ? 
        window.UrlHelper.buildUrlWithQuery('pages/opportunities/details.html', { id: opp.id }) :
        `../opportunities/details.html?id=${opp.id}`;

      return `
        <div class="card" style="margin-bottom: 1rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">
                  <a href="${detailsUrl}">${escapeHtml(opp.title)}</a>
                </h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  ${escapeHtml(opp.description.substring(0, 150))}${opp.description.length > 150 ? '...' : ''}
                </p>
                <div style="margin-top: 1rem;">
                  <span class="badge ${statusColors[opp.status] || ''}">${opp.status}</span>
                  <span style="margin-left: 1rem; color: var(--text-secondary);">
                    Intent: ${opp.intent}
                  </span>
                </div>
                <div style="margin-top: 0.5rem;">
                  <strong>Proposals:</strong> ${totalProposals} total
                  ${proposalCounts.SUBMITTED > 0 ? ` | ${proposalCounts.SUBMITTED} submitted` : ''}
                  ${proposalCounts.RESUBMITTED > 0 ? ` | ${proposalCounts.RESUBMITTED} resubmitted` : ''}
                  ${proposalCounts.CHANGES_REQUESTED > 0 ? ` | ${proposalCounts.CHANGES_REQUESTED} changes requested` : ''}
                </div>
              </div>
              <div style="margin-left: 1rem;">
                <a href="${detailsUrl}" class="btn btn-outline">View Details</a>
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
        <p class="alert alert-info">You haven't submitted any proposals yet.</p>
        <a href="${window.UrlHelper ? window.UrlHelper.buildUrl('pages/opportunities/index.html') : '../opportunities/index.html'}" 
           class="btn btn-primary">
          Browse Opportunities
        </a>
      `;
      return;
    }

    container.innerHTML = proposals.map(proposal => {
      const opportunity = window.OpportunityStore.getOpportunityById(proposal.opportunityId);
      const oppTitle = opportunity ? opportunity.title : 'Unknown Opportunity';

      const statusColors = {
        'SUBMITTED': 'alert-info',
        'CHANGES_REQUESTED': 'alert-warning',
        'RESUBMITTED': 'alert-success',
        'ACCEPTED': 'alert-success',
        'REJECTED': 'alert-error'
      };

      const detailsUrl = window.UrlHelper ? 
        window.UrlHelper.buildUrlWithQuery('pages/opportunities/details.html', { id: proposal.opportunityId }) :
        `../opportunities/details.html?id=${proposal.opportunityId}`;

      let actionsHTML = '';
      if (proposal.status === 'CHANGES_REQUESTED') {
        actionsHTML += `
          <button class="btn btn-primary" onclick="pipelineComponent.resubmitProposal('${proposal.id}')">
            Resubmit
          </button>
        `;
      }

      return `
        <div class="card" style="margin-bottom: 1rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">
                  <a href="${detailsUrl}">${escapeHtml(oppTitle)}</a>
                </h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  <strong>Status:</strong> <span class="badge ${statusColors[proposal.status] || ''}">${proposal.status}</span>
                </p>
                <p style="margin: 0.5rem 0;">
                  <strong>Price:</strong> ${proposal.priceTotal} ${proposal.currency}
                </p>
                <p style="margin: 0.5rem 0;">
                  <strong>Timeline:</strong> ${escapeHtml(proposal.deliveryTimeline)}
                </p>
                ${proposal.messages.length > 0 ? `
                  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <strong>Latest Message:</strong>
                    <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: 4px;">
                      ${escapeHtml(proposal.messages[proposal.messages.length - 1].text)}
                      <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                        ${formatDate(proposal.messages[proposal.messages.length - 1].at)}
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
              <div style="margin-left: 1rem;">
                ${actionsHTML}
                <a href="${detailsUrl}" class="btn btn-outline">View</a>
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
