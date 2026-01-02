/**
 * Collaboration Opportunities Component - HTML triggers for CollaborationService functions
 */

(function() {
  'use strict';

  let currentFilters = {};

  function init(params) {
    // Check if modelId is provided in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const modelId = urlParams.get('modelId');
    
    if (modelId) {
      // Pre-select model in filters
      currentFilters.modelType = modelId;
      const modelTypeFilter = document.getElementById('modelTypeFilter');
      if (modelTypeFilter) {
        modelTypeFilter.value = modelId;
      }
      
      // Show create form with model pre-selected
      setTimeout(() => {
        showCreateFormWithModel(modelId);
      }, 500);
    }
    
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
        showApplicationsModal(result.applications, opportunityId);
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
    
    // Get current user for comparison
    const currentUser = PMTwinData?.Sessions?.getCurrentUser();
    const currentUserId = currentUser?.id;
    
    opportunities.forEach(opportunity => {
      // Get model details if available
      let model = null;
      if (typeof window.CollaborationModels !== 'undefined' && (opportunity.modelId || opportunity.modelType)) {
        model = window.CollaborationModels.getModel(opportunity.modelId || opportunity.modelType);
      }
      
      // Get application count
      let applicationCount = 0;
      if (typeof PMTwinData !== 'undefined' && PMTwinData.CollaborationApplications) {
        const apps = PMTwinData.CollaborationApplications.getByOpportunity(opportunity.id);
        applicationCount = apps ? apps.length : 0;
      }
      
      // Get creator info
      const creator = PMTwinData?.Users?.getById(opportunity.creatorId);
      const creatorName = creator?.profile?.name || creator?.email || 'Unknown';
      
      const modelBadge = model ? `<span class="badge badge-info" style="margin-right: 0.5rem;">${model.category || 'Model'}</span>` : '';
      const statusColor = opportunity.status === 'active' ? 'success' : 
                         opportunity.status === 'draft' ? 'secondary' : 
                         opportunity.status === 'completed' ? 'info' : 'warning';
      
      const isOwner = opportunity.creatorId === currentUserId;
      
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                  <h3 style="margin: 0;">${opportunity.title || opportunity.modelName || opportunity.modelType || 'Untitled Opportunity'}</h3>
                  ${modelBadge}
                  <span class="badge badge-${statusColor}">${opportunity.status || 'draft'}</span>
                </div>
                <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">
                  <strong>Model:</strong> ${model ? model.name : (opportunity.modelName || opportunity.modelType || 'N/A')}
                  ${opportunity.category ? ` • <strong>Category:</strong> ${opportunity.category}` : ''}
                </p>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                  <strong>Created by:</strong> ${creatorName}
                  ${opportunity.createdAt ? ` • ${new Date(opportunity.createdAt).toLocaleDateString()}` : ''}
                </p>
              </div>
            </div>
            
            <p style="margin-bottom: 1rem; line-height: 1.6;">${(opportunity.description || '').substring(0, 250)}${opportunity.description && opportunity.description.length > 250 ? '...' : ''}</p>
            
            ${applicationCount > 0 ? `
              <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-secondary, #f5f5f5); border-radius: var(--radius-sm, 4px);">
                <strong>${applicationCount}</strong> ${applicationCount === 1 ? 'application' : 'applications'} received
              </div>
            ` : ''}
            
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button onclick="collaborationComponent.viewOpportunity('${opportunity.id}')" class="btn btn-primary btn-sm">
                <i class="ph ph-eye"></i> View Details
              </button>
              ${opportunity.status === 'active' && !isOwner ? `
                <button onclick="collaborationComponent.applyToOpportunity('${opportunity.id}')" class="btn btn-success btn-sm">
                  <i class="ph ph-paper-plane-tilt"></i> Apply
                </button>
              ` : ''}
              ${isOwner ? `
                <button onclick="collaborationComponent.viewApplications('${opportunity.id}')" class="btn btn-secondary btn-sm">
                  <i class="ph ph-list"></i> Applications (${applicationCount})
                </button>
                ${opportunity.status === 'draft' ? `
                  <button onclick="collaborationComponent.publishOpportunity('${opportunity.id}')" class="btn btn-success btn-sm">
                    <i class="ph ph-check"></i> Publish
                  </button>
                ` : ''}
                ${opportunity.status === 'active' ? `
                  <button onclick="collaborationComponent.closeOpportunity('${opportunity.id}')" class="btn btn-warning btn-sm">
                    <i class="ph ph-x-circle"></i> Close
                  </button>
                ` : ''}
                <button onclick="collaborationComponent.editOpportunity('${opportunity.id}')" class="btn btn-outline btn-sm">
                  <i class="ph ph-pencil"></i> Edit
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

  function showApplicationsModal(applications, opportunityId) {
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop show';
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.cssText = 'max-width: 800px; max-height: 90vh; overflow-y: auto;';
    
    // Get applicant details
    let appsHtml = applications.length > 0 
      ? applications.map(app => {
          const applicant = PMTwinData?.Users?.getById(app.applicantId);
          const applicantName = applicant?.profile?.name || applicant?.email || 'Unknown User';
          const applicantEmail = applicant?.email || 'N/A';
          const statusColor = app.status === 'approved' ? 'success' : 
                             app.status === 'rejected' ? 'error' : 
                             app.status === 'in_review' ? 'warning' : 'secondary';
          
          return `
            <div class="card" style="margin-bottom: 1rem;">
              <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                  <div>
                    <h4 style="margin: 0 0 0.5rem 0;">${applicantName}</h4>
                    <p style="margin: 0; color: var(--text-secondary, #666);">${applicantEmail}</p>
                  </div>
                  <span class="badge badge-${statusColor}">${app.status || 'pending'}</span>
                </div>
                <div style="margin-bottom: 1rem;">
                  <p><strong>Submitted:</strong> ${new Date(app.submittedAt || app.createdAt).toLocaleString()}</p>
                  ${app.notes ? `<p><strong>Notes:</strong> ${app.notes}</p>` : '<p style="color: var(--text-secondary, #666);"><em>No notes provided</em></p>'}
                </div>
                ${app.status === 'in_review' || app.status === 'pending' ? `
                  <div style="display: flex; gap: 0.5rem;">
                    <button onclick="collaborationComponent.reviewApplication('${app.id}', '${opportunityId}', 'approved')" class="btn btn-success btn-sm">
                      <i class="ph ph-check"></i> Approve
                    </button>
                    <button onclick="collaborationComponent.reviewApplication('${app.id}', '${opportunityId}', 'rejected')" class="btn btn-danger btn-sm">
                      <i class="ph ph-x"></i> Reject
                    </button>
                  </div>
                ` : ''}
                ${app.reviewedAt ? `
                  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color, #e0e0e0);">
                    <small style="color: var(--text-secondary, #666);">
                      <strong>Reviewed:</strong> ${new Date(app.reviewedAt).toLocaleString()}
                      ${app.reviewedBy ? ` by ${PMTwinData?.Users?.getById(app.reviewedBy)?.profile?.name || 'Admin'}` : ''}
                    </small>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')
      : '<div class="card"><div class="card-body"><p style="text-align: center; color: var(--text-secondary, #666);">No applications yet.</p></div></div>';
    
    modal.innerHTML = `
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 class="modal-title">Applications (${applications.length})</h2>
        <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
      </div>
      <div class="modal-body">
        ${appsHtml}
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-backdrop').remove()">Close</button>
      </div>
    `;
    
    modalBackdrop.appendChild(modal);
    document.body.appendChild(modalBackdrop);
    
    modalBackdrop.addEventListener('click', function(e) {
      if (e.target === modalBackdrop) modalBackdrop.remove();
    });
  }

  async function reviewApplication(applicationId, opportunityId, decision) {
    const reason = decision === 'rejected' ? 
      prompt('Please provide a reason for rejection:') : 
      null;
    
    if (decision === 'rejected' && !reason) {
      return; // User cancelled
    }

    try {
      if (typeof PMTwinData === 'undefined') {
        alert('Data service not available');
        return;
      }

      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (!currentUser) {
        alert('You must be logged in to review applications');
        return;
      }

      // Update application status
      const application = PMTwinData.CollaborationApplications.getById(applicationId);
      if (!application) {
        alert('Application not found');
        return;
      }

      const updates = {
        status: decision,
        reviewedBy: currentUser.id,
        reviewedAt: new Date().toISOString(),
        reviewNotes: reason || null
      };

      const updated = PMTwinData.CollaborationApplications.update(applicationId, updates);
      
      if (updated) {
        // Create notification for applicant
        if (typeof PMTwinData !== 'undefined' && PMTwinData.Notifications) {
          const opportunity = PMTwinData.CollaborationOpportunities.getById(opportunityId);
          const message = decision === 'approved' 
            ? `Your application for "${opportunity?.title || opportunity?.modelName}" has been approved!`
            : `Your application for "${opportunity?.title || opportunity?.modelName}" has been rejected. Reason: ${reason}`;
          
          PMTwinData.Notifications.create({
            userId: application.applicantId,
            type: decision === 'approved' ? 'application_approved' : 'application_rejected',
            title: `Application ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
            message: message,
            link: `/collaboration-opportunities/`
          });
        }

        alert(`Application ${decision} successfully!`);
        
        // Reload applications modal
        const result = await CollaborationService.getCollaborationApplications({ opportunityId });
        if (result.success && result.applications) {
          // Close existing modal
          const existingModal = document.querySelector('.modal-backdrop');
          if (existingModal) existingModal.remove();
          
          // Show updated applications
          showApplicationsModal(result.applications, opportunityId);
        }
        
        // Reload opportunities list
        await loadOpportunities();
      } else {
        alert('Failed to update application');
      }
    } catch (error) {
      console.error('Error reviewing application:', error);
      alert('Error reviewing application');
    }
  }

  function showCreateFormWithModel(modelId) {
    // Get model details
    let model = null;
    if (typeof window.CollaborationModels !== 'undefined') {
      model = window.CollaborationModels.getModel(modelId);
    }

    if (model) {
      // Update the create form to show model info
      const form = document.getElementById('createOpportunityForm');
      if (form) {
        const modelTypeSelect = document.getElementById('oppModelType');
        if (modelTypeSelect) {
          modelTypeSelect.value = modelId;
          // Trigger change to show model-specific fields if any
        }
      }
    }
  }

  async function publishOpportunity(opportunityId) {
    if (!confirm('Are you sure you want to publish this opportunity? It will be visible to all users.')) {
      return;
    }

    try {
      if (typeof CollaborationService === 'undefined') {
        alert('Collaboration service not available');
        return;
      }

      const result = await CollaborationService.publishOpportunity(opportunityId);
      
      if (result.success) {
        alert('Opportunity published successfully!');
        await loadOpportunities();
      } else {
        alert(result.error || 'Failed to publish opportunity');
      }
    } catch (error) {
      console.error('Error publishing opportunity:', error);
      alert('Error publishing opportunity');
    }
  }

  async function closeOpportunity(opportunityId) {
    if (!confirm('Are you sure you want to close this opportunity? No new applications will be accepted.')) {
      return;
    }

    try {
      if (typeof CollaborationService === 'undefined') {
        alert('Collaboration service not available');
        return;
      }

      const result = await CollaborationService.closeOpportunity(opportunityId);
      
      if (result.success) {
        alert('Opportunity closed successfully!');
        await loadOpportunities();
      } else {
        alert(result.error || 'Failed to close opportunity');
      }
    } catch (error) {
      console.error('Error closing opportunity:', error);
      alert('Error closing opportunity');
    }
  }

  function editOpportunity(opportunityId) {
    // Get opportunity details
    const opportunity = PMTwinData?.CollaborationOpportunities?.getById(opportunityId);
    if (!opportunity) {
      alert('Opportunity not found');
      return;
    }

    // Show edit form (similar to create form but pre-filled)
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop show';
    modalBackdrop.id = 'editOpportunityModalBackdrop';

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.cssText = 'max-width: 700px; max-height: 90vh; overflow-y: auto;';

    modal.innerHTML = `
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 class="modal-title">Edit Opportunity</h2>
        <button class="modal-close" onclick="document.getElementById('editOpportunityModalBackdrop').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="editOpportunityForm">
          <input type="hidden" id="editOppId" value="${opportunityId}">
          <div class="form-group">
            <label for="editOppTitle" class="form-label">Opportunity Title *</label>
            <input type="text" id="editOppTitle" class="form-control" required value="${opportunity.title || ''}" placeholder="Enter opportunity title">
          </div>
          <div class="form-group">
            <label for="editOppDescription" class="form-label">Description *</label>
            <textarea id="editOppDescription" class="form-control" rows="4" required placeholder="Describe the collaboration opportunity...">${opportunity.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label for="editOppStatus" class="form-label">Status</label>
            <select id="editOppStatus" class="form-control">
              <option value="draft" ${opportunity.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="active" ${opportunity.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="pending" ${opportunity.status === 'pending' ? 'selected' : ''}>Pending Review</option>
              <option value="completed" ${opportunity.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
          <div id="editOppMessage" style="display: none; margin-top: 1rem;"></div>
          <div class="modal-footer" style="display: flex; gap: 0.5rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color, #e0e0e0);">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('editOpportunityModalBackdrop').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    modalBackdrop.appendChild(modal);
    document.body.appendChild(modalBackdrop);

    // Handle form submission
    const form = document.getElementById('editOpportunityForm');
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await handleEditOpportunitySubmit();
    });

    // Close on backdrop click
    modalBackdrop.addEventListener('click', function(e) {
      if (e.target === modalBackdrop) {
        modalBackdrop.remove();
      }
    });
  }

  async function handleEditOpportunitySubmit() {
    const messageDiv = document.getElementById('editOppMessage');
    const opportunityId = document.getElementById('editOppId').value;
    const title = document.getElementById('editOppTitle').value;
    const description = document.getElementById('editOppDescription').value;
    const status = document.getElementById('editOppStatus').value;

    if (!title || !description) {
      if (messageDiv) {
        messageDiv.textContent = 'Please fill in all required fields';
        messageDiv.className = 'alert alert-error';
        messageDiv.style.display = 'block';
      }
      return;
    }

    try {
      if (typeof CollaborationService === 'undefined') {
        throw new Error('Collaboration service not available');
      }

      const result = await CollaborationService.updateCollaborationOpportunity(opportunityId, {
        title: title,
        description: description,
        status: status
      });

      if (result.success) {
        if (messageDiv) {
          messageDiv.textContent = 'Opportunity updated successfully!';
          messageDiv.className = 'alert alert-success';
          messageDiv.style.display = 'block';
        }
        setTimeout(() => {
          document.getElementById('editOpportunityModalBackdrop').remove();
          loadOpportunities();
        }, 1500);
      } else {
        if (messageDiv) {
          messageDiv.textContent = result.error || 'Failed to update opportunity';
          messageDiv.className = 'alert alert-error';
          messageDiv.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Error updating opportunity:', error);
      if (messageDiv) {
        messageDiv.textContent = 'Error updating opportunity. Please try again.';
        messageDiv.className = 'alert alert-error';
        messageDiv.style.display = 'block';
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
    reviewApplication,
    showCreateFormWithModel,
    publishOpportunity,
    closeOpportunity,
    editOpportunity
  };

  // Global reference for onclick handlers
  window.collaborationComponent = window.collaboration['collaboration-opportunities'];

})();

