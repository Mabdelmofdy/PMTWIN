/**
 * Projects List Component
 */

(function() {
  'use strict';

  async function init(params) {
    loadProjects();
  }

  async function loadProjects() {
    const container = document.getElementById('projectsList');
    if (!container) return;

    try {
      let result;
      if (typeof ProjectService !== 'undefined') {
        result = await ProjectService.getProjects();
      } else if (typeof PMTwinData !== 'undefined') {
        const currentUser = PMTwinData.Sessions.getCurrentUser();
        if (currentUser) {
          const projects = PMTwinData.Projects.getByCreator(currentUser.id);
          result = { success: true, projects };
        } else {
          result = { success: false, error: 'Not authenticated' };
        }
      } else {
        result = { success: false, error: 'Data service not available' };
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

  function renderProjects(container, projects) {
    if (projects.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p style="margin-bottom: 1rem;">You haven't created any projects yet.</p>
            <a href="#create-project" class="btn btn-primary">Create Your First Project</a>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    projects.forEach(project => {
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div>
                <h3 style="margin: 0 0 0.5rem 0;">${project.title || 'Untitled Project'}</h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  ${project.category || 'General'} • ${project.location?.city || 'Location TBD'}
                </p>
              </div>
              <span class="badge badge-${project.status === 'active' ? 'success' : 'secondary'}">
                ${project.status || 'draft'}
              </span>
            </div>
            <p style="margin-bottom: 1rem;">${(project.description || '').substring(0, 200)}...</p>
            <div style="display: flex; gap: 1rem;">
              <a href="#project/${project.id}" class="btn btn-primary btn-sm">View Details</a>
              <a href="#create-project?id=${project.id}" class="btn btn-secondary btn-sm">Edit</a>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // Export
  if (!window.projects) window.projects = {};
  window.projects['projects-list'] = { init };

})();


