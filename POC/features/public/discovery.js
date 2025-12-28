/**
 * Discovery Component - Browse public projects
 */

(function() {
  'use strict';

  let currentFilters = {};

  function init(params) {
    loadProjects();
  }

  async function loadProjects() {
    const container = document.getElementById('discoveryProjectsList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading projects...</p>';

      let result;
      if (typeof ProjectService !== 'undefined') {
        result = await ProjectService.getProjects(currentFilters);
      } else if (typeof PMTwinData !== 'undefined') {
        // Fallback: load public projects directly
        const projects = PMTwinData.Projects.getAll().filter(p => p.visibility === 'public' || p.status === 'active');
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
    
    const category = document.getElementById('discoveryCategoryFilter')?.value;
    if (category) filters.category = category;
    
    const status = document.getElementById('discoveryStatusFilter')?.value;
    if (status) filters.status = status;
    
    const location = document.getElementById('discoveryLocationFilter')?.value;
    if (location) {
      // Filter by location in the rendering function
      currentFilters.location = location.toLowerCase();
    } else {
      delete currentFilters.location;
    }
    
    currentFilters = { ...currentFilters, ...filters };
    await loadProjects();
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('discoveryFiltersForm')?.reset();
    loadProjects();
  }

  function renderProjects(container, projects) {
    // Apply location filter if set
    if (currentFilters.location) {
      projects = projects.filter(p => {
        const city = p.location?.city?.toLowerCase() || '';
        const region = p.location?.region?.toLowerCase() || '';
        return city.includes(currentFilters.location) || region.includes(currentFilters.location);
      });
    }

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No projects found matching your criteria.</p>
            <button onclick="discoveryComponent.clearFilters()" class="btn btn-primary" style="margin-top: 1rem;">Clear Filters</button>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">';
    
    projects.forEach(project => {
      html += `
        <div class="card">
          <div class="card-body">
            <h3 style="margin: 0 0 0.5rem 0;">${project.title || 'Untitled Project'}</h3>
            <p style="margin: 0 0 1rem 0; color: var(--text-secondary);">
              ${project.category || 'General'} • ${project.location?.city || 'Location TBD'}, ${project.location?.region || ''}
            </p>
            <p style="margin-bottom: 1rem;">${(project.description || '').substring(0, 150)}...</p>
            <div style="display: flex; gap: 1rem;">
              <a href="#project/${project.id}" class="btn btn-primary btn-sm">View Details</a>
              ${typeof PMTwinAuth !== 'undefined' && PMTwinAuth.isAuthenticated() ? `
                <a href="#create-proposal?projectId=${project.id}" class="btn btn-success btn-sm">Submit Proposal</a>
              ` : `
                <a href="#signup" class="btn btn-secondary btn-sm">Sign Up to Submit</a>
              `}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // Export
  if (!window.public) window.public = {};
  window.public.discovery = {
    init,
    loadProjects,
    applyFilters,
    clearFilters
  };

  // Global reference for onclick handlers
  window.discoveryComponent = window.public.discovery;

})();

