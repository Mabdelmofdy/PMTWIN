/**
 * Service Requests Feature
 * Handles service request listing and management
 */

(function() {
  'use strict';

  const ServiceRequests = {
    async init() {
      await this.loadRequests();
    },

    async loadRequests() {
      const contentEl = document.getElementById('serviceRequestsContent');
      if (!contentEl) return;

      let requests = [];
      const currentUser = PMTwinData?.Sessions?.getCurrentUser();
      
      if (currentUser) {
        const userRole = currentUser.role;
        
        if (userRole === 'skill_service_provider') {
          // Service Providers see available requests
          if (typeof ServiceRequestService !== 'undefined') {
            requests = ServiceRequestService.getAvailableServiceRequests();
          }
        } else if (['entity', 'beneficiary', 'vendor'].includes(userRole)) {
          // Entities/Vendors see their own requests
          if (typeof ServiceRequestService !== 'undefined') {
            requests = ServiceRequestService.getMyServiceRequests();
          }
        }
      }

      this.renderRequests(requests);
    },

    renderRequests(requests) {
      const contentEl = document.getElementById('serviceRequestsContent');
      if (!contentEl) return;

      if (requests.length === 0) {
        contentEl.innerHTML = '<div class="alert alert-info">No service requests found.</div>';
        return;
      }

      const requestsHtml = requests.map(request => {
        const statusClass = {
          'OPEN': 'status-open',
          'OFFERED': 'status-offered',
          'APPROVED': 'status-approved',
          'IN_PROGRESS': 'status-progress',
          'COMPLETED': 'status-completed',
          'CANCELLED': 'status-cancelled'
        }[request.status] || '';

        return `
          <div class="card">
            <div class="card-header">
              <h3>${request.title}</h3>
              <span class="status-badge ${statusClass}">${request.status}</span>
            </div>
            <div class="card-body">
              <p>${request.description}</p>
              <div class="request-details">
                <div><strong>Required Skills:</strong> ${(request.requiredSkills || []).join(', ')}</div>
                <div><strong>Budget:</strong> ${request.budget?.min || 0} - ${request.budget?.max || 0} ${request.budget?.currency || 'SAR'}</div>
                <div><strong>Created:</strong> ${new Date(request.createdAt).toLocaleDateString()}</div>
              </div>
              <div class="card-actions">
                <a href="view/?id=${request.id}" class="btn btn-primary">View Details</a>
              </div>
            </div>
          </div>
        `;
      }).join('');

      contentEl.innerHTML = requestsHtml;
    }
  };

  window.ServiceRequests = ServiceRequests;

})();

