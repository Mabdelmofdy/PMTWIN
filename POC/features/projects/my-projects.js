/**
 * My Projects Component
 * Displays projects, mega-projects, and service requests owned by the current company
 */

(function() {
  'use strict';

  const MyProjectsComponent = {
    currentTab: 'projects',
    data: null,

    async init() {
      await this.loadMyProjects();
    },

    async loadMyProjects() {
      const container = document.getElementById('projectsList');
      if (!container) return;

      try {
        container.innerHTML = '<p>Loading your projects...</p>';

        if (typeof MyProjectsService === 'undefined') {
          container.innerHTML = '<p class="alert alert-error">My Projects service not available</p>';
          return;
        }

        const result = await MyProjectsService.getMyProjects();
        if (!result.success) {
          container.innerHTML = `<p class="alert alert-error">${result.error}</p>`;
          return;
        }

        this.data = result.data;
        this.updateCounts();
        this.renderProjects();
        this.renderMegaProjects();
        this.renderServiceRequests();
      } catch (error) {
        console.error('Error loading my projects:', error);
        const container = document.getElementById('projectsList');
        if (container) {
          container.innerHTML = '<p class="alert alert-error">Error loading projects. Please try again.</p>';
        }
      }
    },

    updateCounts() {
      if (!this.data) return;

      const projectsCountEl = document.getElementById('projectsCount');
      const megaProjectsCountEl = document.getElementById('megaProjectsCount');
      const serviceRequestsCountEl = document.getElementById('serviceRequestsCount');

      if (projectsCountEl) {
        projectsCountEl.textContent = this.data.counts.projects.total;
      }
      if (megaProjectsCountEl) {
        megaProjectsCountEl.textContent = this.data.counts.megaProjects.total;
      }
      if (serviceRequestsCountEl) {
        serviceRequestsCountEl.textContent = this.data.counts.serviceRequests.total;
      }
    },

    showTab(tabName) {
      this.currentTab = tabName;

      // Update tab buttons
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');

      // Show/hide tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
      });

      const tabContent = document.getElementById(tabName + 'Tab');
      if (tabContent) {
        tabContent.style.display = 'block';
        tabContent.classList.add('active');
      }
    },

    renderProjects() {
      const container = document.getElementById('projectsList');
      if (!container || !this.data) return;

      const projects = this.data.projects;

      if (projects.length === 0) {
        container.innerHTML = `
          <div class="card">
            <div class="card-body" style="text-align: center; padding: 3rem;">
              <p style="color: var(--text-secondary); margin-bottom: 1rem;">You haven't created any projects yet.</p>
              <a href="../projects/create/" class="btn btn-primary">Create Your First Project</a>
            </div>
          </div>
        `;
        return;
      }

      let html = '<div style="display: grid; gap: 1.5rem;">';
      projects.forEach(project => {
        html += `
          <div class="card">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                  <h3 style="margin: 0 0 0.5rem 0;">${project.title || 'Untitled Project'}</h3>
                  <p style="color: var(--text-secondary); margin: 0;">${(project.description || '').substring(0, 200)}${project.description && project.description.length > 200 ? '...' : ''}</p>
                </div>
                <span class="badge badge-${project.status === 'active' ? 'success' : project.status === 'draft' ? 'warning' : 'secondary'}">${project.status || 'draft'}</span>
              </div>
              <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                <div><strong>Category:</strong> ${project.category || 'N/A'}</div>
                <div><strong>Budget:</strong> ${project.budget?.min ? project.budget.min.toLocaleString() : '0'} - ${project.budget?.max ? project.budget.max.toLocaleString() : '0'} ${project.budget?.currency || 'SAR'}</div>
                <div><strong>Created:</strong> ${new Date(project.createdAt).toLocaleDateString()}</div>
              </div>
              <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <a href="../projects/view/?id=${project.id}" class="btn btn-primary btn-sm">View Details</a>
                ${project.status === 'draft' ? `<a href="../projects/create/?id=${project.id}" class="btn btn-secondary btn-sm">Edit</a>` : ''}
              </div>
            </div>
          </div>
        `;
      });
      html += '</div>';

      container.innerHTML = html;
    },

    renderMegaProjects() {
      const container = document.getElementById('megaProjectsList');
      if (!container || !this.data) return;

      const megaProjects = this.data.megaProjects;

      if (megaProjects.length === 0) {
        container.innerHTML = `
          <div class="card">
            <div class="card-body" style="text-align: center; padding: 3rem;">
              <p style="color: var(--text-secondary); margin-bottom: 1rem;">You haven't created any mega-projects yet.</p>
              <a href="../projects/create/" class="btn btn-primary">Create Mega-Project</a>
            </div>
          </div>
        `;
        return;
      }

      let html = '<div style="display: grid; gap: 1.5rem;">';
      megaProjects.forEach(project => {
        const subProjectsCount = project.subProjects?.length || 0;
        html += `
          <div class="card">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                  <h3 style="margin: 0 0 0.5rem 0;">${project.title || 'Untitled Mega-Project'}</h3>
                  <p style="color: var(--text-secondary); margin: 0;">${(project.description || '').substring(0, 200)}${project.description && project.description.length > 200 ? '...' : ''}</p>
                </div>
                <span class="badge badge-${project.status === 'active' ? 'success' : project.status === 'draft' ? 'warning' : 'secondary'}">${project.status || 'draft'}</span>
              </div>
              <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                <div><strong>Category:</strong> ${project.category || 'N/A'}</div>
                <div><strong>Sub-Projects:</strong> ${subProjectsCount}</div>
                <div><strong>Budget:</strong> ${project.budget?.min ? project.budget.min.toLocaleString() : '0'} - ${project.budget?.max ? project.budget.max.toLocaleString() : '0'} ${project.budget?.currency || 'SAR'}</div>
                <div><strong>Created:</strong> ${new Date(project.createdAt).toLocaleDateString()}</div>
              </div>
              <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <a href="../projects/view/?id=${project.id}" class="btn btn-primary btn-sm">View Details</a>
                ${project.status === 'draft' ? `<a href="../projects/create/?id=${project.id}" class="btn btn-secondary btn-sm">Edit</a>` : ''}
              </div>
            </div>
          </div>
        `;
      });
      html += '</div>';

      container.innerHTML = html;
    },

    renderServiceRequests() {
      const container = document.getElementById('serviceRequestsList');
      if (!container || !this.data) return;

      const serviceRequests = this.data.serviceRequests;

      if (serviceRequests.length === 0) {
        container.innerHTML = `
          <div class="card">
            <div class="card-body" style="text-align: center; padding: 3rem;">
              <p style="color: var(--text-secondary); margin-bottom: 1rem;">You haven't created any service requests yet.</p>
              <a href="../service-requests/create/" class="btn btn-primary">Create Service Request</a>
            </div>
          </div>
        `;
        return;
      }

      let html = '<div style="display: grid; gap: 1.5rem;">';
      serviceRequests.forEach(request => {
        html += `
          <div class="card">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                  <h3 style="margin: 0 0 0.5rem 0;">${request.title || 'Untitled Service Request'}</h3>
                  <p style="color: var(--text-secondary); margin: 0;">${(request.description || '').substring(0, 200)}${request.description && request.description.length > 200 ? '...' : ''}</p>
                </div>
                <span class="badge badge-${request.status === 'OPEN' ? 'success' : request.status === 'APPROVED' ? 'info' : 'secondary'}">${request.status || 'OPEN'}</span>
              </div>
              <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                <div><strong>Type:</strong> ${request.requestType || 'NORMAL'}</div>
                <div><strong>Budget:</strong> ${request.budget?.min ? request.budget.min.toLocaleString() : '0'} - ${request.budget?.max ? request.budget.max.toLocaleString() : '0'} ${request.budget?.currency || 'SAR'}</div>
                <div><strong>Created:</strong> ${new Date(request.createdAt).toLocaleDateString()}</div>
              </div>
              <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <a href="../service-requests/view/?id=${request.id}" class="btn btn-primary btn-sm">View Details</a>
              </div>
            </div>
          </div>
        `;
      });
      html += '</div>';

      container.innerHTML = html;
    }
  };

  // Export
  window.myProjectsComponent = MyProjectsComponent;

})();
