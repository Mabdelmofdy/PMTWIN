/**
 * Services Marketplace Component
 * Browse and filter service offerings, invite providers to proposals
 */

(function() {
  'use strict';

  let currentFilters = {};
  let currentUser = null;
  let serviceCategories = [];

  // ============================================
  // Initialization
  // ============================================
  async function init() {
    if (typeof PMTwinData === 'undefined') {
      console.error('PMTwinData not available');
      const container = document.getElementById('marketplaceOfferingsList');
      if (container) {
        container.innerHTML = '<p class="alert alert-error">PMTwinData not available. Please refresh the page.</p>';
      }
      return;
    }

    currentUser = PMTwinData.Sessions.getCurrentUser();

    // Wait for ServiceOfferingService to be available
    if (typeof ServiceOfferingService === 'undefined') {
      const container = document.getElementById('marketplaceOfferingsList');
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
        const container = document.getElementById('marketplaceOfferingsList');
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

    // Load offerings
    await loadOfferings();
  }

  // ============================================
  // Populate Category Filter
  // ============================================
  function populateCategoryFilter() {
    const categoryFilter = document.getElementById('marketplaceCategory');
    if (!categoryFilter) return;

    serviceCategories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categoryFilter.appendChild(option);
    });
  }

  // ============================================
  // Load Offerings
  // ============================================
  async function loadOfferings() {
    const container = document.getElementById('marketplaceOfferingsList');
    if (!container) return;

    try {
      if (typeof ServiceOfferingService === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Service offering service not available</p>';
        return;
      }

      const result = await ServiceOfferingService.getOfferings(currentFilters);
      
      if (result.success && result.offerings) {
        renderOfferings(container, result.offerings);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load service offerings'}</p>`;
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading service offerings. Please try again.</p>';
    }
  }

  // ============================================
  // Render Offerings (Enhanced)
  // ============================================
  function renderOfferings(container, offerings) {
    if (offerings.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <div style="margin-bottom: 1.5rem;">
              <i class="ph ph-magnifying-glass" style="font-size: 3rem; color: var(--color-secondary); margin-bottom: 1rem;"></i>
              <h3 style="margin-bottom: 0.5rem;">No service offerings found matching your criteria</h3>
              <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                Try adjusting your filters or edit your skills in your profile to align with available services.
              </p>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <button onclick="marketplaceComponent.clearFilters()" class="btn btn-primary">
                <i class="ph ph-funnel-simple"></i> Clear Filters
              </button>
              <button onclick="window.location.href='/POC/settings/index.html#profile'" class="btn btn-secondary">
                <i class="ph ph-user"></i> Edit Profile Skills
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">';
    
    offerings.forEach(offering => {
      const categoryName = serviceCategories.find(c => c.id === offering.category)?.name || offering.category;
      const priceDisplay = formatPrice(offering);
      
      // Enhanced statistics
      const views = offering.views || 0;
      const inquiries = offering.inquiries || 0;
      const matches = offering.matchesGenerated || 0;
      const proposals = offering.proposalsReceived || 0;
      const rating = offering.averageRating ? offering.averageRating.toFixed(1) : null;
      const qualityScore = offering.qualityScore || 0;
      const qualityColor = qualityScore >= 80 ? 'success' : qualityScore >= 50 ? 'warning' : 'secondary';
      
      // Collaboration models
      const collaborationModels = offering.supportedCollaborationModels || [];
      const modelNames = {
        '1.1': 'Task-Based',
        '2.2': 'Strategic Alliance'
      };
      
      // Get provider info
      let providerName = 'Service Provider';
      if (typeof PMTwinData !== 'undefined' && offering.provider_user_id) {
        const provider = PMTwinData.Users.getById(offering.provider_user_id);
        if (provider) {
          providerName = provider.profile?.name || provider.profile?.companyName || provider.email || providerName;
        }
      }

      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <h3 style="margin: 0;">${offering.title || 'Untitled Offering'}</h3>
                  ${offering.featured ? '<span class="badge badge-primary"><i class="ph ph-star"></i> Featured</span>' : ''}
                </div>
                <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);">
                  <i class="ph ph-user"></i> ${offering.providerName || providerName}
                </p>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
                <span class="badge badge-success">Active</span>
                ${qualityScore > 0 ? `
                  <span class="badge badge-${qualityColor}" title="Quality Score: ${qualityScore}/100">
                    <i class="ph ph-chart-line"></i> ${qualityScore}%
                  </span>
                ` : ''}
              </div>
            </div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span class="badge badge-info">${categoryName}</span>
              ${rating ? `
                <span class="badge badge-warning">
                  <i class="ph ph-star-fill" style="color: gold;"></i> ${rating}
                </span>
              ` : ''}
              ${views > 0 ? `
                <span class="badge badge-secondary">
                  <i class="ph ph-eye"></i> ${views} views
                </span>
              ` : ''}
            </div>
            
            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
              ${offering.shortDescription || (offering.description || '').substring(0, 150)}${offering.description && offering.description.length > 150 && !offering.shortDescription ? '...' : ''}
            </p>
            
            ${offering.needs && offering.needs.length > 0 ? `
              <div style="margin-bottom: 1rem; padding: 0.5rem; background: var(--bg-primary); border-left: 3px solid var(--color-warning); border-radius: var(--radius);">
                <strong style="color: var(--color-warning); font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">
                  <i class="ph ph-handshake"></i> Looking For:
                </strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                  ${offering.needs.slice(0, 3).map(need => `<span class="badge badge-warning" style="font-size: 0.7rem;">${need}</span>`).join('')}
                  ${offering.needs.length > 3 ? `<span class="badge badge-secondary" style="font-size: 0.7rem;">+${offering.needs.length - 3}</span>` : ''}
                </div>
              </div>
            ` : ''}
            
            ${collaborationModels.length > 0 ? `
              <div style="margin-bottom: 1rem;">
                <small style="color: var(--text-secondary); font-weight: 600;">Collaboration Models:</small>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem;">
                  ${collaborationModels.map(modelId => 
                    `<span class="badge badge-outline" style="font-size: 0.75rem;">${modelNames[modelId] || modelId}</span>`
                  ).join('')}
                </div>
              </div>
            ` : ''}
            
            ${offering.skills && offering.skills.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                ${offering.skills.slice(0, 4).map(skill => 
                  `<span class="badge badge-secondary" style="font-size: 0.75rem;">${skill}</span>`
                ).join('')}
                ${offering.skills.length > 4 ? `<span class="badge badge-secondary" style="font-size: 0.75rem;">+${offering.skills.length - 4}</span>` : ''}
              </div>
            ` : ''}
            
            <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius);">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: var(--font-size-sm);">
                <div>
                  <strong>Delivery:</strong> ${offering.delivery_mode || 'Hybrid'}
                </div>
                <div>
                  <strong>Exchange:</strong> ${offering.exchange_type || 'Cash'}
                  ${offering.exchange_type === 'Barter' ? ' <span class="badge badge-info">Barter</span>' : ''}
                </div>
                <div>
                  <strong>Location:</strong> ${offering.location?.city || 'N/A'}, ${offering.location?.country || ''}
                </div>
                <div>
                  <strong>Price:</strong> ${offering.exchange_type === 'Barter' ? 'Barter Exchange' : priceDisplay}
                </div>
              </div>
              ${offering.exchange_type === 'Barter' && offering.barter_details ? `
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
                  <div style="font-size: var(--font-size-sm);">
                    <div style="margin-bottom: 0.5rem;">
                      <strong>Accepts:</strong> ${offering.barter_details.accepts?.join(', ') || 'N/A'}
                    </div>
                    <div>
                      <strong>Offers:</strong> ${offering.barter_details.offers?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
            
            ${(views > 0 || inquiries > 0 || matches > 0 || proposals > 0) ? `
              <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-primary); border-radius: var(--radius);">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center;">
                  <div>
                    <div style="font-size: 1.25rem; font-weight: 600; color: var(--color-primary);">${views}</div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary);">Views</div>
                  </div>
                  <div>
                    <div style="font-size: 1.25rem; font-weight: 600; color: var(--color-primary);">${inquiries}</div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary);">Inquiries</div>
                  </div>
                  <div>
                    <div style="font-size: 1.25rem; font-weight: 600; color: var(--color-primary);">${matches}</div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary);">Matches</div>
                  </div>
                  <div>
                    <div style="font-size: 1.25rem; font-weight: 600; color: var(--color-primary);">${proposals}</div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary);">Proposals</div>
                  </div>
                </div>
              </div>
            ` : ''}
            
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="marketplaceComponent.viewOffering('${offering.id}')" class="btn btn-primary btn-sm" style="flex: 1;">
                <i class="ph ph-eye"></i> View Details
              </button>
              ${currentUser ? `
                <button onclick="marketplaceComponent.inviteToProposal('${offering.id}')" class="btn btn-success btn-sm" style="flex: 1;">
                  <i class="ph ph-envelope"></i> Invite
                </button>
              ` : ''}
            </div>
            
            ${offering.experienceLevel ? `
              <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color);">
                <small style="color: var(--text-secondary);">
                  <i class="ph ph-briefcase"></i> ${offering.experienceLevel.charAt(0).toUpperCase() + offering.experienceLevel.slice(1)} Level
                  ${offering.minimumExperience > 0 ? ` • ${offering.minimumExperience}+ years` : ''}
                </small>
              </div>
            ` : ''}
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
      return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}/hr`;
    } else if (pricingType === 'Daily') {
      return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}/day`;
    } else if (pricingType === 'Milestone') {
      return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}/milestone`;
    } else {
      return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
    }
  }

  // ============================================
  // View Offering Details (Enhanced)
  // ============================================
  async function viewOffering(offeringId) {
    if (typeof ServiceOfferingService === 'undefined') {
      alert('Service offering service not available');
      return;
    }

    // Increment view count
    await ServiceOfferingService.incrementViews(offeringId);

    const result = await ServiceOfferingService.getOfferingById(offeringId);
    if (!result.success) {
      alert(`Error: ${result.error || 'Failed to load offering'}`);
      return;
    }

    const offering = result.offering;
    const categoryName = serviceCategories.find(c => c.id === offering.category)?.name || offering.category;
    
    // Enhanced statistics
    const views = offering.views || 0;
    const inquiries = offering.inquiries || 0;
    const matches = offering.matchesGenerated || 0;
    const proposals = offering.proposalsReceived || 0;
    const rating = offering.averageRating ? offering.averageRating.toFixed(1) : null;
    const qualityScore = offering.qualityScore || 0;
    const qualityColor = qualityScore >= 80 ? 'success' : qualityScore >= 50 ? 'warning' : 'secondary';
    
    // Collaboration models
    const collaborationModels = offering.supportedCollaborationModels || [];
    const modelNames = {
      '1.1': 'Task-Based Engagement',
      '2.2': 'Strategic Alliance'
    };
    
    // Get provider info
    let providerName = 'Service Provider';
    let providerEmail = '';
    if (typeof PMTwinData !== 'undefined' && offering.provider_user_id) {
      const provider = PMTwinData.Users.getById(offering.provider_user_id);
      if (provider) {
        providerName = provider.profile?.name || provider.profile?.companyName || provider.email || providerName;
        providerEmail = provider.email || '';
      }
    }

    const modal = document.createElement('div');
    modal.className = 'marketplace-offering-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem;';
    
    // Escape key handler
    let escapeHandler;
    
    // Function to close modal
    const closeModal = () => {
      modal.remove();
      if (escapeHandler) {
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    
    // Escape key handler
    escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    modal.innerHTML = `
      <div class="card" style="max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <h2 style="margin: 0;">${offering.title}</h2>
            <button onclick="this.closest('.marketplace-offering-modal').remove()" class="btn btn-secondary btn-sm">
              <i class="ph ph-x"></i>
            </button>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);">
            <div>
              <p style="margin: 0 0 0.5rem 0;"><strong>Provider:</strong> ${offering.providerName || providerName}${providerEmail ? ` (${providerEmail})` : ''}</p>
              <p style="margin: 0;"><strong>Category:</strong> ${categoryName}</p>
            </div>
            <div style="text-align: right;">
              ${qualityScore > 0 ? `
                <span class="badge badge-${qualityColor}" title="Quality Score: ${qualityScore}/100">
                  <i class="ph ph-chart-line"></i> ${qualityScore}%
                </span>
              ` : ''}
              ${rating ? `
                <div style="margin-top: 0.5rem;">
                  <span class="badge badge-warning">
                    <i class="ph ph-star-fill" style="color: gold;"></i> ${rating} (${offering.totalRatings || 0} reviews)
                  </span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);">
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
          </div>
          
          <p style="margin-bottom: 1rem;"><strong>Description:</strong></p>
          <p style="margin-bottom: 1rem; white-space: pre-wrap;">${offering.description || 'No description provided'}</p>
          
          ${offering.needs && offering.needs.length > 0 ? `
            <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-primary); border-left: 3px solid var(--color-warning); border-radius: var(--radius);">
              <strong style="color: var(--color-warning); margin-bottom: 0.5rem; display: block;">
                <i class="ph ph-handshake"></i> What I Need (Services, Skills, or Resources):
              </strong>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                ${offering.needs.map(need => `<span class="badge badge-warning">${need}</span>`).join('')}
              </div>
              <small style="color: var(--text-secondary);">Services, skills, or resources this provider is looking for from others</small>
            </div>
          ` : ''}
          
          ${offering.skills && offering.skills.length > 0 ? `
            <p style="margin-bottom: 0.5rem;"><strong>Skills:</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
              ${offering.skills.map(skill => `<span class="badge badge-secondary">${skill}</span>`).join('')}
            </div>
          ` : ''}
          
          ${offering.experienceLevel ? `
            <p style="margin-bottom: 0.5rem;"><strong>Experience Level:</strong></p>
            <p style="margin-bottom: 1rem;">
              ${offering.experienceLevel.charAt(0).toUpperCase() + offering.experienceLevel.slice(1)}
              ${offering.minimumExperience > 0 ? ` • ${offering.minimumExperience}+ years experience` : ''}
            </p>
          ` : ''}
          
          ${collaborationModels.length > 0 ? `
            <p style="margin-bottom: 0.5rem;"><strong>Supported Collaboration Models:</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
              ${collaborationModels.map(modelId => 
                `<span class="badge badge-outline">${modelNames[modelId] || modelId}</span>`
              ).join('')}
            </div>
          ` : ''}
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
            <div>
              <strong>Delivery Mode:</strong> ${offering.delivery_mode || 'Hybrid'}
            </div>
            <div>
              <strong>Exchange Type:</strong> ${offering.exchange_type || 'Cash'}
              ${offering.exchange_type === 'Barter' ? ' <span class="badge badge-info">Barter</span>' : ''}
            </div>
            <div>
              <strong>Pricing Type:</strong> ${offering.pricing_type || 'Fixed'}
            </div>
            <div>
              <strong>Price Range:</strong> ${offering.exchange_type === 'Barter' ? 'Barter Exchange' : formatPrice(offering)}
            </div>
            <div>
              <strong>Location:</strong> ${offering.location?.city || 'N/A'}, ${offering.location?.country || ''}
            </div>
            ${offering.location?.radius ? `
              <div>
                <strong>Service Radius:</strong> ${offering.location.radius} km
              </div>
            ` : ''}
          </div>
          
          ${offering.exchange_type === 'Barter' && offering.barter_details ? `
            <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-primary); border: 1px solid var(--color-info); border-radius: var(--radius);">
              <strong style="color: var(--color-info);">Barter Exchange Details:</strong>
              <div style="margin-top: 0.5rem;">
                <div style="margin-bottom: 0.5rem;">
                  <strong>Accepts:</strong> ${offering.barter_details.accepts?.join(', ') || 'N/A'}
                </div>
                <div style="margin-bottom: 0.5rem;">
                  <strong>Offers:</strong> ${offering.barter_details.offers?.join(', ') || 'N/A'}
                </div>
                ${offering.barter_details.valuation_method ? `
                  <div>
                    <strong>Valuation Method:</strong> ${offering.barter_details.valuation_method}
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          ${offering.availability ? `
            <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius);">
              <strong>Availability:</strong>
              ${offering.availability.start_date ? `<div>Start Date: ${new Date(offering.availability.start_date).toLocaleDateString()}</div>` : ''}
              ${offering.availability.capacity ? `<div>Capacity: ${offering.availability.capacity} projects</div>` : ''}
              ${offering.availability.lead_time ? `<div>Lead Time: ${offering.availability.lead_time}</div>` : ''}
            </div>
          ` : ''}
          
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            ${currentUser ? `
              <button onclick="marketplaceComponent.inviteToProposal('${offering.id}'); this.closest('.marketplace-offering-modal').remove();" class="btn btn-success" style="flex: 1;">
                <i class="ph ph-envelope"></i> Invite to Proposal
              </button>
            ` : ''}
            <button onclick="this.closest('.marketplace-offering-modal').remove()" class="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add click-outside-to-close functionality
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Add escape key listener
    document.addEventListener('keydown', escapeHandler);
    
    document.body.appendChild(modal);
  }

  // ============================================
  // Invite to Proposal
  // ============================================
  async function inviteToProposal(offeringId) {
    if (!currentUser) {
      alert('Please log in to invite providers to proposals');
      return;
    }

    if (typeof ServiceOfferingService === 'undefined') {
      alert('Service offering service not available');
      return;
    }

    // Increment inquiry count when viewing details
    await ServiceOfferingService.incrementInquiries(offeringId);

    const result = await ServiceOfferingService.getOfferingById(offeringId);
    if (!result.success) {
      alert(`Error: ${result.error || 'Failed to load offering'}`);
      return;
    }

    const offering = result.offering;
    
    // Get provider user
    const provider = PMTwinData.Users.getById(offering.provider_user_id);
    if (!provider) {
      alert('Provider not found');
      return;
    }

    // Check if user has permission to create proposals
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('create_proposals');
      if (!hasPermission) {
        alert('You do not have permission to create proposals');
        return;
      }
    }

    // Navigate to proposal creation with pre-filled data
    const proposalData = {
      providerId: offering.provider_user_id,
      offeringId: offering.id,
      offeringTitle: offering.title,
      offeringCategory: offering.category,
      offeringSkills: offering.skills || [],
      offeringDescription: offering.description,
      offeringPrice: {
        min: offering.price_min,
        max: offering.price_max,
        currency: offering.currency,
        type: offering.pricing_type
      }
    };

    // Store in sessionStorage for proposal creation page to pick up
    sessionStorage.setItem('pmtwin_invite_offering', JSON.stringify(proposalData));
    
    // Navigate to proposal creation
    window.location.href = '../proposals/proposal-create.html';
  }

  // ============================================
  // Apply Filters
  // ============================================
  async function applyFilters(event) {
    event.preventDefault();
    
    currentFilters = {};
    
    const search = document.getElementById('marketplaceSearch')?.value;
    if (search) currentFilters.search = search;
    
    const category = document.getElementById('marketplaceCategory')?.value;
    if (category) currentFilters.category = category;
    
    const location = document.getElementById('marketplaceLocation')?.value;
    if (location) currentFilters.location = location;
    
    const deliveryMode = document.getElementById('marketplaceDeliveryMode')?.value;
    if (deliveryMode) currentFilters.delivery_mode = deliveryMode;
    
    const exchangeType = document.getElementById('marketplaceExchangeType')?.value;
    if (exchangeType) currentFilters.exchange_type = exchangeType;
    
    const priceMin = document.getElementById('marketplacePriceMin')?.value;
    if (priceMin) currentFilters.price_min = parseFloat(priceMin);
    
    const priceMax = document.getElementById('marketplacePriceMax')?.value;
    if (priceMax) currentFilters.price_max = parseFloat(priceMax);
    
    await loadOfferings();
  }

  // ============================================
  // Clear Filters
  // ============================================
  function clearFilters() {
    currentFilters = {};
    document.getElementById('marketplaceFiltersForm')?.reset();
    loadOfferings();
  }

  // ============================================
  // Export
  // ============================================
  if (!window.marketplace) window.marketplace = {};
  window.marketplace.marketplace = {
    init,
    loadOfferings,
    viewOffering,
    inviteToProposal,
    applyFilters,
    clearFilters
  };

  // Global reference for onclick handlers
  window.marketplaceComponent = window.marketplace.marketplace;

})();

