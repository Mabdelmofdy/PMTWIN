/**
 * My Opportunities Component
 * Shows opportunities created by the current user
 */

(function() {
  'use strict';

  let currentUserId = null;
  let currentFilters = {
    intent: null,
    status: null
  };

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
      
      // Fallback methods
      if (!currentUserId && typeof window.currentUser !== 'undefined' && window.currentUser) {
        currentUserId = window.currentUser.userId || window.currentUser.id;
      }
      if (!currentUserId && typeof PMTwinData !== 'undefined' && PMTwinData.Sessions) {
        const currentUser = PMTwinData.Sessions.getCurrentUser();
        if (currentUser) {
          currentUserId = currentUser.id;
        }
      }
    } catch (e) {
      console.error('Error getting current user:', e);
    }

    if (!currentUserId) {
      document.getElementById('myOpportunitiesList').innerHTML = 
        '<p class="alert alert-error">Unable to identify current user. Please log in.</p>';
      return;
    }

    loadOpportunities();
  }

  /**
   * Load opportunities
   */
  function loadOpportunities() {
    const container = document.getElementById('myOpportunitiesList');
    if (!container || !window.OpportunityStore) {
      console.error('Container or OpportunityStore not available');
      return;
    }

    // Get opportunities created by current user
    let opportunities = window.OpportunityStore.getOpportunitiesByCreator(currentUserId);
    console.log('[MyOpportunities] Found', opportunities.length, 'opportunities for user', currentUserId);

    // Apply filters
    if (currentFilters.intent) {
      opportunities = opportunities.filter(opp => opp.intent === currentFilters.intent);
    }
    if (currentFilters.status) {
      opportunities = opportunities.filter(opp => opp.status === currentFilters.status);
    }

    if (opportunities.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>You haven't created any opportunities yet.</p>
            <a href="../create/" class="btn btn-primary" style="margin-top: 1rem;">
              <i class="ph ph-plus"></i> Create Your First Opportunity
            </a>
          </div>
        </div>
      `;
      return;
    }

    // Render opportunities
    container.innerHTML = opportunities.map(opp => {
      const proposals = window.OpportunityStore.getProposalsByOpportunityId(opp.id);
      const proposalCounts = {
        SUBMITTED: proposals.filter(p => p.status === 'SUBMITTED').length,
        CHANGES_REQUESTED: proposals.filter(p => p.status === 'CHANGES_REQUESTED').length,
        RESUBMITTED: proposals.filter(p => p.status === 'RESUBMITTED').length,
        ACCEPTED: proposals.filter(p => p.status === 'ACCEPTED').length
      };
      const totalProposals = proposals.length;

      const statusColors = {
        'DRAFT': 'alert-warning',
        'PUBLISHED': 'alert-success',
        'CLOSED': 'alert-secondary'
      };

      const intentBadge = opp.intent === 'REQUEST_SERVICE' ? 
        '<span class="badge badge-info">Request Service</span>' :
        '<span class="badge badge-success">Offer Service</span>';

      const detailsUrl = window.UrlHelper ? 
        window.UrlHelper.buildUrlWithQuery('pages/opportunities/details.html', { id: opp.id }) :
        `../details.html?id=${opp.id}`;

      return `
        <div class="card enhanced-card" style="margin-bottom: 1.5rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">
                  <a href="${detailsUrl}">${escapeHtml(opp.title)}</a>
                </h3>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                  ${intentBadge}
                  <span class="badge ${statusColors[opp.status] || ''}">${opp.status}</span>
                  ${opp.location.city && opp.location.country ? 
                    `<span class="badge badge-secondary"><i class="ph ph-map-pin"></i> ${escapeHtml(opp.location.city)}, ${escapeHtml(opp.location.country)}</span>` : ''}
                </div>
                <p style="margin: 0; color: var(--text-secondary);">
                  ${escapeHtml(opp.description.substring(0, 200))}${opp.description.length > 200 ? '...' : ''}
                </p>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
              <div>
                <strong>Proposals:</strong> ${totalProposals} total
                ${proposalCounts.SUBMITTED > 0 ? ` | <span style="color: var(--color-info);">${proposalCounts.SUBMITTED} submitted</span>` : ''}
                ${proposalCounts.RESUBMITTED > 0 ? ` | <span style="color: var(--color-success);">${proposalCounts.RESUBMITTED} resubmitted</span>` : ''}
                ${proposalCounts.CHANGES_REQUESTED > 0 ? ` | <span style="color: var(--color-warning);">${proposalCounts.CHANGES_REQUESTED} changes requested</span>` : ''}
                ${proposalCounts.ACCEPTED > 0 ? ` | <span style="color: var(--color-success);">${proposalCounts.ACCEPTED} accepted</span>` : ''}
              </div>
              <div style="display: flex; gap: 0.5rem;">
                ${opp.status === 'DRAFT' ? `
                  <button class="btn btn-success btn-sm" onclick="myOpportunities.publishOpportunity('${opp.id}')">
                    <i class="ph ph-paper-plane-tilt"></i> Publish
                  </button>
                ` : ''}
                <a href="${detailsUrl}" class="btn btn-outline btn-sm">
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
   * Update filter
   */
  function updateFilter(filterName, value) {
    currentFilters[filterName] = value || null;
    loadOpportunities();
  }

  /**
   * Clear filters
   */
  function clearFilters() {
    currentFilters = {
      intent: null,
      status: null
    };
    document.getElementById('filterIntent').value = '';
    document.getElementById('filterStatus').value = '';
    loadOpportunities();
  }

  /**
   * Publish opportunity
   */
  function publishOpportunity(opportunityId) {
    if (!window.OpportunityStore) return;

    const updated = window.OpportunityStore.publishOpportunity(opportunityId);
    if (updated) {
      alert('Opportunity published successfully!');
      loadOpportunities();
    } else {
      alert('Failed to publish opportunity');
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

  // Export
  window.myOpportunities = {
    init: init,
    updateFilter: updateFilter,
    clearFilters: clearFilters,
    publishOpportunity: publishOpportunity
  };

})();
