/**
 * Service Providers Component
 * Handles both directory browsing and management interface
 */

(function() {
  'use strict';

  let currentView = 'directory'; // 'directory' or 'manage'
  let currentFilters = {};
  let viewMode = 'grid'; // 'grid' or 'list'
  let currentUser = null;
  let isServiceProvider = false;

  async function init(params) {
    // Check if user is a service provider
    if (typeof PMTwinData !== 'undefined') {
      currentUser = PMTwinData.Sessions.getCurrentUser();
      if (currentUser && typeof PMTwinRBAC !== 'undefined') {
        const userRole = await PMTwinRBAC.getCurrentUserRole();
        isServiceProvider = userRole === 'service_provider';
      }
    }

    // Determine initial view
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view') || 'directory';
    currentView = (view === 'manage' && isServiceProvider) ? 'manage' : 'directory';

    renderView();
  }

  async function renderView() {
    const container = document.getElementById('serviceProvidersContent');
    if (!container) return;

    if (currentView === 'directory') {
      await renderDirectoryView(container);
    } else if (currentView === 'manage' && isServiceProvider) {
      await renderManagementView(container);
    } else {
      container.innerHTML = '<p class="alert alert-error">You do not have permission to access this view.</p>';
    }
  }

  async function renderDirectoryView(container) {
    container.innerHTML = `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
            <h2 style="margin: 0;">Service Providers Directory</h2>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="serviceProvidersComponent.toggleViewMode()" class="btn btn-secondary btn-sm">
                <i class="ph ph-${viewMode === 'grid' ? 'list' : 'grid-four'}"></i> ${viewMode === 'grid' ? 'List' : 'Grid'}
              </button>
            </div>
          </div>
          
          <!-- Search and Filters -->
          <form id="serviceProvidersFiltersForm" onsubmit="return serviceProvidersComponent.applyFilters(event)">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label for="spSearch" class="form-label">Search</label>
                <input type="text" id="spSearch" class="form-control" placeholder="Search providers...">
              </div>
              <div class="form-group">
                <label for="spCategoryFilter" class="form-label">Category</label>
                <select id="spCategoryFilter" class="form-control">
                  <option value="">All Categories</option>
                </select>
              </div>
              <div class="form-group">
                <label for="spLocationFilter" class="form-label">Location</label>
                <input type="text" id="spLocationFilter" class="form-control" placeholder="City or Region">
              </div>
              <div class="form-group">
                <label for="spAvailabilityFilter" class="form-label">Availability</label>
                <select id="spAvailabilityFilter" class="form-control">
                  <option value="">All</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button type="submit" class="btn btn-primary">Apply Filters</button>
              <button type="button" onclick="serviceProvidersComponent.clearFilters()" class="btn btn-secondary">Clear</button>
            </div>
          </form>
        </div>
      </div>

      <div id="serviceProvidersList">
        <p>Loading service providers...</p>
      </div>
    `;

    // Load categories
    await loadCategories();

    // Load providers
    await loadServiceProviders();
  }

  async function loadCategories() {
    if (typeof ServiceProviderService === 'undefined') return;

    try {
      const result = await ServiceProviderService.getServiceCategories();
      if (result.success) {
        const select = document.getElementById('spCategoryFilter');
        if (select) {
          result.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
          });
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function loadServiceProviders() {
    const container = document.getElementById('serviceProvidersList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading service providers...</p>';

      if (typeof ServiceProviderService === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Service provider service not available</p>';
        return;
      }

      const result = await ServiceProviderService.getServiceProviders(currentFilters);
      
      if (result.success && result.providers) {
        renderServiceProviders(container, result.providers);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load service providers'}</p>`;
      }
    } catch (error) {
      console.error('Error loading service providers:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading service providers. Please try again.</p>';
    }
  }

  function renderServiceProviders(container, providers) {
    if (providers.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No service providers found matching your criteria.</p>
            <button onclick="serviceProvidersComponent.clearFilters()" class="btn btn-primary" style="margin-top: 1rem;">Clear Filters</button>
          </div>
        </div>
      `;
      return;
    }

    if (viewMode === 'grid') {
      renderGridView(container, providers);
    } else {
      renderListView(container, providers);
    }
  }

  function renderGridView(container, providers) {
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">';
    
    providers.forEach(provider => {
      const availabilityBadge = {
        available: { class: 'badge-success', text: 'Available' },
        busy: { class: 'badge-warning', text: 'Busy' },
        unavailable: { class: 'badge-secondary', text: 'Unavailable' }
      }[provider.availability] || { class: 'badge-secondary', text: 'Unknown' };

      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <h3 style="margin: 0;">${provider.companyName || 'Unknown'}</h3>
              <span class="badge ${availabilityBadge.class}">${availabilityBadge.text}</span>
            </div>
            
            <p style="margin: 0 0 1rem 0; color: var(--text-secondary); font-size: var(--font-size-sm);">
              <i class="ph ph-map-pin"></i> ${provider.location?.city || 'N/A'}, ${provider.location?.region || ''}
            </p>
            
            <p style="margin-bottom: 1rem; font-size: var(--font-size-sm);">
              ${(provider.description || '').substring(0, 150)}${provider.description && provider.description.length > 150 ? '...' : ''}
            </p>
            
            <div style="margin-bottom: 1rem;">
              <p style="margin: 0 0 0.5rem 0; font-size: var(--font-size-sm); font-weight: bold;">Categories:</p>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${(provider.categories || []).slice(0, 3).map(cat => 
                  `<span class="badge badge-info" style="font-size: 0.75rem;">${cat}</span>`
                ).join('')}
                ${(provider.categories || []).length > 3 ? `<span class="badge badge-secondary" style="font-size: 0.75rem;">+${provider.categories.length - 3}</span>` : ''}
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: var(--font-size-sm);">
              <span><i class="ph ph-clock"></i> Response: ${provider.responseTime || 'N/A'}</span>
              <span><i class="ph ph-star"></i> Score: ${provider.profileScore || 0}%</span>
            </div>
            
            <a href="?id=${provider.id}" class="btn btn-primary btn-sm" style="width: 100%;">View Details</a>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  function renderListView(container, providers) {
    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    providers.forEach(provider => {
      const availabilityBadge = {
        available: { class: 'badge-success', text: 'Available' },
        busy: { class: 'badge-warning', text: 'Busy' },
        unavailable: { class: 'badge-secondary', text: 'Unavailable' }
      }[provider.availability] || { class: 'badge-secondary', text: 'Unknown' };

      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">${provider.companyName || 'Unknown'}</h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  <i class="ph ph-map-pin"></i> ${provider.location?.city || 'N/A'}, ${provider.location?.region || ''} • 
                  <i class="ph ph-clock"></i> ${provider.responseTime || 'N/A'} • 
                  <i class="ph ph-star"></i> ${provider.profileScore || 0}%
                </p>
              </div>
              <span class="badge ${availabilityBadge.class}">${availabilityBadge.text}</span>
            </div>
            
            <p style="margin-bottom: 1rem;">${provider.description || ''}</p>
            
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
              ${(provider.categories || []).map(cat => 
                `<span class="badge badge-info">${cat}</span>`
              ).join('')}
            </div>
            
            <a href="?id=${provider.id}" class="btn btn-primary btn-sm">View Details</a>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  async function renderManagementView(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2>Manage Service Offerings</h2>
        <button onclick="serviceProvidersComponent.showCreateOfferingForm()" class="btn btn-primary">
          <i class="ph ph-plus"></i> Create New Offering
        </button>
      </div>

      <div id="serviceOfferingsList">
        <p>Loading your service offerings...</p>
      </div>
    `;

    await loadMyServiceOfferings();
  }

  async function loadMyServiceOfferings() {
    const container = document.getElementById('serviceOfferingsList');
    if (!container) return;

    try {
      if (!currentUser) {
        container.innerHTML = '<p class="alert alert-error">User not authenticated</p>';
        return;
      }

      if (typeof ServiceProviderService === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Service provider service not available</p>';
        return;
      }

      // Get provider for current user
      const providerResult = await ServiceProviderService.getServiceProviderByUserId(currentUser.id);
      if (!providerResult.success) {
        container.innerHTML = `
          <div class="card">
            <div class="card-body" style="text-align: center; padding: 3rem;">
              <p>Service provider profile not found.</p>
              <p style="color: var(--text-secondary); margin-top: 1rem;">Please complete your service provider profile first.</p>
              <a href="../profile/" class="btn btn-primary" style="margin-top: 1rem;">Go to Profile</a>
            </div>
          </div>
        `;
        return;
      }

      // Get offerings for this provider
      const offeringsResult = await ServiceProviderService.getServiceOfferings(providerResult.provider.id);
      
      if (offeringsResult.success && offeringsResult.offerings) {
        renderMyServiceOfferings(container, offeringsResult.offerings);
      } else {
        container.innerHTML = `<p class="alert alert-error">${offeringsResult.error || 'Failed to load service offerings'}</p>`;
      }
    } catch (error) {
      console.error('Error loading service offerings:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading service offerings. Please try again.</p>';
    }
  }

  function renderMyServiceOfferings(container, offerings) {
    if (offerings.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>You haven't created any service offerings yet.</p>
            <button onclick="serviceProvidersComponent.showCreateOfferingForm()" class="btn btn-primary" style="margin-top: 1rem;">
              <i class="ph ph-plus"></i> Create Your First Offering
            </button>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    offerings.forEach(offering => {
      const availabilityBadge = {
        available: { class: 'badge-success', text: 'Available' },
        busy: { class: 'badge-warning', text: 'Busy' },
        unavailable: { class: 'badge-secondary', text: 'Unavailable' }
      }[offering.availability] || { class: 'badge-secondary', text: 'Unknown' };

      const priceDisplay = offering.pricingModel === 'hourly' 
        ? `${offering.priceRange?.min || 0} - ${offering.priceRange?.max || 0} ${offering.priceRange?.currency || 'SAR'}/hour`
        : offering.pricingModel === 'retainer'
        ? `${offering.priceRange?.min || 0} - ${offering.priceRange?.max || 0} ${offering.priceRange?.currency || 'SAR'}/month`
        : `${offering.priceRange?.min || 0} - ${offering.priceRange?.max || 0} ${offering.priceRange?.currency || 'SAR'}`;

      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">${offering.title || 'Untitled Offering'}</h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  <span class="badge badge-info">${offering.category || 'N/A'}</span> • 
                  ${offering.pricingModel || 'project'} • ${priceDisplay}
                </p>
              </div>
              <span class="badge ${availabilityBadge.class}">${availabilityBadge.text}</span>
            </div>
            
            <p style="margin-bottom: 1rem;">${offering.description || ''}</p>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
              <button onclick="serviceProvidersComponent.editOffering('${offering.id}')" class="btn btn-primary btn-sm">
                <i class="ph ph-pencil"></i> Edit
              </button>
              <button onclick="serviceProvidersComponent.deleteOffering('${offering.id}')" class="btn btn-danger btn-sm">
                <i class="ph ph-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  async function applyFilters(event) {
    event.preventDefault();
    
    currentFilters = {};
    
    const search = document.getElementById('spSearch')?.value;
    if (search) currentFilters.search = search;
    
    const category = document.getElementById('spCategoryFilter')?.value;
    if (category) currentFilters.category = category;
    
    const location = document.getElementById('spLocationFilter')?.value;
    if (location) currentFilters.location = location;
    
    const availability = document.getElementById('spAvailabilityFilter')?.value;
    if (availability) currentFilters.availability = availability;
    
    await loadServiceProviders();
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('serviceProvidersFiltersForm')?.reset();
    loadServiceProviders();
  }

  function toggleViewMode() {
    viewMode = viewMode === 'grid' ? 'list' : 'grid';
    loadServiceProviders();
  }

  function switchView(view) {
    currentView = view;
    renderView();
  }

  async function showCreateOfferingForm() {
    // This would show a modal or navigate to a form page
    // For now, we'll show a simple form in the container
    const container = document.getElementById('serviceOfferingsList');
    if (!container) return;

    if (typeof ServiceProviderService === 'undefined') {
      alert('Service provider service not available');
      return;
    }

    const categoriesResult = await ServiceProviderService.getServiceCategories();
    const categories = categoriesResult.success ? categoriesResult.categories : [];

    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 style="margin-bottom: 1rem;">Create New Service Offering</h3>
          <form id="createOfferingForm" onsubmit="return serviceProvidersComponent.submitOfferingForm(event)">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="offeringTitle" class="form-label">Title *</label>
              <input type="text" id="offeringTitle" class="form-control" required>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="offeringCategory" class="form-label">Category *</label>
              <select id="offeringCategory" class="form-control" required>
                <option value="">Select Category</option>
                ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="offeringDescription" class="form-label">Description *</label>
              <textarea id="offeringDescription" class="form-control" rows="4" required></textarea>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label for="offeringPricingModel" class="form-label">Pricing Model *</label>
                <select id="offeringPricingModel" class="form-control" required>
                  <option value="project">Project-Based</option>
                  <option value="hourly">Hourly</option>
                  <option value="retainer">Retainer</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="offeringMinPrice" class="form-label">Min Price (SAR) *</label>
                <input type="number" id="offeringMinPrice" class="form-control" min="0" required>
              </div>
              
              <div class="form-group">
                <label for="offeringMaxPrice" class="form-label">Max Price (SAR) *</label>
                <input type="number" id="offeringMaxPrice" class="form-control" min="0" required>
              </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="offeringAvailability" class="form-label">Availability *</label>
              <select id="offeringAvailability" class="form-control" required>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
              <button type="submit" class="btn btn-primary">Create Offering</button>
              <button type="button" onclick="serviceProvidersComponent.cancelCreateOffering()" class="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async function submitOfferingForm(event) {
    event.preventDefault();
    
    if (typeof ServiceProviderService === 'undefined') {
      alert('Service provider service not available');
      return;
    }

    const offeringData = {
      title: document.getElementById('offeringTitle').value,
      category: document.getElementById('offeringCategory').value,
      description: document.getElementById('offeringDescription').value,
      pricingModel: document.getElementById('offeringPricingModel').value,
      priceRange: {
        min: parseFloat(document.getElementById('offeringMinPrice').value),
        max: parseFloat(document.getElementById('offeringMaxPrice').value),
        currency: 'SAR'
      },
      availability: document.getElementById('offeringAvailability').value,
      serviceAreas: [],
      certifications: [],
      portfolioItems: []
    };

    try {
      const result = await ServiceProviderService.createServiceOffering(offeringData);
      if (result.success) {
        alert('Service offering created successfully!');
        await loadMyServiceOfferings();
      } else {
        alert(`Error: ${result.error || 'Failed to create service offering'}`);
      }
    } catch (error) {
      console.error('Error creating offering:', error);
      alert('Error creating service offering. Please try again.');
    }
  }

  function cancelCreateOffering() {
    loadMyServiceOfferings();
  }

  async function editOffering(offeringId) {
    // Similar to create, but pre-fill with existing data
    alert('Edit functionality coming soon. Offering ID: ' + offeringId);
  }

  async function deleteOffering(offeringId) {
    if (!confirm('Are you sure you want to delete this service offering?')) {
      return;
    }

    if (typeof ServiceProviderService === 'undefined') {
      alert('Service provider service not available');
      return;
    }

    try {
      const result = await ServiceProviderService.deleteServiceOffering(offeringId);
      if (result.success) {
        alert('Service offering deleted successfully!');
        await loadMyServiceOfferings();
      } else {
        alert(`Error: ${result.error || 'Failed to delete service offering'}`);
      }
    } catch (error) {
      console.error('Error deleting offering:', error);
      alert('Error deleting service offering. Please try again.');
    }
  }

  // Export
  if (!window.serviceProviders) window.serviceProviders = {};
  window.serviceProviders.serviceProviders = {
    init,
    applyFilters,
    clearFilters,
    toggleViewMode,
    switchView,
    showCreateOfferingForm,
    submitOfferingForm,
    cancelCreateOffering,
    editOffering,
    deleteOffering,
    loadServiceProviders,
    loadMyServiceOfferings
  };

  // Global reference for onclick handlers
  window.serviceProvidersComponent = window.serviceProviders.serviceProviders;

})();

