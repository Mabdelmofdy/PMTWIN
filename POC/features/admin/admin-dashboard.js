/**
 * Admin Dashboard Component
 */

(function() {
  'use strict';

  function init(params) {
    loadDashboardData();
  }

  async function loadDashboardData() {
    // Load stats
    loadStats();
    
    // Load recent activity
    loadRecentActivity();
  }

  function loadStats() {
    const container = document.getElementById('adminStats');
    if (!container || typeof PMTwinData === 'undefined') return;

    try {
      const users = PMTwinData.Users.getAll();
      const projects = PMTwinData.Projects.getAll();
      const proposals = PMTwinData.Proposals.getAll();
      const pendingUsers = PMTwinData.Users.getByStatus('pending');

      const stats = [
        { label: 'Total Users', value: users.length, color: 'primary' },
        { label: 'Pending Vetting', value: pendingUsers.length, color: 'warning' },
        { label: 'Total Projects', value: projects.length, color: 'info' },
        { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, color: 'success' },
        { label: 'Total Proposals', value: proposals.length, color: 'secondary' }
      ];

      let html = '';
      stats.forEach(stat => {
        html += `
          <div class="card">
            <div class="card-body" style="text-align: center;">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 2.5rem; color: var(--${stat.color});">${stat.value}</h3>
              <p style="margin: 0; color: var(--text-secondary);">${stat.label}</p>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  function loadRecentActivity() {
    const container = document.getElementById('adminRecentActivity');
    if (!container || typeof PMTwinData === 'undefined') return;

    try {
      const logs = PMTwinData.Audit.getRecent(10);

      if (logs.length === 0) {
        container.innerHTML = `
          <div class="card">
            <div class="card-body">
              <h2>Recent Activity</h2>
              <p>No recent activity.</p>
            </div>
          </div>
        `;
        return;
      }

      let html = `
        <div class="card">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;">Recent Activity</h2>
            <div style="display: grid; gap: 1rem;">
      `;

      logs.forEach(log => {
        html += `
          <div style="padding: 1rem; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <strong>${log.action || 'Unknown Action'}</strong>
                <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary);">
                  ${log.description || 'No description'}
                </p>
                <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary);">
                  By: ${log.userName || log.userEmail || 'System'}
                </p>
              </div>
              <span style="color: var(--text-secondary); font-size: 0.9rem; white-space: nowrap;">
                ${new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        `;
      });

      html += `
            </div>
            <div style="margin-top: 1rem;">
              <a href="#admin-audit" class="btn btn-primary">View Full Audit Trail</a>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  }

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-dashboard'] = {
    init,
    loadDashboardData
  };

})();

