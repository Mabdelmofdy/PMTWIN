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
  let currentFilters = {};

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

      const result = await AnalyticsService.getUserAnalytics(currentDateRange, currentFilters);
      
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
    const maxCount = Math.max(analytics.total, analytics.byType.individual, analytics.byType.entity, analytics.byType.consultant, analytics.byStatus.approved, analytics.byStatus.pending);
    
    let html = `
      <div class="card">
        <div class="card-body">
          <h2 class="section-title">User Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-primary);">${analytics.total}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Users</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-info);">${analytics.byType.individual}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Individuals</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-success);">${analytics.byType.entity}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Entities</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-warning);">${analytics.byStatus.pending}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Pending</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-success);">${analytics.byStatus.approved}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Approved</p>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            <div>
              <h3 style="margin-bottom: 1rem;">User Type Distribution</h3>
              ${renderBarChart({
                labels: ['Individual', 'Entity', 'Consultant', 'Admin'],
                values: [analytics.byType.individual, analytics.byType.entity, analytics.byType.consultant, analytics.byType.admin],
                colors: ['var(--color-info)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-primary)']
              })}
            </div>
            <div>
              <h3 style="margin-bottom: 1rem;">Status Distribution</h3>
              ${renderBarChart({
                labels: ['Approved', 'Pending', 'Rejected'],
                values: [analytics.byStatus.approved, analytics.byStatus.pending, analytics.byStatus.rejected || 0],
                colors: ['var(--color-success)', 'var(--color-warning)', 'var(--color-error)']
              })}
            </div>
          </div>
          
          ${analytics.registrationTrend && analytics.registrationTrend.length > 0 ? `
            <div style="margin-top: 2rem;">
              <h3 style="margin-bottom: 1rem;">Registration Trend</h3>
              ${renderLineChart(analytics.registrationTrend)}
            </div>
          ` : ''}
          
          ${analytics.geographicDistribution && Object.keys(analytics.geographicDistribution).length > 0 ? `
            <div style="margin-top: 2rem;">
              <h3 style="margin-bottom: 1rem;">Geographic Distribution</h3>
              ${renderPieChart(analytics.geographicDistribution)}
            </div>
          ` : ''}
          
          <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
            <p><strong>Profile Completion Rate:</strong> <span style="font-size: 1.5rem; color: var(--color-primary);">${(analytics.profileCompletionRate * 100).toFixed(1)}%</span></p>
            <div style="background: var(--bg-secondary); height: 12px; border-radius: var(--radius-full); overflow: hidden; margin-top: 0.5rem;">
              <div style="background: var(--color-primary); height: 100%; width: ${(analytics.profileCompletionRate * 100)}%; transition: width 0.3s ease;"></div>
            </div>
          </div>
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

      const result = await AnalyticsService.getProjectAnalytics(currentDateRange, currentFilters);
      
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
          <h2 class="section-title">Project Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-primary);">${analytics.total}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Projects</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-success);">${analytics.active}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Active</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-info);">${analytics.completed}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Completed</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-primary);">${formatCurrency(analytics.totalValue)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Value</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-info);">${(analytics.completionRate * 100).toFixed(1)}%</h3>
              <p style="margin: 0; color: var(--text-secondary);">Completion Rate</p>
            </div>
          </div>
          
          ${analytics.byCategory && Object.keys(analytics.byCategory).length > 0 ? `
            <div style="margin-bottom: 2rem;">
              <h3 style="margin-bottom: 1rem;">Projects by Category</h3>
              ${renderBarChart({
                labels: Object.keys(analytics.byCategory),
                values: Object.values(analytics.byCategory),
                colors: ['var(--color-primary)', 'var(--color-success)', 'var(--color-info)', 'var(--color-warning)']
              })}
            </div>
          ` : ''}
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            <div>
              <p><strong>Average Project Value:</strong> ${formatCurrency(analytics.averageValue)}</p>
            </div>
            ${analytics.averageDuration ? `
              <div>
                <p><strong>Average Duration:</strong> ${analytics.averageDuration.toFixed(1)} days</p>
              </div>
            ` : ''}
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

      const result = await AnalyticsService.getProposalAnalytics(currentDateRange, currentFilters);
      
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
          <h2 class="section-title">Proposal Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-primary);">${analytics.total}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Proposals</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-info);">${analytics.cash}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Cash</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-success);">${analytics.barter}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Barter</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-success);">${analytics.approved}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Approved</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-info);">${(analytics.approvalRate * 100).toFixed(1)}%</h3>
              <p style="margin: 0; color: var(--text-secondary);">Approval Rate</p>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            <div>
              <h3 style="margin-bottom: 1rem;">Proposal Type Distribution</h3>
              ${renderPieChart({
                'Cash': analytics.cash,
                'Barter': analytics.barter
              })}
            </div>
            <div>
              <h3 style="margin-bottom: 1rem;">Proposal Status</h3>
              ${renderBarChart({
                labels: ['Approved', 'Pending', 'Rejected'],
                values: [analytics.approved, analytics.pending || 0, analytics.rejected || 0],
                colors: ['var(--color-success)', 'var(--color-warning)', 'var(--color-error)']
              })}
            </div>
          </div>
          
          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div>
                <p><strong>Average Value:</strong> ${formatCurrency(analytics.averageValue)}</p>
              </div>
              <div>
                <p><strong>Total Value:</strong> ${formatCurrency(analytics.totalValue)}</p>
              </div>
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

      const result = await AnalyticsService.getCollaborationAnalytics(currentDateRange, currentFilters);
      
      if (result.success) {
        renderCollaborationAnalytics(container, result.analytics);
      }
    } catch (error) {
      console.error('Error loading collaboration analytics:', error);
    }
  }

  function renderCollaborationAnalytics(container, analytics) {
    const modelLabels = {
      '1.1': 'Task-Based',
      '1.2': 'Consortium',
      '1.3': 'Project JV',
      '1.4': 'SPV',
      '2.1': 'Strategic JV',
      '2.2': 'Strategic Alliance',
      '2.3': 'Co-Ownership',
      '3.1': 'Bulk Purchasing',
      '3.2': 'Resource Sharing',
      '3.3': 'Resource Pool',
      '4.1': 'Professional Hiring',
      '4.2': 'Consultant Hiring',
      '5.1': 'Competition/RFP'
    };
    
    let html = `
      <div class="card">
        <div class="card-body">
          <h2 class="section-title">Collaboration Models Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-primary);">${analytics.total}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Opportunities</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-info);">${analytics.totalApplications}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Applications</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-success);">${(analytics.successRate * 100).toFixed(1)}%</h3>
              <p style="margin: 0; color: var(--text-secondary);">Success Rate</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-primary);">${formatCurrency(analytics.totalValue)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Value</p>
            </div>
          </div>
          
          ${analytics.byModel && Object.keys(analytics.byModel).length > 0 ? `
            <div style="margin-bottom: 2rem;">
              <h3 style="margin-bottom: 1rem;">Opportunities by Model</h3>
              ${renderBarChart({
                labels: Object.keys(analytics.byModel).map(id => modelLabels[id] || id),
                values: Object.values(analytics.byModel),
                colors: Array(Object.keys(analytics.byModel).length).fill(null).map((_, i) => 
                  ['var(--color-primary)', 'var(--color-success)', 'var(--color-info)', 'var(--color-warning)', 'var(--color-error)'][i % 5]
                )
              })}
            </div>
          ` : ''}
          
          ${analytics.byStatus && Object.keys(analytics.byStatus).length > 0 ? `
            <div>
              <h3 style="margin-bottom: 1rem;">Status Distribution</h3>
              ${renderPieChart(analytics.byStatus)}
            </div>
          ` : ''}
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

      const result = await AnalyticsService.getMatchingAnalytics(currentDateRange, currentFilters);
      
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
          <h2 class="section-title">Matching Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-primary);">${analytics.total}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Matches</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-info);">${analytics.averageScore.toFixed(1)}%</h3>
              <p style="margin: 0; color: var(--text-secondary);">Average Score</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-success);">${(analytics.conversionRate * 100).toFixed(1)}%</h3>
              <p style="margin: 0; color: var(--text-secondary);">Conversion Rate</p>
            </div>
          </div>
          
          ${analytics.byCategory && Object.keys(analytics.byCategory).length > 0 ? `
            <div style="margin-bottom: 2rem;">
              <h3 style="margin-bottom: 1rem;">Matches by Category</h3>
              ${renderBarChart({
                labels: Object.keys(analytics.byCategory),
                values: Object.values(analytics.byCategory),
                colors: ['var(--color-primary)', 'var(--color-success)', 'var(--color-info)', 'var(--color-warning)']
              })}
            </div>
          ` : ''}
          
          ${analytics.performance ? `
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
              <h3 style="margin-bottom: 1rem;">Performance Metrics</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                  <p><strong>Accuracy:</strong> ${(analytics.performance.accuracy * 100).toFixed(1)}%</p>
                  <div style="background: var(--bg-secondary); height: 8px; border-radius: var(--radius-full); overflow: hidden; margin-top: 0.25rem;">
                    <div style="background: var(--color-success); height: 100%; width: ${(analytics.performance.accuracy * 100)}%;"></div>
                  </div>
                </div>
                <div>
                  <p><strong>Response Time:</strong> ${analytics.performance.responseTime.toFixed(1)}s</p>
                </div>
                <div>
                  <p><strong>User Satisfaction:</strong> ${(analytics.performance.userSatisfaction * 100).toFixed(1)}%</p>
                  <div style="background: var(--bg-secondary); height: 8px; border-radius: var(--radius-full); overflow: hidden; margin-top: 0.25rem;">
                    <div style="background: var(--color-primary); height: 100%; width: ${(analytics.performance.userSatisfaction * 100)}%;"></div>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
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

      const result = await AnalyticsService.getFinancialAnalytics(currentDateRange, currentFilters);
      
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
          <h2 class="section-title">Financial Analytics</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-primary);">${formatCurrency(analytics.platformVolume)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Platform Volume</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-success);">${formatCurrency(analytics.totalSavings)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Savings</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-info);">${formatCurrency(analytics.averageTransactionValue)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Avg Transaction</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-warning);">${formatCurrency(analytics.barterValue)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Barter Value</p>
            </div>
            <div class="card" style="text-align: center; padding: 1.5rem;">
              <h3 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--color-info);">${formatCurrency(analytics.cashTransactions)}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Cash Transactions</p>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            <div>
              <h3 style="margin-bottom: 1rem;">Transaction Type Distribution</h3>
              ${renderPieChart({
                'Cash': analytics.cashTransactions,
                'Barter': analytics.barterValue
              })}
            </div>
            <div>
              <h3 style="margin-bottom: 1rem;">Financial Overview</h3>
              ${renderBarChart({
                labels: ['Platform Volume', 'Total Savings', 'Avg Transaction'],
                values: [
                  analytics.platformVolume / 1000000, // Scale down for visualization
                  analytics.totalSavings / 1000000,
                  analytics.averageTransactionValue / 1000
                ],
                colors: ['var(--color-primary)', 'var(--color-success)', 'var(--color-info)']
              })}
              <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">* Values scaled for visualization</p>
            </div>
          </div>
          
          ${analytics.growthRate ? `
            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
              <p><strong>Growth Rate:</strong> <span style="font-size: 1.5rem; color: var(--color-success);">${(analytics.growthRate * 100).toFixed(1)}%</span></p>
              <div style="background: var(--bg-secondary); height: 12px; border-radius: var(--radius-full); overflow: hidden; margin-top: 0.5rem;">
                <div style="background: var(--color-success); height: 100%; width: ${Math.min(analytics.growthRate * 100, 100)}%; transition: width 0.3s ease;"></div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  async function applyDateRange(event) {
    event.preventDefault();
    
    const from = document.getElementById('dateFrom')?.value;
    const to = document.getElementById('dateTo')?.value;
    const category = document.getElementById('categoryFilter')?.value;
    const status = document.getElementById('statusFilter')?.value;
    const type = document.getElementById('typeFilter')?.value;
    const userType = document.getElementById('userTypeFilter')?.value;
    
    if (from) currentDateRange.from = from;
    if (to) currentDateRange.to = to;
    
    currentFilters = {};
    if (category) currentFilters.category = category;
    if (status) currentFilters.status = status;
    if (type) currentFilters.type = type;
    if (userType) currentFilters.userType = userType;
    
    await loadAnalytics();
  }

  function clearFilters() {
    currentFilters = {};
    const form = document.getElementById('analyticsDateForm');
    if (form) {
      form.reset();
      // Reset date range to default
      const dateTo = new Date();
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);
      document.getElementById('dateFrom').value = dateFrom.toISOString().split('T')[0];
      document.getElementById('dateTo').value = dateTo.toISOString().split('T')[0];
    }
    loadAnalytics();
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

  // ============================================
  // Chart Rendering Functions
  // ============================================

  function renderBarChart({ labels, values, colors }) {
    const maxValue = Math.max(...values, 1);
    let html = '<div style="display: grid; gap: 0.75rem;">';
    
    labels.forEach((label, index) => {
      const value = values[index] || 0;
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      const color = colors[index] || 'var(--color-primary)';
      
      html += `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
            <span style="font-weight: 500;">${label}</span>
            <span style="color: var(--text-secondary); font-weight: 600;">${value}</span>
          </div>
          <div style="background: var(--bg-secondary); height: 24px; border-radius: var(--radius-md); overflow: hidden; position: relative;">
            <div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 0.5s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 0.5rem;">
              ${percentage > 10 ? `<span style="color: white; font-size: 0.75rem; font-weight: 600;">${value}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  function renderLineChart(data) {
    if (!data || data.length === 0) return '<p style="color: var(--text-secondary);">No data available</p>';
    
    const maxValue = Math.max(...data.map(d => d.count || 0), 1);
    const chartHeight = 200;
    const chartWidth = 100;
    
    let html = `
      <div style="position: relative; height: ${chartHeight}px; background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1rem;">
        <svg width="100%" height="100%" style="overflow: visible;">
          <polyline
            points="${data.map((d, i) => {
              const x = (i / (data.length - 1 || 1)) * chartWidth;
              const y = chartHeight - ((d.count || 0) / maxValue) * chartHeight;
              return `${x}%,${y}px`;
            }).join(' ')}"
            fill="none"
            stroke="var(--color-primary)"
            stroke-width="3"
          />
          ${data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * chartWidth;
            const y = chartHeight - ((d.count || 0) / maxValue) * chartHeight;
            return `<circle cx="${x}%" cy="${y}px" r="4" fill="var(--color-primary)" />`;
          }).join('')}
        </svg>
        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
          ${data.map(d => `<span>${new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>`).join('')}
        </div>
      </div>
    `;
    
    return html;
  }

  function renderPieChart(data) {
    const entries = Object.entries(data);
    if (entries.length === 0) return '<p style="color: var(--text-secondary);">No data available</p>';
    
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    const colors = ['var(--color-primary)', 'var(--color-success)', 'var(--color-info)', 'var(--color-warning)', 'var(--color-error)', 'var(--color-secondary)'];
    
    let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start;">';
    
    // Pie chart visualization (simplified)
    html += '<div style="display: flex; align-items: center; justify-content: center;">';
    html += '<div style="width: 200px; height: 200px; border-radius: 50%; background: conic-gradient(';
    let currentAngle = 0;
    entries.forEach(([label, value], index) => {
      const percentage = (value / total) * 100;
      const angle = (percentage / 100) * 360;
      const color = colors[index % colors.length];
      html += `${color} ${currentAngle}deg ${currentAngle + angle}deg`;
      if (index < entries.length - 1) html += ', ';
      currentAngle += angle;
    });
    html += ');"></div></div>';
    
    // Legend
    html += '<div style="display: grid; gap: 0.5rem;">';
    entries.forEach(([label, value], index) => {
      const percentage = ((value / total) * 100).toFixed(1);
      const color = colors[index % colors.length];
      html += `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 16px; height: 16px; border-radius: 4px; background: ${color};"></div>
          <span style="flex: 1;">${label}</span>
          <span style="font-weight: 600; color: var(--text-secondary);">${value} (${percentage}%)</span>
        </div>
      `;
    });
    html += '</div>';
    
    html += '</div>';
    return html;
  }

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-analytics'] = { 
    init,
    exportAnalytics,
    clearFilters
  };

})();

