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
        const result = await DashboardService.getDashboardData();
        if (result.success) {
          dashboardData = result.data;
        }
      }

      // Also try to get dashboardData from window if available
      if (!dashboardData && typeof window.dashboardData !== 'undefined') {
        dashboardData = {
          user: PMTwinData?.Sessions?.getCurrentUser() || {},
          stats: window.dashboardData.userDashboard || {},
          recentActivity: window.dashboardData.recentActivities || [],
          notifications: []
        };
      }

      if (dashboardData) {
        renderDashboard(container, dashboardData);
      } else {
        // Fallback: render empty dashboard with message
        container.innerHTML = `
          <div class="card">
            <div class="card-body">
              <h2>Welcome to PMTwin Dashboard</h2>
              <p>Your dashboard is being set up. Start by creating a project or browsing opportunities.</p>
              <div style="margin-top: 2rem;">
                <a href="../create-project/" class="btn btn-primary" style="margin-right: 1rem;">Create Project</a>
                <a href="../opportunities/" class="btn btn-outline">Browse Opportunities</a>
              </div>
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
    const stats = data.stats || {};
    const recentActivity = data.recentActivity || [];
    const notifications = data.notifications || [];

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

    let html = `
      <div style="margin-bottom: 2rem;">
        <h2 style="margin: 0 0 0.5rem 0;">Welcome back, ${user.name || user.email || 'User'}!</h2>
        <p style="color: var(--text-secondary); margin: 0;">Here's what's happening with your projects</p>
      </div>
      
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

    // Two column layout for activity and notifications
    html += `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
    `;

    // Recent Activity
    html += `
      <div class="card">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h2 style="margin: 0;">Recent Activity</h2>
            <a href="../pipeline/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">View All →</a>
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
            <a href="../notifications/" style="font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none;">View All →</a>
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

    container.innerHTML = html;
  }

  // Export
  if (!window.dashboard) window.dashboard = {};
  window.dashboard.dashboard = { init };

})();


