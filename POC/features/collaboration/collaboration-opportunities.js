/**
 * Collaboration Opportunities Component - HTML triggers for CollaborationService functions
 */

(function() {
  'use strict';

  let currentFilters = {};

  // Helper: Wait for CollaborationService to be available
  async function waitForCollaborationService(maxWaitMs = 5000) {
    const maxRetries = maxWaitMs / 100;
    let retries = 0;
    
    while (typeof CollaborationService === 'undefined' && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    return typeof CollaborationService !== 'undefined';
  }

  async function init(params) {
    // Wait for service to be available before loading
    const serviceAvailable = await waitForCollaborationService();
    if (serviceAvailable) {
    loadOpportunities();
    } else {
      const container = document.getElementById('opportunitiesList');
      if (container) {
        container.innerHTML = '<p class="alert alert-error">Collaboration service not available. Please refresh the page.</p>';
      }
      console.error('[CollaborationOpportunities] CollaborationService not available after waiting');
    }
  }

  // ============================================
  // HTML Triggers for CollaborationService Functions
  // ============================================

  // Trigger: getCollaborationOpportunities(filters) - Load opportunities
  async function loadOpportunities() {
    const container = document.getElementById('opportunitiesList');
    if (!container) return;

    try {
      container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading opportunities...</p></div>';

      // Wait for CollaborationService to be available
      const serviceAvailable = await waitForCollaborationService();

      let result;
      if (serviceAvailable) {
        result = await CollaborationService.getCollaborationOpportunities(currentFilters);
      } else {
        container.innerHTML = '<p class="alert alert-error">Collaboration service not available. Please refresh the page.</p>';
        console.error('[CollaborationOpportunities] CollaborationService not loaded after waiting');
        return;
      }

      if (result.success && result.opportunities) {
        renderOpportunities(container, result.opportunities);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load opportunities'}</p>`;
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading opportunities. Please try again.</p>';
    }
  }

  // Trigger: getCollaborationOpportunities(filters) - Apply filters
  async function applyFilters(event) {
    if (event) event.preventDefault();
    
    const filters = {};
    
    const modelType = document.getElementById('modelTypeFilter')?.value;
    if (modelType) filters.modelType = modelType;
    
    const status = document.getElementById('opportunityStatusFilter')?.value;
    if (status) filters.status = status;
    
    const category = document.getElementById('categoryFilter')?.value;
    if (category) filters.category = category;
    
    const relationshipType = document.getElementById('relationshipTypeFilter')?.value;
    if (relationshipType) filters.relationshipType = relationshipType;
    
    currentFilters = filters;
    await loadOpportunities();
  }

  function clearFilters() {
    currentFilters = {};
    const form = document.getElementById('opportunityFiltersForm');
    if (form) {
      form.reset();
    }
    loadOpportunities();
  }

  // Trigger: createCollaborationOpportunity(opportunityData) - Create opportunity
  async function createOpportunity(opportunityData) {
    try {
      const serviceAvailable = await waitForCollaborationService();
      if (!serviceAvailable) {
        return { success: false, error: 'Collaboration service not available. Please refresh the page.' };
      }

      const result = await CollaborationService.createCollaborationOpportunity(opportunityData);
      return result;
    } catch (error) {
      console.error('Error creating opportunity:', error);
      return { success: false, error: 'Error creating opportunity' };
    }
  }

  // Trigger: applyToCollaboration(opportunityId, applicationData) - Apply to opportunity
  async function applyToOpportunity(opportunityId) {
    const notes = prompt('Please provide any additional notes for your application:');
    if (notes === null) return; // User cancelled

    try {
      const serviceAvailable = await waitForCollaborationService();
      if (!serviceAvailable) {
        alert('Collaboration service not available. Please refresh the page.');
        return;
      }

      const result = await CollaborationService.applyToCollaboration(opportunityId, {
        notes: notes || '',
        status: 'pending'
      });
      
      if (result.success) {
        alert('Application submitted successfully!');
        // Reload opportunities to update application counts
        await loadOpportunities();
      } else {
        alert(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying to opportunity:', error);
      alert('Error submitting application');
    }
  }

  // Trigger: getCollaborationApplications(filters) - View applications
  async function viewApplications(opportunityId) {
    try {
      const serviceAvailable = await waitForCollaborationService();
      if (!serviceAvailable) {
        alert('Collaboration service not available. Please refresh the page.');
        return;
      }

      const result = await CollaborationService.getCollaborationApplications({ opportunityId });
      
      if (result.success && result.applications) {
        showApplicationsModal(result.applications);
      } else {
        alert(result.error || 'Failed to load applications');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Error loading applications');
    }
  }

  // ============================================
  // UI Functions
  // ============================================

  function showCreateForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    
    modal.innerHTML = `
      <div class="card" style="max-width: 600px; width: 90%;">
        <div class="card-body">
          <h2>Create Collaboration Opportunity</h2>
          <form id="createOpportunityForm" onsubmit="return collaborationComponent.handleCreateSubmit(event)">
            <div class="form-group">
              <label for="oppModelType" class="form-label">Model Type *</label>
              <select id="oppModelType" class="form-control" required>
                <option value="">Select Type</option>
                <option value="spv">SPV</option>
                <option value="joint_venture">Joint Venture</option>
                <option value="barter">Barter</option>
              </select>
            </div>
            <div class="form-group">
              <label for="oppModelName" class="form-label">Model Name *</label>
              <input type="text" id="oppModelName" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="oppDescription" class="form-label">Description *</label>
              <textarea id="oppDescription" class="form-control" rows="4" required></textarea>
            </div>
            <div id="createOppMessage" style="display: none; margin-top: 1rem;"></div>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
              <button type="submit" class="btn btn-primary">Create</button>
              <button type="button" onclick="this.closest('.modal').remove()" class="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.remove();
    });
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const messageDiv = document.getElementById('createOppMessage');
    
    const opportunityData = {
      modelType: document.getElementById('oppModelType').value,
      modelName: document.getElementById('oppModelName').value,
      description: document.getElementById('oppDescription').value,
      status: 'draft'
    };

    const result = await createOpportunity(opportunityData);
    
    if (result.success) {
      if (messageDiv) {
        messageDiv.textContent = 'Opportunity created successfully!';
        messageDiv.className = 'alert alert-success';
        messageDiv.style.display = 'block';
      }
      setTimeout(() => {
        form.closest('.modal').remove();
        loadOpportunities();
      }, 1500);
    } else {
      if (messageDiv) {
        messageDiv.textContent = result.error || 'Failed to create opportunity';
        messageDiv.className = 'alert alert-error';
        messageDiv.style.display = 'block';
      }
    }
    
    return false;
  }

  function renderOpportunities(container, opportunities) {
    if (opportunities.length === 0) {
      container.innerHTML = `
        <div class="card enhanced-card">
          <div class="card-body empty-state">
            <div class="empty-state-icon">
              <i class="ph ph-folder-open"></i>
            </div>
            <div class="empty-state-title">No collaboration opportunities found</div>
            <div class="empty-state-description">
              <p>There are no collaboration opportunities matching your filters.</p>
              <button onclick="collaborationComponent.clearFilters()" class="btn btn-secondary" style="margin-top: 1rem;">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Calculate statistics
    const stats = {
      total: opportunities.length,
      active: opportunities.filter(o => o.status === 'active').length,
      draft: opportunities.filter(o => o.status === 'draft').length,
      totalViews: opportunities.reduce((sum, o) => sum + (o.views || 0), 0),
      totalApplications: opportunities.reduce((sum, o) => sum + (o.applicationsReceived || 0), 0)
    };

    let html = `
      <div class="card enhanced-card" style="margin-bottom: 2rem;">
        <div class="card-body">
          <h3 style="margin-bottom: 1rem;">Statistics</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
            <div>
              <div style="font-size: 2rem; font-weight: bold; color: var(--color-primary);">${stats.total}</div>
              <div style="color: var(--text-secondary); font-size: 0.875rem;">Total Opportunities</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: bold; color: var(--color-success);">${stats.active}</div>
              <div style="color: var(--text-secondary); font-size: 0.875rem;">Active</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: bold; color: var(--text-secondary);">${stats.totalViews}</div>
              <div style="color: var(--text-secondary); font-size: 0.875rem;">Total Views</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: bold; color: var(--color-info);">${stats.totalApplications}</div>
              <div style="color: var(--text-secondary); font-size: 0.875rem;">Applications</div>
            </div>
          </div>
        </div>
      </div>
      <div class="opportunities-grid">
    `;
    
    opportunities.forEach(opportunity => {
      const statusClass = opportunity.status === 'active' ? 'success' : 
                         opportunity.status === 'draft' ? 'warning' : 
                         opportunity.status === 'closed' ? 'danger' : 'secondary';
      const createdDate = new Date(opportunity.createdAt || Date.now()).toLocaleDateString();
      const description = opportunity.attributes?.taskTitle || 
                         opportunity.attributes?.projectTitle || 
                         opportunity.attributes?.competitionTitle || 
                         opportunity.description || 
                         'No description available';
      
      html += `
        <div class="card opportunity-card enhanced-card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; color: var(--text-primary);">
                  ${opportunity.modelName || opportunity.modelType || 'Untitled'}
                </h3>
                <p style="margin: 0 0 0.25rem 0; color: var(--text-secondary); font-size: 0.875rem;">
                  <strong>Model:</strong> ${opportunity.modelType || 'N/A'} • 
                  <strong>Category:</strong> ${opportunity.category || 'N/A'}
                </p>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">
                  <strong>Created:</strong> ${createdDate}
                </p>
              </div>
              <span class="status-badge status-${opportunity.status || 'draft'}">
                ${(opportunity.status || 'draft').charAt(0).toUpperCase() + (opportunity.status || 'draft').slice(1)}
              </span>
            </div>
            
            <p style="margin-bottom: 1rem; color: var(--text-secondary); line-height: 1.6;">
              ${description.length > 150 ? description.substring(0, 150) + '...' : description}
            </p>
            
            <div class="opportunity-meta" style="margin-bottom: 1rem;">
              <span class="badge" style="background: var(--bg-secondary); color: var(--text-primary);">
                <i class="ph ph-eye"></i> ${opportunity.views || 0} views
              </span>
              <span class="badge" style="background: var(--bg-secondary); color: var(--text-primary);">
                <i class="ph ph-file-text"></i> ${opportunity.applicationsReceived || 0} applications
              </span>
              ${opportunity.applicationsApproved ? `
                <span class="badge" style="background: var(--color-success); color: white;">
                  <i class="ph ph-check"></i> ${opportunity.applicationsApproved} approved
                </span>
              ` : ''}
            </div>
            
            <div class="quick-actions">
              <button onclick="collaborationComponent.viewOpportunity('${opportunity.id}')" class="btn btn-primary btn-sm">
                <i class="ph ph-eye"></i> View Details
              </button>
              ${opportunity.status === 'active' ? `
              <button onclick="collaborationComponent.applyToOpportunity('${opportunity.id}')" class="btn btn-success btn-sm">
                  <i class="ph ph-paper-plane-tilt"></i> Apply
              </button>
              ` : ''}
              ${opportunity.applicationsReceived > 0 ? `
              <button onclick="collaborationComponent.viewApplications('${opportunity.id}')" class="btn btn-secondary btn-sm">
                  <i class="ph ph-list"></i> Applications (${opportunity.applicationsReceived})
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

  async function viewOpportunity(opportunityId) {
    try {
      // Wait for service to be available
      const serviceAvailable = await waitForCollaborationService();
      if (!serviceAvailable) {
        alert('Collaboration service not available. Please refresh the page.');
        return;
      }

      // Get opportunity details (without incrementing views)
      const result = await CollaborationService.getOpportunityById(opportunityId);
      if (!result.success || !result.opportunity) {
        alert(result.error || 'Opportunity not found');
        return;
      }

      const opportunity = result.opportunity;
      
      // Log for debugging
      console.log('[ViewOpportunity] Viewing opportunity:', opportunity.id, 'Views:', opportunity.views);
      
      // Get applications count for this opportunity
      let applicationsCount = 0;
      let applications = [];
      try {
        const appsResult = await CollaborationService.getCollaborationApplications({ opportunityId: opportunityId });
        if (appsResult.success && appsResult.applications) {
          applications = appsResult.applications;
          applicationsCount = appsResult.applications.length;
        }
      } catch (error) {
        console.error('Error loading applications:', error);
      }
      
      // Get model information
      const model = typeof CollaborationModels !== 'undefined' 
        ? CollaborationModels.getModel(opportunity.modelId) 
        : null;

      // Get creator information
      const creator = typeof PMTwinData !== 'undefined' && PMTwinData.Users
        ? PMTwinData.Users.getById(opportunity.creatorId)
        : null;
      const creatorName = creator 
        ? (creator.profile?.name || creator.profile?.companyName || creator.name || creator.email || 'Unknown')
        : 'Unknown';
      const creatorEmail = creator?.email || 'N/A';

      // Format attributes for display with better formatting
      let attributesHtml = '';
      if (opportunity.attributes) {
        Object.keys(opportunity.attributes).forEach(key => {
          const value = opportunity.attributes[key];
          if (value !== null && value !== undefined && value !== '') {
            let displayValue = '';
            let displayType = 'text';
            
            // Format different value types
            if (typeof value === 'object') {
              if (Array.isArray(value)) {
                if (value.length === 0) return; // Skip empty arrays
                
                // Check if array contains objects (like memberRoles, requiredSkills)
                if (value.length > 0 && typeof value[0] === 'object') {
                  displayType = 'object-list';
                  displayValue = value.map((item, idx) => {
                    const itemHtml = Object.entries(item).map(([k, v]) => {
                      const formattedK = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return `<div style="margin-left: 1rem; margin-top: 0.25rem;"><strong>${formattedK}:</strong> ${v}</div>`;
                    }).join('');
                    return `<div style="margin-bottom: 0.75rem; padding: 0.75rem; background: white; border-radius: 6px; border-left: 3px solid var(--color-primary);">${itemHtml}</div>`;
                  }).join('');
                } else {
                  // Simple array (like requiredSkills)
                  displayType = 'list';
                  displayValue = value.map(item => `<span class="badge badge-outline" style="margin: 0.25rem;">${item}</span>`).join('');
                }
              } else {
                // Object (like budgetRange)
                displayType = 'object';
                if (key.toLowerCase().includes('budget') || key.toLowerCase().includes('range')) {
                  // Special formatting for budget ranges
                  const min = value.min || value.minValue || 0;
                  const max = value.max || value.maxValue || 0;
                  const currency = value.currency || 'SAR';
                  displayValue = `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
                  displayType = 'text';
                } else {
                  displayValue = Object.entries(value).map(([k, v]) => {
                    const formattedK = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return `<div style="margin-top: 0.5rem;"><strong>${formattedK}:</strong> ${v}</div>`;
                  }).join('');
                }
              }
            } else {
              displayValue = String(value);
            }
            
            // Format key name (convert camelCase to Title Case)
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            
            if (displayType === 'object-list') {
              attributesHtml += `
                <div style="margin-bottom: 1.5rem;">
                  <strong style="color: var(--text-primary); display: block; margin-bottom: 0.75rem;">${formattedKey}:</strong>
                  <div style="color: var(--text-secondary);">${displayValue}</div>
                </div>
              `;
            } else if (displayType === 'list') {
              attributesHtml += `
                <div style="margin-bottom: 1.5rem;">
                  <strong style="color: var(--text-primary); display: block; margin-bottom: 0.75rem;">${formattedKey}:</strong>
                  <div style="color: var(--text-secondary); display: flex; flex-wrap: wrap; gap: 0.5rem;">${displayValue}</div>
                </div>
              `;
            } else if (displayType === 'object') {
              attributesHtml += `
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: white; border-radius: 6px; border-left: 3px solid var(--color-primary);">
                  <strong style="color: var(--text-primary); display: block; margin-bottom: 0.75rem;">${formattedKey}:</strong>
                  <div style="color: var(--text-secondary);">${displayValue}</div>
                </div>
              `;
            } else {
              attributesHtml += `
                <div style="margin-bottom: 1.5rem;">
                  <strong style="color: var(--text-primary); display: block; margin-bottom: 0.5rem;">${formattedKey}:</strong>
                  <div style="color: var(--text-secondary); padding: 0.75rem; background: white; border-radius: 6px;">${displayValue}</div>
                </div>
              `;
            }
          }
        });
      }

      // Get status badge class
      const statusClass = {
        'active': 'success',
        'draft': 'secondary',
        'pending': 'warning',
        'closed': 'info',
        'cancelled': 'danger'
      }[opportunity.status] || 'secondary';

      console.log('[ViewOpportunity] Creating modal for opportunity:', opportunity.id);
      console.log('[ViewOpportunity] Opportunity data:', opportunity);
      
      // Create modal backdrop (full screen overlay)
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop show'; // Use backdrop class for full-screen overlay
      modal.id = `modal-opportunity-${opportunity.id}`;
      
      // Override CSS defaults with inline styles to ensure visibility
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '9999';
      modal.style.overflowY = 'auto';
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      
      try {
        modal.innerHTML = `
        <div class="modal show" style="position: relative; top: auto; left: auto; transform: none; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; margin: 2rem auto;">
          <div class="card" style="margin: 0; max-height: 90vh; overflow-y: auto;">
          <div class="card-header" style="position: sticky; top: 0; background: white; z-index: 10; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <h2 style="margin: 0 0 0.5rem 0;">${opportunity.modelName || model?.name || 'Collaboration Opportunity'}</h2>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
                  <span class="badge badge-${statusClass}">${(opportunity.status || 'draft').toUpperCase()}</span>
                  <span style="color: var(--text-secondary); font-size: 0.875rem;">
                    Model: ${opportunity.modelType || 'N/A'} • Category: ${opportunity.category || 'N/A'}
                  </span>
                </div>
              </div>
              <button onclick="this.closest('.modal-backdrop').remove()" class="btn btn-secondary btn-sm" style="margin-left: 1rem;">
                <i class="ph ph-x"></i>
              </button>
            </div>
          </div>
          <div class="card-body" style="padding: 2rem;">
            <!-- Overview Section -->
            <div style="margin-bottom: 2rem;">
              <h3 style="margin-bottom: 1rem; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem;">
                <i class="ph ph-info"></i> Overview
              </h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                  <div style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-user"></i> Created By
                  </div>
                  <div style="font-weight: 600; font-size: 1rem;">${creatorName}</div>
                  <div style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.25rem;">${creatorEmail}</div>
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                  <div style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-calendar"></i> Created Date
                  </div>
                  <div style="font-weight: 600; font-size: 1rem;">${opportunity.createdAt ? new Date(opportunity.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
                  ${opportunity.updatedAt ? `
                  <div style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.25rem;">
                    Updated: ${new Date(opportunity.updatedAt).toLocaleDateString()}
                  </div>
                  ` : ''}
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                  <div style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-handshake"></i> Relationship Type
                  </div>
                  <div style="font-weight: 600; font-size: 1rem;">${opportunity.relationshipType || 'N/A'}</div>
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                  <div style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-eye"></i> Total Views
                  </div>
                  <div style="font-weight: 600; font-size: 1.5rem; color: var(--color-primary);">${opportunity.views || 0}</div>
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                  <div style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-file-text"></i> Applications
                  </div>
                  <div style="font-weight: 600; font-size: 1.5rem; color: var(--color-info);">${applicationsCount || opportunity.applicationsReceived || 0}</div>
                  ${opportunity.applicationsApproved ? `
                  <div style="color: var(--color-success); font-size: 0.75rem; margin-top: 0.25rem;">
                    ${opportunity.applicationsApproved} Approved
                  </div>
                  ` : ''}
                </div>
                ${opportunity.matchesGenerated ? `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                  <div style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-sparkle"></i> Matches Generated
                  </div>
                  <div style="font-weight: 600; font-size: 1.5rem; color: var(--color-success);">${opportunity.matchesGenerated}</div>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Opportunity Details Section -->
            ${attributesHtml ? `
              <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem;">
                  <i class="ph ph-clipboard-text"></i> Opportunity Details
                </h3>
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px;">
                  ${attributesHtml}
                </div>
              </div>
            ` : ''}

            <!-- Applications Section - Always show, even if empty -->
            <div style="margin-bottom: 2rem;">
              <h3 style="margin-bottom: 1rem; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem;">
                <i class="ph ph-file-text"></i> Applications (${applicationsCount || 0})
              </h3>
              ${applications.length > 0 ? `
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; max-height: 400px; overflow-y: auto;">
                  ${applications.map((app, idx) => {
                    const appStatus = app.status === 'in_review' ? 'reviewing' : app.status;
                    const statusClass = {
                      'pending': 'warning',
                      'reviewing': 'info',
                      'in_review': 'info',
                      'approved': 'success',
                      'rejected': 'danger',
                      'withdrawn': 'secondary'
                    }[appStatus] || 'secondary';
                    
                    const applicant = typeof PMTwinData !== 'undefined' && PMTwinData.Users
                      ? PMTwinData.Users.getById(app.applicantId)
                      : null;
                    const applicantName = applicant
                      ? (applicant.profile?.name || applicant.profile?.companyName || applicant.name || applicant.email || 'Unknown')
                      : 'Unknown';
                    const applicantEmail = applicant?.email || 'N/A';
                    const applicantRole = applicant?.role || 'N/A';
                    
                    return `
                      <div style="padding: 1.25rem; background: white; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid var(--color-${statusClass}); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                          <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                              <strong style="font-size: 1.1rem;">${applicantName}</strong>
                              <span class="badge badge-${statusClass}" style="font-size: 0.75rem;">${(appStatus || 'pending').toUpperCase()}</span>
                            </div>
                            <div style="color: var(--text-secondary); font-size: 0.875rem;">
                              <i class="ph ph-envelope"></i> ${applicantEmail}
                            </div>
                            <div style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
                              <i class="ph ph-user-circle"></i> ${applicantRole}
                            </div>
                          </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                          <div>
                            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.25rem;">Applied Date</div>
                            <div style="font-weight: 600; font-size: 0.875rem;">
                              ${app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                            </div>
                            ${app.submittedAt ? `
                            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.25rem;">
                              ${new Date(app.submittedAt).toLocaleTimeString()}
                            </div>
                            ` : ''}
                          </div>
                          ${app.approvedAt ? `
                          <div>
                            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.25rem;">Approved Date</div>
                            <div style="font-weight: 600; font-size: 0.875rem; color: var(--color-success);">
                              ${new Date(app.approvedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          ` : ''}
                          ${app.rejectedAt ? `
                          <div>
                            <div style="color: var(--text-secondary); font-size: 0.75rem; margin-bottom: 0.25rem;">Rejected Date</div>
                            <div style="font-weight: 600; font-size: 0.875rem; color: var(--color-danger);">
                              ${new Date(app.rejectedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          ` : ''}
                        </div>
                        ${app.notes ? `
                          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                            <div style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; font-weight: 600;">
                              <i class="ph ph-note"></i> Application Notes:
                            </div>
                            <div style="color: var(--text-primary); font-size: 0.875rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 6px; line-height: 1.6;">
                              ${app.notes}
                            </div>
                          </div>
                        ` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : `
                <div style="background: var(--bg-secondary); padding: 2rem; border-radius: 8px; text-align: center;">
                  <i class="ph ph-file-x" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem; display: block;"></i>
                  <p style="color: var(--text-secondary); margin: 0;">No applications have been submitted yet.</p>
                </div>
              `}
            </div>

            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
              ${opportunity.status === 'active' ? `
                <button onclick="collaborationComponent.applyToOpportunity('${opportunityId}'); this.closest('.modal-backdrop').remove();" class="btn btn-success">
                  <i class="ph ph-paper-plane-tilt"></i> Apply
                </button>
              ` : ''}
              <button onclick="this.closest('.modal-backdrop').remove()" class="btn btn-secondary">
                <i class="ph ph-x"></i> Close
              </button>
            </div>
          </div>
          </div>
        </div>
      `;
      } catch (error) {
        console.error('[ViewOpportunity] Error creating modal HTML:', error);
        alert('Error creating modal. Please check the console for details.');
        return;
      }

      // Append modal to body BEFORE setting display to ensure it's in DOM
      if (!document.body) {
        console.error('[ViewOpportunity] document.body is not available');
        alert('Error: Cannot display modal. Page may not be fully loaded.');
        return;
      }
      
      document.body.appendChild(modal);
      console.log('[ViewOpportunity] Modal appended to body, modal element:', modal);
      
      // Force modal to be visible - add show class and ensure styles
      setTimeout(() => {
        // Add show class (required by CSS)
        modal.classList.add('show');
        
        // Force visibility with inline styles (override CSS)
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.position = 'fixed';
        modal.style.zIndex = '9999';
        
        console.log('[ViewOpportunity] Modal styles applied, should be visible');
        console.log('[ViewOpportunity] Modal classes:', modal.className);
        
        // Verify modal is actually visible
        const rect = modal.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(modal);
        console.log('[ViewOpportunity] Modal position:', rect);
        console.log('[ViewOpportunity] Modal computed display:', computedStyle.display);
        console.log('[ViewOpportunity] Modal computed opacity:', computedStyle.opacity);
        console.log('[ViewOpportunity] Modal computed visibility:', computedStyle.visibility);
        console.log('[ViewOpportunity] Modal computed z-index:', computedStyle.zIndex);
        
        if (rect.width === 0 || rect.height === 0) {
          console.warn('[ViewOpportunity] Modal has zero dimensions!');
        }
        
        // Check if modal is in DOM
        if (!document.body.contains(modal)) {
          console.error('[ViewOpportunity] Modal is not in DOM! Re-adding...');
          document.body.appendChild(modal);
        }
      }, 10);
      
      // Close modal when clicking outside (on backdrop)
      modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
          console.log('[ViewOpportunity] Closing modal (clicked outside)');
          modal.remove();
        }
      });

      // Close modal with Escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          modal.remove();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
      
      // Scroll modal to top
      const modalContent = modal.querySelector('.card');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
      
      console.log('[ViewOpportunity] Modal opened for opportunity:', opportunity.id);
      
    } catch (error) {
      console.error('Error viewing opportunity:', error);
      alert('Error loading opportunity details. Please try again.');
    }
  }

  function showApplicationsModal(applications) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    
    // Get applicant information
    const getApplicantName = (applicantId) => {
      if (typeof PMTwinData !== 'undefined' && PMTwinData.Users) {
        const user = PMTwinData.Users.getById(applicantId);
        return user ? (user.name || user.email || 'Unknown') : 'Unknown';
      }
      return 'Unknown';
    };
    
    let appsHtml = applications.length > 0 
      ? applications.map(app => {
          // Normalize status for display
          const displayStatus = app.status === 'in_review' ? 'reviewing' : (app.status || 'pending');
          const statusClass = displayStatus === 'approved' ? 'approved' : 
                            displayStatus === 'rejected' ? 'rejected' : 
                            displayStatus === 'reviewing' ? 'reviewing' : 'pending';
          const statusText = displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1).replace('_', ' ');
          const submittedDate = new Date(app.submittedAt).toLocaleString();
          const applicantName = getApplicantName(app.applicantId);
          
          return `
            <div class="enhanced-card" style="margin-bottom: 1rem; padding: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <div>
                  <strong>${applicantName}</strong>
                  <p style="margin: 0.25rem 0; color: var(--text-secondary); font-size: 0.875rem;">
                    Submitted: ${submittedDate}
                  </p>
                </div>
                <span class="status-badge status-${statusClass}">
                  ${statusText}
                </span>
              </div>
              ${app.notes ? `
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px;">
                  <strong>Notes:</strong>
                  <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">${app.notes}</p>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')
      : `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="ph ph-file-text"></i>
          </div>
          <div class="empty-state-title">No applications yet</div>
          <div class="empty-state-description">
            <p>This opportunity hasn't received any applications yet.</p>
          </div>
        </div>
      `;
    
    modal.innerHTML = `
      <div class="card enhanced-card" style="max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto;">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
            <h2 style="margin: 0;">Applications (${applications.length})</h2>
            <button onclick="this.closest('.modal').remove()" class="btn btn-secondary btn-sm">
              <i class="ph ph-x"></i> Close
            </button>
          </div>
          ${appsHtml}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.remove();
    });
  }

  // Reload test data
  async function reloadTestData() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.loadSampleCollaborationOpportunities) {
      alert('Data service not available. Please refresh the page.');
      return;
    }

    if (confirm('This will reload all test collaboration opportunities (65 total). Existing opportunities will be replaced. Continue?')) {
      try {
        // Force reload test data
        PMTwinData.loadSampleCollaborationOpportunities(true);
        
        // Wait a moment for data to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reload opportunities list
        await loadOpportunities();
        
        alert('Test data reloaded successfully! You should now see 65 opportunities.');
      } catch (error) {
        console.error('Error reloading test data:', error);
        alert('Error reloading test data. Please check the console for details.');
      }
    }
  }

  // Export
  if (!window.collaboration) window.collaboration = {};
  window.collaboration['collaboration-opportunities'] = {
    init,
    loadOpportunities,
    applyFilters,
    clearFilters,
    createOpportunity,
    applyToOpportunity,
    viewApplications,
    showCreateForm,
    handleCreateSubmit,
    viewOpportunity,
    reloadTestData
  };

  // Global reference for onclick handlers
  window.collaborationComponent = window.collaboration['collaboration-opportunities'];

})();

