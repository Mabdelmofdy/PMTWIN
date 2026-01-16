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
        'DRAFT': 'alert-warning',
        'PUBLISHED': 'alert-success',
        'CLOSED': 'alert-secondary'
      };
      statusBadge.innerHTML = `<span class="badge ${statusColors[opp.status] || ''}">${opp.status}</span>`;
    }

    // Render details
    container.innerHTML = `
      <div class="opportunity-details">
        <h2>${escapeHtml(opp.title)}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">${escapeHtml(opp.description)}</p>
        
        <div class="content-grid-2" style="margin-bottom: 2rem;">
          <div>
            <strong>Intent:</strong> ${opp.intent}
          </div>
          <div>
            <strong>Status:</strong> ${opp.status}
          </div>
          <div>
            <strong>Model:</strong> ${opp.model}.${opp.subModel}
          </div>
          <div>
            <strong>Created:</strong> ${formatDate(opp.createdAt)}
          </div>
        </div>

        <div style="margin-bottom: 2rem;">
          <h3>Required Skills</h3>
          <div class="tags-list">
            ${opp.skillsTags.map(skill => `<span class="tag">${escapeHtml(skill)}</span>`).join('')}
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
      container.innerHTML = '<p class="alert alert-info">No compatible providers found.</p>';
      section.style.display = 'block';
      return;
    }

    section.style.display = 'block';
    container.innerHTML = matches.map(match => {
      const provider = match.provider;
      return `
        <div class="card" style="margin-bottom: 1rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(provider.name)}</h3>
                <p style="margin: 0; color: var(--text-secondary);">${escapeHtml(provider.email)}</p>
                <p style="margin: 0.5rem 0 0 0;">
                  <strong>Match Score:</strong> ${match.matchScore}%
                </p>
                <p style="margin: 0.5rem 0;">
                  <strong>Matched Skills:</strong> ${match.matchedSkills.join(', ')}
                </p>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem; color: var(--text-secondary); font-size: 0.9rem;">
                  ${match.reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
                </ul>
              </div>
              <div>
                <button class="btn btn-primary" onclick="opportunityDetails.submitProposal('${provider.id}')">
                  Submit Proposal
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
      container.innerHTML = '<p class="alert alert-info">No proposals yet.</p>';
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
        <div class="card" style="margin-bottom: 1rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(providerName)}</h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  <strong>Status:</strong> <span class="badge">${proposal.status}</span>
                </p>
                <p style="margin: 0.5rem 0;">
                  <strong>Price:</strong> ${proposal.priceTotal} ${proposal.currency}
                </p>
                <p style="margin: 0.5rem 0;">
                  <strong>Timeline:</strong> ${escapeHtml(proposal.deliveryTimeline)}
                </p>
                ${proposal.notes ? `<p style="margin: 0.5rem 0;">${escapeHtml(proposal.notes)}</p>` : ''}
                ${proposal.messages.length > 0 ? `
                  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <strong>Messages:</strong>
                    ${proposal.messages.map(msg => {
                      const msgUser = window.OpportunityStore.getUserById(msg.fromUserId);
                      const msgUserName = msgUser ? msgUser.name : 'Unknown';
                      return `
                        <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: 4px;">
                          <strong>${escapeHtml(msgUserName)}:</strong> ${escapeHtml(msg.text)}
                          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            ${formatDate(msg.at)}
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : ''}
              </div>
              <div style="margin-left: 1rem;">
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
