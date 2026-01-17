/**
 * Opportunity Details Component
 * Handles display and actions for opportunity details page
 */

(function() {
  'use strict';

  let currentOpportunity = null;
  let currentUserId = null;
  let matches = [];

  /**
   * Initialize component
   */
  function init(opportunityId) {
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

    // Load opportunity
    if (!window.OpportunityStore) {
      console.error('OpportunityStore not available');
      return;
    }

    currentOpportunity = window.OpportunityStore.getOpportunityById(opportunityId);
    if (!currentOpportunity) {
      document.getElementById('opportunityDetails').innerHTML = 
        '<p class="alert alert-error">Opportunity not found.</p>';
      return;
    }

    renderOpportunity();
    renderActions();
    renderProposals();
  }

  /**
   * Render opportunity details
   */
  function renderOpportunity() {
    const container = document.getElementById('opportunityDetails');
    if (!container || !currentOpportunity) return;

    const opp = currentOpportunity;
    const isOwner = currentUserId === opp.createdByUserId;

    // Status badge
    const statusBadge = document.getElementById('opportunityStatusBadge');
    if (statusBadge) {
      const statusColors = {
        'DRAFT': 'badge-warning',
        'PUBLISHED': 'badge-success',
        'CLOSED': 'badge-secondary'
      };
      const colorClass = statusColors[opp.status] || 'badge-secondary';
      statusBadge.innerHTML = `<span class="badge ${colorClass}">${opp.status}</span>`;
    }

    // Render details
    container.innerHTML = `
      <div class="opportunity-details">
        <div style="margin-bottom: 2rem;">
          <h2 style="margin-bottom: 0.5rem;">${escapeHtml(opp.title)}</h2>
          <p style="color: var(--text-secondary); line-height: 1.6;">${escapeHtml(opp.description)}</p>
        </div>
        
        <div class="content-grid-2" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
          <div>
            <strong style="color: var(--text-secondary); font-size: 0.875rem;">Intent:</strong>
            <div style="margin-top: 0.25rem;">
              ${opp.intent === 'REQUEST_SERVICE' ? '<span class="badge badge-info"><i class="ph ph-hand"></i> Request Service</span>' : '<span class="badge badge-success"><i class="ph ph-handshake"></i> Offer Service</span>'}
            </div>
          </div>
          <div>
            <strong style="color: var(--text-secondary); font-size: 0.875rem;">Status:</strong>
            <div style="margin-top: 0.25rem;">
              ${getStatusBadge(opp.status)}
            </div>
          </div>
          <div>
            <strong style="color: var(--text-secondary); font-size: 0.875rem;">Model:</strong>
            <div style="margin-top: 0.25rem;">${opp.model}.${opp.subModel}</div>
          </div>
          <div>
            <strong style="color: var(--text-secondary); font-size: 0.875rem;">Created:</strong>
            <div style="margin-top: 0.25rem;">${formatDate(opp.createdAt)}</div>
          </div>
        </div>

        <div style="margin-bottom: 2rem;">
          <h3 style="margin-bottom: 1rem;">Required Skills</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            ${opp.skillsTags.map(skill => `<span class="badge badge-primary">${escapeHtml(skill)}</span>`).join('')}
          </div>
        </div>

        <div style="margin-bottom: 2rem;">
          <h3>Service Items</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Price Reference</th>
              </tr>
            </thead>
            <tbody>
              ${opp.serviceItems.map(item => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${item.qty}</td>
                  <td>${escapeHtml(item.unit)}</td>
                  <td>${escapeHtml(item.priceRef || 'N/A')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 2rem;">
          <h3>Payment Terms</h3>
          <p><strong>Type:</strong> ${opp.paymentTerms.type}</p>
          ${opp.paymentTerms.barterRule ? `<p><strong>Barter Rule:</strong> ${escapeHtml(opp.paymentTerms.barterRule)}</p>` : ''}
        </div>

        <div style="margin-bottom: 2rem;">
          <h3>Location</h3>
          <p>
            ${opp.location.city}, ${opp.location.country}
            ${opp.location.area ? `, ${opp.location.area}` : ''}
          </p>
          <p><strong>Remote Allowed:</strong> ${opp.location.isRemoteAllowed ? 'Yes' : 'No'}</p>
        </div>
      </div>
    `;
  }

  /**
   * Render action buttons
   */
  function renderActions() {
    const container = document.getElementById('opportunityActions');
    if (!container || !currentOpportunity) return;

    const opp = currentOpportunity;
    const isOwner = currentUserId === opp.createdByUserId;

    let actionsHTML = '';

    // Publish button (if owner and draft)
    if (isOwner && opp.status === 'DRAFT') {
      actionsHTML += `
        <button class="btn btn-primary" onclick="opportunityDetails.publishOpportunity()">
          <i class="ph ph-paper-plane-tilt"></i> Publish
        </button>
      `;
    }

    // Find Matches button (if published)
    if (opp.status === 'PUBLISHED') {
      actionsHTML += `
        <button class="btn btn-secondary" onclick="opportunityDetails.findMatches()">
          <i class="ph ph-magnifying-glass"></i> Find Matches
        </button>
      `;
    }

    container.innerHTML = actionsHTML;
  }

  /**
   * Publish opportunity
   */
  function publishOpportunity() {
    if (!currentOpportunity || !window.OpportunityStore) return;

    const updated = window.OpportunityStore.publishOpportunity(currentOpportunity.id);
    if (updated) {
      currentOpportunity = updated;
      renderOpportunity();
      renderActions();
      alert('Opportunity published successfully!');
    }
  }

  /**
   * Find matches
   */
  function findMatches() {
    if (!currentOpportunity || !window.OpportunityStore) return;

    matches = window.OpportunityStore.runMatching(currentOpportunity.id);
    renderMatches();
  }

  /**
   * Render matches
   */
  function renderMatches() {
    const section = document.getElementById('matchesSection');
    const container = document.getElementById('matchesList');
    if (!section || !container) return;

    if (matches.length === 0) {
      container.innerHTML = `
        <div class="card enhanced-card">
          <div class="card-body" style="text-align: center; padding: 2rem;">
            <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--text-secondary);">
              <i class="ph ph-users"></i>
            </div>
            <p style="color: var(--text-secondary);">No compatible providers found matching the opportunity requirements.</p>
          </div>
        </div>
      `;
      section.style.display = 'block';
      return;
    }

    section.style.display = 'block';
    container.innerHTML = matches.map(match => {
      const provider = match.provider;
      return `
        <div class="card enhanced-card" style="margin-bottom: 1rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 1.5rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(provider.name)}</h3>
                <p style="margin: 0 0 0.75rem 0; color: var(--text-secondary);">
                  <i class="ph ph-envelope"></i> ${escapeHtml(provider.email)}
                  ${provider.phone ? `<br><i class="ph ph-phone"></i> ${escapeHtml(provider.phone)}` : ''}
                </p>
                <div style="margin-bottom: 0.75rem;">
                  <span class="badge badge-success" style="font-size: 1rem; padding: 0.5rem 0.75rem;">
                    <strong>${match.matchScore}%</strong> Match
                  </span>
                </div>
                <div style="margin-bottom: 0.75rem;">
                  <strong style="font-size: 0.875rem; color: var(--text-secondary);">Matched Skills:</strong>
                  <div style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${match.matchedSkills.map(skill => `<span class="badge badge-primary">${escapeHtml(skill)}</span>`).join('')}
                  </div>
                </div>
                <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
                  <strong style="font-size: 0.875rem; color: var(--text-secondary);">Match Details:</strong>
                  <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem; color: var(--text-secondary); font-size: 0.9rem;">
                    ${match.reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
                  </ul>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="opportunityDetails.submitProposal('${provider.id}')">
                  <i class="ph ph-paper-plane-tilt"></i> Submit Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Submit proposal (redirect to submit page)
   */
  function submitProposal(providerId) {
    if (!currentOpportunity || !window.UrlHelper) return;

    const submitUrl = window.UrlHelper.buildUrlWithQuery('pages/proposals/submit.html', {
      opportunityId: currentOpportunity.id,
      providerId: providerId
    });
    window.location.href = submitUrl;
  }

  /**
   * Render proposals
   */
  function renderProposals() {
    const container = document.getElementById('proposalsList');
    if (!container || !currentOpportunity || !window.OpportunityStore) return;

    const proposals = window.OpportunityStore.getProposalsByOpportunityId(currentOpportunity.id);
    const isOwner = currentUserId === currentOpportunity.createdByUserId;

    if (proposals.length === 0) {
      container.innerHTML = `
        <div class="card enhanced-card">
          <div class="card-body" style="text-align: center; padding: 2rem;">
            <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--text-secondary);">
              <i class="ph ph-file-text"></i>
            </div>
            <p style="color: var(--text-secondary);">No proposals have been submitted yet.</p>
            ${isOwner ? '<p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">Use "Find Matches" to discover compatible providers.</p>' : ''}
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = proposals.map(proposal => {
      const provider = window.OpportunityStore.getUserById(proposal.providerUserId);
      const providerName = provider ? provider.name : 'Unknown Provider';

      let actionsHTML = '';
      if (isOwner && proposal.status === 'SUBMITTED' || proposal.status === 'RESUBMITTED') {
        actionsHTML += `
          <button class="btn btn-outline" onclick="opportunityDetails.requestChanges('${proposal.id}')">
            Request Changes
          </button>
        `;
      }

      return `
        <div class="card enhanced-card" style="margin-bottom: 1rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 1.5rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                  <h3 style="margin: 0; flex: 1;">${escapeHtml(providerName)}</h3>
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
                ${proposal.breakdown && proposal.breakdown.length > 0 ? `
                  <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
                    <strong style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem; display: block;">Breakdown:</strong>
                    <ul style="margin: 0; padding-left: 1.5rem; list-style: disc;">
                      ${proposal.breakdown.map(item => `
                        <li style="margin-bottom: 0.25rem;">${escapeHtml(item.item)}: ${item.amount.toLocaleString()} ${proposal.currency}</li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${proposal.notes ? `
                  <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius); margin-bottom: 1rem;">
                    <strong style="font-size: 0.875rem; color: var(--text-secondary);">Notes:</strong>
                    <p style="margin: 0.5rem 0 0 0; line-height: 1.6;">${escapeHtml(proposal.notes)}</p>
                  </div>
                ` : ''}
                ${proposal.messages.length > 0 ? `
                  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <strong style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.75rem; display: block;">Messages:</strong>
                    ${proposal.messages.map(msg => {
                      const msgUser = window.OpportunityStore.getUserById(msg.fromUserId);
                      const msgUserName = msgUser ? msgUser.name : 'Unknown';
                      return `
                        <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--border-radius); border-left: 3px solid var(--color-primary);">
                          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <strong>${escapeHtml(msgUserName)}</strong>
                            <span style="font-size: 0.85rem; color: var(--text-secondary);">${formatDate(msg.at)}</span>
                          </div>
                          <p style="margin: 0; line-height: 1.6;">${escapeHtml(msg.text)}</p>
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : ''}
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 150px;">
                ${actionsHTML}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Request changes on a proposal
   */
  function requestChanges(proposalId) {
    const message = prompt('Enter your message requesting changes:');
    if (!message || message.trim().length === 0) return;

    if (!window.OpportunityStore || !currentUserId) return;

    const updated = window.OpportunityStore.requestProposalChanges(proposalId, currentUserId, message.trim());
    if (updated) {
      renderProposals();
      alert('Changes requested successfully!');
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
  window.opportunityDetails = {
    init: init,
    publishOpportunity: publishOpportunity,
    findMatches: findMatches,
    submitProposal: submitProposal,
    requestChanges: requestChanges
  };

})();
