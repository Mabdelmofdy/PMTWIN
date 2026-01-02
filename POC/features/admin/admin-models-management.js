/**
 * Admin Models Management Component
 * Handles collaboration models management UI for admin portal
 */

(function() {
  'use strict';

  let currentFilters = {};
  let currentModel = 'all';

  function init(params) {
    currentFilters = {};
    currentModel = 'all';
    loadModelsOverview();
    setupEventListeners();
    loadOpportunities();
  }

  function setupEventListeners() {
    // Model selector
    const modelSelector = document.getElementById('modelSelector');
    if (modelSelector) {
      modelSelector.addEventListener('change', function(e) {
        currentModel = e.target.value;
        loadOpportunities();
      });
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', function() {
        applyFilters();
      });
    }

    // Search input with debounce
    const searchInput = document.getElementById('modelSearch');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Clear filters button
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearFilters);
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm.length >= 2) {
      currentFilters.search = searchTerm;
    } else {
      delete currentFilters.search;
    }
    
    loadOpportunities();
  }

  function toggleAdvancedFilters() {
    const advancedFilters = document.getElementById('advancedFilters');
    if (advancedFilters) {
      const isVisible = advancedFilters.style.display !== 'none';
      advancedFilters.style.display = isVisible ? 'none' : 'block';
    }
  }

  async function loadModelsOverview() {
    const container = document.getElementById('modelsOverview');
    if (!container) return;

    try {
      if (typeof ModelsManagementService === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Models management service not available</p>';
        return;
      }

      // Load statistics for all models
      const statsResult = await ModelsManagementService.getModelStatistics();
      
      if (statsResult.success) {
        renderModelsOverview(container, statsResult.statistics);
      } else {
        container.innerHTML = `<p class="alert alert-error">${statsResult.error || 'Failed to load statistics'}</p>`;
      }
    } catch (error) {
      console.error('Error loading models overview:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading models overview</p>';
    }
  }

  function renderModelsOverview(container, stats) {
    const modelCategories = {
      '1': { name: 'Project-Based Collaboration', subModels: ['1.1', '1.2', '1.3', '1.4'] },
      '2': { name: 'Strategic Partnerships', subModels: ['2.1', '2.2', '2.3'] },
      '3': { name: 'Resource Pooling & Sharing', subModels: ['3.1', '3.2', '3.3'] },
      '4': { name: 'Hiring a Resource', subModels: ['4.1', '4.2'] },
      '5': { name: 'Call for Competition', subModels: ['5.1'] }
    };

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">';
    
    Object.entries(modelCategories).forEach(([categoryId, category]) => {
      const categoryStats = {
        total: 0,
        active: 0,
        byModel: {}
      };
      
      category.subModels.forEach(modelId => {
        const modelStats = stats.byModel[modelId] || 0;
        categoryStats.total += modelStats;
        categoryStats.byModel[modelId] = modelStats;
      });
      
      html += `
        <div class="card" style="cursor: pointer;" onclick="loadModelCategory('${categoryId}')">
          <div class="card-body">
            <h3 style="margin: 0 0 0.5rem 0;">${category.name}</h3>
            <p style="margin: 0 0 1rem 0; color: var(--text-secondary);">${category.subModels.length} sub-models</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 2rem; font-weight: bold; color: var(--color-primary);">${categoryStats.total}</span>
              <span style="color: var(--text-secondary);">Total Opportunities</span>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  async function loadOpportunities() {
    const container = document.getElementById('opportunitiesList');
    if (!container) return;

    try {
      container.innerHTML = '<p style="text-align: center; padding: 2rem;"><i class="ph ph-spinner ph-spin"></i> Loading opportunities...</p>';

      if (typeof ModelsManagementService === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Models management service not available</p>';
        return;
      }

      let result;
      if (currentModel === 'all') {
        result = await ModelsManagementService.getAllOpportunities(currentFilters);
      } else {
        result = await ModelsManagementService.getOpportunitiesByModel(currentModel, currentFilters);
      }

      if (result.success && result.opportunities) {
        // Apply search filter if present
        let filteredOpportunities = result.opportunities;
        if (currentFilters.search) {
          const searchTerm = currentFilters.search.toLowerCase();
          filteredOpportunities = result.opportunities.filter(opp => {
            const title = (opp.title || '').toLowerCase();
            const creator = PMTwinData?.Users?.getById(opp.creatorId);
            const creatorName = (creator?.profile?.name || creator?.email || '').toLowerCase();
            return title.includes(searchTerm) || creatorName.includes(searchTerm);
          });
        }
        
        renderOpportunities(container, filteredOpportunities);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load opportunities'}</p>`;
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading opportunities</p>';
    }
  }

  function renderOpportunities(container, opportunities) {
    if (opportunities.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p style="color: var(--text-secondary);">No opportunities found.</p>
            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-top: 0.5rem;">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        </div>
      `;
      return;
    }

    // Group opportunities by status
    const grouped = {
      pending: opportunities.filter(opp => opp.status === 'pending'),
      active: opportunities.filter(opp => opp.status === 'active'),
      draft: opportunities.filter(opp => opp.status === 'draft'),
      closed: opportunities.filter(opp => opp.status === 'closed'),
      rejected: opportunities.filter(opp => opp.status === 'rejected'),
      other: opportunities.filter(opp => !['pending', 'active', 'draft', 'closed', 'rejected'].includes(opp.status))
    };

    let html = '';

    // Render Pending section
    if (grouped.pending.length > 0) {
      html += `
        <div style="margin-bottom: 2rem;">
          <h3 style="margin-bottom: 1rem; color: var(--text-primary); font-size: var(--font-size-lg);">
            <span class="badge badge-warning" style="margin-right: 0.5rem;">${grouped.pending.length}</span>
            Pending Review
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1rem;">
            ${grouped.pending.map(opp => renderOpportunityCard(opp)).join('')}
          </div>
        </div>
      `;
    }

    // Render Active section
    if (grouped.active.length > 0) {
      html += `
        <div style="margin-bottom: 2rem;">
          <h3 style="margin-bottom: 1rem; color: var(--text-primary); font-size: var(--font-size-lg);">
            <span class="badge badge-success" style="margin-right: 0.5rem;">${grouped.active.length}</span>
            Active
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1rem;">
            ${grouped.active.map(opp => renderOpportunityCard(opp)).join('')}
          </div>
        </div>
      `;
    }

    // Render Draft section
    if (grouped.draft.length > 0) {
      html += `
        <div style="margin-bottom: 2rem;">
          <h3 style="margin-bottom: 1rem; color: var(--text-primary); font-size: var(--font-size-lg);">
            <span class="badge badge-secondary" style="margin-right: 0.5rem;">${grouped.draft.length}</span>
            Draft
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1rem;">
            ${grouped.draft.map(opp => renderOpportunityCard(opp)).join('')}
          </div>
        </div>
      `;
    }

    // Render Closed section
    if (grouped.closed.length > 0) {
      html += `
        <div style="margin-bottom: 2rem;">
          <h3 style="margin-bottom: 1rem; color: var(--text-primary); font-size: var(--font-size-lg);">
            <span class="badge badge-info" style="margin-right: 0.5rem;">${grouped.closed.length}</span>
            Closed
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1rem;">
            ${grouped.closed.map(opp => renderOpportunityCard(opp)).join('')}
          </div>
        </div>
      `;
    }

    // Render Rejected section
    if (grouped.rejected.length > 0) {
      html += `
        <div style="margin-bottom: 2rem;">
          <h3 style="margin-bottom: 1rem; color: var(--text-primary); font-size: var(--font-size-lg);">
            <span class="badge badge-error" style="margin-right: 0.5rem;">${grouped.rejected.length}</span>
            Rejected
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1rem;">
            ${grouped.rejected.map(opp => renderOpportunityCard(opp)).join('')}
          </div>
        </div>
      `;
    }

    // Render Other statuses
    if (grouped.other.length > 0) {
      html += `
        <div style="margin-bottom: 2rem;">
          <h3 style="margin-bottom: 1rem; color: var(--text-primary); font-size: var(--font-size-lg);">
            Other
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1rem;">
            ${grouped.other.map(opp => renderOpportunityCard(opp)).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function renderOpportunityCard(opp) {
    const modelName = opp.modelName || opp.modelId || 'Unknown';
    const creator = typeof PMTwinData !== 'undefined' ? PMTwinData.Users.getById(opp.creatorId) : null;
    const creatorName = creator?.profile?.name || creator?.email || 'Unknown';
    const createdAt = opp.createdAt ? new Date(opp.createdAt) : new Date();
    const createdDate = createdAt.toLocaleDateString();
    const createdTime = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const applicationsCount = opp.applicationsReceived || 0;
    const status = opp.status || 'draft';

    return `
      <div class="card" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" 
           onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
           onmouseout="this.style.transform=''; this.style.boxShadow=''"
           onclick="viewOpportunityDetails('${opp.id}')">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 0.5rem 0; font-size: var(--font-size-lg); color: var(--text-primary);">
                ${escapeHtml(opp.title || 'Untitled')}
              </h4>
              <span class="badge badge-${getStatusColor(status)}" style="text-transform: uppercase; font-size: var(--font-size-xs);">
                ${status}
              </span>
            </div>
            <span class="badge badge-info" style="margin-left: 0.5rem;">${modelName}</span>
          </div>
          
          <div style="margin-bottom: 0.75rem; color: var(--text-secondary); font-size: var(--font-size-sm);">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <i class="ph ph-user"></i>
              <span>${escapeHtml(creatorName)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <i class="ph ph-calendar"></i>
              <span>${createdDate} at ${createdTime}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i class="ph ph-handshake"></i>
              <span>${applicationsCount} application${applicationsCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          ${opp.description ? `
            <p style="margin: 0.75rem 0 0 0; color: var(--text-secondary); font-size: var(--font-size-sm); 
                      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${escapeHtml(opp.description)}
            </p>
          ` : ''}

          <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); 
                      display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewOpportunityDetails('${opp.id}')">
              <i class="ph ph-eye"></i> View
            </button>
            ${status === 'pending' ? `
              <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); approveOpportunity('${opp.id}')">
                <i class="ph ph-check"></i> Approve
              </button>
              <button class="btn btn-sm btn-error" onclick="event.stopPropagation(); rejectOpportunity('${opp.id}')">
                <i class="ph ph-x"></i> Reject
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function applyFilters(event) {
    if (event) event.preventDefault();
    
    const filters = {};
    
    const status = document.getElementById('statusFilter')?.value;
    if (status) filters.status = status;
    
    const dateFrom = document.getElementById('dateFromFilter')?.value;
    if (dateFrom) filters.dateFrom = dateFrom;
    
    const dateTo = document.getElementById('dateToFilter')?.value;
    if (dateTo) filters.dateTo = dateTo;
    
    // Keep search filter if it exists
    if (currentFilters.search) {
      filters.search = currentFilters.search;
    }
    
    currentFilters = filters;
    await loadOpportunities();
  }

  function clearFilters() {
    currentFilters = {};
    currentModel = 'all';
    const form = document.getElementById('modelsFilterForm');
    if (form) {
      form.reset();
      const modelSelector = document.getElementById('modelSelector');
      if (modelSelector) modelSelector.value = 'all';
      const searchInput = document.getElementById('modelSearch');
      if (searchInput) searchInput.value = '';
    }
    // Hide advanced filters
    const advancedFilters = document.getElementById('advancedFilters');
    if (advancedFilters) {
      advancedFilters.style.display = 'none';
    }
    loadOpportunities();
  }

  async function viewOpportunityDetails(opportunityId) {
    if (typeof ModelsManagementService === 'undefined') {
      alert('Models management service not available');
      return;
    }

    try {
      const result = await ModelsManagementService.getOpportunityById(opportunityId);
      
      if (result.success) {
        showOpportunityModal(result.opportunity, result.applications);
      } else {
        alert(result.error || 'Failed to load opportunity details');
      }
    } catch (error) {
      console.error('Error loading opportunity:', error);
      alert('Error loading opportunity details');
    }
  }

  function showOpportunityModal(opportunity, applications) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop show';
    modal.innerHTML = `
      <div class="modal show" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h2 class="modal-title">Opportunity Details</h2>
          <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <h3>${opportunity.title || 'Untitled'}</h3>
          <p><strong>Model:</strong> ${opportunity.modelName || opportunity.modelId || 'Unknown'}</p>
          <p><strong>Status:</strong> <span class="badge badge-${getStatusColor(opportunity.status)}">${opportunity.status}</span></p>
          <p><strong>Creator:</strong> ${PMTwinData.Users.getById(opportunity.creatorId)?.profile?.name || 'Unknown'}</p>
          <p><strong>Description:</strong> ${opportunity.description || 'No description'}</p>
          <h4 style="margin-top: 1.5rem;">Applications (${applications.length})</h4>
          ${applications.length > 0 ? renderApplicationsList(applications) : '<p>No applications yet</p>'}
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-backdrop').remove()">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  function renderApplicationsList(applications) {
    let html = '<div style="display: grid; gap: 1rem;">';
    
    applications.forEach(app => {
      const applicant = PMTwinData.Users.getById(app.applicantId);
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <strong>${applicant?.profile?.name || applicant?.email || 'Unknown'}</strong>
                <p style="margin: 0.5rem 0; color: var(--text-secondary);">${app.applicationData?.proposal || 'No proposal text'}</p>
                <span class="badge badge-${getStatusColor(app.status)}">${app.status}</span>
              </div>
              <span style="color: var(--text-secondary); font-size: 0.9rem;">
                ${new Date(app.submittedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  async function approveOpportunity(opportunityId) {
    if (!confirm('Are you sure you want to approve this opportunity?')) return;

    try {
      if (typeof ModelsManagementService === 'undefined') {
        alert('Models management service not available');
        return;
      }

      const result = await ModelsManagementService.approveOpportunity(opportunityId);
      
      if (result.success) {
        alert('Opportunity approved successfully');
        loadOpportunities();
      } else {
        alert(result.error || 'Failed to approve opportunity');
      }
    } catch (error) {
      console.error('Error approving opportunity:', error);
      alert('Error approving opportunity');
    }
  }

  async function rejectOpportunity(opportunityId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      if (typeof ModelsManagementService === 'undefined') {
        alert('Models management service not available');
        return;
      }

      const result = await ModelsManagementService.rejectOpportunity(opportunityId, reason);
      
      if (result.success) {
        alert('Opportunity rejected successfully');
        loadOpportunities();
      } else {
        alert(result.error || 'Failed to reject opportunity');
      }
    } catch (error) {
      console.error('Error rejecting opportunity:', error);
      alert('Error rejecting opportunity');
    }
  }

  async function exportOpportunities() {
    try {
      if (typeof ModelsManagementService === 'undefined') {
        alert('Models management service not available');
        return;
      }

      const result = await ModelsManagementService.exportOpportunities(currentFilters, 'csv');
      
      if (result.success) {
        // Download CSV
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `collaboration_opportunities_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert(result.error || 'Failed to export opportunities');
      }
    } catch (error) {
      console.error('Error exporting opportunities:', error);
      alert('Error exporting opportunities');
    }
  }

  function getStatusColor(status) {
    const colors = {
      'active': 'success',
      'pending': 'warning',
      'draft': 'secondary',
      'closed': 'info',
      'rejected': 'error',
      'cancelled': 'secondary'
    };
    return colors[status] || 'secondary';
  }

  function loadModelCategory(categoryId) {
    // Load opportunities for specific category
    const categoryModels = {
      '1': ['1.1', '1.2', '1.3', '1.4'],
      '2': ['2.1', '2.2', '2.3'],
      '3': ['3.1', '3.2', '3.3'],
      '4': ['4.1', '4.2'],
      '5': ['5.1']
    };
    
    // For now, show all opportunities and filter by first model
    if (categoryModels[categoryId]) {
      currentModel = categoryModels[categoryId][0];
      const selector = document.getElementById('modelSelector');
      if (selector) selector.value = currentModel;
      loadOpportunities();
    }
  }

  // Export functions to window for onclick handlers
  window.viewOpportunityDetails = viewOpportunityDetails;
  window.approveOpportunity = approveOpportunity;
  window.rejectOpportunity = rejectOpportunity;
  window.loadModelCategory = loadModelCategory;
  window.exportOpportunities = exportOpportunities;

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-models-management'] = { 
    init,
    exportOpportunities,
    toggleAdvancedFilters,
    clearFilters,
    applyFilters
  };

})();

