/**
 * Admin Service Providers Feature
 * Admin view for managing service providers
 */

(function() {
  'use strict';

  const AdminServiceProviders = {
    async init() {
      await this.loadProviders();
    },

    async loadProviders() {
      const contentEl = document.getElementById('adminServiceProvidersContent');
      if (!contentEl) return;

      let profiles = [];
      if (typeof PMTwinData !== 'undefined' && PMTwinData.ServiceProviderProfiles) {
        profiles = PMTwinData.ServiceProviderProfiles.getAll();
      }

      // Get user info for each profile
      const profilesWithUsers = profiles.map(profile => {
        const user = PMTwinData?.Users?.getById?.(profile.userId);
        return {
          ...profile,
          user: user
        };
      });

      this.renderProviders(profilesWithUsers);
    },

    renderProviders(profiles) {
      const contentEl = document.getElementById('adminServiceProvidersContent');
      if (!contentEl) return;

      if (profiles.length === 0) {
        contentEl.innerHTML = '<div class="alert alert-info">No service providers found.</div>';
        return;
      }

      const stats = {
        total: profiles.length,
        available: profiles.filter(p => p.availabilityStatus === 'AVAILABLE').length,
        busy: profiles.filter(p => p.availabilityStatus === 'BUSY').length,
        unavailable: profiles.filter(p => p.availabilityStatus === 'UNAVAILABLE').length
      };

      const providersHtml = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total Providers</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.available}</div>
            <div class="stat-label">Available</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.busy}</div>
            <div class="stat-label">Busy</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.unavailable}</div>
            <div class="stat-label">Unavailable</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h2>All Service Providers</h2>
          </div>
          <div class="card-body">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Type</th>
                  <th>Skills</th>
                  <th>Availability</th>
                  <th>Pricing</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${profiles.map(profile => {
                  const userName = profile.user?.profile?.name || profile.user?.email || 'N/A';
                  return `
                    <tr>
                      <td>${userName}</td>
                      <td>${profile.providerType}</td>
                      <td>${(profile.skills || []).slice(0, 3).join(', ')}${(profile.skills || []).length > 3 ? '...' : ''}</td>
                      <td><span class="status-badge status-${profile.availabilityStatus.toLowerCase()}">${profile.availabilityStatus}</span></td>
                      <td>${profile.pricingModel}${profile.hourlyRate ? ` (${profile.hourlyRate} SAR/hr)` : ''}</td>
                      <td>
                        <button class="btn btn-sm btn-primary" onclick="AdminServiceProviders.viewProfile('${profile.id}')">View</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      contentEl.innerHTML = providersHtml;
    },

    viewProfile(profileId) {
      // Navigate to profile view
      window.location.href = '../../../service-providers/profile/';
    }
  };

  window.AdminServiceProviders = AdminServiceProviders;

})();

