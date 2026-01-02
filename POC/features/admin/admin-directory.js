/**
 * Admin Project Directory Component
 * Displays all projects in the platform for admin management
 */

(function() {
  'use strict';

  // Component namespace
  if (!window.admin) {
    window.admin = {};
  }

  const componentName = 'admin-directory';
  const component = {
    currentFilters: {
      search: '',
      category: '',
      status: '',
      type: ''
    },
    currentPage: 1,
    entriesPerPage: 20,
    projects: []
  };

  // Initialize component
  component.init = function() {
    console.log(`[${componentName}] Initializing...`);
    
    if (typeof PMTwinData === 'undefined') {
      console.error(`[${componentName}] PMTwinData not available`);
      return;
    }

    // Check RBAC
    if (typeof PMTwinRBAC !== 'undefined') {
      PMTwinRBAC.checkFeatureAccess('admin_directory').then(hasAccess => {
        if (!hasAccess) {
          console.warn(`[${componentName}] User does not have access to admin_directory`);
          document.querySelector('main').innerHTML = '<div class="container"><div class="alert alert-danger">You do not have permission to access this page.</div></div>';
          return;
        }
        loadProjects();
        setupEventListeners();
        renderStatistics();
      });
      } else {
      loadProjects();
      setupEventListeners();
      renderStatistics();
    }
  };

  // Setup event listeners
  function setupEventListeners() {
    const searchInput = document.getElementById('directorySearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');

    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          component.currentFilters.search = e.target.value.toLowerCase();
          component.currentPage = 1;
          renderDirectoryEntries();
        }, 300);
      });
    }

    const typeFilter = document.getElementById('typeFilter');

    if (categoryFilter) {
      categoryFilter.addEventListener('change', function(e) {
        component.currentFilters.category = e.target.value;
        component.currentPage = 1;
        renderDirectoryEntries();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', function(e) {
        component.currentFilters.status = e.target.value;
        component.currentPage = 1;
        renderDirectoryEntries();
      });
    }

    if (typeFilter) {
      typeFilter.addEventListener('change', function(e) {
        component.currentFilters.type = e.target.value;
        component.currentPage = 1;
        renderDirectoryEntries();
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', function() {
        component.currentFilters = { search: '', category: '', status: '', type: '' };
        component.currentPage = 1;
        document.getElementById('directorySearch').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('statusFilter').value = '';
        if (typeFilter) typeFilter.value = '';
        renderDirectoryEntries();
      });
    }
  }

  // Load projects from PMTwinData
  function loadProjects() {
    try {
      if (typeof PMTwinData === 'undefined' || !PMTwinData.Projects) {
        console.error(`[${componentName}] PMTwinData.Projects not available`);
        component.projects = [];
        renderDirectoryEntries();
        return;
      }

      // Get all projects
      component.projects = PMTwinData.Projects.getAll() || [];
      console.log(`[${componentName}] Loaded ${component.projects.length} projects`);
      renderDirectoryEntries();
    } catch (error) {
      console.error(`[${componentName}] Error loading projects:`, error);
      component.projects = [];
      renderDirectoryEntries();
    }
  }

  // Render statistics
  function renderStatistics() {
    const statsContainer = document.getElementById('directoryStatistics');
    if (!statsContainer) return;

    const total = component.projects.length;
    const active = component.projects.filter(p => p.status === 'active').length;
    const inProgress = component.projects.filter(p => p.status === 'in_progress').length;
    const completed = component.projects.filter(p => p.status === 'completed').length;
    const draft = component.projects.filter(p => p.status === 'draft').length;

    statsContainer.innerHTML = `
      <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
        <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">${total}</div>
        <div style="color: var(--text-secondary); margin-top: 0.5rem;">Total Projects</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
        <div style="font-size: 2rem; font-weight: bold; color: var(--success);">${active}</div>
        <div style="color: var(--text-secondary); margin-top: 0.5rem;">Active</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
        <div style="font-size: 2rem; font-weight: bold; color: var(--info);">${inProgress}</div>
        <div style="color: var(--text-secondary); margin-top: 0.5rem;">In Progress</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
        <div style="font-size: 2rem; font-weight: bold; color: var(--warning);">${completed}</div>
        <div style="color: var(--text-secondary); margin-top: 0.5rem;">Completed</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
        <div style="font-size: 2rem; font-weight: bold; color: var(--text-secondary);">${draft}</div>
        <div style="color: var(--text-secondary); margin-top: 0.5rem;">Draft</div>
      </div>
    `;
  }

  // Render projects table
  function renderDirectoryEntries() {
    const tbody = document.getElementById('directoryTableBody');
    if (!tbody) return;

    // Filter projects
    let filtered = component.projects.filter(project => {
      if (component.currentFilters.search) {
        const searchLower = component.currentFilters.search.toLowerCase();
        const title = (project.title || '').toLowerCase();
        const description = (project.description || '').toLowerCase();
        const location = project.location ? 
          `${project.location.city || ''} ${project.location.region || ''} ${project.location.country || ''}`.toLowerCase() : '';
        
        if (!title.includes(searchLower) && 
            !description.includes(searchLower) && 
            !location.includes(searchLower)) {
          return false;
        }
      }
      if (component.currentFilters.category && project.category !== component.currentFilters.category) {
        return false;
      }
      if (component.currentFilters.status && project.status !== component.currentFilters.status) {
        return false;
      }
      if (component.currentFilters.type && project.projectType !== component.currentFilters.type) {
        return false;
      }
      return true;
    });

    // Pagination
    const totalPages = Math.ceil(filtered.length / component.entriesPerPage);
    const startIndex = (component.currentPage - 1) * component.entriesPerPage;
    const endIndex = startIndex + component.entriesPerPage;
    const paginatedProjects = filtered.slice(startIndex, endIndex);

    // Render table rows
    if (paginatedProjects.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
            No projects found.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = paginatedProjects.map(project => {
        const createdDate = project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 
                          (project.publishedAt ? new Date(project.publishedAt).toLocaleDateString() : 'N/A');
        const location = project.location ? 
          `${project.location.city || ''}${project.location.region ? ', ' + project.location.region : ''}${project.location.country ? ', ' + project.location.country : ''}`.trim() : 
          'N/A';
        
        let statusClass = 'badge-secondary';
        if (project.status === 'active') statusClass = 'badge-success';
        else if (project.status === 'in_progress') statusClass = 'badge-info';
        else if (project.status === 'completed') statusClass = 'badge-primary';
        else if (project.status === 'cancelled') statusClass = 'badge-danger';
        else if (project.status === 'draft') statusClass = 'badge-warning';
        
        const projectType = project.projectType || 'single';
        const typeLabel = projectType === 'jv' ? 'Joint Venture' : 
                         projectType === 'spv' ? 'SPV' : 
                         projectType === 'consortium' ? 'Consortium' : 
                         'Single';
        
        const basePath = '../../';
        const projectUrl = `${basePath}project/?id=${project.id}`;
        
        return `
          <tr>
            <td><strong>${escapeHtml(project.title || 'Untitled Project')}</strong></td>
            <td>${escapeHtml(project.category || 'N/A')}</td>
            <td>${escapeHtml(typeLabel)}</td>
            <td>${escapeHtml(location)}</td>
            <td><span class="badge ${statusClass}">${escapeHtml(project.status || 'draft')}</span></td>
            <td>${createdDate}</td>
            <td>
              <div style="display: flex; gap: 0.5rem;">
                <a href="${projectUrl}" class="btn btn-sm btn-outline" title="View Project">
                  <i class="ph ph-eye"></i> View
                </a>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Render pagination
    renderPagination(totalPages);
  }

  // Render pagination
  function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('directoryPagination');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
      <button type="button" class="btn btn-sm btn-outline" 
              ${component.currentPage === 1 ? 'disabled' : ''} 
              onclick="window.admin['${componentName}'].goToPage(${component.currentPage - 1})">
        <i class="ph ph-caret-left"></i> Previous
      </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= component.currentPage - 2 && i <= component.currentPage + 2)) {
        paginationHTML += `
          <button type="button" class="btn btn-sm ${i === component.currentPage ? 'btn-primary' : 'btn-outline'}" 
                  onclick="window.admin['${componentName}'].goToPage(${i})">
            ${i}
          </button>
        `;
      } else if (i === component.currentPage - 3 || i === component.currentPage + 3) {
        paginationHTML += `<span style="padding: 0.5rem;">...</span>`;
      }
    }

    // Next button
    paginationHTML += `
      <button type="button" class="btn btn-sm btn-outline" 
              ${component.currentPage === totalPages ? 'disabled' : ''} 
              onclick="window.admin['${componentName}'].goToPage(${component.currentPage + 1})">
        Next <i class="ph ph-caret-right"></i>
      </button>
    `;

    paginationContainer.innerHTML = paginationHTML;
  }


  // Go to page
  component.goToPage = function(page) {
    component.currentPage = page;
    renderDirectoryEntries();
    // Scroll to top of table
    const table = document.getElementById('directoryTable');
    if (table) {
      table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Utility: Escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Export component
  window.admin[componentName] = component;

  console.log(`[${componentName}] Component loaded`);
})();

