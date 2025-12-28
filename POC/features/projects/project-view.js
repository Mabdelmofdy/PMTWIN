/**
 * Project View Component - HTML triggers for ProjectService.getProjectById, updateProject, deleteProject
 */

(function() {
  'use strict';

  function init(params) {
    // Get project ID from params or URL
    const projectId = params?.params?.[0] || params?.id || getProjectIdFromHash();
    if (projectId) {
      loadProject(projectId);
    } else {
      showError('Project ID not provided');
    }
  }

  function getProjectIdFromHash() {
    // Try to get from URL query parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (projectId) return projectId;
    
    // Fallback to hash for backward compatibility
    const hash = window.location.hash;
    const match = hash.match(/project\/([^\/]+)/);
    return match ? match[1] : null;
  }

  // ============================================
  // HTML Triggers for ProjectService Functions
  // ============================================

  // Trigger: getProjectById(projectId) - Load project details
  async function loadProject(projectId) {
    const container = document.getElementById('projectViewContent');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading project...</p>';

      let result;
      if (typeof ProjectService !== 'undefined') {
        result = await ProjectService.getProjectById(projectId);
      } else {
        container.innerHTML = '<p class="alert alert-error">Project service not available</p>';
        return;
      }

      if (result.success && result.project) {
        renderProject(container, result.project);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load project'}</p>`;
      }
    } catch (error) {
      console.error('Error loading project:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading project. Please try again.</p>';
    }
  }

  // Trigger: updateProject(projectId, updates) - Update project status
  async function updateProjectStatus(projectId, newStatus) {
    try {
      if (typeof ProjectService === 'undefined') {
        alert('Project service not available');
        return;
      }

      const result = await ProjectService.updateProject(projectId, { status: newStatus });
      
      if (result.success) {
        alert(`Project status updated to ${newStatus}`);
        await loadProject(projectId);
      } else {
        alert(result.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    }
  }

  // Trigger: deleteProject(projectId) - Delete project
  async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      if (typeof ProjectService === 'undefined') {
        alert('Project service not available');
        return;
      }

      const result = await ProjectService.deleteProject(projectId);
      
      if (result.success) {
        alert('Project deleted successfully');
        window.location.href = 'projects.html';
      } else {
        alert(result.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    }
  }

  // ============================================
  // Rendering Functions
  // ============================================

  function renderProject(container, project) {
    const currentUser = PMTwinData?.Sessions.getCurrentUser();
    const canEdit = currentUser && (currentUser.id === project.creatorId || currentUser.role === 'admin');
    const canDelete = currentUser && (currentUser.id === project.creatorId || currentUser.role === 'admin');

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
        <div>
          <h1 style="margin: 0 0 0.5rem 0;">${project.title || 'Untitled Project'}</h1>
          <p style="margin: 0; color: var(--text-secondary);">
            ${project.category || 'General'} • ${project.location?.city || 'Location TBD'}, ${project.location?.region || ''}
          </p>
        </div>
        <span class="badge badge-${project.status === 'active' ? 'success' : 'secondary'}">
          ${project.status || 'draft'}
        </span>
      </div>

      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-body">
          <h2>Description</h2>
          <p>${project.description || 'No description provided.'}</p>
        </div>
      </div>

      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-body">
          <h2>Scope & Requirements</h2>
          ${project.scope?.requiredServices ? `
            <p><strong>Required Services:</strong> ${project.scope.requiredServices.join(', ')}</p>
          ` : ''}
          ${project.scope?.skillRequirements ? `
            <p><strong>Required Skills:</strong> ${project.scope.skillRequirements.join(', ')}</p>
          ` : ''}
        </div>
      </div>

      ${project.budget ? `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2>Budget</h2>
            <p>
              ${project.budget.min ? project.budget.min.toLocaleString() : 'N/A'} - 
              ${project.budget.max ? project.budget.max.toLocaleString() : 'N/A'} 
              ${project.budget.currency || 'SAR'}
            </p>
          </div>
        </div>
      ` : ''}

      <div style="display: flex; gap: 1rem; margin-top: 2rem;">
        ${canEdit ? `
          <a href="create-project.html?id=${project.id}" class="btn btn-primary">Edit Project</a>
        ` : ''}
        ${project.status === 'draft' && canEdit ? `
          <button onclick="projectViewComponent.updateProjectStatus('${project.id}', 'active')" class="btn btn-success">
            Publish Project
          </button>
        ` : ''}
        ${canDelete ? `
          <button onclick="projectViewComponent.deleteProject('${project.id}')" class="btn btn-danger">
            Delete Project
          </button>
        ` : ''}
        <a href="create-proposal.html?projectId=${project.id}" class="btn btn-primary">Submit Proposal</a>
        <a href="projects.html" class="btn btn-secondary">Back to Projects</a>
      </div>
    `;

    container.innerHTML = html;
  }

  function showError(message) {
    const container = document.getElementById('projectViewContent');
    if (container) {
      container.innerHTML = `<p class="alert alert-error">${message}</p>`;
    }
  }

  // Export
  if (!window.projects) window.projects = {};
  window.projects['project-view'] = {
    init,
    loadProject,
    updateProjectStatus,
    deleteProject
  };

  // Global reference for onclick handlers
  window.projectViewComponent = window.projects['project-view'];

})();

