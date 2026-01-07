/**
 * Skills Search Feature
 * Allows vendors/entities to search service provider skills directly
 */

(function() {
  'use strict';

  const SkillsSearch = {
    currentFilters: {
      requiredSkills: [],
      availability: '',
      pricingModel: '',
      minHourlyRate: null,
      maxHourlyRate: null
    },

    async init() {
      this.renderSearchInterface();
    },

    renderSearchInterface() {
      const contentEl = document.getElementById('skillsSearchContent');
      if (!contentEl) return;

      contentEl.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2>Search by Skills</h2>
          </div>
          <div class="card-body">
            <form id="skillsSearchForm" onsubmit="return SkillsSearch.handleSearch(event)">
              <div class="form-group">
                <label for="skillsInput">Required Skills *</label>
                <input type="text" id="skillsInput" class="form-control" 
                       placeholder="Enter skills separated by commas (e.g., Legal Review, Contract Analysis, Quality Assurance)"
                       required>
                <small class="form-text">Enter the skills you need, separated by commas</small>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="availabilityFilter">Availability</label>
                  <select id="availabilityFilter" class="form-control">
                    <option value="">All</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="BUSY">Busy</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="pricingModelFilter">Pricing Model</label>
                  <select id="pricingModelFilter" class="form-control">
                    <option value="">All</option>
                    <option value="HOURLY">Hourly</option>
                    <option value="FIXED">Fixed</option>
                    <option value="RETAINER">Retainer</option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="minHourlyRate">Min Hourly Rate (SAR)</label>
                  <input type="number" id="minHourlyRate" class="form-control" min="0" step="0.01">
                </div>
                
                <div class="form-group">
                  <label for="maxHourlyRate">Max Hourly Rate (SAR)</label>
                  <input type="number" id="maxHourlyRate" class="form-control" min="0" step="0.01">
                </div>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                  <i class="ph ph-magnifying-glass"></i> Search Providers
                </button>
                <button type="button" class="btn btn-secondary" onclick="SkillsSearch.clearFilters()">
                  Clear Filters
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div id="searchResults" style="margin-top: 2rem;">
          <!-- Results will be displayed here -->
        </div>
      `;

      // Setup form handler
      const form = document.getElementById('skillsSearchForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSearch(e);
        });
      }
    },

    handleSearch(event) {
      event.preventDefault();
      
      const skillsInput = document.getElementById('skillsInput');
      const availabilityFilter = document.getElementById('availabilityFilter');
      const pricingModelFilter = document.getElementById('pricingModelFilter');
      const minHourlyRate = document.getElementById('minHourlyRate');
      const maxHourlyRate = document.getElementById('maxHourlyRate');
      
      // Parse skills
      const requiredSkills = skillsInput.value
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      if (requiredSkills.length === 0) {
        alert('Please enter at least one skill');
        return;
      }
      
      // Build filters
      const skillFilters = {
        requiredSkills: requiredSkills,
        availability: availabilityFilter.value || undefined,
        pricingModel: pricingModelFilter.value || undefined,
        minHourlyRate: minHourlyRate.value ? parseFloat(minHourlyRate.value) : undefined,
        maxHourlyRate: maxHourlyRate.value ? parseFloat(maxHourlyRate.value) : undefined
      };
      
      this.currentFilters = skillFilters;
      this.performSearch(skillFilters);
    },

    async performSearch(filters) {
      const resultsEl = document.getElementById('searchResults');
      if (!resultsEl) return;
      
      resultsEl.innerHTML = '<p style="text-align: center; padding: 2rem;"><i class="ph ph-spinner ph-spin"></i> Searching...</p>';
      
      try {
        let providers = [];
        if (typeof ServiceProviderService !== 'undefined' && ServiceProviderService.searchProviderSkills) {
          providers = ServiceProviderService.searchProviderSkills(filters);
        } else {
          resultsEl.innerHTML = '<div class="alert alert-error">Service provider service not available</div>';
          return;
        }
        
        if (providers.length === 0) {
          resultsEl.innerHTML = `
            <div class="card">
              <div class="card-body" style="text-align: center; padding: 3rem;">
                <p>No service providers found matching your skill requirements.</p>
                <button onclick="SkillsSearch.clearFilters()" class="btn btn-primary" style="margin-top: 1rem;">Clear Filters</button>
              </div>
            </div>
          `;
          return;
        }
        
        this.renderResults(providers);
      } catch (error) {
        console.error('Error searching providers:', error);
        resultsEl.innerHTML = '<div class="alert alert-error">Error searching providers. Please try again.</div>';
      }
    },

    renderResults(providers) {
      const resultsEl = document.getElementById('searchResults');
      if (!resultsEl) return;
      
      const currentUser = PMTwinData?.Sessions?.getCurrentUser();
      
      let html = `
        <div class="card">
          <div class="card-header">
            <h3>Search Results (${providers.length} providers found)</h3>
          </div>
          <div class="card-body">
            <div style="display: grid; gap: 1.5rem;">
      `;
      
      providers.forEach(provider => {
        const user = PMTwinData?.Users?.getByUserId?.(provider.userId) || PMTwinData?.Users?.getById?.(provider.userId);
        const availabilityBadge = {
          'AVAILABLE': { class: 'badge-success', text: 'Available' },
          'BUSY': { class: 'badge-warning', text: 'Busy' },
          'UNAVAILABLE': { class: 'badge-secondary', text: 'Unavailable' }
        }[provider.availabilityStatus] || { class: 'badge-secondary', text: 'Unknown' };
        
        const matchScore = Math.round((provider.skillMatchScore || 0) * 100);
        const matchedSkills = provider.matchedSkills || [];
        
        html += `
          <div class="card" style="border-left: 4px solid var(--color-primary);">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 0.5rem 0;">${user?.profile?.name || user?.email || 'Service Provider'}</h4>
                  <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
                    <span class="badge ${availabilityBadge.class}">${availabilityBadge.text}</span>
                    <span class="badge badge-info">${matchScore}% Match</span>
                    ${provider.pricingModel ? `<span class="badge badge-secondary">${provider.pricingModel}</span>` : ''}
                    ${provider.hourlyRate ? `<span class="badge badge-secondary">${provider.hourlyRate} SAR/hr</span>` : ''}
                  </div>
                </div>
              </div>
              
              ${matchedSkills.length > 0 ? `
                <div style="margin-bottom: 1rem;">
                  <strong>Matched Skills:</strong>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                    ${matchedSkills.map(skill => `<span class="badge badge-success">${skill}</span>`).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${provider.skills && provider.skills.length > 0 ? `
                <div style="margin-bottom: 1rem;">
                  <strong>All Skills:</strong>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                    ${provider.skills.slice(0, 10).map(skill => `<span class="badge badge-info">${skill}</span>`).join('')}
                    ${provider.skills.length > 10 ? `<span class="badge badge-secondary">+${provider.skills.length - 10} more</span>` : ''}
                  </div>
                </div>
              ` : ''}
              
              <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" onclick="SkillsSearch.createServiceRequest('${provider.userId}', '${provider.id || ''}')">
                  <i class="ph ph-plus"></i> Create Service Request
                </button>
                <button class="btn btn-secondary btn-sm" onclick="SkillsSearch.viewProviderProfile('${provider.userId}')">
                  <i class="ph ph-eye"></i> View Profile
                </button>
              </div>
            </div>
          </div>
        `;
      });
      
      html += `
            </div>
          </div>
        </div>
      `;
      
      resultsEl.innerHTML = html;
    },

    createServiceRequest(providerUserId, providerProfileId) {
      // Get skills from current search
      const skillsInput = document.getElementById('skillsInput');
      const requiredSkills = skillsInput.value
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      // Store provider info in sessionStorage for the create page
      sessionStorage.setItem('serviceRequestProvider', JSON.stringify({
        providerUserId: providerUserId,
        providerProfileId: providerProfileId,
        requiredSkills: requiredSkills
      }));
      
      // Navigate to create service request page
      window.location.href = '../service-requests/create.html';
    },

    viewProviderProfile(providerUserId) {
      window.location.href = `../service-providers/profile/index.html?userId=${providerUserId}`;
    },

    clearFilters() {
      document.getElementById('skillsInput').value = '';
      document.getElementById('availabilityFilter').value = '';
      document.getElementById('pricingModelFilter').value = '';
      document.getElementById('minHourlyRate').value = '';
      document.getElementById('maxHourlyRate').value = '';
      
      const resultsEl = document.getElementById('searchResults');
      if (resultsEl) {
        resultsEl.innerHTML = '';
      }
    }
  };

  window.SkillsSearch = SkillsSearch;

})();

