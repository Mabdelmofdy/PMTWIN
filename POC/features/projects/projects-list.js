/**
 * Projects List Component
 */

(function() {
  'use strict';

  let currentFilters = {};

  function init(params) {
    setupEventListeners();
    loadProjects();
  }

  function setupEventListeners() {
    // Filter form
    const filterForm = document.getElementById('projectsFilterForm');
    if (filterForm) {
      filterForm.addEventListener('submit', applyFilters);
    }

    // Search input
    const searchInput = document.getElementById('projectSearch');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
  }

  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    if (searchTerm.length < 2 && searchTerm.length > 0) {
      return; // Wait for at least 2 characters
    }
    
    // Update currentFilters and reload
    if (searchTerm.length >= 2) {
      currentFilters.search = searchTerm;
    } else {
      delete currentFilters.search;
    }
    loadProjects();
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

  async function loadProjects() {
    const container = document.getElementById('projectsList');
    if (!container) return;

    try {
      container.innerHTML = '<p style="text-align: center; padding: 2rem;"><i class="ph ph-spinner ph-spin"></i> Loading projects...</p>';

      let result;
      if (typeof ProjectService !== 'undefined') {
        result = await ProjectService.getProjects(currentFilters);
      } else if (typeof PMTwinData !== 'undefined') {
        const currentUser = PMTwinData.Sessions.getCurrentUser();
        if (currentUser) {
          let projects = PMTwinData.Projects.getByCreator(currentUser.id);
          
          // Apply filters
          if (currentFilters.status) {
            projects = projects.filter(p => p.status === currentFilters.status);
          }
          if (currentFilters.category) {
            projects = projects.filter(p => p.category === currentFilters.category);
          }
          if (currentFilters.projectType) {
            if (currentFilters.projectType === 'mega') {
              projects = projects.filter(p => p.projectType === 'mega' || p.subProjects);
            } else if (currentFilters.projectType === 'single') {
              projects = projects.filter(p => p.projectType !== 'mega' && !p.subProjects);
            }
          }
          if (currentFilters.dateFrom) {
            projects = projects.filter(p => {
              const createdDate = new Date(p.createdAt || p.created);
              return createdDate >= new Date(currentFilters.dateFrom);
            });
          }
          if (currentFilters.dateTo) {
            projects = projects.filter(p => {
              const createdDate = new Date(p.createdAt || p.created);
              const toDate = new Date(currentFilters.dateTo);
              toDate.setHours(23, 59, 59, 999);
              return createdDate <= toDate;
            });
          }
          if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            projects = projects.filter(p => {
              const title = (p.title || '').toLowerCase();
              const description = (p.description || '').toLowerCase();
              return title.includes(searchTerm) || description.includes(searchTerm);
            });
          }
          
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

  async function applyFilters(event) {
    event.preventDefault();
    
    const filters = {};
    
    const status = document.getElementById('projectStatusFilter')?.value;
    if (status) filters.status = status;
    
    const category = document.getElementById('projectCategoryFilter')?.value;
    if (category) filters.category = category;
    
    const projectType = document.getElementById('projectTypeFilter')?.value;
    if (projectType) filters.projectType = projectType;
    
    const dateFrom = document.getElementById('projectDateFromFilter')?.value;
    if (dateFrom) filters.dateFrom = dateFrom;
    
    const dateTo = document.getElementById('projectDateToFilter')?.value;
    if (dateTo) filters.dateTo = dateTo;
    
    currentFilters = filters;
    await loadProjects();
  }

  function clearFilters() {
    currentFilters = {};
    const form = document.getElementById('projectsFilterForm');
    if (form) {
      form.reset();
    }
    // Hide advanced filters
    const advancedFilters = document.getElementById('advancedFilters');
    if (advancedFilters) {
      advancedFilters.style.display = 'none';
    }
    loadProjects();
  }

  function toggleAdvancedFilters() {
    const advancedFilters = document.getElementById('advancedFilters');
    if (advancedFilters) {
      const isVisible = advancedFilters.style.display !== 'none';
      advancedFilters.style.display = isVisible ? 'none' : 'block';
    }
  }

  function renderProjects(container, projects) {
    if (projects.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p style="margin-bottom: 1rem;">You haven't created any projects yet.</p>
            <a href="../create-project/" class="btn btn-primary">Create Your First Project</a>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    projects.forEach(project => {
      const isMegaProject = project.projectType === 'mega' || project.subProjects;
      const subProjectsCount = project.subProjects ? project.subProjects.length : 0;
      const budgetDisplay = project.budget ? 
        `${(project.budget.min || 0).toLocaleString()} - ${(project.budget.max || 0).toLocaleString()} SAR` : 
        'Budget TBD';
      
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <h3 style="margin: 0;">${project.title || 'Untitled Project'}</h3>
                  ${isMegaProject ? 
                    `<span class="badge badge-info" title="Mega-Project with ${subProjectsCount} sub-project(s)">
                      <i class="ph ph-stack"></i> Mega-Project (${subProjectsCount} phases)
                    </span>` : 
                    `<span class="badge badge-secondary" title="Single Project">
                      <i class="ph ph-file-text"></i> Single Project
                    </span>`
                  }
                </div>
                <p style="margin: 0; color: var(--text-secondary); margin-bottom: 0.5rem;">
                  <i class="ph ph-buildings"></i> ${project.category || 'General'} • 
                  <i class="ph ph-map-pin"></i> ${project.location?.city || 'Location TBD'}, ${project.location?.region || ''}
                </p>
                ${isMegaProject && project.budget ? 
                  `<p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);">
                    <i class="ph ph-currency-circle-dollar"></i> Total Budget: ${budgetDisplay}
                  </p>` : ''
                }
              </div>
              <span class="badge badge-${project.status === 'active' ? 'success' : project.status === 'draft' ? 'secondary' : 'info'}">
                ${project.status || 'draft'}
              </span>
            </div>
            <p style="margin-bottom: 1rem;">${(project.description || '').substring(0, 200)}${project.description && project.description.length > 200 ? '...' : ''}</p>
            ${isMegaProject && project.subProjects ? `
              <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius);">
                <strong style="font-size: var(--font-size-sm); color: var(--text-secondary);">Sub-Projects:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                  ${project.subProjects.slice(0, 3).map(sp => `
                    <span class="badge badge-secondary" style="font-size: var(--font-size-xs);">
                      ${sp.title || `Phase ${sp.index + 1}`}
                    </span>
                  `).join('')}
                  ${project.subProjects.length > 3 ? `<span class="badge badge-secondary" style="font-size: var(--font-size-xs);">+${project.subProjects.length - 3} more</span>` : ''}
                </div>
              </div>
            ` : ''}
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <a href="../project/?id=${project.id}" class="btn btn-primary btn-sm">
                <i class="ph ph-eye"></i> View Details
              </a>
              <a href="../create-project/?id=${project.id}" class="btn btn-secondary btn-sm">
                <i class="ph ph-pencil"></i> Edit
              </a>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // Export functions to window for onclick handlers
  window.projectsListComponent = {
    init,
    applyFilters,
    clearFilters,
    toggleAdvancedFilters
  };

  // Export
  if (!window.projects) window.projects = {};
  window.projects['projects-list'] = { init };

})();


