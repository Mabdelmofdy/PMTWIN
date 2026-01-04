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
            
            ${offering.needs && offering.needs.length > 0 ? `
              <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-primary); border-left: 3px solid var(--color-warning); border-radius: var(--radius);">
                <strong style="color: var(--color-warning); margin-bottom: 0.5rem; display: block;">
                  <i class="ph ph-handshake"></i> What I Need:
                </strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  ${offering.needs.map(need => `<span class="badge badge-warning">${need}</span>`).join('')}
                </div>
                <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">Services, skills, or resources I'm looking for from others</small>
              </div>
            ` : ''}
            
            ${offering.skills && offering.skills.length > 0 ? `
              <div style="margin-bottom: 1rem;">
                <strong style="margin-bottom: 0.5rem; display: block; font-size: 0.9rem;">
                  <i class="ph ph-star"></i> My Skills (What I Offer):
                </strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  ${offering.skills.slice(0, 5).map(skill => 
                    `<span class="badge badge-secondary">${skill}</span>`
                  ).join('')}
                  ${offering.skills.length > 5 ? `<span class="badge badge-secondary">+${offering.skills.length - 5} more</span>` : ''}
                </div>
              </div>
            ` : ''}
            
            ${offering.exchange_type === 'Barter' || offering.exchange_type === 'Mixed' ? `
              ${offering.barter_details ? `
                <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-primary); border-left: 3px solid var(--color-info); border-radius: var(--radius);">
                  <strong style="color: var(--color-info); margin-bottom: 0.5rem; display: block;">
                    <i class="ph ph-arrows-clockwise"></i> Barter Exchange Details:
                  </strong>
                  ${offering.barter_details.accepts && offering.barter_details.accepts.length > 0 ? `
                    <div style="margin-bottom: 0.5rem;">
                      <strong>Accepts:</strong>
                      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem;">
                        ${offering.barter_details.accepts.map(item => `<span class="badge badge-info">${item}</span>`).join('')}
                      </div>
                    </div>
                  ` : ''}
                  ${offering.barter_details.offers && offering.barter_details.offers.length > 0 ? `
                    <div style="margin-bottom: 0.5rem;">
                      <strong>Offers:</strong>
                      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem;">
                        ${offering.barter_details.offers.map(item => `<span class="badge badge-info">${item}</span>`).join('')}
                      </div>
                    </div>
                  ` : ''}
                  ${offering.barter_details.valuation_method ? `
                    <div>
                      <strong>Valuation Method:</strong> ${offering.barter_details.valuation_method}
                    </div>
                  ` : ''}
                </div>
              ` : ''}
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

    // Show modal to choose between Offer or Need
    showServiceTypeModal();
  }

  // ============================================
  // Show Service Type Selection Modal
  // ============================================
  function showServiceTypeModal() {
    const container = document.getElementById('offeringsList');
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 2rem auto;">
        <div class="card-body" style="text-align: center; padding: 3rem;">
          <h3 style="margin-bottom: 1.5rem;">What would you like to create?</h3>
          <p style="margin-bottom: 2rem; color: var(--text-secondary);">Choose whether you want to offer a service or express a need</p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <button onclick="myServicesComponent.showCreateFormForType('offer')" class="btn btn-primary" style="padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; min-height: 200px;">
              <i class="ph ph-star" style="font-size: 3rem;"></i>
              <div>
                <strong style="font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">I Want to Offer</strong>
                <span style="font-size: 0.9rem; opacity: 0.9;">Showcase your skills and services</span>
              </div>
            </button>
            
            <button onclick="myServicesComponent.showCreateFormForType('need')" class="btn btn-warning" style="padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; min-height: 200px;">
              <i class="ph ph-handshake" style="font-size: 3rem;"></i>
              <div>
                <strong style="font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">I Have a Need</strong>
                <span style="font-size: 0.9rem; opacity: 0.9;">Express what services or resources you need</span>
              </div>
            </button>
          </div>
          
          <button onclick="myServicesComponent.loadOfferings()" class="btn btn-secondary">
            <i class="ph ph-arrow-left"></i> Cancel
          </button>
        </div>
      </div>
    `;
  }

  // ============================================
  // Show Create Form for Specific Type
  // ============================================
  async function showCreateFormForType(type) {
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

    // Determine which sections to show/hide based on type
    const showOfferSection = type === 'offer';
    const showNeedsSection = type === 'need';

    const formTitle = type === 'offer' ? 'Create New Service Offering' : 'Express a Service Need';
    const offerSectionDisplay = showOfferSection ? 'block' : 'none';
    const needsSectionDisplay = showNeedsSection ? 'block' : 'none';
    const offerRequired = showOfferSection ? 'required' : '';
    const needsRequired = showNeedsSection ? 'required' : '';

    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin: 0;">${formTitle}</h3>
            <button onclick="myServicesComponent.showServiceTypeModal()" class="btn btn-sm btn-secondary">
              <i class="ph ph-arrow-left"></i> Change Type
            </button>
          </div>
          <form id="createOfferingForm" onsubmit="return myServicesComponent.submitOfferingForm(event)">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="offeringTitle" class="form-label">Title *</label>
              <input type="text" id="offeringTitle" class="form-control" required placeholder="${type === 'offer' ? 'e.g., Architectural Design Services' : 'e.g., Need Marketing Services'}">
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
              <textarea id="offeringDescription" class="form-control" rows="4" required placeholder="${type === 'offer' ? 'Describe your service offering in detail...' : 'Describe what you need in detail...'}"></textarea>
            </div>
            
            <!-- What I Offer Section -->
            <div class="card" style="margin-bottom: 1.5rem; border: 2px solid var(--color-primary); display: ${showOfferSection ? 'block' : 'none'};">
              <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <h4 style="margin: 0; color: var(--color-primary);">
                    <i class="ph ph-star"></i> What I Offer (My Skills) ${showOfferSection ? '*' : ''}
                  </h4>
                  <button type="button" onclick="myServicesComponent.toggleOfferSection()" class="btn btn-sm btn-secondary">
                    <i class="ph ph-eye-slash"></i>
                  </button>
                </div>
                <div id="offerSectionContent" style="display: ${offerSectionDisplay};">
                  <div id="skillsContainer" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                    ${availableSkills.map(skill => `
                      <label style="display: flex; align-items: center; gap: 0.25rem; cursor: pointer; padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius);">
                        <input type="checkbox" name="skills" value="${skill}" class="skill-checkbox" ${showOfferSection ? offerRequired : ''}>
                        <span>${skill}</span>
                      </label>
                    `).join('')}
                  </div>
                  <small class="form-text">Select skills from your profile that you can offer in this service</small>
                </div>
              </div>
            </div>
            
            <!-- What I Need Section -->
            <div class="card" style="margin-bottom: 1.5rem; border: 2px solid var(--color-warning); display: ${showNeedsSection ? 'block' : 'none'};">
              <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <h4 style="margin: 0; color: var(--color-warning);">
                    <i class="ph ph-handshake"></i> What I Need (Services, Skills, or Resources) ${showNeedsSection ? '*' : ''}
                  </h4>
                  <button type="button" onclick="myServicesComponent.toggleNeedsSection()" class="btn btn-sm btn-secondary">
                    <i class="ph ph-eye-slash"></i>
                  </button>
                </div>
                <div id="needsSectionContent" style="display: ${needsSectionDisplay};">
                  <div class="form-group" style="margin-bottom: 1rem;">
                    <textarea id="offeringNeeds" class="form-control" rows="3" ${showNeedsSection ? needsRequired : ''} placeholder="e.g., Marketing services, IT support, Legal consultation, Construction materials, Office space, etc. (comma-separated)" oninput="myServicesComponent.updateNeedsPreview()"></textarea>
                    <small class="form-text">Express what services, skills, or resources you need from others. This helps potential collaborators understand how they can help you or what you're looking for in partnerships.</small>
                  </div>
                  <div id="needsPreview" style="display: none; margin-top: 0.5rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius);">
                    <strong style="font-size: 0.85rem; margin-bottom: 0.5rem; display: block;">Preview:</strong>
                    <div id="needsPreviewContent" style="display: flex; flex-wrap: wrap; gap: 0.5rem;"></div>
                  </div>
                </div>
              </div>
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
                <select id="offeringExchangeType" class="form-control" required onchange="myServicesComponent.handleExchangeTypeChange()">
                  <option value="Cash" selected>Cash</option>
                  <option value="Barter">Barter</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
            </div>
            
            <div id="barterDetailsSection" style="display: none; margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);">
              <h4 style="margin-bottom: 1rem;">Barter Exchange Details</h4>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label for="barterAccepts" class="form-label">What I Accept (comma-separated)</label>
                <input type="text" id="barterAccepts" class="form-control" placeholder="e.g., Construction Materials, Equipment Rental, Labor Services">
                <small class="form-text">List items or services you're willing to accept in exchange</small>
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label for="barterOffers" class="form-label">What I Offer (comma-separated)</label>
                <input type="text" id="barterOffers" class="form-control" placeholder="e.g., Design Services, Engineering Consultation, Project Management">
                <small class="form-text">List what you're offering in this barter exchange</small>
              </div>
              <div class="form-group">
                <label for="barterValuationMethod" class="form-label">Valuation Method</label>
                <select id="barterValuationMethod" class="form-control">
                  <option value="Market Value">Market Value</option>
                  <option value="Hourly Rate Equivalent">Hourly Rate Equivalent</option>
                  <option value="Service Hour Equivalent">Service Hour Equivalent</option>
                  <option value="Training Hour Equivalent">Training Hour Equivalent</option>
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

    // Determine form type based on visible sections
    const offerSection = document.querySelector('#offerSectionContent');
    const needsSection = document.querySelector('#needsSectionContent');
    const offerCard = offerSection ? offerSection.closest('.card') : null;
    const needsCard = needsSection ? needsSection.closest('.card') : null;
    
    const isOfferType = offerCard && offerCard.style.display !== 'none' && offerSection && offerSection.style.display !== 'none';
    const isNeedType = needsCard && needsCard.style.display !== 'none' && needsSection && needsSection.style.display !== 'none';

    // Get selected skills
    const skillCheckboxes = document.querySelectorAll('.skill-checkbox:checked');
    const selectedSkills = Array.from(skillCheckboxes).map(cb => cb.value);

    // Validate based on form type
    if (isOfferType && selectedSkills.length === 0) {
      alert('Please select at least one skill for your service offering');
      return false;
    }

    // Get service needs
    const needsInput = document.getElementById('offeringNeeds')?.value.trim();
    const serviceNeeds = needsInput ? needsInput.split(',').map(s => s.trim()).filter(s => s) : [];

    if (isNeedType && serviceNeeds.length === 0) {
      alert('Please specify what services, skills, or resources you need');
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

    // Get exchange type
    const exchangeType = document.getElementById('offeringExchangeType').value;
    
    // Get barter details if Barter or Mixed
    let barterDetails = null;
    if (exchangeType === 'Barter' || exchangeType === 'Mixed') {
      const acceptsInput = document.getElementById('barterAccepts')?.value.trim();
      const offersInput = document.getElementById('barterOffers')?.value.trim();
      const valuationMethod = document.getElementById('barterValuationMethod')?.value || 'Market Value';
      
      if (acceptsInput || offersInput) {
        barterDetails = {
          accepts: acceptsInput ? acceptsInput.split(',').map(s => s.trim()).filter(s => s) : [],
          offers: offersInput ? offersInput.split(',').map(s => s.trim()).filter(s => s) : [],
          valuation_method: valuationMethod
        };
      }
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
      exchange_type: exchangeType,
      needs: serviceNeeds,
      barter_details: barterDetails,
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
    const container = document.getElementById('offeringsList');
    if (!container) return;

    // Load categories if not already loaded
    if (serviceCategories.length === 0 && typeof ServiceProviderService !== 'undefined') {
      const categoriesResult = await ServiceProviderService.getServiceCategories();
      if (categoriesResult.success) {
        serviceCategories = categoriesResult.categories || [];
      }
    }

    // Pre-select skills
    const selectedSkills = offering.skills || [];
    
    // Pre-select collaboration models
    const supportedModels = offering.supportedCollaborationModels || ['1.1'];
    
    // Get barter details
    const barterDetails = offering.barter_details || null;
    const needsArray = offering.needs || [];
    const needsText = needsArray.join(', ');

    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3 style="margin-bottom: 1rem;">Edit Service Offering</h3>
          <form id="editOfferingForm" onsubmit="return myServicesComponent.submitEditForm(event, '${offering.id}')">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="editOfferingTitle" class="form-label">Title *</label>
              <input type="text" id="editOfferingTitle" class="form-control" required placeholder="e.g., Architectural Design Services" value="${(offering.title || '').replace(/"/g, '&quot;')}">
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="editOfferingCategory" class="form-label">Category *</label>
              <select id="editOfferingCategory" class="form-control" required>
                <option value="">Select Category</option>
                ${serviceCategories.map(cat => `<option value="${cat.id}" ${cat.id === offering.category ? 'selected' : ''}>${cat.name}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="editOfferingDescription" class="form-label">Description *</label>
              <textarea id="editOfferingDescription" class="form-control" rows="4" required placeholder="Describe your service offering in detail...">${(offering.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
            </div>
            
            <!-- What I Offer Section (Edit) -->
            <div class="card" style="margin-bottom: 1.5rem; border: 2px solid var(--color-primary);">
              <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <h4 style="margin: 0; color: var(--color-primary);">
                    <i class="ph ph-star"></i> What I Offer (My Skills) *
                  </h4>
                  <button type="button" onclick="myServicesComponent.toggleEditOfferSection()" class="btn btn-sm btn-secondary">
                    <i class="ph ph-eye-slash"></i>
                  </button>
                </div>
                <div id="editOfferSectionContent">
                  <div id="editSkillsContainer" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                    ${availableSkills.map(skill => `
                      <label style="display: flex; align-items: center; gap: 0.25rem; cursor: pointer; padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius);">
                        <input type="checkbox" name="editSkills" value="${skill}" class="edit-skill-checkbox" ${selectedSkills.includes(skill) ? 'checked' : ''}>
                        <span>${skill}</span>
                      </label>
                    `).join('')}
                  </div>
                  <small class="form-text">Select skills from your profile that you can offer in this service</small>
                </div>
              </div>
            </div>
            
            <!-- What I Need Section (Edit) -->
            <div class="card" style="margin-bottom: 1.5rem; border: 2px solid var(--color-warning);">
              <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <h4 style="margin: 0; color: var(--color-warning);">
                    <i class="ph ph-handshake"></i> What I Need (Services, Skills, or Resources)
                  </h4>
                  <button type="button" onclick="myServicesComponent.toggleEditNeedsSection()" class="btn btn-sm btn-secondary">
                    <i class="ph ph-eye-slash"></i>
                  </button>
                </div>
                <div id="editNeedsSectionContent">
                  <div class="form-group" style="margin-bottom: 1rem;">
                    <textarea id="editOfferingNeeds" class="form-control" rows="3" placeholder="e.g., Marketing services, IT support, Legal consultation, Construction materials, Office space, etc. (comma-separated)" oninput="myServicesComponent.updateEditNeedsPreview()">${needsText}</textarea>
                    <small class="form-text">Express what services, skills, or resources you need from others. This helps potential collaborators understand how they can help you or what you're looking for in partnerships.</small>
                  </div>
                  <div id="editNeedsPreview" style="display: ${needsArray.length > 0 ? 'block' : 'none'}; margin-top: 0.5rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius);">
                    <strong style="font-size: 0.85rem; margin-bottom: 0.5rem; display: block;">Preview:</strong>
                    <div id="editNeedsPreviewContent" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                      ${needsArray.map(need => `<span class="badge badge-warning">${need}</span>`).join('')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label for="editOfferingDeliveryMode" class="form-label">Delivery Mode *</label>
                <select id="editOfferingDeliveryMode" class="form-control" required>
                  <option value="Onsite" ${offering.delivery_mode === 'Onsite' ? 'selected' : ''}>Onsite</option>
                  <option value="Remote" ${offering.delivery_mode === 'Remote' ? 'selected' : ''}>Remote</option>
                  <option value="Hybrid" ${offering.delivery_mode === 'Hybrid' || !offering.delivery_mode ? 'selected' : ''}>Hybrid</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="editOfferingPricingType" class="form-label">Pricing Type *</label>
                <select id="editOfferingPricingType" class="form-control" required>
                  <option value="Fixed" ${offering.pricing_type === 'Fixed' ? 'selected' : ''}>Fixed</option>
                  <option value="Hourly" ${offering.pricing_type === 'Hourly' ? 'selected' : ''}>Hourly</option>
                  <option value="Daily" ${offering.pricing_type === 'Daily' ? 'selected' : ''}>Daily</option>
                  <option value="Milestone" ${offering.pricing_type === 'Milestone' ? 'selected' : ''}>Milestone</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="editOfferingExchangeType" class="form-label">Exchange Type *</label>
                <select id="editOfferingExchangeType" class="form-control" required onchange="myServicesComponent.handleEditExchangeTypeChange()">
                  <option value="Cash" ${offering.exchange_type === 'Cash' || !offering.exchange_type ? 'selected' : ''}>Cash</option>
                  <option value="Barter" ${offering.exchange_type === 'Barter' ? 'selected' : ''}>Barter</option>
                  <option value="Mixed" ${offering.exchange_type === 'Mixed' ? 'selected' : ''}>Mixed</option>
                </select>
              </div>
            </div>
            
            <div id="editBarterDetailsSection" style="display: ${(offering.exchange_type === 'Barter' || offering.exchange_type === 'Mixed') ? 'block' : 'none'}; margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);">
              <h4 style="margin-bottom: 1rem;">Barter Exchange Details</h4>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label for="editBarterAccepts" class="form-label">What I Accept (comma-separated)</label>
                <input type="text" id="editBarterAccepts" class="form-control" placeholder="e.g., Construction Materials, Equipment Rental, Labor Services" value="${barterDetails?.accepts?.join(', ') || ''}">
                <small class="form-text">List items or services you're willing to accept in exchange</small>
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label for="editBarterOffers" class="form-label">What I Offer (comma-separated)</label>
                <input type="text" id="editBarterOffers" class="form-control" placeholder="e.g., Design Services, Engineering Consultation, Project Management" value="${barterDetails?.offers?.join(', ') || ''}">
                <small class="form-text">List what you're offering in this barter exchange</small>
              </div>
              <div class="form-group">
                <label for="editBarterValuationMethod" class="form-label">Valuation Method</label>
                <select id="editBarterValuationMethod" class="form-control">
                  <option value="Market Value" ${barterDetails?.valuation_method === 'Market Value' || !barterDetails?.valuation_method ? 'selected' : ''}>Market Value</option>
                  <option value="Hourly Rate Equivalent" ${barterDetails?.valuation_method === 'Hourly Rate Equivalent' ? 'selected' : ''}>Hourly Rate Equivalent</option>
                  <option value="Service Hour Equivalent" ${barterDetails?.valuation_method === 'Service Hour Equivalent' ? 'selected' : ''}>Service Hour Equivalent</option>
                  <option value="Training Hour Equivalent" ${barterDetails?.valuation_method === 'Training Hour Equivalent' ? 'selected' : ''}>Training Hour Equivalent</option>
                </select>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label for="editOfferingMinPrice" class="form-label">Min Price (SAR) *</label>
                <input type="number" id="editOfferingMinPrice" class="form-control" min="0" step="0.01" required value="${offering.price_min || 0}">
              </div>
              
              <div class="form-group">
                <label for="editOfferingMaxPrice" class="form-label">Max Price (SAR) *</label>
                <input type="number" id="editOfferingMaxPrice" class="form-control" min="0" step="0.01" required value="${offering.price_max || 0}">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label for="editOfferingCity" class="form-label">City *</label>
                <input type="text" id="editOfferingCity" class="form-control" required placeholder="e.g., Riyadh" value="${offering.location?.city || ''}">
              </div>
              
              <div class="form-group">
                <label for="editOfferingCountry" class="form-label">Country *</label>
                <input type="text" id="editOfferingCountry" class="form-control" required placeholder="e.g., Saudi Arabia" value="${offering.location?.country || ''}">
              </div>
              
              <div class="form-group">
                <label for="editOfferingRadius" class="form-label">Service Radius (km)</label>
                <input type="number" id="editOfferingRadius" class="form-control" min="0" placeholder="Optional" value="${offering.location?.radius || 0}">
              </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="editOfferingExperienceLevel" class="form-label">Experience Level</label>
              <select id="editOfferingExperienceLevel" class="form-control">
                <option value="junior" ${offering.experienceLevel === 'junior' ? 'selected' : ''}>Junior</option>
                <option value="intermediate" ${offering.experienceLevel === 'intermediate' || !offering.experienceLevel ? 'selected' : ''}>Intermediate</option>
                <option value="senior" ${offering.experienceLevel === 'senior' ? 'selected' : ''}>Senior</option>
                <option value="expert" ${offering.experienceLevel === 'expert' ? 'selected' : ''}>Expert</option>
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label for="editOfferingStatus" class="form-label">Status *</label>
              <select id="editOfferingStatus" class="form-control" required>
                <option value="Draft" ${offering.status === 'Draft' ? 'selected' : ''}>Draft</option>
                <option value="Active" ${offering.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Paused" ${offering.status === 'Paused' ? 'selected' : ''}>Paused</option>
                <option value="Archived" ${offering.status === 'Archived' ? 'selected' : ''}>Archived</option>
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label">Collaboration Models Support</label>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="checkbox" id="editSupportTaskBased" ${supportedModels.includes('1.1') ? 'checked' : ''}>
                  <span>Task-Based Engagement (1.1)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="checkbox" id="editSupportStrategicAlliance" ${supportedModels.includes('2.2') ? 'checked' : ''}>
                  <span>Strategic Alliances (2.2)</span>
                </label>
              </div>
              <small class="form-text">Select which collaboration models this offering supports.</small>
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
              <button type="submit" class="btn btn-primary">Update Offering</button>
              <button type="button" onclick="myServicesComponent.cancelEdit()" class="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // ============================================
  // Submit Edit Form
  // ============================================
  async function submitEditForm(event, offeringId) {
    event.preventDefault();
    
    if (typeof ServiceOfferingService === 'undefined') {
      alert('Service offering service not available');
      return false;
    }

    // Get selected skills
    const skillCheckboxes = document.querySelectorAll('.edit-skill-checkbox:checked');
    const selectedSkills = Array.from(skillCheckboxes).map(cb => cb.value);

    if (selectedSkills.length === 0) {
      alert('Please select at least one skill');
      return false;
    }

    // Get collaboration models
    const supportedModels = [];
    if (document.getElementById('editSupportTaskBased').checked) {
      supportedModels.push('1.1');
    }
    if (document.getElementById('editSupportStrategicAlliance').checked) {
      supportedModels.push('2.2');
    }

    // Get exchange type
    const exchangeType = document.getElementById('editOfferingExchangeType').value;
    
    // Get barter details if Barter or Mixed
    let barterDetails = null;
    if (exchangeType === 'Barter' || exchangeType === 'Mixed') {
      const acceptsInput = document.getElementById('editBarterAccepts')?.value.trim();
      const offersInput = document.getElementById('editBarterOffers')?.value.trim();
      const valuationMethod = document.getElementById('editBarterValuationMethod')?.value || 'Market Value';
      
      if (acceptsInput || offersInput) {
        barterDetails = {
          accepts: acceptsInput ? acceptsInput.split(',').map(s => s.trim()).filter(s => s) : [],
          offers: offersInput ? offersInput.split(',').map(s => s.trim()).filter(s => s) : [],
          valuation_method: valuationMethod
        };
      }
    }
    
    // Get service needs
    const needsInput = document.getElementById('editOfferingNeeds')?.value.trim();
    const serviceNeeds = needsInput ? needsInput.split(',').map(s => s.trim()).filter(s => s) : [];

    const offeringData = {
      title: document.getElementById('editOfferingTitle').value.trim(),
      category: document.getElementById('editOfferingCategory').value,
      description: document.getElementById('editOfferingDescription').value.trim(),
      skills: selectedSkills,
      experienceLevel: document.getElementById('editOfferingExperienceLevel')?.value || 'intermediate',
      delivery_mode: document.getElementById('editOfferingDeliveryMode').value,
      pricing_type: document.getElementById('editOfferingPricingType').value,
      price_min: parseFloat(document.getElementById('editOfferingMinPrice').value),
      price_max: parseFloat(document.getElementById('editOfferingMaxPrice').value),
      currency: 'SAR',
      exchange_type: exchangeType,
      needs: serviceNeeds,
      barter_details: barterDetails,
      location: {
        city: document.getElementById('editOfferingCity').value.trim(),
        country: document.getElementById('editOfferingCountry').value.trim(),
        radius: parseInt(document.getElementById('editOfferingRadius').value) || 0
      },
      status: document.getElementById('editOfferingStatus').value,
      supportedCollaborationModels: supportedModels.length > 0 ? supportedModels : ['1.1'],
      taskBasedEngagement: {
        supported: document.getElementById('editSupportTaskBased').checked,
        taskTypes: ['Design', 'Engineering', 'Consultation']
      },
      strategicAlliance: {
        supported: document.getElementById('editSupportStrategicAlliance').checked,
        allianceTypes: [],
        targetSectors: []
      }
    };
    
    // Validate using service validation
    if (typeof ServiceOfferingService !== 'undefined' && ServiceOfferingService.validateOfferingData) {
      const validation = ServiceOfferingService.validateOfferingData(offeringData, true);
      if (!validation.valid) {
        alert(`Validation errors:\n${validation.errors.join('\n')}`);
        return false;
      }
    }

    try {
      const result = await ServiceOfferingService.updateOffering(offeringId, offeringData);
      if (result.success) {
        alert('Service offering updated successfully!');
        await loadOfferings();
      } else {
        alert(`Error: ${result.error || 'Failed to update service offering'}`);
      }
    } catch (error) {
      console.error('Error updating offering:', error);
      alert('Error updating service offering. Please try again.');
    }

    return false;
  }

  // ============================================
  // Cancel Edit
  // ============================================
  function cancelEdit() {
    loadOfferings();
  }

  // ============================================
  // Handle Edit Exchange Type Change
  // ============================================
  function handleEditExchangeTypeChange() {
    const exchangeType = document.getElementById('editOfferingExchangeType')?.value;
    const barterSection = document.getElementById('editBarterDetailsSection');
    
    if (barterSection) {
      if (exchangeType === 'Barter' || exchangeType === 'Mixed') {
        barterSection.style.display = 'block';
      } else {
        barterSection.style.display = 'none';
      }
    }
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
  // Handle Exchange Type Change
  // ============================================
  function handleExchangeTypeChange() {
    const exchangeType = document.getElementById('offeringExchangeType')?.value;
    const barterSection = document.getElementById('barterDetailsSection');
    
    if (barterSection) {
      if (exchangeType === 'Barter' || exchangeType === 'Mixed') {
        barterSection.style.display = 'block';
      } else {
        barterSection.style.display = 'none';
      }
    }
  }

  // ============================================
  // Toggle Offer Section (Create Form)
  // ============================================
  function toggleOfferSection(e) {
    const content = document.getElementById('offerSectionContent');
    if (!content) return;
    
    const button = (e && e.target) ? e.target.closest('button') : document.querySelector('button[onclick*="toggleOfferSection"]');
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    
    if (button) {
      const icon = button.querySelector('i');
      if (icon) {
        icon.className = isHidden ? 'ph ph-eye-slash' : 'ph ph-eye';
      }
    }
  }

  // ============================================
  // Toggle Needs Section (Create Form)
  // ============================================
  function toggleNeedsSection(e) {
    const content = document.getElementById('needsSectionContent');
    if (!content) return;
    
    const button = (e && e.target) ? e.target.closest('button') : document.querySelector('button[onclick*="toggleNeedsSection"]');
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    
    if (button) {
      const icon = button.querySelector('i');
      if (icon) {
        icon.className = isHidden ? 'ph ph-eye-slash' : 'ph ph-eye';
      }
    }
  }

  // ============================================
  // Toggle Edit Offer Section
  // ============================================
  function toggleEditOfferSection(e) {
    const content = document.getElementById('editOfferSectionContent');
    if (!content) return;
    
    const button = (e && e.target) ? e.target.closest('button') : document.querySelector('button[onclick*="toggleEditOfferSection"]');
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    
    if (button) {
      const icon = button.querySelector('i');
      if (icon) {
        icon.className = isHidden ? 'ph ph-eye-slash' : 'ph ph-eye';
      }
    }
  }

  // ============================================
  // Toggle Edit Needs Section
  // ============================================
  function toggleEditNeedsSection(e) {
    const content = document.getElementById('editNeedsSectionContent');
    if (!content) return;
    
    const button = (e && e.target) ? e.target.closest('button') : document.querySelector('button[onclick*="toggleEditNeedsSection"]');
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    
    if (button) {
      const icon = button.querySelector('i');
      if (icon) {
        icon.className = isHidden ? 'ph ph-eye-slash' : 'ph ph-eye';
      }
    }
  }

  // ============================================
  // Update Needs Preview (Create Form)
  // ============================================
  function updateNeedsPreview() {
    const needsInput = document.getElementById('offeringNeeds');
    const preview = document.getElementById('needsPreview');
    const previewContent = document.getElementById('needsPreviewContent');
    
    if (!needsInput || !preview || !previewContent) return;
    
    const needsText = needsInput.value.trim();
    if (!needsText) {
      preview.style.display = 'none';
      return;
    }
    
    const needsArray = needsText.split(',').map(s => s.trim()).filter(s => s);
    
    if (needsArray.length === 0) {
      preview.style.display = 'none';
      return;
    }
    
    preview.style.display = 'block';
    previewContent.innerHTML = needsArray.map(need => 
      `<span class="badge badge-warning">${need}</span>`
    ).join('');
  }

  // ============================================
  // Update Edit Needs Preview
  // ============================================
  function updateEditNeedsPreview() {
    const needsInput = document.getElementById('editOfferingNeeds');
    const preview = document.getElementById('editNeedsPreview');
    const previewContent = document.getElementById('editNeedsPreviewContent');
    
    if (!needsInput || !preview || !previewContent) return;
    
    const needsText = needsInput.value.trim();
    if (!needsText) {
      preview.style.display = 'none';
      return;
    }
    
    const needsArray = needsText.split(',').map(s => s.trim()).filter(s => s);
    
    if (needsArray.length === 0) {
      preview.style.display = 'none';
      return;
    }
    
    preview.style.display = 'block';
    previewContent.innerHTML = needsArray.map(need => 
      `<span class="badge badge-warning">${need}</span>`
    ).join('');
  }

  // ============================================
  // Export
  // ============================================
  if (!window.myServices) window.myServices = {};
  window.myServices.myServices = {
    init,
    showCreateForm,
    showServiceTypeModal,
    showCreateFormForType,
    submitOfferingForm,
    cancelCreate,
    editOffering,
    submitEditForm,
    cancelEdit,
    publishOffering,
    toggleStatus,
    deleteOffering,
    loadOfferings,
    loadStatistics,
    applyFilters,
    clearFilters,
    handleExchangeTypeChange,
    handleEditExchangeTypeChange,
    toggleOfferSection,
    toggleNeedsSection,
    toggleEditOfferSection,
    toggleEditNeedsSection,
    updateNeedsPreview,
    updateEditNeedsPreview
  };

  // Global reference for onclick handlers
  window.myServicesComponent = window.myServices.myServices;

})();

