/**
 * My Services Component
 * Manages service offerings for service providers
 */

(function() {
  'use strict';

  let currentFilters = {};
  let currentUser = null;
  let availableSkills = [];
  let serviceCategories = [];

  // ============================================
  // Initialization
  // ============================================
  async function init() {
    if (typeof PMTwinData === 'undefined') {
      console.error('PMTwinData not available');
      const container = document.getElementById('offeringsList');
      if (container) {
        container.innerHTML = '<p class="alert alert-error">PMTwinData not available. Please refresh the page.</p>';
      }
      return;
    }

    currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      const container = document.getElementById('offeringsList');
      if (container) {
        container.innerHTML = '<p class="alert alert-error">Please log in to view your service offerings.</p>';
      }
      return;
    }

    // Wait for ServiceOfferingService to be available
    if (typeof ServiceOfferingService === 'undefined') {
      const container = document.getElementById('offeringsList');
      if (container) {
        container.innerHTML = '<p class="alert alert-warning">Loading services... Please wait.</p>';
      }
      
      // Wait for services to load
      await new Promise((resolve) => {
        const checkService = setInterval(() => {
          if (typeof ServiceOfferingService !== 'undefined') {
            clearInterval(checkService);
            resolve();
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkService);
          resolve();
        }, 5000);
      });
      
      if (typeof ServiceOfferingService === 'undefined') {
        const container = document.getElementById('offeringsList');
        if (container) {
          container.innerHTML = '<p class="alert alert-error">Service offering service not available. Please refresh the page.</p>';
        }
        return;
      }
    }

    // Load service categories
    if (typeof ServiceProviderService !== 'undefined') {
      const categoriesResult = await ServiceProviderService.getServiceCategories();
      if (categoriesResult.success) {
        serviceCategories = categoriesResult.categories || [];
        populateCategoryFilter();
      }
    }

    // Load provider skills from profile
    loadProviderSkills();

    // Setup event listeners
    setupEventListeners();

    // Load statistics
    await loadStatistics();

    // Load offerings
    await loadOfferings();
  }
  
  // ============================================
  // Load Statistics
  // ============================================
  async function loadStatistics() {
    if (typeof ServiceOfferingService === 'undefined' || !currentUser) {
      return;
    }

    try {
      const result = await ServiceOfferingService.getProviderStatistics(currentUser.id);
      if (result.success && result.statistics) {
        renderStatistics(result.statistics);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }
  
  // ============================================
  // Render Statistics
  // ============================================
  function renderStatistics(stats) {
    const section = document.getElementById('statisticsSection');
    const content = document.getElementById('statisticsContent');
    
    if (!section || !content) return;
    
    if (stats.totalOfferings === 0) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    
    content.innerHTML = `
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${stats.totalOfferings}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Total Offerings</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-success);">${stats.activeOfferings}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Active</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${stats.totalViews}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Total Views</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${stats.totalInquiries}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Inquiries</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${stats.totalMatches}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Matches</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${stats.totalProposals}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Proposals</div>
      </div>
      ${stats.averageRating ? `
        <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
          <div style="font-size: 2rem; font-weight: 600; color: gold;">
            <i class="ph ph-star-fill"></i> ${stats.averageRating.toFixed(1)}
          </div>
          <div style="font-size: 0.9rem; color: var(--text-secondary);">Avg Rating</div>
        </div>
      ` : ''}
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${Math.round(stats.averageQualityScore)}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Avg Quality Score</div>
      </div>
    `;
  }

  // ============================================
  // Load Provider Skills
  // ============================================
  function loadProviderSkills() {
    if (!currentUser || !currentUser.profile) {
      availableSkills = [];
      return;
    }

    availableSkills = currentUser.profile.skills || [];
  }

  // ============================================
  // Populate Category Filter
  // ============================================
  function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    serviceCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categoryFilter.appendChild(option);
    });
  }

  // ============================================
  // Setup Event Listeners
  // ============================================
  function setupEventListeners() {
    const createBtn = document.getElementById('createOfferingBtn');
    if (createBtn) {
      createBtn.addEventListener('click', showCreateForm);
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', applyFilters);
    }

    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', applyFilters);
    }

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearFilters);
    }
  }

  // ============================================
  // Load Offerings
  // ============================================
  async function loadOfferings() {
    const container = document.getElementById('offeringsList');
    if (!container) return;

    try {
      if (typeof ServiceOfferingService === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Service offering service not available</p>';
        return;
      }

      const result = await ServiceOfferingService.getMyOfferings();
      
      if (result.success && result.offerings) {
        let offerings = result.offerings;
        
        // Apply filters
        if (currentFilters.status) {
          offerings = offerings.filter(o => o.status === currentFilters.status);
        }
        if (currentFilters.category) {
          offerings = offerings.filter(o => o.category === currentFilters.category);
        }

        renderOfferings(container, offerings);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load service offerings'}</p>`;
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading service offerings. Please try again.</p>';
    }
  }

  // ============================================
  // Render Offerings (Enhanced with Statistics)
  // ============================================
  function renderOfferings(container, offerings) {
    if (offerings.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p style="margin-bottom: 1rem;">You haven't created any service offerings yet.</p>
            <button onclick="myServicesComponent.showCreateForm()" class="btn btn-primary">
              <i class="ph ph-plus"></i> Create Your First Service Offering
            </button>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    offerings.forEach(offering => {
      const statusBadge = {
        'Active': { class: 'badge-success', text: 'Active' },
        'Paused': { class: 'badge-warning', text: 'Paused' },
        'Draft': { class: 'badge-secondary', text: 'Draft' },
        'Archived': { class: 'badge-dark', text: 'Archived' }
      }[offering.status] || { class: 'badge-secondary', text: offering.status || 'Unknown' };

      const priceDisplay = formatPrice(offering);
      const categoryName = serviceCategories.find(c => c.id === offering.category)?.name || offering.category;
      
      // Quality score indicator
      const qualityScore = offering.qualityScore || 0;
      const qualityColor = qualityScore >= 80 ? 'success' : qualityScore >= 50 ? 'warning' : 'danger';
      const qualityText = qualityScore >= 80 ? 'Excellent' : qualityScore >= 50 ? 'Good' : 'Needs Improvement';
      
      // Statistics
      const views = offering.views || 0;
      const inquiries = offering.inquiries || 0;
      const matches = offering.matchesGenerated || 0;
      const proposals = offering.proposalsReceived || 0;
      const rating = offering.averageRating ? offering.averageRating.toFixed(1) : null;
      
      // Collaboration models
      const collaborationModels = offering.supportedCollaborationModels || [];
      const modelNames = {
        '1.1': 'Task-Based',
        '2.2': 'Strategic Alliance'
      };

      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <h3 style="margin: 0;">${offering.title || 'Untitled Offering'}</h3>
                  ${offering.featured ? '<span class="badge badge-primary"><i class="ph ph-star"></i> Featured</span>' : ''}
                </div>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                  <span class="badge badge-info">${categoryName}</span> • 
                  ${offering.delivery_mode || 'Hybrid'} • 
                  ${offering.exchange_type || 'Cash'}${offering.exchange_type === 'Barter' ? ' <span class="badge badge-info">Barter</span>' : ''} • 
                  ${offering.exchange_type === 'Barter' ? 'Barter Exchange' : priceDisplay}
                </p>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
                <span class="badge badge-${qualityColor}" title="Quality Score: ${qualityScore}/100">
                  <i class="ph ph-chart-line"></i> ${qualityScore}% - ${qualityText}
                </span>
              </div>
            </div>
            
            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
              ${offering.shortDescription || (offering.description || '').substring(0, 200)}${offering.description && offering.description.length > 200 ? '...' : ''}
            </p>
            
            ${offering.skills && offering.skills.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                ${offering.skills.slice(0, 5).map(skill => 
                  `<span class="badge badge-secondary">${skill}</span>`
                ).join('')}
                ${offering.skills.length > 5 ? `<span class="badge badge-secondary">+${offering.skills.length - 5} more</span>` : ''}
              </div>
            ` : ''}
            
            ${collaborationModels.length > 0 ? `
              <div style="margin-bottom: 1rem;">
                <small style="color: var(--text-secondary); font-weight: 600;">Supported Collaboration Models:</small>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem;">
                  ${collaborationModels.map(modelId => 
                    `<span class="badge badge-outline">${modelNames[modelId] || modelId}</span>`
                  ).join('')}
                </div>
              </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 1rem; padding: 1rem; background: var(--bg-secondary, #f5f5f5); border-radius: var(--radius, 8px); margin-bottom: 1rem;">
              <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary);">${views}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Views</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary);">${inquiries}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Inquiries</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary);">${matches}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Matches</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary);">${proposals}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Proposals</div>
              </div>
              ${rating ? `
                <div style="text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary);">
                    <i class="ph ph-star-fill" style="color: gold;"></i> ${rating}
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-secondary);">Rating</div>
                </div>
              ` : ''}
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
              <button onclick="myServicesComponent.editOffering('${offering.id}')" class="btn btn-primary btn-sm">
                <i class="ph ph-pencil"></i> Edit
              </button>
              ${offering.status === 'Draft' ? 
                `<button onclick="myServicesComponent.publishOffering('${offering.id}')" class="btn btn-success btn-sm">
                  <i class="ph ph-paper-plane"></i> Publish
                </button>` : ''
              }
              ${offering.status === 'Active' ? 
                `<button onclick="myServicesComponent.toggleStatus('${offering.id}', 'Paused')" class="btn btn-warning btn-sm">
                  <i class="ph ph-pause"></i> Pause
                </button>` :
                offering.status === 'Paused' ?
                `<button onclick="myServicesComponent.toggleStatus('${offering.id}', 'Active')" class="btn btn-success btn-sm">
                  <i class="ph ph-play"></i> Activate
                </button>` : ''
              }
              ${offering.status !== 'Archived' ?
                `<button onclick="myServicesComponent.toggleStatus('${offering.id}', 'Archived')" class="btn btn-secondary btn-sm">
                  <i class="ph ph-archive"></i> Archive
                </button>` :
                `<button onclick="myServicesComponent.toggleStatus('${offering.id}', 'Draft')" class="btn btn-secondary btn-sm">
                  <i class="ph ph-archive"></i> Unarchive
                </button>`
              }
              <button onclick="myServicesComponent.deleteOffering('${offering.id}')" class="btn btn-danger btn-sm">
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

  // ============================================
  // Format Price
  // ============================================
  function formatPrice(offering) {
    const min = offering.price_min || 0;
    const max = offering.price_max || 0;
    const currency = offering.currency || 'SAR';
    const pricingType = offering.pricing_type || 'Fixed';

    if (pricingType === 'Hourly') {
      return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}/hour`;
    } else if (pricingType === 'Daily') {
      return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}/day`;
    } else if (pricingType === 'Milestone') {
      return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}/milestone`;
    } else {
      return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
    }
  }

  // ============================================
  // Show Create Form
  // ============================================
  async function showCreateForm() {
    const container = document.getElementById('offeringsList');
    if (!container) return;

    if (typeof ServiceOfferingService === 'undefined') {
      alert('Service offering service not available');
      return;
    }

    // Load categories if not already loaded
    if (serviceCategories.length === 0 && typeof ServiceProviderService !== 'undefined') {
      const categoriesResult = await ServiceProviderService.getServiceCategories();
      if (categoriesResult.success) {
        serviceCategories = categoriesResult.categories || [];
      }
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 style="margin-bottom: 1rem;">Create New Service Offering</h3>
          <form id="createOfferingForm" onsubmit="return myServicesComponent.submitOfferingForm(event)">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="offeringTitle" class="form-label">Title *</label>
              <input type="text" id="offeringTitle" class="form-control" required placeholder="e.g., Architectural Design Services">
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="offeringCategory" class="form-label">Category *</label>
              <select id="offeringCategory" class="form-control" required>
                <option value="">Select Category</option>
                ${serviceCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="offeringDescription" class="form-label">Description *</label>
              <textarea id="offeringDescription" class="form-control" rows="4" required placeholder="Describe your service offering in detail..."></textarea>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label">Skills *</label>
              <div id="skillsContainer" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                ${availableSkills.map(skill => `
                  <label style="display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                    <input type="checkbox" name="skills" value="${skill}" class="skill-checkbox">
                    <span>${skill}</span>
                  </label>
                `).join('')}
              </div>
              <small class="form-text">Select skills from your profile that apply to this offering</small>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label for="offeringDeliveryMode" class="form-label">Delivery Mode *</label>
                <select id="offeringDeliveryMode" class="form-control" required>
                  <option value="Onsite">Onsite</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid" selected>Hybrid</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="offeringPricingType" class="form-label">Pricing Type *</label>
                <select id="offeringPricingType" class="form-control" required>
                  <option value="Fixed">Fixed</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Daily">Daily</option>
                  <option value="Milestone">Milestone</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="offeringExchangeType" class="form-label">Exchange Type *</label>
                <select id="offeringExchangeType" class="form-control" required>
                  <option value="Cash" selected>Cash</option>
                  <option value="Barter">Barter</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label for="offeringMinPrice" class="form-label">Min Price (SAR) *</label>
                <input type="number" id="offeringMinPrice" class="form-control" min="0" step="0.01" required>
              </div>
              
              <div class="form-group">
                <label for="offeringMaxPrice" class="form-label">Max Price (SAR) *</label>
                <input type="number" id="offeringMaxPrice" class="form-control" min="0" step="0.01" required>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label for="offeringCity" class="form-label">City *</label>
                <input type="text" id="offeringCity" class="form-control" required placeholder="e.g., Riyadh">
              </div>
              
              <div class="form-group">
                <label for="offeringCountry" class="form-label">Country *</label>
                <input type="text" id="offeringCountry" class="form-control" required placeholder="e.g., Saudi Arabia">
              </div>
              
              <div class="form-group">
                <label for="offeringRadius" class="form-label">Service Radius (km)</label>
                <input type="number" id="offeringRadius" class="form-control" min="0" placeholder="Optional">
              </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="offeringExperienceLevel" class="form-label">Experience Level</label>
              <select id="offeringExperienceLevel" class="form-control">
                <option value="junior">Junior</option>
                <option value="intermediate" selected>Intermediate</option>
                <option value="senior">Senior</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="offeringStatus" class="form-label">Initial Status *</label>
              <select id="offeringStatus" class="form-control" required>
                <option value="Draft" selected>Draft (Save for later)</option>
                <option value="Active">Active (Publish immediately)</option>
                <option value="Paused">Paused</option>
              </select>
              <small class="form-text">Choose "Draft" to save and edit later, or "Active" to publish immediately.</small>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label">Collaboration Models Support</label>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="checkbox" id="supportTaskBased" checked>
                  <span>Task-Based Engagement (1.1)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="checkbox" id="supportStrategicAlliance">
                  <span>Strategic Alliances (2.2)</span>
                </label>
              </div>
              <small class="form-text">Select which collaboration models this offering supports.</small>
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
              <button type="submit" class="btn btn-primary">Create Offering</button>
              <button type="button" onclick="myServicesComponent.cancelCreate()" class="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // ============================================
  // Submit Offering Form
  // ============================================
  async function submitOfferingForm(event) {
    event.preventDefault();
    
    if (typeof ServiceOfferingService === 'undefined') {
      alert('Service offering service not available');
      return false;
    }

    // Get selected skills
    const skillCheckboxes = document.querySelectorAll('.skill-checkbox:checked');
    const selectedSkills = Array.from(skillCheckboxes).map(cb => cb.value);

    if (selectedSkills.length === 0) {
      alert('Please select at least one skill');
      return false;
    }

    // Get collaboration models
    const supportedModels = [];
    if (document.getElementById('supportTaskBased').checked) {
      supportedModels.push('1.1');
    }
    if (document.getElementById('supportStrategicAlliance').checked) {
      supportedModels.push('2.2');
    }

    const offeringData = {
      title: document.getElementById('offeringTitle').value.trim(),
      category: document.getElementById('offeringCategory').value,
      description: document.getElementById('offeringDescription').value.trim(),
      skills: selectedSkills,
      experienceLevel: document.getElementById('offeringExperienceLevel')?.value || 'intermediate',
      delivery_mode: document.getElementById('offeringDeliveryMode').value,
      pricing_type: document.getElementById('offeringPricingType').value,
      price_min: parseFloat(document.getElementById('offeringMinPrice').value),
      price_max: parseFloat(document.getElementById('offeringMaxPrice').value),
      currency: 'SAR',
      exchange_type: document.getElementById('offeringExchangeType').value,
      location: {
        city: document.getElementById('offeringCity').value.trim(),
        country: document.getElementById('offeringCountry').value.trim(),
        radius: parseInt(document.getElementById('offeringRadius').value) || 0
      },
      status: document.getElementById('offeringStatus').value,
      supportedCollaborationModels: supportedModels.length > 0 ? supportedModels : ['1.1'],
      taskBasedEngagement: {
        supported: document.getElementById('supportTaskBased').checked,
        taskTypes: ['Design', 'Engineering', 'Consultation']
      },
      strategicAlliance: {
        supported: document.getElementById('supportStrategicAlliance').checked,
        allianceTypes: [],
        targetSectors: []
      },
      portfolio_links: [],
      attachments: []
    };
    
    // Validate using service validation
    if (typeof ServiceOfferingService !== 'undefined' && ServiceOfferingService.validateOfferingData) {
      const validation = ServiceOfferingService.validateOfferingData(offeringData);
      if (!validation.valid) {
        alert(`Validation errors:\n${validation.errors.join('\n')}`);
        return false;
      }
    }

    try {
      const result = await ServiceOfferingService.createOffering(offeringData);
      if (result.success) {
        alert('Service offering created successfully!');
        await loadOfferings();
      } else {
        alert(`Error: ${result.error || 'Failed to create service offering'}`);
      }
    } catch (error) {
      console.error('Error creating offering:', error);
      alert('Error creating service offering. Please try again.');
    }

    return false;
  }

  // ============================================
  // Cancel Create
  // ============================================
  function cancelCreate() {
    loadOfferings();
  }

  // ============================================
  // Edit Offering
  // ============================================
  async function editOffering(offeringId) {
    if (typeof ServiceOfferingService === 'undefined') {
      alert('Service offering service not available');
      return;
    }

    const result = await ServiceOfferingService.getOfferingById(offeringId);
    if (!result.success) {
      alert(`Error: ${result.error || 'Failed to load offering'}`);
      return;
    }

    const offering = result.offering;
    alert('Edit functionality coming soon. Offering ID: ' + offeringId);
    // TODO: Implement edit form similar to create form
  }

  // ============================================
  // Publish Offering
  // ============================================
  async function publishOffering(offeringId) {
    if (typeof ServiceOfferingService === 'undefined') {
      alert('Service offering service not available');
      return;
    }

    try {
      const result = await ServiceOfferingService.publishOffering(offeringId);
      if (result.success) {
        alert('Service offering published successfully!');
        await loadOfferings();
      } else {
        if (result.qualityScore !== undefined) {
          alert(`Cannot publish: Quality score is ${result.qualityScore}/100. Please complete more fields to improve your offering quality.`);
        } else {
          alert(`Error: ${result.error || 'Failed to publish offering'}`);
        }
      }
    } catch (error) {
      console.error('Error publishing offering:', error);
      alert('Error publishing offering. Please try again.');
    }
  }

  // ============================================
  // Toggle Status
  // ============================================
  async function toggleStatus(offeringId, newStatus) {
    if (typeof ServiceOfferingService === 'undefined') {
      alert('Service offering service not available');
      return;
    }

    if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this service offering?`)) {
      return;
    }

    try {
      const result = await ServiceOfferingService.toggleStatus(offeringId, newStatus);
      if (result.success) {
        await loadOfferings();
      } else {
        alert(`Error: ${result.error || 'Failed to update status'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  }

  // ============================================
  // Delete Offering
  // ============================================
  async function deleteOffering(offeringId) {
    if (!confirm('Are you sure you want to delete this service offering? This action cannot be undone.')) {
      return;
    }

    if (typeof ServiceOfferingService === 'undefined') {
      alert('Service offering service not available');
      return;
    }

    try {
      const result = await ServiceOfferingService.deleteOffering(offeringId);
      if (result.success) {
        alert('Service offering deleted successfully!');
        await loadOfferings();
      } else {
        alert(`Error: ${result.error || 'Failed to delete service offering'}`);
      }
    } catch (error) {
      console.error('Error deleting offering:', error);
      alert('Error deleting service offering. Please try again.');
    }
  }

  // ============================================
  // Apply Filters
  // ============================================
  function applyFilters() {
    currentFilters = {};
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter && statusFilter.value) {
      currentFilters.status = statusFilter.value;
    }
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && categoryFilter.value) {
      currentFilters.category = categoryFilter.value;
    }
    
    loadOfferings();
  }

  // ============================================
  // Clear Filters
  // ============================================
  function clearFilters() {
    currentFilters = {};
    document.getElementById('statusFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    loadOfferings();
  }

  // ============================================
  // Export
  // ============================================
  if (!window.myServices) window.myServices = {};
  window.myServices.myServices = {
    init,
    showCreateForm,
    submitOfferingForm,
    cancelCreate,
    editOffering,
    publishOffering,
    toggleStatus,
    deleteOffering,
    loadOfferings,
    loadStatistics,
    applyFilters,
    clearFilters
  };

  // Global reference for onclick handlers
  window.myServicesComponent = window.myServices.myServices;

})();

