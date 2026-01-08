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
    
    // Load system health indicators
    loadSystemHealthIndicators();
    
    // Load quick actions
    loadQuickActions();
    
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
              <h2>Recent Activity Feed</h2>
              <p style="color: var(--text-secondary);">No recent activity.</p>
            </div>
          </div>
        `;
        return;
      }

      // Get action icons and colors
      function getActionIcon(action) {
        const actionLower = (action || '').toLowerCase();
        if (actionLower.includes('login') || actionLower.includes('logout')) return { icon: 'ph-sign-in', color: 'info' };
        if (actionLower.includes('create') || actionLower.includes('add')) return { icon: 'ph-plus-circle', color: 'success' };
        if (actionLower.includes('update') || actionLower.includes('edit')) return { icon: 'ph-pencil', color: 'warning' };
        if (actionLower.includes('delete') || actionLower.includes('remove')) return { icon: 'ph-trash', color: 'danger' };
        if (actionLower.includes('approve') || actionLower.includes('verify')) return { icon: 'ph-check-circle', color: 'success' };
        if (actionLower.includes('reject') || actionLower.includes('deny')) return { icon: 'ph-x-circle', color: 'danger' };
        if (actionLower.includes('view') || actionLower.includes('read')) return { icon: 'ph-eye', color: 'info' };
        return { icon: 'ph-circle', color: 'secondary' };
      }

      // Format relative time
      function getRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return time.toLocaleDateString();
      }

      let html = `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h2 style="margin: 0;">Recent Activity Feed</h2>
              <a href="../admin-audit/" class="btn btn-outline" style="font-size: 0.9rem;">View All</a>
            </div>
            <div style="display: grid; gap: 0.75rem;">
      `;

      logs.forEach((log, index) => {
        const actionInfo = getActionIcon(log.action);
        const relativeTime = getRelativeTime(log.timestamp);
        const isLast = index === logs.length - 1;

        html += `
          <div style="display: flex; gap: 1rem; padding: 1rem; ${!isLast ? 'border-bottom: 1px solid var(--border-color);' : ''} transition: background 0.2s;"
               onmouseover="this.style.background='var(--bg-secondary)';"
               onmouseout="this.style.background='';">
            <div style="flex-shrink: 0; width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--color-${actionInfo.color}-light); display: flex; align-items: center; justify-content: center;">
              <i class="${actionInfo.icon}" style="font-size: 1.25rem; color: var(--color-${actionInfo.color});"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.25rem;">
                <strong style="font-size: 0.95rem; color: var(--text-primary);">${log.action || 'Unknown Action'}</strong>
                <span style="color: var(--text-secondary); font-size: 0.85rem; white-space: nowrap; margin-left: 1rem;">${relativeTime}</span>
              </div>
              <p style="margin: 0 0 0.25rem 0; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.4;">
                ${log.description || 'No description available'}
              </p>
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                <i class="ph ph-user" style="font-size: 0.9rem;"></i>
                <span>${log.userName || log.userEmail || 'System'}</span>
                ${log.ipAddress ? `<span style="margin-left: 0.5rem;">•</span><span>${log.ipAddress}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      });

      html += `
            </div>
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
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
        '1': { name: 'Project-Based', subModels: ['1.1', '1.2', '1.3', '1.4'], icon: 'ph-folder', color: 'primary' },
        '2': { name: 'Strategic', subModels: ['2.1', '2.2', '2.3'], icon: 'ph-handshake', color: 'info' },
        '3': { name: 'Resource Pooling', subModels: ['3.1', '3.2', '3.3'], icon: 'ph-stack', color: 'secondary' },
        '4': { name: 'Hiring', subModels: ['4.1', '4.2'], icon: 'ph-user-plus', color: 'success' },
        '5': { name: 'Competition', subModels: ['5.1'], icon: 'ph-trophy', color: 'warning' }
      };

      // Calculate totals and status breakdown
      const totalOpportunities = opportunities.length;
      const activeOpportunities = opportunities.filter(o => o.status === 'active').length;
      const pendingOpportunities = opportunities.filter(o => o.status === 'pending').length;

      let html = `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h2 style="margin: 0;">Collaboration Models Activity</h2>
              <div style="display: flex; gap: 1rem; font-size: 0.9rem;">
                <span style="color: var(--text-secondary);">Total: <strong>${totalOpportunities}</strong></span>
                <span style="color: var(--color-success);">Active: <strong>${activeOpportunities}</strong></span>
                <span style="color: var(--color-warning);">Pending: <strong>${pendingOpportunities}</strong></span>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
      `;

      Object.entries(modelCategories).forEach(([categoryId, category]) => {
        const categoryOpportunities = opportunities.filter(o => category.subModels.includes(o.modelId));
        const categoryTotal = categoryOpportunities.length;
        const categoryActive = categoryOpportunities.filter(o => o.status === 'active').length;
        const categoryPending = categoryOpportunities.filter(o => o.status === 'pending').length;
        const percentage = totalOpportunities > 0 ? (categoryTotal / totalOpportunities) * 100 : 0;

        html += `
          <div class="card" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" 
               onclick="window.location.href='models-management/?category=${categoryId}'"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';"
               onmouseout="this.style.transform=''; this.style.boxShadow='';">
            <div class="card-body" style="padding: 1.5rem;">
              <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                <i class="${category.icon}" style="font-size: 2rem; color: var(--color-${category.color}); margin-right: 0.75rem;"></i>
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 0.25rem 0; font-size: 1.1rem;">${category.name}</h3>
                  <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${categoryTotal} total</p>
                </div>
              </div>
              <div style="background: var(--bg-secondary); height: 6px; border-radius: var(--radius-full); overflow: hidden; margin-bottom: 0.5rem;">
                <div style="background: var(--color-${category.color}); height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="color: var(--color-success);">
                  <i class="ph ph-check-circle" style="font-size: 0.9rem;"></i> ${categoryActive} active
                </span>
                ${categoryPending > 0 ? `<span style="color: var(--color-warning);">
                  <i class="ph ph-clock" style="font-size: 0.9rem;"></i> ${categoryPending} pending
                </span>` : ''}
              </div>
            </div>
          </div>
        `;
      });

      html += `
            </div>
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
              <a href="models-management/" class="btn btn-primary">Manage All Models</a>
              <a href="models-management/?status=active" class="btn btn-outline">View Active</a>
              <a href="models-management/?status=pending" class="btn btn-outline">View Pending</a>
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
      const pendingProposals = PMTwinData.Proposals.getAll().filter(p => p.status === 'in_review' || p.status === 'pending');

      if (pendingUsers.length === 0 && pendingOpportunities.length === 0 && pendingProposals.length === 0) {
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
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
            <div>
              <h3 style="margin: 0 0 0.25rem 0; font-size: 1.1rem;">Users Pending Review</h3>
              <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${pendingUsers.length} user(s) awaiting vetting</p>
            </div>
            <a href="../admin-vetting/" class="btn btn-warning">Review Users</a>
          </div>
        `;
      }

      if (pendingOpportunities.length > 0) {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
            <div>
              <h3 style="margin: 0 0 0.25rem 0; font-size: 1.1rem;">Collaboration Opportunities</h3>
              <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${pendingOpportunities.length} opportunity/ies pending approval</p>
            </div>
            <a href="models-management/?status=pending" class="btn btn-warning">Review Opportunities</a>
          </div>
        `;
      }

      if (pendingProposals.length > 0) {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
            <div>
              <h3 style="margin: 0 0 0.25rem 0; font-size: 1.1rem;">Service Proposals</h3>
              <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${pendingProposals.length} proposal(s) under review</p>
            </div>
            <a href="../admin-moderation/" class="btn btn-warning">Review Proposals</a>
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

  function loadSystemHealthIndicators() {
    const container = document.getElementById('systemHealthIndicators');
    if (!container || typeof PMTwinData === 'undefined') return;

    try {
      const users = PMTwinData.Users.getAll();
      const projects = PMTwinData.Projects.getAll();
      const proposals = PMTwinData.Proposals.getAll();
      const opportunities = PMTwinData.CollaborationOpportunities.getAll();
      const sessions = PMTwinData.Sessions.getAll();
      const notifications = PMTwinData.Notifications.getAll();

      // Calculate health metrics
      const activeUsers = users.filter(u => u.onboardingStage === 'approved' && u.status !== 'suspended').length;
      const activeSessions = sessions.filter(s => {
        const expiresAt = new Date(s.expiresAt);
        return expiresAt > new Date();
      }).length;
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const activeCollaborations = opportunities.filter(o => o.status === 'active').length;
      const unreadNotifications = notifications.filter(n => !n.read).length;

      // Calculate health status (percentage-based)
      const userHealth = users.length > 0 ? (activeUsers / users.length) * 100 : 100;
      const sessionHealth = activeSessions > 0 ? Math.min((activeSessions / users.length) * 100, 100) : 0;
      const projectHealth = projects.length > 0 ? (activeProjects / projects.length) * 100 : 100;
      const collaborationHealth = opportunities.length > 0 ? (activeCollaborations / opportunities.length) * 100 : 0;

      // Determine status color and icon
      function getHealthStatus(percentage) {
        if (percentage >= 80) return { status: 'healthy', color: 'success', icon: 'ph-check-circle' };
        if (percentage >= 50) return { status: 'warning', color: 'warning', icon: 'ph-warning' };
        return { status: 'critical', color: 'danger', icon: 'ph-x-circle' };
      }

      const userStatus = getHealthStatus(userHealth);
      const sessionStatus = getHealthStatus(sessionHealth);
      const projectStatus = getHealthStatus(projectHealth);
      const collaborationStatus = getHealthStatus(collaborationHealth);

      let html = `
        <div class="card">
          <div class="card-body">
            <h2 style="margin-bottom: 1.5rem;">System Health Indicators</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
      `;

      // User Health
      html += `
        <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 4px solid var(--color-${userStatus.color});">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div>
              <h3 style="margin: 0 0 0.25rem 0; font-size: 1rem; color: var(--text-secondary);">User Health</h3>
              <p style="margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--color-${userStatus.color});">${userHealth.toFixed(1)}%</p>
            </div>
            <i class="${userStatus.icon}" style="font-size: 2rem; color: var(--color-${userStatus.color});"></i>
          </div>
          <div style="background: var(--bg-primary); height: 8px; border-radius: var(--radius-full); overflow: hidden;">
            <div style="background: var(--color-${userStatus.color}); height: 100%; width: ${userHealth}%; transition: width 0.3s ease;"></div>
          </div>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">${activeUsers} active / ${users.length} total users</p>
        </div>
      `;

      // Session Health
      html += `
        <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 4px solid var(--color-${sessionStatus.color});">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div>
              <h3 style="margin: 0 0 0.25rem 0; font-size: 1rem; color: var(--text-secondary);">Active Sessions</h3>
              <p style="margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--color-${sessionStatus.color});">${activeSessions}</p>
            </div>
            <i class="ph ph-users-three" style="font-size: 2rem; color: var(--color-${sessionStatus.color});"></i>
          </div>
          <div style="background: var(--bg-primary); height: 8px; border-radius: var(--radius-full); overflow: hidden;">
            <div style="background: var(--color-${sessionStatus.color}); height: 100%; width: ${sessionHealth}%; transition: width 0.3s ease;"></div>
          </div>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">Currently active user sessions</p>
        </div>
      `;

      // Project Health
      html += `
        <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 4px solid var(--color-${projectStatus.color});">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div>
              <h3 style="margin: 0 0 0.25rem 0; font-size: 1rem; color: var(--text-secondary);">Project Health</h3>
              <p style="margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--color-${projectStatus.color});">${projectHealth.toFixed(1)}%</p>
            </div>
            <i class="${projectStatus.icon}" style="font-size: 2rem; color: var(--color-${projectStatus.color});"></i>
          </div>
          <div style="background: var(--bg-primary); height: 8px; border-radius: var(--radius-full); overflow: hidden;">
            <div style="background: var(--color-${projectStatus.color}); height: 100%; width: ${projectHealth}%; transition: width 0.3s ease;"></div>
          </div>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">${activeProjects} active / ${projects.length} total projects</p>
        </div>
      `;

      // Collaboration Health
      html += `
        <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 4px solid var(--color-${collaborationStatus.color});">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div>
              <h3 style="margin: 0 0 0.25rem 0; font-size: 1rem; color: var(--text-secondary);">Collaboration Health</h3>
              <p style="margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--color-${collaborationStatus.color});">${collaborationHealth.toFixed(1)}%</p>
            </div>
            <i class="${collaborationStatus.icon}" style="font-size: 2rem; color: var(--color-${collaborationStatus.color});"></i>
          </div>
          <div style="background: var(--bg-primary); height: 8px; border-radius: var(--radius-full); overflow: hidden;">
            <div style="background: var(--color-${collaborationStatus.color}); height: 100%; width: ${collaborationHealth}%; transition: width 0.3s ease;"></div>
          </div>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">${activeCollaborations} active / ${opportunities.length} total opportunities</p>
        </div>
      `;

      // System Activity
      const recentLogs = PMTwinData.Audit.getRecent(5);
      const activityLevel = recentLogs.length >= 5 ? 'high' : recentLogs.length >= 2 ? 'medium' : 'low';
      const activityColor = activityLevel === 'high' ? 'success' : activityLevel === 'medium' ? 'warning' : 'info';

      html += `
        <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 4px solid var(--color-${activityColor});">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div>
              <h3 style="margin: 0 0 0.25rem 0; font-size: 1rem; color: var(--text-secondary);">System Activity</h3>
              <p style="margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--color-${activityColor});">${activityLevel.toUpperCase()}</p>
            </div>
            <i class="ph ph-activity" style="font-size: 2rem; color: var(--color-${activityColor});"></i>
          </div>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${recentLogs.length} recent activities in last hour</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">${unreadNotifications} unread notifications</p>
        </div>
      `;

      html += `
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading system health indicators:', error);
      container.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h2>System Health Indicators</h2>
            <p>Unable to load system health data.</p>
          </div>
        </div>
      `;
    }
  }

  function loadQuickActions() {
    const container = document.getElementById('quickActionsContainer');
    if (!container || typeof PMTwinData === 'undefined') return;

    try {
      const pendingUsers = PMTwinData.Users.getAll().filter(u => 
        u.onboardingStage === 'under_review' || u.profile?.status === 'pending'
      ).length;
      const pendingOpportunities = PMTwinData.CollaborationOpportunities.getAll().filter(o => o.status === 'pending').length;
      const pendingProposals = PMTwinData.Proposals.getAll().filter(p => p.status === 'in_review' || p.status === 'pending').length;

      const quickActions = [
        {
          title: 'User Vetting',
          icon: 'ph-check-circle',
          href: '../admin-vetting/',
          badge: pendingUsers > 0 ? pendingUsers : null,
          color: 'primary'
        },
        {
          title: 'Project Moderation',
          icon: 'ph-shield-check',
          href: '../admin-moderation/',
          badge: pendingProposals > 0 ? pendingProposals : null,
          color: 'primary'
        },
        {
          title: 'Models Management',
          icon: 'ph-handshake',
          href: 'models-management/',
          badge: pendingOpportunities > 0 ? pendingOpportunities : null,
          color: 'primary'
        },
        {
          title: 'Audit Trail',
          icon: 'ph-clipboard',
          href: '../admin-audit/',
          badge: null,
          color: 'primary'
        },
        {
          title: 'Reports',
          icon: 'ph-chart-bar',
          href: '../admin-reports/',
          badge: null,
          color: 'primary'
        },
        {
          title: 'Analytics',
          icon: 'ph-chart-line',
          href: '../analytics/',
          badge: null,
          color: 'primary'
        },
        {
          title: 'Settings',
          icon: 'ph-gear',
          href: '../settings/',
          badge: null,
          color: 'primary'
        },
        {
          title: 'User Management',
          icon: 'ph-users',
          href: '../users-management/',
          badge: null,
          color: 'primary'
        }
      ];

      let html = `
        <h2 class="section-title">Quick Actions</h2>
        <div class="content-grid-4">
      `;

      quickActions.forEach(action => {
        html += `
          <a href="${action.href}" class="card action-card" style="text-decoration: none; display: block; position: relative;">
            ${action.badge ? `<span style="position: absolute; top: 0.5rem; right: 0.5rem; background: var(--color-warning); color: white; border-radius: 50%; width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600;">${action.badge}</span>` : ''}
            <div class="card-body" style="text-align: center; padding: var(--spacing-6);">
              <i class="${action.icon}" style="font-size: 2.5rem; color: var(--color-${action.color}); margin-bottom: var(--spacing-3);"></i>
              <h3 style="margin: 0;">${action.title}</h3>
            </div>
          </a>
        `;
      });

      html += `
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading quick actions:', error);
    }
  }

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-dashboard'] = {
    init,
    loadDashboardData
  };

})();

