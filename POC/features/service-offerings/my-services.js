/**
 * My Services Component
 * Manages service offers and engagements for service providers
 * Updated to match new Service Provider architecture
 */

(function() {
  'use strict';

  let currentUser = null;
  let currentTab = 'offers'; // 'offers' or 'engagements'
  let currentFilters = {
    offers: { status: '' },
    engagements: { status: '' }
  };
  let offers = [];
  let engagements = [];

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

  // ============================================
  // Initialization
  // ============================================
  async function init() {
    if (typeof PMTwinData === 'undefined') {
      console.error('PMTwinData not available');
      const container = document.getElementById('offersList');
      if (container) {
        container.innerHTML = '<p class="alert alert-error">PMTwinData not available. Please refresh the page.</p>';
      }
      return;
    }

    currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      const container = document.getElementById('offersList');
      if (container) {
        container.innerHTML = '<p class="alert alert-error">Please log in to view your services.</p>';
      }
      return;
    }

    // Check if user is a service provider
    const userRole = currentUser.role;
    if (userRole !== 'skill_service_provider') {
      const container = document.getElementById('offersList');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-warning">
            <p><strong>Access Restricted</strong></p>
            <p>This page is only available for Service Providers. Your current role is: <strong>${userRole || 'Unknown'}</strong></p>
            <p>Please contact an administrator to update your role to "skill_service_provider".</p>
          </div>
        `;
      }
      return;
    }

    // Wait for services to load
    console.log('[MyServices] Waiting for services to load...');
    await waitForServices();

    // Setup event listeners
    setupEventListeners();

    // Load statistics
    await loadStatistics();

    // Load initial data
    await loadData();
    
    console.log('[MyServices] Initialization complete');
  }

  // ============================================
  // Wait for Services
  // ============================================
  async function waitForServices() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds
      
      const checkServices = setInterval(() => {
        attempts++;
        const hasOfferService = typeof ServiceOfferService !== 'undefined';
        const hasEngagementService = typeof ServiceEngagementService !== 'undefined';
        const hasRequestService = typeof ServiceRequestService !== 'undefined';
        
        if (hasOfferService && hasEngagementService && hasRequestService) {
          clearInterval(checkServices);
          console.log('[MyServices] All services loaded successfully');
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkServices);
          console.warn('[MyServices] Services timeout - some services may not be available:', {
            ServiceOfferService: hasOfferService,
            ServiceEngagementService: hasEngagementService,
            ServiceRequestService: hasRequestService
          });
          resolve();
        }
      }, 100);
    });
  }

  // ============================================
  // Setup Event Listeners
  // ============================================
  function setupEventListeners() {
    // Tab switching - use both addEventListener and onclick as fallback
    const offersTab = document.getElementById('offersTab');
    const engagementsTab = document.getElementById('engagementsTab');
    
    if (offersTab) {
      offersTab.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[MyServices] Offers tab clicked');
        switchTab('offers');
      });
      // Also set onclick as fallback
      offersTab.onclick = (e) => {
        e.preventDefault();
        switchTab('offers');
      };
    } else {
      console.warn('[MyServices] Offers tab button not found');
    }
    
    if (engagementsTab) {
      engagementsTab.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[MyServices] Engagements tab clicked');
        switchTab('engagements');
      });
      // Also set onclick as fallback
      engagementsTab.onclick = (e) => {
        e.preventDefault();
        switchTab('engagements');
      };
    } else {
      console.warn('[MyServices] Engagements tab button not found');
    }

    // Filters
    const offerStatusFilter = document.getElementById('offerStatusFilter');
    if (offerStatusFilter) {
      offerStatusFilter.addEventListener('change', applyOfferFilters);
    }

    const engagementStatusFilter = document.getElementById('engagementStatusFilter');
    if (engagementStatusFilter) {
      engagementStatusFilter.addEventListener('change', applyEngagementFilters);
    }

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearFilters);
    }

    const clearFiltersBtn2 = document.getElementById('clearFiltersBtn2');
    if (clearFiltersBtn2) {
      clearFiltersBtn2.addEventListener('click', clearFilters);
    }
  }

  // ============================================
  // Switch Tab
  // ============================================
  function switchTab(tab) {
    console.log('[MyServices] Switching to tab:', tab);
    currentTab = tab;
    
    // Update tab buttons
    const offersTab = document.getElementById('offersTab');
    const engagementsTab = document.getElementById('engagementsTab');
    const offersContent = document.getElementById('offersContent');
    const engagementsContent = document.getElementById('engagementsContent');
    const offersFilters = document.getElementById('offersFilters');
    const engagementsFilters = document.getElementById('engagementsFilters');
    
    if (!offersTab || !engagementsTab) {
      console.error('[MyServices] Tab buttons not found:', {
        offersTab: !!offersTab,
        engagementsTab: !!engagementsTab
      });
      return;
    }
    
    if (tab === 'offers') {
      // Activate offers tab
      offersTab.classList.add('active');
      offersTab.style.borderBottomColor = 'var(--color-primary)';
      offersTab.style.borderBottomWidth = '3px';
      offersTab.style.borderBottomStyle = 'solid';
      offersTab.style.color = 'var(--color-primary)';
      offersTab.style.fontWeight = '600';
      
      // Deactivate engagements tab
      engagementsTab.classList.remove('active');
      engagementsTab.style.borderBottomColor = 'transparent';
      engagementsTab.style.borderBottomWidth = '3px';
      engagementsTab.style.color = 'var(--text-secondary)';
      engagementsTab.style.fontWeight = '600';
      
      // Show/hide content
      if (offersContent) {
        offersContent.style.display = 'block';
      }
      if (engagementsContent) {
        engagementsContent.style.display = 'none';
      }
      if (offersFilters) {
        offersFilters.style.display = 'block';
      }
      if (engagementsFilters) {
        engagementsFilters.style.display = 'none';
      }
    } else if (tab === 'engagements') {
      // Deactivate offers tab
      offersTab.classList.remove('active');
      offersTab.style.borderBottomColor = 'transparent';
      offersTab.style.borderBottomWidth = '3px';
      offersTab.style.color = 'var(--text-secondary)';
      offersTab.style.fontWeight = '600';
      
      // Activate engagements tab
      engagementsTab.classList.add('active');
      engagementsTab.style.borderBottomColor = 'var(--color-primary)';
      engagementsTab.style.borderBottomWidth = '3px';
      engagementsTab.style.borderBottomStyle = 'solid';
      engagementsTab.style.color = 'var(--color-primary)';
      engagementsTab.style.fontWeight = '600';
      
      // Show/hide content
      if (offersContent) {
        offersContent.style.display = 'none';
      }
      if (engagementsContent) {
        engagementsContent.style.display = 'block';
      }
      if (offersFilters) {
        offersFilters.style.display = 'none';
      }
      if (engagementsFilters) {
        engagementsFilters.style.display = 'block';
      }
    }
    
    // Reload data for the active tab
    console.log('[MyServices] Loading data for tab:', tab);
    loadData();
  }

  // ============================================
  // Load Data
  // ============================================
  async function loadData() {
    if (currentTab === 'offers') {
      await loadOffers();
    } else {
      await loadEngagements();
    }
  }

  // ============================================
  // Load Statistics
  // ============================================
  async function loadStatistics() {
    if (typeof ServiceOfferService === 'undefined' || 
        typeof ServiceEngagementService === 'undefined' || 
        !currentUser) {
      return;
    }

    try {
      const myOffers = ServiceOfferService.getMyOffers();
      const myEngagements = ServiceEngagementService.getMyEngagements();

      const stats = {
        totalOffers: myOffers.length,
        activeOffers: myOffers.filter(o => o.status === 'SUBMITTED').length,
        acceptedOffers: myOffers.filter(o => o.status === 'ACCEPTED').length,
        rejectedOffers: myOffers.filter(o => o.status === 'REJECTED').length,
        activeEngagements: myEngagements.filter(e => e.status === 'ACTIVE').length,
        completedEngagements: myEngagements.filter(e => e.status === 'COMPLETED').length,
        totalEngagements: myEngagements.length
      };

      renderStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  // ============================================
  // Render Statistics
  // ============================================
  function renderStatistics(stats) {
    const content = document.getElementById('statisticsContent');
    if (!content) return;
    
    if (stats.totalOffers === 0 && stats.totalEngagements === 0) {
      const section = document.getElementById('statisticsSection');
      if (section) section.style.display = 'none';
      return;
    }
    
    const section = document.getElementById('statisticsSection');
    if (section) section.style.display = 'block';
    
    content.innerHTML = `
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${stats.totalOffers}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Total Offers</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-warning);">${stats.activeOffers}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Pending Offers</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-success);">${stats.acceptedOffers}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Accepted Offers</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${stats.activeEngagements}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Active Engagements</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-success);">${stats.completedEngagements}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Completed</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius);">
        <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${stats.totalEngagements}</div>
        <div style="font-size: 0.9rem; color: var(--text-secondary);">Total Engagements</div>
      </div>
    `;
  }

  // ============================================
  // Load Offers
  // ============================================
  async function loadOffers() {
    const container = document.getElementById('offersList');
    if (!container) {
      console.error('offersList container not found');
      return;
    }

    try {
      if (typeof ServiceOfferService === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Service offer service not available. Please refresh the page.</p>';
        return;
      }

      offers = ServiceOfferService.getMyOffers() || [];
      
      // Apply filters
      let filteredOffers = [...offers];
      if (currentFilters.offers.status) {
        filteredOffers = filteredOffers.filter(o => o.status === currentFilters.offers.status);
      }

      // Sort by submitted date (newest first)
      filteredOffers.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || 0);
        const dateB = new Date(b.submittedAt || b.createdAt || 0);
        return dateB - dateA;
      });

      renderOffers(container, filteredOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading service offers. Please try again.</p>';
    }
  }

  // ============================================
  // Render Offers
  // ============================================
  function renderOffers(container, offersList) {
    if (offersList.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p style="margin-bottom: 1rem;">You haven't submitted any service offers yet.</p>
            <a href="../service-requests/index.html" class="btn btn-primary">
              <i class="ph ph-magnifying-glass"></i> Browse Service Requests
            </a>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    offersList.forEach(offer => {
      // Get service request details
      let request = null;
      if (typeof ServiceRequestService !== 'undefined') {
        request = ServiceRequestService.getServiceRequest(offer.serviceRequestId);
      }

      const statusBadge = {
        'SUBMITTED': { class: 'badge-warning', text: 'Pending' },
        'ACCEPTED': { class: 'badge-success', text: 'Accepted' },
        'REJECTED': { class: 'badge-danger', text: 'Rejected' },
        'WITHDRAWN': { class: 'badge-secondary', text: 'Withdrawn' }
      }[offer.status] || { class: 'badge-secondary', text: offer.status || 'Unknown' };

      const pricing = offer.proposedPricing || {};
      const pricingDisplay = pricing.model === 'HOURLY' 
        ? `${pricing.amount?.toLocaleString() || '0'} ${pricing.currency || 'SAR'}/hour`
        : pricing.model === 'FIXED'
        ? `${pricing.amount?.toLocaleString() || '0'} ${pricing.currency || 'SAR'} (Fixed)`
        : `${pricing.amount?.toLocaleString() || '0'} ${pricing.currency || 'SAR'}`;

      const submittedDate = offer.submittedAt ? new Date(offer.submittedAt).toLocaleDateString() : 'N/A';
      const respondedDate = offer.respondedAt ? new Date(offer.respondedAt).toLocaleDateString() : null;

      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <h3 style="margin: 0;">${request ? request.title : 'Service Request'}</h3>
                  <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
                </div>
                ${request ? `
                  <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                    ${request.description ? request.description.substring(0, 150) + (request.description.length > 150 ? '...' : '') : 'No description'}
                  </p>
                ` : ''}
              </div>
            </div>
            
            ${request && request.requiredSkills && request.requiredSkills.length > 0 ? `
              <div style="margin-bottom: 1rem;">
                <strong style="margin-bottom: 0.5rem; display: block; font-size: 0.9rem;">Required Skills:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  ${request.requiredSkills.slice(0, 5).map(skill => 
                    `<span class="badge badge-secondary">${skill}</span>`
                  ).join('')}
                  ${request.requiredSkills.length > 5 ? `<span class="badge badge-secondary">+${request.requiredSkills.length - 5} more</span>` : ''}
                </div>
              </div>
            ` : ''}
            
            <div style="padding: 1rem; background: var(--bg-secondary, #f5f5f5); border-radius: var(--radius, 8px); margin-bottom: 1rem;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                <div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary);">Proposed Pricing</div>
                  <div style="font-size: 1.1rem; font-weight: 600; color: var(--color-primary);">${pricingDisplay}</div>
                </div>
                <div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary);">Submitted</div>
                  <div style="font-size: 1.1rem; font-weight: 600;">${submittedDate}</div>
                </div>
                ${respondedDate ? `
                  <div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Responded</div>
                    <div style="font-size: 1.1rem; font-weight: 600;">${respondedDate}</div>
                  </div>
                ` : ''}
              </div>
            </div>
            
            ${offer.message ? `
              <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-primary); border-left: 3px solid var(--color-primary); border-radius: var(--radius);">
                <strong style="font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">Your Offer Message:</strong>
                <p style="margin: 0; font-size: 0.9rem;">${offer.message}</p>
              </div>
            ` : ''}
            
            ${offer.status === 'REJECTED' && offer.rejectionReason ? `
              <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-danger, #fee); border-left: 3px solid var(--color-danger); border-radius: var(--radius);">
                <strong style="font-size: 0.9rem; margin-bottom: 0.5rem; display: block; color: var(--color-danger);">Rejection Reason:</strong>
                <p style="margin: 0; font-size: 0.9rem;">${offer.rejectionReason}</p>
              </div>
            ` : ''}
            
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
              ${request ? `
                <a href="${getBasePath()}service-requests/view/?id=${request.id}" class="btn btn-primary btn-sm">
                  <i class="ph ph-eye"></i> View Request
                </a>
              ` : ''}
              ${offer.status === 'SUBMITTED' ? `
                <button onclick="myServicesComponent.withdrawOffer('${offer.id}')" class="btn btn-warning btn-sm">
                  <i class="ph ph-x"></i> Withdraw Offer
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // ============================================
  // Load Engagements
  // ============================================
  async function loadEngagements() {
    const container = document.getElementById('engagementsList');
    if (!container) {
      console.error('engagementsList container not found');
      return;
    }

    try {
      if (typeof ServiceEngagementService === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Service engagement service not available. Please refresh the page.</p>';
        return;
      }

      engagements = ServiceEngagementService.getMyEngagements() || [];
      
      // Filter to only show engagements where user is the provider
      engagements = engagements.filter(e => e.serviceProviderUserId === currentUser.id);
      
      // Apply filters
      let filteredEngagements = [...engagements];
      if (currentFilters.engagements.status) {
        filteredEngagements = filteredEngagements.filter(e => e.status === currentFilters.engagements.status);
      }

      // Sort by started date (newest first)
      filteredEngagements.sort((a, b) => {
        const dateA = new Date(a.startedAt || a.createdAt || 0);
        const dateB = new Date(b.startedAt || b.createdAt || 0);
        return dateB - dateA;
      });

      renderEngagements(container, filteredEngagements);
    } catch (error) {
      console.error('Error loading engagements:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading service engagements. Please try again.</p>';
    }
  }

  // ============================================
  // Render Engagements
  // ============================================
  function renderEngagements(container, engagementsList) {
    if (engagementsList.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p style="margin-bottom: 1rem;">You don't have any active service engagements yet.</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Engagements are created when your service offers are accepted.</p>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    engagementsList.forEach(engagement => {
      // Get service request and offer details
      let request = null;
      let offer = null;
      
      if (typeof ServiceRequestService !== 'undefined') {
        request = ServiceRequestService.getServiceRequest(engagement.serviceRequestId);
      }
      
      if (typeof ServiceOfferService !== 'undefined' && engagement.serviceOfferId) {
        offer = ServiceOfferService.getOffer(engagement.serviceOfferId);
      }

      const statusBadge = {
        'ACTIVE': { class: 'badge-success', text: 'Active' },
        'COMPLETED': { class: 'badge-primary', text: 'Completed' },
        'TERMINATED': { class: 'badge-danger', text: 'Terminated' }
      }[engagement.status] || { class: 'badge-secondary', text: engagement.status || 'Unknown' };

      const startedDate = engagement.startedAt ? new Date(engagement.startedAt).toLocaleDateString() : 'N/A';
      const completedDate = engagement.completedAt ? new Date(engagement.completedAt).toLocaleDateString() : null;

      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <h3 style="margin: 0;">${request ? request.title : 'Service Engagement'}</h3>
                  <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
                </div>
                ${request ? `
                  <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                    ${request.description ? request.description.substring(0, 150) + (request.description.length > 150 ? '...' : '') : 'No description'}
                  </p>
                ` : ''}
              </div>
            </div>
            
            ${offer && offer.proposedPricing ? `
              <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-primary); border-left: 3px solid var(--color-primary); border-radius: var(--radius);">
                <strong style="font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">Agreed Pricing:</strong>
                <div style="font-size: 1.1rem; font-weight: 600; color: var(--color-primary);">
                  ${offer.proposedPricing.model === 'HOURLY' 
                    ? `${offer.proposedPricing.amount?.toLocaleString() || '0'} ${offer.proposedPricing.currency || 'SAR'}/hour`
                    : offer.proposedPricing.model === 'FIXED'
                    ? `${offer.proposedPricing.amount?.toLocaleString() || '0'} ${offer.proposedPricing.currency || 'SAR'} (Fixed)`
                    : `${offer.proposedPricing.amount?.toLocaleString() || '0'} ${offer.proposedPricing.currency || 'SAR'}`}
                </div>
              </div>
            ` : ''}
            
            <div style="padding: 1rem; background: var(--bg-secondary, #f5f5f5); border-radius: var(--radius, 8px); margin-bottom: 1rem;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                <div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary);">Started</div>
                  <div style="font-size: 1.1rem; font-weight: 600;">${startedDate}</div>
                </div>
                ${completedDate ? `
                  <div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Completed</div>
                    <div style="font-size: 1.1rem; font-weight: 600;">${completedDate}</div>
                  </div>
                ` : ''}
                ${engagement.linkedSubProjectIds && engagement.linkedSubProjectIds.length > 0 ? `
                  <div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Linked Projects</div>
                    <div style="font-size: 1.1rem; font-weight: 600;">${engagement.linkedSubProjectIds.length}</div>
                  </div>
                ` : ''}
              </div>
            </div>
            
            ${engagement.terminationReason ? `
              <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-danger, #fee); border-left: 3px solid var(--color-danger); border-radius: var(--radius);">
                <strong style="font-size: 0.9rem; margin-bottom: 0.5rem; display: block; color: var(--color-danger);">Termination Reason:</strong>
                <p style="margin: 0; font-size: 0.9rem;">${engagement.terminationReason}</p>
              </div>
            ` : ''}
            
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
              ${request ? `
                <a href="${getBasePath()}service-requests/view/?id=${request.id}" class="btn btn-primary btn-sm">
                  <i class="ph ph-eye"></i> View Request
                </a>
              ` : ''}
              ${engagement.status === 'ACTIVE' ? `
                <button onclick="myServicesComponent.completeEngagement('${engagement.id}')" class="btn btn-success btn-sm">
                  <i class="ph ph-check"></i> Mark Complete
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // ============================================
  // Withdraw Offer
  // ============================================
  async function withdrawOffer(offerId) {
    if (!confirm('Are you sure you want to withdraw this offer? This action cannot be undone.')) {
      return;
    }

    if (typeof ServiceOfferService === 'undefined') {
      alert('Service offer service not available');
      return;
    }

    try {
      const result = ServiceOfferService.withdrawOffer(offerId);
      if (result.success) {
        alert('Offer withdrawn successfully!');
        await loadOffers();
        await loadStatistics();
      } else {
        alert(`Error: ${result.error || 'Failed to withdraw offer'}`);
      }
    } catch (error) {
      console.error('Error withdrawing offer:', error);
      alert('Error withdrawing offer. Please try again.');
    }
  }

  // ============================================
  // Complete Engagement
  // ============================================
  async function completeEngagement(engagementId) {
    if (!confirm('Are you sure you want to mark this engagement as completed?')) {
      return;
    }

    if (typeof ServiceEngagementService === 'undefined') {
      alert('Service engagement service not available');
      return;
    }

    try {
      const result = ServiceEngagementService.completeEngagement(engagementId);
      if (result.success) {
        alert('Engagement marked as completed!');
        await loadEngagements();
        await loadStatistics();
      } else {
        alert(`Error: ${result.error || 'Failed to complete engagement'}`);
      }
    } catch (error) {
      console.error('Error completing engagement:', error);
      alert('Error completing engagement. Please try again.');
    }
  }

  // ============================================
  // Apply Offer Filters
  // ============================================
  function applyOfferFilters() {
    const statusFilter = document.getElementById('offerStatusFilter');
    if (statusFilter) {
      currentFilters.offers.status = statusFilter.value;
    }
    loadOffers();
  }

  // ============================================
  // Apply Engagement Filters
  // ============================================
  function applyEngagementFilters() {
    const statusFilter = document.getElementById('engagementStatusFilter');
    if (statusFilter) {
      currentFilters.engagements.status = statusFilter.value;
    }
    loadEngagements();
  }

  // ============================================
  // Clear Filters
  // ============================================
  function clearFilters() {
    currentFilters = {
      offers: { status: '' },
      engagements: { status: '' }
    };
    
    const offerStatusFilter = document.getElementById('offerStatusFilter');
    const engagementStatusFilter = document.getElementById('engagementStatusFilter');
    
    if (offerStatusFilter) offerStatusFilter.value = '';
    if (engagementStatusFilter) engagementStatusFilter.value = '';
    
    loadData();
    loadStatistics();
  }

  // ============================================
  // Export
  // ============================================
  if (!window.myServices) window.myServices = {};
  window.myServices.myServices = {
    init,
    switchTab,
    withdrawOffer,
    completeEngagement,
    loadOffers,
    loadEngagements,
    loadStatistics,
    applyOfferFilters,
    applyEngagementFilters,
    clearFilters
  };

  // Global reference for onclick handlers
  window.myServicesComponent = window.myServices.myServices;
  
  // Also expose switchTab globally for direct onclick calls
  window.switchToOffersTab = () => switchTab('offers');
  window.switchToEngagementsTab = () => switchTab('engagements');

})();
