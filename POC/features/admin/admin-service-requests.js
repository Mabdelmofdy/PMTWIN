/**
 * Admin Service Requests Feature
 * Admin view for managing service requests
 */

(function() {
  'use strict';

  // ============================================
  // Get Base Path Helper
  // ============================================
  function getBasePath() {
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC');
    const pagesIndex = segments.indexOf('pages');
    
    if (pagesIndex >= 0) {
      const depth = segments.length - pagesIndex - 1;
      return depth > 0 ? '../'.repeat(depth) : '';
    }
    
    const depth = segments.length - 1;
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  const AdminServiceRequests = {
    async init() {
      await this.loadRequests();
    },

    async loadRequests() {
      const contentEl = document.getElementById('adminServiceRequestsContent');
      if (!contentEl) return;

      let requests = [];
      if (typeof PMTwinData !== 'undefined' && PMTwinData.ServiceRequests) {
        requests = PMTwinData.ServiceRequests.getAll();
      }

      // Get requester info and offers count for each request
      const requestsWithDetails = requests.map(request => {
        const requester = PMTwinData?.Users?.getById?.(request.requesterId);
        const offers = PMTwinData?.ServiceOffers?.getByServiceRequest?.(request.id) || [];
        return {
          ...request,
          requester: requester,
          offersCount: offers.length
        };
      });

      this.renderRequests(requestsWithDetails);
    },

    renderRequests(requests) {
      const contentEl = document.getElementById('adminServiceRequestsContent');
      if (!contentEl) return;

      if (requests.length === 0) {
        contentEl.innerHTML = '<div class="alert alert-info">No service requests found.</div>';
        return;
      }

      const stats = {
        total: requests.length,
        open: requests.filter(r => r.status === 'OPEN').length,
        offered: requests.filter(r => r.status === 'OFFERED').length,
        approved: requests.filter(r => r.status === 'APPROVED').length,
        inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
        completed: requests.filter(r => r.status === 'COMPLETED').length,
        cancelled: requests.filter(r => r.status === 'CANCELLED').length
      };

      const requestsHtml = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total Requests</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.open}</div>
            <div class="stat-label">Open</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.offered}</div>
            <div class="stat-label">Offered</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.approved}</div>
            <div class="stat-label">Approved</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.inProgress}</div>
            <div class="stat-label">In Progress</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.completed}</div>
            <div class="stat-label">Completed</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h2>All Service Requests</h2>
          </div>
          <div class="card-body">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Requester</th>
                  <th>Status</th>
                  <th>Offers</th>
                  <th>Budget</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${requests.map(request => {
                  const requesterName = request.requester?.profile?.name || request.requester?.email || 'N/A';
                  const statusClass = {
                    'OPEN': 'status-open',
                    'OFFERED': 'status-offered',
                    'APPROVED': 'status-approved',
                    'IN_PROGRESS': 'status-progress',
                    'COMPLETED': 'status-completed',
                    'CANCELLED': 'status-cancelled'
                  }[request.status] || '';
                  return `
                    <tr>
                      <td>${request.title}</td>
                      <td>${requesterName}</td>
                      <td><span class="status-badge ${statusClass}">${request.status}</span></td>
                      <td>${request.offersCount}</td>
                      <td>${request.budget?.min || 0} - ${request.budget?.max || 0} ${request.budget?.currency || 'SAR'}</td>
                      <td>${new Date(request.createdAt).toLocaleDateString()}</td>
                      <td>
                        <a href="${getBasePath()}service-requests/view/?id=${request.id}" class="btn btn-sm btn-primary">View</a>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      contentEl.innerHTML = requestsHtml;
    }
  };

  window.AdminServiceRequests = AdminServiceRequests;

})();

