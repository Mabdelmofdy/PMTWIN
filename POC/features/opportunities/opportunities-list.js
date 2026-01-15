/**
 * Opportunities List Component
 * Displays opportunities with filters for intent, payment mode, location, model
 */

(function() {
  'use strict';

  let currentFilters = {
    intent: null,
    paymentMode: null,
    country: null,
    city: null,
    remoteAllowed: null,
    model: null,
    subModel: null
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
  // Render Filters
  // ============================================
  function renderFilters() {
    const container = document.getElementById('opportunitiesFilters');
    if (!container) return;

    const html = `
      <div class="filters-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div class="form-group">
          <label for="filterIntent" class="form-label">Intent</label>
          <select id="filterIntent" class="form-control" onchange="opportunitiesList.updateFilter('intent', this.value)">
            <option value="">All</option>
            <option value="REQUEST_SERVICE">Request Service</option>
            <option value="OFFER_SERVICE">Offer Service</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filterPaymentMode" class="form-label">Payment Mode</label>
          <select id="filterPaymentMode" class="form-control" onchange="opportunitiesList.updateFilter('paymentMode', this.value)">
            <option value="">All</option>
            <option value="CASH">Cash</option>
            <option value="BARTER">Barter</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filterCountry" class="form-label">Country</label>
          <select id="filterCountry" class="form-control" onchange="opportunitiesList.onCountryFilterChange(this.value)">
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
                 onchange="opportunitiesList.updateFilter('city', this.value)"
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
        
        <div class="form-group">
          <label for="filterRemote" class="form-label">Remote</label>
          <select id="filterRemote" class="form-control" onchange="opportunitiesList.updateFilter('remoteAllowed', this.value === 'yes' ? true : this.value === 'no' ? false : null)">
            <option value="">All</option>
            <option value="yes">Remote Allowed</option>
            <option value="no">On-Site Only</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="filterModel" class="form-label">Model</label>
          <select id="filterModel" class="form-control" onchange="opportunitiesList.updateFilter('model', this.value)">
            <option value="">All</option>
            <option value="1">Model 1: Project-Based</option>
            <option value="2">Model 2: Strategic</option>
            <option value="3">Model 3: Resource Pooling</option>
            <option value="4">Model 4: Hiring</option>
            <option value="5">Model 5: Competition</option>
          </select>
        </div>
        
        <div class="form-group" style="display: flex; align-items: flex-end;">
          <button type="button" class="btn btn-secondary" onclick="opportunitiesList.clearFilters()" style="width: 100%;">
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
    const container = document.getElementById('opportunitiesList');
    if (!container) return;

    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      container.innerHTML = '<p class="alert alert-error">Opportunities service not available</p>';
      return;
    }

    // Get current user to filter out own opportunities
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    const userId = currentUser?.id;

    // Apply filters
    let opportunities = PMTwinData.Opportunities.getWithFilters(currentFilters);
    
    // Filter out own opportunities
    if (userId) {
      opportunities = opportunities.filter(opp => {
        const createdBy = opp.createdBy || opp.creatorId;
        return createdBy !== userId;
      });
    }

    // Filter by status (only show published/active)
    opportunities = opportunities.filter(opp => 
      opp.status === 'published' || opp.status === 'active'
    );

    if (opportunities.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No opportunities found matching your filters.</p>
            <button type="button" class="btn btn-secondary" onclick="opportunitiesList.clearFilters()" style="margin-top: 1rem;">
              Clear Filters
            </button>
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
      const paymentBadge = getPaymentBadge(opportunity.paymentTerms?.mode || opportunity.paymentMode);
      // Display location as "City, Country" format
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
                  ${intentBadge}
                  ${paymentBadge}
                  ${isRemoteAllowed ? '<span class="badge badge-success"><i class="ph ph-globe"></i> Remote</span>' : ''}
                  <span class="badge badge-secondary">${opportunity.subModel || opportunity.modelName || 'Model ' + (opportunity.model || '1')}</span>
                </div>
                <p style="margin: 0; color: var(--text-secondary);">
                  <i class="ph ph-map-pin"></i> ${locationText}
                  ${totalValue > 0 ? ` • <strong>${totalValue.toLocaleString()} SAR</strong>` : ''}
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
            
            ${opportunity.serviceItems && opportunity.serviceItems.length > 0 ? `
              <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
                <strong>Service Items:</strong>
                <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem;">
                  ${opportunity.serviceItems.slice(0, 3).map(item => `
                    <li>${item.name || 'Service'} - ${item.qty || 1} ${item.unit || 'unit'} × ${(item.unitPriceRef || 0).toLocaleString()} SAR</li>
                  `).join('')}
                  ${opportunity.serviceItems.length > 3 ? `<li><em>+${opportunity.serviceItems.length - 3} more items</em></li>` : ''}
                </ul>
              </div>
            ` : ''}
            
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <a href="${getOpportunityViewUrl(opportunity.id)}" class="btn btn-primary btn-sm">
                <i class="ph ph-eye"></i> View Details
              </a>
              ${opportunity.intent === 'REQUEST_SERVICE' || opportunity.intent === 'BOTH' ? `
                <a href="${getProposalCreateUrl(opportunity.id)}" class="btn btn-success btn-sm">
                  <i class="ph ph-paper-plane-tilt"></i> Submit Proposal
                </a>
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
  // Helper: Get Opportunity View URL
  // ============================================
  function getOpportunityViewUrl(opportunityId) {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('opportunities', { id: opportunityId });
    }
    return `/POC/pages/opportunities/index.html?id=${opportunityId}`;
  }

  // ============================================
  // Helper: Get Proposal Create URL
  // ============================================
  function getProposalCreateUrl(opportunityId) {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('create-proposal', { opportunityId: opportunityId });
    }
    return `/POC/pages/proposals/create/index.html?opportunityId=${opportunityId}`;
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
  // Country Filter Change Handler
  // ============================================
  function onCountryFilterChange(country) {
    currentFilters.country = country || null;
    // Reset city filter when country changes
    currentFilters.city = null;
    
    // Update city dropdown
    const citySelect = document.getElementById('filterCity');
    if (citySelect) {
      if (!country) {
        citySelect.disabled = true;
        citySelect.innerHTML = '<option value="">All Cities</option>';
      } else {
        citySelect.disabled = false;
        const cities = typeof window.LocationConfig !== 'undefined' 
          ? window.LocationConfig.getCitiesByCountry(country) 
          : [];
        citySelect.innerHTML = '<option value="">All Cities</option>' + 
          cities.map(city => `<option value="${city}">${city}</option>`).join('');
      }
    }
    
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
      model: null,
      subModel: null
    };
    
    // Reset form inputs
    document.getElementById('filterIntent').value = '';
    document.getElementById('filterPaymentMode').value = '';
    document.getElementById('filterCountry').value = '';
    document.getElementById('filterCity').value = '';
    document.getElementById('filterRemote').value = '';
    document.getElementById('filterModel').value = '';
    
    loadOpportunities();
  }

  // ============================================
  // Attach Event Listeners
  // ============================================
  function attachEventListeners() {
    // Filters are handled via inline onchange handlers
  }

  // ============================================
  // Get Base Path Helper
  // ============================================
  function getBasePath() {
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    const depth = segments.length;
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  // ============================================
  // Public API
  // ============================================
  window.opportunitiesList = {
    init,
    loadOpportunities,
    updateFilter,
    onCountryFilterChange,
    clearFilters
  };

})();
