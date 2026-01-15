/**
 * My Opportunities Component
 * Displays user's own opportunities with tabs for Drafts and Published
 */

(function() {
  'use strict';

  let currentTab = 'drafts';
  let currentFilters = {
    intent: null,
    paymentMode: null,
    country: null,
    city: null,
    remoteAllowed: null,
    model: null
  };

  // ============================================
  // Initialize Component
  // ============================================
  function init() {
    renderFilters();
    loadOpportunities();
    attachEventListeners();
  }

  // ============================================
  // Switch Tab
  // ============================================
  function switchTab(tab) {
    currentTab = tab;
    
    // Update tab UI
    document.querySelectorAll('#myOpportunitiesTabs .tab-nav-item').forEach(btn => {
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    loadOpportunities();
  }

  // ============================================
  // Render Filters
  // ============================================
  function renderFilters() {
    const container = document.getElementById('myOpportunitiesFilters');
    if (!container) return;

    const html = `
      <div class="filters-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="form-group">
          <label for="filterIntent" class="form-label">Intent</label>
          <select id="filterIntent" class="form-control" onchange="myOpportunities.updateFilter('intent', this.value)">
            <option value="">All</option>
            <option value="REQUEST_SERVICE">Request Service</option>
            <option value="OFFER_SERVICE">Offer Service</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filterPaymentMode" class="form-label">Payment Mode</label>
          <select id="filterPaymentMode" class="form-control" onchange="myOpportunities.updateFilter('paymentMode', this.value)">
            <option value="">All</option>
            <option value="CASH">Cash</option>
            <option value="BARTER">Barter</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filterCountry" class="form-label">Country</label>
          <select id="filterCountry" class="form-control" onchange="myOpportunities.onCountryFilterChange(this.value)">
            <option value="">All Countries</option>
            ${typeof window.LocationConfig !== 'undefined' 
              ? window.LocationConfig.getAllowedCountries().map(country => `
                <option value="${country}" ${currentFilters.country === country ? 'selected' : ''}>${country}</option>
              `).join('')
              : '<option value="Saudi Arabia">Saudi Arabia</option>'}
          </select>
        </div>
        
        <div class="form-group">
          <label for="filterCity" class="form-label">City</label>
          <select id="filterCity" class="form-control" 
                 onchange="myOpportunities.updateFilter('city', this.value)"
                 ${!currentFilters.country ? 'disabled' : ''}>
            <option value="">All Cities</option>
            ${currentFilters.country && typeof window.LocationConfig !== 'undefined'
              ? window.LocationConfig.getCitiesByCountry(currentFilters.country).map(city => `
                <option value="${city}" ${currentFilters.city === city ? 'selected' : ''}>${city}</option>
              `).join('')
              : ''}
          </select>
          ${!currentFilters.country ? '<small class="form-text">Select a country first</small>' : ''}
        </div>
        
        <div class="form-group" style="display: flex; align-items: flex-end;">
          <button type="button" class="btn btn-secondary" onclick="myOpportunities.clearFilters()" style="width: 100%;">
            <i class="ph ph-x"></i> Clear Filters
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // ============================================
  // Load Opportunities
  // ============================================
  function loadOpportunities() {
    const container = document.getElementById('myOpportunitiesList');
    if (!container) return;

    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      container.innerHTML = '<p class="alert alert-error">Opportunities service not available</p>';
      return;
    }

    // Get current user
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    const userId = currentUser?.id;
    
    if (!userId) {
      container.innerHTML = '<p class="alert alert-warning">Please log in to view your opportunities</p>';
      return;
    }

    // Get all opportunities created by current user
    let opportunities = PMTwinData.Opportunities.getAll();
    
    // Filter by creator
    opportunities = opportunities.filter(opp => {
      const createdBy = opp.createdBy || opp.creatorId;
      return createdBy === userId;
    });

    // Filter by tab (drafts vs published)
    if (currentTab === 'drafts') {
      opportunities = opportunities.filter(opp => 
        opp.status === 'draft' || !opp.status || opp.status === ''
      );
    } else {
      opportunities = opportunities.filter(opp => 
        opp.status === 'published' || opp.status === 'active'
      );
    }

    // Apply filters
    opportunities = PMTwinData.Opportunities.getWithFilters(currentFilters, opportunities);

    if (opportunities.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No ${currentTab === 'drafts' ? 'draft' : 'published'} opportunities found${Object.values(currentFilters).some(f => f !== null) ? ' matching your filters' : ''}.</p>
            ${currentTab === 'drafts' ? `
              <a href="../../create/index.html" class="btn btn-primary" style="margin-top: 1rem;">
                <i class="ph ph-plus"></i> Create Your First Opportunity
              </a>
            ` : ''}
            ${Object.values(currentFilters).some(f => f !== null) ? `
              <button type="button" class="btn btn-secondary" onclick="myOpportunities.clearFilters()" style="margin-top: 1rem;">
                Clear Filters
              </button>
            ` : ''}
          </div>
        </div>
      `;
      return;
    }

    // Render opportunities
    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    opportunities.forEach(opportunity => {
      const totalValue = opportunity.serviceItems && opportunity.serviceItems.length > 0
        ? opportunity.serviceItems.reduce((sum, item) => sum + (item.totalRef || 0), 0)
        : 0;
      
      const intentBadge = getIntentBadge(opportunity.intent || opportunity.intentType);
      const paymentBadge = getPaymentBadge(opportunity.preferredPaymentTerms?.mode || opportunity.paymentTerms?.mode || opportunity.paymentMode);
      const statusBadge = getStatusBadge(opportunity.status);
      
      const oppCity = opportunity.location?.city || 'TBD';
      const oppCountry = opportunity.location?.country || 'Not specified';
      const locationText = `${oppCity}, ${oppCountry}`;
      const isRemoteAllowed = opportunity.location?.isRemoteAllowed || false;
      
      html += `
        <div class="card enhanced-card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">${opportunity.title || 'Untitled Opportunity'}</h3>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                  ${statusBadge}
                  ${intentBadge}
                  ${paymentBadge}
                  ${isRemoteAllowed ? '<span class="badge badge-success"><i class="ph ph-globe"></i> Remote</span>' : ''}
                  <span class="badge badge-secondary">${opportunity.subModel || opportunity.modelName || 'Model ' + (opportunity.model || '1')}</span>
                </div>
                <p style="margin: 0; color: var(--text-secondary);">
                  <i class="ph ph-map-pin"></i> ${locationText}
                  ${totalValue > 0 ? ` • <strong>${totalValue.toLocaleString()} SAR</strong>` : ''}
                  ${opportunity.views ? ` • <i class="ph ph-eye"></i> ${opportunity.views} views` : ''}
                  ${opportunity.applicationsReceived ? ` • <i class="ph ph-paper-plane-tilt"></i> ${opportunity.applicationsReceived} proposals` : ''}
                </p>
              </div>
            </div>
            
            <p style="margin-bottom: 1rem;">${(opportunity.description || '').substring(0, 200)}${opportunity.description && opportunity.description.length > 200 ? '...' : ''}</p>
            
            ${opportunity.skills && opportunity.skills.length > 0 ? `
              <div style="margin-bottom: 1rem;">
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  ${opportunity.skills.slice(0, 5).map(skill => `<span class="badge badge-primary">${skill}</span>`).join('')}
                  ${opportunity.skills.length > 5 ? `<span class="badge badge-secondary">+${opportunity.skills.length - 5} more</span>` : ''}
                </div>
              </div>
            ` : ''}
            
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <a href="${getOpportunityViewUrl(opportunity.id)}" class="btn btn-primary btn-sm">
                <i class="ph ph-eye"></i> View Details
              </a>
              ${currentTab === 'drafts' ? `
                <a href="${getOpportunityEditUrl(opportunity.id)}" class="btn btn-secondary btn-sm">
                  <i class="ph ph-pencil"></i> Edit
                </a>
                <button type="button" class="btn btn-success btn-sm" onclick="myOpportunities.publishOpportunity('${opportunity.id}')">
                  <i class="ph ph-paper-plane-tilt"></i> Publish
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="myOpportunities.deleteOpportunity('${opportunity.id}')">
                  <i class="ph ph-trash"></i> Delete
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
  // Helper: Get Intent Badge
  // ============================================
  function getIntentBadge(intent) {
    const badges = {
      'REQUEST_SERVICE': '<span class="badge badge-warning">Request</span>',
      'OFFER_SERVICE': '<span class="badge badge-info">Offer</span>',
      'BOTH': '<span class="badge badge-primary">Both</span>'
    };
    return badges[intent] || '';
  }

  // ============================================
  // Helper: Get Payment Badge
  // ============================================
  function getPaymentBadge(mode) {
    const badges = {
      'CASH': '<span class="badge badge-success">Cash</span>',
      'BARTER': '<span class="badge badge-purple">Barter</span>',
      'HYBRID': '<span class="badge badge-secondary">Hybrid</span>'
    };
    return badges[mode] || '';
  }

  // ============================================
  // Helper: Get Status Badge
  // ============================================
  function getStatusBadge(status) {
    const badges = {
      'draft': '<span class="badge badge-secondary"><i class="ph ph-file-dashed"></i> Draft</span>',
      'published': '<span class="badge badge-success"><i class="ph ph-paper-plane-tilt"></i> Published</span>',
      'active': '<span class="badge badge-info"><i class="ph ph-check-circle"></i> Active</span>',
      'closed': '<span class="badge badge-danger"><i class="ph ph-x-circle"></i> Closed</span>'
    };
    return badges[status] || '<span class="badge badge-secondary">' + (status || 'Draft') + '</span>';
  }

  // ============================================
  // Helper: Get Opportunity View URL
  // ============================================
  function getOpportunityViewUrl(opportunityId) {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('opportunity-view', { id: opportunityId });
    }
    return `/POC/pages/opportunities/view/index.html?id=${opportunityId}`;
  }

  // ============================================
  // Helper: Get Opportunity Edit URL
  // ============================================
  function getOpportunityEditUrl(opportunityId) {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('create-opportunity', { edit: opportunityId });
    }
    return `/POC/pages/opportunities/create/index.html?edit=${opportunityId}`;
  }

  // ============================================
  // Publish Opportunity
  // ============================================
  function publishOpportunity(opportunityId) {
    if (!confirm('Are you sure you want to publish this opportunity? It will be visible to all users.')) {
      return;
    }

    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      alert('Opportunities service not available');
      return;
    }

    const opportunity = PMTwinData.Opportunities.getById(opportunityId);
    if (!opportunity) {
      alert('Opportunity not found');
      return;
    }

    // Update status to published
    PMTwinData.Opportunities.update(opportunityId, {
      status: 'published',
      publishedAt: new Date().toISOString()
    });

    // Reload opportunities
    loadOpportunities();
    
    alert('Opportunity published successfully!');
  }

  // ============================================
  // Delete Opportunity
  // ============================================
  function deleteOpportunity(opportunityId) {
    if (!confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) {
      return;
    }

    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      alert('Opportunities service not available');
      return;
    }

    PMTwinData.Opportunities.delete(opportunityId);
    
    // Reload opportunities
    loadOpportunities();
    
    alert('Opportunity deleted successfully!');
  }

  // ============================================
  // Update Filter
  // ============================================
  function updateFilter(filterName, value) {
    if (value === '' || value === null) {
      currentFilters[filterName] = null;
    } else {
      currentFilters[filterName] = value;
    }
    loadOpportunities();
  }

  // ============================================
  // Country Filter Change
  // ============================================
  function onCountryFilterChange(country) {
    currentFilters.country = country || null;
    currentFilters.city = null; // Reset city when country changes
    renderFilters();
    loadOpportunities();
  }

  // ============================================
  // Clear Filters
  // ============================================
  function clearFilters() {
    currentFilters = {
      intent: null,
      paymentMode: null,
      country: null,
      city: null,
      remoteAllowed: null,
      model: null
    };
    renderFilters();
    loadOpportunities();
  }

  // ============================================
  // Attach Event Listeners
  // ============================================
  function attachEventListeners() {
    // Event listeners are attached via inline onclick handlers
  }

  // ============================================
  // Public API
  // ============================================
  window.myOpportunities = {
    init,
    switchTab,
    updateFilter,
    onCountryFilterChange,
    clearFilters,
    publishOpportunity,
    deleteOpportunity
  };
})();
