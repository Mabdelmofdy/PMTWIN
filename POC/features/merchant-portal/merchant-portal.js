/**
 * Merchant Portal Component
 * Dedicated dashboard for vendors/merchants to manage service offerings
 */

(function() {
  'use strict';

  let currentUser = null;

  // ============================================
  // Initialization
  // ============================================
  async function init(params) {
    try {
      const container = document.getElementById('merchantPortalContent');
      if (!container) return;

      container.innerHTML = '<p>Loading merchant portal...</p>';

      // Get current user
      if (typeof PMTwinData !== 'undefined') {
        currentUser = PMTwinData.Sessions.getCurrentUser();
      }

      if (!currentUser) {
        container.innerHTML = '<p class="alert alert-error">Please log in to access the merchant portal.</p>';
        return;
      }

      // Load merchant dashboard data
      const dashboardData = await loadMerchantDashboardData();
      renderMerchantDashboard(container, dashboardData);
    } catch (error) {
      console.error('Error initializing merchant portal:', error);
      const container = document.getElementById('merchantPortalContent');
      if (container) {
        container.innerHTML = '<p class="alert alert-error">Error loading merchant portal. Please refresh the page.</p>';
      }
    }
  }

  // ============================================
  // Load Merchant Dashboard Data
  // ============================================
  async function loadMerchantDashboardData() {
    const data = {
      user: currentUser || {},
      statistics: {
        totalOfferings: 0,
        activeOfferings: 0,
        pausedOfferings: 0,
        draftOfferings: 0,
        totalViews: 0,
        totalInquiries: 0,
        totalMatches: 0
      },
      recentOfferings: [],
      recentActivity: [],
      topPerformingOfferings: []
    };

    // Load statistics from service offering service
    if (typeof ServiceOfferingService !== 'undefined' && currentUser) {
      try {
        const statsResult = await ServiceOfferingService.getProviderStatistics(currentUser.id);
        if (statsResult.success && statsResult.statistics) {
          data.statistics = {
            ...data.statistics,
            ...statsResult.statistics
          };
        }
      } catch (error) {
        console.error('Error loading statistics:', error);
      }

      // Load recent offerings
      try {
        const offeringsResult = await ServiceOfferingService.getMyOfferings();
        if (offeringsResult.success && offeringsResult.offerings) {
          // Sort by updated date (most recent first) and take top 5
          data.recentOfferings = offeringsResult.offerings
            .sort((a, b) => {
              const dateA = new Date(a.updatedAt || a.createdAt || 0);
              const dateB = new Date(b.updatedAt || b.createdAt || 0);
              return dateB - dateA;
            })
            .slice(0, 5);
        }
      } catch (error) {
        console.error('Error loading recent offerings:', error);
      }
    }

    // Load recent activity (from proposals, inquiries, etc.)
    // Try to get proposals if ProposalService is available
    if (typeof ProposalService !== 'undefined' && currentUser) {
      try {
        const proposalsResult = await ProposalService.getProposals();
        if (proposalsResult.success && proposalsResult.proposals) {
          // Filter proposals related to current user's offerings or projects
          const userProposals = proposalsResult.proposals
            .filter(p => p.providerId === currentUser.id || p.userId === currentUser.id)
            .slice(0, 5)
            .map(proposal => ({
              type: 'proposal',
              title: `Proposal: ${proposal.projectTitle || proposal.title || 'Untitled'}`,
              details: `Status: ${proposal.status || 'Pending'}`,
              date: proposal.createdAt || proposal.date,
              icon: '<i class="ph ph-file-text"></i>'
            }));
          data.recentActivity = [...data.recentActivity, ...userProposals].slice(0, 5);
        }
      } catch (error) {
        console.error('Error loading recent activity:', error);
      }
    }

    return data;
  }

  // ============================================
  // Render Merchant Dashboard
  // ============================================
  function renderMerchantDashboard(container, data) {
    const user = data.user || {};
    const stats = data.statistics || {};
    const recentOfferings = data.recentOfferings || [];
    const recentActivity = data.recentActivity || [];

    const basePath = getBasePath();

    let html = `
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div>
            <h1 style="margin: 0 0 0.5rem 0;">Merchant Portal</h1>
            <p style="color: var(--text-secondary); margin: 0;">Welcome back, ${user.name || user.email || 'Merchant'}! Manage your service offerings and track performance.</p>
          </div>
          <a href="${basePath}my-services/" class="btn btn-primary">
            <i class="ph ph-plus"></i> Create New Offering
          </a>
        </div>
      </div>
      
      <!-- Statistics Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="card" style="transition: transform 0.2s, box-shadow 0.2s;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <h3 style="margin: 0; font-size: 2.5rem; font-weight: var(--font-weight-bold); color: var(--color-primary);">${stats.totalOfferings || 0}</h3>
              <i class="ph ph-package" style="font-size: 2rem; color: var(--color-primary); opacity: 0.3;"></i>
            </div>
            <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);">Total Offerings</p>
          </div>
        </div>
        
        <div class="card" style="transition: transform 0.2s, box-shadow 0.2s;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <h3 style="margin: 0; font-size: 2.5rem; font-weight: var(--font-weight-bold); color: var(--color-success);">${stats.activeOfferings || 0}</h3>
              <i class="ph ph-check-circle" style="font-size: 2rem; color: var(--color-success); opacity: 0.3;"></i>
            </div>
            <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);">Active Offerings</p>
          </div>
        </div>
        
        <div class="card" style="transition: transform 0.2s, box-shadow 0.2s;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <h3 style="margin: 0; font-size: 2.5rem; font-weight: var(--font-weight-bold); color: var(--color-primary);">${stats.totalViews || 0}</h3>
              <i class="ph ph-eye" style="font-size: 2rem; color: var(--color-primary); opacity: 0.3;"></i>
            </div>
            <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);">Total Views</p>
          </div>
        </div>
        
        <div class="card" style="transition: transform 0.2s, box-shadow 0.2s;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <h3 style="margin: 0; font-size: 2.5rem; font-weight: var(--font-weight-bold); color: var(--color-primary);">${stats.totalInquiries || 0}</h3>
              <i class="ph ph-envelope" style="font-size: 2rem; color: var(--color-primary); opacity: 0.3;"></i>
            </div>
            <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);">Inquiries</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-body">
          <h2 style="margin: 0 0 1rem 0;">Quick Actions</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <a href="${basePath}my-services/" class="btn btn-outline" style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
              <i class="ph ph-package"></i> Manage Offerings
            </a>
            <a href="${basePath}services-marketplace/" class="btn btn-outline" style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
              <i class="ph ph-storefront"></i> Browse Marketplace
            </a>
            <a href="${basePath}proposals/" class="btn btn-outline" style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
              <i class="ph ph-file-text"></i> View Proposals
            </a>
            <a href="${basePath}profile/" class="btn btn-outline" style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
              <i class="ph ph-user"></i> Edit Profile
            </a>
          </div>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
        <!-- Recent Offerings -->
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h2 style="margin: 0;">Recent Offerings</h2>
              <a href="${basePath}my-services/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">View All <i class="ph ph-arrow-right"></i></a>
            </div>
    `;

    if (recentOfferings.length > 0) {
      html += `<ul style="list-style: none; padding: 0; margin: 0;">`;
      
      recentOfferings.forEach(offering => {
        const statusColor = offering.status === 'Active' ? 'var(--color-success)' : 
                           offering.status === 'Paused' ? 'var(--color-warning)' : 
                           offering.status === 'Draft' ? 'var(--text-secondary)' : 'var(--text-secondary)';
        
        html += `
          <li style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.25rem;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: var(--font-weight-medium); margin-bottom: 0.25rem;">${offering.title || 'Untitled Offering'}</div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: 0.25rem;">
                  ${offering.category ? offering.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Uncategorized'}
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                  <span style="font-size: var(--font-size-xs); padding: 0.25rem 0.5rem; background: ${statusColor}20; color: ${statusColor}; border-radius: var(--radius);">
                    ${offering.status || 'Draft'}
                  </span>
                  ${offering.views ? `<span style="font-size: var(--font-size-xs); color: var(--text-secondary);"><i class="ph ph-eye"></i> ${offering.views}</span>` : ''}
                </div>
              </div>
            </div>
          </li>
        `;
      });
      
      html += `</ul>`;
    } else {
      html += `
        <div style="text-align: center; padding: 2rem 0;">
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">No service offerings yet</p>
          <a href="${basePath}my-services/" class="btn btn-primary btn-sm">Create Your First Offering</a>
        </div>
      `;
    }

    html += `</div></div>`;

    // Recent Activity
    html += `
      <div class="card">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h2 style="margin: 0;">Recent Activity</h2>
            <a href="${basePath}proposals/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">View All <i class="ph ph-arrow-right"></i></a>
          </div>
    `;
    
    if (recentActivity.length > 0) {
      html += `<ul style="list-style: none; padding: 0; margin: 0;">`;
      
      recentActivity.slice(0, 5).forEach(activity => {
        const date = activity.date || activity.timestamp;
        const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const icon = activity.icon || '<i class="ph ph-file-text"></i>';
        
        html += `
          <li style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); display: flex; align-items: start; gap: 0.75rem;">
            <span style="font-size: 1.2rem;">${icon}</span>
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: var(--font-weight-medium); margin-bottom: 0.25rem;">${activity.title || 'Activity'}</div>
              ${activity.details ? `<div style="font-size: var(--font-size-sm); color: var(--text-secondary);">${activity.details}</div>` : ''}
              <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">${formattedDate}</div>
            </div>
          </li>
        `;
      });
      
      html += `</ul>`;
    } else {
      html += `<p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">No recent activity</p>`;
    }
    
    html += `</div></div>`;
    html += `</div>`; // Close two-column grid

    // Additional Info Section
    html += `
      <div class="card">
        <div class="card-body">
          <h2 style="margin: 0 0 1rem 0;">Getting Started</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);">
              <h3 style="margin: 0 0 0.5rem 0; font-size: var(--font-size-lg);">
                <i class="ph ph-package" style="color: var(--color-primary);"></i> Create Offerings
              </h3>
              <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);">
                List your services to attract potential clients and projects.
              </p>
            </div>
            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);">
              <h3 style="margin: 0 0 0.5rem 0; font-size: var(--font-size-lg);">
                <i class="ph ph-eye" style="color: var(--color-primary);"></i> Track Performance
              </h3>
              <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);">
                Monitor views, inquiries, and engagement with your offerings.
              </p>
            </div>
            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);">
              <h3 style="margin: 0 0 0.5rem 0; font-size: var(--font-size-lg);">
                <i class="ph ph-handshake" style="color: var(--color-primary);"></i> Respond to Inquiries
              </h3>
              <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);">
                Review and respond to proposals and collaboration opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // ============================================
  // Helper: Get Base Path
  // ============================================
  function getBasePath() {
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    return segments.length > 0 ? '../' : '';
  }

  // Export
  if (!window.merchantPortal) window.merchantPortal = {};
  window.merchantPortal.merchantPortal = { init };

})();

