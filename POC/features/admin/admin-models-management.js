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
      '1': { name: 'Project-Based Collaboration', subModels: ['1.1', '1.2', '1.3', '1.4'], icon: 'ph-folder', color: 'primary' },
      '2': { name: 'Strategic Partnerships', subModels: ['2.1', '2.2', '2.3'], icon: 'ph-handshake', color: 'info' },
      '3': { name: 'Resource Pooling & Sharing', subModels: ['3.1', '3.2', '3.3'], icon: 'ph-stack', color: 'secondary' },
      '4': { name: 'Hiring a Resource', subModels: ['4.1', '4.2'], icon: 'ph-user-plus', color: 'success' },
      '5': { name: 'Call for Competition', subModels: ['5.1'], icon: 'ph-trophy', color: 'warning' }
    };

    const modelLabels = {
      '1.1': 'Task-Based Engagement',
      '1.2': 'Consortium',
      '1.3': 'Joint Venture',
      '1.4': 'SPV',
      '2.1': 'Strategic JV',
      '2.2': 'Strategic Alliance',
      '2.3': 'Mentorship',
      '3.1': 'Bulk Purchasing',
      '3.2': 'Co-Ownership',
      '3.3': 'Resource Exchange',
      '4.1': 'Professional Hiring',
      '4.2': 'Consultant Hiring',
      '5.1': 'Competition/RFP'
    };

    // Calculate overall stats
    const totalOpportunities = stats.total || 0;
    const activeOpportunities = stats.byStatus?.active || 0;
    const pendingOpportunities = stats.byStatus?.pending || 0;
    const totalApplications = stats.totalApplications || 0;

    let html = `
      <div style="margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem;">Overall Statistics</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div class="card" style="text-align: center; padding: 1.5rem;">
            <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-primary);">${totalOpportunities}</h3>
            <p style="margin: 0; color: var(--text-secondary);">Total Opportunities</p>
          </div>
          <div class="card" style="text-align: center; padding: 1.5rem;">
            <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-success);">${activeOpportunities}</h3>
            <p style="margin: 0; color: var(--text-secondary);">Active</p>
          </div>
          <div class="card" style="text-align: center; padding: 1.5rem;">
            <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-warning);">${pendingOpportunities}</h3>
            <p style="margin: 0; color: var(--text-secondary);">Pending Review</p>
          </div>
          <div class="card" style="text-align: center; padding: 1.5rem;">
            <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-info);">${totalApplications}</h3>
            <p style="margin: 0; color: var(--text-secondary);">Total Applications</p>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem;">Model Categories</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
    `;
    
    Object.entries(modelCategories).forEach(([categoryId, category]) => {
      const categoryStats = {
        total: 0,
        active: 0,
        pending: 0,
        closed: 0,
        byModel: {}
      };
      
      category.subModels.forEach(modelId => {
        const modelCount = stats.byModel[modelId] || 0;
        categoryStats.total += modelCount;
        categoryStats.byModel[modelId] = {
          count: modelCount,
          label: modelLabels[modelId] || modelId
        };
      });
      
      // Get status breakdown for this category
      if (stats.byStatus) {
        categoryStats.active = stats.byStatus.active || 0;
        categoryStats.pending = stats.byStatus.pending || 0;
        categoryStats.closed = stats.byStatus.closed || 0;
      }
      
      html += `
        <div class="card" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" 
             onclick="loadModelCategory('${categoryId}')"
             onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';"
             onmouseout="this.style.transform=''; this.style.boxShadow='';">
          <div class="card-body">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="width: 3rem; height: 3rem; border-radius: 50%; background: var(--color-${category.color}-light); display: flex; align-items: center; justify-content: center;">
                <i class="ph ${category.icon}" style="font-size: 1.5rem; color: var(--color-${category.color});"></i>
              </div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.25rem 0;">${category.name}</h3>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${category.subModels.length} sub-models</p>
              </div>
            </div>
            
            <div style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem; font-weight: bold; color: var(--color-primary);">${categoryStats.total}</span>
                <span style="color: var(--text-secondary);">Total</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; font-size: 0.85rem;">
                <div style="text-align: center; padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <div style="color: var(--color-success); font-weight: 600;">${categoryStats.active}</div>
                  <div style="color: var(--text-secondary); font-size: 0.75rem;">Active</div>
                </div>
                <div style="text-align: center; padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <div style="color: var(--color-warning); font-weight: 600;">${categoryStats.pending}</div>
                  <div style="color: var(--text-secondary); font-size: 0.75rem;">Pending</div>
                </div>
                <div style="text-align: center; padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <div style="color: var(--color-info); font-weight: 600;">${categoryStats.closed}</div>
                  <div style="color: var(--text-secondary); font-size: 0.75rem;">Closed</div>
                </div>
              </div>
            </div>
            
            <div style="padding-top: 1rem; border-top: 1px solid var(--border-color);">
              <strong style="font-size: 0.9rem; color: var(--text-secondary);">Sub-models:</strong>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                ${Object.entries(categoryStats.byModel).map(([modelId, modelData]) => 
                  `<span class="badge badge-info" style="font-size: 0.75rem;">${modelId}: ${modelData.count}</span>`
                ).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
      
      <div>
        <h3 style="margin-bottom: 1rem;">Per-Model Statistics</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
    `;
    
    // Show per-model stats
    Object.entries(modelLabels).forEach(([modelId, label]) => {
      const count = stats.byModel[modelId] || 0;
      if (count > 0) {
        html += `
          <div class="card" style="cursor: pointer;" onclick="if(window.admin && window.admin['admin-models-management']) { window.admin['admin-models-management'].loadModel('${modelId}'); }">
            <div class="card-body" style="text-align: center; padding: 1.5rem;">
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${modelId}</div>
              <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem;">${label}</h4>
              <div style="font-size: 2rem; font-weight: bold; color: var(--color-primary);">${count}</div>
            </div>
          </div>
        `;
      }
    });
    
    html += `
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }

  function loadModel(modelId) {
    currentModel = modelId;
    const selector = document.getElementById('modelSelector');
    if (selector) selector.value = modelId;
    loadOpportunities();
    // Scroll to opportunities list
    const opportunitiesList = document.getElementById('opportunitiesList');
    if (opportunitiesList) {
      opportunitiesList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    const creator = PMTwinData.Users.getById(opportunity.creatorId);
    const creatorName = creator?.profile?.name || creator?.email || 'Unknown';
    const createdAt = opportunity.createdAt ? new Date(opportunity.createdAt) : new Date();
    const modelLabels = {
      '1.1': 'Task-Based Engagement',
      '1.2': 'Consortium',
      '1.3': 'Joint Venture',
      '1.4': 'SPV',
      '2.1': 'Strategic JV',
      '2.2': 'Strategic Alliance',
      '2.3': 'Mentorship',
      '3.1': 'Bulk Purchasing',
      '3.2': 'Co-Ownership',
      '3.3': 'Resource Exchange',
      '4.1': 'Professional Hiring',
      '4.2': 'Consultant Hiring',
      '5.1': 'Competition/RFP'
    };
    const modelLabel = modelLabels[opportunity.modelId] || opportunity.modelName || opportunity.modelId || 'Unknown';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop show';
    modal.innerHTML = `
      <div class="modal show" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h2 class="modal-title">Opportunity Review</h2>
          <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <div>
              <h3 style="margin: 0 0 1rem 0;">${opportunity.title || 'Untitled'}</h3>
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div>
                  <strong style="color: var(--text-secondary); font-size: 0.9rem;">Model:</strong>
                  <div style="margin-top: 0.25rem;">
                    <span class="badge badge-info">${opportunity.modelId || 'Unknown'}</span>
                    <span style="margin-left: 0.5rem; color: var(--text-secondary);">${modelLabel}</span>
                  </div>
                </div>
                <div>
                  <strong style="color: var(--text-secondary); font-size: 0.9rem;">Status:</strong>
                  <div style="margin-top: 0.25rem;">
                    <span class="badge badge-${getStatusColor(opportunity.status)}">${opportunity.status}</span>
                  </div>
                </div>
                <div>
                  <strong style="color: var(--text-secondary); font-size: 0.9rem;">Created:</strong>
                  <div style="margin-top: 0.25rem; color: var(--text-secondary);">
                    ${createdAt.toLocaleDateString()} at ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 style="margin: 0 0 1rem 0;">Creator Information</h4>
              <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                <p style="margin: 0 0 0.5rem 0;"><strong>${creatorName}</strong></p>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${creator?.email || 'No email'}</p>
                ${creator?.profile?.company ? `<p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">${creator.profile.company}</p>` : ''}
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border-color);">
            <h4 style="margin-bottom: 1rem;">Description</h4>
            <p style="color: var(--text-secondary); line-height: 1.6;">${opportunity.description || 'No description provided'}</p>
          </div>
          
          ${opportunity.budget ? `
            <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border-color);">
              <h4 style="margin-bottom: 1rem;">Budget Information</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                ${opportunity.budget.min ? `
                  <div>
                    <strong style="color: var(--text-secondary); font-size: 0.9rem;">Minimum:</strong>
                    <div style="margin-top: 0.25rem; font-size: 1.25rem; font-weight: 600;">${formatCurrency(opportunity.budget.min)}</div>
                  </div>
                ` : ''}
                ${opportunity.budget.max ? `
                  <div>
                    <strong style="color: var(--text-secondary); font-size: 0.9rem;">Maximum:</strong>
                    <div style="margin-top: 0.25rem; font-size: 1.25rem; font-weight: 600;">${formatCurrency(opportunity.budget.max)}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h4 style="margin: 0;">Applications (${applications.length})</h4>
              ${applications.length > 0 ? `<span class="badge badge-info">${applications.filter(a => a.status === 'approved').length} approved</span>` : ''}
            </div>
            ${applications.length > 0 ? renderApplicationsList(applications) : '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No applications received yet</p>'}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-backdrop').remove()">Close</button>
          ${opportunity.status === 'pending' ? `
            <button class="btn btn-success" onclick="approveOpportunity('${opportunity.id}'); this.closest('.modal-backdrop').remove();">
              <i class="ph ph-check"></i> Approve
            </button>
            <button class="btn btn-error" onclick="rejectOpportunity('${opportunity.id}'); this.closest('.modal-backdrop').remove();">
              <i class="ph ph-x"></i> Reject
            </button>
          ` : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  function formatCurrency(amount) {
    if (!amount) return '0 SAR';
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
  }

  function renderApplicationsList(applications) {
    let html = '<div style="display: grid; gap: 1rem;">';
    
    applications.forEach(app => {
      const applicant = PMTwinData.Users.getById(app.applicantId);
      const submittedAt = app.submittedAt ? new Date(app.submittedAt) : new Date();
      
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <strong style="font-size: 1.1rem;">${applicant?.profile?.name || applicant?.email || 'Unknown'}</strong>
                  <span class="badge badge-${getStatusColor(app.status)}">${app.status}</span>
                </div>
                ${applicant?.email ? `<p style="margin: 0 0 0.5rem 0; color: var(--text-secondary); font-size: 0.9rem;">${applicant.email}</p>` : ''}
                ${applicant?.profile?.company ? `<p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${applicant.profile.company}</p>` : ''}
              </div>
              <div style="text-align: right;">
                <div style="color: var(--text-secondary); font-size: 0.85rem;">
                  ${submittedAt.toLocaleDateString()}
                </div>
                <div style="color: var(--text-secondary); font-size: 0.85rem;">
                  ${submittedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            
            ${app.applicationData?.proposal ? `
              <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 1rem;">
                <strong style="font-size: 0.9rem; color: var(--text-secondary);">Proposal:</strong>
                <p style="margin: 0.5rem 0 0 0; color: var(--text-primary); line-height: 1.6;">${app.applicationData.proposal}</p>
              </div>
            ` : ''}
            
            ${app.applicationData?.value ? `
              <div style="margin-bottom: 1rem;">
                <strong style="font-size: 0.9rem; color: var(--text-secondary);">Proposed Value:</strong>
                <div style="margin-top: 0.25rem; font-size: 1.1rem; font-weight: 600; color: var(--color-primary);">
                  ${formatCurrency(app.applicationData.value)}
                </div>
              </div>
            ` : ''}
            
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
              ${app.status === 'pending' ? `
                <button class="btn btn-sm btn-success" onclick="approveApplication('${app.id}', '${app.opportunityId}')">
                  <i class="ph ph-check"></i> Approve
                </button>
                <button class="btn btn-sm btn-error" onclick="rejectApplication('${app.id}', '${app.opportunityId}')">
                  <i class="ph ph-x"></i> Reject
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  async function approveApplication(applicationId, opportunityId) {
    if (!confirm('Are you sure you want to approve this application?')) return;
    
    try {
      if (typeof ModelsManagementService === 'undefined') {
        alert('Models management service not available');
        return;
      }

      // Update application status
      const application = PMTwinData.CollaborationApplications.getById(applicationId);
      if (application) {
        application.status = 'approved';
        PMTwinData.CollaborationApplications.update(applicationId, application);
      }

      alert('Application approved successfully');
      viewOpportunityDetails(opportunityId);
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Error approving application');
    }
  }

  async function rejectApplication(applicationId, opportunityId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      if (typeof ModelsManagementService === 'undefined') {
        alert('Models management service not available');
        return;
      }

      // Update application status
      const application = PMTwinData.CollaborationApplications.getById(applicationId);
      if (application) {
        application.status = 'rejected';
        application.rejectionReason = reason;
        PMTwinData.CollaborationApplications.update(applicationId, application);
      }

      alert('Application rejected successfully');
      viewOpportunityDetails(opportunityId);
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Error rejecting application');
    }
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
  window.approveApplication = approveApplication;
  window.rejectApplication = rejectApplication;

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-models-management'] = { 
    init,
    exportOpportunities,
    toggleAdvancedFilters,
    clearFilters,
    applyFilters,
    loadModel
  };

})();

