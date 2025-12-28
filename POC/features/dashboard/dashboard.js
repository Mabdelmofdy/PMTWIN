/**
 * Dashboard Component
 */

(function() {
  'use strict';

  async function init(params) {
    try {
      // Get dashboard data
      let dashboardData = null;
      
      if (typeof DashboardService !== 'undefined') {
        const result = await DashboardService.getDashboardData();
        if (result.success) {
          dashboardData = result.data;
        }
      }

      // Render dashboard
      const container = document.getElementById('dashboardContent');
      if (!container) return;

      if (dashboardData) {
        renderDashboard(container, dashboardData);
      } else {
        // Fallback rendering
        container.innerHTML = '<p>Loading dashboard...</p>';
        // Try to load using Renderer if available
        if (typeof Renderer !== 'undefined' && Renderer.renderUserDashboard) {
          Renderer.renderUserDashboard();
        }
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
    const user = data.user;
    const stats = data.stats || {};
    const recentActivity = data.recentActivity || [];
    const notifications = data.notifications || [];

    let html = `
      <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
    `;

    // Stats cards
    Object.keys(stats).forEach(key => {
      html += `
        <div class="card">
          <div class="card-body">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem;">${stats[key]}</h3>
            <p style="margin: 0; color: var(--text-secondary); text-transform: capitalize;">${key.replace(/([A-Z])/g, ' $1').trim()}</p>
          </div>
        </div>
      `;
    });

    html += `</div>`;

    // Recent Activity
    if (recentActivity.length > 0) {
      html += `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;">Recent Activity</h2>
            <ul style="list-style: none; padding: 0;">
      `;
      
      recentActivity.slice(0, 10).forEach(activity => {
        html += `
          <li style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <strong>${activity.type || 'Activity'}:</strong> ${activity.title || 'N/A'}
            <span style="color: var(--text-secondary); font-size: 0.9rem; float: right;">
              ${activity.date ? new Date(activity.date).toLocaleDateString() : ''}
            </span>
          </li>
        `;
      });
      
      html += `</ul></div></div>`;
    }

    // Notifications
    if (notifications.length > 0) {
      html += `
        <div class="card">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;">Notifications</h2>
            <ul style="list-style: none; padding: 0;">
      `;
      
      notifications.slice(0, 5).forEach(notification => {
        html += `
          <li style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <strong>${notification.title || 'Notification'}</strong>
            <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary);">${notification.message || ''}</p>
          </li>
        `;
      });
      
      html += `</ul></div></div>`;
    }

    container.innerHTML = html;
  }

  // Export
  if (!window.dashboard) window.dashboard = {};
  window.dashboard.dashboard = { init };

})();


