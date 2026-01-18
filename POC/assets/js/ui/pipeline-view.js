/**
 * PMTwin Pipeline View UI Component
 * Service Pipeline Kanban view
 */

(function() {
  'use strict';

  // Map proposal statuses to pipeline columns
  const statusMapping = {
    'In Review': ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'RESUBMITTED', 'DRAFT'],
    'Evaluation': ['NEGOTIATION', 'SHORTLISTED', 'IN_EVALUATION'],
    'Approved': ['ACCEPTED', 'ACCEPTED_BY_OWNER', 'ACCEPTED_BY_OTHER', 'AWARDED', 'FINAL_ACCEPTED'],
    'Rejected': ['REJECTED'],
    'Completed': ['COMPLETED', 'CLOSED', 'FULFILLED']
  };

  // Column colors
  const columnColors = {
    'In Review': 'warning',      // Yellow/orange
    'Evaluation': 'info',         // Blue
    'Approved': 'success',        // Green
    'Rejected': 'danger',         // Red
    'Completed': 'secondary'      // Grey
  };

  function render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Get current user - try PMTwinData.Sessions first, then window.Session
    let currentUser = null;
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Sessions) {
      currentUser = PMTwinData.Sessions.getCurrentUser();
      // Sync to window.Session for backward compatibility
      if (currentUser && typeof window.Session !== 'undefined' && typeof window.Session.setCurrentUser === 'function') {
        window.Session.setCurrentUser(currentUser);
      }
    }
    
    if (!currentUser && typeof window.Session !== 'undefined') {
      currentUser = window.Session.getCurrentUser();
    }
    
    if (!currentUser) {
      container.innerHTML = '<p>Please login</p>';
      return;
    }

    // Get all proposals for the current user
    let proposals = [];
    
    // Try PMTwinData.Proposals first
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Proposals) {
      const allProposals = PMTwinData.Proposals.getAll();
      // Filter proposals where user is either the creator or the counterparty
      proposals = allProposals.filter(p => 
        p.createdByUserId === currentUser.id || 
        p.counterpartyUserId === currentUser.id ||
        p.providerUserId === currentUser.id ||
        p.userId === currentUser.id
      );
    }
    
    // Fallback to legacy systems
    if (proposals.length === 0) {
      if (typeof window.SubmitProposalUseCase !== 'undefined') {
        proposals = window.SubmitProposalUseCase.getProposalsByUser(currentUser.id) || [];
      }
      
      if (proposals.length === 0 && typeof window.Storage !== 'undefined') {
        const state = window.Storage.loadState();
        proposals = (state.proposals || []).filter(p => 
          p.createdByUserId === currentUser.id || 
          p.counterpartyUserId === currentUser.id ||
          p.providerUserId === currentUser.id ||
          p.userId === currentUser.id
        );
      }
    }

    // Group proposals by pipeline column
    const columns = Object.keys(statusMapping);
    
    container.innerHTML = `
      <div class="kanban-board pipeline-kanban">
        ${columns.map(columnName => {
          const statuses = statusMapping[columnName];
          const columnProposals = proposals.filter(p => {
            const status = p.status || p.proposalStatus || 'SUBMITTED';
            return statuses.includes(status);
          });
          const count = columnProposals.length;
          const colorClass = columnColors[columnName] || 'secondary';
          
          return `
            <div class="kanban-column">
              <div class="kanban-column-header">
                <span class="badge badge-${colorClass}">${count}</span>
                <h3>${columnName}</h3>
              </div>
              <div class="proposals-list">
                ${count > 0 ? columnProposals.map(p => {
                  const opportunity = getOpportunityForProposal(p);
                  return `
                    <div class="proposal-card">
                      <div class="proposal-card-header">
                        <strong>${opportunity ? opportunity.title || `Opportunity ${p.opportunityId}` : `Proposal ${p.id}`}</strong>
                      </div>
                      <div class="proposal-card-body">
                        <p class="proposal-status">Status: ${p.status || p.proposalStatus || 'Unknown'}</p>
                        ${p.terms?.priceTotal ? `<p class="proposal-price">${p.terms.priceTotal} ${p.terms.currency || 'SAR'}</p>` : ''}
                        ${p.explainability?.whyMatch?.length ? `
                          <div class="explainability">
                            <strong>Match Reasons:</strong>
                            <ul>${p.explainability.whyMatch.map(r => `<li>${r}</li>`).join('')}</ul>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('') : '<p class="no-proposals">No proposals</p>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function getOpportunityForProposal(proposal) {
    if (!proposal.opportunityId) return null;
    
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
      return PMTwinData.Opportunities.getById(proposal.opportunityId);
    }
    
    if (typeof window.Storage !== 'undefined') {
      const state = window.Storage.loadState();
      return (state.opportunities || []).find(o => o.id === proposal.opportunityId);
    }
    
    return null;
  }

  window.PipelineView = { render };

})();
