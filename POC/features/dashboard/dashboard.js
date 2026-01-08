/**
 * Dashboard Component
 */

(function() {
  'use strict';

  async function init(params) {
    try {
      const container = document.getElementById('dashboardContent');
      if (!container) return;

      container.innerHTML = '<p>Loading dashboard...</p>';

      // Get dashboard data
      let dashboardData = null;
      
      if (typeof DashboardService !== 'undefined') {
        try {
          console.log('[Dashboard] Calling DashboardService.getDashboardData()');
        const result = await DashboardService.getDashboardData();
          console.log('[Dashboard] DashboardService result:', result);
          if (result && result.success) {
          dashboardData = result.data;
            console.log('[Dashboard] Loaded dashboard data:', {
              hasUser: !!dashboardData?.user,
              hasStats: !!dashboardData?.stats,
              hasAnalytics: !!dashboardData?.analytics,
              role: dashboardData?.role
            });
          } else {
            console.error('[Dashboard] Failed to load dashboard data:', result?.error || 'Unknown error');
          }
        } catch (serviceError) {
          console.error('[Dashboard] Error calling DashboardService:', serviceError);
        }
      } else {
        console.warn('[Dashboard] DashboardService not available');
      }

      // Also try to get dashboardData from window if available
      if (!dashboardData && typeof window.dashboardData !== 'undefined') {
        dashboardData = {
          user: PMTwinData?.Sessions?.getCurrentUser() || {},
          stats: window.dashboardData.userDashboard || {},
          recentActivity: window.dashboardData.recentActivities || [],
          notifications: [],
          analytics: { overview: {}, breakdown: {}, trends: {} }
        };
      }

      // Always render dashboard, even with minimal data
      if (!dashboardData) {
        // Create minimal dashboard data from current user
        const currentUser = PMTwinData?.Sessions?.getCurrentUser() || {};
        dashboardData = {
          user: currentUser,
          role: currentUser.role || 'guest',
          features: [],
          stats: {},
          analytics: { overview: {}, breakdown: {}, trends: {} },
          recentActivity: [],
          notifications: []
        };
        console.warn('[Dashboard] Using minimal dashboard data');
      }

      console.log('[Dashboard] Rendering dashboard with data:', {
        hasUser: !!dashboardData.user,
        hasStats: !!dashboardData.stats && Object.keys(dashboardData.stats).length > 0,
        hasAnalytics: !!dashboardData.analytics && Object.keys(dashboardData.analytics.overview || {}).length > 0,
        role: dashboardData.role
      });
      
      try {
        renderDashboard(container, dashboardData);
        console.log('[Dashboard] Dashboard rendered successfully');
      } catch (renderError) {
        console.error('[Dashboard] Error rendering dashboard:', renderError);
        console.error('[Dashboard] Error stack:', renderError.stack);
        container.innerHTML = `
          <div class="card">
            <div class="card-body">
              <h2>Error Loading Dashboard</h2>
              <p class="alert alert-error">An error occurred while loading the dashboard. Please check the console for details.</p>
              <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-top: 1rem;">
                Error: ${renderError.message || 'Unknown error'}
              </p>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      const container = document.getElementById('dashboardContent');
      if (container) {
        container.innerHTML = '<p>Error loading dashboard. Please refresh the page.</p>';
      }
    }
  }

  function renderDashboard(container, data) {
    const user = data.user || {};
    const role = data.role || user.role || '';
    const features = data.features || [];
    const stats = data.stats || {};
    const recentActivity = data.recentActivity || [];
    const notifications = data.notifications || [];
    const merchantPortal = data.merchantPortal || {};
    const isServiceProvider = role === 'service_provider' || features.includes('merchant_portal');

    // Format stat labels
    function formatStatLabel(key) {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    }

    // Format numbers
    function formatNumber(value) {
      if (typeof value === 'number') {
        if (value >= 1000000) {
          return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
          return (value / 1000).toFixed(1) + 'K';
        }
        return value.toString();
      }
      return value || 0;
    }

    // Get base path for links
    function getBasePath() {
      const currentPath = window.location.pathname;
      const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
      return segments.length > 0 ? '../' : '';
    }
    const basePath = getBasePath();

    // Determine dashboard title and subtitle based on role
    const isEntity = role === 'project_lead' || role === 'entity' || role === 'vendor';
    const isIndividual = role === 'professional' || role === 'individual' || role === 'consultant';
    
    let dashboardTitle = 'Welcome back, ' + (user.name || user.email || 'User') + '!';
    let dashboardSubtitle = "Here's what's happening with your projects";
    
    if (isServiceProvider) {
      dashboardTitle = 'Merchant Portal';
      dashboardSubtitle = 'Manage your service offerings and track performance';
    } else if (role === 'supplier') {
      dashboardTitle = 'Supplier Dashboard';
      dashboardSubtitle = 'Manage bulk purchasing, inventory listings, and strategic alliances';
    } else if (isEntity) {
      dashboardTitle = 'Project Lead Dashboard';
      dashboardSubtitle = 'Manage your projects, proposals, and collaborations';
    } else if (role === 'platform_admin' || role === 'admin') {
      dashboardTitle = 'Admin Dashboard';
      dashboardSubtitle = 'Platform overview and management';
    } else if (isIndividual) {
      dashboardTitle = 'Professional Dashboard';
      dashboardSubtitle = 'Track your proposals, matches, and opportunities';
    } else if (role === 'mentor') {
      dashboardTitle = 'Mentor Dashboard';
      dashboardSubtitle = 'Manage your mentorship programs and mentees';
    } else if (role === 'auditor') {
      dashboardTitle = 'Auditor Dashboard';
      dashboardSubtitle = 'Platform audit and reporting';
    }

    let html = `
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div>
            <h2 style="margin: 0 0 0.5rem 0;">${dashboardTitle}</h2>
            <p style="color: var(--text-secondary); margin: 0;">${dashboardSubtitle}</p>
          </div>
          ${isServiceProvider ? `
            <a href="${basePath}my-services/" class="btn btn-primary">
              <i class="ph ph-plus"></i> Create New Offering
            </a>
          ` : ''}
        </div>
      </div>
    `;

    // Account Analytics Overview Section
    const analytics = data.analytics || {};
    const analyticsOverview = analytics.overview || {};
    
    console.log('[Dashboard] Analytics data:', {
      hasAnalytics: !!analytics,
      hasOverview: !!analyticsOverview,
      overviewKeys: analyticsOverview ? Object.keys(analyticsOverview) : [],
      overviewCount: analyticsOverview ? Object.keys(analyticsOverview).length : 0,
      role: data.role
    });
    
    // Show analytics overview if we have data (even if values are 0, we still want to show the structure)
    // This ensures role-specific analytics are always visible
    if (analyticsOverview && Object.keys(analyticsOverview).length > 0) {
      console.log('[Dashboard] Rendering analytics overview with', Object.keys(analyticsOverview).length, 'metrics');
      html += `
        <div class="card" style="margin-bottom: 2rem; background: linear-gradient(135deg, var(--color-primary)05 0%, var(--bg-primary) 100%); border: 1px solid var(--border-color);">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h2 style="margin: 0;">Account Analytics Overview</h2>
              <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">All Time</span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
      `;

      // Render overview metrics
      Object.entries(analyticsOverview).forEach(([key, metric]) => {
        const displayValue = typeof metric.value === 'string' ? metric.value : formatNumber(metric.value);
        const hasBreakdown = metric.breakdown && Object.keys(metric.breakdown).length > 0;
        
        html += `
          <div style="padding: 1.5rem; background: white; border-radius: var(--radius); box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 4px solid ${metric.color || 'var(--color-primary)'};">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
              <div style="font-size: 1.5rem; color: ${metric.color || 'var(--color-primary)'};">
                ${metric.icon || '<i class="ph ph-circle"></i>'}
              </div>
              <div style="flex: 1;">
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: 0.25rem;">${metric.label || key}</div>
                <div style="font-size: 2rem; font-weight: 700; color: ${metric.color || 'var(--color-primary)'}; line-height: 1;">
                  ${displayValue}
                  ${metric.currency ? ` <span style="font-size: var(--font-size-sm); font-weight: 400;">${metric.currency}</span>` : ''}
                  ${metric.maxValue ? ` <span style="font-size: var(--font-size-sm); font-weight: 400; color: var(--text-secondary);">/ ${metric.maxValue}</span>` : ''}
                </div>
                ${metric.subValue ? `
                  <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.5rem;">
                    ${metric.subValue}
                  </div>
                ` : ''}
              </div>
            </div>
            ${hasBreakdown ? `
              <div style="padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <div style="display: grid; grid-template-columns: repeat(${Object.keys(metric.breakdown).length}, 1fr); gap: 0.5rem;">
            ` : ''}
        `;

        if (hasBreakdown) {
          Object.entries(metric.breakdown).forEach(([breakdownKey, breakdownValue]) => {
            const breakdownLabel = breakdownKey.charAt(0).toUpperCase() + breakdownKey.slice(1).replace(/([A-Z])/g, ' $1');
            html += `
              <div style="text-align: center;">
                <div style="font-size: var(--font-size-lg); font-weight: 600; color: ${metric.color || 'var(--color-primary)'};">
                  ${formatNumber(breakdownValue)}
                </div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  ${breakdownLabel}
                </div>
              </div>
            `;
          });
        }

        if (hasBreakdown) {
          html += `
                </div>
              </div>
          `;
        }

        html += `
          </div>
        `;
      });

      html += `
            </div>
          </div>
        </div>
      `;

      // Detailed Breakdown Section
      const breakdown = analytics.breakdown || {};
      if (Object.keys(breakdown).length > 0) {
        html += `
          <div class="card" style="margin-bottom: 2rem;">
            <div class="card-body">
              <h2 style="margin: 0 0 1.5rem 0;">Detailed Breakdown</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
        `;

        Object.entries(breakdown).forEach(([key, data]) => {
          const sectionTitle = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
          
          html += `
            <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius);">
              <h3 style="margin: 0 0 1rem 0; font-size: var(--font-size-lg);">${sectionTitle}</h3>
              <div style="display: grid; gap: 0.75rem;">
          `;

          if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            Object.entries(data).forEach(([itemKey, itemValue]) => {
              const itemLabel = itemKey.charAt(0).toUpperCase() + itemKey.slice(1).replace(/([A-Z])/g, ' $1');
              const total = Object.values(data).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
              const percentage = total > 0 ? ((itemValue / total) * 100).toFixed(1) : 0;
              
              html += `
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                    <span style="font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);">${itemLabel}</span>
                    <span style="font-size: var(--font-size-sm); font-weight: 600; color: var(--color-primary);">
                      ${formatNumber(itemValue)} <span style="color: var(--text-secondary); font-weight: 400;">(${percentage}%)</span>
                    </span>
                  </div>
                  <div style="height: 6px; background: var(--bg-primary); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${percentage}%; background: var(--color-primary); transition: width 0.3s;"></div>
                  </div>
                </div>
              `;
            });
          }

          html += `
              </div>
            </div>
          `;
        });

        html += `
              </div>
            </div>
          </div>
        `;
      }
    }

    // Original stats cards section (for backward compatibility)
    html += `
      <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
    `;

    // Stats cards
    const statEntries = Object.entries(stats);
    if (statEntries.length > 0) {
      statEntries.forEach(([key, value]) => {
        html += `
          <div class="card" style="transition: transform 0.2s, box-shadow 0.2s;">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <h3 style="margin: 0; font-size: 2.5rem; font-weight: var(--font-weight-bold); color: var(--color-primary);">${formatNumber(value)}</h3>
              </div>
              <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);">${formatStatLabel(key)}</p>
            </div>
          </div>
        `;
      });
    } else {
      // Default stats if none available
      html += `
        <div class="card">
          <div class="card-body">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem;">0</h3>
            <p style="margin: 0; color: var(--text-secondary);">Projects</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem;">0</h3>
            <p style="margin: 0; color: var(--text-secondary);">Proposals</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem;">0</h3>
            <p style="margin: 0; color: var(--text-secondary);">Matches</p>
          </div>
        </div>
      `;
    }

    html += `</div>`;

    // Enhanced Merchant Portal Features Section
    if (isServiceProvider) {
      const merchantData = merchantPortal || {};
      const performanceMetrics = merchantData.performanceMetrics || {};
      const topPerforming = merchantData.topPerformingOfferings || [];
      const categoryBreakdown = merchantData.categoryBreakdown || {};
      const proposalBreakdown = merchantData.proposalBreakdown || {};
      const engagementDetails = merchantData.engagementDetails || {};
      const matchDetails = merchantData.matchDetails || {};
      
      // Comprehensive Statistics Summary
      html += `
        <div class="card" style="margin-bottom: 2rem; background: linear-gradient(135deg, var(--color-primary)10 0%, var(--bg-primary) 100%); border: 1px solid var(--color-primary)30;">
          <div class="card-body">
            <h2 style="margin: 0 0 1.5rem 0;">Complete Merchant Portal Overview</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
              <div style="padding: 1rem; background: white; border-radius: var(--radius); text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.25rem;">${stats.totalOfferings || 0}</div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Total Offerings</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  ${stats.activeOfferings || 0} active
                </div>
              </div>
              <div style="padding: 1rem; background: white; border-radius: var(--radius); text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.25rem;">${stats.totalViews || 0}</div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Total Views</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  ${performanceMetrics.averageViewsPerOffering || 0} avg/offering
                </div>
              </div>
              <div style="padding: 1rem; background: white; border-radius: var(--radius); text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-success); margin-bottom: 0.25rem;">${stats.totalInquiries || 0}</div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Total Inquiries</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  ${performanceMetrics.conversionRate || 0}% conversion
                </div>
              </div>
              <div style="padding: 1rem; background: white; border-radius: var(--radius); text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.25rem;">${proposalBreakdown.total || 0}</div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Total Proposals</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  ${proposalBreakdown.byStatus?.approved || 0} approved
                </div>
              </div>
              <div style="padding: 1rem; background: white; border-radius: var(--radius); text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.25rem;">${engagementDetails.total || 0}</div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Engagements</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  ${engagementDetails.active || 0} active
                </div>
              </div>
              <div style="padding: 1rem; background: white; border-radius: var(--radius); text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.25rem;">${matchDetails.total || 0}</div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Matches</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  ${matchDetails.averageScore || 0}% avg score
                </div>
              </div>
              <div style="padding: 1rem; background: white; border-radius: var(--radius); text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.25rem;">${Math.round(performanceMetrics.averageQualityScore || 0)}</div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Avg Quality</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  ${performanceMetrics.averageQualityScore >= 80 ? 'Excellent' : performanceMetrics.averageQualityScore >= 50 ? 'Good' : 'Improve'}
                </div>
              </div>
              <div style="padding: 1rem; background: white; border-radius: var(--radius); text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 1.5rem; font-weight: 600; color: var(--color-success); margin-bottom: 0.25rem;">${merchantStats.completedEngagements || 0}</div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Completed</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  Engagements
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Performance Analytics Section
      html += `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2 style="margin: 0 0 1.5rem 0;">Performance Analytics</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
              <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.5rem;">
                  ${performanceMetrics.conversionRate || 0}%
                </div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">View to Inquiry Rate</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  ${stats.totalViews || 0} views → ${stats.totalInquiries || 0} inquiries
                </div>
              </div>
              
              <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                <div style="font-size: 2rem; font-weight: 600; color: var(--color-success); margin-bottom: 0.5rem;">
                  ${performanceMetrics.inquiryToProposalRate || 0}%
                </div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Inquiry to Proposal Rate</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  ${stats.totalInquiries || 0} inquiries → ${merchantStats.totalProposals || 0} proposals
                </div>
              </div>
              
              <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.5rem;">
                  ${Math.round(performanceMetrics.averageQualityScore || 0)}/100
                </div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Avg Quality Score</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  ${performanceMetrics.averageQualityScore >= 80 ? 'Excellent' : performanceMetrics.averageQualityScore >= 50 ? 'Good' : 'Needs Improvement'}
                </div>
              </div>
              
              <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.5rem;">
                  ${performanceMetrics.averageViewsPerOffering || 0}
                </div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Avg Views/Offering</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">
                  Per active offering
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Top Performing Offerings Section
      if (topPerforming.length > 0) {
        html += `
          <div class="card" style="margin-bottom: 2rem;">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0;">Top Performing Offerings</h2>
                <a href="${basePath}my-services/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">View All <i class="ph ph-arrow-right"></i></a>
              </div>
              <div style="display: grid; gap: 1rem;">
        `;
        
        topPerforming.forEach((offering, index) => {
          const performanceScore = ((offering.views || 0) * 0.3 + (offering.inquiries || 0) * 0.5 + (offering.qualityScore || 0) * 0.2).toFixed(1);
          const medalIcon = index === 0 ? '<i class="ph ph-medal" style="color: #FFD700;"></i>' : 
                           index === 1 ? '<i class="ph ph-medal" style="color: #C0C0C0;"></i>' : 
                           index === 2 ? '<i class="ph ph-medal" style="color: #CD7F32;"></i>' : '';
          
          html += `
            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1; display: flex; align-items: center; gap: 1rem;">
                <div style="font-size: 1.5rem;">${medalIcon}</div>
                <div style="flex: 1;">
                  <div style="font-weight: var(--font-weight-medium); margin-bottom: 0.25rem;">${offering.title || 'Untitled Offering'}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                    ${offering.category ? offering.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Uncategorized'}
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 1.5rem; align-items: center;">
                <div style="text-align: center;">
                  <div style="font-weight: 600; color: var(--color-primary);">${offering.views || 0}</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Views</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-weight: 600; color: var(--color-success);">${offering.inquiries || 0}</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Inquiries</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-weight: 600; color: var(--color-primary);">${Math.round(offering.qualityScore || 0)}</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Quality</div>
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
      }

      // Category Performance Breakdown
      const categoryEntries = Object.entries(categoryBreakdown);
      if (categoryEntries.length > 0) {
        html += `
          <div class="card" style="margin-bottom: 2rem;">
            <div class="card-body">
              <h2 style="margin: 0 0 1rem 0;">Performance by Category</h2>
              <div style="display: grid; gap: 1rem;">
        `;
        
        categoryEntries
          .sort((a, b) => b[1].totalViews - a[1].totalViews)
          .forEach(([category, data]) => {
            const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const avgViews = data.active > 0 ? (data.totalViews / data.active).toFixed(1) : 0;
            const avgInquiries = data.active > 0 ? (data.totalInquiries / data.active).toFixed(1) : 0;
            
            html += `
              <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <div style="font-weight: var(--font-weight-medium);">${categoryName}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                    ${data.active} active / ${data.count} total
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 0.75rem;">
                  <div>
                    <div style="font-weight: 600; color: var(--color-primary);">${data.totalViews}</div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Total Views</div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">Avg: ${avgViews}</div>
                  </div>
                  <div>
                    <div style="font-weight: 600; color: var(--color-success);">${data.totalInquiries}</div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Total Inquiries</div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">Avg: ${avgInquiries}</div>
                  </div>
                  <div>
                    <div style="font-weight: 600; color: var(--color-primary);">
                      ${data.totalViews > 0 ? ((data.totalInquiries / data.totalViews) * 100).toFixed(1) : 0}%
                    </div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Conversion</div>
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
      }

      // Insights & Recommendations Section
      html += `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2 style="margin: 0 0 1rem 0;">Insights & Recommendations</h2>
            <div style="display: grid; gap: 1rem;">
      `;
      
      // Generate insights based on data
      const insights = [];
      
      if (merchantStats.draftOfferings > 0) {
        insights.push({
          type: 'info',
          icon: '<i class="ph ph-info"></i>',
          title: 'Draft Offerings',
          message: `You have ${merchantStats.draftOfferings} draft ${merchantStats.draftOfferings === 1 ? 'offering' : 'offerings'}. Consider publishing them to increase visibility.`,
          action: { text: 'View Drafts', link: `${basePath}my-services/?status=Draft` }
        });
      }
      
      if (performanceMetrics.averageQualityScore < 50) {
        insights.push({
          type: 'warning',
          icon: '<i class="ph ph-warning"></i>',
          title: 'Quality Score Improvement',
          message: 'Your average quality score is below 50. Improve your offerings by adding more details, skills, and portfolio items.',
          action: { text: 'Improve Offerings', link: `${basePath}my-services/` }
        });
      }
      
      if (stats.activeOfferings === 0 && stats.totalOfferings > 0) {
        insights.push({
          type: 'warning',
          icon: '<i class="ph ph-pause"></i>',
          title: 'No Active Offerings',
          message: 'All your offerings are paused or archived. Activate them to start receiving inquiries.',
          action: { text: 'Activate Offerings', link: `${basePath}my-services/` }
        });
      }
      
      if (parseFloat(performanceMetrics.conversionRate) < 5 && stats.totalViews > 10) {
        insights.push({
          type: 'info',
          icon: '<i class="ph ph-lightbulb"></i>',
          title: 'Low Conversion Rate',
          message: 'Your view-to-inquiry conversion rate is low. Consider improving your offering descriptions and pricing clarity.',
          action: { text: 'Optimize Offerings', link: `${basePath}my-services/` }
        });
      }
      
      if (topPerforming.length > 0 && topPerforming[0].qualityScore >= 80) {
        insights.push({
          type: 'success',
          icon: '<i class="ph ph-check-circle"></i>',
          title: 'Top Performer',
          message: `"${topPerforming[0].title}" is your best performing offering. Consider creating similar offerings.`,
          action: { text: 'View Offering', link: `${basePath}my-services/` }
        });
      }
      
      if (insights.length === 0) {
        insights.push({
          type: 'success',
          icon: '<i class="ph ph-check-circle"></i>',
          title: 'All Good!',
          message: 'Your merchant portal is performing well. Keep up the great work!',
          action: null
        });
      }
      
      insights.forEach(insight => {
        const colorMap = {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          info: 'var(--color-primary)',
          error: 'var(--color-danger)'
        };
        const bgColorMap = {
          success: 'var(--color-success)20',
          warning: 'var(--color-warning)20',
          info: 'var(--color-primary)20',
          error: 'var(--color-danger)20'
        };
        
        html += `
          <div style="padding: 1rem; background: ${bgColorMap[insight.type] || bgColorMap.info}; border-left: 3px solid ${colorMap[insight.type] || colorMap.info}; border-radius: var(--radius);">
            <div style="display: flex; align-items: start; gap: 0.75rem;">
              <div style="font-size: 1.5rem; color: ${colorMap[insight.type] || colorMap.info};">
                ${insight.icon}
              </div>
              <div style="flex: 1;">
                <div style="font-weight: var(--font-weight-medium); margin-bottom: 0.25rem;">${insight.title}</div>
                <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: ${insight.action ? '0.5rem' : '0'};">
                  ${insight.message}
                </div>
                ${insight.action ? `
                  <a href="${insight.action.link}" style="font-size: var(--font-size-sm); color: ${colorMap[insight.type] || colorMap.info}; text-decoration: none; font-weight: var(--font-weight-medium);">
                    ${insight.action.text} <i class="ph ph-arrow-right"></i>
                  </a>
                ` : ''}
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
      
      // All Offerings Detailed View
      const allOfferings = merchantData.allOfferings || [];
      if (allOfferings.length > 0) {
        html += `
          <div class="card" style="margin-bottom: 2rem;">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0;">All Service Offerings</h2>
                <a href="${basePath}my-services/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">Manage All <i class="ph ph-arrow-right"></i></a>
              </div>
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 2px solid var(--border-color);">
                      <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Title</th>
                      <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Category</th>
                      <th style="padding: 0.75rem; text-align: center; font-weight: 600;">Status</th>
                      <th style="padding: 0.75rem; text-align: center; font-weight: 600;">Views</th>
                      <th style="padding: 0.75rem; text-align: center; font-weight: 600;">Inquiries</th>
                      <th style="padding: 0.75rem; text-align: center; font-weight: 600;">Quality</th>
                      <th style="padding: 0.75rem; text-align: center; font-weight: 600;">Price Range</th>
                      <th style="padding: 0.75rem; text-align: center; font-weight: 600;">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
        `;
        
        allOfferings.forEach(offering => {
          const statusColor = offering.status === 'Active' ? 'var(--color-success)' : 
                             offering.status === 'Paused' ? 'var(--color-warning)' : 
                             offering.status === 'Draft' ? 'var(--text-secondary)' : 'var(--text-secondary)';
          const qualityColor = (offering.qualityScore || 0) >= 80 ? 'var(--color-success)' : 
                              (offering.qualityScore || 0) >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
          const priceRange = offering.price_min && offering.price_max 
            ? `${offering.price_min.toLocaleString()} - ${offering.price_max.toLocaleString()} ${offering.currency || 'SAR'}`
            : 'Not set';
          const updatedDate = offering.updatedAt || offering.createdAt;
          const formattedDate = updatedDate ? new Date(updatedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
          
          html += `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.75rem;">
                <div style="font-weight: var(--font-weight-medium);">${offering.title || 'Untitled'}</div>
                ${offering.shortDescription ? `<div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">${offering.shortDescription.substring(0, 50)}...</div>` : ''}
              </td>
              <td style="padding: 0.75rem;">
                <div style="font-size: var(--font-size-sm);">${offering.category ? offering.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Uncategorized'}</div>
                ${offering.delivery_mode ? `<div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${offering.delivery_mode}</div>` : ''}
              </td>
              <td style="padding: 0.75rem; text-align: center;">
                <span style="font-size: var(--font-size-xs); padding: 0.25rem 0.5rem; background: ${statusColor}20; color: ${statusColor}; border-radius: var(--radius);">
                  ${offering.status || 'Draft'}
                </span>
              </td>
              <td style="padding: 0.75rem; text-align: center;">
                <div style="font-weight: 600; color: var(--color-primary);">${offering.views || 0}</div>
              </td>
              <td style="padding: 0.75rem; text-align: center;">
                <div style="font-weight: 600; color: var(--color-success);">${offering.inquiries || 0}</div>
              </td>
              <td style="padding: 0.75rem; text-align: center;">
                <div style="font-weight: 600; color: ${qualityColor};">${Math.round(offering.qualityScore || 0)}</div>
              </td>
              <td style="padding: 0.75rem; text-align: center;">
                <div style="font-size: var(--font-size-sm);">${priceRange}</div>
              </td>
              <td style="padding: 0.75rem; text-align: center;">
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${formattedDate}</div>
              </td>
            </tr>
          `;
        });
        
        html += `
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      }
      
      // Proposal Breakdown Section
      if (proposalBreakdown.total > 0) {
        html += `
          <div class="card" style="margin-bottom: 2rem;">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0;">Proposal Status Breakdown</h2>
                <a href="${basePath}proposals/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">View All <i class="ph ph-arrow-right"></i></a>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                  <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${proposalBreakdown.total || 0}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Total Proposals</div>
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                  <div style="font-size: 2rem; font-weight: 600; color: var(--color-warning);">${proposalBreakdown.byStatus?.pending || 0}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Pending</div>
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                  <div style="font-size: 2rem; font-weight: 600; color: var(--color-success);">${proposalBreakdown.byStatus?.approved || 0}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Approved</div>
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                  <div style="font-size: 2rem; font-weight: 600; color: var(--color-danger);">${proposalBreakdown.byStatus?.rejected || 0}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Rejected</div>
                </div>
              </div>
        `;
        
        if (proposalBreakdown.recent && proposalBreakdown.recent.length > 0) {
          html += `
            <div>
              <h3 style="margin: 0 0 0.75rem 0; font-size: var(--font-size-lg);">Recent Proposals</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
          `;
          
          proposalBreakdown.recent.slice(0, 5).forEach(proposal => {
            const statusColor = proposal.status === 'approved' || proposal.status === 'accepted' ? 'var(--color-success)' :
                               proposal.status === 'rejected' || proposal.status === 'declined' ? 'var(--color-danger)' :
                               'var(--color-warning)';
            const project = typeof PMTwinData !== 'undefined' ? PMTwinData.Projects.getById(proposal.projectId) : null;
            const projectTitle = project?.title || 'Unknown Project';
            const date = proposal.submittedAt || proposal.createdAt;
            const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
            
            html += `
              <li style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <div style="font-weight: var(--font-weight-medium); margin-bottom: 0.25rem;">${projectTitle}</div>
                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                      ${proposal.type ? proposal.type.charAt(0).toUpperCase() + proposal.type.slice(1) : 'Proposal'}
                      ${proposal.total ? ` • ${proposal.total.toLocaleString()} ${proposal.currency || 'SAR'}` : ''}
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-size: var(--font-size-xs); padding: 0.25rem 0.5rem; background: ${statusColor}20; color: ${statusColor}; border-radius: var(--radius);">
                      ${proposal.status || 'Pending'}
                    </span>
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">${formattedDate}</div>
                  </div>
                </div>
              </li>
            `;
          });
          
          html += `
              </ul>
            </div>
          `;
        }
        
        html += `
            </div>
          </div>
        `;
      }
      
      // Engagement Details Section
      if (engagementDetails.total > 0) {
        html += `
          <div class="card" style="margin-bottom: 2rem;">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0;">Engagement Overview</h2>
                <a href="${basePath}collaboration/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">View All <i class="ph ph-arrow-right"></i></a>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                  <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${engagementDetails.total || 0}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Total Engagements</div>
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                  <div style="font-size: 2rem; font-weight: 600; color: var(--color-success);">${engagementDetails.active || 0}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Active</div>
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                  <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${engagementDetails.completed || 0}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Completed</div>
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                  <div style="font-size: 2rem; font-weight: 600; color: var(--color-warning);">${engagementDetails.pending || 0}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Pending</div>
                </div>
              </div>
        `;
        
        if (engagementDetails.recent && engagementDetails.recent.length > 0) {
          html += `
            <div>
              <h3 style="margin: 0 0 0.75rem 0; font-size: var(--font-size-lg);">Recent Engagements</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
          `;
          
          engagementDetails.recent.forEach(engagement => {
            const statusColor = engagement.status === 'active' ? 'var(--color-success)' :
                               engagement.status === 'completed' ? 'var(--color-primary)' :
                               'var(--color-warning)';
            const date = engagement.createdAt;
            const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
            
            html += `
              <li style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <div style="font-weight: var(--font-weight-medium); margin-bottom: 0.25rem;">${engagement.title || engagement.modelName || 'Engagement'}</div>
                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                      ${engagement.modelId ? `Model ${engagement.modelId}` : 'Task-Based'}
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-size: var(--font-size-xs); padding: 0.25rem 0.5rem; background: ${statusColor}20; color: ${statusColor}; border-radius: var(--radius);">
                      ${engagement.status || 'Pending'}
                    </span>
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">${formattedDate}</div>
                  </div>
                </div>
              </li>
            `;
          });
          
          html += `
              </ul>
            </div>
          `;
        }
        
        html += `
            </div>
          </div>
        `;
      }
      
      // Match Details Section
      if (matchDetails.total > 0) {
        html += `
          <div class="card" style="margin-bottom: 2rem;">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0;">Match Performance</h2>
                <a href="${basePath}matches/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">View All <i class="ph ph-arrow-right"></i></a>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                  <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${matchDetails.total || 0}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Total Matches</div>
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                  <div style="font-size: 2rem; font-weight: 600; color: var(--color-success);">${matchDetails.highScore || 0}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">High Score (≥80%)</div>
                </div>
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius); text-align: center;">
                  <div style="font-size: 2rem; font-weight: 600; color: var(--color-primary);">${matchDetails.averageScore || 0}%</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Avg Match Score</div>
                </div>
              </div>
        `;
        
        if (matchDetails.recent && matchDetails.recent.length > 0) {
          html += `
            <div>
              <h3 style="margin: 0 0 0.75rem 0; font-size: var(--font-size-lg);">Recent Matches</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
          `;
          
          matchDetails.recent.slice(0, 5).forEach(match => {
            const project = typeof PMTwinData !== 'undefined' ? PMTwinData.Projects.getById(match.projectId) : null;
            const projectTitle = project?.title || 'Unknown Project';
            const scoreColor = (match.score || 0) >= 80 ? 'var(--color-success)' :
                              (match.score || 0) >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
            const date = match.createdAt;
            const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
            
            html += `
              <li style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <div style="font-weight: var(--font-weight-medium); margin-bottom: 0.25rem;">${projectTitle}</div>
                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                      Match Score: <span style="font-weight: 600; color: ${scoreColor};">${Math.round(match.score || 0)}%</span>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${formattedDate}</div>
                  </div>
                </div>
              </li>
            `;
          });
          
          html += `
              </ul>
            </div>
          `;
        }
        
        html += `
            </div>
          </div>
        `;
      }
    }

    // Merchant Portal Quick Actions (for service providers)
    if (isServiceProvider) {
      html += `
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
      `;
    }

    // Two column layout for activity and notifications (or three columns for service providers)
    // Use responsive grid that adapts to screen size
    const gridColumns = isServiceProvider && merchantPortal.recentOfferings?.length > 0 ? 'repeat(auto-fit, minmax(300px, 1fr))' : 'repeat(auto-fit, minmax(300px, 1fr))';
    html += `
      <div style="display: grid; grid-template-columns: ${gridColumns}; gap: 1.5rem; margin-bottom: 2rem;">
    `;

    // Recent Offerings Section (for service providers)
    if (isServiceProvider && merchantPortal.recentOfferings?.length > 0) {
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h2 style="margin: 0;">Recent Offerings</h2>
              <a href="${basePath}my-services/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">View All <i class="ph ph-arrow-right"></i></a>
            </div>
            <ul style="list-style: none; padding: 0; margin: 0;">
      `;
      
      merchantPortal.recentOfferings.slice(0, 5).forEach(offering => {
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
      
      html += `
            </ul>
          </div>
        </div>
      `;
    } else if (isServiceProvider) {
      // Show empty state for service providers with no offerings
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h2 style="margin: 0;">Recent Offerings</h2>
            </div>
            <div style="text-align: center; padding: 2rem 0;">
              <p style="color: var(--text-secondary); margin-bottom: 1rem;">No service offerings yet</p>
              <a href="${basePath}my-services/" class="btn btn-primary btn-sm">Create Your First Offering</a>
            </div>
          </div>
        </div>
      `;
    }

    // Recent Activity
    html += `
      <div class="card">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h2 style="margin: 0;">Recent Activity</h2>
            <a href="${basePath}pipeline/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">View All <i class="ph ph-arrow-right"></i></a>
          </div>
    `;
    
    if (recentActivity.length > 0) {
      html += `<ul style="list-style: none; padding: 0; margin: 0;">`;
      
      recentActivity.slice(0, 8).forEach(activity => {
        const date = activity.date || activity.timestamp;
        const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const icon = activity.icon || '<i class="ph ph-file-text"></i>';
        
        html += `
          <li style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); display: flex; align-items: start; gap: 0.75rem;">
            <span style="font-size: 1.2rem;">${icon}</span>
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: var(--font-weight-medium); margin-bottom: 0.25rem;">${activity.title || activity.entity || activity.action || 'Activity'}</div>
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

    // Notifications
    html += `
      <div class="card">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h2 style="margin: 0;">Notifications</h2>
            <a href="${basePath}notifications/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">View All <i class="ph ph-arrow-right"></i></a>
          </div>
    `;
    
    if (notifications.length > 0) {
      html += `<ul style="list-style: none; padding: 0; margin: 0;">`;
      
      notifications.slice(0, 5).forEach(notification => {
        html += `
          <li style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: var(--font-weight-medium); margin-bottom: 0.25rem;">${notification.title || 'Notification'}</div>
            ${notification.message ? `<p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: var(--font-size-sm);">${notification.message}</p>` : ''}
            ${notification.createdAt ? `<div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 0.25rem;">${new Date(notification.createdAt).toLocaleDateString()}</div>` : ''}
          </li>
        `;
      });
      
      html += `</ul>`;
    } else {
      html += `<p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">No new notifications</p>`;
    }
    
    html += `</div></div>`;
    html += `</div>`; // Close two-column grid

    // Role-Adaptive Sections
    const role = data.role || data.user?.role || '';
    const isEntity = role === 'project_lead' || role === 'entity' || role === 'vendor';
    const isIndividual = role === 'professional' || role === 'individual' || role === 'consultant';
    
    if (isEntity && !isServiceProvider) {
      html += renderEntityDashboard(data, basePath);
    } else if (isIndividual) {
      html += renderIndividualDashboard(data, basePath);
    }

    container.innerHTML = html;
  }

  function renderEntityDashboard(data, basePath) {
    const user = data.user || {};
    
    // Get financial health data
    const activeJVs = typeof PMTwinData !== 'undefined' ? 
      PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        (o.modelId === '1.3' || o.modelId === '2.1') && o.creatorId === user.id && o.status === 'active'
      ) : [];
    
    const activeTenders = typeof PMTwinData !== 'undefined' ?
      PMTwinData.Projects.getAll().filter(p => p.creatorId === user.id && p.status === 'active') : [];
    
    const pendingProposals = typeof PMTwinData !== 'undefined' ?
      PMTwinData.Proposals.getAll().filter(p => {
        const project = PMTwinData.Projects.getById(p.projectId);
        return project && project.creatorId === user.id && (p.status === 'pending' || p.status === 'in_review');
      }) : [];
    
    // Calculate savings
    const bulkPurchasingSavings = typeof PMTwinData !== 'undefined' ?
      PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '3.1' && o.creatorId === user.id
      ).reduce((sum, o) => sum + (o.savings || 0), 0) : 0;
    
    const barterSavings = typeof PMTwinData !== 'undefined' ?
      PMTwinData.Proposals.getAll().filter(p => {
        const project = PMTwinData.Projects.getById(p.projectId);
        return project && project.creatorId === user.id && p.type === 'barter';
      }).reduce((sum, p) => sum + (p.barterValue || 0), 0) : 0;
    
    let html = `
      <div class="content-section">
        <h2 class="section-title">Financial Health Overview</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
          <div class="card" style="border-left: 4px solid var(--color-primary);">
            <div class="card-body">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <i class="ph ph-handshake" style="font-size: 2rem; color: var(--color-primary);"></i>
                <div style="flex: 1;">
                  <div style="font-size: 2rem; font-weight: 700; color: var(--color-primary);">${activeJVs.length}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Active Joint Ventures</div>
                </div>
              </div>
            </div>
          </div>
          <div class="card" style="border-left: 4px solid var(--color-info);">
            <div class="card-body">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <i class="ph ph-clipboard-text" style="font-size: 2rem; color: var(--color-info);"></i>
                <div style="flex: 1;">
                  <div style="font-size: 2rem; font-weight: 700; color: var(--color-info);">${activeTenders.length}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Active Tenders</div>
                </div>
              </div>
            </div>
          </div>
          <div class="card" style="border-left: 4px solid var(--color-warning);">
            <div class="card-body">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <i class="ph ph-file-text" style="font-size: 2rem; color: var(--color-warning);"></i>
                <div style="flex: 1;">
                  <div style="font-size: 2rem; font-weight: 700; color: var(--color-warning);">${pendingProposals.length}</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Pending Proposals</div>
                </div>
              </div>
            </div>
          </div>
          <div class="card" style="border-left: 4px solid var(--color-success);">
            <div class="card-body">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <i class="ph ph-piggy-bank" style="font-size: 2rem; color: var(--color-success);"></i>
                <div style="flex: 1;">
                  <div style="font-size: 2rem; font-weight: 700; color: var(--color-success);">
                    ${((bulkPurchasingSavings + barterSavings) / 1000000).toFixed(1)}M
                  </div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Total Savings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }

  function renderIndividualDashboard(data, basePath) {
    const user = data.user || {};
    
    // Get task-based opportunities
    const opportunities = typeof PMTwinData !== 'undefined' ?
      PMTwinData.CollaborationOpportunities.getAll().filter(o => 
        o.modelId === '1.1' && o.status === 'active'
      ).slice(0, 10) : [];
    
    // Get matches
    const matches = typeof PMTwinData !== 'undefined' ?
      PMTwinData.Matches.getByProvider(user.id).filter(m => m.score >= 50).sort((a, b) => b.score - a.score) : [];
    
    // Get endorsements
    const userProfile = typeof PMTwinData !== 'undefined' ? PMTwinData.Users.getById(user.id) : null;
    const endorsements = userProfile?.profile?.endorsements || [];
    
    let html = `
      <div class="content-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 class="section-title" style="margin: 0;">Task-Based Opportunities</h2>
          <a href="${basePath}opportunities/" class="btn btn-outline btn-sm">View All</a>
        </div>
        <div style="display: grid; gap: 1rem; max-height: 600px; overflow-y: auto;">
          ${opportunities.length > 0 ? opportunities.map(opportunity => {
            const match = matches.find(m => m.projectId === opportunity.projectId || m.opportunityId === opportunity.id);
            const matchScore = match ? match.score : null;
            const project = typeof PMTwinData !== 'undefined' ? PMTwinData.Projects.getById(opportunity.projectId) : null;
            
            return `
              <div class="card">
                <div class="card-body">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                      <h3 style="margin: 0 0 0.5rem 0; font-size: var(--font-size-lg); font-weight: 600;">${opportunity.title || 'Task Opportunity'}</h3>
                      ${project ? `<p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);"><i class="ph ph-buildings"></i> ${project.title}</p>` : ''}
                    </div>
                    ${matchScore !== null ? `
                      <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${matchScore >= 80 ? 'var(--color-success)' : matchScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'};">
                          ${Math.round(matchScore)}%
                        </div>
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Match Score</div>
                      </div>
                    ` : ''}
                  </div>
                  <p style="margin: 0 0 1rem 0; color: var(--text-secondary); line-height: 1.6; font-size: var(--font-size-sm);">
                    ${opportunity.description || 'No description available.'}
                  </p>
                  <div style="display: flex; gap: 0.75rem;">
                    <a href="${basePath}collaboration/view/?id=${opportunity.id}" class="btn btn-primary btn-sm" style="flex: 1; text-decoration: none; text-align: center;">View Details</a>
                    <a href="${basePath}collaboration/applications/?opportunityId=${opportunity.id}" class="btn btn-success btn-sm" style="flex: 1; text-decoration: none; text-align: center;">Apply Now</a>
                  </div>
                </div>
              </div>
            `;
          }).join('') : `
            <div class="card">
              <div class="card-body" style="text-align: center; padding: 3rem;">
                <i class="ph ph-sparkle" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">No task-based opportunities available.</p>
                <a href="${basePath}opportunities/" class="btn btn-primary">Browse All Opportunities</a>
              </div>
            </div>
          `}
        </div>
      </div>
      ${endorsements.length > 0 ? `
        <div class="content-section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 class="section-title" style="margin: 0;">Profile Endorsements</h2>
            <a href="${basePath}profile/" class="btn btn-outline btn-sm">View Full Profile</a>
          </div>
          <div class="card">
            <div class="card-body">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                <div style="font-size: 3rem; font-weight: 700; color: var(--color-primary);">${endorsements.length}</div>
                <div>
                  <div style="font-weight: 600; font-size: var(--font-size-lg);">Total Endorsements</div>
                  <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">From ${new Set(endorsements.map(e => e.endorserId)).size} different endorsers</div>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                ${endorsements.slice(0, 6).map(endorsement => {
                  const endorser = typeof PMTwinData !== 'undefined' ? PMTwinData.Users.getById(endorsement.endorserId) : null;
                  return `
                    <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);">
                      <div style="display: flex; align-items: start; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <div style="width: 40px; height: 40px; background: var(--color-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                          ${(endorser?.name || 'U')[0].toUpperCase()}
                        </div>
                        <div style="flex: 1;">
                          <div style="font-weight: 600; font-size: var(--font-size-sm);">${endorser?.name || 'Anonymous'}</div>
                          <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${endorsement.date ? new Date(endorsement.date).toLocaleDateString() : ''}</div>
                        </div>
                      </div>
                      ${endorsement.comment ? `<p style="font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.5; margin: 0;">"${endorsement.comment}"</p>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      ` : ''}
    `;
    
    return html;
  }

  // Export
  if (!window.dashboard) window.dashboard = {};
  window.dashboard.dashboard = { init };

})();


