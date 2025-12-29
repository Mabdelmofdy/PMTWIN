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
    
    // Load collaboration models activity
    loadCollaborationModelsActivity();
    
    // Load recent activity
    loadRecentActivity();
    
    // Load pending approvals queue
    loadPendingApprovals();
  }

  function loadStats() {
    const container = document.getElementById('adminStats');
    if (!container || typeof PMTwinData === 'undefined') return;

    try {
      const users = PMTwinData.Users.getAll();
      const projects = PMTwinData.Projects.getAll();
      const proposals = PMTwinData.Proposals.getAll();
      const pendingUsers = PMTwinData.Users.getByStatus('pending');

      const opportunities = PMTwinData.CollaborationOpportunities.getAll();
      const pendingOpportunities = opportunities.filter(o => o.status === 'pending');
      const activeCollaborations = opportunities.filter(o => o.status === 'active').length;

      const stats = [
        { label: 'Total Users', value: users.length, color: 'primary' },
        { label: 'Pending Vetting', value: pendingUsers.length, color: 'warning' },
        { label: 'Total Projects', value: projects.length, color: 'info' },
        { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, color: 'success' },
        { label: 'Total Proposals', value: proposals.length, color: 'secondary' },
        { label: 'Collaboration Opportunities', value: opportunities.length, color: 'info' },
        { label: 'Pending Collaborations', value: pendingOpportunities.length, color: 'warning' },
        { label: 'Active Collaborations', value: activeCollaborations, color: 'success' }
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
              <a href="../admin-audit/" class="btn btn-primary">View Full Audit Trail</a>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  }

  function loadCollaborationModelsActivity() {
    const container = document.getElementById('collaborationModelsActivity');
    if (!container || typeof PMTwinData === 'undefined') return;

    try {
      const opportunities = PMTwinData.CollaborationOpportunities.getAll();
      const stats = PMTwinData.CollaborationOpportunities.getStatistics();

      const modelCategories = {
        '1': { name: 'Project-Based', subModels: ['1.1', '1.2', '1.3', '1.4'] },
        '2': { name: 'Strategic', subModels: ['2.1', '2.2', '2.3'] },
        '3': { name: 'Resource Pooling', subModels: ['3.1', '3.2', '3.3'] },
        '4': { name: 'Hiring', subModels: ['4.1', '4.2'] },
        '5': { name: 'Competition', subModels: ['5.1'] }
      };

      let html = `
        <div class="card">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;">Collaboration Models Activity</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
      `;

      Object.entries(modelCategories).forEach(([categoryId, category]) => {
        const categoryTotal = category.subModels.reduce((sum, modelId) => {
          return sum + (stats.byModel[modelId] || 0);
        }, 0);

        html += `
          <div class="card" style="cursor: pointer;" onclick="window.location.href='../models-management/?category=${categoryId}'">
            <div class="card-body" style="text-align: center;">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; color: var(--color-primary);">${categoryTotal}</h3>
              <p style="margin: 0; color: var(--text-secondary);">${category.name}</p>
            </div>
          </div>
        `;
      });

      html += `
            </div>
            <div style="margin-top: 1rem;">
              <a href="../models-management/" class="btn btn-primary">Manage All Models</a>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading collaboration models activity:', error);
    }
  }

  function loadPendingApprovals() {
    const container = document.getElementById('pendingApprovalsQueue');
    if (!container || typeof PMTwinData === 'undefined') return;

    try {
      const pendingUsers = PMTwinData.Users.getAll().filter(u => 
        u.onboardingStage === 'under_review' || u.profile?.status === 'pending'
      );
      const pendingOpportunities = PMTwinData.CollaborationOpportunities.getAll().filter(o => o.status === 'pending');

      if (pendingUsers.length === 0 && pendingOpportunities.length === 0) {
        container.innerHTML = `
          <div class="card">
            <div class="card-body">
              <h2>Pending Approvals</h2>
              <p>No pending approvals.</p>
            </div>
          </div>
        `;
        return;
      }

      let html = `
        <div class="card">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;">Pending Approvals Queue</h2>
            <div style="display: grid; gap: 1rem;">
      `;

      if (pendingUsers.length > 0) {
        html += `
          <div>
            <h3 style="margin-bottom: 0.5rem;">Users (${pendingUsers.length})</h3>
            <a href="../admin-vetting/" class="btn btn-warning">Review Users</a>
          </div>
        `;
      }

      if (pendingOpportunities.length > 0) {
        html += `
          <div>
            <h3 style="margin-bottom: 0.5rem;">Collaboration Opportunities (${pendingOpportunities.length})</h3>
            <a href="../models-management/?status=pending" class="btn btn-warning">Review Opportunities</a>
          </div>
        `;
      }

      html += `
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    }
  }

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-dashboard'] = {
    init,
    loadDashboardData
  };

})();

