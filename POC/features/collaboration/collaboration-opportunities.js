/**
 * Collaboration Opportunities Component - HTML triggers for CollaborationService functions
 */

(function() {
  'use strict';

  let currentFilters = {};

  function init(params) {
    loadOpportunities();
  }

  // ============================================
  // HTML Triggers for CollaborationService Functions
  // ============================================

  // Trigger: getCollaborationOpportunities(filters) - Load opportunities
  async function loadOpportunities() {
    const container = document.getElementById('opportunitiesList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading opportunities...</p>';

      let result;
      if (typeof CollaborationService !== 'undefined') {
        result = await CollaborationService.getCollaborationOpportunities(currentFilters);
      } else {
        container.innerHTML = '<p class="alert alert-error">Collaboration service not available</p>';
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
      if (typeof CollaborationService === 'undefined') {
        return { success: false, error: 'Collaboration service not available' };
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
      if (typeof CollaborationService === 'undefined') {
        alert('Collaboration service not available');
        return;
      }

      const result = await CollaborationService.applyToCollaboration(opportunityId, {
        notes: notes || '',
        status: 'in_review'
      });
      
      if (result.success) {
        alert('Application submitted successfully!');
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
      if (typeof CollaborationService === 'undefined') {
        alert('Collaboration service not available');
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

  function viewOpportunity(opportunityId) {
    window.location.hash = `#collaboration/${opportunityId}`;
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
    viewOpportunity
  };

  // Global reference for onclick handlers
  window.collaborationComponent = window.collaboration['collaboration-opportunities'];

})();

