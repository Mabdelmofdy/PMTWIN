/**
 * Proposals List Component - HTML triggers for ProposalService functions
 */

(function() {
  'use strict';

  let currentFilters = {};

  function init(params) {
    loadProposals();
  }

  // ============================================
  // HTML Triggers for ProposalService Functions
  // ============================================

  // Trigger: getProposals(filters) - Load proposals
  async function loadProposals() {
    const container = document.getElementById('proposalsList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading proposals...</p>';

      let result;
      if (typeof ProposalService !== 'undefined') {
        result = await ProposalService.getProposals(currentFilters);
      } else {
        container.innerHTML = '<p class="alert alert-error">Proposal service not available</p>';
        return;
      }

      if (result.success && result.proposals) {
        renderProposals(container, result.proposals);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load proposals'}</p>`;
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading proposals. Please try again.</p>';
    }
  }

  // Trigger: getProposals(filters) - Apply filters
  async function applyFilters(event) {
    event.preventDefault();
    
    const filters = {};
    
    const status = document.getElementById('proposalStatusFilter')?.value;
    if (status) filters.status = status;
    
    const projectId = document.getElementById('proposalProjectFilter')?.value;
    if (projectId) filters.projectId = projectId;
    
    currentFilters = filters;
    await loadProposals();
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('proposalFiltersForm')?.reset();
    loadProposals();
  }

  // Trigger: updateProposalStatus(proposalId, status, reason) - Approve proposal
  async function approveProposal(proposalId) {
    if (!confirm('Are you sure you want to approve this proposal?')) {
      return;
    }

    try {
      if (typeof ProposalService === 'undefined') {
        alert('Proposal service not available');
        return;
      }

      const result = await ProposalService.updateProposalStatus(proposalId, 'approved');
      
      if (result.success) {
        alert('Proposal approved successfully');
        await loadProposals();
      } else {
        alert(result.error || 'Failed to approve proposal');
      }
    } catch (error) {
      console.error('Error approving proposal:', error);
      alert('Error approving proposal');
    }
  }

  // Trigger: updateProposalStatus(proposalId, status, reason) - Reject proposal
  async function rejectProposal(proposalId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return; // User cancelled

    try {
      if (typeof ProposalService === 'undefined') {
        alert('Proposal service not available');
        return;
      }

      const result = await ProposalService.updateProposalStatus(proposalId, 'rejected', reason);
      
      if (result.success) {
        alert('Proposal rejected');
        await loadProposals();
      } else {
        alert(result.error || 'Failed to reject proposal');
      }
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      alert('Error rejecting proposal');
    }
  }

  // ============================================
  // Rendering Functions
  // ============================================

  function renderProposals(container, proposals) {
    if (proposals.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No proposals found.</p>
            <a href="../create-proposal/" class="btn btn-primary" style="margin-top: 1rem;">Create Your First Proposal</a>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    proposals.forEach(proposal => {
      const project = PMTwinData?.Projects.getById(proposal.projectId);
      const statusColors = {
        'approved': 'success',
        'rejected': 'error',
        'in_review': 'warning',
        'completed': 'info'
      };
      
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div>
                <h3 style="margin: 0 0 0.5rem 0;">${project?.title || 'Project ' + proposal.projectId}</h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  Type: ${proposal.type || 'N/A'} • Total: ${proposal.total ? proposal.total.toLocaleString() + ' ' + (proposal.currency || 'SAR') : 'N/A'}
                </p>
              </div>
              <span class="badge badge-${statusColors[proposal.status] || 'secondary'}">
                ${proposal.status || 'unknown'}
              </span>
            </div>
            
            <p style="margin-bottom: 1rem;">${(proposal.serviceDescription || '').substring(0, 200)}...</p>
            
            <div style="display: flex; gap: 1rem;">
              <button onclick="proposalsListComponent.viewProposal('${proposal.id}')" class="btn btn-primary btn-sm">
                View Details
              </button>
              ${proposal.status === 'in_review' ? `
                <button onclick="proposalsListComponent.approveProposal('${proposal.id}')" class="btn btn-success btn-sm">
                  Approve
                </button>
                <button onclick="proposalsListComponent.rejectProposal('${proposal.id}')" class="btn btn-danger btn-sm">
                  Reject
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  function viewProposal(proposalId) {
    // Navigate to proposal view page
    window.location.href = `../proposals/?id=${proposalId}`;
  }

  // Export
  if (!window.proposals) window.proposals = {};
  window.proposals['proposals-list'] = {
    init,
    loadProposals,
    applyFilters,
    clearFilters,
    approveProposal,
    rejectProposal,
    viewProposal
  };

  // Global reference for onclick handlers
  window.proposalsListComponent = window.proposals['proposals-list'];

})();

