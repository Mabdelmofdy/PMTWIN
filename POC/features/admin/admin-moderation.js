/**
 * Admin Moderation Component - HTML triggers for ProjectService moderation functions
 */

(function() {
  'use strict';

  let currentFilters = {};

  // ============================================
  // Get Base Path Helper
  // ============================================
  function getBasePath() {
    // For local development: count all path segments to determine depth
    const currentPath = window.location.pathname;
    // Remove leading/trailing slashes and split, filter out empty strings and HTML files
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    
    // Count how many directory levels deep we are
    const depth = segments.length;
    
    // Generate the appropriate number of ../ to reach POC root
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  function init(params) {
    loadProjects();
  }

  async function loadProjects() {
    const container = document.getElementById('moderationProjectsList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading projects...</p>';

      let result;
      if (typeof ProjectService !== 'undefined') {
        result = await ProjectService.getProjects(currentFilters);
      } else if (typeof PMTwinData !== 'undefined') {
        const projects = PMTwinData.Projects.getAll();
        result = { success: true, projects };
      } else {
        container.innerHTML = '<p class="alert alert-error">Project service not available</p>';
        return;
      }

      if (result.success && result.projects) {
        renderProjects(container, result.projects);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load projects'}</p>`;
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading projects. Please try again.</p>';
    }
  }

  async function applyFilters(event) {
    event.preventDefault();
    
    const filters = {};
    
    const status = document.getElementById('moderationStatusFilter')?.value;
    if (status) filters.status = status;
    
    const category = document.getElementById('moderationCategoryFilter')?.value;
    if (category) filters.category = category;
    
    currentFilters = filters;
    await loadProjects();
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('moderationFiltersForm')?.reset();
    loadProjects();
  }

  // Trigger: updateProject(projectId, updates) - Approve/flag project
  async function moderateProject(projectId, action) {
    try {
      if (typeof ProjectService === 'undefined') {
        alert('Project service not available');
        return;
      }

      let updates = {};
      if (action === 'approve') {
        updates = { status: 'active', flagged: false };
      } else if (action === 'flag') {
        updates = { flagged: true };
      } else if (action === 'remove') {
        if (!confirm('Are you sure you want to remove this project?')) {
          return;
        }
        const result = await ProjectService.deleteProject(projectId);
        if (result.success) {
          alert('Project removed successfully');
          await loadProjects();
        } else {
          alert(result.error || 'Failed to remove project');
        }
        return;
      }

      const result = await ProjectService.updateProject(projectId, updates);
      
      if (result.success) {
        alert(`Project ${action}ed successfully`);
        await loadProjects();
      } else {
        alert(result.error || `Failed to ${action} project`);
      }
    } catch (error) {
      console.error('Error moderating project:', error);
      alert('Error moderating project');
    }
  }

  function renderProjects(container, projects) {
    if (projects.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No projects found.</p>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    projects.forEach(project => {
      const creator = PMTwinData?.Users.getById(project.creatorId);
      html += `
        <div class="card" style="${project.flagged ? 'border-left: 4px solid var(--danger);' : ''}">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div>
                <h3 style="margin: 0 0 0.5rem 0;">${project.title || 'Untitled Project'}</h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  ${project.category || 'General'} • Created by: ${creator?.email || 'Unknown'}
                </p>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                ${project.flagged ? '<span class="badge badge-danger">Flagged</span>' : ''}
                <span class="badge badge-${project.status === 'active' ? 'success' : 'secondary'}">
                  ${project.status || 'draft'}
                </span>
              </div>
            </div>
            
            <p style="margin-bottom: 1rem;">${(project.description || '').substring(0, 200)}...</p>
            
            <div style="display: flex; gap: 1rem;">
              <a href="${getBasePath()}project/?id=${project.id}" class="btn btn-primary btn-sm">View Details</a>
              ${project.status !== 'active' ? `
                <button onclick="adminModerationComponent.moderateProject('${project.id}', 'approve')" class="btn btn-success btn-sm">
                  Approve
                </button>
              ` : ''}
              ${!project.flagged ? `
                <button onclick="adminModerationComponent.moderateProject('${project.id}', 'flag')" class="btn btn-warning btn-sm">
                  Flag
                </button>
              ` : ''}
              <button onclick="adminModerationComponent.moderateProject('${project.id}', 'remove')" class="btn btn-danger btn-sm">
                Remove
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-moderation'] = {
    init,
    loadProjects,
    applyFilters,
    clearFilters,
    moderateProject
  };

  // Global reference for onclick handlers
  window.adminModerationComponent = window.admin['admin-moderation'];

})();

