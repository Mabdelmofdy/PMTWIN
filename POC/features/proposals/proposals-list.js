/**
 * Proposals List Component - HTML triggers for ProposalService functions
 */

(function() {
  'use strict';

  let currentFilters = {};
  let currentTab = 'mySubmitted';

  function init(params) {
    // Check if user can view incoming proposals (Beneficiary)
    checkIncomingTabAccess();
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

  function checkIncomingTabAccess() {
    if (typeof PMTwinData === 'undefined') return;
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) return;
    
    const userRole = currentUser.role || currentUser.userType;
    const canViewIncoming = userRole === 'beneficiary' || userRole === 'entity' || userRole === 'project_lead';
    
    const incomingTabBtn = document.getElementById('incomingTabBtn');
    if (incomingTabBtn) {
      incomingTabBtn.style.display = canViewIncoming ? 'block' : 'none';
    }
  }

  function showTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Reload proposals for the selected tab
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

      let proposals = [];
      let result;
      
      // Try ProposalService first
      if (typeof ProposalService !== 'undefined') {
        if (currentTab === 'mySubmitted') {
          result = await ProposalService.getMyProposals();
        } else if (currentTab === 'incoming') {
          result = await ProposalService.getIncomingProposals();
        } else {
          result = await ProposalService.getProposals(currentFilters);
        }
        
        if (result.success && result.proposals) {
          proposals = result.proposals;
          
          // Update counts
          if (currentTab === 'mySubmitted') {
            const countEl = document.getElementById('mySubmittedCount');
            if (countEl) countEl.textContent = proposals.length;
          } else if (currentTab === 'incoming') {
            const countEl = document.getElementById('incomingCount');
            if (countEl) countEl.textContent = proposals.length;
          }
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

      const result = await ProposalService.updateProposalStatus(proposalId, 'REJECTED', null, reason);
      
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

  // Update proposal status
  async function updateStatus(proposalId, status) {
    try {
      if (typeof ProposalService === 'undefined') {
        alert('Proposal service not available');
        return;
      }

      const result = await ProposalService.updateProposalStatus(proposalId, status);
      
      if (result.success) {
        await loadProposals();
      } else {
        alert(result.error || 'Failed to update proposal status');
      }
    } catch (error) {
      console.error('Error updating proposal status:', error);
      alert('Error updating proposal status');
    }
  }

  // Award proposal
  async function awardProposal(proposalId) {
    if (!confirm('Are you sure you want to award this proposal? This will create a contract and engagement.')) {
      return;
    }

    try {
      if (typeof ProposalAwardService === 'undefined') {
        alert('Proposal award service not available');
        return;
      }

      const result = await ProposalAwardService.awardProposal(proposalId);
      
      if (result.success) {
        alert('Proposal awarded successfully! Contract and engagement created.');
        await loadProposals();
      } else {
        alert(result.error || 'Failed to award proposal');
      }
    } catch (error) {
      console.error('Error awarding proposal:', error);
      alert('Error awarding proposal');
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
      // Get target opportunity
      let target = null;
      if (proposal.targetType === 'PROJECT' || proposal.targetType === 'MEGA_PROJECT') {
        target = PMTwinData?.Projects.getById(proposal.targetId || proposal.projectId);
      } else if (proposal.targetType === 'SERVICE_REQUEST') {
        target = PMTwinData?.ServiceRequests.getById(proposal.targetId);
      }
      
      const provider = PMTwinData?.Users.getById(proposal.bidderCompanyId || proposal.providerId);
      const currentUser = PMTwinData?.Sessions.getCurrentUser();
      const isOwner = currentUser && proposal.ownerCompanyId === currentUser.id;
      const isBidder = currentUser && (proposal.bidderCompanyId || proposal.providerId) === currentUser.id;
      
      const statusColors = {
        'DRAFT': 'secondary',
        'SUBMITTED': 'info',
        'UNDER_REVIEW': 'warning',
        'SHORTLISTED': 'info',
        'NEGOTIATION': 'warning',
        'AWARDED': 'success',
        'REJECTED': 'error',
        'WITHDRAWN': 'secondary'
      };
      
      // Format dates
      const submittedDate = proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString() : 'N/A';
      const commentsCount = proposal.comments ? proposal.comments.length : 0;
      
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">${target?.title || proposal.targetType + ' ' + (proposal.targetId || proposal.projectId)}</h3>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                  <strong>Type:</strong> ${proposal.proposalType || proposal.type || 'N/A'} • 
                  <strong>Target:</strong> ${proposal.targetType || 'N/A'} • 
                  <strong>Total:</strong> ${proposal.total ? proposal.total.toLocaleString() + ' ' + (proposal.currency || 'SAR') : 'N/A'} • 
                  <strong>Submitted:</strong> ${submittedDate}
                </p>
                ${currentTab === 'incoming' && provider ? `<p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.85rem;">
                  <strong>Bidder:</strong> ${provider.profile?.name || provider.email || 'Unknown'}
                </p>` : ''}
              </div>
              <span class="badge badge-${statusColors[proposal.status] || 'secondary'}" style="margin-left: 1rem;">
                ${(proposal.status || 'unknown').replace('_', ' ')}
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
              ${currentTab === 'incoming' && isOwner ? `
                ${proposal.status === 'SUBMITTED' || proposal.status === 'UNDER_REVIEW' ? `
                  <button onclick="proposalsListComponent.updateStatus('${proposal.id}', 'SHORTLISTED')" class="btn btn-info btn-sm">
                    <i class="ph ph-star"></i> Shortlist
                  </button>
                ` : ''}
                ${proposal.status === 'SHORTLISTED' ? `
                  <button onclick="proposalsListComponent.updateStatus('${proposal.id}', 'NEGOTIATION')" class="btn btn-warning btn-sm">
                    <i class="ph ph-handshake"></i> Negotiate
                  </button>
                  <button onclick="proposalsListComponent.awardProposal('${proposal.id}')" class="btn btn-success btn-sm">
                    <i class="ph ph-trophy"></i> Award
                  </button>
                ` : ''}
                ${proposal.status === 'NEGOTIATION' ? `
                  <button onclick="proposalsListComponent.awardProposal('${proposal.id}')" class="btn btn-success btn-sm">
                    <i class="ph ph-trophy"></i> Award
                  </button>
                ` : ''}
                ${['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'NEGOTIATION'].includes(proposal.status) ? `
                  <button onclick="proposalsListComponent.updateStatus('${proposal.id}', 'REJECTED')" class="btn btn-danger btn-sm">
                    <i class="ph ph-x"></i> Reject
                  </button>
                ` : ''}
              ` : currentTab === 'mySubmitted' && isBidder ? `
                ${['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status) ? `
                  <button onclick="proposalsListComponent.updateStatus('${proposal.id}', 'WITHDRAWN')" class="btn btn-secondary btn-sm">
                    <i class="ph ph-arrow-arc-left"></i> Withdraw
                  </button>
                ` : ''}
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
    showTab,
    loadProposals,
    applyFilters,
    clearFilters,
    toggleAdvancedFilters,
    approveProposal,
    rejectProposal,
    updateStatus,
    awardProposal,
    viewProposal,
    renderProposals
  };

  // Global reference for onclick handlers
  window.proposalsListComponent = window.proposals['proposals-list'];

})();

