/**
 * Proposals List Component - HTML triggers for ProposalService functions
 */

(function() {
  'use strict';

  let currentFilters = {};

  function init(params) {
    loadProposals();
    
    // Add search input listener for real-time filtering
    const searchInput = document.getElementById('proposalSearch');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          applyFilters();
        }, 300); // Debounce search
      });
    }
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

      let proposals = [];
      
      // Try ProposalService first
      if (typeof ProposalService !== 'undefined') {
        const result = await ProposalService.getProposals(currentFilters);
        if (result.success && result.proposals) {
          proposals = result.proposals;
        } else {
          container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load proposals'}</p>`;
          return;
        }
      } else if (typeof PMTwinData !== 'undefined') {
        // Fallback to direct data access
        const currentUser = PMTwinData.Sessions.getCurrentUser();
        if (!currentUser) {
          container.innerHTML = '<p class="alert alert-error">User not authenticated</p>';
          return;
        }
        
        // Get proposals based on user role and filters
        if (currentUser.role === 'admin') {
          proposals = PMTwinData.Proposals.getAll();
        } else {
          // Get proposals for user's projects or user's proposals
          const userProjects = PMTwinData.Projects.getByCreator(currentUser.id);
          const projectIds = userProjects.map(p => p.id);
          proposals = PMTwinData.Proposals.getAll().filter(p => 
            projectIds.includes(p.projectId) || p.providerId === currentUser.id
          );
        }
        
        // Apply filters
        if (currentFilters.status) {
          proposals = proposals.filter(p => p.status === currentFilters.status);
        }
        if (currentFilters.category) {
          proposals = proposals.filter(p => p.type === currentFilters.category);
        }
        if (currentFilters.projectId) {
          proposals = proposals.filter(p => p.projectId === currentFilters.projectId);
        }
        if (currentFilters.search) {
          const searchTerm = currentFilters.search.toLowerCase();
          proposals = proposals.filter(p => {
            const project = PMTwinData?.Projects.getById(p.projectId);
            const title = (project?.title || '').toLowerCase();
            const description = (p.serviceDescription || '').toLowerCase();
            return title.includes(searchTerm) || description.includes(searchTerm);
          });
        }
        if (currentFilters.dateFrom) {
          proposals = proposals.filter(p => {
            if (!p.submittedAt) return false;
            const submittedDate = new Date(p.submittedAt);
            const fromDate = new Date(currentFilters.dateFrom);
            return submittedDate >= fromDate;
          });
        }
        if (currentFilters.dateTo) {
          proposals = proposals.filter(p => {
            if (!p.submittedAt) return false;
            const submittedDate = new Date(p.submittedAt);
            const toDate = new Date(currentFilters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of day
            return submittedDate <= toDate;
          });
        }
      } else {
        container.innerHTML = '<p class="alert alert-error">Data service not available. Please refresh the page.</p>';
        return;
      }

      renderProposals(container, proposals);
    } catch (error) {
      console.error('Error loading proposals:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading proposals. Please try again.</p>';
    }
  }

  // Trigger: getProposals(filters) - Apply filters
  async function applyFilters(event) {
    if (event) event.preventDefault();
    
    const filters = {};
    
    const status = document.getElementById('proposalStatusFilter')?.value;
    if (status) filters.status = status;
    
    const category = document.getElementById('proposalCategoryFilter')?.value;
    if (category) filters.category = category;
    
    const search = document.getElementById('proposalSearch')?.value;
    if (search) filters.search = search;
    
    const projectId = document.getElementById('proposalProjectFilter')?.value;
    if (projectId) filters.projectId = projectId;
    
    const dateFrom = document.getElementById('proposalDateFromFilter')?.value;
    if (dateFrom) filters.dateFrom = dateFrom;
    
    const dateTo = document.getElementById('proposalDateToFilter')?.value;
    if (dateTo) filters.dateTo = dateTo;
    
    currentFilters = filters;
    await loadProposals();
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('proposalFiltersForm')?.reset();
    const advancedFilters = document.getElementById('advancedFilters');
    if (advancedFilters) {
      advancedFilters.style.display = 'none';
    }
    loadProposals();
  }

  function toggleAdvancedFilters() {
    const advancedFilters = document.getElementById('advancedFilters');
    if (advancedFilters) {
      const isVisible = advancedFilters.style.display !== 'none';
      advancedFilters.style.display = isVisible ? 'none' : 'block';
    }
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
            <p style="margin-bottom: 1rem;">You haven't created any proposals yet.</p>
            <a href="create/" class="btn btn-primary">Create Your First Proposal</a>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    proposals.forEach(proposal => {
      const project = PMTwinData?.Projects.getById(proposal.projectId);
      const provider = PMTwinData?.Users.getById(proposal.providerId);
      const statusColors = {
        'approved': 'success',
        'rejected': 'error',
        'in_review': 'warning',
        'completed': 'info'
      };
      
      // Format dates
      const submittedDate = proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString() : 'N/A';
      const commentsCount = proposal.comments ? proposal.comments.length : 0;
      
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">${project?.title || 'Project ' + proposal.projectId}</h3>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                  <strong>Type:</strong> ${proposal.type || 'N/A'} • 
                  <strong>Total:</strong> ${proposal.total ? proposal.total.toLocaleString() + ' ' + (proposal.currency || 'SAR') : 'N/A'} • 
                  <strong>Submitted:</strong> ${submittedDate}
                </p>
                ${provider ? `<p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.85rem;">
                  <strong>Provider:</strong> ${provider.profile?.name || provider.email || 'Unknown'}
                </p>` : ''}
              </div>
              <span class="badge badge-${statusColors[proposal.status] || 'secondary'}" style="margin-left: 1rem;">
                ${(proposal.status || 'unknown').replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <p style="margin-bottom: 1rem; color: var(--text-primary);">
              ${(proposal.serviceDescription || 'No description available').substring(0, 200)}${(proposal.serviceDescription || '').length > 200 ? '...' : ''}
            </p>
            
            ${commentsCount > 0 ? `
              <div style="background: var(--bg-secondary, #f5f5f5); padding: 0.75rem; border-radius: var(--radius, 4px); margin-bottom: 1rem;">
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">
                  <i class="ph ph-chat-circle"></i> <strong>${commentsCount}</strong> comment${commentsCount !== 1 ? 's' : ''}
                </p>
                ${proposal.comments && proposal.comments.length > 0 ? `
                  <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color, #e0e0e0);">
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                      <strong>${proposal.comments[proposal.comments.length - 1].addedByName || 'User'}:</strong> 
                      "${(proposal.comments[proposal.comments.length - 1].comment || '').substring(0, 100)}${(proposal.comments[proposal.comments.length - 1].comment || '').length > 100 ? '...' : ''}"
                    </div>
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            ${proposal.rejectionReason ? `
              <div style="background: #fee; padding: 0.75rem; border-radius: var(--radius, 4px); margin-bottom: 1rem; border-left: 3px solid var(--color-danger, #dc3545);">
                <p style="margin: 0; font-size: 0.9rem; color: var(--color-danger, #dc3545);">
                  <strong>Rejection Reason:</strong> ${proposal.rejectionReason}
                </p>
              </div>
            ` : ''}
            
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <button onclick="proposalsListComponent.viewProposal('${proposal.id}')" class="btn btn-primary btn-sm">
                <i class="ph ph-eye"></i> View Details
              </button>
              ${proposal.status === 'in_review' && (typeof PMTwinData !== 'undefined' && PMTwinData.Sessions.getCurrentUser()?.id === project?.creatorId) ? `
                <button onclick="proposalsListComponent.approveProposal('${proposal.id}')" class="btn btn-success btn-sm">
                  <i class="ph ph-check"></i> Approve
                </button>
                <button onclick="proposalsListComponent.rejectProposal('${proposal.id}')" class="btn btn-danger btn-sm">
                  <i class="ph ph-x"></i> Reject
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
    toggleAdvancedFilters,
    approveProposal,
    rejectProposal,
    viewProposal
  };

  // Global reference for onclick handlers
  window.proposalsListComponent = window.proposals['proposals-list'];

})();

