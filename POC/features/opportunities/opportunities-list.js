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
    
    // Wait a bit for OpportunityStore to be available
    if (typeof window.OpportunityStore === 'undefined') {
      console.log('[OpportunitiesList] Waiting for OpportunityStore to load...');
      setTimeout(() => {
        if (typeof window.OpportunityStore !== 'undefined') {
          console.log('[OpportunitiesList] OpportunityStore loaded, loading opportunities');
          loadOpportunities();
        } else {
          console.warn('[OpportunitiesList] OpportunityStore not available, using fallback');
          loadOpportunities();
        }
      }, 500);
    } else {
      loadOpportunities();
    }
    
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

    // Use OpportunityStore if available, otherwise fallback to PMTwinData
    let opportunities = [];
    let userId = null;

    if (typeof window.OpportunityStore !== 'undefined') {
      // Use new OpportunityStore
      opportunities = window.OpportunityStore.getAllOpportunities();
      console.log('[OpportunitiesList] Loaded opportunities from OpportunityStore:', opportunities.length);
      
      // Get current user - try multiple methods
      try {
        // Method 1: Check localStorage session
        const sessionStr = localStorage.getItem('pmtwin_current_user') || localStorage.getItem('pmtwin_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          userId = session.userId || session.id;
        }
        
        // Method 2: Check window.currentUser
        if (!userId && typeof window.currentUser !== 'undefined' && window.currentUser) {
          userId = window.currentUser.userId || window.currentUser.id;
        }
        
        // Method 3: Check PMTwinData if available
        if (!userId && typeof PMTwinData !== 'undefined' && PMTwinData.Sessions) {
          const currentUser = PMTwinData.Sessions.getCurrentUser();
          if (currentUser) {
            userId = currentUser.id;
          }
        }
        
        console.log('[OpportunitiesList] Current userId:', userId);
      } catch (e) {
        console.error('Error getting current user:', e);
      }
    } else if (typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
      // Fallback to PMTwinData
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      userId = currentUser?.id;
      opportunities = PMTwinData.Opportunities.getWithFilters ? 
        PMTwinData.Opportunities.getWithFilters(currentFilters) : 
        PMTwinData.Opportunities.getAll();
    } else {
      container.innerHTML = '<p class="alert alert-error">Opportunities service not available</p>';
      return;
    }

    // Apply filters
    if (currentFilters.intent) {
      opportunities = opportunities.filter(opp => opp.intent === currentFilters.intent);
    }
    if (currentFilters.paymentMode) {
      const paymentType = opportunities[0]?.paymentTerms?.type || opportunities[0]?.paymentTerms?.mode || opportunities[0]?.paymentMode;
      opportunities = opportunities.filter(opp => {
        const oppPayment = opp.paymentTerms?.type || opp.paymentTerms?.mode || opp.paymentMode;
        return oppPayment === currentFilters.paymentMode;
      });
    }
    if (currentFilters.country) {
      opportunities = opportunities.filter(opp => 
        (opp.location?.country || '').toLowerCase() === currentFilters.country.toLowerCase()
      );
    }
    if (currentFilters.city) {
      opportunities = opportunities.filter(opp => 
        (opp.location?.city || '').toLowerCase() === currentFilters.city.toLowerCase()
      );
    }
    if (currentFilters.remoteAllowed !== null) {
      opportunities = opportunities.filter(opp => 
        (opp.location?.isRemoteAllowed || false) === currentFilters.remoteAllowed
      );
    }
    if (currentFilters.model) {
      opportunities = opportunities.filter(opp => opp.model === currentFilters.model);
    }
    
    // Filter out own opportunities (only if userId is set and matches)
    if (userId) {
      const beforeOwnFilter = opportunities.length;
      opportunities = opportunities.filter(opp => {
        const createdBy = opp.createdByUserId || opp.createdBy || opp.creatorId;
        const shouldShow = createdBy !== userId;
        if (!shouldShow) {
          console.log('[OpportunitiesList] Filtering out own opportunity:', opp.id, 'createdBy:', createdBy, 'userId:', userId);
        }
        return shouldShow;
      });
      console.log('[OpportunitiesList] After filtering own opportunities:', opportunities.length, 'out of', beforeOwnFilter);
    }

    // Filter by status (only show PUBLISHED/ACTIVE, but be lenient)
    const beforeStatusFilter = opportunities.length;
    opportunities = opportunities.filter(opp => {
      const status = (opp.status || '').toUpperCase();
      // Accept PUBLISHED, ACTIVE, or if status is empty/null, show it (might be from store)
      return status === 'PUBLISHED' || status === 'ACTIVE' || status === '' || !opp.status;
    });
    console.log('[OpportunitiesList] After status filter:', opportunities.length, 'out of', beforeStatusFilter);
    
    // If no opportunities after status filter, but we had some before, show all (for debugging)
    if (opportunities.length === 0 && beforeStatusFilter > 0) {
      console.warn('[OpportunitiesList] All opportunities filtered out by status. Showing all for debugging.');
      opportunities = typeof window.OpportunityStore !== 'undefined' ? 
        window.OpportunityStore.getAllOpportunities() : [];
      // Re-apply other filters but skip status
      if (currentFilters.intent) {
        opportunities = opportunities.filter(opp => opp.intent === currentFilters.intent);
      }
      if (userId) {
        opportunities = opportunities.filter(opp => {
          const createdBy = opp.createdByUserId || opp.createdBy || opp.creatorId;
          return createdBy !== userId;
        });
      }
    }

    console.log('[OpportunitiesList] Final opportunities count:', opportunities.length);
    console.log('[OpportunitiesList] Sample opportunity:', opportunities[0]);
    
    if (opportunities.length === 0) {
      // Check if we have any opportunities at all before filtering
      const allOpps = typeof window.OpportunityStore !== 'undefined' ? 
        window.OpportunityStore.getAllOpportunities() : [];
      console.log('[OpportunitiesList] Total opportunities in store:', allOpps.length);
      
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No opportunities found matching your filters.</p>
            ${allOpps.length > 0 ? `<p style="color: var(--text-secondary); font-size: 0.9rem;">Found ${allOpps.length} total opportunities in store. Try clearing filters.</p>` : ''}
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
              ${shouldShowEngagementRequestButton(opportunity) ? `
                <a href="${getEngagementRequestUrl(opportunity.id)}" class="btn btn-success btn-sm">
                  <i class="ph ph-paper-plane-tilt"></i> Send Engagement Request
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
    // Use URL helper if available
    if (typeof window.UrlHelper !== 'undefined') {
      return window.UrlHelper.buildUrlWithQuery('pages/opportunities/details.html', { id: opportunityId });
    }
    // Fallback to NavRoutes
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('opportunities/details', { id: opportunityId });
    }
    // Final fallback
    return `/POC/pages/opportunities/details.html?id=${opportunityId}`;
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
  // Helper: Get Engagement Request URL
  // ============================================
  function getEngagementRequestUrl(opportunityId) {
    if (typeof window.NavRoutes !== 'undefined') {
      return window.NavRoutes.getRouteWithQuery('create-proposal', { opportunityId: opportunityId });
    }
    return `/POC/pages/proposals/create/index.html?opportunityId=${opportunityId}`;
  }

  // ============================================
  // Helper: Check if Engagement Request button should be shown
  // ============================================
  function shouldShowEngagementRequestButton(opportunity) {
    // Check if current user is not the opportunity owner
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Sessions) {
      return false;
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return false;
    }
    
    const opportunityOwner = opportunity.createdBy || opportunity.creatorId;
    if (currentUser.id === opportunityOwner) {
      return false; // Don't show button for own opportunities
    }
    
    // Show for all opportunity types (REQUEST_SERVICE, OFFER_SERVICE, BOTH)
    return true;
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
