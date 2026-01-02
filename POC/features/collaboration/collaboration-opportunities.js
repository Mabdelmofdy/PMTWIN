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
    event.preventDefault();
    
    const filters = {};
    
    const modelType = document.getElementById('modelTypeFilter')?.value;
    if (modelType) filters.modelType = modelType;
    
    const status = document.getElementById('opportunityStatusFilter')?.value;
    if (status) filters.status = status;
    
    currentFilters = filters;
    await loadOpportunities();
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('opportunityFiltersForm')?.reset();
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
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No collaboration opportunities found.</p>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    opportunities.forEach(opportunity => {
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div>
                <h3 style="margin: 0 0 0.5rem 0;">${opportunity.modelName || opportunity.modelType || 'Untitled'}</h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  Type: ${opportunity.modelType || 'N/A'} • Status: ${opportunity.status || 'N/A'}
                </p>
              </div>
              <span class="badge badge-${opportunity.status === 'active' ? 'success' : 'secondary'}">
                ${opportunity.status || 'draft'}
              </span>
            </div>
            
            <p style="margin-bottom: 1rem;">${(opportunity.description || '').substring(0, 200)}...</p>
            
            <div style="display: flex; gap: 1rem;">
              <button onclick="collaborationComponent.viewOpportunity('${opportunity.id}')" class="btn btn-primary btn-sm">
                View Details
              </button>
              <button onclick="collaborationComponent.applyToOpportunity('${opportunity.id}')" class="btn btn-success btn-sm">
                Apply
              </button>
              <button onclick="collaborationComponent.viewApplications('${opportunity.id}')" class="btn btn-secondary btn-sm">
                View Applications
              </button>
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
    
    let appsHtml = applications.length > 0 
      ? applications.map(app => `
          <div style="padding: 1rem; border-bottom: 1px solid var(--border-color);">
            <p><strong>Status:</strong> ${app.status}</p>
            <p><strong>Submitted:</strong> ${new Date(app.submittedAt).toLocaleString()}</p>
            ${app.notes ? `<p><strong>Notes:</strong> ${app.notes}</p>` : ''}
          </div>
        `).join('')
      : '<p>No applications yet.</p>';
    
    modal.innerHTML = `
      <div class="card" style="max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <h2>Applications</h2>
            <button onclick="this.closest('.modal').remove()" class="btn btn-secondary btn-sm">Close</button>
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

