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
        <div class="card enhanced-card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--text-secondary);">
              <i class="ph ph-folder-open"></i>
            </div>
            <h3 style="margin-bottom: 0.5rem;">No Opportunities Yet</h3>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">Create your first opportunity to start connecting with providers.</p>
            <a href="../create/" class="btn btn-primary">
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

      const intentBadge = opp.intent === 'REQUEST_SERVICE' ? 
        '<span class="badge badge-info"><i class="ph ph-hand"></i> Request Service</span>' :
        '<span class="badge badge-success"><i class="ph ph-handshake"></i> Offer Service</span>';

      const detailsUrl = window.UrlHelper ? 
        window.UrlHelper.buildUrlWithQuery('pages/opportunities/details.html', { id: opp.id }) :
        `../details.html?id=${opp.id}`;

      return `
        <div class="card enhanced-card" style="margin-bottom: 1.5rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 1.5rem; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                  <h3 style="margin: 0; flex: 1;">
                    <a href="${detailsUrl}" style="text-decoration: none; color: inherit;">${escapeHtml(opp.title)}</a>
                  </h3>
                  ${getStatusBadge(opp.status)}
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                  ${intentBadge}
                  ${opp.location.city && opp.location.country ? 
                    `<span class="badge badge-secondary"><i class="ph ph-map-pin"></i> ${escapeHtml(opp.location.city)}, ${escapeHtml(opp.location.country)}</span>` : ''}
                </div>
                <p style="margin: 0 0 1rem 0; color: var(--text-secondary); line-height: 1.6;">
                  ${escapeHtml(opp.description.substring(0, 200))}${opp.description.length > 200 ? '...' : ''}
                </p>
              </div>
            </div>
            
            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius); margin-bottom: 1rem;">
              <strong style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.75rem; display: block;">Proposal Statistics:</strong>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem;">
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
            
            <div style="display: flex; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
              ${opp.status === 'DRAFT' ? `
                <button class="btn btn-success" onclick="myOpportunities.publishOpportunity('${opp.id}')">
                  <i class="ph ph-paper-plane-tilt"></i> Publish
                </button>
              ` : ''}
              <a href="${detailsUrl}" class="btn btn-primary">
                <i class="ph ph-eye"></i> View Details
              </a>
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

  // Export
  window.myOpportunities = {
    init: init,
    updateFilter: updateFilter,
    clearFilters: clearFilters,
    publishOpportunity: publishOpportunity
  };

})();
