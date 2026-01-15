/**
 * Contracts List Component
 * Displays contracts where current user is buyer or provider
 */

(function() {
  'use strict';

  let currentFilters = {
    status: null,
    contractType: null,
    scopeType: null
  };

  // ============================================
  // Initialize Component
  // ============================================
  function init() {
    renderFilters();
    loadContracts();
    attachEventListeners();
  }

  // ============================================
  // Render Filters
  // ============================================
  function renderFilters() {
    const container = document.getElementById('contractsFilters');
    if (!container) return;

    const html = `
      <div class="filters-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group">
          <label for="filterStatus" class="form-label">Status</label>
          <select id="filterStatus" class="form-control" onchange="contractsList.updateFilter('status', this.value)">
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="SIGNED">Signed</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filterContractType" class="form-label">Contract Type</label>
          <select id="filterContractType" class="form-control" onchange="contractsList.updateFilter('contractType', this.value)">
            <option value="">All</option>
            <option value="PROJECT_CONTRACT">Project Contract</option>
            <option value="SERVICE_CONTRACT">Service Contract</option>
            <option value="COLLABORATION_CONTRACT">Collaboration Contract</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filterScopeType" class="form-label">Scope Type</label>
          <select id="filterScopeType" class="form-control" onchange="contractsList.updateFilter('scopeType', this.value)">
            <option value="">All</option>
            <option value="OPPORTUNITY">Opportunity</option>
            <option value="PROJECT">Project</option>
            <option value="SERVICE">Service</option>
          </select>
        </div>
        
        <div class="form-group" style="display: flex; align-items: flex-end;">
          <button type="button" class="btn btn-secondary" onclick="contractsList.clearFilters()" style="width: 100%;">
            <i class="ph ph-x"></i> Clear Filters
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // ============================================
  // Load Contracts
  // ============================================
  function loadContracts() {
    const container = document.getElementById('contractsList');
    if (!container) return;

    if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
      container.innerHTML = '<p class="alert alert-error">Contracts service not available</p>';
      return;
    }

    // Get current user
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    const userId = currentUser?.id;
    
    if (!userId) {
      container.innerHTML = '<p class="alert alert-warning">Please log in to view your contracts</p>';
      return;
    }

    // Get all contracts
    let contracts = PMTwinData.Contracts.getAll();
    
    // Filter by user (buyer or provider)
    contracts = contracts.filter(contract => {
      const buyerId = contract.buyerPartyId || contract.buyerId;
      const providerId = contract.providerPartyId || contract.providerId;
      return buyerId === userId || providerId === userId;
    });

    // Apply filters
    if (currentFilters.status) {
      contracts = contracts.filter(c => c.status === currentFilters.status);
    }
    if (currentFilters.contractType) {
      contracts = contracts.filter(c => c.contractType === currentFilters.contractType);
    }
    if (currentFilters.scopeType) {
      contracts = contracts.filter(c => c.scopeType === currentFilters.scopeType);
    }

    if (contracts.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No contracts found${Object.values(currentFilters).some(f => f !== null) ? ' matching your filters' : ''}.</p>
            ${Object.values(currentFilters).some(f => f !== null) ? `
              <button type="button" class="btn btn-secondary" onclick="contractsList.clearFilters()" style="margin-top: 1rem;">
                Clear Filters
              </button>
            ` : ''}
          </div>
        </div>
      `;
      return;
    }

    // Render contracts
    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    contracts.forEach(contract => {
      const statusBadge = getStatusBadge(contract.status);
      const buyerId = contract.buyerPartyId || contract.buyerId;
      const providerId = contract.providerPartyId || contract.providerId;
      const isBuyer = buyerId === userId;
      const otherPartyId = isBuyer ? providerId : buyerId;
      
      // Get other party name
      const otherParty = PMTwinData.Users.getById(otherPartyId);
      const otherPartyName = otherParty?.name || otherParty?.companyName || `User ${otherPartyId}`;
      
      // Get opportunity/project title
      const opportunityId = contract.opportunityId || contract.scopeId;
      const opportunity = opportunityId ? PMTwinData.Opportunities?.getById(opportunityId) : null;
      const scopeTitle = opportunity?.title || contract.scopeTitle || 'N/A';
      
      const paymentMode = contract.paymentTerms?.mode || 'N/A';
      const totalValue = contract.paymentTerms?.totalValue || contract.servicesSchedule?.reduce((sum, s) => sum + (s.totalValue || 0), 0) || 0;
      
      html += `
        <div class="card enhanced-card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">${scopeTitle}</h3>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                  ${statusBadge}
                  <span class="badge badge-secondary">${contract.contractType || 'Contract'}</span>
                  <span class="badge badge-info">${isBuyer ? 'Buyer' : 'Provider'}</span>
                </div>
                <p style="margin: 0; color: var(--text-secondary);">
                  <strong>${isBuyer ? 'Provider' : 'Buyer'}:</strong> ${otherPartyName}
                  ${totalValue > 0 ? ` • <strong>${totalValue.toLocaleString()} SAR</strong>` : ''}
                  ${paymentMode !== 'N/A' ? ` • ${paymentMode}` : ''}
                </p>
              </div>
            </div>
            
            ${contract.startDate || contract.endDate ? `
              <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
                ${contract.startDate ? `<p style="margin: 0 0 0.5rem 0;"><strong>Start:</strong> ${new Date(contract.startDate).toLocaleDateString()}</p>` : ''}
                ${contract.endDate ? `<p style="margin: 0;"><strong>End:</strong> ${new Date(contract.endDate).toLocaleDateString()}</p>` : ''}
              </div>
            ` : ''}
            
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <a href="${getContractViewUrl(contract.id)}" class="btn btn-primary btn-sm">
                <i class="ph ph-eye"></i> View Details
              </a>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // ============================================
  // Helper: Get Status Badge
  // ============================================
  function getStatusBadge(status) {
    const badges = {
      'DRAFT': '<span class="badge badge-secondary"><i class="ph ph-file-dashed"></i> Draft</span>',
      'SENT': '<span class="badge badge-info"><i class="ph ph-paper-plane-tilt"></i> Sent</span>',
      'SIGNED': '<span class="badge badge-success"><i class="ph ph-check-circle"></i> Signed</span>',
      'ACTIVE': '<span class="badge badge-success"><i class="ph ph-play-circle"></i> Active</span>',
      'COMPLETED': '<span class="badge badge-primary"><i class="ph ph-check-circle"></i> Completed</span>',
      'TERMINATED': '<span class="badge badge-danger"><i class="ph ph-x-circle"></i> Terminated</span>'
    };
    return badges[status] || '<span class="badge badge-secondary">' + (status || 'Unknown') + '</span>';
  }

  // ============================================
  // Helper: Get Contract View URL
  // ============================================
  function getContractViewUrl(contractId) {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('contract-view', { id: contractId });
    }
    return `/POC/pages/contracts/view/index.html?id=${contractId}`;
  }

  // ============================================
  // Update Filter
  // ============================================
  function updateFilter(filterName, value) {
    if (value === '' || value === null) {
      currentFilters[filterName] = null;
    } else {
      currentFilters[filterName] = value;
    }
    loadContracts();
  }

  // ============================================
  // Clear Filters
  // ============================================
  function clearFilters() {
    currentFilters = {
      status: null,
      contractType: null,
      scopeType: null
    };
    renderFilters();
    loadContracts();
  }

  // ============================================
  // Attach Event Listeners
  // ============================================
  function attachEventListeners() {
    // Event listeners are attached via inline onclick handlers
  }

  // ============================================
  // Public API
  // ============================================
  window.contractsList = {
    init,
    updateFilter,
    clearFilters
  };
})();
