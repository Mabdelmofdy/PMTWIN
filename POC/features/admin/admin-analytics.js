/**
 * Admin Analytics Component
 * Handles analytics dashboard UI for admin portal
 */

(function() {
  'use strict';

  let currentDateRange = {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0] // Today
  };

  function init(params) {
    loadAnalytics();
    setupEventListeners();
  }

  function setupEventListeners() {
    // Date range form
    const dateForm = document.getElementById('analyticsDateForm');
    if (dateForm) {
      dateForm.addEventListener('submit', applyDateRange);
    }

    // Export buttons
    const exportButtons = document.querySelectorAll('[data-export]');
    exportButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const type = this.getAttribute('data-export');
        exportAnalytics(type);
      });
    });
  }

  async function loadAnalytics() {
    await Promise.all([
      loadUserAnalytics(),
      loadProjectAnalytics(),
      loadProposalAnalytics(),
      loadCollaborationAnalytics(),
      loadMatchingAnalytics(),
      loadFinancialAnalytics()
    ]);
  }

  async function loadUserAnalytics() {
    const container = document.getElementById('userAnalytics');
    if (!container) return;

    try {
      if (typeof AnalyticsService === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Analytics service not available</p>';
        return;
      }

      const result = await AnalyticsService.getUserAnalytics(currentDateRange);
      
      if (result.success) {
        renderUserAnalytics(container, result.analytics);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load user analytics'}</p>`;
      }
    } catch (error) {
      console.error('Error loading user analytics:', error);
    }
  }

  function renderUserAnalytics(container, analytics) {
    let html = `
      <div class="card">
        <div class="card-body">
          <h2>User Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-primary);">${analytics.total}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Users</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-info);">${analytics.byType.individual}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Individuals</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-success);">${analytics.byType.entity}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Entities</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-warning);">${analytics.byStatus.pending}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Pending</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-success);">${analytics.byStatus.approved}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Approved</p>
            </div>
          </div>
          <p><strong>Profile Completion Rate:</strong> ${(analytics.profileCompletionRate * 100).toFixed(1)}%</p>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  async function loadProjectAnalytics() {
    const container = document.getElementById('projectAnalytics');
    if (!container) return;

    try {
      if (typeof AnalyticsService === 'undefined') {
        return;
      }

      const result = await AnalyticsService.getProjectAnalytics(currentDateRange);
      
      if (result.success) {
        renderProjectAnalytics(container, result.analytics);
      }
    } catch (error) {
      console.error('Error loading project analytics:', error);
    }
  }

  function renderProjectAnalytics(container, analytics) {
    let html = `
      <div class="card">
        <div class="card-body">
          <h2>Project Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-primary);">${analytics.total}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Projects</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-success);">${analytics.active}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Active</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-info);">${analytics.completed}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Completed</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-primary);">${formatCurrency(analytics.totalValue)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Value</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-info);">${(analytics.completionRate * 100).toFixed(1)}%</h3>
              <p style="margin: 0; color: var(--text-secondary);">Completion Rate</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  async function loadProposalAnalytics() {
    const container = document.getElementById('proposalAnalytics');
    if (!container) return;

    try {
      if (typeof AnalyticsService === 'undefined') {
        return;
      }

      const result = await AnalyticsService.getProposalAnalytics(currentDateRange);
      
      if (result.success) {
        renderProposalAnalytics(container, result.analytics);
      }
    } catch (error) {
      console.error('Error loading proposal analytics:', error);
    }
  }

  function renderProposalAnalytics(container, analytics) {
    let html = `
      <div class="card">
        <div class="card-body">
          <h2>Proposal Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-primary);">${analytics.total}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Proposals</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-info);">${analytics.cash}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Cash</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-success);">${analytics.barter}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Barter</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-success);">${analytics.approved}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Approved</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-info);">${(analytics.approvalRate * 100).toFixed(1)}%</h3>
              <p style="margin: 0; color: var(--text-secondary);">Approval Rate</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  async function loadCollaborationAnalytics() {
    const container = document.getElementById('collaborationAnalytics');
    if (!container) return;

    try {
      if (typeof AnalyticsService === 'undefined') {
        return;
      }

      const result = await AnalyticsService.getCollaborationAnalytics(currentDateRange);
      
      if (result.success) {
        renderCollaborationAnalytics(container, result.analytics);
      }
    } catch (error) {
      console.error('Error loading collaboration analytics:', error);
    }
  }

  function renderCollaborationAnalytics(container, analytics) {
    let html = `
      <div class="card">
        <div class="card-body">
          <h2>Collaboration Models Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-primary);">${analytics.total}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Opportunities</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-info);">${analytics.totalApplications}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Applications</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-success);">${(analytics.successRate * 100).toFixed(1)}%</h3>
              <p style="margin: 0; color: var(--text-secondary);">Success Rate</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-primary);">${formatCurrency(analytics.totalValue)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Value</p>
            </div>
          </div>
          <div>
            <h3>By Model:</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem;">
    `;

    Object.entries(analytics.byModel).forEach(([modelId, count]) => {
      html += `
        <div style="text-align: center; padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
          <strong>${modelId}</strong>
          <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary);">${count}</p>
        </div>
      `;
    });

    html += `
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  async function loadMatchingAnalytics() {
    const container = document.getElementById('matchingAnalytics');
    if (!container) return;

    try {
      if (typeof AnalyticsService === 'undefined') {
        return;
      }

      const result = await AnalyticsService.getMatchingAnalytics(currentDateRange);
      
      if (result.success) {
        renderMatchingAnalytics(container, result.analytics);
      }
    } catch (error) {
      console.error('Error loading matching analytics:', error);
    }
  }

  function renderMatchingAnalytics(container, analytics) {
    let html = `
      <div class="card">
        <div class="card-body">
          <h2>Matching Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-primary);">${analytics.total}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Matches</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-info);">${analytics.averageScore.toFixed(1)}%</h3>
              <p style="margin: 0; color: var(--text-secondary);">Average Score</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-success);">${(analytics.conversionRate * 100).toFixed(1)}%</h3>
              <p style="margin: 0; color: var(--text-secondary);">Conversion Rate</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  async function loadFinancialAnalytics() {
    const container = document.getElementById('financialAnalytics');
    if (!container) return;

    try {
      if (typeof AnalyticsService === 'undefined') {
        return;
      }

      const result = await AnalyticsService.getFinancialAnalytics(currentDateRange);
      
      if (result.success) {
        renderFinancialAnalytics(container, result.analytics);
      }
    } catch (error) {
      console.error('Error loading financial analytics:', error);
    }
  }

  function renderFinancialAnalytics(container, analytics) {
    let html = `
      <div class="card">
        <div class="card-body">
          <h2>Financial Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-primary);">${formatCurrency(analytics.platformVolume)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Platform Volume</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-success);">${formatCurrency(analytics.totalSavings)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Savings</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-info);">${formatCurrency(analytics.averageTransactionValue)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Avg Transaction</p>
            </div>
            <div style="text-align: center;">
              <h3 style="font-size: 2rem; margin: 0; color: var(--color-warning);">${formatCurrency(analytics.barterValue)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Barter Value</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  async function applyDateRange(event) {
    event.preventDefault();
    
    const from = document.getElementById('dateFrom')?.value;
    const to = document.getElementById('dateTo')?.value;
    
    if (from) currentDateRange.from = from;
    if (to) currentDateRange.to = to;
    
    await loadAnalytics();
  }

  async function exportAnalytics(type) {
    try {
      if (typeof AnalyticsService === 'undefined') {
        alert('Analytics service not available');
        return;
      }

      let data = {};
      
      // Load all analytics data
      const [userResult, projectResult, proposalResult, collabResult, matchingResult, financialResult] = await Promise.all([
        AnalyticsService.getUserAnalytics(currentDateRange),
        AnalyticsService.getProjectAnalytics(currentDateRange),
        AnalyticsService.getProposalAnalytics(currentDateRange),
        AnalyticsService.getCollaborationAnalytics(currentDateRange),
        AnalyticsService.getMatchingAnalytics(currentDateRange),
        AnalyticsService.getFinancialAnalytics(currentDateRange)
      ]);

      if (userResult.success) data.users = userResult.analytics;
      if (projectResult.success) data.projects = projectResult.analytics;
      if (proposalResult.success) data.proposals = proposalResult.analytics;
      if (collabResult.success) data.collaborations = collabResult.analytics;
      if (matchingResult.success) data.matching = matchingResult.analytics;
      if (financialResult.success) data.financial = financialResult.analytics;

      const result = await AnalyticsService.exportAnalytics(data, type);
      
      if (result.success) {
        if (type === 'csv') {
          // Download CSV
          const blob = new Blob([result.data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          // Download JSON
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      } else {
        alert(result.error || 'Failed to export analytics');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      alert('Error exporting analytics');
    }
  }

  function formatCurrency(amount) {
    if (!amount) return '0 SAR';
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
  }

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-analytics'] = { init };

})();

