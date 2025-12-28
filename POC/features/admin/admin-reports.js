/**
 * Admin Reports Component
 */

(function() {
  'use strict';

  function init(params) {
    // Reports are generated on demand
  }

  function generateUserReport() {
    if (typeof PMTwinData === 'undefined') {
      alert('Data service not available');
      return;
    }

    const users = PMTwinData.Users.getAll();
    const report = {
      totalUsers: users.length,
      byRole: {},
      byStatus: {},
      byUserType: {},
      recentRegistrations: users
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(u => ({
          email: u.email,
          role: u.role,
          userType: u.userType,
          status: u.profile?.status,
          createdAt: u.createdAt
        }))
    };

    users.forEach(user => {
      report.byRole[user.role] = (report.byRole[user.role] || 0) + 1;
      report.byStatus[user.profile?.status || 'unknown'] = (report.byStatus[user.profile?.status || 'unknown'] || 0) + 1;
      report.byUserType[user.userType || 'unknown'] = (report.byUserType[user.userType || 'unknown'] || 0) + 1;
    });

    displayReport('User Registration Report', report);
    exportReport('user_report', report);
  }

  function generateProjectReport() {
    if (typeof PMTwinData === 'undefined') {
      alert('Data service not available');
      return;
    }

    const projects = PMTwinData.Projects.getAll();
    const report = {
      totalProjects: projects.length,
      byStatus: {},
      byCategory: {},
      totalValue: 0,
      activeProjects: projects.filter(p => p.status === 'active').length
    };

    projects.forEach(project => {
      report.byStatus[project.status || 'unknown'] = (report.byStatus[project.status || 'unknown'] || 0) + 1;
      report.byCategory[project.category || 'unknown'] = (report.byCategory[project.category || 'unknown'] || 0) + 1;
      if (project.budget?.max) {
        report.totalValue += project.budget.max;
      }
    });

    displayReport('Project Activity Report', report);
    exportReport('project_report', report);
  }

  function generateProposalReport() {
    if (typeof PMTwinData === 'undefined') {
      alert('Data service not available');
      return;
    }

    const proposals = PMTwinData.Proposals.getAll();
    const report = {
      totalProposals: proposals.length,
      byStatus: {},
      byType: {},
      totalValue: 0,
      cashProposals: 0,
      barterProposals: 0
    };

    proposals.forEach(proposal => {
      report.byStatus[proposal.status || 'unknown'] = (report.byStatus[proposal.status || 'unknown'] || 0) + 1;
      report.byType[proposal.type || 'unknown'] = (report.byType[proposal.type || 'unknown'] || 0) + 1;
      if (proposal.type === 'cash') {
        report.cashProposals++;
        if (proposal.total) report.totalValue += proposal.total;
      } else {
        report.barterProposals++;
      }
    });

    displayReport('Proposal Statistics Report', report);
    exportReport('proposal_report', report);
  }

  function generateFinancialReport() {
    if (typeof PMTwinData === 'undefined') {
      alert('Data service not available');
      return;
    }

    const proposals = PMTwinData.Proposals.getAll();
    const projects = PMTwinData.Projects.getAll();
    
    const report = {
      totalProjectValue: projects.reduce((sum, p) => sum + (p.budget?.max || 0), 0),
      totalProposalValue: proposals.filter(p => p.type === 'cash').reduce((sum, p) => sum + (p.total || 0), 0),
      approvedProposals: proposals.filter(p => p.status === 'approved').length,
      barterTransactions: proposals.filter(p => p.type === 'barter').length,
      averageProposalValue: 0
    };

    const cashProposals = proposals.filter(p => p.type === 'cash' && p.total);
    if (cashProposals.length > 0) {
      report.averageProposalValue = report.totalProposalValue / cashProposals.length;
    }

    displayReport('Financial Summary Report', report);
    exportReport('financial_report', report);
  }

  function displayReport(title, data) {
    const container = document.getElementById('reportOutput');
    if (!container) return;

    let html = `
      <div class="card">
        <div class="card-body">
          <h2 style="margin-bottom: 1rem;">${title}</h2>
          <pre style="background: var(--bg-secondary); padding: 1rem; border-radius: 4px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
          <button onclick="adminReportsComponent.exportReport('${title.toLowerCase().replace(/\s+/g, '_')}', ${JSON.stringify(data).replace(/"/g, '&quot;')})" class="btn btn-primary" style="margin-top: 1rem;">
            Export as JSON
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function exportReport(filename, data) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-reports'] = {
    init,
    generateUserReport,
    generateProjectReport,
    generateProposalReport,
    generateFinancialReport,
    displayReport,
    exportReport
  };

  // Global reference for onclick handlers
  window.adminReportsComponent = window.admin['admin-reports'];

})();

