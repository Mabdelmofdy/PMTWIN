/**
 * Discovery Component - Browse public projects
 */

(function() {
  'use strict';

  let currentFilters = {};
  let currentSort = 'newest';
  let currentPage = 1;
  const itemsPerPage = 12;
  let allProjects = [];

  function init(params) {
    // Check if user is authenticated
    const isAuthenticated = typeof PMTwinAuth !== 'undefined' && PMTwinAuth.isAuthenticated();
    
    // Get search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
      currentFilters.search = searchQuery;
    }
    
    loadProjects();
  }

  async function loadProjects() {
    const container = document.getElementById('discoveryProjectsList');
    if (!container) return;

    try {
      container.innerHTML = '<div style="text-align: center; padding: 3rem;"><i class="ph ph-circle-notch ph-spin" style="font-size: 2rem; color: var(--color-primary);"></i><p style="margin-top: 1rem;">Loading projects...</p></div>';

      let result;
      if (typeof ProjectService !== 'undefined') {
        result = await ProjectService.getProjects(currentFilters);
      } else if (typeof PMTwinData !== 'undefined') {
        // Fallback: load public projects directly
        let projects = PMTwinData.Projects.getAll().filter(p => p.visibility === 'public' || p.status === 'active');
        
        // Apply search filter if exists
        if (currentFilters.search) {
          const searchLower = currentFilters.search.toLowerCase();
          projects = projects.filter(p => 
            (p.title && p.title.toLowerCase().includes(searchLower)) ||
            (p.description && p.description.toLowerCase().includes(searchLower)) ||
            (p.category && p.category.toLowerCase().includes(searchLower))
          );
        }
        
        result = { success: true, projects };
      } else {
        container.innerHTML = '<p class="alert alert-error">Project service not available</p>';
        return;
      }

      if (result.success && result.projects) {
        allProjects = result.projects;
        applySorting();
        renderProjects(container, allProjects);
        renderPagination();
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load projects'}</p>`;
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading projects. Please try again.</p>';
    }
  }

  function applySorting() {
    const sortValue = document.getElementById('discoverySortFilter')?.value || currentSort;
    currentSort = sortValue;

    switch(sortValue) {
      case 'newest':
        allProjects.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
        break;
      case 'oldest':
        allProjects.sort((a, b) => new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0));
        break;
      case 'largest_budget':
        allProjects.sort((a, b) => {
          const budgetA = a.budget?.max || a.budget?.total || 0;
          const budgetB = b.budget?.max || b.budget?.total || 0;
          return budgetB - budgetA;
        });
        break;
      case 'most_active':
        // Sort by number of proposals or activity
        allProjects.sort((a, b) => {
          const proposalsA = typeof PMTwinData !== 'undefined' ? PMTwinData.Proposals.getByProject(a.id)?.length || 0 : 0;
          const proposalsB = typeof PMTwinData !== 'undefined' ? PMTwinData.Proposals.getByProject(b.id)?.length || 0 : 0;
          return proposalsB - proposalsA;
        });
        break;
    }
  }

  function applySort() {
    applySorting();
    currentPage = 1;
    const container = document.getElementById('discoveryProjectsList');
    if (container) {
      renderProjects(container, allProjects);
      renderPagination();
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
      currentFilters.location = location.toLowerCase();
    } else {
      delete currentFilters.location;
    }
    
    const size = document.getElementById('discoverySizeFilter')?.value;
    if (size) {
      currentFilters.size = size;
    } else {
      delete currentFilters.size;
    }
    
    currentFilters = { ...currentFilters, ...filters };
    currentPage = 1;
    await loadProjects();
  }

  function clearFilters() {
    currentFilters = {};
    currentPage = 1;
    document.getElementById('discoveryFiltersForm')?.reset();
    document.getElementById('discoverySortFilter').value = 'newest';
    loadProjects();
  }

  function renderProjects(container, projects) {
    const isAuthenticated = typeof PMTwinAuth !== 'undefined' && PMTwinAuth.isAuthenticated();
    
    // Apply filters
    let filteredProjects = [...projects];
    
    if (currentFilters.location) {
      filteredProjects = filteredProjects.filter(p => {
        const city = p.location?.city?.toLowerCase() || '';
        const region = p.location?.region?.toLowerCase() || '';
        return city.includes(currentFilters.location) || region.includes(currentFilters.location);
      });
    }
    
    if (currentFilters.size) {
      filteredProjects = filteredProjects.filter(p => {
        const budget = p.budget?.max || p.budget?.total || 0;
        switch(currentFilters.size) {
          case 'small': return budget < 10000000;
          case 'medium': return budget >= 10000000 && budget < 50000000;
          case 'large': return budget >= 50000000 && budget < 200000000;
          case 'mega': return budget >= 200000000;
          default: return true;
        }
      });
    }

    if (filteredProjects.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <i class="ph ph-magnifying-glass" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No projects found matching your criteria.</p>
            <button onclick="discoveryComponent.clearFilters()" class="btn btn-primary" style="margin-top: 1rem;">Clear Filters</button>
          </div>
        </div>
      `;
      return;
    }

    // Pagination
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage);

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">';
    
    paginatedProjects.forEach(project => {
      const budget = project.budget?.max || project.budget?.total || 0;
      const budgetDisplay = budget > 0 ? formatBudget(budget) : 'Budget not disclosed';
      
      html += `
        <div class="card" style="position: relative; transition: transform 0.3s ease, box-shadow 0.3s ease;" 
             onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 12px 24px rgba(0,0,0,0.15)';" 
             onmouseout="this.style.transform=''; this.style.boxShadow='';">
          ${!isAuthenticated ? `
            <div class="guest-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; z-index: 10; opacity: 0; transition: opacity 0.3s ease;" 
                 onmouseover="this.style.opacity='1';" 
                 onmouseout="this.style.opacity='0';">
              <div style="text-align: center; color: white; padding: 1rem;">
                <i class="ph ph-lock" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                <p style="font-weight: 600; margin-bottom: 0.5rem;">Sign up to see details</p>
                <a href="../auth/signup/" class="btn btn-primary" style="text-decoration: none;">Sign Up Now</a>
              </div>
            </div>
          ` : ''}
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
              <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600; flex: 1;">${project.title || 'Untitled Project'}</h3>
              <span class="badge badge-primary" style="margin-left: 0.5rem;">${project.category || 'General'}</span>
            </div>
            <p style="margin: 0 0 1rem 0; color: var(--text-secondary); font-size: 0.9rem;">
              <i class="ph ph-map-pin"></i> ${project.location?.city || 'Location TBD'}${project.location?.region ? ', ' + project.location.region : ''}
            </p>
            <p style="margin-bottom: 1rem; color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem;">
              ${(project.description || 'No description available.').substring(0, 120)}${project.description && project.description.length > 120 ? '...' : ''}
            </p>
            ${isAuthenticated ? `
              <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 6px;">
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Budget Range</div>
                <div style="font-weight: 600; color: var(--color-primary);">${budgetDisplay}</div>
              </div>
            ` : `
              <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 6px; text-align: center;">
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                  <i class="ph ph-lock"></i> Sign up to view budget
                </div>
              </div>
            `}
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <a href="../projects/view/?id=${project.id}" class="btn btn-primary btn-sm" style="flex: 1; text-decoration: none; text-align: center; min-width: 120px;">View Details</a>
              ${isAuthenticated ? `
                <a href="../proposals/create/?projectId=${project.id}" class="btn btn-success btn-sm" style="flex: 1; text-decoration: none; text-align: center; min-width: 120px;">Submit Proposal</a>
              ` : `
                <a href="../auth/signup/" class="btn btn-secondary btn-sm" style="flex: 1; text-decoration: none; text-align: center; min-width: 120px;">Sign Up to Submit</a>
              `}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  function formatBudget(amount) {
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(1) + 'B SAR';
    } else if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M SAR';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + 'K SAR';
    }
    return amount.toLocaleString() + ' SAR';
  }

  function renderPagination() {
    const container = document.getElementById('discoveryPagination');
    if (!container) return;

    // Apply filters to get total count
    let filteredProjects = [...allProjects];
    if (currentFilters.location) {
      filteredProjects = filteredProjects.filter(p => {
        const city = p.location?.city?.toLowerCase() || '';
        const region = p.location?.region?.toLowerCase() || '';
        return city.includes(currentFilters.location) || region.includes(currentFilters.location);
      });
    }
    if (currentFilters.size) {
      filteredProjects = filteredProjects.filter(p => {
        const budget = p.budget?.max || p.budget?.total || 0;
        switch(currentFilters.size) {
          case 'small': return budget < 10000000;
          case 'medium': return budget >= 10000000 && budget < 50000000;
          case 'large': return budget >= 50000000 && budget < 200000000;
          case 'mega': return budget >= 200000000;
          default: return true;
        }
      });
    }

    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    
    if (totalPages <= 1) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    
    let html = '<div style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; flex-wrap: wrap;">';
    
    // Previous button
    html += `
      <button onclick="discoveryComponent.goToPage(${currentPage - 1})" 
              class="btn btn-outline" 
              ${currentPage === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
        <i class="ph ph-caret-left"></i> Previous
      </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      html += `<button onclick="discoveryComponent.goToPage(1)" class="btn btn-outline">1</button>`;
      if (startPage > 2) {
        html += `<span style="padding: 0.5rem;">...</span>`;
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      html += `
        <button onclick="discoveryComponent.goToPage(${i})" 
                class="btn ${i === currentPage ? 'btn-primary' : 'btn-outline'}">
          ${i}
        </button>
      `;
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span style="padding: 0.5rem;">...</span>`;
      }
      html += `<button onclick="discoveryComponent.goToPage(${totalPages})" class="btn btn-outline">${totalPages}</button>`;
    }
    
    // Next button
    html += `
      <button onclick="discoveryComponent.goToPage(${currentPage + 1})" 
              class="btn btn-outline" 
              ${currentPage === totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
        Next <i class="ph ph-caret-right"></i>
      </button>
    `;
    
    html += '</div>';
    html += `<div style="text-align: center; margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">Page ${currentPage} of ${totalPages} (${filteredProjects.length} projects)</div>`;
    
    container.innerHTML = html;
  }

  function goToPage(page) {
    const container = document.getElementById('discoveryProjectsList');
    if (!container) return;
    
    // Apply filters to get total count
    let filteredProjects = [...allProjects];
    if (currentFilters.location) {
      filteredProjects = filteredProjects.filter(p => {
        const city = p.location?.city?.toLowerCase() || '';
        const region = p.location?.region?.toLowerCase() || '';
        return city.includes(currentFilters.location) || region.includes(currentFilters.location);
      });
    }
    if (currentFilters.size) {
      filteredProjects = filteredProjects.filter(p => {
        const budget = p.budget?.max || p.budget?.total || 0;
        switch(currentFilters.size) {
          case 'small': return budget < 10000000;
          case 'medium': return budget >= 10000000 && budget < 50000000;
          case 'large': return budget >= 50000000 && budget < 200000000;
          case 'mega': return budget >= 200000000;
          default: return true;
        }
      });
    }
    
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderProjects(container, allProjects);
    renderPagination();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Export
  if (!window.public) window.public = {};
  window.public.discovery = {
    init,
    loadProjects,
    applyFilters,
    applySort,
    clearFilters,
    goToPage
  };

  // Global reference for onclick handlers
  window.discoveryComponent = window.public.discovery;

})();

