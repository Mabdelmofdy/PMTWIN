/**
 * Admin Models Management Component
 * Handles collaboration models management UI for admin portal
 */

(function() {
  'use strict';

  let currentFilters = {};
  let currentModel = 'all';

  function init(params) {
    loadModelsOverview();
    setupEventListeners();
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

    // Filter form
    const filterForm = document.getElementById('modelsFilterForm');
    if (filterForm) {
      filterForm.addEventListener('submit', applyFilters);
    }

    // Clear filters button
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearFilters);
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
      container.innerHTML = '<p>Loading opportunities...</p>';

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
        renderOpportunities(container, result.opportunities);
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
      container.innerHTML = '<p class="alert alert-info">No opportunities found</p>';
      return;
    }

    let html = `
      <div style="overflow-x: auto;">
        <table class="table" style="width: 100%;">
          <thead>
            <tr>
              <th>Model</th>
              <th>Title</th>
              <th>Creator</th>
              <th>Status</th>
              <th>Applications</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    opportunities.forEach(opp => {
      const modelName = opp.modelName || opp.modelId || 'Unknown';
      const creator = PMTwinData.Users.getById(opp.creatorId);
      const creatorName = creator?.profile?.name || creator?.email || 'Unknown';
      
      html += `
        <tr>
          <td><span class="badge badge-info">${modelName}</span></td>
          <td>${opp.title || 'Untitled'}</td>
          <td>${creatorName}</td>
          <td><span class="badge badge-${getStatusColor(opp.status)}">${opp.status || 'draft'}</span></td>
          <td>${opp.applicationsReceived || 0}</td>
          <td>${new Date(opp.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="viewOpportunityDetails('${opp.id}')">View</button>
            ${opp.status === 'pending' ? `
              <button class="btn btn-sm btn-success" onclick="approveOpportunity('${opp.id}')">Approve</button>
              <button class="btn btn-sm btn-error" onclick="rejectOpportunity('${opp.id}')">Reject</button>
            ` : ''}
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  async function applyFilters(event) {
    event.preventDefault();
    
    const filters = {};
    
    const status = document.getElementById('statusFilter')?.value;
    if (status) filters.status = status;
    
    const dateFrom = document.getElementById('dateFromFilter')?.value;
    if (dateFrom) filters.dateFrom = dateFrom;
    
    const dateTo = document.getElementById('dateToFilter')?.value;
    if (dateTo) filters.dateTo = dateTo;
    
    currentFilters = filters;
    await loadOpportunities();
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('modelsFilterForm')?.reset();
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
    exportOpportunities
  };

})();

